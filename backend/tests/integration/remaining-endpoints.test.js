/**
 * Integration tests for remaining/uncovered API endpoints.
 *
 * Covers 9 endpoints across Health, Docs, Daily Meal Plans, Activity Plans,
 * and Weekly Plan routes.
 *
 * Prerequisites:
 *   1. Supabase project running with DATABASE_URL in .env
 *   2. .env file with JWT_SECRET
 *
 * Skipped endpoints (require real credentials):
 *   - GET /api/auth/google — Google OAuth initiation (needs real Google OAuth client ID)
 *   - GET /api/auth/google/callback — Google OAuth callback handler (needs real credentials)
 *
 * Usage:
 *   cd backend
 *   node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=remaining-endpoints --verbose
 *
 * @see .planning/quick/260531-sgr-test-all-endpoint/260531-sgr-PLAN.md
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser } from './helpers.js';

/** @type {import('supertest').SuperAgentTest} */
let agent;
let testUser;

beforeAll(async () => {
  // 1. Set up Supabase test schema
  await startDatabase();

  // 2. Create a fresh authenticated agent for protected routes
  agent = request.agent(app);
  testUser = await createTestUser(agent);
}, 60000); // 60s timeout for test schema setup

afterAll(async () => {
  await stopDatabase();
}, 30000);

// ──────────────────────────────────────────────
// Health & Documentation Endpoints  (no auth)
// ──────────────────────────────────────────────

