import {assertBlocked,sessionAs} from '../lib/auditDatabase.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
process.env.S33D_KEEP_TEST_DB='1';
const {db,id,as}=await import('./grove.mjs');
await db.exec('RESET ROLE; ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;');
await db.exec(readFileSync('supabase/migrations/20261121152000_founding_grove_entitlements.sql','utf8'));
const backer=id(100),wrong=id(101);
await as(null,'service_role');
const token=(await db.query('SELECT issue_founding_grove_invitation($1,$2,$3) AS token',['fictional-backer-001','backer@example.invalid','2027-01-31'])).rows[0].token;
await as(null,'anon');await assert.rejects(()=>db.query('SELECT activate_founding_grove($1)',[token]));
await db.exec(`RESET ROLE; INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${backer}','backer@example.invalid',now()),('${wrong}','wrong@example.invalid',now());`);
await as(wrong);await assert.rejects(()=>db.query('SELECT activate_founding_grove($1)',[token]));
await as(backer);await assert.rejects(()=>db.query('SELECT activate_founding_grove($1)',[token])); // not before Dec 21
// Fictional fixture only: simulate an open invitation without accepting client time.
await db.exec('RESET ROLE; UPDATE founding_grove_invitations SET not_before=now()-interval \'1 day\';');
await as(backer);
const first=(await db.query('SELECT * FROM activate_founding_grove($1)',[token])).rows[0];
const again=(await db.query('SELECT * FROM activate_founding_grove($1)',[token])).rows[0];
assert.equal(first.id,again.id);assert.equal(+new Date(first.ends_at),+new Date(again.ends_at));
assert.equal(new Date(first.ends_at).getUTCFullYear(),new Date(first.activated_at).getUTCFullYear()+1);
const g=first.life_grove_id,m=id(200);const url=`https://fixture.invalid/storage/v1/object/public/offerings-private/${backer}/${g}/photo.png`;
await db.query('INSERT INTO life_grove_offerings(id,life_grove_id,contributor_user_id,contributor_name,offering_type,body_text,visibility,media_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[m,g,backer,'Fictional backer','photo','Our fictional first memory','private',url]);
const exported=(await db.query('SELECT * FROM export_life_grove_memories($1)',[g])).rows;
assert.equal(exported.length,1);assert.equal(exported[0].body_text,'Our fictional first memory');
writeFileSync('/tmp/s33d-fictional-memories.json',JSON.stringify(exported));
const {transformSync}=await import('esbuild');
const source=transformSync(readFileSync('src/lib/life-groves/exportArchive.ts','utf8'),{loader:'ts',format:'esm'}).code;
const {buildGroveArchive}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const photo=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64'));
writeFileSync('/tmp/s33d-fictional-backer-export.tar',await buildGroveArchive(exported,async memoryId=>{assert.equal(memoryId,m);return photo;}));
await as(wrong);await assert.rejects(()=>db.query('SELECT * FROM export_life_grove_memories($1)',[g]));
await db.exec('RESET ROLE; UPDATE founding_grove_invitations SET revoked_at=now(),expires_at=now()-interval \'1 day\';');
await as(backer);assert.equal((await db.query('SELECT * FROM activate_founding_grove($1)',[token])).rows[0].id,first.id);
assert.equal((await db.query('SELECT * FROM founding_grove_entitlements')).rows.length,1);
if(db.connectSession){
 await as(null,'service_role');const raceToken=(await db.query('SELECT issue_founding_grove_invitation($1,$2,$3) AS token',['fictional-race-backer','wrong@example.invalid','2027-01-31'])).rows[0].token;
 await db.exec("RESET ROLE; UPDATE founding_grove_invitations SET not_before=now()-interval '1 day' WHERE backer_reference='fictional-race-backer'");
 const a=await sessionAs(db,wrong),b=await sessionAs(db,wrong),inspector=await db.connectSession();const pid=(await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
 try{
  await a.exec('BEGIN');const first=(await a.query('SELECT * FROM activate_founding_grove($1)',[raceToken])).rows[0];
  const pending=b.query('SELECT * FROM activate_founding_grove($1)',[raceToken]);await assertBlocked(inspector,pid);await a.exec('COMMIT');const second=(await pending).rows[0];
  assert.equal(first.id,second.id);assert.equal(first.life_grove_id,second.life_grove_id);assert.equal(+new Date(first.ends_at),+new Date(second.ends_at));
  assert.equal(Number((await inspector.query('SELECT count(*) AS count FROM founding_grove_entitlements WHERE invitation_id=$1',[first.invitation_id])).rows[0].count),1);
  console.log('PASS PostgreSQL concurrent first activation: same entitlement, same Grove, same end date');
 }finally{await a.close();await b.close();await inspector.close();}
}
console.log('PASS fictional invitation -> confirmed account -> idempotent activation -> private photo memory -> permitted export; wrong account denied; old Grove preserved');
await db.close();
