---
focus: tech
mapped: 2026-06-02
---

# Technology Stack

**Analysis Date:** 2026-06-02

## Languages

**Primary:**
- JavaScript (ES2022+) — Entire application (both frontend and backend) using ES modules (`"type": "module"`)
- TypeScript ~5.8.2 — Used for type-checking only (via `tsc --noEmit`); no `.ts` runtime files detected; backend is pure `.js`

**Secondary:**
- SQL (PostgreSQL dialect) — Database schema, seed scripts, migration files in `backend/db/`
- HTML — `frontend/index.html` entry point
- CSS (Tailwind CSS v4 utility classes) — `frontend/src/index.css` and inline via `tailwindcss/vite` plugin

## Runtime

**Environment:**
- Node.js >=18 (required by backend `package.json` `engines` field)
- Package Manager: npm (npm workspaces monorepo)
- Lockfile: `package-lock.json` present

**Platform:**
- App name: **KalaFit** (per `metadata.json`)
- Original title: "Kalkulator Kesehatan" (per `frontend/index.html`)

## Frameworks

### Frontend

**Core:**
- **React ^19.2.0** — UI library with JSX (`react`, `react-dom`)
- **Vite ^8.0.0** (frontend) / **Vite ^6.2.3** (root) — Build tool with HMR, proxy to backend at `/api`
- **@vitejs/plugin-react ^6.0.0** — Vite React plugin
- **@tailwindcss/vite ^4.1.14** — Tailwind CSS v4 Vite integration (PostCSS-less, JIT-based)

**Routing:**
- **react-router-dom ^7.6.0** — Client-side routing with `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`

**State & Data:**
- **@tanstack/react-query ^5.80.0** — Server state management (caching, refetching, retries); configured with `staleTime: 5min`, `retry: 1`
- **React Context** — Auth state via custom hook (`useAuth`)

**UI & Charts:**
- **lucide-react ^0.546.0** — Icon library (used for nav, dashboard cards, buttons)
- **motion ^12.23.24** — Animation library (replaces framer-motion)
- **recharts ^3.8.1** — Charting library (weight trend charts, progress visualization)
- **react-day-picker ^9.14.0** — Date picker component
- **date-fns ^3.6.0** — Date utility library

**Forms:**
- **react-hook-form ^7.58.0** (devDep) — Form state management
- **@hookform/resolvers ^4.1.0** (devDep) — Schema validation resolvers
- **zod ^3.25.0** (devDep) — Schema validation library

### Backend

**Core:**
- **Express ^5.2.0** — HTTP server framework (Express 5 with async error handling)
- **dotenv ^17.4.0** — Environment variable loading from `.env`
- **cors ^2.8.5** — Cross-origin resource sharing (configured for `FRONTEND_URL`)
- **helmet ^8.1.0** — Security headers
- **compression ^1.8.1** — Gzip response compression
- **cookie-parser ^1.4.7** — Cookie parsing (required for httpOnly JWT cookie)
- **morgan ^1.10.0** — HTTP request logging

**Database:**
- **pg ^8.21.0** — PostgreSQL client with `Pool` connection pooling
- Hosted on **Supabase** (session pooler mode, port 6543)

**Authentication:**
- **passport ^0.7.0** — Authentication middleware
- **passport-google-oauth20 ^2.0.0** — Google OAuth 2.0 strategy
- **passport-local ^1.0.0** — Local email/password strategy (available but not explicitly wired in code)
- **jsonwebtoken ^9.0.2** — JWT generation and verification (HS256 algorithm, 7-day expiry)
- **bcryptjs ^2.4.3** — Password hashing (10 salt rounds)

**Security:**
- **express-rate-limit ^8.5.0** — Rate limiting (global, per-route, per-user for LLM endpoints)
- **express-validator ^7.3.0** — Request validation

**LLM Integration:**
- **openai ^6.39.1** — OpenAI SDK (connected to OpenRouter API, not OpenAI directly)
- **node-cache ^5.1.2** — In-memory caching for LLM-generated plans (TTL: 1h, max 1000 keys)

**Error Handling:**
- Custom `AppError` hierarchy with `ValidationError`, `AuthenticationError`, `NotFoundError` in `src/utils/errors.js`
- Global Express error handler with camelCase→UPPER_SNAKE_CASE code transformation

