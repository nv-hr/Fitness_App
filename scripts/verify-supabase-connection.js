import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(resolve(__dirname, '../backend/package.json'));
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Supabase requires SSL
  },
  connectionTimeoutMillis: 10000,
  min: 0,
  max: 1,
  idleTimeoutMillis: 30000,
});

async function verifyConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 AS connected');
    client.release();
    console.log('Supabase connected successfully');
    console.log('Result:', result.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifyConnection();
