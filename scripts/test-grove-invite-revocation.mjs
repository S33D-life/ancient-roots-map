/**
 * Run against a fresh, synthetic loopback PostgreSQL cluster.
 * npm install --prefix /tmp/grove-test-tools embedded-postgres@18.6.0-beta.19
 * node scripts/test-grove-invite-revocation.mjs /tmp/grove-test-tools
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

if (!process.argv[2]) throw new Error('Supply the temporary npm tools prefix');
const requireTool = createRequire(resolve(process.argv[2], 'package.json'));
const { default: EmbeddedPostgres } = await import(pathToFileURL(requireTool.resolve('embedded-postgres')));
const dir = await mkdtemp(join(tmpdir(), 'grove-revocation-'));
const postgres = new EmbeddedPostgres({
  databaseDir: join(dir, 'db'), user: 'postgres', password: 'synthetic-only',
  port: 55487, persistent: false, postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
});
const clients = [];
let started = false;
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const [grove, member, owner, offering] = [1, 2, 3, 4].map(id);
const rpc = (client, token = 'synthetic') =>
  client.query('SELECT public.join_life_grove_with_token($1) AS grove', [token]);
const denied = result => assert.match(result?.message ?? '', /This invitation could not bloom/);
const outcome = promise => promise.then(() => null, error => error);

try {
  await postgres.initialise();
  await postgres.start();
  started = true;
  for (let i = 0; i < 3; i++) {
    const client = postgres.getPgClient();
    await client.connect();
    clients.push(client);
    await client.query("SET statement_timeout = '8s'");
  }
  const [admin, redeemer, second] = clients;
  await admin.query(`
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE ROLE anon;
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('synthetic.uid', true), '')::uuid $$;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
      $$ SELECT string_to_array($1, '/') $$;
    CREATE TABLE life_groves(id uuid PRIMARY KEY, created_by uuid, privacy text, invite_token text UNIQUE);
    CREATE TABLE life_grove_members(life_grove_id uuid, user_id uuid, joined_via text, revoked_at timestamptz,
      PRIMARY KEY(life_grove_id, user_id));
    CREATE TABLE life_grove_offerings(id uuid PRIMARY KEY, life_grove_id uuid, contributor_user_id uuid,
      hidden_at timestamptz, visibility text);
    CREATE TABLE storage.objects(bucket_id text, name text);
    CREATE FUNCTION public.is_grove_steward(grove uuid, usr uuid) RETURNS boolean LANGUAGE sql STABLE AS
      $$ SELECT EXISTS(SELECT 1 FROM life_groves WHERE id=grove AND created_by=usr) $$;
  `);
  const baseline = await readFile(new URL('../supabase/migrations/20260915082615_56a0f5e3-d5ba-4646-be0b-e020eb54ebf0.sql', import.meta.url), 'utf8');
  for (const name of ['is_grove_contributor', 'can_view_life_grove', 'join_life_grove_with_token']) {
    const definition = baseline.match(new RegExp('CREATE OR REPLACE FUNCTION public\\.' + name + '\\([\\s\\S]*?\\$\\$;'));
    assert.ok(definition, name);
    await admin.query(definition[0]);
  }
  await admin.query(await readFile(new URL('../drizzle/migrations/0003_private_offering_media_audience_boundary.sql', import.meta.url), 'utf8'));
  const signature = 'public.join_life_grove_with_token(text)';
  await admin.query('REVOKE ALL ON FUNCTION ' + signature + ' FROM PUBLIC');
  await admin.query('GRANT EXECUTE ON FUNCTION ' + signature + ' TO authenticated');
  const acl = async () => (await admin.query('SELECT proacl FROM pg_proc WHERE oid=$1::regprocedure', [signature])).rows;
  const baselineAcl = await acl();
  await admin.query("INSERT INTO life_groves VALUES ($1,$2,'private_family','synthetic')", [grove, owner]);
  await admin.query("INSERT INTO life_grove_offerings VALUES ($1,$2,$3,NULL,'family_only')", [offering, grove, owner]);
  const membership = async () => (await admin.query('SELECT * FROM life_grove_members')).rows;
  const media = async () => (await admin.query('SELECT can_view_life_grove_offering($1,$2) AS allowed', [offering, member])).rows[0].allowed;
  for (const client of [redeemer, second]) {
    await client.query('SET ROLE authenticated');
    await client.query("SELECT set_config('synthetic.uid',$1,false)", [member]);
  }
  const revoke = () => admin.query("UPDATE life_grove_members SET revoked_at='2026-01-01Z' WHERE life_grove_id=$1 AND user_id=$2", [grove, member]);
  const waitForBlock = async (waiting, holding) => {
    // Use the third connection to observe actual lock contention.
    const observer = clients.find(client => client !== waiting && client !== holding);
    for (let i = 0; i < 100; i++) {
      const { rows } = await observer.query('SELECT $1::int = ANY(pg_blocking_pids($2)) AS blocked',
        [holding.processID, waiting.processID]);
      if (rows[0].blocked) return;
      await delay(20);
    }
    throw new Error('Expected a blocked transaction');
  };

  await rpc(redeemer);
  await revoke();
  assert.equal(await media(), false);
  await rpc(redeemer);
  assert.equal(await media(), true);
  console.log('PASS baseline reproduces revoked-member replay and restored media audience');

  await admin.query(await readFile(new URL('../supabase/migrations/20261109115345_deny_revoked_grove_invite_replay.sql', import.meta.url), 'utf8'));
  assert.deepEqual(await acl(), baselineAcl);
  await second.query("SELECT set_config('synthetic.uid','',false)");
  await assert.rejects(rpc(second), /Sign in to accept this invitation/);
  await second.query("SELECT set_config('synthetic.uid',$1,false)", [member]);
  denied(await outcome(rpc(second, 'unknown')));
  console.log('PASS candidate preserves grants and denies absent caller or invalid token');
  await revoke();
  const tombstone = await membership();
  denied(await outcome(rpc(redeemer)));
  assert.deepEqual(await membership(), tombstone);
  assert.equal(await media(), false);
  console.log('PASS candidate denies replay, preserves tombstone and keeps media audience denied');

  await admin.query('DELETE FROM life_grove_members');
  await admin.query('BEGIN');
  await admin.query("UPDATE life_groves SET invite_token='rotated'");
  const rotationRace = outcome(rpc(redeemer));
  await waitForBlock(redeemer, admin);
  await admin.query('COMMIT');
  denied(await rotationRace);
  assert.equal((await membership()).length, 0);
  console.log('PASS rotation committed first invalidates concurrent old-token redemption');

  await redeemer.query('BEGIN');
  await rpc(redeemer, 'rotated');
  const firstJoinRace = rpc(second, 'rotated');
  await waitForBlock(second, redeemer);
  await redeemer.query('COMMIT');
  assert.equal((await firstJoinRace).rows[0].grove, grove);
  assert.equal((await membership()).length, 1);
  console.log('PASS concurrent first joins produce a single active row');

  await admin.query('BEGIN');
  await revoke();
  const revokeFirst = outcome(rpc(redeemer, 'rotated'));
  await waitForBlock(redeemer, admin);
  await admin.query('COMMIT');
  denied(await revokeFirst);
  assert.equal(await media(), false);
  console.log('PASS revocation committed first denies blocked redemption');

  await admin.query('UPDATE life_grove_members SET revoked_at=NULL');
  await redeemer.query('BEGIN');
  await rpc(redeemer, 'rotated');
  const redeemFirst = revoke();
  await waitForBlock(admin, redeemer);
  await redeemer.query('COMMIT');
  await redeemFirst;
  assert.ok((await membership())[0].revoked_at);
  denied(await outcome(rpc(redeemer, 'rotated')));
  assert.equal(await media(), false);
  console.log('PASS redemption committed first cannot undo later revocation');
} finally {
  await Promise.allSettled(clients.map(client => client.end()));
  if (started) await postgres.stop();
  await rm(dir, { recursive: true, force: true });
}
