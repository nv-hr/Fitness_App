/**
 * Integration test helpers — Supabase test schema lifecycle + test data seeding.
 *
 * Creates a fresh 'fitness_test' schema in the existing Supabase project,
 * runs schema.sql + seed.sql to populate it. The DATABASE_URL override
 * and NODE_ENV=test are handled by jest.setup.js (setupFiles), which
 * runs before any module imports are evaluated.
 *
 * @module helpers
 */

import { setTimeout } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCHEMA_SQL_PATH = path.join(PROJECT_ROOT, 'backend', 'db', 'schema.sql');
const SEED_SQL_PATH = path.join(PROJECT_ROOT, 'backend', 'db', 'seed.sql');
const TEST_SCHEMA = 'fitness_test';

function getTestConnectionString() {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  // Prefer session mode pooler (port 6543) for SSL compatibility
  return url?.replace(':5432/', ':6543/');
}

async function withTempPool(fn) {
  const connStr = getTestConnectionString();
  const tempPool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  try {
    await fn(tempPool);
  } finally {
    await tempPool.end();
  }
}

async function executeSqlFile(pool, filePath) {
  const sql = await readFile(filePath, 'utf8');
  await pool.query(sql);
}

/**
 * Create the test schema, run schema.sql + seed.sql.
 * @param {number} [timeoutMs=30000] — max wait time in ms
 * @returns {Promise<void>}
 */
export async function startDatabase(timeoutMs = 30000) {
  await withTempPool(async (pool) => {
    await pool.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
    await pool.query(`CREATE SCHEMA ${TEST_SCHEMA}`);
    await pool.query(`SET search_path TO ${TEST_SCHEMA}, public`);
    await executeSqlFile(pool, SCHEMA_SQL_PATH);
    await executeSqlFile(pool, SEED_SQL_PATH);
  });
}

/**
 * Drop the test schema.
 * @returns {Promise<void>}
 */
export async function stopDatabase() {
  await withTempPool(async (pool) => {
    await pool.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
  });
}

/**
 * Register a test user via the API and return the agent with JWT cookie stored.
 * Uses a unique email (timestamp-based) to avoid duplicate-key errors.
 *
 * @param {import('supertest').SuperAgentTest} agent
 * @returns {Promise<{agent: import('supertest').SuperAgentTest, email: string, password: string, user: Object}>}
 */
export async function createTestUser(agent) {
  const email = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'TestP@ss123';

  const res = await agent
    .post('/api/auth/register')
    .send({ email, password, pdpConsent: true });

  // eslint-disable-next-line jest/no-standalone-expect
  if (![200, 201].includes(res.status)) {
    throw new Error(
      `createTestUser failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  return {
    agent,
    email,
    password,
    user: res.body.data.user,
  };
}

/**
 * Seed a profile and food-log entry so read endpoints return data.
 * Must be called after createTestUser (agent must have auth cookie).
 *
 * @param {import('supertest').SuperAgentTest} agent
 * @returns {Promise<{profile: Object, foodLogId: number|null}>}
 */
async function seedTestData(agent) {
  // Create profile
  const profileRes = await agent.post('/api/profile').send({
    weightKg: 70,
    heightCm: 175,
    age: 30,
    gender: 'male',
    fitnessGoal: 'maintain',
    activityLevel: 'moderate',
  });

  const profile = profileRes.body.data?.profile || null;

  // Search for a seeded food and log it
  const searchRes = await agent.get('/api/food/search?q=chicken');
  const foods = searchRes.body.data || [];
  let foodLogId = null;

  if (foods.length > 0) {
    const logRes = await agent.post('/api/food/log').send({
      foodId: foods[0].id,
      portionGrams: 200,
      mealType: 'lunch',
      logDate: new Date().toISOString().split('T')[0],
    });
    foodLogId = logRes.body.data?.id || null;
  }

  return { profile, foodLogId };
}
