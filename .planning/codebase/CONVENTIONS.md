# Coding Conventions

**Analysis Date:** 2026-06-02

## Naming Patterns

**Files:**
- Backend: `.js` extension (ESM modules), kebab-case for routes (`auth.routes.js`, `activity.routes.js`), dot-notation for logical grouping
- Frontend: `.jsx` extension for all React files, PascalCase for components (`LoginForm.jsx`, `ActivityCard.jsx`), camelCase for utilities (`calendarUtils.js`, `http.js`)
- Test files: `*.test.js` (backend Jest), `*.test.jsx` (frontend Vitest), co-located in `__tests__/` directories

**Functions:**
- Backend: `camelCase` — named async functions (`async function register(req, res, next)`)
- Frontend: `camelCase` — arrow functions for callbacks, named function declarations for components
- Event handlers prefixed with `handle` or `on`: `onSubmit`, `handleSubmit`

**Variables:**
- `camelCase` everywhere
- Constants use `UPPER_SNAKE_CASE` (`VALID_INTENSITIES`, `INTENSITY_MULTIPLIERS`)
- Destructured imports use exact property names from the source

**Types/Classes:**
- PascalCase for React components, custom classes (`AppError`, `ValidationError`, `AuthenticationError`), and React contexts (`AuthProvider`)
- Error classes extend `AppError` with pattern: `class ValidationError extends AppError`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is implicit (no `.prettierrc` found)
- Single quotes for strings in both frontend and backend
- Semicolons required
- 2-space indentation (inferred from file contents)
- Trailing commas in multiline objects and arrays

**Linting:**
- No ESLint or Biome config detected across the project
- The root `tsconfig.json` with `"noEmit": true` and `"strict": false` provides minimal type checking
- Backend uses `// eslint-disable-next-line jest/no-standalone-expect` in `helpers.js` — suggests eslint-plugin-jest may be expected but not configured

## Import Organization

**Order:**
1. Core/external library imports (`express`, `react`, `jsonwebtoken`, `zod`)
2. Internal project imports with relative paths (`../services/auth.service.js`, `./hooks/useAuth.jsx`)
3. CSS imports (frontend only: `./index.css`)

**Path Aliases:**
- Frontend: No path aliases used — all imports are relative (`../../../shared/lib/http.js`, `../api/authApi.js`)
- Backend: No path aliases used — all imports are relative (`../repositories/user.repository.js`, `../utils/errors.js`)

**Module System:**
- Both frontend and backend use ES Modules (`"type": "module"` in `package.json`)
- Backend uses `import { fileURLToPath } from 'url'` + `path.dirname()` for `__dirname` equivalent
- Frontend uses `import.meta.env` for environment variables

## Error Handling

**Backend Patterns:**

1. **Custom Error Classes** (`backend/src/utils/errors.js`):
   - `AppError` — base class with `name`, `message`, `statusCode`, `isOperational`
   - `ValidationError` — 400
   - `AuthenticationError` — 401
   - `NotFoundError` — 404

2. **Uniform Response Format** (`backend/src/utils/response.js`):
   ```js
   // Success: { success: true, data: ... }
   export function successResponse(res, data, statusCode = 200) {
     return res.status(statusCode).json({ success: true, data });
   }

   // Error: { success: false, error: { message, code } }
   export function errorResponse(res, message, statusCode = 500, code = 'INTERNAL_ERROR') {
     return res.status(statusCode).json({ success: false, error: { message, code } });
   }
   ```

3. **Controller try-catch-next pattern** — every handler wraps logic in try/catch and passes to `next(err)`:
   ```js
   async function getAllActivitiesHandler(req, res, next) {
     try {
       // ... logic ...
       return successResponse(res, { activities, total: activities.length });
     } catch (err) {
       next(err);
     }
   }
   ```

4. **Global error handler** in `backend/src/app.js` — converts error names to UPPER_SNAKE_CASE codes:
   ```js
   app.use((err, req, res, next) => {
     const statusCode = err.statusCode || 500;
     const errorCode = (err.code || err.name || 'INTERNAL_ERROR')
       .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
       .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
       .toUpperCase();
     errorResponse(res, err.message, statusCode, errorCode);
   });
   ```

5. **Specific error handling in auth.controller.js** — checks `instanceof` before falling through:
   ```js
   if (err instanceof ValidationError) {
     return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
   }
   next(err);
   ```

**Frontend Patterns:**

1. **try-catch with setError** in form handlers:
   ```jsx
   const onSubmit = async (data) => {
     try {
       setError('');
       await login(data);
       navigate('/');
     } catch (err) {
       setError(err.message || 'Incorrect email or password');
     }
   };
   ```

2. **API fetch with error object** in `frontend/src/shared/lib/http.js`:
   ```js
   if (!response.ok) {
     const err = new Error(data.error?.message || 'Request failed');
     err.retryAfter = data.error?.retryAfter;
     err.code = data.error?.code;
     throw err;
   }
   ```

## Logging

**Framework:** `console.log`, `console.error`, `console.warn` — no structured logging library (e.g., Winston, Pino) detected

**Backend Patterns:**
- Server startup: `console.log(\`Server running on port ${PORT} ...\`)`
- Error context: `console.error('[DailyMealPlan] Failed to fetch user data:', err.message)`
- Warnings: `console.warn(\`[LLM] Swap LLM call failed: ${err.message}\`)`
- Fallback indicators: `console.warn('[DailyMealPlan] All generation attempts failed, returning fallback')`
- Component prefix convention: `[ComponentName]` prefix in log messages (`[LLM]`, `[DailyMealPlan]`)

