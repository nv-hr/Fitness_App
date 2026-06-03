# Coding Conventions

**Analysis Date:** 2026-06-02

## Project Structure

```
fitness-app/
├── backend/              # Express.js API server (ESM)
│   ├── src/
│   │   ├── app.js                  # Express app setup
│   │   ├── server.js               # Server entry point
│   │   ├── config/                 # Database, Passport config
│   │   ├── controllers/            # Request handlers
│   │   ├── middlewares/            # Auth, rate limiters
│   │   ├── repositories/           # SQL query layer
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Business logic
│   │   └── utils/                  # Errors, response, strings, food helpers
│   ├── tests/
│   │   ├── unit/                   # Unit tests
│   │   └── integration/            # Integration tests
│   └── package.json
├── frontend/              # React SPA (Vite + ESM)
│   └── src/
│       ├── app/                    # App, Router, Providers
│       ├── features/               # Feature modules
│       │   ├── auth/
│       │   ├── activities/
│       │   ├── food-log/
│       │   ├── profile/
│       │   ├── progress/
│       │   └── weekly-plan/
│       └── shared/                 # Shared lib, hooks, calendar
└── package.json          # Root workspace config
```

## Languages & Runtime

- **Backend:** Node.js ≥18 with ES Modules (`"type": "module"`)
- **Frontend:** React 19 with JSX, Vite 8 bundler
- **TypeScript:** Type checking via `tsc --noEmit` at root level only (no TS compilation), actual source files are `.js`/`.jsx`
  - `tsconfig.json` has `"allowJs": true` and `"noEmit": true`
  - Path alias: `@/*` maps to root `./*`

## Naming Conventions

### Files

| Pattern | Example | Usage |
|---------|---------|-------|
| `kebab-case.js` | `auth.routes.js`, `activityLog.service.js`, `dbErrors.js` | Backend utility/data files |
| `PascalCase.jsx` | `LoginForm.jsx`, `CalendarGrid.jsx`, `App.jsx` | Frontend React components |
| `camelCase.js` | `authApi.js`, `http.js`, `calendarUtils.js` | Frontend non-component modules (hooks, utils, API clients) |
| `camelCase.test.js` | `calendarUtils.test.js`, `food.utils.test.js` | Test files (both platforms) |
| `camelCase.test.jsx` | `CalendarGrid.test.jsx`, `ActivitySummary.test.jsx` | Frontend component tests |

### Functions & Variables

- **Functions:** `camelCase` — `export function register()`, `calculateBmi()`, `fuzzyMatchFoodName()`
- **Variables:** `camelCase` — `const weekStarts`, `let bestDistance`
- **Constants:** `UPPER_SNAKE_CASE` — `VALID_INTENSITIES`, `INTENSITY_MULTIPLIERS`, `API_BASE`, `DAY_STATUS`
- **Classes:** `PascalCase` — `AppError`, `ValidationError`, `NotFoundError`
- **React Components:** `PascalCase` — `LoginForm`, `CalendarGrid`, `DashboardPlaceholder`
- **Hooks:** `camelCase` with `use` prefix — `useAuth`, `useResponsive`, `useMonthData`
- **Props destructuring:** In function signature — `export function DayActivityRow({ activity, onToggle, completed, disabled })`
- **Boolean variables:** No strict prefix convention, but `isX` patterns appear (`isMobile`, `isSubmitting`, `isPast`, `isCustom`, `isOldFormat`)

### Exports

- **Controllers:** Named exports for individual handler functions + `export default { ... }` object
- **Services:** Named exports throughout (no default exports)
- **React Components:** `export default function ComponentName()` pattern
- **Utils/Helpers:** Named exports throughout
- **Route definitions:** `export default router`

```javascript
// controllers — named + default object
export async function register(req, res, next) { ... }
export default { register, login, logout, getMe, googleCallback };

// services — named only
export function calculateBmi(weightKg, heightCm) { ... }
export async function getProfile(userId) { ... }

// React components — default export
export default function CalendarGrid() { ... }
```

## Code Style

### Formatting & Linting

- **No ESLint, Prettier, or Biome config detected** — no automated formatter or linter is configured
- **Root `tsc --noEmit`** runs TypeScript checks (catches type errors via JSDoc annotations)
- **Style consistency appears manual**, based on observed patterns:
  - 2-space indentation (inferred from all source files)
  - Single quotes for strings
  - Semicolons required
  - Trailing commas on multi-line objects/arrays

### Imports

**Order (both platforms):**
1. External library imports (express, react, jwt, bcrypt)
2. Internal project imports (controllers, services, utils)
3. CSS imports (frontend only)

**No barrel files** — imports are direct paths to module files, e.g.:
```javascript
import { register as registerUser } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { Router } from 'express';
```

**Path aliases:** `@/*` available via tsconfig but not widely used in source files.

