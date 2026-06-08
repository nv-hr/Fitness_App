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
    fitnessGoal: 'muscle',
    activityLevel: 'active',
  });
}, 60000);

afterAll(async () => {
  await stopDatabase();
}, 30000);

describe('POST /api/activity-plans/generate', () => {
  it('should generate an activity plan via LLM successfully', async () => {
    const res = await agent.post('/api/activity-plans/generate').send({
      date: '2026-06-08'
    });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const data = res.body.data;
    expect(data.plan).toBeDefined();
    
    // Check if the plan looks like an activity plan
    expect(Array.isArray(data.plan.activities)).toBe(true);
    expect(data.plan.activities.length).toBeGreaterThan(0);
    
    const firstActivity = data.plan.activities[0];
    expect(firstActivity).toHaveProperty('activity_id');
    expect(firstActivity).toHaveProperty('name');
    expect(firstActivity).toHaveProperty('duration_min');
    expect(firstActivity).toHaveProperty('intensity');
  }, 30000); // 30s timeout because LLM takes a while
});
