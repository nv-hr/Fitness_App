import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '../backend/.env' });

const { Pool } = pg;

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
