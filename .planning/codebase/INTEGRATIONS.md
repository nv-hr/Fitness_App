---
focus: tech
mapped: 2026-06-02
---

# External Integrations

**Analysis Date:** 2026-06-02

## APIs & External Services

### LLM / AI (OpenRouter)

**Provider:** OpenRouter.ai (API-compatible with OpenAI SDK)
**SDK:** `openai` ^6.39.1 (`backend/src/services/llm.service.js`)
**Auth:** `OPENROUTER_API_KEY` environment variable

**Purpose:**
- Generate personalized weekly activity plans via `generateWeeklyPlan()` in `backend/src/services/llm.service.js`
- Generate weekly meal plans via `generateMealPlan()` in `backend/src/services/mealPlan.service.js`
- Generate daily meal plans via `backend/src/services/dailyMealPlan.service.js`
- Swap single activities in an existing plan via `swapActivity()` in `backend/src/services/llm.service.js`
- Correct/retry failed LLM responses with correction prompts

**Configuration:**
- Base URL: `OPENROUTER_BASE_URL` (default: `https://openrouter.ai/api/v1`)
- Primary model: `LLM_MODEL` (default: `openrouter/owl-alpha`)
- Fallback models: `LLM_FALLBACK_MODEL`, `LLM_FALLBACK_MODEL_2`
- Timeout: 30s, maxRetries: 0 (manual retry with fallback chain)
- Temperature: 0.2, maxTokens: 2000
- Custom headers: `HTTP-Referer` (frontend URL), `X-OpenRouter-Title` ("Fitness_App")

**Prompt Templates** (stored in `backend/prompts/`):
- `weekly-plan-prompt.md` — Weekly activity plan generation
- `meal-plan-prompt.md` — Weekly meal plan generation
- `daily-meal-plan-prompt.md` — Per-day meal plan generation
- `activity-swap-prompt.md` — Single activity swap
- `correction-prompt.md` — Validation error correction
- `meal-correction-prompt.md` — Meal plan validation correction
- `system-prompt.md` — Daily activity plan system prompt

**Error Handling:**
- Three-model fallback chain (primary → fallback → fallback2 → throw)
- Two retry attempts with structural and name validation
- Template-based fallback plan generation when all LLM calls fail
- In-memory caching via `node-cache` (TTL: 1h, maxKeys: 1000)

### Google OAuth 2.0

**Provider:** Google Identity Platform
**SDK:** `passport-google-oauth20` ^2.0.0 (`backend/src/config/passport.js`)
**Auth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` environment variables

**Purpose:**
- Authenticate users via Google accounts
- Creates user account on first login (OAuth implicitly grants PDP consent)

**Endpoints:**
- `GET /api/auth/google` — Initiate OAuth (scope: `profile`, `email`)
- `GET /api/auth/google/callback` — OAuth callback handler (redirects to frontend with JWT cookie)

**Configuration:**
- Callback URL: `GOOGLE_CALLBACK_URL` (default: `http://localhost:3001/api/auth/google/callback`)
- Graceful degradation: Passport strategy only initializes if `GOOGLE_CLIENT_ID` is set; logs warning otherwise

**Data Flow:**
1. User clicks "Login with Google" → redirected to Google consent screen
2. Google redirects to `/api/auth/google/callback`
3. Passport validates token, calls `handleGoogleOAuth()` in `backend/src/services/auth.service.js`
4. User found by `google_id` OR created (with `password_hash: null`, `pdp_consent: true`)
5. JWT token generated, set as httpOnly cookie, user redirected to frontend

## Data Storage

### Database

**Provider:** Supabase PostgreSQL (managed)
**Client:** `pg` ^8.21.0 with `Pool` (`backend/src/config/database.js`)
**Connection:** `DATABASE_URL` environment variable

**Connection Configuration:**
- **Connection mode:** Session pooler (port 6543) — explicitly converted from transaction mode (port 5432) via `buildSessionUrl()` helper
- **SSL:** Disabled (`ssl: false`) due to session pooler compatibility
- **Pool settings:** max 10 connections, 8s connection timeout, 30s idle timeout
- **Pool error handling:** Logs error code and stack trace on pool errors

**Test Database:**
- `DATABASE_URL_TEST` — Separate test URL with `search_path=fitness_test` schema isolation (per D-01 integration test convention)
- Uses `options=-c%20search_path%3Dfitness_test` query parameter for namespace isolation

**Schema Migration:**
- Migration files expected in `backend/db/` (referenced in `scripts/db-init.js`):
  - `backend/db/drop_user_activity_log.sql`
  - `backend/db/schema.sql`
  - `backend/db/seed.sql`
