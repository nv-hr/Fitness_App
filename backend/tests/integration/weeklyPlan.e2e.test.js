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
    expect(res.body.data).toHaveProperty('status');

    const plan = res.body.data.plan;

    // ── Plan metadata ──
    expect(plan.generated_at).toBeDefined();
    expect(() => new Date(plan.generated_at)).not.toThrow();
    expect(new Date(plan.generated_at).toISOString()).toBe(plan.generated_at);

    expect(['active', 'fallback', 'unavailable']).toContain(plan.status);

    // ── Days array: exactly 7 ──
    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days).toHaveLength(7);

    // ── Per-day validation ──
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayActivityCounts = [];

    for (let i = 0; i < plan.days.length; i++) {
      const day = plan.days[i];

      // Date is a valid ISO date string (YYYY-MM-DD)
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => new Date(day.date + 'T00:00:00Z')).not.toThrow();

      // Activities array with 1-4 entries
      expect(Array.isArray(day.activities)).toBe(true);
      expect(day.activities.length).toBeGreaterThanOrEqual(1);
      expect(day.activities.length).toBeLessThanOrEqual(4);

      dayActivityCounts.push(day.activities.length);

      // Per-activity validation
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
    console.log('✓ Plan status:', plan.status);
    console.log(
      '✓ Day activities summary:',
      dayNames.map((name, i) => `${name}=${dayActivityCounts[i]}`).join(', ')
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

    // Light validation: plan exists with 7 days
    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days).toHaveLength(7);
    expect(plan.status).toBeDefined();
    expect(plan.generated_at).toBeDefined();
  }, 30000); // 30s: DB/cache retrieval
});
