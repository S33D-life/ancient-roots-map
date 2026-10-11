// Isolated PostgreSQL test. No connection to production; synthetic records only.
// Supply S33D_PGLITE_MODULE when PGlite is installed in a separate test harness.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.S33D_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const author = '11111111-1111-4111-8111-111111111111';
const treeOwner = '22222222-2222-4222-8222-222222222222';
const visitor = '33333333-3333-4333-8333-333333333333';
const unrelated = '44444444-4444-4444-8444-444444444444';
const tree = '55555555-5555-4555-8555-555555555555';
const publicMedia = `https://example.supabase.co/storage/v1/object/public/offerings/${author}/${tree}/photo.jpg`;
const privateMedia = publicMedia.replace('/offerings/', '/offerings-private/');
try {
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA public,auth TO authenticated,anon;
    CREATE TABLE trees(id uuid PRIMARY KEY, created_by uuid);
    CREATE TABLE tree_meetings(tree_id uuid, user_id uuid);
    CREATE FUNCTION public.has_tree_meeting(u uuid,t uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM tree_meetings WHERE tree_id=t AND user_id=u) $$;
    CREATE TABLE offerings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tree_id uuid NOT NULL, created_by uuid, visibility text NOT NULL CHECK(visibility IN ('public','tribe','private')),media_url text,photos text[],thumbnail_url text,title text);
    ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
    GRANT SELECT,INSERT,UPDATE ON offerings TO authenticated,anon;
    GRANT SELECT ON trees,tree_meetings TO authenticated,anon;
    CREATE POLICY offering_read ON offerings FOR SELECT USING (
      visibility='public' OR visibility='tribe' AND (
        auth.uid()=created_by OR auth.uid()=(SELECT trees.created_by FROM trees WHERE id=offerings.tree_id)
        OR public.has_tree_meeting(auth.uid(),tree_id))
      OR visibility='private' AND auth.uid()=created_by);
    CREATE POLICY offering_insert ON offerings FOR INSERT WITH CHECK(auth.uid()=created_by);
    CREATE POLICY offering_update ON offerings FOR UPDATE USING(auth.uid()=created_by) WITH CHECK(auth.uid()=created_by);
    INSERT INTO trees VALUES('${tree}','${treeOwner}');
    INSERT INTO tree_meetings VALUES('${tree}','${visitor}');
    INSERT INTO offerings(tree_id,created_by,visibility,media_url,title) VALUES
      ('${tree}','${author}','public','${publicMedia}','public control'),
      ('${tree}','${author}','tribe','${publicMedia}','legacy exposed fixture'),
      ('${tree}','${author}','private','${privateMedia}','private control');
  `);
  await db.exec(await readFile(new URL('../migrations/20261011201500_ordinary_offering_media_boundary.sql', import.meta.url), 'utf8'));
  async function as(user) {
    await db.exec(`RESET ROLE; SET ROLE ${user ? 'authenticated' : 'anon'}; SELECT set_config('request.jwt.claim.sub','${user || ''}',false);`);
  }
  // Actual SQL/RLS, including ordinary row audience rules.
  for (const [user, expected] of [[null,1],[unrelated,1],[visitor,2],[treeOwner,2],[author,3]]) {
    await as(user);
    assert.equal((await db.query('SELECT * FROM offerings')).rows.length, expected);
  }
  await as(author);
  const insert = (visibility, refs = { media_url: privateMedia }) => db.query(
    'INSERT INTO offerings(tree_id,created_by,visibility,media_url,photos,thumbnail_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
    [tree, author, visibility, refs.media_url ?? null, refs.photos ?? null, refs.thumbnail_url ?? null]);
  await insert('tribe'); await insert('private'); await insert('public', {media_url:publicMedia});
  for (const refs of [{media_url: publicMedia},{photos: [publicMedia]},{thumbnail_url: publicMedia},
      {media_url:publicMedia.replace('/object/public/', '/render/image/public/')},
      {media_url:publicMedia.replace('/storage/', '/%73torage/')},
      {media_url:privateMedia.replace(author, unrelated)},
      {media_url:privateMedia.replace('photo.jpg','%2e%2e/photo.jpg')}]) {
    await assert.rejects(insert('tribe',refs), e => e.code === '23514');
  }
  await assert.rejects(insert('public'), e => e.code === '23514');
  await assert.rejects(db.query('INSERT INTO offerings(tree_id,created_by,visibility) VALUES($1,$2,$3)',[tree,unrelated,'public']), e => e.code === '42501');
  await assert.rejects(db.query("UPDATE offerings SET visibility='tribe', media_url=$1 WHERE title='public control'",[privateMedia]),e=>e.code==='23514');
  // Non-media edits to old rows remain possible. Migration can safely replace
  // legacy references without changing audience/identity/ownership.
  await db.query("UPDATE offerings SET title='legacy unchanged audience' WHERE title='legacy exposed fixture'");
  await db.query("UPDATE offerings SET media_url=$1 WHERE title='legacy unchanged audience'",[privateMedia]);
  await as(null);
  const rows = (await db.query('SELECT visibility,media_url FROM offerings')).rows;
  assert(rows.every(row => row.visibility === 'public'));
  assert(rows.some(row => row.media_url === publicMedia));
  console.log('PASS: real PostgreSQL RLS audience matrix, owner attribution, all media fields, alias rejection, audience-transition guard and legacy migration control.');
} finally { await db.close(); }
