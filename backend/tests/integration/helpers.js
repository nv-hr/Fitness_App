/**
 * Integration test helpers — MySQL lifecycle + test data seeding.
 *
 * Starts MySQL via docker-compose, creates test users, and seeds profile/food data
 * so that every backend endpoint can be exercised against a real database.
 *
 * @module helpers
 */

// Set test environment before app imports (disables aggressive rate limits)
process.env.NODE_ENV = 'test';

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import { createConnection } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (where docker-compose.yml lives)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const COMPOSE_FILE = path.join(PROJECT_ROOT, 'docker-compose.yml');

/** @type {string|null} */
let composeCmd = null;

/**
 * Check if MySQL port 3306 is accepting connections (in-process, no child process).
 * @param {string} [host='127.0.0.1']
 * @param {number} [port=3306]
 * @param {number} [timeoutMs=3000]
 * @returns {Promise<boolean>}
 */
function isPortOpen(host = '127.0.0.1', port = 3306, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port, timeout: timeoutMs }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Start MySQL via docker-compose and wait for it to become healthy.
 *
 * Strategy:
 *   1. Check if MySQL port 3306 is already open → skip compose (fast path).
 *   2. Otherwise, try to start MySQL via docker/podman-compose.
 *   3. Wait for port to become available.
 *
 * @param {number} [timeoutMs=90000] — max wait time in ms
 * @returns {Promise<void>}
 */
export async function startDatabase(timeoutMs = 90000) {
  // Fast path: MySQL already running
  if (await isPortOpen()) {
    return;
  }

  // Compose file must exist
  if (!existsSync(COMPOSE_FILE)) {
    throw new Error(
      `docker-compose.yml not found at ${COMPOSE_FILE}. Cannot start MySQL container.`
    );
  }

  // Try compose candidates
  const candidates = [
    'docker compose',
    'docker-compose',
    'podman-compose',
    'python -m podman_compose',
  ];

  let composeFound = false;
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} version`, { stdio: 'pipe', timeout: 10000, windowsHide: true, shell: true });
      composeCmd = cmd;
      composeFound = true;
      break;
    } catch {
      // Try next candidate
    }
  }

  if (!composeFound) {
    // One last check — maybe MySQL started while we were trying
    if (await isPortOpen()) {
      return;
    }
    throw new Error(
      'No container compose tool found and MySQL is not running on port 3306. ' +
      'Install Docker Desktop or Podman, or start MySQL manually.'
    );
  }

  // Start the MySQL container
  try {
    execSync(
      `${composeCmd} -f "${COMPOSE_FILE}" up -d mysql`,
      { stdio: 'pipe', timeout: 120000, windowsHide: true, shell: true }
    );
  } catch (err) {
    const msg = err.stderr?.toString() || err.message || '';
    if (!msg.toLowerCase().includes('already') && !msg.includes('container exists')) {
      throw new Error(`Failed to start MySQL: ${msg}`);
    }
  }

  // Wait for MySQL to accept connections
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen()) {
      return;
    }
    await setTimeout(2000);
  }

  throw new Error(
    `MySQL did not become available within ${timeoutMs / 1000}s.`
  );
}

/**
 * Stop MySQL via docker-compose.
 * @returns {Promise<void>}
 */
export async function stopDatabase() {
  if (!composeCmd) {
    return; // MySQL was not started by us
  }
  try {
    execSync(
      `${composeCmd} -f "${COMPOSE_FILE}" down`,
      { stdio: 'pipe', timeout: 30000, windowsHide: true, shell: true }
    );
  } catch (err) {
    console.warn(
      'Warning: failed to stop MySQL container:',
      err.stderr?.toString().trim() || err.message
    );
  }
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
export async function seedTestData(agent) {
  // Create profile
  const profileRes = await agent.post('/api/profile').send({
    weightKg: 70,
    heightCm: 175,
    age: 30,
    gender: 'male',
    fitnessGoal: 'maintain',
    activityLevel: 'medium',
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
