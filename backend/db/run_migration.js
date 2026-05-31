import { pool } from '../src/config/database.js';
import { readFileSync } from 'fs';

const sql = readFileSync(new URL('add_activity_plans.sql', import.meta.url), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration completed successfully');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