- Migration command: `npm run db:migrate` (runs psql with DATABASE_URL)
- Note: SQL files not present in repository (generated/migrated externally)

**Repositories** (data access layer in `backend/src/repositories/`):
- `user.repository.js` — User CRUD (by email, id, google_id)
- `profile.repository.js` — User profile CRUD
- `food.repository.js` — Food item search and CRUD
- `activity.repository.js` — Activity pool queries
- `mealPlan.repository.js` — Meal plan upsert and lookup
- `dailyMealPlan.repository.js` — Per-day meal plan storage
- `weeklyPlan.repository.js` — Weekly plan upsert and lookup
- `activityPlan.repository.js` — Activity plan persistence
- `weightLog.repository.js` — Weight tracking logs

### Caching

**Type:** In-memory (local to process)
**Library:** `node-cache` ^5.1.2
**Location:** `backend/src/services/llm.service.js`
**Usage:**
- LLM-generated weekly activity plans (TTL: 3600s, checkperiod: 600s, maxKeys: 1000)
- LLM-generated meal plans (same cache instance, keyed with `plan_meal_` prefix)
- Per-user mutex locks for TOCTOU race prevention on cache reads/writes

**What is NOT cached:**
- User profiles, food data, activity pools — always query the database

### File Storage

**Type:** Local filesystem only
**Frontend static build:** Served by Express from `frontend/dist/` (in production/served mode)

## Authentication & Identity

### Auth Provider

**Local:** Email + password with bcryptjs hashing (10 rounds)
- JWT generation (`HS256`, 7-day expiry) in `backend/src/services/auth.service.js`
- Token delivered via httpOnly cookie (`secure: true`, `sameSite: 'none'`, 7-day maxAge)
- No `Authorization` header — reads token from `req.cookies.token` only

**Google OAuth 2.0:**
- Passport-based implementation in `backend/src/config/passport.js`

**Session:** Sessionless API (JWT-only, `session: false` in passport strategies)

### Security Measures

- **Rate limiting:** Global (600/min) + per-route limits (auth: 10/min, profile: 60/min, food: 60/min, activities: 20/min)
- **Per-user rate limiting:** Weekly plan generation (50/min), day regeneration (30/min), activity swap (10/min), meal plan (20/min)
- **Brute force protection:** Timing-safe password comparison (dummy bcrypt call even for unknown emails)
- **JWT algorithm pinning:** Only HS256 accepted (prevents algorithm confusion attacks)
- **CORS:** Restricted to `FRONTEND_URL` origin with `credentials: true`
- **HTTP headers:** `helmet` middleware for security headers
- **Input validation:** `express-validator` for request body validation
- **PDP consent:** Required for registration, auto-granted via OAuth

## Monitoring & Observability

**Logging:**
- `morgan('dev')` — HTTP request logging (standard Express middleware)
- `console.log/error/warn` — Application-level logging throughout services

**Error Tracking:** Not detected (no Sentry, DataDog, or similar)

**Health Check:**
- `GET /api/health` — Returns `{ status: 'ok', timestamp: '...' }` with database connection test on startup

## API Documentation

**Self-documenting endpoint:**
- `GET /api/docs` — Returns complete API documentation as JSON at `backend/src/routes/docs.routes.js`
- Documents all endpoints with methods, paths, auth requirements, rate limits, request/response shapes
- No OpenAPI/Swagger spec detected

## CI/CD & Deployment

**Hosting:** Not explicitly configured (no Dockerfile found, no cloud platform config)

**CI Pipeline:** Not detected (no `.github/` directory, no CI config files)

**Containerization:** `.dockerignore` exists but no `Dockerfile` present — Docker infrastructure is scaffolded but not complete

## Environment Configuration

### Required env vars (no defaults — app will fail or degrade without these):
| Variable | Purpose | Degradation |
|----------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection | Server fails to start (logs error) |
| `JWT_SECRET` | JWT signing | Auth operations fail |
| `OPENROUTER_API_KEY` | LLM plan generation | LLM features return fallback templates (logs fatal error) |

### Optional env vars (have safe defaults):
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | Backend server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin, OAuth redirect |
| `GOOGLE_CLIENT_ID` | — (feature disabled) | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | — (feature disabled) | Google OAuth |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` | Google OAuth |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | LLM API base |
| `LLM_MODEL` | `openrouter/owl-alpha` | Primary LLM model |

**Secrets location:** `.env` file (root of project, gitignored)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/google/callback` — Google OAuth 2.0 redirect callback (maps to `authController.googleCallback`)

**Outgoing:** None detected

---

*Integration audit: 2026-06-02*
