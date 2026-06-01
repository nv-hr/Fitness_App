# External Integrations

**Analysis Date:** 2026-06-02

## APIs & External Services

**LLM / AI:**
- **OpenRouter** - Primary LLM provider for AI-generated weekly workout plans, daily meal plans, and activity swaps.
  - SDK/Client: `openai` npm package ^6.39.1 (OpenAI-compatible API)
  - Auth: `OPENROUTER_API_KEY` env var
  - Base URL: `OPENROUTER_BASE_URL` env var (defaults to `https://openrouter.ai/api/v1`)
  - Model: `LLM_MODEL` env var (defaults to `openrouter/owl-alpha`), with `LLM_FALLBACK_MODEL` and `LLM_FALLBACK_MODEL_2` fallbacks
  - Implementation: `backend/src/services/llm.service.js` (lines 20-35)
  - Rate limiting: Per-user rate limiters via `express-rate-limit` for plan generation, day regeneration, swaps, and toggles
  - Fallback: Template-based fallback plan when API calls fail (in-memory `node-cache` with 1-hour TTL)

- **Google Gemini AI** - Secondary AI provider.
  - SDK/Client: `@google/genai` npm package ^2.4.0 (listed in root `package.json`)
  - Auth: `GEMINI_API_KEY` env var
  - Status: SDK is installed but currently not actively used in backend source code. Available for future features.

**Google OAuth:**
- **Provider:** Google Identity Platform (OAuth 2.0)
  - SDK: `passport-google-oauth20` ^2.0.0
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` env vars
  - Implementation: Integrated via Passport.js in `backend/src/app.js` (lines 152-172)
  - Scopes: `profile`, `email`
  - Flow: Redirect to Google consent → callback sets httpOnly JWT cookie → redirect to frontend
  - Failure: Redirect to `FRONTEND_URL/login?error=google_auth_failed`

**Google Fonts:**
- **Provider:** Google Fonts API
  - Fonts loaded: Plus Jakarta Sans (body), Outfit (headings), JetBrains Mono (monospace)
  - URL: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap`
  - Implementation: `frontend/src/index.css` (line 1), loaded at build time

## Data Storage

