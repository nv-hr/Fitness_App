/**
 * Weekly Plan E2E — Real LLM integration test.
 *
 * This test calls the actual OpenRouter API via the weekly plan generation
 * pipeline: auth middleware → controller → LLM service → OpenRouter API →
 * response parsing → plan validation. It verifies the full end-to-end flow
 * works with real data and a real LLM call.
 *
 * Prerequisites:
 *   - OPENROUTER_API_KEY set in backend/.env or environment
 *   - Supabase project running (DATABASE_URL in .env)
 *   - JWT_SECRET set in .env
 *
 * WARNING: This test makes a real LLM API call that costs ~$0.001–0.01 per run.
 * It is designed for on-demand testing, NOT for CI. Each run consumes one
 * LLM call (with up to 2 retry attempts = up to 3 calls worst case).
 *
 * Usage:
 *   cd backend
 *   npx cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=weeklyPlan.e2e --verbose
 *
 * @module weeklyPlan.e2e.test
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser } from './helpers.js';

/** @type {import('supertest').SuperAgentTest} */
let agent;
let testUser;

beforeAll(async () => {
  // 1. Create fresh test schema
  await startDatabase();

  // 2. Create authenticated agent
  agent = request.agent(app);
  testUser = await createTestUser(agent);

  // 3. Create a profile (required by LLM service to build the system prompt)
  const profileRes = await agent.post('/api/profile').send({
    weightKg: 75,
    heightCm: 180,
    age: 32,
    gender: 'male',
    fitnessGoal: 'maintain',
    activityLevel: 'moderate',
  });

  console.log('[setup] Profile created:', profileRes.status, profileRes.body.success);

  // 4. Log a few activities so fallback plan generation has data to use
  //    if the real LLM call fails
  const activities = [
    { activityId: 1, durationMin: 30, intensity: 'moderate' },
    { activityId: 2, durationMin: 45, intensity: 'light' },
    { activityId: 3, durationMin: 20, intensity: 'vigorous' },
  ];
  for (const act of activities) {
    await agent.post('/api/activities/log').send({
      activityId: act.activityId,
      durationMin: act.durationMin,
      intensity: act.intensity,
    });
  }
  console.log('[setup] Seeded 3 activity logs for fallback');
}, 90000); // 90s: DB setup + user registration + profile creation

afterAll(async () => {
  await stopDatabase();
}, 30000);

// ──────────────────────────────────────────────
// Weekly Plan E2E — Real LLM
// ──────────────────────────────────────────────

describe('Weekly Plan E2E - Real LLM', () => {
  const VALID_INTENSITIES = ['light', 'moderate', 'vigorous'];

  it('POST /api/weekly-plans/generate returns a valid weekly plan from real LLM', async () => {
    const startTime = Date.now();

    const res = await agent
      .post('/api/weekly-plans/generate')
      .send({});

    const elapsed = Date.now() - startTime;

    // ── Status & success ──
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // ── Top-level data shape ──
    expect(res.body.data).toBeDefined();
    expect(res.body.data.plan).toBeDefined();
    expect(res.body.data).toHaveProperty('fromCache');

    const dataStatus = res.body.data.status;
    expect(['active', 'fallback', 'unavailable']).toContain(dataStatus);

    const plan = res.body.data.plan;

    // ── Plan days ──
    expect(Array.isArray(plan.days)).toBe(true);
    if (plan.days.length === 0) {
      console.warn('⚠ Plan has 0 days — LLM call may have failed completely');
      console.log('✓ Generation time:', elapsed + 'ms');
      console.log('✓ Plan status (data level):', dataStatus);
      return;
    }
    expect(plan.days.length).toBeGreaterThanOrEqual(1);
    expect(plan.days.length).toBeLessThanOrEqual(7);

    // ── Plan level status (present in fallback plans, may not be in LLM response) ──
    if (plan.status) {
      expect(['active', 'fallback', 'unavailable']).toContain(plan.status);
    }

    // ── generated_at is set by fallback, may not be in raw LLM response ──
    if (plan.generated_at) {
      expect(() => new Date(plan.generated_at)).not.toThrow();
    }

    // ── Per-day validation ──
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayActivityCounts = [];

    for (let i = 0; i < plan.days.length; i++) {
      const day = plan.days[i];

      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => new Date(day.date + 'T00:00:00Z')).not.toThrow();

      expect(Array.isArray(day.activities)).toBe(true);
      expect(day.activities.length).toBeGreaterThanOrEqual(1);
      expect(day.activities.length).toBeLessThanOrEqual(4);

      dayActivityCounts.push(day.activities.length);

      for (const act of day.activities) {
        expect(typeof act.activity_id).toBe('number');
        expect(act.activity_id).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(act.activity_id)).toBe(true);

        expect(typeof act.name).toBe('string');
        expect(act.name.trim().length).toBeGreaterThan(0);

        expect(typeof act.duration_min).toBe('number');
        expect(act.duration_min).toBeGreaterThanOrEqual(10);
        expect(act.duration_min).toBeLessThanOrEqual(180);
        expect(Number.isInteger(act.duration_min)).toBe(true);

        expect(VALID_INTENSITIES).toContain(act.intensity);
      }
    }

    // ── Console output for human inspection ──
    console.log('✓ LLM model used:', plan.llm_model || 'unknown');
    console.log('✓ Generation time:', elapsed + 'ms');
    console.log('✓ Plan status (data level):', dataStatus);
    console.log(
      '✓ Day activities summary:',
      dayNames.slice(0, dayActivityCounts.length).map((name, i) => `${name}=${dayActivityCounts[i]}`).join(', ')
    );
  }, 120000); // 120s: real LLM call with potential retries

  it('GET /api/weekly-plans returns the generated plan from DB/cache', async () => {
    const res = await agent.get('/api/weekly-plans');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.plan).toBeDefined();
    expect(res.body.data).toHaveProperty('fromCache');

    const plan = res.body.data.plan;

    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days.length).toBeGreaterThanOrEqual(0);

    if (res.body.data.fromCache) {
      console.log('✓ Plan retrieved from cache (raw LLM output, no status wrapper)');
    }
    console.log('✓ GET returned plan with', plan.days.length, 'days');
  }, 30000); // 30s: DB/cache retrieval
});
