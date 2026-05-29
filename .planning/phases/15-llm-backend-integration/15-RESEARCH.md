# Phase 15: LLM Backend Integration — Research

**Researched:** 2026-05-29
**Status:** Research complete

## Overview

Phase 15 integrates OpenRouter's API with the existing backend to auto-generate personalized weekly activity plans. The `openai@^6.39.1` SDK (already installed in Phase 13) serves as the HTTP client, with OpenRouter's base URL overriding the default OpenAI endpoint.

## Integration Pattern

### OpenAI SDK v6 with OpenRouter

The OpenAI SDK v6 supports a `baseURL` option in its constructor, making it a seamless OpenRouter client:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
    'X-OpenRouter-Title': 'Fitness_App',
  },
});
```

**Key findings:**
- `baseURL` replaces the default `https://api.openai.com/v1` with OpenRouter's endpoint
- OpenRouter accepts OpenAI-compatible request/response format for most models
- Custom headers `HTTP-Referer` and `X-OpenRouter-Title` are optional but recommended for OpenRouter rankings
- API key passed as standard `apiKey` parameter

### API Endpoint

```
POST https://openrouter.ai/api/v1/chat/completions
Headers:
  Authorization: Bearer <OPENROUTER_API_KEY>
  Content-Type: application/json
  HTTP-Referer: <YOUR_SITE_URL> (optional)
  X-OpenRouter-Title: <YOUR_SITE_NAME> (optional)
```

### Request Format (OpenAI-compatible)

```javascript
const completion = await openai.chat.completions.create({
  model: 'nvidia/nemotron-nano-30b-a3b',
  messages: [
    { role: 'system', content: 'You are a fitness planner...' },
    { role: 'user', content: 'Generate a weekly plan...' },
  ],
  temperature: 0.2,
  max_tokens: 2000,
});

// Response structure:
// completion.choices[0].message.content -> JSON string
// completion.model -> Actual model used
// completion.usage -> { prompt_tokens, completion_tokens, total_tokens }
```

### Model: NVIDIA Nemotron Nano 30B A3B

- **Provider slug:** `nvidia/nemotron-nano-30b-a3b` (via OpenRouter)
- **Cost driver:** Chosen for being cost-effective at scale
- **Temperature 0.2:** Produces deterministic, reliable JSON output
- **Max output tokens 2000:** Comfortable for a full 7-day week plan

### Error Handling Patterns

OpenRouter returns HTTP errors in these scenarios:
| Status | Meaning | Handling |
|--------|---------|----------|
| 401 | Invalid API key | Log error, return unavailable |
| 402 | Insufficient credits | Log error, fallback to template plan |
| 429 | Rate limited (OpenRouter side) | Cache and use fallback plan |
| 408/503 | Timeout/unavailable | Retry once, then fallback |
| 200 but invalid JSON | Parse failure | Validate structurally, retry once with correction prompt |

## Rate Limiting Architecture

The CONTEXT.md specifies **per-user rate limiting at 5 requests per 15 minutes**.

### Implementation Approach

Use `express-rate-limit` (already installed at `^8.5.0` and in use in `app.js`) with a custom key generator that extracts `req.user.userId` instead of the default IP-based key.

```javascript
import rateLimit from 'express-rate-limit';

const weeklyPlanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  keyGenerator: (req) => `user_${req.user.userId}`,  // Per-user
  message: {
    success: false,
    error: {
      message: 'Weekly plan generation limit reached. Please try again later.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil((windowMs - (Date.now() - req.rateLimit.resetTime)) / 1000),
    },
  },
});
```

**Important note on `express-rate-limit` v8:** The `keyGenerator` function replaces the deprecated `keys` option. The `req.rateLimit` object provides `resetTime` for calculating `retryAfter`. Alternatively, use the `headers` option to get headers from the response.

### Rate-Limited Response Pattern (D-21)
Per D-21, when rate-limited, the endpoint returns HTTP 429 with a fallback plan in the body — the user sees a plan, not an error. The response includes a `retryAfter` field (seconds) for the frontend countdown timer.

## Caching Strategy (D-18, D-04)

Use `node-cache` (already installed at `^5.1.2`) for in-memory caching of LLM responses:

