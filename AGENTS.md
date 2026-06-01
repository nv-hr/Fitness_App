<!-- GSD:project-start source:PROJECT.md -->
## Project

**Fitness_App**

A web-based health application that helps users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption, and receive simple physical activity recommendations. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

### Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React 19 + Express 5 + Supabase PostgreSQL (already decided)
- **Language**: English UI required
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- **JavaScript (ESM)** — Both frontend and backend use ES modules
## Runtime / Platform
- **Node.js 20+** — Backend runtime
- **Browser** — Frontend SPA served by Vite dev server or Express static
## Frameworks
| Layer | Framework |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, TanStack React Query, React Hook Form, Zod |
| Backend | Express 5 (ESM), Passport (JWT + Google OAuth), Helmet, express-rate-limit |
| Database | Supabase PostgreSQL 17 (pg driver, no ORM) |
## Dependencies
- **Root**: None (monorepo with separate package.json per directory)
- **backend/**: express, passport, passport-jwt, passport-google-oauth20, bcryptjs, pg, openai, node-cache, cors, helmet, express-rate-limit, cookie-parser, zod, dotenv, date-fns
- **frontend/**: react, react-dom, react-router-dom, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, date-fns
## Dev Dependencies
- **Root**: None
- **backend/**: jest, nodemon, eslint
- **frontend/**: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, eslint, vite
## Configuration Files
| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables (DB URL, JWT secret, OAuth keys, LLM keys) |
| `backend/.env.example` | Template for .env |
| `frontend/vite.config.js` | Vite config with dev proxy to backend |
| `Dockerfile` | Multi-stage production build |
| `docker-compose.yml` | Production container setup |
| `supabase/config.toml` | Supabase project configuration |
## Build / Tooling
- **Vite 8** — Frontend build tool
- **Docker** — Multi-stage production build
- **Jest** (backend) + **Vitest** (frontend) — 141 frontend + backend tests
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- React functional components with hooks, Express route-controller-service-repository pattern, ES modules throughout.
## Naming Conventions (observed in documentation)
| Element | Convention | Example |
|---------|-----------|---------|
| Repository name | snake_case | `Fitness_App` |
| Git commits | Imperative mood | `Create Workout Planner`, `Update README.md` |
| Files (backend) | camelCase | `weeklyPlan.routes.js` |
| Files (frontend) | PascalCase | `ActivityPage.jsx`, `FoodLogPage.jsx` |
| API routes | kebab-case | `/api/weekly-plans/toggle-complete` |
## Documentation Language
- **English** — All UI text, code comments, and documentation are in English.
## Error Handling
- **Backend**: try/catch in controllers → error middleware → standard JSON `{ success, error: { message, code } }` response.
- **Frontend**: TanStack Query error handling with toast notifications.
## Patterns
- Route → Controller → Service → Repository → pg Pool. Controllers handle req/res, services contain business logic, repositories run SQL queries.
## Git Conventions
| Aspect | Observation |
|--------|-------------|
| Commit style | Simple imperative (`Create X`, `Update Y`) |
| Branch naming | `features` (from PR #1 merge) |
| PR style | Standard GitHub merge |
## Notes
- Codebase has 450+ commits across 41 phases. See .planning/PROJECT.md for full history.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Architectural Pattern
- **Route-Controller-Service-Repository** — Layered architecture on the backend.
- **Feature-based modules** on the frontend under `frontend/src/features/`.
## Layers
| Layer | Technology | Location |
|-------|-----------|----------|
| UI (React) | React 19, React Router 7 | `frontend/src/features/*/components/` |
| State | TanStack React Query | `frontend/src/features/*/api/` |
| API (Express) | Express 5 routes + controllers | `backend/src/routes/`, `backend/src/controllers/` |
| Business Logic | Service layer | `backend/src/services/` |
| Data Access | Repository pattern (pg) | `backend/src/repositories/` |
| Database | Supabase PostgreSQL 17 | `supabase/` migrations |
## Data Flow
- Browser → (React Query) → Express API → Controller → Service → Repository → pg Pool → PostgreSQL
- Auth: httpOnly JWT cookie set on login/register, verified by authenticateToken middleware
- LLM: Service calls OpenRouter API, results cached with node-cache, persisted to DB
## Abstractions
- `http.js` — Shared HTTP client wrapper for frontend API calls
- `auth.middleware.js` — JWT verification guard for protected routes
- `error.middleware.js` — Global Express error handler
- `database.js` — pg Pool singleton with SSL config
- Calendar shared components — CalendarGrid, MonthNav, DayDetailPanel, CalendarPageLayout, useMonthData, calendarUtils
## Entry Points
- `backend/src/server.js` (development: nodemon, production: node)
- `frontend/src/main.jsx` (Vite dev server entry)
## Key Formulas
- **BMI**: weight(kg) / height(m)²
- **TDEE**: BMR × Activity Multiplier
- **BMR**: Mifflin-St Jeor or Harris-Benedict equation
- **KCAL**: Food item calorie summation
## Notes
- 41 phases completed across 8 milestones (v1.0 through v1.8). See .planning/ROADMAP.md for full phase breakdown.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- start-dev -->
## Development Server

The project has two dev servers that must run simultaneously:

| Service | Directory | Command | URL |
|---------|-----------|---------|-----|
| Backend (Express) | `backend/` | `npm run dev` | `http://localhost:3001` |
| Frontend (Vite) | `frontend/` | `npm run dev` | `http://localhost:5173` |

### Starting both servers

From the repo root in PowerShell:
```powershell
.\scripts\start-dev.ps1
```

This opens the frontend in your browser automatically. Pass `-NoBrowser` to skip.

### Starting manually (separate terminals)

Terminal 1:
```powershell
cd backend
npm run dev
```

Terminal 2:
```powershell
cd frontend
npm run dev
```

### Troubleshooting

- **Frontend shows blank page / can't reach localhost:5173** — The Vite dev server exits when the shell that launched it is killed. Use `.\scripts\start-dev.ps1` (PowerShell Job) or run `npm run dev` in a persistent terminal window.
- **Backend DB connection fails** — Check `backend/.env` has valid `DATABASE_URL` and Supabase project is running.
- **Port conflicts** — Edit `backend/src/server.js` for backend port, or `frontend/vite.config.js` for frontend port.
<!-- end-dev -->
