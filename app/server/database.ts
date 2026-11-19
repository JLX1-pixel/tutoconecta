import pg from 'pg';
pg.types.setTypeParser(20, Number);
pg.types.setTypeParser(1700, Number);
if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL antes de iniciar.');
// Every connection resolves tables only inside this application's schema.
// This also allows sharing a managed PostgreSQL instance without touching public.
export const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, max: 5, options:'-c search_path=tutoconecta'});
pool.on('error', error => console.error('Database connection error', error.name));
class Statement {
  constructor(public sql: string, public values: any[] = []) {}
  bind(...values: any[]) { return new Statement(this.sql, values); }
  query() { let i=0; return {text:this.sql.replace(/\?/g,()=>`$${++i}`),values:this.values}; }
  async first<T=any>():Promise<T|null> { return (await pool.query(this.query())).rows[0]??null; }
  async all() { return {results:(await pool.query(this.query())).rows}; }
  async run() { return {meta:{changes:(await pool.query(this.query())).rowCount}}; }
}
export const database={
  prepare:(sql:string)=>new Statement(sql),
  async batch(statements:Statement[]){
    const client=await pool.connect();
    try { await client.query('BEGIN'); for(const s of statements)await client.query(s.query()); await client.query('COMMIT'); }
    catch(error){await client.query('ROLLBACK');throw error;} finally{client.release();}
  }
};
export async function migrate(){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20261118)');
    await client.query('CREATE SCHEMA IF NOT EXISTS tutoconecta');
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts(id text PRIMARY KEY,email text UNIQUE NOT NULL,name text NOT NULL,password_hash text NOT NULL,recovery_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,user_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
      CREATE TABLE IF NOT EXISTS profiles(id text PRIMARY KEY REFERENCES accounts(id),name text NOT NULL,email text NOT NULL,role text NOT NULL CHECK(role IN ('student','tutor','both')),subject text NOT NULL DEFAULT '',level text NOT NULL DEFAULT 'Universitario',city text NOT NULL DEFAULT '',bio text NOT NULL DEFAULT '',created_at text NOT NULL);
      CREATE TABLE IF NOT EXISTS slots(id text PRIMARY KEY,tutor_id text NOT NULL REFERENCES profiles(id),start text NOT NULL,mode text NOT NULL CHECK(mode IN ('Virtual','Presencial')),location text NOT NULL DEFAULT '');
      CREATE UNIQUE INDEX IF NOT EXISTS tutor_hour ON slots(tutor_id,start);
      CREATE TABLE IF NOT EXISTS bookings(id text PRIMARY KEY,slot_id text NOT NULL REFERENCES slots(id),student_id text NOT NULL REFERENCES profiles(id),start text NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','cancelled','completed')),topic text NOT NULL,room text NOT NULL,created_at text NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot ON bookings(slot_id) WHERE status IN ('pending','accepted','completed');
      CREATE UNIQUE INDEX IF NOT EXISTS student_active_hour ON bookings(student_id,start) WHERE status IN ('pending','accepted','completed');
      CREATE TABLE IF NOT EXISTS reviews(id text PRIMARY KEY,booking_id text UNIQUE NOT NULL REFERENCES bookings(id),score integer NOT NULL CHECK(score BETWEEN 1 AND 5),comment text NOT NULL,created_at text NOT NULL);
      CREATE TABLE IF NOT EXISTS notifications(id text PRIMARY KEY,user_id text NOT NULL REFERENCES profiles(id),message text NOT NULL,read integer NOT NULL DEFAULT 0,created_at text NOT NULL);
      CREATE INDEX IF NOT EXISTS notification_user ON notifications(user_id,created_at);
    `);
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
