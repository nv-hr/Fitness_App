# External Integrations

**Analysis Date:** 2026-06-01

## APIs & External Services

**AI / LLM Providers:**
- OpenRouter - Used for AI-driven functionality (e.g., generating activity plans).
  - SDK/Client: `openai` (configured to point to OpenRouter base URL)
  - Auth: `OPENROUTER_API_KEY`
- Google GenAI - Additional AI integration.
  - SDK/Client: `@google/genai`

## Data Storage

**Databases:**
- PostgreSQL (via Supabase) - Primary relational database. Connects via session mode pooler (port 6543) for SSL compatibility.
  - Connection: `DATABASE_URL` (and `DATABASE_URL_TEST` for isolated test schemas)
  - Client: `pg` (node-postgres)

**File Storage:**
- Local filesystem only

**Caching:**
- `node-cache` - In-memory caching for LLM responses and rate-limiting data.

## Authentication & Identity

**Auth Provider:**
- Custom JWT and Passport.js
  - Implementation: `jsonwebtoken`, `passport`, `passport-local` (email/password)
  - OAuth: `passport-google-oauth20` for Google single sign-on.
  - Encryption: `bcryptjs` for passwords.

## Monitoring & Observability

**Error Tracking:**
- None detected (no cloud-based APM/error trackers found).

**Logs:**
- `morgan` - HTTP request logger middleware.

## CI/CD & Deployment

**Hosting:**
- Monorepo setup configured for standard Node.js hosting (e.g., Vercel/Render for frontend, Render/Railway for backend).

**CI Pipeline:**
- None explicitly configured in root repository.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string.
- `OPENROUTER_API_KEY` - OpenRouter authentication for LLM features.
- `FRONTEND_URL` - Frontend origin (e.g., `http://localhost:3001`).
- `PORT` - Backend server port.

**Secrets location:**
- `.env` files in `backend/` and `backend/backend/` directories.

## Webhooks & Callbacks

**Incoming:**
- OAuth callbacks (Google OAuth redirect endpoints via Passport).

**Outgoing:**
- None detected.

---

*Integration audit: 2026-06-01*