import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DATABASE_URL_TEST: Optional env var for integration test schema isolation.
// When set, jest.setup.js overrides DATABASE_URL with DATABASE_URL_TEST
// before any module imports are evaluated. Tests run against 'fitness_test' schema.
// See: .planning/phases/12-testing-validation/12-CONTEXT.md (D-02)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
