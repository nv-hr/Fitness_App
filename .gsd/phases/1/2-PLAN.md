---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: Basic Cleanup

## Objective
Remove unused files, exports, and npm dependencies identified in Plan 1.1, strictly excluding tests.

## Context
- .gsd/phases/1/REFACTORING_TARGETS.md
- .gsd/phases/1/knip-report.txt
- backend/

## Tasks

<task type="auto">
  <name>Remove Dead Code and Unused Dependencies</name>
  <files>
    - backend/package.json
  </files>
  <action>
    1. Review the dead code section of `REFACTORING_TARGETS.md`.
    2. Delete definitively unused files and remove unused exports in the `backend/src` directory.
    3. Uninstall unused npm packages from `backend/package.json` using `npm uninstall`.
    4. CRITICAL: Do NOT delete or modify anything in `backend/tests/` or `backend/src/__tests__/`.
  </action>
  <verify>cd backend ; npm install</verify>
  <done>Unused code and dependencies are removed, and the package installs successfully without errors.</done>
</task>

## Success Criteria
- [ ] Unused dependencies removed from package.json.
- [ ] Unused files and exports in `src` deleted.
- [ ] Tests remain untouched.
