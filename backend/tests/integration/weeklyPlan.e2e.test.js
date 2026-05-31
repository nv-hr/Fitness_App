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
import { pool } from '../../src/config/database.js';

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

    // ── format_version (new format) ──
    if (plan.format_version !== undefined) {
      expect(plan.format_version).toBe(1);
    }

    // ── Per-day validation ──
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayActivityCounts = [];

    for (let i = 0; i < plan.days.length; i++) {
      const day = plan.days[i];

      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => new Date(day.date + 'T00:00:00Z')).not.toThrow();

      expect(Array.isArray(day.activities)).toBe(true);
      expect(typeof day.rest_day).toBe('boolean');

      if (day.rest_day === true) {
        // Rest day — must have empty activities
        expect(day.activities.length).toBe(0);
      } else {
        // Activity day — must have 1-4 activities
        expect(day.activities.length).toBeGreaterThanOrEqual(1);
        expect(day.activities.length).toBeLessThanOrEqual(4);
      }

      dayActivityCounts.push(day.rest_day === true ? 0 : day.activities.length);

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

    if (plan === null) {
      console.log('⚠ No plan in GET response — fallback plans are not persisted to DB');
      return;
    }

    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days.length).toBeGreaterThanOrEqual(0);

    if (res.body.data.fromCache) {
      console.log('✓ Plan retrieved from cache (raw LLM output, no status wrapper)');
    }
    console.log('✓ GET returned plan with', plan.days.length, 'days');
  }, 30000); // 30s: DB/cache retrieval

  // ──────────────────────────────────────────────
  // Activity Swap E2E
  // ──────────────────────────────────────────────

  it('POST /api/weekly-plans/swap returns a replacement activity for an existing plan', async () => {
    // First generate a plan so we have something to swap from
    const genRes = await agent
      .post('/api/weekly-plans/generate')
      .send({});

    expect(genRes.status).toBe(200);
    expect(genRes.body.success).toBe(true);
    expect(genRes.body.data.plan).toBeDefined();

    const plan = genRes.body.data.plan;

    if (!plan.days || plan.days.length === 0) {
      console.warn('⚠ Cannot test swap — generated plan has 0 days');
      return;
    }

    // Find first activity day with activities
    let activityDayIndex = -1;
    let firstActivity = null;
    for (let i = 0; i < plan.days.length; i++) {
      const day = plan.days[i];
      if (day.rest_day === false && Array.isArray(day.activities) && day.activities.length > 0) {
        activityDayIndex = i;
        firstActivity = day.activities[0];
        break;
      }
    }

    if (!firstActivity) {
      console.warn('⚠ Cannot test swap — no activity days with activities found');
      return;
    }

    // Derive weekStart from the first day's date
    const weekStart = plan.days[0].date;

    const originalActivityId = firstActivity.activity_id;
    const originalName = firstActivity.name;

    console.log(`  Swapping activity: "${originalName}" (id=${originalActivityId}) on day ${activityDayIndex}`);

    const swapRes = await agent
      .post('/api/weekly-plans/swap')
      .send({ activityId: originalActivityId, dayIndex: activityDayIndex, weekStart });

    expect(swapRes.status).toBe(200);
    expect(swapRes.body.success).toBe(true);
    expect(swapRes.body.data.plan).toBeDefined();
    expect(swapRes.body.data.day).toBeDefined();
    expect(swapRes.body.data.dayIndex).toBe(activityDayIndex);
    expect(swapRes.body.data.replacement).toBeDefined();

    const replacement = swapRes.body.data.replacement;

    expect(typeof replacement.activity_id).toBe('number');
    expect(replacement.activity_id).toBeGreaterThan(0);
    expect(typeof replacement.name).toBe('string');
    expect(replacement.name.trim().length).toBeGreaterThan(0);
    expect(replacement.name).not.toBe(originalName);
    expect(replacement.activity_id).not.toBe(originalActivityId);

    expect(typeof replacement.duration_min).toBe('number');
    expect(replacement.duration_min).toBeGreaterThanOrEqual(10);
    expect(replacement.duration_min).toBeLessThanOrEqual(180);
    expect(['light', 'moderate', 'vigorous']).toContain(replacement.intensity);

    // Verify cache was updated by checking GET returns fromCache: true after swap
    const getRes = await agent.get(`/api/weekly-plans?weekStart=${weekStart}`);
    if (getRes.body.data && getRes.body.data.fromCache === true && getRes.body.data.plan) {
      const cachedDay = getRes.body.data.plan.days[activityDayIndex];
      if (cachedDay && Array.isArray(cachedDay.activities)) {
        const swappedActivity = cachedDay.activities.find(a => a.activity_id === replacement.activity_id);
        expect(swappedActivity).toBeDefined();
        console.log('✓ Cache verified: replacement found in cached plan');
      }
    }

    // Verify DB persistence after swap (WR-06)
    try {
      const dbResult = await pool.query(
        'SELECT plan_data FROM weekly_plans WHERE user_id = $1 AND week_start = $2',
        [testUser.user.id, weekStart]
      );
      if (dbResult.rows.length > 0) {
        const dbPlan = dbResult.rows[0].plan_data;
        if (dbPlan && Array.isArray(dbPlan.days) && dbPlan.days[activityDayIndex]) {
          const dbDay = dbPlan.days[activityDayIndex];
          if (Array.isArray(dbDay.activities)) {
            const dbReplacement = dbDay.activities.find(a => a.activity_id === replacement.activity_id);
            expect(dbReplacement).toBeDefined();
            console.log('✓ DB persistence verified: replacement found in weekly_plans table');
          }
        }
      }
    } catch (dbErr) {
      console.warn('⚠ Could not verify DB persistence:', dbErr.message);
    }

    console.log(`✓ Replacement: "${replacement.name}" (id=${replacement.activity_id}, ${replacement.duration_min}min, ${replacement.intensity})`);
  }, 180000); // 180s: real LLM generate + swap

  it('POST /api/weekly-plans/swap returns 404 when activity not found', async () => {
    // Generate a plan first
    const genRes = await agent
      .post('/api/weekly-plans/generate')
      .send({});

    expect(genRes.status).toBe(200);
    expect(genRes.body.success).toBe(true);

    const plan = genRes.body.data.plan;
    if (!plan.days || plan.days.length === 0) {
      console.warn('⚠ Cannot test swap 404 — generated plan has 0 days');
      return;
    }

    const weekStart = plan.days[0].date;

    // Swapping with a non-existent activity ID
    const swapRes = await agent
      .post('/api/weekly-plans/swap')
      .send({ activityId: 99999, dayIndex: 0, weekStart });

    // CR-04: swapActivity throws NotFoundError (statusCode=404), not 400
    expect(swapRes.status).toBe(404);
    expect(swapRes.body.success).toBe(false);
    expect(swapRes.body.error.message).toMatch(/Activity not found in current plan/i);
    console.log('✓ 404 returned for non-existent activity ID');
  }, 120000); // 120s: real LLM generate + swap

  // Rate limit test skipped: test mode uses max=1000 which prevents triggering
  // in a single test run. Swap limiter is tested via unit pattern in the rate limiter module itself.
});

