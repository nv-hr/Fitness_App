#!/usr/bin/env node
/**
 * Docker smoke test — builds the full-stack image, starts a container,
 * runs E2E API flow, and cleans up.
 *
 * Usage:
 *   node backend/scripts/smoke-test.js
 *
 * Env vars:
 *   SKIP_DOCKER_BUILD=true  — Reuse existing image (for dev iteration)
 *   SMOKE_IMAGE_TAG=tag     — Image tag (default: fitness-app:smoke-test)
 *   SMOKE_PORT=port         — Host port (default: random OS-assigned)
 *
 * Exit codes: 0 = pass, 1 = fail
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ENV_FILE = path.join(PROJECT_ROOT, 'backend', '.env');

const IMAGE_TAG = process.env.SMOKE_IMAGE_TAG || 'fitness-app:smoke-test';
const SKIP_BUILD = process.env.SKIP_DOCKER_BUILD === 'true';
const HOST_PORT = parseInt(process.env.SMOKE_PORT, 10) || 0;
const CONTAINER_NAME = `fitness-smoke-${Date.now()}`;

async function main() {
  let actualPort = HOST_PORT;
  let containerId = null;

  try {
    // Step 1: Build image (unless SKIP_BUILD)
    if (!SKIP_BUILD) {
      console.log('Building Docker image...');
      execSync(`docker build -t ${IMAGE_TAG} .`, { stdio: 'inherit', cwd: PROJECT_ROOT, timeout: 300000 });
      console.log('Image built');
    }

    // Step 2: Start container
    console.log('Starting container...');
    const runArgs = [
      'docker run -d',
      `--name ${CONTAINER_NAME}`,
      HOST_PORT ? `-p ${HOST_PORT}:3001` : '-P',
      `--env-file "${ENV_FILE}"`,
      IMAGE_TAG,
    ].join(' ');
    containerId = execSync(runArgs, { encoding: 'utf8', cwd: PROJECT_ROOT, timeout: 30000 }).trim();

    // Step 3: Get actual port
    if (!HOST_PORT) {
      const portInfo = execSync(`docker port ${CONTAINER_NAME} 3001/tcp`, { encoding: 'utf8', timeout: 10000 }).trim();
      const portMatch = portInfo.match(/:(\d+)$/);
      if (!portMatch) throw new Error(`Could not parse port from docker port output: "${portInfo}"`);
      actualPort = parseInt(portMatch[1], 10);
    }
    const API_BASE = `http://localhost:${actualPort}`;
    console.log(`Container started on port ${actualPort}`);

    // Step 4: Wait for HEALTHCHECK (up to 60s)
    console.log('Waiting for container to be healthy...');
    const healthStart = Date.now();
    let healthy = false;
    while (Date.now() - healthStart < 60000) {
      const inspect = execSync(`docker inspect ${CONTAINER_NAME}`, { encoding: 'utf8', timeout: 10000 });
      const state = JSON.parse(inspect)[0].State;
      if (state.Health?.Status === 'healthy') {
        console.log('Container healthy');
        healthy = true;
        break;
      }
      if (state.Status === 'exited') {
        throw new Error(`Container exited: ${state.Error || 'unknown error'}`);
      }
      await setTimeout(2000);
    }
    if (!healthy) throw new Error('Container did not become healthy within 60s');

    // Step 5a: Health check
    const healthRes = await fetch(`${API_BASE}/api/health`);
    if (healthRes.status !== 200) throw new Error(`Health check failed: ${healthRes.status}`);
    console.log('/api/health returns 200');

    // Step 5b: Frontend loads
    const indexRes = await fetch(API_BASE);
    const indexHtml = await indexRes.text();
    if (!indexHtml.includes('<title') && !indexHtml.includes('<!DOCTYPE html')) {
      throw new Error('Frontend did not return HTML');
    }
    console.log('Frontend index.html loads');

    // Step 5c: Register user
    const email = `smoke_${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'SmokeT3st!', pdpConsent: true }),
    });
    const regData = await regRes.json();
    if (!regData.success) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    console.log('User registered');
    const cookieHeader = regRes.headers.get('set-cookie');

    // Step 5d: Create profile
    const profileRes = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ weightKg: 70, heightCm: 175, age: 30, gender: 'male', fitnessGoal: 'maintain', activityLevel: 'medium' }),
    });
    const profileData = await profileRes.json();
    if (!profileData.success) throw new Error('Profile creation failed');
    if (!profileData.data.bmi || !profileData.data.tdee) throw new Error('BMI/TDEE not computed');
    console.log(`Profile created — BMI: ${profileData.data.bmi}, TDEE: ${profileData.data.tdee}`);

    // Step 5e: Search and log food
    const searchRes = await fetch(`${API_BASE}/api/food/search?q=chicken`, { headers: { Cookie: cookieHeader } });
    const searchData = await searchRes.json();
    if (!searchData.data?.length) throw new Error('No foods found');
    const today = new Date().toISOString().split('T')[0];
    const logRes = await fetch(`${API_BASE}/api/food/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ foodId: searchData.data[0].id, portionGrams: 200, mealType: 'lunch', logDate: today }),
    });
    const logData = await logRes.json();
    if (!logData.success) throw new Error(`Food log failed: ${JSON.stringify(logData)}`);
    console.log('Food logged');

    // Step 5f: Get daily summary
    const summaryRes = await fetch(`${API_BASE}/api/food/summary?date=${today}`, { headers: { Cookie: cookieHeader } });
    const summaryData = await summaryRes.json();
    if (!summaryData.success) throw new Error('Summary failed');
    if (summaryData.data.totalConsumed === undefined || summaryData.data.totalConsumed === null || !summaryData.data.calorieTarget) throw new Error('Summary data incomplete');
    console.log(`Summary — consumed: ${summaryData.data.totalConsumed}, target: ${summaryData.data.calorieTarget}`);

    console.log('\nSMOKE TEST PASSED');
    process.exit(0);
  } catch (err) {
    console.error(`\nSMOKE TEST FAILED: ${err.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('Cleaning up...');
    try {
      execSync(`docker stop ${CONTAINER_NAME}`, { stdio: 'pipe', timeout: 10000 });
      execSync(`docker rm ${CONTAINER_NAME}`, { stdio: 'pipe', timeout: 10000 });
      console.log('Container stopped and removed');
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  }
}

main();