describe('Health & Documentation Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 with status ok and ISO timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.timestamp).toBe('string');
      // Verify timestamp is valid ISO 8601
      const parsed = new Date(res.body.timestamp);
      expect(parsed.toISOString()).toBe(res.body.timestamp);
    });
  });

  describe('GET /api/docs', () => {
    it('should return 200 with API documentation structure', async () => {
      const res = await request(app).get('/api/docs');

      expect(res.status).toBe(200);
      expect(res.body.api).toBeDefined();
      expect(res.body.api.name).toBe('Fitness App API');
      expect(res.body.api.description).toBeDefined();
      expect(res.body.api.version).toBeDefined();
      expect(Array.isArray(res.body.api.endpoints)).toBe(true);
      expect(res.body.api.endpoints.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ──────────────────────────────────────────────
// Daily Meal Plan Endpoints  (3 routes)
// ──────────────────────────────────────────────

describe('Daily Meal Plan Endpoints', () => {
  describe('GET /api/daily-meal-plans', () => {
    let dmpAgent;

    beforeAll(async () => {
      dmpAgent = request.agent(app);
      const email = `dmp_get_${Date.now()}@example.com`;
      await dmpAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });
    });

    it('should reject request without auth → 401', async () => {
      const res = await request(app).get('/api/daily-meal-plans');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return plan:null when no plan exists → 200', async () => {
      const res = await dmpAgent.get('/api/daily-meal-plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.plan).toBeNull();
      expect(res.body.data.fromCache).toBe(false);
    });

    it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
      const res = await dmpAgent.get('/api/daily-meal-plans?date=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

// ──────────────────────────────────────────────
// Activity Plan Endpoints  (3 routes)
// ──────────────────────────────────────────────

describe('Activity Plan Endpoints', () => {
  describe('GET /api/activity-plans', () => {
    let apAgent;

    beforeAll(async () => {
      apAgent = request.agent(app);
      const email = `ap_get_${Date.now()}@example.com`;
      await apAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });
    });

    it('should reject request without auth → 401', async () => {
      const res = await request(app).get('/api/activity-plans');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return plan:null when no plan exists → 200', async () => {
      const res = await apAgent.get('/api/activity-plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.plan).toBeNull();
      expect(res.body.data.fromCache).toBe(false);
    });

    it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
      const res = await apAgent.get('/api/activity-plans?date=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

// ──────────────────────────────────────────────
// Weekly Plan Regenerate Day Endpoint
// ──────────────────────────────────────────────

describe('Weekly Plan Regenerate Day Endpoint', () => {
  let wpAgent;

  beforeAll(async () => {
    wpAgent = request.agent(app);
    const email = `wp_regen_${Date.now()}@example.com`;
    await wpAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create profile so the user exists fully
    await wpAgent.post('/api/profile').send({
      weightKg: 75,
      heightCm: 180,
      age: 32,
      gender: 'male',
      fitnessGoal: 'maintain',
      activityLevel: 'moderate',
    });
  });

  it('should reject request without auth → 401', async () => {
    const res = await request(app)
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 0 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing dayIndex → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ weekStart: '2026-06-01' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject dayIndex < 0 → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: -1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/dayIndex/i);
  });

  it('should reject dayIndex > 6 → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 7 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/dayIndex/i);
  });

  it('should reject dayIndex as string → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: '0' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/dayIndex/i);
  });

  it('should reject invalid weekStart format → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 0, weekStart: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/date/i);
  });

  it('should reject availableDays < 4 → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 0, availableDays: 3 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/availableDays/i);
  });

  it('should reject availableDays > 6 → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 0, availableDays: 7 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/availableDays/i);
  });

  it('should reject availableDays non-integer → 400 VALIDATION_ERROR', async () => {
    const res = await wpAgent
      .post('/api/weekly-plans/regenerate-day')
      .send({ dayIndex: 0, availableDays: 4.5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/availableDays/i);
  });

  // NOTE: Happy path for regenerate-day requires an existing LLM-generated plan
  // and is covered by the E2E test pattern in weeklyPlan.e2e.test.js
});

// ──────────────────────────────────────────────
// POST /api/daily-meal-plans/generate
// ──────────────────────────────────────────────

describe('POST /api/daily-meal-plans/generate', () => {
  let generateAgent;

  beforeAll(async () => {
    generateAgent = request.agent(app);
    const email = `dmp_generate_${Date.now()}@example.com`;
    await generateAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create profile so the user exists fully
    await generateAgent.post('/api/profile').send({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: 'male',
      fitnessGoal: 'maintain',
      activityLevel: 'moderate',
    });
  });

  it('should reject request without auth → 401', async () => {
    const res = await request(app)
      .post('/api/daily-meal-plans/generate')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
    const res = await generateAgent
      .post('/api/daily-meal-plans/generate')
      .send({ date: 'bad-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ──────────────────────────────────────────────
// POST /api/daily-meal-plans/log
// ──────────────────────────────────────────────

describe('POST /api/daily-meal-plans/log', () => {
  let logAgent;

  beforeAll(async () => {
    logAgent = request.agent(app);
    const email = `dmp_log_${Date.now()}@example.com`;
    await logAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create profile so the user exists fully
    await logAgent.post('/api/profile').send({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: 'male',
      fitnessGoal: 'maintain',
      activityLevel: 'moderate',
    });
  });

  it('should reject request without auth → 401', async () => {
    const res = await request(app)
      .post('/api/daily-meal-plans/log')
      .send({ mealTypes: ['breakfast'] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing mealTypes → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/daily-meal-plans/log')
      .send({ date: '2026-06-01' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/mealTypes/i);
  });

  it('should reject empty mealTypes array → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/daily-meal-plans/log')
      .send({ mealTypes: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/mealTypes/i);
  });

  it('should reject invalid mealType → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/daily-meal-plans/log')
      .send({ mealTypes: ['invalid_type'] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/invalid|mealType/i);
  });

  it('should return 404 when no plan exists for date → 404 NOT_FOUND', async () => {
    const res = await logAgent
      .post('/api/daily-meal-plans/log')
      .send({ date: '2026-06-01', mealTypes: ['breakfast'] });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toMatch(/no daily meal plan/i);
  });

  it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/daily-meal-plans/log')
      .send({ date: 'not-a-date', mealTypes: ['breakfast'] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // NOTE: Happy path for log requires an existing LLM-generated meal plan
  // and is covered by the E2E test pattern in weeklyPlan.e2e.test.js
});

// ──────────────────────────────────────────────
// POST /api/activity-plans/generate
// ──────────────────────────────────────────────

describe('POST /api/activity-plans/generate', () => {
  let generateAgent;

  beforeAll(async () => {
    generateAgent = request.agent(app);
    const email = `ap_generate_${Date.now()}@example.com`;
    await generateAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create profile so the user exists fully
    await generateAgent.post('/api/profile').send({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: 'male',
      fitnessGoal: 'maintain',
      activityLevel: 'moderate',
    });
  });

  it('should reject request without auth → 401', async () => {
    const res = await request(app)
      .post('/api/activity-plans/generate')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
    const res = await generateAgent
      .post('/api/activity-plans/generate')
      .send({ date: 'bad-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ──────────────────────────────────────────────
// POST /api/activity-plans/log
// ──────────────────────────────────────────────

describe('POST /api/activity-plans/log', () => {
  let logAgent;

  beforeAll(async () => {
    logAgent = request.agent(app);
    const email = `ap_log_${Date.now()}@example.com`;
    await logAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create profile so the user exists fully
    await logAgent.post('/api/profile').send({
      weightKg: 70,
      heightCm: 175,
      age: 30,
      gender: 'male',
      fitnessGoal: 'maintain',
      activityLevel: 'moderate',
    });
  });

  it('should reject request without auth → 401', async () => {
    const res = await request(app)
      .post('/api/activity-plans/log')
      .send({ activityIndexes: [0] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing activityIndexes → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/activity-plans/log')
      .send({ date: '2026-06-01' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/activityIndexes/i);
  });

  it('should reject empty activityIndexes array → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/activity-plans/log')
      .send({ activityIndexes: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/activityIndexes/i);
  });

  it('should return 404 when no plan exists for date → 404 NOT_FOUND', async () => {
    const res = await logAgent
      .post('/api/activity-plans/log')
      .send({ date: '2026-06-01', activityIndexes: [0] });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toMatch(/no activity plan/i);
  });

  it('should reject invalid date format → 400 VALIDATION_ERROR', async () => {
    const res = await logAgent
      .post('/api/activity-plans/log')
      .send({ date: 'not-a-date', activityIndexes: [0] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // NOTE: Happy path for log requires an existing LLM-generated activity plan
  // and is covered by the E2E test pattern in weeklyPlan.e2e.test.js
});

/**
 * Skipped Endpoints
 *
 * The following endpoints require real OAuth credentials and cannot be tested
 * in an automated integration test:
 *
 * - GET /api/auth/google — Google OAuth initiation (requires real Google OAuth
 *   client ID and redirect URI configured in .env)
 * - GET /api/auth/google/callback — Google OAuth callback handler (requires
 *   a real Google OAuth flow to generate the callback with authorization code)
 *
 * These are documented as skipped rather than silently omitted from test coverage.
 */
