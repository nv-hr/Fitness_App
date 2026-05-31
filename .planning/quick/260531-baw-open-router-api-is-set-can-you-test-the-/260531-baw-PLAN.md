---
type: quick
created: 2026-05-31
description: Test OpenRouter API key by making a real LLM call and verifying response
tasks: 2
---

# Quick Plan: Test OpenRouter LLM Integration

**Objective:** Verify that the configured `OPENROUTER_API_KEY` works end-to-end by making a real API call to OpenRouter and validating the response. Also confirm no regressions in existing unit tests.

## Context

- `backend/.env` has `OPENROUTER_API_KEY=sk-or-v1-...` and `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` already set
- `backend/src/services/llm.service.js` uses the OpenAI SDK (`openai@^6.39.1`) targeting OpenRouter with default model `nvidia/nemotron-nano-30b-a3b`
- No existing integration test calls the real API — all unit tests mock the LLM call
- `backend/scripts/` already exists for utility scripts

---

## Task 1: Create and run standalone OpenRouter test script

**File:** `backend/scripts/test-openrouter.js`

**Action:**

Create a standalone Node.js script that:

1. **Loads dotenv** (`dotenv` config) — needed because tests don't auto-load `.env` (only `server.js` does)
2. **Initializes an OpenAI client** identical to `llm.service.js`'s `getClient()`:
   ```js
   new OpenAI({
     baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
     apiKey: process.env.OPENROUTER_API_KEY,
     timeout: 30000,
     maxRetries: 0,
     defaultHeaders: {
       'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
       'X-OpenRouter-Title': 'Fitness_App',
     },
   });
   ```
3. **Sends a minimal chat completion** using the configured model (`nvidia/nemotron-nano-30b-a3b` or fallback `gpt-oss-20b(free)`) with:
   - System: "You are a helpful assistant."
   - User: "Reply with only the word OK if you are working."
4. **Validates the response:**
   - Status is 200 (no auth/rate-limit errors)
   - `response.choices[0].message.content` exists and is non-empty
   - If the configured model fails with a 404/model-not-found, retry with fallback model
5. **Logs:**
   - ✅ / ❌ result
   - Model used
   - Response content (truncated to 200 chars)
   - Any error details
6. **Exits with code 0** on success, **1** on failure

**Do NOT modify existing source files** (`llm.service.js`, config, etc.) — this is a pure validation script.

**Run the script:** `node backend/scripts/test-openrouter.js`

This validates:
- API key is valid on OpenRouter
- OpenRouter endpoint is reachable from this network
- The configured model responds correctly (or fallback works)
- The OpenAI SDK integration pattern matches what the app uses

**Verification:**
```bash
node backend/scripts/test-openrouter.js
# Expected: ✅ OpenRouter responded with model <model> in <N>ms
# Expected exit code: 0
```

**Done:** Script created and executed successfully — OpenRouter API call returns a valid chat completion response.

---

## Task 2: Run existing LLM unit tests to confirm no regressions

**Action:** Run the existing unit test suite for the LLM service to verify that the codebase remains healthy after Task 1:

```bash
npm test -- --testPathPattern=llm.service
```

This runs 5 test suites (`validatePlanStructure`, `fuzzyMatchActivityName`, `validateAndFixPlan`, `generateFallbackPlan`, `buildSystemPrompt`) — 39 tests total.

**Verification:**
```
Tests:       39 passed, 39 total
```

**Done:** All 39 LLM service unit tests pass — no regressions.
