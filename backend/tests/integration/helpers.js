/**
 * Integration test helpers — MySQL lifecycle + test data seeding.
 *
 * Starts MySQL via docker-compose, creates test users, and seeds profile/food data
 * so that every backend endpoint can be exercised against a real database.
 *
 * @module helpers
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
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
 * Detect available container compose command.
 * Tries `docker compose` → `docker-compose` → `podman-compose`.
 * @returns {string}
 * @throws {Error} if none found
 */
function detectCompose() {
  if (composeCmd) return composeCmd;

  if (!existsSync(COMPOSE_FILE)) {
    throw new Error(
      `docker-compose.yml not found at ${COMPOSE_FILE}. Cannot start MySQL container.`
    );
  }

  const candidates = [
    { cmd: 'docker compose version', name: 'docker compose' },
    { cmd: 'docker-compose --version', name: 'docker-compose' },
    { cmd: 'podman-compose --version', name: 'podman-compose' },
  ];

  for (const { cmd, name } of candidates) {
    try {
      execSync(cmd, { stdio: 'pipe', windowsHide: true });
      composeCmd = name;
      return composeCmd;
    } catch {
      // Try next candidate
    }
  }

  throw new Error(
    'No container compose tool found. Install Docker Desktop or Podman, ' +
    'or start MySQL manually on localhost:3306.'
  );
}

/**
 * Get the container inspect command for the current compose tool.
 * @returns {string}
 */
function getInspectCmd() {
  if (composeCmd === 'docker compose' || composeCmd === 'docker-compose') {
    return 'docker';
  }
  return 'podman';
}

/**
 * Start MySQL via docker-compose and wait for it to become healthy.
 * @param {number} [timeoutMs=90000] — max wait time in ms
 * @returns {Promise<void>}
 */
export async function startDatabase(timeoutMs = 90000) {
  const cmd = detectCompose();
  const inspect = getInspectCmd();

  // Start the MySQL container (pull image if needed)
  try {
    execSync(
      `${cmd} -f "${COMPOSE_FILE}" up -d mysql`,
      { stdio: 'pipe', timeout: 120000, windowsHide: true }
    );
  } catch (err) {
    // If already running, that's OK — continue
    if (!err.stderr?.toString().includes('is already running')) {
      throw new Error(`Failed to start MySQL: ${err.stderr || err.message}`);
    }
  }

  // Wait for MySQL to respond on port 3306
  const start = Date.now();
  let lastError = '';

  while (Date.now() - start < timeoutMs) {
    try {
      // Try docker/podman healthcheck first
      const status = execSync(
        `${inspect} inspect --format='{{.State.Health.Status}}' fitness_mysql`,
        { encoding: 'utf8', stdio: 'pipe', windowsHide: true }
      ).trim();

      if (status === 'healthy') {
        return;
      }
    } catch {
      // Healthcheck not available — try TCP connection
      try {
        const { execSync: exec } = await import('child_process');
        execSync(
          `node -e "require('net').createConnection({host:'127.0.0.1',port:3306},()=>process.exit(0)).on('error',()=>process.exit(1))"`,
          { stdio: 'pipe', timeout: 5000, windowsHide: true }
        );
        // Port is open — MySQL is accepting connections
        return;
      } catch {
        lastError = 'MySQL port 3306 not yet accepting connections';
      }
    }

    await setTimeout(2000);
  }

  throw new Error(
    `MySQL did not become available within ${timeoutMs / 1000}s. ${lastError}`
  );
}

/**
 * Stop MySQL via docker-compose.
 * @returns {Promise<void>}
 */
export async function stopDatabase() {
  try {
    const cmd = detectCompose();
    execSync(
      `${cmd} -f "${COMPOSE_FILE}" down`,
      { stdio: 'pipe', timeout: 30000, windowsHide: true }
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
