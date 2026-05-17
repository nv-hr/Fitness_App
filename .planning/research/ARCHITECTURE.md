# Architecture Patterns

**Domain:** Fitness/Health Tracking Web App (BMI, TDEE, Food Logging, Activity Recommendations)
**Stack:** React + Express + MySQL
**Researched:** 2026-05-17

## Recommended Architecture

```
Fitness_App/
├── frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── app/                 # App shell: router, providers, global config
│   │   │   ├── Router.jsx
│   │   │   ├── Providers.jsx    # AuthProvider, QueryClientProvider
│   │   │   └── App.jsx
│   │   ├── features/            # Feature modules (feature-first organization)
│   │   │   ├── auth/            # Login, register, OAuth
│   │   │   │   ├── api/         # authApi.js (fetch functions)
│   │   │   │   ├── components/  # LoginForm, RegisterForm
│   │   │   │   ├── hooks/       # useAuth, useSession
│   │   │   │   └── index.js     # Public API
│   │   │   ├── bmi/             # BMI calculator
│   │   │   │   ├── components/  # BMIForm, BMIResult
│   │   │   │   ├── hooks/       # useBMICalculator
│   │   │   │   └── index.js
│   │   │   ├── tdee/            # TDEE calculator
│   │   │   │   ├── components/  # TDEEForm, TDEEResult
│   │   │   │   ├── hooks/       # useTDEECalculator
│   │   │   │   └── index.js
│   │   │   ├── food-log/        # Daily food logging
│   │   │   │   ├── api/         # foodLogApi.js
│   │   │   │   ├── components/  # FoodSearch, FoodLogEntry, DailySummary
│   │   │   │   ├── hooks/       # useFoodLog, useFoodSearch
│   │   │   │   └── index.js
│   │   │   └── activity/        # Activity recommendations
│   │   │       ├── components/  # ActivityCard, ActivityList
│   │   │       ├── hooks/       # useActivityRecommendations
│   │   │       └── index.js
│   │   ├── shared/              # Cross-feature shared code
│   │   │   ├── components/      # Button, Input, Card, Layout, Header
│   │   │   ├── hooks/           # useLocalStorage, useDebounce
│   │   │   ├── lib/             # HTTP client (axios/fetch wrapper)
│   │   │   ├── utils/           # formatDate, calculateBMI, calculateTDEE
│   │   │   └── i18n/            # Bahasa Indonesia translations
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Express.js API server
│   ├── src/
│   │   ├── config/              # DB connection, env vars, constants
│   │   │   ├── database.js      # MySQL pool connection
│   │   │   └── index.js         # Centralized config
│   │   ├── controllers/         # HTTP layer (thin: parse req, call service, format res)
│   │   │   ├── auth.controller.js
│   │   │   ├── bmi.controller.js
│   │   │   ├── tdee.controller.js
│   │   │   ├── food.controller.js
│   │   │   ├── foodLog.controller.js
│   │   │   └── activity.controller.js
│   │   ├── services/            # Business logic (no req/res, pure data in/out)
│   │   │   ├── auth.service.js
│   │   │   ├── bmi.service.js
│   │   │   ├── tdee.service.js
│   │   │   ├── food.service.js
│   │   │   ├── foodLog.service.js
│   │   │   └── activity.service.js
│   │   ├── repositories/        # Data access (MySQL queries only)
│   │   │   ├── user.repository.js
│   │   │   ├── food.repository.js
│   │   │   └── foodLog.repository.js
│   │   ├── models/              # MySQL table definitions / seed data
│   │   │   ├── seed/            # Indonesian food database seed SQL
│   │   │   └── migrations/      # Schema migration files
│   │   ├── routes/              # Route definitions (boring: URL -> controller)
│   │   │   ├── index.js         # Mounts all feature routers
│   │   │   ├── auth.routes.js
│   │   │   ├── bmi.routes.js
│   │   │   ├── tdee.routes.js
│   │   │   ├── food.routes.js
│   │   │   ├── foodLog.routes.js
│   │   │   └── activity.routes.js
│   │   ├── middlewares/         # Cross-cutting concerns
│   │   │   ├── auth.middleware.js     # JWT verification
│   │   │   ├── validate.middleware.js # Input validation (Zod)
│   │   │   └── error.middleware.js    # Global error handler
│   │   ├── utils/               # Helpers
│   │   │   ├── errors.js        # Custom error classes
│   │   │   └── response.js      # Standardized response format
│   │   ├── app.js               # Express app setup (middleware, routes)
│   │   └── server.js            # Server entry point (listen)
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml           # MySQL + (optional) backend dev
├── package.json                 # Root: workspaces, dev scripts
└── .env.example
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Frontend: App Shell** | Routing, global providers (auth, query client), error boundaries | All feature modules |
| **Frontend: Feature Modules** | Domain-specific UI, hooks, API adapters for one feature | Shared layer, Backend API |
| **Frontend: Shared Layer** | UI primitives (Button, Input), HTTP client, i18n, pure utilities | Nothing (leaf layer) |
| **Backend: Routes** | URL mapping, middleware assignment, versioning | Controllers only |
| **Backend: Controllers** | HTTP parsing (req.body, req.params), service invocation, response formatting | Services only |
| **Backend: Services** | Business rules (BMI formula, TDEE calculation, calorie balance, activity randomization) | Repositories only |
| **Backend: Repositories** | MySQL queries (CRUD, seeding, aggregation) | MySQL database only |
| **Backend: Middleware** | JWT auth, input validation (Zod), error handling | Routes (before controllers) |
| **MySQL Database** | Persistent storage: users, foods, food logs, user profiles | Repositories only |

### Dependency Rule (strict, no exceptions)

```
Routes -> Controllers -> Services -> Repositories -> MySQL
   ^         ^              ^            ^
   |         |              |            |
