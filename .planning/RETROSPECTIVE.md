# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — Activity Tracking & Smart Suggestions

**Shipped:** 2026-05-31
**Phases:** 5 | **Plans:** 9 | **Commits:** 110

### What Was Built
- Database schema: `activity_logs` table, `weekly_plans` (JSONB), `intensity_level` ENUM
- Full-stack activity logger: log, view grouped history, delete, daily net calorie summary
- LLM integration: OpenRouter with prompt templates, output validation (Levenshtein), triple-model fallback, in-memory + DB caching
- Weekly plan API: generate, cache-first GET, single-day regeneration with rate limiting
- Weekly plan frontend: expand/collapse DayCards, intensity-color-coded rows, rate-limited regenerate buttons with countdown, 6-state orchestrator
- Comprehensive test suite: 260/260 passing (backend 134, frontend 126)

### What Worked
- **Quick tasks for isolated verification**: OpenRouter API test (260531-baw) caught model ID issues before E2E testing
- **Dependency ordering**: DB schema (13) → independent feature (14) → dependent feature (15) → frontend (16) → testing (17)
- **Code review with --fix**: Fixes applied in dedicated pass before moving to next phase
- **Real LLM E2E test**: Validated actual OpenRouter integration, uncovered primary model returning empty responses
- **Phase 16 multiple plans**: Split into backend endpoints → frontend components → route registration for clean separation

### What Was Inefficient
- **REQUIREMENTS.md traceability stale**: 7/9 items showed "Pending" despite being fully implemented; required user acknowledgement at close
- **Stale quick tasks from earlier milestones**: 21 stale quick task directories accumulated from v1.1/v1.2 — could be cleaned at phase boundaries
- **Frontend test setup friction**: `@testing-library/react` version conflicts required manual dependency resolution

### Patterns Established
- **LLM integration pattern**: OpenAI SDK → OpenRouter base URL → prompt templates → output validation (Levenshtein) → fallback → caching
- **Intensity multiplier pattern**: Server-authoritative multipliers (light=0.7, moderate=1.0, vigorous=1.3) for exercise calorie calculation
- **Cache-first API pattern**: GET returns from in-memory node-cache with `fromCache` flag, avoiding DB queries and rate-limit consumption
- **Three-phase LLM model fallback**: primary → fallback → openrouter/free for resilience

### Key Lessons
1. Keep REQUIREMENTS.md traceability table updated per-phase — never let it go stale across 5 phases
2. Quick tasks should be cleaned up at completion boundaries to avoid audit clutter
3. LLM E2E tests with real API calls are invaluable for catching integration issues (model naming, empty responses, rate limits)
4. Split UI features into plan-sized chunks: API first, components second, routing third

### Cost Observations
- Model mix: 100% Sonnet-equivalent (opencode/default)
- Sessions: ~12 sessions across 5 phases + quick tasks
- Notable: Most efficient execution was Phase 14 (Activity Logger) — single plan, 13 files, no rework

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 12 | Initial build |
| v1.1 | 3 | 9 | International + English migration |
| v1.2 | 4 | 13 | Supabase PostgreSQL migration |
| v1.3 | 5 | 9 | Activity tracking + LLM integration |

### Cumulative Quality

| Milestone | Tests | Files Changed | LOC Added |
|-----------|-------|---------------|-----------|
| v1.0 | ~38 UAT | — | — |
| v1.1 | — | 18 | +1,228 |
| v1.2 | 105+ | 62 | +4,419 |
| v1.3 | 260 | 110 | +13,786 |

### Top Lessons (Verified Across Milestones)

1. **Dependency ordering**: Build foundational layers (DB, auth) before feature layers for clean execution
2. **Phase granularity matters**: 1-plan phases (DB schema, Activity Logger) execute faster than multi-plan phases due to reduced coordination overhead
3. **Requirements doc hygiene**: Traceability tables must be updated synchronously with phase completion to avoid false gaps at milestone close
