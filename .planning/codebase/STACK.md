# Technology Stack

**Analysis Date:** 2026-06-02

## Languages

**Primary:**
- JavaScript (ESM) - Backend (`backend/src/**/*.js`) and Frontend (`frontend/src/**/*.jsx`)
- JSX - React component files in `frontend/src/**/*.jsx`

**Secondary:**
- TypeScript (config only, `.js` runtime) - `tsconfig.json` present with `allowJs: true`, `noEmit: true`. Actual source files are `.js`/`.jsx`, not `.ts`/`.tsx`.
- SQL - Database migration scripts (referenced in `scripts/db-init.js` as `backend/db/schema.sql`, `backend/db/seed.sql`)

## Runtime

**Environment:**
- Node.js >=18 (enforced by `backend/package.json` `engines.node`)
- Tested via npm workspaces monorepo

**Package Manager:**
- npm workspaces (root `package.json` defines `workspaces: ["frontend", "backend"]`)
- Lockfile: Not detected in repo (likely `.gitignore`d)

## Frameworks

**Core:**
- Express ^5.2.0 (`backend/package.json`) - HTTP server framework, ESM (`"type": "module"`)
- React ^19.2.0 (`frontend/package.json`) - UI component library
- Vite ^8.0.0 (`frontend/package.json`) - Build tool and dev server
- React Router ^7.6.0 (`frontend/package.json`) - Client-side routing

**Testing:**
- Jest ^30.4.2 (`backend/package.json`) - Test runner for backend
- Supertest ^7.2.2 (`backend/package.json`) - HTTP integration test assertions

**Build/Dev:**
- Vite ^8.0.0 + @vitejs/plugin-react ^6.0.0 - Frontend build pipeline
- @tailwindcss/vite ^4.1.14 - Tailwind CSS integration via Vite plugin
- tailwindcss ^4.1.14 - Utility CSS framework
- esbuild ^0.25.0 - Bundler used by Vite
- tsx ^4.21.0 - TypeScript execution
- nodemon ^3.1.0 - Backend dev server restart (devDependency)
- autoprefixer ^10.4.21 - CSS vendor prefixing

## Key Dependencies

**Critical:**
- `express ^5.2.0` (backend) - All HTTP routing and middleware
- `pg ^8.21.0` (backend) - PostgreSQL client, direct connection pool
- `openai ^6.39.1` (backend) - OpenAI SDK used to call OpenRouter API for LLM features
- `@google/genai ^2.4.0` (root) - Google Gemini AI SDK
- `react ^19.2.0` / `react-dom ^19.2.0` (frontend) - UI rendering
- `react-router-dom ^7.6.0` (frontend) - Navigation/routing
- `@tanstack/react-query ^5.80.0` (frontend) - Server state management and API data fetching
- `tailwindcss ^4.1.14` (root config) - All styling via utility classes

**Infrastructure:**
- `cors ^2.8.5` - Cross-origin requests from frontend
- `helmet ^8.1.0` - Security headers
- `express-rate-limit ^8.5.0` - Rate limiting for all API routes
- `compression ^1.8.1` - Gzip compression
- `morgan ^1.10.0` - HTTP request logging
- `cookie-parser ^1.4.7` - Cookie parsing for JWT
- `jsonwebtoken ^9.0.2` - JWT creation/verification (HS256, 7-day expiry)
- `bcryptjs ^2.4.3` - Password hashing (10 salt rounds)
- `passport ^0.7.0` / `passport-local ^1.0.0` / `passport-google-oauth20 ^2.0.0` - Authentication strategies
- `node-cache ^5.1.2` - In-memory caching for LLM plans (1 hour TTL)
- `express-validator ^7.3.0` - Request validation
- `lucide-react ^0.546.0` (root) - Icon library
- `recharts ^3.8.1` (frontend) - Charts/graphs
- `date-fns ^3.6.0` (frontend) - Date utilities
- `react-day-picker ^9.14.0` (frontend) - Date picker component
- `react-hook-form ^7.58.0` + `zod ^3.25.0` (frontend devDeps) - Form validation
- `@hookform/resolvers ^4.1.0` - Zod resolver for react-hook-form
- `motion ^12.23.24` (root) - Animation library

## Configuration

**Environment:**
- `backend/src/server.js` loads `dotenv` at startup
- `backend/src/config/database.js` loads `.env` from `../../.env` relative to config directory
- Env vars consumed:
  - `DATABASE_URL` - PostgreSQL connection string (Supabase, session mode port 6543)
  - `JWT_SECRET` - HS256 signing key
  - `OPENROUTER_API_KEY` - LLM API key
  - `OPENROUTER_BASE_URL` - LLM API base URL (defaults to `https://openrouter.ai/api/v1`)
  - `LLM_MODEL` - Model name (defaults to `openrouter/owl-alpha`)
  - `LLM_FALLBACK_MODEL` / `LLM_FALLBACK_MODEL_2` - Fallback models
  - `GEMINI_API_KEY` - Google Gemini AI key
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
  - `GOOGLE_CALLBACK_URL` - OAuth callback URL
  - `FRONTEND_URL` - CORS origin and OAuth redirect target (defaults to `http://localhost:5173`)
  - `PORT` - Server port (defaults to 3001)
  - `VITE_API_PROXY_TARGET` - Dev proxy target (defaults to `http://localhost:3001`)
  - `NODE_ENV` - Environment mode (development/test/production)

**Build:**
- `frontend/vite.config.js` - Vite configuration with Tailwind, React plugin, dev proxy for `/api` to backend
- `tsconfig.json` (root) - TypeScript config targeting ES2022, bundler module resolution
- Root `package.json` scripts orchestrate via npm workspaces

**Dev scripts:**
```bash
npm run dev               # Starts both backend (port 3001) and frontend (port 5173) via concurrently
npm run build             # Builds frontend only via workspace
npm run lint              # TypeScript type-check (noEmit)
```

## Platform Requirements

**Development:**
- Node.js >=18
- PostgreSQL instance (Supabase recommended, session mode pooler port 6543)
- `.env` file with required secrets (see `.env.example`)

**Production:**
- Deployed as a single service — backend serves React static build from `frontend/dist/`
- Express SPA catch-all serves `index.html` for non-API GET requests
- No Dockerfile present in repo (`.dockerignore` exists, but actual Dockerfile not committed)

---

*Stack analysis: 2026-06-02*
