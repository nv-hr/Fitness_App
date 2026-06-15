## 1. Security Fixes (Immediate Priority)

- [x] 1.1 Fix Path Traversal in `backend/src/services/llm.service.js` (line 11) using `path.normalize` and root bounds check
- [x] 1.2 Fix Path Traversal in `backend/src/services/llm.service.js` (line 76) using `path.normalize` and root bounds check
- [x] 1.3 Fix SSRF in `frontend/src/shared/lib/http.js` (lines 27 & 102) by implementing an outbound host allowlist
- [x] 1.4 Fix SQL Injection in `backend/src/repositories/basePlan.repository.js` (line 20) by migrating to parameterized bindings
- [x] 1.5 Fix PII Logging in `backend/src/controllers/weeklyPlan.controller.js` (line 369) by removing the unredacted `console.log()`

## 2. Dead Code Cleanup

- [x] 2.1 Run `npx fallow fix --yes` to automatically remove unused exports and dependencies
- [x] 2.2 Manually review and delete the 11 unused files reported by `fallow dead-code`

## 3. Complexity & Duplication

- [x] 3.1 Analyze the `fallow dupes` report and consolidate the most egregiously duplicated code into shared helpers
- [x] 3.2 Refactor the highest complexity functions highlighted by `fallow health`

## 4. Verification

- [x] **Task 4.1**: Final static audit to confirm maintainability score > 90 and no duplicated lines over 10.
- [x] **Task 4.2**: Run comprehensive tests to ensure no regressions.
