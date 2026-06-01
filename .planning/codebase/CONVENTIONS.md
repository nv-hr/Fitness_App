# Coding Conventions

**Analysis Date:** 2026-06-01

## Naming Patterns

**Files:**
- Backend: `camelCase.js` (e.g., `activity.controller.js`, `activityLog.service.js`)
- Frontend Components: `PascalCase.jsx` (e.g., `ActivityCalendarSection.jsx`, `DayActivityRow.jsx`)
- Frontend Utils/API: `camelCase.js` (e.g., `activityApi.js`, `useMonthData.js`)

**Functions:**
- Handlers & Utilities: `camelCase` (e.g., `getAllActivitiesHandler`, `formatCountdown`)
- React Components: `PascalCase` (e.g., `ActivityPage`)

**Variables:**
- General: `camelCase` for instances and values.
- Constants/Environment: `UPPER_SNAKE_CASE` (e.g., `PORT`, `NODE_ENV`).

## Code Style

**Formatting & Linting:**
- The project primarily uses standard JavaScript (ES Modules).
- Linting is performed via TypeScript with `tsc --noEmit` to validate JSDoc annotations without emitting compiled code.
- Frontend uses standard Vite + React conventions, heavily utilizing Tailwind utility classes for styling rather than custom CSS formatting.

## Import Organization

**Order:**
1. Third-party packages (e.g., `import { useState } from 'react'`, `import dotenv from 'dotenv'`)
2. Local internal modules (e.g., `import { successResponse } from '../utils/response.js'`)
3. Components/Hooks/Assets (e.g., `import DayActivityRow from './DayActivityRow.jsx'`)

**Path Aliases:**
- Explicit aliases (like `@/`) are not heavily used; relative pathing is standard (e.g., `../../../shared/hooks/useResponsive.js`).

## Error Handling

**Patterns:**
- Backend controllers wrap async logic in `try/catch` blocks and pass the error to Express middleware using `next(err)`.
- Backend uses dedicated utility methods: `successResponse(res, data)` for happy paths.
- Frontend API calls use `try/catch` inside `useEffect` or event handlers to manage loading/error UI states, often catching silently for fallback UI rendering.
- Uncaught exceptions and unhandled rejections are explicitly caught at the `server.js` root and cause the server to exit gracefully.

## Logging

**Framework:** `console` and `morgan`

**Patterns:**
- Backend uses `morgan` middleware for automated HTTP request logging.
- `console.log` and `console.error` are used throughout the application to trace server startup, database connection statuses, and unexpected errors.
- Frontend utilizes `console.error` for failed API requests or unexpected edge cases.

## Comments

**When to Comment:**
- Comments are used primarily to describe the intent of complex logic, fallback conditions, and API endpoint contracts.

**JSDoc/TSDoc:**
- Heavy usage of JSDoc on backend controller and service functions (e.g., `/** GET /api/activities - Full activity pool */`). This provides documentation and integrates with the `tsc --noEmit` check.

## Function Design

**Size:** Functions and route handlers are kept small and modular.
**Parameters:** Typically single or small sets of arguments. Frontend component props are structured.
**Return Values:** Handlers do not return data directly, they call `successResponse()`. Service layer functions return Promises of pure data objects.

## Module Design

**Exports:** 
- Backend predominantly uses `export default` for main files (like `server.js` or `app.js`) and named exports (`export function`, `export const`) for services and controllers.
- Frontend uses `export default function` for top-level React components.

**Structure:**
- Backend applies a layered architecture: `routes -> controllers -> services -> repositories`.
- Frontend applies a Feature-Sliced Design pattern (e.g., `src/features/activities`, `src/shared`).

---

*Convention analysis: 2026-06-01*
