/** Isolated fixture databases only. Never accepts a database URL or live host. */
export async function fixtureDatabase(){
 const ci=process.env.CI==='true' && process.env.S33D_CI_POSTGRES==='1';
 if(!process.env.S33D_PG_SOCKET && !ci){const {PGlite}=await import(process.env.S33D_PGLITE||'@electric-sql/pglite');return new PGlite();}
 if(!ci && process.env.S33D_PG_SOCKET!=='/tmp/s33d-pg-socket') throw new Error('Only the disposable local audit socket is allowed');
 const {default:postgres}=await import('postgres');
 const options={host:ci?'127.0.0.1':'/tmp/s33d-pg-socket',port:55441,username:'fixture_admin',database:'postgres',max:1};
 const admin=postgres(options);const database=`s33d_fixture_${process.pid}_${Date.now()}`;
 await admin.unsafe(`CREATE DATABASE ${database}`);
 const make=()=>{const sql=postgres({...options,database});return {exec:text=>sql.unsafe(text),query:async(text,params=[])=>({rows:[...await sql.unsafe(text,params)]}),close:()=>sql.end(),connectSession:async()=>make()};};
 const db=make();const closeConnection=db.close;
 db.close=async()=>{await closeConnection();await admin.unsafe(`DROP DATABASE ${database} WITH (FORCE)`);await admin.end();};
 return db;
}
export async function assertBlocked(inspector,pid){
 for(let i=0;i<200;i++){const {rows}=await inspector.query("SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1",[pid]);if(rows[0]?.wait_event_type==='Lock') return;await new Promise(r=>setTimeout(r,10));}
 throw new Error('Expected independent PostgreSQL session to block on a lock');
}
export async function sessionAs(db,user,role='authenticated'){
 const connection=await db.connectSession();await connection.exec(`SELECT set_config('request.jwt.claim.sub','${user}',false),set_config('request.jwt.claim.role','${role}',false); SET ROLE ${role}`);return connection;
}
