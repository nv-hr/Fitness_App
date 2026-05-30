# Phase 17: Testing & Polish - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

All v1.3 features (Activity Logger, LLM Integration, Weekly Plan Frontend) are verified with integration tests, edge cases are handled, and UAT criteria confirmed. This is a quality gate phase — no new features, no user-facing changes.

Success Criteria (what must be TRUE):
1. Activity Logger integration tests pass (log activity, list history, delete entry, daily summary with net calories)
2. LLM integration tests pass with mocked OpenRouter responses (generation, caching, fallback, rate limiting, output validation)
3. All new UI components render correctly in loading, empty, error, and success states
4. Full-stack smoke test completes without errors, covering activity logging and weekly plan features
</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure/testing phase. The PLAN.md already exists with detailed task breakdown.

</decisions>

<code_context>
## Existing Code Insights

### Existing Test Patterns
- Backend: Jest + supertest for integration tests, Jest for unit tests
- Frontend: Vitest with static file analysis (readFileSync + string assertions)
- Test helpers: `startDatabase()`, `createTestUser(agent)`, `seedTestData(agent)`

### Test Files to Create/Extend
- `backend/tests/integration/api.test.js` — extend with activity logger endpoint tests
- `backend/tests/unit/llm.service.test.js` — new file for LLM pure function tests
- `frontend/src/features/activities/components/__tests__/` — 4 component test files
- `frontend/src/features/weekly-plan/components/__tests__/` — 6 component test files
</code_context>

<specifics>
No specific requirements — infrastructure phase. Refer to existing PLAN.md for detailed task breakdown.
</specifics>

<deferred>
None — discussion stayed within phase scope.
</deferred>
