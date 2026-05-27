/**
 * Backend integration tests — all 16 endpoints against a real MySQL database.
 *
 * Prerequisites:
 *   1. Docker Desktop or Podman (for MySQL container)
 *   2. .env file with JWT_SECRET, DB_USER, DB_PASSWORD
 *
 * Usage:
 *   cd backend
 *   node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration
 *
 * @see PLAN.md — 260527-cn0-test-all-backend-endpoint-and-its-integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser, seedTestData } from './helpers.js';

/** @type {import('supertest').SuperAgentTest} */
let agent;
let testUser;
let seededProfile;
let seededFoodId;
let today;

beforeAll(async () => {
  // 1. Start MySQL via docker-compose
  await startDatabase();

  // 2. Create a fresh authenticated agent for protected routes
  agent = request.agent(app);
  testUser = await createTestUser(agent);

  // 3. Seed profile + food log entries
  const seed = await seedTestData(agent);
  seededProfile = seed.profile;

  // Grab the first seeded food ID for log tests
  const searchRes = await agent.get('/api/food/search?q=chicken');
  if (searchRes.body.data?.length) {
    seededFoodId = searchRes.body.data[0].id;
  }

  today = new Date().toISOString().split('T')[0];
}, 120000); // 2-minute timeout for DB startup

afterAll(async () => {
  await stopDatabase();
}, 30000);

// ──────────────────────────────────────────────
// Auth Endpoints  (4 routes, 10 test cases)
// ──────────────────────────────────────────────