Middleware  (HTTP)      (Business)    (Data)
```

**Never:**
- Controllers call repositories directly (skip service layer)
- Services know about `req` or `res` (HTTP coupling)
- Repositories contain business logic
- Routes contain business logic or database queries

## Data Flow

### Request Flow (Write: Log Food)

```
Browser
  |
  | POST /api/food-log
  | { foodId: 3, servings: 2, date: "2026-05-17" }
  v
[Middleware: auth] -> verify JWT, attach user to req
  |
  v
[Middleware: validate] -> Zod schema check (foodId, servings, date required)
  |
  v
[Controller: foodLog] -> extract user.id, req.body, call service
  |
  v
[Service: foodLog] -> business logic:
  |   1. Validate food exists (call foodRepo)
  |   2. Calculate calories = food.calories * servings
  |   3. Check no duplicate entry for same food+date
  |   4. Create log entry
  |
  v
[Repository: foodLog] -> INSERT INTO food_logs (user_id, food_id, servings, calories, date)
  |
  v
[MySQL] -> returns inserted row
  |
  v
[Service] -> returns { id, foodName, servings, calories, date }
  |
  v
[Controller] -> res.status(201).json({ success: true, data: ... })
  |
  v
Browser -> TanStack Query invalidates cache, UI updates
```

### Request Flow (Read: Dashboard)

```
Browser (mounted Dashboard page)
  |
  | useQuery(['daily-summary', date]) -> GET /api/food-log/summary?date=2026-05-17
  v
[Middleware: auth] -> verify JWT
  |
  v
[Controller: foodLog] -> extract user.id, date from query params
  |
  v
[Service: foodLog] -> orchestrate:
  |   1. Get user profile (userRepo) for TDEE target
  |   2. Sum today's food logs (foodLogRepo)
  |   3. Calculate balance = TDEE - consumed
  |   4. Get activity recommendations (activity service)
  |
  v
[Repositories] -> parallel queries:
  |   - SELECT SUM(calories) FROM food_logs WHERE user_id=? AND date=?
  |   - SELECT weight, height, activity_level FROM user_profiles WHERE user_id=?
  |
  v
[MySQL] -> returns aggregated data
  |
  v
[Service] -> returns { consumed: 1800, target: 2200, balance: 400, activities: [...] }
  |
  v
[Controller] -> res.json({ success: true, data: ... })
  |
  v
Browser -> TanStack Query caches, components render
```

### Authentication Flow

```
Browser: Login form submits { email, password }
  |
  v
POST /api/auth/login
  |
  v
[Controller] -> calls authService.login(email, password)
  |
  v
[Service] -> 
  |   1. userRepo.findByEmail(email)
  |   2. crypto.compare(password, user.password_hash)
  |   3. jwt.sign({ userId, email })
  |
  v
[Controller] -> res.json({ token, user: { id, email, name } })
  |
  v
Browser -> stores JWT in localStorage
  |
  v
Subsequent requests -> Authorization: Bearer <token> header
  |
  v
