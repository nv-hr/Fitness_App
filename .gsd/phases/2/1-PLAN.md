---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Controller Exports Refactor

## Objective
Convert default exports in controllers to named exports to resolve dead-code false positives and improve ES Module tree-shaking. Update the corresponding routes.

## Context
- .gsd/phases/2/RESEARCH.md
- backend/src/controllers/auth.controller.js
- backend/src/controllers/food.controller.js
- backend/src/controllers/profile.controller.js
- backend/src/routes/auth.routes.js
- backend/src/routes/food.routes.js
- backend/src/routes/profile.routes.js

## Tasks

<task type="auto">
  <name>Refactor Auth and Profile Controllers</name>
  <files>
    - backend/src/controllers/auth.controller.js
    - backend/src/routes/auth.routes.js
    - backend/src/controllers/profile.controller.js
    - backend/src/routes/profile.routes.js
  </files>
  <action>
    1. In `auth.controller.js`, remove the `export default { ... }` block at the bottom.
    2. In `auth.routes.js`, change `import authController from ...` to `import * as authController from ...`.
    3. In `profile.controller.js`, remove the `export default { ... }` block.
    4. In `profile.routes.js`, change `import profileController from ...` to `import * as profileController from ...`.
  </action>
  <verify>cd backend ; npx knip --production</verify>
  <done>Controllers use only named exports, and routes import them correctly without syntax errors.</done>
</task>

<task type="auto">
  <name>Refactor Food Controller</name>
  <files>
    - backend/src/controllers/food.controller.js
    - backend/src/routes/food.routes.js
  </files>
  <action>
    1. In `food.controller.js`, remove the `export default { ... }` block.
    2. In `food.routes.js`, change `import foodController from ...` to `import * as foodController from ...`.
  </action>
  <verify>cd backend ; npx knip --production</verify>
  <done>Food controller uses only named exports, and routes import it correctly without syntax errors.</done>
</task>

## Success Criteria
- [ ] No default export objects remain in auth, food, or profile controllers.
- [ ] Routes successfully import controllers as named modules (`import * as`).
