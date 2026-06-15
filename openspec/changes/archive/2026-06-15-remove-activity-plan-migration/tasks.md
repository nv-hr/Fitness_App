## 1. Backend Route Updates

- [x] 1.1 Remove `migratePlan` invocation from `GET /api/weekly-plans` route.
- [x] 1.2 Remove any `[Migration]` logging logic from the same route.
- [x] 1.3 Ensure the route strictly returns the retrieved document.

## 2. Cleanup

- [x] 2.1 Remove any unused `migratePlan` utility functions if they are only used in this fetch route.