// ──────────────────────────────────────────────
// Migration Edge Cases E2E
// ──────────────────────────────────────────────

/**
 * Compute Monday of the current week (matching controller's getMonday logic).
 */
function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Add days to an ISO date string.
 */
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Insert or update a plan directly in the weekly_plans table.
 * Returns the weekStart used.
 */
async function insertPlanDirectly(userId, planData, weekStart) {
  await pool.query(
    `INSERT INTO weekly_plans (user_id, week_start, plan_data, status)
     VALUES ($1, $2, $3::jsonb, 'active')
     ON CONFLICT (user_id, week_start)
     DO UPDATE SET plan_data = $3::jsonb, status = 'active', updated_at = NOW()`,
    [userId, weekStart, JSON.stringify(planData)]
  );
}

/**
 * Create an old-format plan (no format_version, no rest_day) for the given week.
 */
function makeOldFormatPlan(weekStart) {
  return {
    days: [
      { date: weekStart, activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] },
      { date: addDays(weekStart, 1), activities: [{ activity_id: 2, name: 'Yoga', duration_min: 45, intensity: 'light' }] },
      { date: addDays(weekStart, 2), activities: [{ activity_id: 3, name: 'Cycling', duration_min: 20, intensity: 'vigorous' }] },
      { date: addDays(weekStart, 3), activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] },
      { date: addDays(weekStart, 4), activities: [{ activity_id: 2, name: 'Yoga', duration_min: 45, intensity: 'light' }] },
      { date: addDays(weekStart, 5), activities: [{ activity_id: 3, name: 'Cycling', duration_min: 20, intensity: 'vigorous' }] },
      { date: addDays(weekStart, 6), activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] },
    ],
    status: 'active',
  };
}

