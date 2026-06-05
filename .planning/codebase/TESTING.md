# Testing Patterns

**Analysis Date:** 2026-06-02

## Test Framework

### Backend (Jest)

**Runner:** Jest v30
- Config: Inline in `backend/package.json` under `"jest"` key
- Test environment: `node` (no jsdom)
- Transform: `{}` (ESM native, no transform needed)
- Setup file: `./jest.setup.js` (referenced but file not found on disk)

**Run commands:**
```bash
cd backend
npm test                                            # All tests (--runInBand)
npm run test:unit                                   # Pattern: __tests__ and tests/unit
npm run test:integration                            # Pattern: tests/integration (--runInBand)

# Direct jest invocation:
node --experimental-vm-modules ../node_modules/jest/bin/jest.js --runInBand
```

**Key notes:**
- Uses `--experimental-vm-modules` for ESM support in Jest
- `--runInBand` for integration tests to avoid DB connection races
- Integration tests have 60s timeout for test schema setup

### Frontend (Vitest)

**Runner:** Vitest (version not specified — no vitest.config file, likely uses defaults from Vite)

**Run commands:**
```bash
cd frontend
npx vitest run      # Run all tests
npx vitest          # Watch mode
```

**Key notes:**
- No vitest config file found — defaults inferred from Vite config
- Uses `@testing-library/react` for component rendering
- Uses `@testing-library/jest-dom` matchers (`toBeInTheDocument()`)

## Test File Organization

### Location

Test files are **co-located** with source files in `__tests__/` directories:

**Backend:**
```
backend/
└── src/
    └── __tests__/                       # Unit tests for utils
        └── food.utils.test.js
    └── tests/
        ├── unit/
        │   └── llm.service.test.js      # Unit test for LLM service
        └── integration/
            ├── remaining-endpoints.test.js  # API endpoint integration tests
            └── helpers.js                   # Test lifecycle + data seeding
```

**Frontend:**
```
frontend/src/
├── __tests__/
│   └── api-integration.test.js          # API integration test
└── shared/calendar/__tests__/
    ├── calendarUtils.test.js             # Pure function unit tests
    ├── useMonthData.test.js              # Hook tests with React Testing Library
    ├── CalendarGrid.test.jsx             # Component render tests
    ├── CalendarPageLayout.test.jsx       # Component with mocked children
    └── DayDetailPanel.test.jsx           # Simple render/conditional tests
├── features/activities/components/__tests__/
│   ├── ActivitySummary.test.jsx
│   ├── ActivityLogForm.test.jsx
│   └── ActivityHistory.test.jsx
├── features/food-log/components/__tests__/
│   └── previewCalories.test.js
├── features/progress/components/__tests__/
│   ├── ProgressPage.test.jsx
│   ├── TrendPredictionCard.test.jsx
│   └── WeightTrendChart.test.jsx
├── features/progress/hooks/__tests__/
│   └── useTrendPrediction.test.js
└── features/weekly-plan/components/__tests__/
    └── DayActivityRow.test.jsx
```

### Naming

| Pattern | Example | Platform |
|---------|---------|----------|
| `*.test.js` | `calendarUtils.test.js`, `food.utils.test.js` | Pure JS tests (both) |
| `*.test.jsx` | `CalendarGrid.test.jsx`, `ActivitySummary.test.jsx` | React component tests (frontend) |

## Test Structure

### Backend Unit Tests

```javascript
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { functionUnderTest } from '../../src/services/some.service.js';

describe('functionUnderTest', () => {
  function helperFactory() { /* test data helpers */ }

  it('valid input passes', () => {
    const result = functionUnderTest(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('invalid input returns error', () => {
    const result = functionUnderTest(badInput);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('expected message');
  });
});
```

**Common patterns:**
- Helper functions inside `describe` blocks for test data factories
- `for` loops to generate test data arrays
- `expect(result.valid).toBe(true/false)` for validation functions
- `expect(result.errors.some(e => e.includes('...'))).toBe(true)` for error message checks
- `.toContain()` for substring assertions on error messages

### Backend Integration Tests

```javascript
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
}, 60000);

afterAll(async () => {
  await stopDatabase();
}, 30000);

describe('GET /api/endpoint', () => {
  it('should return 200 with expected shape', async () => {
    const res = await request(app).get('/api/endpoint');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should reject without auth → 401', async () => {
    const res = await request(app).post('/api/auth-required');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

**Integration test helpers** (`backend/tests/integration/helpers.js`):
- `startDatabase()` — creates fresh `fitness_test` schema, runs `schema.sql` + `seed.sql`
- `stopDatabase()` — drops `fitness_test` schema
- `createTestUser(agent)` — registers unique test user via API, returns user + cookie
- `seedTestData(agent)` — creates profile + food log entry

### Frontend Unit Tests (Pure Functions)

```javascript
import { describe, test, expect } from 'vitest';
import { functionUnderTest } from '../module.js';

describe('functionUnderTest', () => {
  test('returns expected value for valid input', () => {
    expect(functionUnderTest(input)).toBe(expected);
  });

  test('returns null for invalid input', () => {
    expect(functionUnderTest(badInput)).toBeNull();
  });
});
```

### Frontend Component Tests

```javascript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from '../ComponentName.jsx';

