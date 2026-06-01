# Testing Patterns

**Analysis Date:** 2026-06-01

## Test Framework

**Runner:**
- Backend: Jest (`jest` v30.x) configured to run with Node's `--experimental-vm-modules` for ES Modules support.
- Frontend: Vitest (via `vitest.config.js` and `vite` setup).

**Assertion Library:**
- `@jest/globals` providing `expect`, `describe`, `it`.
- `supertest` for API integration testing.

**Run Commands:**
```bash
npm run test:unit           # Run unit tests on backend
npm run test:integration    # Run integration tests on backend
npm run test                # Run all backend tests sequentially (--runInBand)
```

## Test File Organization

**Location:**
- Backend splits tests into `tests/unit/` (e.g., `llm.service.test.js`) and `tests/integration/` (e.g., `remaining-endpoints.test.js`).
- Frontend co-locates tests in `__tests__` folders within their respective feature or shared components (e.g., `src/features/progress/components/__tests__/`).

**Naming:**
- Uses `*.test.js` or `*.e2e.test.js` for backend logic.
- Uses `*.test.jsx` for frontend React components.

**Structure:**
```
tests/
├── integration/          # API endpoint testing
│   ├── helpers.js        # Setup utilities
│   └── *.test.js
└── unit/                 # Isolated logic testing
    └── *.test.js
```

## Test Structure

**Suite Organization:**
```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validatePlanStructure } from '../../src/services/llm.service.js';

describe('validatePlanStructure', () => {
  beforeEach(() => {
    // Setup logic
  });

  it('valid 7-day plan passes', () => {
    // Execution and assertion
    expect(result).toBe(true);
  });
});
```

**Patterns:**
- **Setup:** Uses `beforeAll` and `beforeEach` to initialize test users or establish database connections.
- **Teardown:** Uses `afterAll` and `afterEach` to clean up resources, disconnect DB, and reset state.
- **Assertion:** Strict assertions against returned structures and specific error properties.

## Mocking

**Framework:** Jest built-in mocking (`jest.fn()`).

**Patterns:**
```javascript
// Test helpers are used to orchestrate data instead of heavy mocking
import { startDatabase, stopDatabase, createTestUser } from './helpers.js';
```

**What to Mock:**
- Avoid mocking internal services when possible; pure functions are tested directly.
- External API calls (like LLM interactions) or third-party service bounds are stubbed, but core unit logic is kept pure.

**What NOT to Mock:**
- Pure logic functions, data validations, and parsers. These are tested with varied input fixtures.

## Fixtures and Factories

**Test Data:**
```javascript
function makeValidDay(date) {
  return {
    date,
    activities: [
      { activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' },
    ],
  };
}
```

**Location:**
- Helper scripts (e.g., `tests/integration/helpers.js`) orchestrate complex entity creation (like `createTestUser`).
- Inline factory functions (`makeValidDay`) are used for rapid unit test fixture generation.

## Coverage

**Requirements:** None explicitly enforced in the current pipeline.

**View Coverage:**
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage
```

## Test Types

**Unit Tests:**
- Validate discrete business logic, utility functions, and input validation without database dependencies.

**Integration Tests:**
- Validate full API paths using `supertest`.
- Require a running test database configuration.
- Assert correct status codes, JSON payload shapes, and proper error handling logic.

**E2E Tests:**
- Handled primarily by the `weeklyPlan.e2e.test.js` pattern to simulate complete user flows through multiple sequential endpoint interactions.

## Common Patterns

**Async Testing:**
```javascript
it('should return successfully for authenticated user', async () => {
  const response = await request(app)
    .get('/api/activities')
    .set('Authorization', `Bearer ${testUser.token}`);
    
  expect(response.status).toBe(200);
});
```

**Error Testing:**
```javascript
it('should throw ValidationError on malformed input', () => {
  expect(() => {
    validateActivityLogInput(badInput);
  }).toThrow(ValidationError);
});
```

---

*Testing analysis: 2026-06-01*
