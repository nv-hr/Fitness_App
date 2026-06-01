# Codebase Structure

**Analysis Date:** 2026-06-01

## Directory Layout

```
[project-root]/
├── backend/                       # Workspace root (Monorepo)
│   ├── backend/                   # Node.js / Express Backend
│   │   ├── db/                    # SQL scripts and migrations
│   │   ├── docs/                  # Postman collections and API docs
│   │   ├── prompts/               # Markdown templates for AI integration
│   │   ├── scripts/               # Server-side tool scripts
│   │   ├── src/                   # Server source code
│   │   │   ├── config/            # Environment and Database configuration
│   │   │   ├── controllers/       # HTTP Request Handlers
│   │   │   ├── middlewares/       # Express middlewares (Auth, Rate Limiting)
│   │   │   ├── repositories/      # Database Access (SQL queries)
│   │   │   ├── routes/            # API Route Definitions
│   │   │   ├── services/          # Core Business Logic and LLM orchestration
│   │   │   └── utils/             # Helpers, Formatters, Error handling
│   │   └── tests/                 # Unit and Integration Tests
│   ├── frontend/                  # React / Vite Frontend
│   │   ├── src/                   # Client source code
│   │   │   ├── app/               # App shell, routing, and global providers
│   │   │   ├── features/          # Domain-specific feature modules
│   │   │   └── shared/            # Common UI components, hooks, utilities
│   │   └── tests/                 # Frontend tests
│   └── supabase/                  # Supabase local environment config
└── .planning/                     # GSD Planning and Knowledge Graph
```

## Directory Purposes

**Backend Source (`backend/backend/src/`):**
- Purpose: Application programming interface (API) and backend business logic.
- Contains: `controllers`, `services`, `routes`, `repositories`.
- Key files: `app.js`, `server.js`

**Frontend Features (`backend/frontend/src/features/`):**
- Purpose: Feature-sliced design grouping related components, hooks, and APIs.
- Contains: Subfolders like `activities`, `food-log`, `progress`, `profile`, `auth`.
- Key files: `ActivityCard.jsx`, `FoodLogPage.jsx`, `ProgressPage.jsx`

**Database Layer (`backend/backend/db/`):**
- Purpose: Database initialization and schema management.
- Contains: Raw `.sql` files and migration scripts.
- Key files: `schema.sql`, `init.sql`, `seed.sql`

## Key File Locations

**Entry Points:**
- `backend/frontend/src/main.jsx`: React entry point.
- `backend/backend/src/server.js`: Node.js Express server entry point.

**Configuration:**
- `backend/package.json`: Main workspace configuration.
- `backend/backend/.env`: Server environment configuration.
- `backend/frontend/vite.config.js`: Vite build configuration.

**Core Logic:**
- `backend/backend/src/services/llm.service.js`: AI interaction logic.
- `backend/frontend/src/app/Router.jsx`: Client-side route declarations.

**Testing:**
- `backend/backend/tests/`: Backend test suites (unit, integration).
- `backend/frontend/src/**/__tests__/`: Co-located frontend tests for features and components.

## Naming Conventions

**Files:**
- React Components: PascalCase (`ActivityLogForm.jsx`)
- Backend Controllers/Services: camelCase with type suffix (`activity.controller.js`, `llm.service.js`)
- Unit tests: match the file they are testing with a `.test.js` or `.test.jsx` suffix.

**Directories:**
- Feature directories: kebab-case (`food-log`, `weekly-plan`)
- Structural directories: camelCase or single lowercase word (`components`, `api`, `controllers`)

## Where to Add New Code

**New Feature (Frontend):**
- Primary code: Create a new folder under `backend/frontend/src/features/[feature-name]`
- Architecture: Include `api/`, `components/`, and `hooks/` inside the feature directory.
- Tests: Place tests in `__tests__/` alongside the components.

**New API Endpoint (Backend):**
- Route: `backend/backend/src/routes/[entity].routes.js`
- Controller: `backend/backend/src/controllers/[entity].controller.js`
- Business Logic: `backend/backend/src/services/[entity].service.js`
- Database access: `backend/backend/src/repositories/[entity].repository.js`

**Utilities:**
- Shared UI helpers: `backend/frontend/src/shared/lib/` or `backend/frontend/src/shared/hooks/`
- Shared Backend helpers: `backend/backend/src/utils/`

## Special Directories

**`.planning/`:**
- Purpose: Contains GSD planning documents, prompt templates, architecture records, and task state.
- Generated: Maintained by AI agents.
- Committed: Yes

**`backend/backend/prompts/`:**
- Purpose: Markdown templates for LLM instruction and structure boundaries.
- Generated: No (developer/agent maintained).
- Committed: Yes

---

*Structure analysis: 2026-06-01*