[Middleware: auth] -> jwt.verify(token), req.user = decoded
```

## Suggested Build Order

Build order is driven by **data dependencies** — each phase depends on the previous one's data structures and APIs being available.

### Phase 1: Foundation (Infrastructure + Auth)

**Why first:** Every other feature requires a logged-in user. Auth establishes the data model for users and the security layer for all subsequent APIs.

**Deliverables:**
- Monorepo structure (frontend/ + backend/)
- MySQL database setup + connection pooling
- User table schema + migration
- Backend: auth routes/controller/service/repository
- JWT middleware + error handling middleware
- Frontend: app shell, router, HTTP client, auth context
- Login/Register pages with form validation
- Google OAuth integration

**Dependencies:** None (greenfield)

### Phase 2: User Profile + BMI Calculator

**Why second:** BMI requires user profile data (weight, height, age, gender). Establishes the profile data model that TDEE will extend.

**Deliverables:**
- User profile table (weight, height, age, gender)
- Backend: BMI calculation service (standard BMI formula)
- Frontend: BMI input form, result display with category
- BMI history tracking (optional: store past calculations)

**Dependencies:** Phase 1 (auth + user table)

### Phase 3: TDEE Calculator

**Why third:** TDEE extends the profile model with activity level. Uses the same input pattern as BMI but adds the activity multiplier.

**Deliverables:**
- Extend user profile with activity_level field
- Backend: TDEE calculation service (Mifflin-St Jeor formula)
- Frontend: TDEE input form, result display with calorie target
- Store TDEE result for daily balance calculations

**Dependencies:** Phase 2 (profile data model exists)

### Phase 4: Food Database + Food Logging

**Why fourth:** Food logging is the most complex feature — it requires the food database, user logs, and daily aggregation. This is the core value proposition.

**Deliverables:**
- Foods table + Indonesian food seed data
- Food logs table (user_id, food_id, servings, calories, date)
- Backend: food CRUD, food log CRUD, daily summary endpoint
- Frontend: food search, food log entry, daily summary view
- Calorie balance display (consumed vs TDEE target)

**Dependencies:** Phase 3 (TDEE target needed for balance calculation)

### Phase 5: Activity Recommendations + Polish

**Why last:** Recommendations are rule-based and depend on knowing the user's goal (from TDEE context). Least complex feature, good for final phase.

**Deliverables:**
- Activity recommendations table (seed data)
- Backend: randomized recommendation service (weighted by goal)
- Frontend: activity suggestion cards
- Bahasa Indonesia i18n across all features
- Responsive design polish

**Dependencies:** Phase 3 (TDEE goal context), Phase 4 (complete dashboard)

## Patterns to Follow

### Pattern 1: Controller-Service-Repository (Backend)

**What:** Three-layer separation of HTTP, business logic, and data access.

**Why:** Each layer is independently testable. Services can be called from HTTP, CLI, or background jobs without modification. Swapping the database only changes the repository layer.

**Example:**
```javascript
// Controller (HTTP only)
const createFoodLog = async (req, res, next) => {
  const userId = req.user.id;
  const logData = req.body;
  const result = await foodLogService.create(userId, logData);
  res.status(201).json({ success: true, data: result });
};

// Service (business logic only — no req/res)
const create = async (userId, { foodId, servings, date }) => {
  const food = await foodRepo.findById(foodId);
  if (!food) throw new NotFoundError('Food not found');
  
  const calories = Math.round(food.calories_per_serving * servings);
  return foodLogRepo.create({ userId, foodId, servings, calories, date });
};

