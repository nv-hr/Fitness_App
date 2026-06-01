import { pool } from '../src/config/database.js';
import { readFileSync } from 'fs';

const migrations = [
  'add_activity_plans.sql',
  'add_daily_meal_plans.sql',
  'add_weight_logs.sql',
];

try {
  for (const file of migrations) {
    const sql = readFileSync(new URL(file, import.meta.url), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`  OK`);
  }
  console.log('All migrations completed successfully');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
