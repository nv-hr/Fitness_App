import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
  // Log additional context for fatal errors (ECONNREFUSED, ENOTFOUND, etc.)
  if (err.code) {
    console.error(`  [code: ${err.code}]`);
  }
  if (err.stack) {
    console.error(`  ${err.stack.split('\n').slice(0, 3).join('\n')}`);
  }
});
