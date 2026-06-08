---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Unit Tests for Activity Plan Service

## Objective
Write comprehensive unit tests for the pure business logic extracted during the activity plan refactoring (`validator.js` and `generator.js`). This replaces the old tests from `llm.service.test.js`.

## Context
- `.gsd/DECISIONS.md`
- `.gsd/phases/3/RESEARCH.md`
- `backend/src/services/activityPlan/validator.js`
- `backend/src/services/activityPlan/generator.js`

## Tasks

<task type="auto">
  <name>Test activityPlan validator</name>
  <files>
    backend/tests/unit/activityPlan.validator.test.js
  </files>
  <action>
    - Create unit tests covering `validateActivityPlanStructure` and `validateAndFixActivityPlan`.
    - Test edge cases like invalid durations, unknown activity names, fuzzy matches, and exceeding total days.
    - Ensure tests assert actual outputs (errors returned, specific fixed names).
  </action>
  <verify>npm run test:unit -- backend/tests/unit/activityPlan.validator.test.js</verify>
  <done>All validation tests pass and cover failure paths.</done>
</task>

<task type="auto">
  <name>Test activityPlan generator fallbacks</name>
  <files>
    backend/tests/unit/activityPlan.generator.test.js
  </files>
  <action>
    - Create unit tests covering `generateFallbackActivityPlan` and any pure text-prompt generation logic (e.g. `buildActivityPlanPrompt` if exported).
    - Ensure it returns correct fallback defaults when DB isn't available.
  </action>
  <verify>npm run test:unit -- backend/tests/unit/activityPlan.generator.test.js</verify>
  <done>Fallback logic returns valid fallback plans and passes execution.</done>
</task>

## Success Criteria
- [ ] `activityPlan.validator.test.js` is implemented and passes.
- [ ] `activityPlan.generator.test.js` is implemented and passes.