describe('ComponentName', () => {
  test('renders heading text', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('calls callback on click', () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Frontend Hook Tests

```javascript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMonthData } from '../hooks/useMonthData.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMonthData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns loading initially', () => {
    const { result } = renderHook(() => useMonthData(mockDate, vi.fn()), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
  });
});
```

## Mocking

### Backend

- **No mocking framework** detected in unit tests — tests import and test pure functions directly
- Integration tests use actual database (test schema with seed data)
- `supertest` creates real HTTP requests against the Express app
- Async functions (like `getTopActivities`) are passed as mock arguments to service functions

### Frontend

**Implicit mocking pattern** (modules mocked before import):
```javascript
vi.mock('../ModuleName.js');
import { moduleFunction } from '../ModuleName.js';
```

**Explicit mock implementations:**
```javascript
vi.mock('../calendarUtils.js', () => ({
  getWeekStartsForMonth: vi.fn(),
  buildMonthGrid: vi.fn().mockReturnValue([]),
  computeDayStatus: vi.fn(),
  DAY_STATUS: { INCOMPLETE: 'incomplete', COMPLETED: 'completed', PAST_INCOMPLETE: 'pastIncomplete' },
}));
```

**Mock function patterns:**
```javascript
const fn = vi.fn();
const fn = vi.fn().mockResolvedValue(data);
const fn = vi.fn().mockReturnValue(value);
const fn = vi.fn().mockImplementation(() => value);
```

**Mock child components** (for composite tests):
```javascript
vi.mock('../MonthNav.jsx', () => ({
  default: function MockMonthNav({ currentMonth }) {
    return <div data-testid="month-nav">MonthNav</div>;
  },
}));
```

**What to mock:**
- External API modules (`vi.mock('../../api/weightApi.js')`)
- Utility modules (`vi.mock('../calendarUtils.js')`)
- Child React components
- Hooks (`vi.mock('../../shared/hooks/useResponsive.js')`)

**What NOT to mock:**
- Pure utility functions (test them directly)
- React built-ins

## Fixtures and Factories

**Inline test data** — no separate fixture files detected.

```javascript
// Calendar test data (backend tests)
function makeValidDay(date) {
  return {
    date,
    activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }],
  };
}

// Food test data (frontend tests)
const mockFoods = [
  { id: 1, name: 'Chicken breast, raw, skinless', calories_per_100g: 165, category: 'meat' },
  { id: 2, name: 'White rice, cooked', calories_per_100g: 130, category: 'grains' },
];

// Calendar test data (frontend tests)
const daysWithPlans = {
  '2026-06-15': { date: '2026-06-15', completed: true },
  '2026-06-16': { date: '2026-06-16', completed: false },
};
```

**Integration test data:** Created via API calls to register/login + create profile, then used across test suites.

## Coverage

- **No coverage target configured** in either Jest or Vitest configs
- Coverage directory (`coverage/`) is in `.gitignore`
- No coverage thresholds detected
- Coverage can be generated with standard Jest/Vitest flags but no npm scripts exist for it
- Some tests use soft-skip pattern for integration tests (backend unavailable = test silently passes)

## Test Types

### Unit Tests (Backend)
- **Scope:** Pure functions in services and utils (validation, calculation, format helpers)
- **Approach:** Import function, call with inputs, assert outputs
- **Files:** `backend/tests/unit/llm.service.test.js`, `backend/src/__tests__/food.utils.test.js`

### Unit Tests (Frontend)
- **Scope:** Pure utility functions, React component rendering
- **Approach:** Import function / render component, interact via fireEvent, assert with RTL queries
- **Files:** All `__tests__/*.test.jsx`, pure function `.test.js` files

### Integration Tests (Backend)
- **Scope:** HTTP endpoint behavior — status codes, response shapes, auth rejection, validation errors
- **Approach:** Fresh Supabase test schema per run, `supertest` agent with cookie persistence
- **Files:** `backend/tests/integration/remaining-endpoints.test.js`

### Integration Tests (Frontend)
- **Scope:** Full HTTP round-trip through frontend API layer to backend
- **Approach** (in `frontend/src/__tests__/api-integration.test.js`):
  - Forks backend as child process
  - Uses raw `fetch()` with cookie extraction/forwarding
  - Soft-skip pattern: tests pass silently if backend unavailable
  - Tests all 4 feature API modules (auth, profile, food, activities)

### E2E Tests
- Not detected as standalone tests; noted as "covered in" comment references in integration tests

## Common Patterns

### Async Testing
```javascript
// Frontend — waitFor pattern
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});

// Frontend — delayed promise pattern
let resolvePromise;
const fetchWeekFn = vi.fn().mockReturnValue(new Promise(resolve => {
  resolvePromise = resolve;
}));
resolvePromise(data);

// Backend — async generator pattern (integration)
const result = await generateFallbackPlan({ getTopActivities: async () => [...], ... });
```

### Error Testing
```javascript
// Backend — expect throw
expect(() => {
  validateActivityLogInput({ activityId: 1, durationMin: 0, intensity: 'moderate' });
}).toThrow(ValidationError);

// Frontend — Error state rendering
test('shows error banner when error is provided', () => {
  render(<Component error={new Error('Network error')} />);
  expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
});

// Backend integration — error code assertion
expect(res.body.error.code).toBe('VALIDATION_ERROR');
```

### Auth Rejection Testing Pattern
Backend integration tests consistently test every protected endpoint with the "no auth" case:
```javascript
it('should reject request without auth → 401', async () => {
  const res = await request(app).post('/api/endpoint').send({ ... });
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});
```

### Validation Error Testing Pattern
Backend integration tests validate input rejection consistently:
```javascript
it('should reject missing field → 400 VALIDATION_ERROR', async () => {
  const res = await agent.post('/api/endpoint').send({});
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
});
```

## Required Setup for Running Tests

**Backend integration tests require:**
1. Supabase project running with `DATABASE_URL` in `.env`
2. `.env` file with `JWT_SECRET`
3. Schema and seed SQL files at `backend/db/schema.sql` and `backend/db/seed.sql`

**Frontend integration tests require:**
1. Backend running on port 3001 (or the test forks it automatically)
2. Database access (same requirements as backend)

---

*Testing analysis: 2026-06-02*