describe('Auth Endpoints', () => {
  // ── POST /api/auth/register ──

  describe('POST /api/auth/register', () => {
    const uniqueEmail = () =>
      `reg_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

    it('should register a new user with valid data → 201 + cookie set', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail(), password: 'TestP@ss123', pdpConsent: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBeDefined();
      expect(res.body.data.user.pdpConsent).toBe(true);
      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined();
      const cookieHeader = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie'].join('; ')
        : res.headers['set-cookie'];
      expect(cookieHeader).toContain('token=');
    });

    it('should reject registration with missing email → 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'TestP@ss123', pdpConsent: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with missing pdpConsent → 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail(), password: 'TestP@ss123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/pdp.?consent/i);
    });

    it('should reject registration with duplicate email → 400 VALIDATION_ERROR', async () => {
      const email = uniqueEmail();
      // First registration — succeeds
      await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Second registration with same email — fails
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/already registered/i);
    });
  });

  // ── POST /api/auth/login ──

  describe('POST /api/auth/login', () => {
    // Create a dedicated user for login tests
    const loginEmail = `login_test_${Date.now()}@example.com`;
    const loginPassword = 'LoginP@ss456';

    beforeAll(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: loginEmail, password: loginPassword, pdpConsent: true });
    });

    it('should login with valid credentials → 200 + cookie set', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: loginPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(loginEmail);
      // Cookie should be set
      const cookieHeader = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie'].join('; ')
        : res.headers['set-cookie'];
      expect(cookieHeader).toContain('token=');
    });

    it('should reject login with wrong password → 401 AUTHENTICATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: 'WrongP@ss999' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject login with non-existent email → 401 AUTHENTICATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent_' + Date.now() + '@example.com', password: 'TestP@ss123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  // ── POST /api/auth/logout ──

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie → 200 + cleared cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Cookie should be cleared (max-age=0 or expires in past)
      const cookieHeader = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie'].join('; ')
        : res.headers['set-cookie'];
      expect(cookieHeader).toContain('token=');
      expect(
        cookieHeader.includes('Max-Age=0') ||
        cookieHeader.includes('Expires=Thu, 01 Jan 1970') ||
        cookieHeader.includes('expires=Thu, 01 Jan 1970')
      ).toBe(true);
    });
  });

  // ── GET /api/auth/me ──

  describe('GET /api/auth/me', () => {
    it('should reject request without token → 401 AUTHENTICATION_ERROR', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return current user with valid token → 200 + user object', async () => {
      const authAgent = request.agent(app);
      await authAgent
        .post('/api/auth/register')
        .send({
          email: `me_test_${Date.now()}@example.com`,
          password: 'TestP@ss123',
          pdpConsent: true,
        });

      const res = await authAgent.get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.email).toBeDefined();
      expect(res.body.data.pdp_consent).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });
  });
});

// ──────────────────────────────────────────────
// Profile Endpoints  (3 routes, 6 test cases)
// ──────────────────────────────────────────────

describe('Profile Endpoints', () => {
  let profileAgent;

  beforeAll(() => {
    profileAgent = request.agent(app);
  });

  describe('POST /api/profile', () => {
    it('should create profile with valid data → 201 + bmi/tdee', async () => {
      const email = `profile_create_${Date.now()}@example.com`;
      await profileAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      const res = await profileAgent.post('/api/profile').send({
        weightKg: 70,
        heightCm: 175,
        age: 30,
        gender: 'male',
        fitnessGoal: 'maintain',
        activityLevel: 'medium',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.weight_kg).toBe('70.00');
      expect(res.body.data.bmi).toBeDefined();
      expect(res.body.data.bmiCategory).toBeDefined();
      expect(res.body.data.tdee).toBeDefined();
      expect(res.body.data.tdeeRange).toBeDefined();
      expect(res.body.data.calorieTarget).toBeDefined();
    });

    it('should reject profile creation without auth → 401', async () => {
      const res = await request(app).post('/api/profile').send({
        weightKg: 70,
        heightCm: 175,
        age: 30,
        gender: 'male',
        fitnessGoal: 'maintain',
      });

      expect(res.status).toBe(401);
    });

    it('should reject profile creation with missing weightKg → 400', async () => {
      // Use a new authAgent for this test
      const authAgent = request.agent(app);
      await authAgent
        .post('/api/auth/register')
        .send({
          email: `profile_invalid_${Date.now()}@example.com`,
          password: 'TestP@ss123',
          pdpConsent: true,
        });

      const res = await authAgent.post('/api/profile').send({
        heightCm: 175,
        age: 30,
        gender: 'male',
        fitnessGoal: 'maintain',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/profile', () => {
    let getAgent;

    beforeAll(async () => {
      getAgent = request.agent(app);
      const email = `profile_get_${Date.now()}@example.com`;
      await getAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });
    });

    it('should return 404 when no profile exists', async () => {
      const res = await getAgent.get('/api/profile');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return profile when it exists → 200', async () => {
      // First create the profile
      await getAgent.post('/api/profile').send({
        weightKg: 80,
        heightCm: 180,
        age: 25,
        gender: 'female',
        fitnessGoal: 'lose_weight',
        activityLevel: 'high',
      });

      const res = await getAgent.get('/api/profile');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.weight_kg).toBe('80.00');
      expect(res.body.data.bmi).toBeDefined();
      expect(res.body.data.bmiCategory).toBeDefined();
    });
  });

  describe('PUT /api/profile', () => {
    let updateAgent;

    beforeAll(async () => {
      updateAgent = request.agent(app);
      const email = `profile_update_${Date.now()}@example.com`;
      await updateAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Create initial profile
      await updateAgent.post('/api/profile').send({
        weightKg: 90,
        heightCm: 180,
        age: 35,
        gender: 'male',
        fitnessGoal: 'gain_weight',
        activityLevel: 'low',
      });
    });

    it('should update profile and recalculate bmi/tdee → 200', async () => {
      const res = await updateAgent.put('/api/profile').send({
        weightKg: 75,
        heightCm: 180,
        age: 35,
        gender: 'male',
        fitnessGoal: 'maintain',
        activityLevel: 'medium',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.weight_kg).toBe('75.00');
      // BMI should change: 75 / (1.8^2) ≈ 23.1
      expect(res.body.data.bmi).toBeGreaterThan(20);
      expect(res.body.data.bmiCategory).toBeDefined();
      expect(res.body.data.tdee).toBeDefined();
    });
  });
});

// ──────────────────────────────────────────────
// Food Endpoints  (7 routes, 13 test cases)
// ──────────────────────────────────────────────

describe('Food Endpoints', () => {
  describe('GET /api/food/search', () => {
    let searchAgent;

    beforeAll(async () => {
      searchAgent = request.agent(app);
      const email = `food_search_${Date.now()}@example.com`;
      await searchAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });
    });

    it('should return matching foods for valid query → 200 + array', async () => {
      const res = await searchAgent.get('/api/food/search?q=chicken');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      // All returned foods should match "chicken"
      for (const food of res.body.data) {
        expect(food.name.toLowerCase()).toContain('chicken');
      }
    });

    it('should reject single-character query → 400 VALIDATION_ERROR', async () => {
      const res = await searchAgent.get('/api/food/search?q=a');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return empty array for non-existent food → 200 + []', async () => {
      const res = await searchAgent.get('/api/food/search?q=ZZZZNOTEXIST');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('POST /api/food', () => {
    let foodAgent;

    beforeAll(async () => {
      foodAgent = request.agent(app);
      const email = `food_create_${Date.now()}@example.com`;
      await foodAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });
    });

    it('should create a custom food with valid data → 201 + is_custom: true', async () => {
      const res = await foodAgent.post('/api/food').send({
        name: 'Test Protein Shake',
        calories_per_100g: 120,
        category: 'drinks',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Test Protein Shake');
      expect(res.body.data.is_custom).toBe(1);
      expect(res.body.data.calories_per_100g).toBe(120);
    });

    it('should reject custom food with empty name → 400 VALIDATION_ERROR', async () => {
      const res = await foodAgent.post('/api/food').send({
        name: '',
        calories_per_100g: 100,
        category: 'other',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/food/log', () => {
    let logAgent;
    let logFoodId;

    beforeAll(async () => {
      logAgent = request.agent(app);
      const email = `food_log_${Date.now()}@example.com`;
      await logAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Get a seeded food ID for foodId-based tests
      const searchRes = await logAgent.get('/api/food/search?q=rice');
      if (searchRes.body.data?.length) {
        logFoodId = searchRes.body.data[0].id;
      }
    });

    it('should log a seeded food with foodId + portion → 201', async () => {
      if (!logFoodId) {
        throw new Error('No seeded food found for log test — check init.sql seed data');
      }

      const res = await logAgent.post('/api/food/log').send({
        foodId: logFoodId,
        portionGrams: 150,
        mealType: 'dinner',
        logDate: today,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.food_id).toBe(logFoodId);
      expect(res.body.data.portion_grams).toBe(150);
      expect(res.body.data.meal_type).toBe('dinner');
    });

    it('should log a custom entry with customFoodName + calories → 201', async () => {
      const res = await logAgent.post('/api/food/log').send({
        customFoodName: 'Homemade Smoothie',
        calories: 350,
        portionGrams: 300,
        mealType: 'breakfast',
        logDate: today,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.custom_food_name).toBe('Homemade Smoothie');
      expect(res.body.data.calories).toBe(350);
    });

    it('should reject log with invalid mealType → 400 VALIDATION_ERROR', async () => {
      const res = await logAgent.post('/api/food/log').send({
        foodId: logFoodId,
        portionGrams: 100,
        mealType: 'invalid_meal',
        logDate: today,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject log with portion > 5000 → 400 VALIDATION_ERROR', async () => {
      const res = await logAgent.post('/api/food/log').send({
        foodId: logFoodId,
        portionGrams: 5001,
        mealType: 'lunch',
        logDate: today,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/food/summary', () => {
    let summaryAgent;

    beforeAll(async () => {
      summaryAgent = request.agent(app);
      const email = `food_summary_${Date.now()}@example.com`;
      await summaryAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Create profile with activity level so calorieTarget is computed
      await summaryAgent.post('/api/profile').send({
        weightKg: 65,
        heightCm: 165,
        age: 28,
        gender: 'female',
        fitnessGoal: 'maintain',
        activityLevel: 'medium',
      });

      // Log some food so totalConsumed > 0
      const searchRes = await summaryAgent.get('/api/food/search?q=banana');
      if (searchRes.body.data?.length) {
        await summaryAgent.post('/api/food/log').send({
          foodId: searchRes.body.data[0].id,
          portionGrams: 120,
          mealType: 'breakfast',
          logDate: today,
        });
      }
    });

    it('should return daily summary with balance data → 200', async () => {
      const res = await summaryAgent.get(`/api/food/summary?date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.date).toBe(today);
      expect(res.body.data.totalConsumed).toBeGreaterThan(0);
      expect(res.body.data.calorieTarget).toBeDefined();
      expect(res.body.data.calorieTarget).toBeGreaterThan(0);
      expect(res.body.data.remaining).toBeDefined();
      expect(typeof res.body.data.isExtremeDeficit).toBe('boolean');
    });
  });

  describe('GET /api/food/logs', () => {
    let logsAgent;

    beforeAll(async () => {
      logsAgent = request.agent(app);
      const email = `food_logs_${Date.now()}@example.com`;
      await logsAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Log a food entry so the logs endpoint has data
      const searchRes = await logsAgent.get('/api/food/search?q=apple');
      if (searchRes.body.data?.length) {
        await logsAgent.post('/api/food/log').send({
          foodId: searchRes.body.data[0].id,
          portionGrams: 150,
          mealType: 'snack',
          logDate: today,
        });
      }
    });

    it('should return daily log entries → 200 + array', async () => {
      const res = await logsAgent.get(`/api/food/logs?date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Check log entry shape
      const logEntry = res.body.data[0];
      expect(logEntry.id).toBeDefined();
      expect(logEntry.calories).toBeDefined();
      expect(logEntry.meal_type).toBeDefined();
    });
  });

  describe('GET /api/food/history', () => {
    let historyAgent;

    beforeAll(async () => {
      historyAgent = request.agent(app);
      const email = `food_history_${Date.now()}@example.com`;
      await historyAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Log food for today to have history data
      const searchRes = await historyAgent.get('/api/food/search?q=bread');
      if (searchRes.body.data?.length) {
        await historyAgent.post('/api/food/log').send({
          foodId: searchRes.body.data[0].id,
          portionGrams: 100,
          mealType: 'breakfast',
          logDate: today,
        });
      }
    });

    it('should return calorie history for past days → 200 + array', async () => {
      const res = await historyAgent.get('/api/food/history?days=7');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Should have at least today's entry
      expect(res.body.data.length).toBeGreaterThan(0);
      // Check shape
      const entry = res.body.data[0];
      expect(entry.log_date).toBeDefined();
      expect(entry.total_calories).toBeDefined();
    });
  });

  describe('GET /api/food/recent', () => {
    let recentAgent;

    beforeAll(async () => {
      recentAgent = request.agent(app);
      const email = `food_recent_${Date.now()}@example.com`;
      await recentAgent
        .post('/api/auth/register')
        .send({ email, password: 'TestP@ss123', pdpConsent: true });

      // Log a couple of items so recent foods has data
      const chickenRes = await recentAgent.get('/api/food/search?q=chicken');
      if (chickenRes.body.data?.length) {
        await recentAgent.post('/api/food/log').send({
          foodId: chickenRes.body.data[0].id,
          portionGrams: 200,
          mealType: 'lunch',
          logDate: today,
        });
      }

      const eggRes = await recentAgent.get('/api/food/search?q=egg');
      if (eggRes.body.data?.length) {
        await recentAgent.post('/api/food/log').send({
          foodId: eggRes.body.data[0].id,
          portionGrams: 100,
          mealType: 'breakfast',
          logDate: today,
        });
      }
    });

    it('should return recently logged foods → 200 + array', async () => {
      const res = await recentAgent.get('/api/food/recent');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Check shape
      const recent = res.body.data[0];
      expect(recent.name).toBeDefined();
      expect(recent.last_portion_grams).toBeDefined();
    });
  });
});

// ──────────────────────────────────────────────
// Activity Endpoints  (2 routes, 2 test cases)
// ──────────────────────────────────────────────

describe('Activity Endpoints', () => {
  let activityAgent;

  beforeAll(async () => {
    activityAgent = request.agent(app);
    const email = `activity_${Date.now()}@example.com`;
    await activityAgent
      .post('/api/auth/register')
      .send({ email, password: 'TestP@ss123', pdpConsent: true });

    // Create a profile with a fitness goal so recommendations are goal-filtered
    await activityAgent.post('/api/profile').send({
      weightKg: 75,
      heightCm: 170,
      age: 32,
      gender: 'male',
      fitnessGoal: 'lose_weight',
      activityLevel: 'high',
    });
  });

  describe('GET /api/activities/recommendations', () => {
    it('should return goal-based activity recommendations → 200 + { activities, count }', async () => {
      const res = await activityAgent.get('/api/activities/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.activities)).toBe(true);
      expect(typeof res.body.data.count).toBe('number');
      expect(res.body.data.count).toBe(res.body.data.activities.length);
      // With lose_weight goal, all activities should have lose_weight tag
      for (const activity of res.body.data.activities) {
        expect(activity.goal_tags).toBeDefined();
      }
    });
  });

  describe('GET /api/activities', () => {
    it('should return all activities filtered by goal → 200 + { activities, total }', async () => {
      const res = await activityAgent.get('/api/activities');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.activities)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
      expect(res.body.data.total).toBe(res.body.data.activities.length);
      // With lose_weight goal, should return lose_weight tagged activities
      expect(res.body.data.activities.length).toBeGreaterThan(0);
    });
  });
});
