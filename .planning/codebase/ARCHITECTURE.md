<!-- refreshed: 2026-06-01 -->
# Architecture

**Analysis Date:** 2026-06-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React/Vite)                 │
├──────────────────┬──────────────────┬───────────────────────┤
│    Activities    │     Food Log     │      Progress         │
│ `backend/frontend/src/features/activities` │ `backend/frontend/src/features/food-log` │ `backend/frontend/src/features/progress` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend (Express)                     │
│               `backend/backend/src`                         │
├──────────────────┬──────────────────┬───────────────────────┤
│    Controllers   │    Services      │    Repositories       │
│ `backend/backend/src/controllers` │ `backend/backend/src/services` │ `backend/backend/src/repositories` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                  │
│                     `backend/backend/db`                    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Controllers | Handle HTTP requests, input validation, send responses | `backend/backend/src/controllers/*.js` |
| Services | Core business logic, calling external APIs (e.g. LLM), orchestration | `backend/backend/src/services/*.js` |
| Repositories | Direct database access and queries | `backend/backend/src/repositories/*.js` |
| Routes | Defining API endpoints and mapping to controllers | `backend/backend/src/routes/*.js` |
| Middlewares | Authentication, rate limiting, error handling | `backend/backend/src/middlewares/*.js` |
| Frontend Features | Domain-based UI feature modules | `backend/frontend/src/features/*` |
| Frontend Shared | Reusable UI components (like Calendar) | `backend/frontend/src/shared/*` |

## Pattern Overview

**Overall:** Client-Server Monorepo / Feature-Sliced Frontend

**Key Characteristics:**
- **Monorepo:** Configured using NPM Workspaces (`fitness-app-root` in `backend/package.json` wraps `frontend` and `backend`).
- **Feature-Sliced Design (Frontend):** UI features are decoupled into `features/activities`, `features/food-log`, `features/progress`, `features/profile`, etc. Each feature has its own `api`, `components`, and `hooks`.
- **Layered Architecture (Backend):** The server logic is separated into Routes → Controllers → Services → Repositories.

## Layers

**Frontend Features Layer:**
- Purpose: Groups all domain-specific UI logic, API calls, and state management.
- Location: `backend/frontend/src/features/`
- Contains: Components, API wrappers (`api/`), hooks (`hooks/`), and tests (`__tests__/`).
- Depends on: Shared UI, routing.

**Backend Services Layer:**
- Purpose: Executes business logic and external integrations (like LLMs).
- Location: `backend/backend/src/services/`
- Contains: `activityPlan.service.js`, `llm.service.js`, `food.service.js`
- Depends on: Repositories and external service clients.

**Backend Repositories Layer:**
- Purpose: Abstracts SQL database interactions.
- Location: `backend/backend/src/repositories/`
- Contains: Functions running `pool.query` for activities, users, profiles, and weight logs.

## Data Flow

### Primary Request Path

1. **Frontend Call:** Component fires a React Hook which uses `api/*.js` using standard HTTP wrapper. (`backend/frontend/src/features/activities/api/activityApi.js`)
2. **Backend Route:** Express Router matches endpoint and applies Middlewares (Auth, Rate Limit). (`backend/backend/src/routes/activity.routes.js`)
3. **Backend Controller:** Controller parses req.body/req.query and delegates to Service. (`backend/backend/src/controllers/activity.controller.js`)
4. **Backend Service:** Service applies business logic and calls Repository. (`backend/backend/src/services/activity.service.js`)
5. **Backend Repository:** Repository queries PostgreSQL and returns structured data. (`backend/backend/src/repositories/activity.repository.js`)

### Secondary Flow Name: AI Recommendation Flow

1. User requests generated activity or meal plan.
2. Controller calls `llm.service.js` or `activityPlan.service.js`.
3. LLM Service sends formulated prompt using OpenAI/OpenRouter (e.g. `prompts/activity-swap-prompt.md`).
4. Output is validated and stored/cached by the relevant Repository.

## Key Abstractions

**Repositories:**
- Purpose: Encapsulates SQL strings and data persistence logic to avoid DB bleed into business logic.
- Examples: `backend/backend/src/repositories/activity.repository.js`
- Pattern: Data Access Object (DAO) pattern.

**HTTP API Client (Frontend):**
- Purpose: Abstracting Fetch/Axios calls.
- Examples: `backend/frontend/src/shared/lib/http.js`
- Pattern: Singleton / wrapper pattern.

## Entry Points

**Frontend Application:**
- Location: `backend/frontend/src/main.jsx`
- Triggers: Browser page load.
- Responsibilities: Renders React DOM, wraps application in Providers (e.g., Auth, Router).

**Backend Server:**
- Location: `backend/backend/src/server.js` (and `app.js`)
- Triggers: Node execution (`npm run dev`).
- Responsibilities: Mounts Express middlewares, attaches routes, starts HTTP server.

## Architectural Constraints

- **Monorepo Layout:** Application sits entirely inside `backend/` root workspace rather than top level.
- **Relational Integrity:** PostgreSQL handles relational constraints using schemas defined in `backend/backend/db/schema.sql`.

## Anti-Patterns

### Logic in Controllers

**What happens:** Sometimes business logic or heavy mapping is done inside Controller functions instead of Services.
**Why it's wrong:** Makes controllers harder to test independently from the HTTP cycle.
**Do this instead:** Keep controllers thin; parse req, call Service, return res. (`backend/backend/src/controllers/activity.controller.js`)

## Error Handling

**Strategy:** Global Error Handler Middleware

**Patterns:**
- Errors are thrown in Services using standard Error classes (`backend/backend/src/utils/errors.js` and `dbErrors.js`).
- Caught in Controllers using `try/catch` and passed to a generic global `utils/response.js` handler (e.g., `errorResponse(res, err)`).

## Cross-Cutting Concerns

**Logging:** Handled primarily through `console.log`/`console.error` and piped into `.log` files (`server-error.log`).
**Validation:** Handled locally within controllers.
**Authentication:** Implemented with `auth.middleware.js` (JWT or session based) wrapped around secure routes.

---

*Architecture analysis: 2026-06-01*