### React Patterns

- **Functional components only** — no class components anywhere
- **Hooks for state/side effects** — `useState`, `useEffect`, custom hooks
- **Context for global state** — `AuthContext` with `useAuth()` consumer hook
- **Form handling:** `react-hook-form` with `zod` schema validation
  ```jsx
  const schema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  ```
- **Data fetching:** TanStack React Query (`@tanstack/react-query`) with `useQueries` and `QueryClientProvider`
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Icons:** `lucide-react` for all icon components

### Backend Patterns

**Layer architecture:** `route → controller → service → repository`

1. **Routes** (`routes/*.routes.js`): Define HTTP method + path, attach middleware and controller
   ```javascript
   const router = Router();
   router.use(authenticateToken);
   router.post('/', profileController.createProfile);
   export default router;
   ```

2. **Controllers** (`controllers/*.controller.js`): Handle request/response, call services
   ```javascript
   export async function createProfile(req, res, next) {
     try {
       const result = await profileService.createProfile(userId, data);
       return successResponse(res, result, 201);
     } catch (err) {
       if (err instanceof ValidationError) {
         return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
       }
       next(err);
     }
   }
   ```

3. **Services** (`services/*.service.js`): Business logic, validation, computation
   ```javascript
   export function calculateBmi(weightKg, heightCm) {
     const heightM = heightCm / 100;
     const bmi = weightKg / (heightM * heightM);
     return Math.round(bmi * 10) / 10;
   }
   ```

4. **Repositories** (`repositories/*.repository.js`): SQL queries via `pg.Pool`
   ```javascript
   export async function findByUserId(userId) {
     try {
       const { rows } = await pool.query(
         'SELECT * FROM profiles WHERE user_id = $1 LIMIT 1',
         [userId]
       );
       return rows[0] || null;
     } catch (err) {
       throw new AppError('DatabaseError', `Failed to find profile: ${err.message}`, 500);
     }
   }
   ```

**ESM import patterns:**
- `import { Router } from 'express';`
- `import { pool } from '../config/database.js';`
- File extensions required in ESM imports (`.js`)
- `__dirname` computed via `fileURLToPath` + `dirname` for path resolution

### JSDoc Annotations

Services and utilities use JSDoc for public functions:

```javascript
/**
 * Calculate BMI from weight (kg) and height (cm).
 * Per D-13: heightM = heightCm / 100, bmi = weightKg / (heightM * heightM)
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number} BMI rounded to 1 decimal place
 */
export function calculateBmi(weightKg, heightCm) { ... }
```

Controllers and routes are less consistently documented.

## Error Handling

### Custom Error Classes (`backend/src/utils/errors.js`)

Hierarchy of operational errors:

```javascript
export class AppError extends Error {
  constructor(name, message, statusCode, isOperational = true) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError { constructor(message) { super('ValidationError', message, 400); } }
export class AuthenticationError extends AppError { constructor(message) { super('AuthenticationError', message, 401); } }
export class NotFoundError extends AppError { constructor(message) { super('NotFoundError', message, 404); } }
```

### Response Format

Consistent JSON envelope:

```javascript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { message: '...', code: 'VALIDATION_ERROR' } }
```

Helper functions in `backend/src/utils/response.js`:
```javascript
successResponse(res, data, statusCode = 200);
errorResponse(res, message, statusCode = 500, code = 'INTERNAL_ERROR');
```

### Error Flow in Controllers

```javascript
export async function handler(req, res, next) {
  try {
    // ... business logic
    return successResponse(res, data);
  } catch (err) {
    if (err instanceof KnownError) {
      return errorResponse(res, err.message, statusCode, 'ERROR_CODE');
    }
    next(err);  // Pass to global error handler
  }
}
```

### Global Error Handler (`backend/src/app.js`)

- Converts camelCase error names to `UPPER_SNAKE_CASE` error codes (e.g., `HTTPServerError` → `HTTP_SERVER_ERROR`)
- Returns `500` for unhandled errors

### Database Error Handling (`backend/src/utils/dbErrors.js`)

- Maps PostgreSQL error codes (`23505`, `23503`, etc.) to readable names
- Exposes `code`, `message`, `sqlState`, `table`, `constraint`, `detail`

## Logging

- **Backend:** `morgan('dev')` for HTTP request logging
- **Backend:** `console.error` for errors, `console.log` for startup/info
- **Frontend:** `console` only — no structured logging library
- No log levels framework detected

## Testing

(Full details in TESTING.md)

- **Backend:** Jest with `supertest` for HTTP integration tests
- **Frontend:** Vitest with `@testing-library/react`
- **Test location:** `__tests__/` directories co-located with source files
- **Mocking:** `vi.fn()` / `vi.mock()` on frontend, manual stubs on backend

---

*Convention analysis: 2026-06-02*
