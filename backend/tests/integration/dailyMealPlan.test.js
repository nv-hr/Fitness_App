import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser } from './helpers.js';

let agent;
let testUser;

beforeAll(async () => {
  await startDatabase();
  agent = request.agent(app);
  testUser = await createTestUser(agent);

  // Seed profile
  await agent.post('/api/profile').send({
    weightKg: 70,
    heightCm: 175,
    age: 30,
    gender: 'male',
    fitnessGoal: 'maintain',
    activityLevel: 'moderate',
  });
}, 60000);

afterAll(async () => {
  await stopDatabase();
}, 30000);

describe('POST /api/daily-meal-plans/generate', () => {
  it('should generate a meal plan via LLM successfully', async () => {
    // The endpoint generates for a whole week given a weekStart, or daily?
    // Wait, let me check the endpoint name in remaining-endpoints: `POST /api/daily-meal-plans/generate` takes `date`
    // Actually the daily meal plan controller was changed to generate for a single day? Wait, dailyMealPlan endpoint handles weekly plan generation or daily?
    // Let me verify the endpoint structure in tests. `generateAgent.post('/api/daily-meal-plans/generate').send({ date: 'bad-date' })`
    // So we'll pass a valid date
    const res = await agent.post('/api/daily-meal-plans/generate').send({
      date: '2026-06-08'
    });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const data = res.body.data;
    expect(data.plan).toBeDefined();
    
    // Check if the plan looks like a daily meal plan
    expect(Array.isArray(data.plan.meals)).toBe(true);
    expect(data.plan.meals.length).toBeGreaterThan(0);
    
    const firstMeal = data.plan.meals[0];
    expect(firstMeal).toHaveProperty('meal_type');
    expect(Array.isArray(firstMeal.items)).toBe(true);
  }, 45000); // 45s timeout because LLM generation for meal plan can be large
});