**Frontend:**
- Minimal logging — errors handled via state (`setError`) rather than console

## Comments

**When to Comment:**
- JSDoc/TSDoc for public service functions (backend)
- Inline comments for non-obvious business logic
- Requirement references: `// D-01: Set httpOnly JWT cookie`, `// T-01-06: prevent email enumeration`
- Section separators: `// === Middleware (order matters) ===`, `// ──────────────────────────────────────────────`

**JSDoc/TSDoc:**
- Backend services use `@param`, `@returns`, `@throws` annotations consistently:
  ```js
  /**
   * Register a new user with email, password, and PDP consent.
   * @param {Object} params
   * @param {string} params.email
   * @param {boolean} params.pdpConsent
   * @returns {Promise<{user: Object, token: string}>}
   */
  ```
- Controllers use `/** GET /api/activities — Full activity pool */` header-style comments
- Frontend components have minimal JSDoc — mostly inline comments

## Function Design

**Size:** Functions vary from small (5-line route handlers) to large (780-line `llm.service.js` with 20+ functions). Controllers are typically 15-60 lines each.

**Parameters:**
- Backend: Standard Express signature `(req, res, next)` for middleware/controllers
- Backend services: Single `params` object pattern: `async function register({ email, password, pdpConsent })`
- Backend LLM service: Dependency injection pattern with `deps` object: `async function generateWeeklyPlan(deps)`
- Frontend components: Named props via destructuring: `function ActivityCard({ activity, onLogClick, isLogging })`

**Return Values:**
- Backend controllers: Always return `successResponse(res, data)` or `errorResponse(res, msg, code, errCode)`
- Backend services: Return `{ user, token }`, `{ plan, fromCache, status }`, or throw custom errors
- Frontend API functions: Return the full response object from `apiGet`/`apiPost` (which returns `data` from `{ success: true, data }`)

## Module Design

**Exports:**
- Backend controllers: Export a default object with named handler functions:
  ```js
  export default {
    getAllActivities: getAllActivitiesHandler,
    logActivity,
    getActivityLogs,
  };
  ```
  Also use named exports for some controller functions: `export async function register(req, res, next)`
- Backend services: Primarily named exports (`export async function register`, `export function generateToken`)
- Frontend components: Default export (`export default function LoginForm()`)
- Frontend utilities: Named exports (`export const DAY_STATUS = ...`, `export function buildMonthGrid(...)`)
- Frontend hooks: Named exports + context provider exports (`export function AuthProvider`, `export function useAuth()`)

**Barrel Files:**
- Frontend uses barrel `index.js` files per feature: `frontend/src/features/activities/index.js`:
  ```js
  export { default as ActivityCalendarSection } from './components/ActivityCalendarSection.jsx';
  export { default as ActivityPage } from './ActivityPage.jsx';
  ```

## Security Patterns

- **JWT in httpOnly cookie** (D-01): Token read from `req.cookies.token`, not Authorization header — defined in `backend/src/middlewares/auth.middleware.js`
- **HS256 algorithm enforced**: `jwt.verify(token, secret, { algorithms: ['HS256'] })` to prevent algorithm confusion
- **Rate limiting**: `express-rate-limit` applied per-route with per-user key generators and NODE_ENV-aware config (lower limits in dev, higher in test)
- **bcrypt**: 10 salt rounds, timing-safe comparison with dummy hash to prevent email enumeration
- **Helmet, CORS, compression** middleware chain in `app.js`
- **Cookie options**: `{ httpOnly: true, secure: true, sameSite: 'none', maxAge: 7d }`

## Frontend-Specific Patterns

**Component Structure:**
- Functional components with hooks, no class components
- Consistent Tailwind CSS v4 styling with theme tokens (`font-display`, `shadow-lux`, `shadow-elevated`)
- Lucide React icons for all icons
- Form validation with `react-hook-form` + `zod`:

  ```jsx
  const schema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  ```

**Data Fetching:**
- Custom `apiFetch` wrapper at `frontend/src/shared/lib/http.js` with `credentials: 'include'` for cookie auth
- Feature-specific API modules: `activityApi.js`, `activityCalendarApi.js`, `dailyMealPlanApi.js`
- TanStack React Query for caching via `Providers.jsx` with default `staleTime: 5 * 60 * 1000`, `retry: 1`

**Directory Structure per Feature:**
```
features/feature-name/
  index.js           # barrel exports
  api/               # API functions
  components/        # React components (with __tests__/ subdirectory)
  hooks/             # Custom hooks
```

## Backend-Specific Patterns

**Layer Architecture:**
```
routes/      → controllers/    → services/    → repositories/    → database/
  (router)      (handlers)       (business       (data access)      (pg pool)
                                  logic)
```

**Route definitions**: `Router()` with chained `.get()`, `.post()`, `.delete()` methods, middleware applied via `router.use(authenticateToken)` or inline.

**Repository pattern**: All SQL queries live in `repositories/` — controllers and services never write raw SQL.

**Utils pattern**: Utility functions in `utils/` — `errors.js`, `response.js`, `string.js`, `food.js`, `dbErrors.js`.

---

*Convention analysis: 2026-06-02*
