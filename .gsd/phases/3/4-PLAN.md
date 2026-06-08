---
phase: 3
plan: 4
wave: 3
---

# Plan 3.4: Cleanup Old Test Suite

## Objective
Remove the old test files that were kept for reference during Phase 1, now that the new tests completely cover the LLM and validation domains.

## Context
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Delete old llm service tests</name>
  <files>
    backend/tests/unit/llm.service.test.js
  </files>
  <action>
    - Delete `backend/tests/unit/llm.service.test.js`.
    - Ensure `npx knip --production` passes (no dead code introduced by removing tests).
  </action>
  <verify>npm run test:unit</verify>
  <done>Only new tests run and all pass; `llm.service.test.js` is gone.</done>
</task>

## Success Criteria
- [ ] Old test files removed.
- [ ] Test suite successfully runs without old tests.
