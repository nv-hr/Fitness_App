---
phase: 3
level: 2
researched_at: 2026-06-08T07:55:00+07:00
---

# Phase 3 Research

## Questions Investigated
1. How to safely write integration tests against the real cloud database?
2. How to handle OpenRouter API calls during testing?
3. What is the current test folder architecture and what do we need to implement?

## Findings

### Database State Management for Integration Tests
The current project has a brilliant mechanism in `backend/tests/integration/helpers.js`. It exposes `startDatabase()` and `stopDatabase()` functions. When tests run, it uses `DATABASE_URL_TEST` (or falls back to `DATABASE_URL`), dynamically creates a `fitness_test` schema, runs `schema.sql` and `seed.sql`, and sets the search path. 
**Recommendation:** Use this helper for all integration tests. This allows us to use the real Supabase cloud instance without affecting production data.

### OpenRouter API Handling
The user explicitly allowed tests to consume OpenRouter LLM credits during integration. We will not forcefully mock the `callLlmApi` function when doing end-to-end endpoint tests (`POST /api/activity/plan`, `POST /api/food/plan`). 
**Recommendation:** Write the integration tests to invoke the real endpoints. For unit tests (`tests/unit/llm.service.test.js`), we may still stub the network layer to test structure validations quickly.

### Test Folder Architecture
- `backend/tests/unit/`: Currently holds `llm.service.test.js`. We will add pure unit tests for our new separated `generator.js` and `validator.js` for both `activityPlan` and `mealPlan`.
- `backend/tests/integration/`: Currently has `remaining-endpoints.test.js` and `helpers.js`. We will add API integration tests (e.g., `api.test.js` or separate domain test files using `supertest`).

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB Testing Strategy | Live Schema Creation | `helpers.js` drops and creates a `fitness_test` schema per run, keeping state isolated while using the real cloud DB. |
| LLM Testing Strategy | Mixed Mock/Live | Unit tests will test pure validators. Integration tests will hit the real OpenRouter LLM via the API route. |
| Framework | Jest & Supertest | Jest is already installed and pre-configured with VM experimental modules. Supertest is ready for Express integration. |

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| jest | ^30.4.2 | Test runner |
| supertest | ^7.2.2 | HTTP assertions for integration testing |

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