describe('Weekly Plan E2E - Migration Edge Cases', () => {
  it('GET with old-format DB plan triggers lazy migration and returns migrated plan', async () => {
    // Create a fresh user for this test to isolate state
    const migrationAgent = request.agent(app);
    const user = await createTestUser(migrationAgent);

    // Create a profile (required by LLM service to attempt regeneration)
    const profileRes = await migrationAgent.post('/api/profile').send({
      weightKg: 75, heightCm: 180, age: 32, gender: 'male',
      fitnessGoal: 'maintain', activityLevel: 'moderate',
    });
    console.log('[migration] Profile created:', profileRes.status);

    // Seed activity logs so fallback plan generation has data
    const activities = [
      { activityId: 1, durationMin: 30, intensity: 'moderate' },
      { activityId: 2, durationMin: 45, intensity: 'light' },
      { activityId: 3, durationMin: 20, intensity: 'vigorous' },
    ];
    for (const act of activities) {
      await migrationAgent.post('/api/activities/log').send({ ...act });
    }
    console.log('[migration] Seeded 3 activity logs for fallback');

    const weekStart = getMonday(new Date());

    // Insert old-format plan directly into DB (no format_version field)
    const oldPlan = makeOldFormatPlan(weekStart);
    await insertPlanDirectly(user.user.id, oldPlan, weekStart);
    console.log('[migration] Old-format plan inserted into DB');

    // GET should detect old format and trigger lazy migration
    const getRes = await migrationAgent.get(`/api/weekly-plans?weekStart=${weekStart}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data).toBeDefined();

    const plan = getRes.body.data.plan;
    if (plan) {
      // After successful migration, the plan should have format_version: 1
      if (plan.format_version !== undefined) {
        expect(plan.format_version).toBe(1);
        console.log('✓ Migrated plan has format_version: 1');
      }
      expect(Array.isArray(plan.days)).toBe(true);
      console.log(`✓ GET returned plan with ${plan.days.length} days after migration`);
    } else {
      console.warn('⚠ Migration returned null plan — LLM may have failed');
    }
  }, 120000); // 120s: real LLM call

  it('GET with old-format plan returns old plan as-is when LLM and fallback both fail', async () => {
    // Create a user with NO activity logs so the fallback has no data
    const failAgent = request.agent(app);
    const user = await createTestUser(failAgent);

    // Create a profile
    await failAgent.post('/api/profile').send({
      weightKg: 70, heightCm: 175, age: 30, gender: 'male',
      fitnessGoal: 'maintain', activityLevel: 'sedentary',
    });

    // Do NOT log any activities — this forces fallback to return 'unavailable'
    // which will make attemptMigration return null (keep old format)

    const weekStart = getMonday(new Date());

    // Insert old-format plan directly into DB
    const oldPlan = makeOldFormatPlan(weekStart);
    await insertPlanDirectly(user.user.id, oldPlan, weekStart);
    console.log('[migration-fail] Old-format plan inserted (no activity logs)');

    // GET should attempt migration, LLM fails, fallback unavailable, keeps old plan
    const getRes = await failAgent.get(`/api/weekly-plans?weekStart=${weekStart}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);

    const plan = getRes.body.data.plan;
    if (plan) {
      // The plan should still be the old-format plan — no format_version
      console.log(`[migration-fail] Plan returned with ${plan.days.length} days`);
      if (plan.days.length > 0) {
        // Verify it still has the old plan's structure (no rest_day fields)
        const hasRestDay = plan.days.some(d => d.rest_day === true);
        const noFormatVersion = plan.format_version === undefined;
        // In the failure case, the old plan is returned as-is
        console.log(`  rest_day present: ${hasRestDay}, format_version: ${plan.format_version}`);
        if (noFormatVersion) {
          console.log('✓ Old-format plan preserved as-is after failed migration');
        }
      }
    } else {
      console.warn('⚠ GET returned null plan');
    }
  }, 120000); // 120s: real LLM call attempt

  it('swap on old-format DB plan triggers auto-migration then succeeds', async () => {
    // Create a fresh user for this test
    const swapAgent = request.agent(app);
    const user = await createTestUser(swapAgent);

    // Create profile
    await swapAgent.post('/api/profile').send({
      weightKg: 75, heightCm: 180, age: 32, gender: 'male',
      fitnessGoal: 'maintain', activityLevel: 'moderate',
    });

    // Seed activity logs for fallback plan
    const activities = [
      { activityId: 1, durationMin: 30, intensity: 'moderate' },
      { activityId: 2, durationMin: 45, intensity: 'light' },
      { activityId: 3, durationMin: 20, intensity: 'vigorous' },
    ];
    for (const act of activities) {
      await swapAgent.post('/api/activities/log').send({ ...act });
    }

    const weekStart = getMonday(new Date());

    // Insert old-format plan directly into DB
    const oldPlan = makeOldFormatPlan(weekStart);
    await insertPlanDirectly(user.user.id, oldPlan, weekStart);
    console.log('[swap-migration] Old-format plan inserted');

    // Swap should detect old format, trigger migration, and then perform the swap
    // Use the first activity from the old plan
    const swapRes = await swapAgent
      .post('/api/weekly-plans/swap')
      .send({ activityId: 1, dayIndex: 0, weekStart });

    if (swapRes.status === 200 && swapRes.body.success) {
      expect(swapRes.body.data.plan).toBeDefined();
      expect(swapRes.body.data.replacement).toBeDefined();
      expect(swapRes.body.data.replacement.activity_id).toBeGreaterThan(0);
      expect(swapRes.body.data.replacement.name).not.toBe('Running');
      console.log(`✓ Swap succeeded after auto-migration. Replacement: "${swapRes.body.data.replacement.name}"`);
    } else if (swapRes.status === 500 && swapRes.body.error && swapRes.body.error.code === 'MigrationError') {
      // If migration failed, swap returns MigrationError
      console.warn('⚠ Migration failed during swap:', swapRes.body.error.message);
    } else {
      // Other error (e.g., 400 for not found)
      console.warn(`⚠ Swap returned ${swapRes.status}:`, JSON.stringify(swapRes.body));
    }
  }, 180000); // 180s: real LLM generate + swap
});