// Repository (database only)
const create = async ({ userId, foodId, servings, calories, date }) => {
  const [id] = await db('food_logs').insert({
    user_id: userId, food_id: foodId, servings, calories, date
  });
  return findById(id);
};
```

### Pattern 2: Feature-First Frontend Organization

**What:** Group code by feature domain (auth, bmi, food-log) rather than by file type (components, hooks, services).

**Why:** Adding a feature = adding a folder. Removing a feature = deleting a folder. No cross-feature coupling. Each feature owns its UI, hooks, and API adapters.

**Dependency direction:** `routes -> features -> shared` (never reverse)

### Pattern 3: TanStack Query for Server State

**What:** Use TanStack Query (React Query) for all API data fetching, caching, and invalidation.

**Why:** Eliminates manual loading/error state management. Automatic retries, stale-while-revalidate caching, and optimistic updates. No need for Redux for server state.

**State model for this app:**
| State Type | Home | Tool |
|------------|------|------|
| Server state (API data) | TanStack Query | `useQuery`, `useMutation` |
| Form state | React Hook Form + Zod | `useForm` |
| Auth state | React Context + localStorage | `AuthProvider` |
| UI state (modals, tabs) | Local `useState` | Component-level |

### Pattern 4: Standardized API Response Format

**What:** All API responses follow a consistent envelope.

```javascript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR" } }
```

**Why:** Frontend error handling is uniform. One `parseApiError` helper works for all endpoints.

### Pattern 5: Seed Data via SQL Migrations

**What:** Indonesian food database and activity recommendations stored as SQL seed files, run during initial setup.

**Why:** No external API dependency. Data is version-controlled and reproducible. Easy to update via PR.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fat Controllers
**What:** Route handlers that validate input, query the database, apply business rules, and format responses all in one function.
**Why bad:** Impossible to test in isolation. Logic can't be reused from CLI or background jobs. Changes cascade across the entire handler.
**Instead:** Controllers are thin traffic cops — extract data from `req`, call service, format response.

### Anti-Pattern 2: Passing `req` to Services
**What:** `userService.createUser(req)` or services that access `req.body` directly.
**Why bad:** Services become coupled to HTTP. Can't call them from tests, cron jobs, or WebSocket handlers.
**Instead:** Extract plain values in the controller: `userService.createUser(req.body.email, req.body.name)`.

### Anti-Pattern 3: Storing API Responses in `useState`
**What:** Manually managing loading, error, and data states with `useState` for every API call.
**Why bad:** Duplicated caching logic, race conditions, no automatic retries, inconsistent error handling.
**Instead:** Use TanStack Query — one `useQuery` call handles all of this.

### Anti-Pattern 4: Global State for Everything
**What:** Putting auth, form data, UI toggles, and API responses all in a global store (Redux/Zustand).
**Why bad:** Unnecessary coupling. Every state change triggers re-renders across the app. Hard to trace data flow.
**Instead:** Colocate state. Server state -> TanStack Query. Form state -> React Hook Form. UI state -> `useState`. Only globalize what's truly shared (auth session).

### Anti-Pattern 5: Skipping Input Validation
**What:** Trusting `req.body` without schema validation.
**Why bad:** SQL injection risk, malformed data in database, confusing frontend errors.
**Instead:** Zod validation middleware runs before controllers. Reject invalid requests at the boundary.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database** | Single MySQL instance, simple indexes | Read replicas, connection pooling (already in place) | Sharding by user_id, caching layer (Redis) |
| **API** | Single Express instance | Load-balanced Express instances, rate limiting | API gateway, microservice split |
| **Frontend** | SPA served from Express static | CDN for static assets, code splitting | Edge rendering, PWA offline support |
| **Auth** | JWT with localStorage | JWT rotation, refresh tokens | OAuth2 with session store |
| **Food DB** | Static seed data (~500 items) | Indexed search, pagination | Full-text search (Meilisearch) |

## Sources

- [Controller-Service-Repository Pattern — StackLesson (2025)](https://www.stacklesson.com/mean-stack-tutorial/express-advanced-patterns/controller-service-repository-pattern/) — HIGH confidence
- [Express Service Layer — Compile N Run (2025)](https://compilenrun.com/docs/framework/express/express-advanced-patterns/express-service-layer) — HIGH confidence
- [Node.js Architecture 2026 — DevPro Portal](https://devproportal.com/languages/nodejs/architecting-node-js-advanced-express-patterns/) — HIGH confidence
- [Layered Architecture in Node.js — CodeArchitecture (2026)](https://codearchitecture.in/stories/layered-architecture-in-nodejs-and-express-class-based-design-dependency-injection-and-best-practices) — HIGH confidence
- [Stop Writing Spaghetti API Routes — DEV Community (2026)](https://dev.to/teguh_coding/stop-writing-spaghetti-api-routes-a-practical-guide-to-clean-expressjs-architecture-3ba7) — HIGH confidence
- [React Architecture Blueprint — Wolf Tech (2026)](https://wolf-tech.io/blog/react-for-front-end-a-practical-architecture-blueprint) — HIGH confidence
- [Feature Sliced Design Guide — DenebrixAI (2026)](https://denebrixai.com/blog/feature-sliced-design-guide/) — HIGH confidence
- [React Monorepo Best Practices — DEV Community (2025)](https://forem.com/alisamir/mastering-react-monorepos-a-developers-guide-to-scalable-codebases-1cok) — HIGH confidence
- [Simple React+Express Monorepo — Dusan Stam (2024)](https://dusanstam.com/posts/react-express-monorepo) — HIGH confidence
- [SparkyFitness Architecture (similar stack)](https://codewithcj.github.io/SparkyFitness/developer/architecture/) — HIGH confidence
- [Fitness Tracker Hexagonal Architecture — shendriks.dev (2026)](https://shendriks.dev/projects/fitness-tracker/) — MEDIUM confidence (Java/Spring but architecture principles apply)
- [Health/Fitness DB Design — GeeksforGeeks (2024)](https://www.geeksforgeeks.org/how-to-design-a-database-for-health-and-fitness-tracking-applications/) — MEDIUM confidence
- [Nutritional Tracker Data Model — Ramiro Cosa](https://blog-astro-rouge.vercel.app/en/posts/nutritional-tracker-part1/) — MEDIUM confidence
