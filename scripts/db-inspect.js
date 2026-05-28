import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '../backend/package.json'));
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function run() {
  try {
    console.log('=== All Tables (public schema) ===');
    const r1 = await pool.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(JSON.stringify(r1.rows, null, 2));

    console.log('\n=== All Schemas ===');
    const r2 = await pool.query("SELECT schema_name FROM information_schema.schemata ORDER BY schema_name");
    console.log(JSON.stringify(r2.rows.map(r => r.schema_name), null, 2));

    console.log('\n=== Current User ===');
    const r3 = await pool.query('SELECT current_user, current_database(), version()');
    console.log(JSON.stringify(r3.rows, null, 2));

    console.log('\n=== Any table in any schema named foods/activities ===');
    const r4 = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('foods','activities','users','profiles','food_logs','user_activity_log')");
    console.log(JSON.stringify(r4.rows, null, 2));

    await pool.end();
  } catch (e) { console.error('Error:', e.message); await pool.end(); }
}
run();
