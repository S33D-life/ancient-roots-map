// Actual PostgreSQL RLS/function tests, entirely in-memory. No network/database URL.
// npm install --prefix /tmp/s33d-db-harness @electric-sql/pglite@0.3.14
// S33D_PGLITE=/tmp/s33d-db-harness/node_modules/@electric-sql/pglite/dist/index.js node scripts/audit-tests/grove.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.S33D_PGLITE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE TABLE auth.users(id uuid,email text); CREATE TABLE public.profiles(id uuid,full_name text,avatar_url text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
GRANT SELECT ON storage.objects TO authenticated;
`);
const migrations = readdirSync('supabase/migrations');
for (const prefix of ['20260511181830','20260915082615']) await db.exec(readFileSync('supabase/migrations/'+migrations.find(f=>f.startsWith(prefix)),'utf8'));
await db.exec(readFileSync('supabase/migrations/20261121150000_grove_audience_and_invites.sql','utf8'));
await db.exec(`CREATE POLICY "Fictional old broad memory read" ON life_grove_offerings FOR SELECT TO authenticated USING(true); CREATE POLICY "Fictional old broad photo read" ON storage.objects FOR SELECT TO authenticated USING(true);`);
await db.exec('GRANT SELECT,INSERT,UPDATE,DELETE ON public.life_groves,public.life_grove_offerings TO authenticated; GRANT SELECT ON public.life_groves,public.life_grove_offerings TO anon;');
const id = n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [owner,author,member,steward,removed,grove,only,family,unknown]=[1,2,3,4,5,10,20,21,22].map(id);
const path=`${author}/${grove}/photo.jpg`; const media=`https://fixture.invalid/storage/v1/object/public/offerings-private/${path}`;
await db.exec(`INSERT INTO life_groves(id,created_by,grove_title) VALUES('${grove}','${owner}','Fictional Grove');
INSERT INTO life_grove_members(life_grove_id,user_id,revoked_at) VALUES('${grove}','${author}',NULL),('${grove}','${member}',NULL),('${grove}','${removed}',now());
INSERT INTO life_grove_stewards(life_grove_id,user_id) VALUES('${grove}','${steward}');
INSERT INTO life_grove_offerings(id,life_grove_id,contributor_user_id,contributor_name,body_text,visibility,media_url) VALUES
('${only}','${grove}','${author}','Fictional author','Only me text','private','${media}'),
('${family}','${grove}','${author}','Fictional author','Family text','family_only',NULL);
INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('offerings-private','${path}','${author}');
`);
await db.exec(`ALTER TABLE life_grove_offerings DISABLE TRIGGER grove_memory_guard;
INSERT INTO life_grove_offerings(id,life_grove_id,contributor_user_id,contributor_name,body_text,visibility) VALUES('${unknown}','${grove}','${author}','Fictional author','Legacy unknown audience','ambiguous_legacy');
ALTER TABLE life_grove_offerings ENABLE TRIGGER grove_memory_guard;`);
let checks=0;
async function as(user,role='authenticated') { await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${user||''}',false),set_config('request.jwt.claim.role','${role}',false); SET ROLE ${role}`); }
for(const [user,expectedOnly,expectedFamily] of [[author,true,true],[member,false,true],[steward,false,true],[owner,false,true],[removed,false,false],[null,false,false]]) {
 await as(user,user?'authenticated':'anon');
 for(const [memory,want] of [[only,expectedOnly],[family,expectedFamily],[unknown,expectedOnly]]) {
  const {rows}=await db.query(`SELECT id FROM life_grove_offerings WHERE id=$1`,[memory]); assert.equal(rows.length,want?1:0); checks++;
 }
 if(user){ const {rows}=await db.query('SELECT name FROM storage.objects'); assert.equal(rows.length,expectedOnly?1:0); checks++; }
}
await as(null,'anon'); await assert.rejects(()=>db.query('SELECT * FROM get_life_grove_by_invite_token($1)',['bad'])); checks++;
await as(owner); let t=(await db.query('SELECT manage_grove_invitation($1,true) AS t',[grove])).rows[0].t;
await as(removed); await assert.rejects(()=>db.query('SELECT join_life_grove_with_token($1)',[t])); checks++;
await as(member); assert.equal((await db.query('SELECT join_life_grove_with_token($1) AS g',[t])).rows[0].g,grove); checks++;
await as(owner); await db.query('SELECT manage_grove_invitation($1,false)',[grove]);
await as(member); await assert.rejects(()=>db.query('SELECT join_life_grove_with_token($1)',[t])); checks++;
await as(owner); await db.query('SELECT set_grove_member_access($1,$2,true)',[grove,removed]);
await as(removed); assert.equal((await db.query('SELECT * FROM list_my_life_groves()')).rows.length,1); checks++;
await as(author); await assert.rejects(()=>db.query('UPDATE life_grove_offerings SET visibility=$1 WHERE id=$2',['public',only])); checks++;
await as(null,'service_role'); assert.equal((await db.query('SELECT private_grove_media_path($1,$2) AS p',[only,author])).rows[0].p,path); checks++;
assert.equal((await db.query('SELECT private_grove_media_path($1,$2) AS p',[only,member])).rows[0].p,null); checks++;
console.log(`PASS ${checks} actual PostgreSQL audience/invitation/media assertions (fictional records only)`);
await db.close();
