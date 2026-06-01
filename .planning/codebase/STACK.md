# Technology Stack

**Analysis Date:** 2026-06-01 (updated 260601-w2w — verified backend starts and runs)

## Languages

**Primary:**
- JavaScript (ES Modules) - Full stack (Frontend uses `.jsx`, Backend uses `.js` modules)

**Secondary:**
- CSS - Styling via Tailwind CSS and standard `.css` files (`backend/frontend/src/index.css`)

## Runtime

**Environment:**
- Node.js (>= 18)

**Package Manager:**
- npm (workspaces used for `frontend` and `backend`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.0.1 - Frontend UI library
- Express 5.2.0 - Backend web framework

**Testing:**
- Jest 30.4.2 - Backend unit and integration testing
- Vitest - Frontend testing
- Supertest 7.2.2 - API endpoint integration testing

**Build/Dev:**
- Vite 6.2.3 - Frontend bundler & dev server
- Tailwind CSS 4.1.14 - Utility-first styling framework
- Nodemon 3.1.0 - Backend dev server

## Key Dependencies

**Critical:**
- `pg` 8.21.0 - PostgreSQL client for database interactions
- `openai` 6.39.1 - Used as OpenRouter client for LLM features
- `@google/genai` 2.4.0 - Google GenAI SDK
- `passport` 0.7.0 - Authentication middleware

**Infrastructure:**
- `dotenv` 17.4.0 - Environment variable management
- `node-cache` 5.1.2 - In-memory caching for API responses
- `express-rate-limit` 8.5.0 - API rate limiting
- `helmet` 8.1.0 - Security headers

## Configuration

**Environment:**
- Loaded via `dotenv`. Configurations include `DATABASE_URL` and `OPENROUTER_API_KEY`.

**Build:**
- `vite.config.js` (`backend/frontend/vite.config.js`) configures Vite with `@vitejs/plugin-react` and `@tailwindcss/vite`.
- Workspace defined in `backend/package.json` indicating a monorepo setup (`frontend` and `backend` workspaces).

## Platform Requirements

**Development:**
- Node.js >= 18
- PostgreSQL / Supabase pooler connection.

**Production:**
- Standard Node.js hosting.

---

*Stack analysis: 2026-06-01*