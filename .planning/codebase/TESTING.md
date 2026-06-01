# Testing Patterns

**Analysis Date:** 2026-06-02

## Test Framework

**Backend Runner:**
- **Jest** v30.4.2
- Config: inline in `backend/package.json` under `"jest"` key:
  ```json
  "jest": {
    "setupFiles": ["./jest.setup.js"]
  }
  ```
- ESM support via `--experimental-vm-modules` flag

**Frontend Runner:**
- **Vitest** (bundled with Vite v8)
- Config: `frontend/vitest.config.js`:
  ```js
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.js'],
    },
  });
  ```
- React Testing Library + jest-dom matchers via `frontend/vitest.setup.js`:
  ```js
  import '@testing-library/jest-dom';
  ```

**Run Commands:**

**Backend (Jest):**
```bash
# All tests
cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand

# Unit tests only
cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPatterns __tests__ tests/unit

# Integration tests only
cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --testPathPatterns tests/integration
```

**Frontend (Vitest):**
```bash
cd frontend && npx vitest run     # Run all tests once
cd frontend && npx vitest          # Watch mode
cd frontend && npx vitest --coverage  # Coverage report
```

## Test File Organization

**Backend (`backend/tests/`):**
```
backend/tests/
  unit/
    auth.service.test.js          # Auth service unit tests
    activity.service.test.js      # Activity service unit tests
    food.service.test.js          # Food service unit tests
    llm.service.test.js           # LLM service unit tests (674 lines)
    profile.service.test.js       # Profile service unit tests
    dbErrors.test.js              # DB error utils unit tests
  integration/
    api.test.js                   # General API integration tests
    remaining-endpoints.test.js   # Uncovered endpoint integration tests (400 lines)
    weeklyPlan.e2e.test.js        # Weekly plan E2E integration tests
    helpers.js                    # Test schema lifecycle + test data seeding
```

**Frontend (co-located `__tests__/` directories):**
```
frontend/src/features/activities/components/__tests__/
  ActivityHistory.test.jsx
  ActivityLogForm.test.jsx
  ActivitySummary.test.jsx

frontend/src/features/food-log/components/__tests__/
  previewCalories.test.js

frontend/src/features/progress/components/__tests__/
  ProgressPage.test.jsx
  TrendPredictionCard.test.jsx
  WeightTrendChart.test.jsx

frontend/src/features/progress/hooks/__tests__/
  useTrendPrediction.test.js

frontend/src/features/weekly-plan/components/__tests__/
  DayActivityRow.test.jsx

frontend/src/shared/calendar/__tests__/
  CalendarGrid.test.jsx
  CalendarPageLayout.test.jsx
  DayDetailPanel.test.jsx
  calendarUtils.test.js
  useMonthData.test.js

frontend/src/__tests__/
  api-integration.test.js

frontend/tests/
  CustomFoodForm.test.js
```

## Test Structure

**Backend Suite Organization (Jest):**
```js
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
// ESM imports of units under test

describe('validatePlanStructure', () => {
  function makeValidDay(date) {
    // helper within describe block
  }

  it('valid 7-day plan passes', () => {
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('missing days array returns error', () => {
    const result = validatePlanStructure({}, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('days');
  });
});
```

**Frontend Suite Organization (Vitest):**
```js
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityHistory from '../ActivityHistory.jsx';

describe('ActivityHistory', () => {
  test('renders "Activity History" heading', () => {
    render(<ActivityHistory history={[]} onDelete={vi.fn()} />);
    expect(screen.getByText('Activity History')).toBeInTheDocument();
  });

  test('calls onDelete with entry id when delete is clicked', () => {
    const onDelete = vi.fn();
    render(<ActivityHistory history={mockHistory} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('2026-01-05').closest('div'));
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
```

**Patterns:**
- Backend: `describe`/`it` blocks, `@jest/globals` explicit imports
- Frontend: `describe`/`test` blocks, `vi.fn()` for mocks, `vi.clearAllMocks()` in `beforeEach`
- Integration tests: `beforeAll`/`afterAll` for setup/teardown, `60s` timeout for DB setup
- Suites are organized by function/module (unit) or endpoint/resource (integration)

## Mocking

**Backend Framework:** Jest built-in — no `__mocks__/` directories detected. Services that depend on repositories are tested by importing the actual service and providing real function inputs.

**Frontend Framework:** Vitest with `vi.mock()` — module-level mocking of API layer:
```js
vi.mock('../../api/weightApi.js');
import * as weightApi from '../../api/weightApi.js';

beforeEach(() => {
  vi.clearAllMocks();
});

it('renders heading', () => {
  weightApi.getWeightHistory.mockReturnValue(new Promise(() => {}));
  render(React.createElement(ProgressPage));
  expect(screen.getByText('Progress')).toBeTruthy();
});
```

**What to Mock:**
- Frontend: API calls via `vi.mock('../../api/xxxApi.js')` — mock the data-fetching layer, not the component's internal logic
- Backend: External services (LLM API calls) — tested indirectly through function inputs rather than file-level mocks
- Integration: Real database (Supabase test schema), real HTTP with supertest

**What NOT to Mock:**
- Pure utility functions (tested directly)
- Validation logic (tested with real inputs)
- Database in integration tests (real test schema)

## Fixtures and Factories

**Backend integration test helpers** (`backend/tests/integration/helpers.js`):