### Testing

**Backend:**
- **Jest ^30.4.2** — Test runner with `--experimental-vm-modules` for ESM support
- **supertest ^7.2.2** — HTTP integration testing
- **nodemon ^3.1.0** — Development auto-reload

**Frontend:**
- Tests use `*.test.js` / `*.test.jsx` naming (co-located in `__tests__/` directories)
- Testing framework not explicitly declared in `frontend/package.json` (likely Vitest + jsdom via Vite ecosystem)

## Dependencies

### Critical Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.0 | Backend HTTP server |
| react | ^19.2.0 | Frontend UI library |
| pg | ^8.21.0 | PostgreSQL database client |
| openai | ^6.39.1 | LLM integration via OpenRouter |
| jsonwebtoken | ^9.0.2 | JWT auth token management |
| passport-google-oauth20 | ^2.0.0 | Google OAuth 2.0 |
| @tanstack/react-query | ^5.80.0 | Frontend data fetching/caching |
| react-router-dom | ^7.6.0 | Frontend routing |
| tailwindcss | ^4.1.14 | CSS utility framework |

### Infrastructure Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| helmet | ^8.1.0 | HTTP security headers |
| cors | ^2.8.5 | CORS configuration |
| express-rate-limit | ^8.5.0 | Rate limiting |
| compression | ^1.8.1 | Gzip compression |
| node-cache | ^5.1.2 | In-memory caching |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ~5.8.2 | Type checking |
| jest | ^30.4.2 | Backend testing |
| supertest | ^7.2.2 | HTTP integration tests |
| tsx | ^4.21.0 | TypeScript execution |
| esbuild | ^0.25.0 | Bundler utilities |
| cross-env | ^10.1.0 | Cross-platform env vars |
| nodemon | ^3.1.0 | Dev auto-reload |

## Configuration

### Environment Variables (`.env.example`)

**App:**
- `NODE_ENV` — Environment mode (development/production/test)
- `PORT` — Backend server port (default: 3001)
- `FRONTEND_URL` — Frontend origin for CORS and OAuth redirects (default: `http://localhost:3000`)

**Authentication:**
- `JWT_SECRET` — HMAC secret for JWT signing (HS256)

**Google OAuth:**
- `GOOGLE_CLIENT_ID` — Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth app client secret
- `GOOGLE_CALLBACK_URL` — OAuth callback URL

**Database:**
- `DATABASE_URL` — PostgreSQL connection string (Supabase session pooler)
- `DATABASE_URL_TEST` — Test database URL with `search_path=fitness_test` schema isolation

**LLM:**
- `OPENROUTER_API_KEY` — OpenRouter API key
- `OPENROUTER_BASE_URL` — OpenRouter base URL (default: `https://openrouter.ai/api/v1`)
- `LLM_MODEL` — Primary model for plan generation (default: `openrouter/owl-alpha`)
- `LLM_FALLBACK_MODEL` — First fallback model
- `LLM_FALLBACK_MODEL_2` — Second fallback model

### Build Configuration

**Root `tsconfig.json`** — Targets ES2022, uses `bundler` module resolution, enables `react-jsx`, supports path alias `@/*` mapping to `./*`.

**Frontend `vite.config.js`** — Custom es-toolkit compat plugin for CJS→ESM resolution, proxies `/api` to backend, HMR toggle via `DISABLE_HMR` env var.

## Project Structure

```
Fitness_App/
├── frontend/          # React SPA (Vite, Tailwind v4)
│   ├── src/
│   │   ├── app/       # App shell, Router, Providers
│   │   ├── features/  # Feature modules (auth, profile, food-log, activities, progress, weekly-plan)
│   │   └── shared/    # Shared components (calendar, hooks, HTTP client)
│   └── index.html
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Database pool, Passport config
│   │   ├── controllers/ # Route handlers
│   │   ├── middlewares/  # Auth, rate limiters
│   │   ├── repositories/ # Data access layer (raw SQL queries)
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic (auth, profile, food, activity, LLM, meal plan)
│   │   └── utils/        # Error classes, response helpers
│   └── prompts/          # LLM prompt templates (Markdown)
├── scripts/          # Utility scripts (db-init, start-all)
└── package.json      # Root workspace config
```

---

*Stack analysis: 2026-06-02*
