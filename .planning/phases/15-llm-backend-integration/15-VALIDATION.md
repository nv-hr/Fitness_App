---
phase: 15
slug: llm-backend-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `backend/jest.config.js` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="llm" --no-coverage --verbose 2>&1` |
| **Full suite command** | `cd backend && npx jest --no-coverage --verbose 2>&1` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="llm" --no-coverage --verbose 2>&1`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage --verbose 2>&1`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | LLM-05 | T-15-01 / T-15-02 | API key validated at startup; missing key returns clear error | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | LLM-01, LLM-05 | T-15-03 | Prompt building includes user profile, activity history, activities list | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | LLM-01, LLM-05 | T-15-04 | OpenRouter API call with correct model, temperature, max_tokens | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 2 | LLM-05 | T-15-05 | Output validation: structural checks (7 days, duration 1-180) | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | LLM-05 | T-15-06 | Unknown activity names fuzzy-matched to DB names | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-02-03 | 02 | 2 | LLM-04 | T-15-07 | Retry on validation failure → fallback plan | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | LLM-05 | T-15-08 | Rate limiter blocks >5 req/15min per user | unit | `rateLimiter.test.js` | ❌ W0 | ⬜ pending |
| 15-03-02 | 03 | 2 | LLM-04 | T-15-09 | Cache: hit returns plan, miss calls API | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-03-03 | 03 | 2 | LLM-04, LLM-05 | T-15-10 / T-15-11 | Fallback plan from top activities when LLM unavailable | unit | `llm.test.js` | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 3 | LLM-01 | — | Route returns 200 with valid plan data | integration | `llm.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/llm.test.js` — stubs for LLM integration tests (prompt building, API call, output validation, caching, rate limiting, fallback)
- [ ] `backend/tests/helpers/mockOpenAI.js` — mock OpenAI SDK for unit tests

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real OpenRouter API call works end-to-end | LLM-01 | Requires API key and credits | Set `OPENROUTER_API_KEY` in `.env`, call `POST /api/weekly-plans/generate`, verify 200 with valid plan JSON |
| Rate limit retry-after header accuracy | LLM-05 | Requires timing verification | Send 5 requests, verify 6th returns 429 with `retryAfter` field, wait and retry |
| Fallback when API key is missing | LLM-04 | Runtime behavior check | Remove `OPENROUTER_API_KEY`, start server, call generate endpoint, verify fallback response |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