```js
// Create a fresh 'fitness_test' schema, runs schema.sql + seed.sql
export async function startDatabase(timeoutMs = 30000) { ... }
export async function stopDatabase() { ... }

// Register a test user via the API and return the agent with JWT cookie
export async function createTestUser(agent) {
  const email = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'TestP@ss123';
  const res = await agent.post('/api/auth/register').send({ email, password, pdpConsent: true });
  return { agent, email, password, user: res.body.data.user };
}

// Seed a profile and food-log entry so read endpoints return data
export async function seedTestData(agent) { ... }
```

**Backend unit tests** use inline fixtures within `describe` blocks:
```js
const dbActivities = [
  { id: 1, name: 'Morning Running' },
  { id: 2, name: 'Yoga' },
  { id: 3, name: 'Cycling' },
];
```

**Frontend tests** define mock data at the top of each test file:
```js
const mockHistory = [
  {
    logged_date: '2026-01-05',
    total_minutes: 75,
    total_burned: 450,
    entries: [
      { id: 1, activity_name: 'Running', duration_min: 30, intensity: 'moderate', calories_burned: 300 },
    ],
  },
];
```

## Coverage

**Requirements:** None explicitly enforced in config. No coverage thresholds set in Jest or Vitest config.

**View Coverage:**
```bash
# Backend (Jest)
node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage --runInBand

# Frontend (Vitest)
npx vitest --coverage
```

## Test Types

**Unit Tests (`backend/tests/unit/`, frontend `__tests__/`):**
- Backend: Pure logic testing — LLM service functions (`validatePlanStructure`, `fuzzyMatchActivityName`, `validateAndFixPlan`, `generateFallbackPlan`), auth service (`generateToken`), activity log service (`calculateCaloriesBurned`, `validateActivityLogInput`, `calculateDailyNetCalories`)
- Frontend: Component rendering and interaction — renders with various props, calls callbacks, shows loading/error/empty states

**Integration Tests (`backend/tests/integration/`):**
- HTTP-level testing with `supertest` against the full Express app
- Real database via `startDatabase()` + `stopDatabase()` schema lifecycle
- Authenticated agents via `request.agent(app)` + `createTestUser()`
- Covers health endpoint, docs endpoint, daily meal plan CRUD, weekly plan regenerate-day validation
- Pattern: beforeAll creates a fresh test user with unique email, each `describe` block gets its own `agent`

**E2E Tests:**
- `backend/tests/integration/weeklyPlan.e2e.test.js` — full flow testing with real database and API
- No Playwright/Cypress — all tests run as Jest integration tests

## Common Patterns

**Async Testing (Backend):**
```js
it('returns 7-day plan when user has history', async () => {
  const result = await generateFallbackPlan({
    getTopActivities: async () => [
      { id: 1, name: 'Running', estimated_calories: 300, duration_min: 30 },
    ],
    userId: 1,
    weekStart: '2026-01-05',
  });
  expect(result.days.length).toBe(7);
  expect(result.days[0].activities.length).toBeGreaterThan(0);
});
```

**Error Testing (Backend):**
```js
it('missing activityId throws ValidationError', () => {
  expect(() => {
    validateActivityLogInput({ durationMin: 30, intensity: 'moderate' });
  }).toThrow(ValidationError);
});
```

**Error Testing (Frontend):**
```js
test('renders "No activity logged yet" for empty history', () => {
  render(<ActivityHistory history={[]} onDelete={vi.fn()} />);
  expect(screen.getByText('No activity logged yet')).toBeInTheDocument();
});
```

**Jest setup** (`backend/jest.setup.js`) — runs before any test modules are imported:
```js
process.env.NODE_ENV = 'test';
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
```

**Integration test agent pattern:**
```js
describe('Daily Meal Plan Endpoints', () => {
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
});
```

**Integration test response assertion pattern:**
```js
expect(res.status).toBe(400);
expect(res.body.success).toBe(false);
expect(res.body.error.code).toBe('VALIDATION_ERROR');
expect(res.body.error.message).toMatch(/mealTypes/i);
```

**Frontend user interaction test pattern:**
```js
test('calls onDelete with entry id when delete is clicked', () => {
  const onDelete = vi.fn();
  render(<ActivityHistory history={mockHistory} onDelete={onDelete} />);
  const dateHeader = screen.getByText('2026-01-05');
  fireEvent.click(dateHeader.closest('div'));
  fireEvent.click(screen.getAllByText('Delete')[0]);
  expect(onDelete).toHaveBeenCalledWith(1);
});
```

## Test Coverage Gaps

- **Backend controllers**: No dedicated unit tests for `activity.controller.js`, `auth.controller.js`, `dailyMealPlan.controller.js` — only tested indirectly through integration tests
- **Backend repositories**: No tests detected for `repositories/` — SQL is tested only through integration tests
- **Backend middlewares**: No tests for `auth.middleware.js` or rate limiters
- **Frontend auth components**: No tests for `LoginForm.jsx` or `RegisterForm.jsx`
- **Frontend food-log components**: Minimal test coverage (only `previewCalories.test.js` and `CustomFoodForm.test.js`)
- **LLM-dependent endpoints**: Happy paths for weekly plan generation, daily meal plan generation, activity swap not covered in automated integration tests (require real LLM API keys) — marked as `NOTE:` in test files

---

*Testing analysis: 2026-06-02*
