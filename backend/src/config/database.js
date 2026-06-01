import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env'), override: true });

// DATABASE_URL_TEST: Optional env var for integration test schema isolation.
// When set, jest.setup.js overrides DATABASE_URL with DATABASE_URL_TEST
// before any module imports are evaluated. Tests run against 'fitness_test' schema.
// See: .planning/phases/12-testing-validation/12-CONTEXT.md (D-02)
// Supabase pooler: transaction mode (port 5432) may reject SSL on some networks.
// Session mode (port 6543) works when ssl.rejectUnauthorized is disabled.
function buildConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  // Prefer session mode pooler (port 6543) for SSL compatibility
  return url.replace(':5432/', ':6543/');
}

export const pool = new Pool({
  connectionString: buildConnectionString(),
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 8000,
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