**Databases:**
- **PostgreSQL** via Supabase
  - Connection: `DATABASE_URL` env var (postgres:// scheme)
  - Client: `pg` npm package ^8.21.0 (`Pool` from `pg`)
  - Configuration: `backend/src/config/database.js`
    - Connection pool: `max: 10`, `connectionTimeoutMillis: 8000`, `idleTimeoutMillis: 30000`
    - SSL: `rejectUnauthorized: false` (required for Supabase session mode pooler)
    - Port preference: Auto-replaces `:5432` with `:6543` (Supabase session mode)
    - Test isolation: `DATABASE_URL_TEST` env var for integration test schema isolation (documented in `backend/src/config/database.js` comments)
  - Schema: SQL migration scripts at `backend/db/schema.sql` and `backend/db/seed.sql` (referenced in `scripts/db-init.js`)

**File Storage:**
- Local filesystem only - No cloud file storage integration detected. Backend serves React static files from `frontend/dist/`.

**Caching:**
- **node-cache** ^5.1.2 - In-memory cache for LLM-generated plans
  - Purpose: Cache weekly activity plans and daily meal plans by `userId_weekStart` / `userId_planDate`
  - Configuration: `stdTTL: 3600` (1 hour), `checkperiod: 600`, `maxKeys: 1000`
  - Implementation: `backend/src/services/llm.service.js` (line 48)
  - Per-user mutex locks via `Map` for TOCTOU race prevention on cache operations
  - Cache keys: `plan_activity_{userId}_{weekStart}` and `plan_meal_{userId}_{planDate}`

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (primary)
  - Implementation: `backend/src/services/auth.service.js`
  - Algorithm: HS256 (HMAC-SHA256), 7-day expiry
  - Token delivery: httpOnly cookie named `token`
  - Cookie config: `httpOnly: true`, `secure: true`, `sameSite: 'none'`, 7-day maxAge
  - Password hashing: bcryptjs, 10 salt rounds, with timing-safe comparison
  - Email enumeration protection: Dummy bcrypt compare on unknown users
  - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

- Google OAuth (secondary)
  - Implementation: `passport-google-oauth20` via Passport.js middleware
  - OAuth users get `passwordHash: null` and `googleId` set in database
  - OAuth implies PDP consent
  - Middleware configured in `backend/src/app.js` (Passport initialization at line 101)

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, DataDog, or similar error tracking SDKs installed.

**Logs:**
- **morgan** ^1.10.0 - HTTP request logging (`dev` format)
- **console.log/error/warn** - Application-level logging throughout backend
  - Structured console.error with error codes and stack traces in database pool error handler (`backend/src/config/database.js` lines 30-38)
- No centralized logging service integration detected.

## CI/CD & Deployment

**Hosting:**
- Designed for single-service deployment (backend serves `frontend/dist/` as static files)
- SPA catch-all: Non-API GET requests serve `index.html`
- Cloud Run target implied by `.env.example` comments ("AI Studio automatically injects... Cloud Run service URL")
- No Dockerfile in repository (`.dockerignore` exists but `Dockerfile` is gitignored/not committed)

**CI Pipeline:**
- None detected. No GitHub Actions, CircleCI, or similar CI configuration found.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `JWT_SECRET` - Secret key for JWT signing
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM features

**Optional env vars:**
- `GEMINI_API_KEY` - Google Gemini AI key (SDK installed but not actively used)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` - Google OAuth
- `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_FALLBACK_MODEL_2` - LLM model selection
- `OPENROUTER_BASE_URL` - Custom OpenRouter base URL
- `FRONTEND_URL` - CORS origin (defaults to `http://localhost:5173`)
- `PORT` - Server port (defaults to 3001)
- `VITE_API_PROXY_TARGET` - Dev proxy target (defaults to `http://localhost:3001`)
- `NODE_ENV` - Environment mode
- `DATABASE_URL_TEST` - Test schema isolation

**Secrets location:**
- `.env` file in project root (gitignored via `.gitignore`)
- `.env.example` documents the required variables (committed)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/google/callback` - Google OAuth callback endpoint (handles `code` and `state` query params)
  - Implementation: `backend/src/app.js` lines 156-172
  - On success: Sets JWT cookie, redirects to `FRONTEND_URL`
  - On failure: Redirects to `FRONTEND_URL/login?error=google_auth_failed`

**Outgoing:**
- None detected. The app does not register webhooks with external services.

## Rate Limiting Architecture

The app uses a layered rate-limiting strategy via `express-rate-limit`:

| Layer | Scope | Limit | Implementation |
|-------|-------|-------|----------------|
| Global | All `/api/` routes | 600 per 60s (all IPs share one bucket) | `backend/src/app.js` lines 65-73 |
| General API | `/api/` | 300 per 60s | `backend/src/app.js` line 104-105 |
| Auth | `/api/auth/login`, `/api/auth/register` | 10 per 60s | `backend/src/app.js` lines 108-110 |
| Profile | `/api/profile` | 60 per 60s | `backend/src/app.js` lines 126-127 |
| Food | `/api/food` | 60 per 60s | `backend/src/app.js` lines 131-132 |
| Activities | `/api/activities` | 20 per 60s | `backend/src/app.js` lines 136-137 |
| Weekly Plan Generate | POST `/api/weekly-plans/generate` | 50 per 60s | `backend/src/middlewares/weeklyPlanRateLimiter.js` |
| Weekly Plan Regenerate | POST `/api/weekly-plans/regenerate-day` | 30 per 60s | `backend/src/middlewares/weeklyPlanRateLimiter.js` |
| Weekly Plan Swap | POST `/api/weekly-plans/swap` | 10 per 60s | `backend/src/middlewares/weeklyPlanRateLimiter.js` |
| Daily Meal Generate | POST `/api/daily-meal-plans/generate` | 20 per 60s | `backend/src/middlewares/dailyMealPlanRateLimiter.js` |

All rate limiters use per-user key generation (`user_{userId}`) and test-mode acceleration (lower window/higher max when `NODE_ENV=test`).

---

*Integration audit: 2026-06-02*