```javascript
import NodeCache from 'node-cache';
const planCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
```

**Cache key:** Week start date (e.g., `"2026-06-01"`)
**TTL:** 3600 seconds (1 hour)
**Check period:** 600 seconds (10 minutes)

## Output Validation (D-12, D-13, D-14)

### Structural Validation
- Exactly 7 consecutive days starting from Monday of the target week
- Each activity has valid: activity_id, name, duration_min (1-180), intensity
- No negative durations
- All activity names match existing database entries (case-insensitive)

### Fuzzy Matching (D-12)
- Unknown activity names → fuzzy-match to closest DB name
- Use string similarity (Levenshtein distance or simple Jaccard similarity)
- Log mismatches for monitoring
- Proceed with matched name on success, fail entry on no match

### Retry Logic (D-14)
- On validation failure → one retry with a correction prompt that explains what went wrong
- If retry also fails → fallback to template-based plan

## Fallback Plan Generation (D-19)

When LLM is unavailable (network error, parse failure after retry, rate limited):
1. Fetch user's most-used activities from `activity_logs` (last 30 days)
2. Pick top 3-5 most-frequent activities
3. Distribute across 7 days with reasonable rest spacing
4. Set `status: 'fallback'` or `status: 'unavailable'`
5. Store in `weekly_plans` table for frontend to read

## Validation Architecture

### Automated Tests Needed
| Test | Description | Priority |
|------|-------------|----------|
| LLM service unit tests | Mock OpenAI SDK, verify prompt construction, response parsing | HIGH |
| Output validation tests | Valid JSON, invalid structure, unknown activities, edge cases | HIGH |
| Rate limiter tests | 5 requests pass, 6th blocked, per-user isolation | HIGH |
| Caching tests | Cache hit avoids API call, cache miss calls API | HIGH |
| Fallback tests | Network error, invalid response, rate limit → fallback plan | HIGH |
| Template fallback tests | Most-used activities distribution, week structure | MEDIUM |

### Integration Points to Verify
| Dependency | Verification |
|------------|-------------|
| `node-cache@^5.1.2` | Imports without error, `get`/`set`/`has` work |
| `openai@^6.39.1` | Imports without error, constructor accepts options |
| `express-rate-limit@^8.5.0` | Custom `keyGenerator` works with user IDs |
| `weekly_plans` table | Insert/select with JSONB works |
| `activity_logs` table | Query top activities for fallback template works |

## Dependencies & Precautions

### External Service: OpenRouter
- **Requires:** `OPENROUTER_API_KEY` environment variable
- **Account setup:** User needs an OpenRouter account with credits
- **Dashboard config:** None required beyond API key generation
- **Model availability:** NVIDIA Nemotron Nano 30B A3B may have variable availability; the fallback model (gpt-4o-mini) should also be supported

### NPM Packages (Already Installed)
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | `^6.39.1` | LLM API client (OpenRouter) |
| `node-cache` | `^5.1.2` | In-memory response caching |
| `express-rate-limit` | `^8.5.0` | Per-user rate limiting |

### Environment Variables
| Variable | Required | Source |
|----------|----------|--------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter dashboard → API Keys |
| `APP_URL` | No | Your app URL (for HTTP-Referer header) |

## Common Pitfalls

1. **OpenAI SDK v6 breaking changes from v5:** v6 is ESM-only and drops CommonJS support. Use `import` syntax, not `require()`.
2. **`express-rate-limit` v8 keyGenerator:** The `keys` option was removed in v8. Use `keyGenerator` function instead.
3. **OpenRouter model availability:** NVIDIA Nemotron models may have lower availability than OpenAI models. Implement robust fallback.
4. **JSON parsing of LLM output:** The model may include markdown code blocks around JSON. Strip ```json and ``` markers before parsing.
5. **`max_tokens` vs `max_completion_tokens`:** In OpenAI SDK v6, `max_tokens` is still valid for non-o-series models. Use `max_tokens: 2000`.
6. **Rate limiter in test mode:** The existing `createRateLimiter` helper in `app.js` handles test mode (higher limits, shorter windows). Reuse this pattern.
