import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import {fixtureDatabase,assertBlocked,sessionAs} from '../lib/auditDatabase.mjs';
const db=await fixtureDatabase();
await db.exec(`DO $fixture$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $fixture$; DO $fixture$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $fixture$; DO $fixture$ BEGIN CREATE ROLE service_role BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $fixture$;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE public.agent_profiles(id uuid PRIMARY KEY); ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE TABLE public.offerings(id uuid PRIMARY KEY,created_at timestamptz DEFAULT now());
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
`);
const names=readdirSync('supabase/migrations');
for(const prefix of ['20260226215805','20260917061021','20260301194400','20260301200835']) await db.exec(readFileSync('supabase/migrations/'+names.find(n=>n.startsWith(prefix)),'utf8'));
await db.exec('GRANT SELECT,INSERT,UPDATE ON agent_tokens,agent_profiles,influence_votes,influence_vote_budgets TO authenticated; CREATE POLICY "read profiles" ON agent_profiles FOR SELECT USING(true);');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [u,other,agent,offering]=[1,2,3,4].map(id);
await db.exec(`INSERT INTO auth.users VALUES('${u}'),('${other}'); INSERT INTO agent_profiles(id,owner_user_id) VALUES('${agent}','${u}'); INSERT INTO offerings(id) VALUES('${offering}'); INSERT INTO agent_tokens(user_id,agent_id,label,token_hash,scopes) VALUES('${u}','${agent}','old unsafe','fakehash',ARRAY['admin:*']);`);
await db.exec(readFileSync('supabase/migrations/20261121151000_agent_and_vote_authority.sql','utf8'));
assert.equal((await db.query('SELECT revoked FROM agent_tokens')).rows[0].revoked,true);
async function as(user,role='authenticated'){ await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${user||''}',false); SET ROLE ${role}`); }
await as(u);
await assert.rejects(()=>db.query(`INSERT INTO agent_tokens(user_id,agent_id,label,token_hash,scopes) VALUES($1,$2,'bad','fakebad',ARRAY['admin:*'])`,[u,agent]));
await db.query(`INSERT INTO agent_tokens(user_id,agent_id,label,token_hash) VALUES($1,$2,'public','fakegood')`,[u,agent]);
await assert.rejects(()=>db.query(`UPDATE agent_tokens SET scopes=ARRAY['admin:*'] WHERE token_hash='fakegood'`));
await db.query(`UPDATE agent_tokens SET revoked=true WHERE token_hash='fakegood'`);
await assert.rejects(()=>db.query(`UPDATE agent_tokens SET revoked=false WHERE token_hash='fakegood'`));
await assert.rejects(()=>db.query('SELECT cast_influence_vote($1,$2,$3,$4,$5)',[offering,other,'tree','fixture',5]));
const vote=(await db.query('SELECT cast_influence_vote($1,$2,$3,$4,$5) AS id',[offering,u,'tree','fixture',5])).rows[0].id;
await assert.rejects(()=>db.query('SELECT cast_influence_vote($1,$2,$3,$4,$5)',[offering,u,'tree','fixture',5]));
await as(other); await assert.rejects(()=>db.query('SELECT retract_influence_vote($1,$2)',[vote,u]));
await as(u); await db.query('SELECT retract_influence_vote($1,$2)',[vote,u]); await db.query('SELECT retract_influence_vote($1,$2)',[vote,u]);
assert.equal(Number((await db.query('SELECT spent FROM influence_vote_budgets')).rows[0].spent),0);
await assert.rejects(()=>db.query('UPDATE influence_vote_budgets SET spent=0'));
await as(null,'anon'); await assert.rejects(()=>db.query('SELECT cast_influence_vote($1,$2,$3,$4,$5)',[offering,u,'tree','fixture',5]));
if(db.connectSession){
 const a=await sessionAs(db,other),b=await sessionAs(db,other),inspector=await db.connectSession();const pid=(await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
 try{
  await a.exec('BEGIN');const first=(await a.query('SELECT cast_influence_vote($1,$2,$3,$4,$5) AS id',[offering,other,'tree','race-a',10])).rows[0].id;
  const second=b.query('SELECT cast_influence_vote($1,$2,$3,$4,$5) AS id',[offering,other,'tree','race-b',10]);
  await assertBlocked(inspector,pid);await a.exec('COMMIT');await second;
  assert.equal(Number((await a.query('SELECT spent FROM influence_vote_budgets WHERE user_id=$1',[other])).rows[0].spent),20);
  await a.exec('BEGIN');await a.query('SELECT retract_influence_vote($1,$2)',[first,other]);
  const repeated=b.query('SELECT retract_influence_vote($1,$2)',[first,other]);await assertBlocked(inspector,pid);await a.exec('COMMIT');await repeated;
  assert.equal(Number((await a.query('SELECT spent FROM influence_vote_budgets WHERE user_id=$1',[other])).rows[0].spent),10);
  console.log('PASS PostgreSQL concurrent first-vote budget and double-retraction races');
 }finally{await a.close();await b.close();await inspector.close();}
}
console.log('PASS 12 PostgreSQL key-scope / cast / retract / direct-write assertions'); await db.close();
