# Phase 3: Cleanup & Issue Resolution - Plan

## Wave 1: Cleanup Unused Code and Tables

### Task 3-01-01: Remove dead mealPlan code
- **Files Modified**: 
  - `backend/src/repositories/mealPlan.repository.js`
  - `backend/src/services/mealPlan/generator.js`
  - `backend/src/services/mealPlan/index.js`
  - `backend/db/drop_user_activity_log.sql`
- **Description**: Delete these obsolete files as identified in the phase context and research.
- **Automated Verify**: `cd backend && npm run test`

### Task 3-01-02: Drop unused tables from schema
- **Files Modified**: 
  - `backend/db/schema.sql`
- **Description**: Remove the `meal_plans` and `user_activity_log` table creation scripts from the reference `schema.sql` file.
- **Automated Verify**: `cd backend && npm run test`

## Wave 2: Security Fixes

### Task 3-02-01: Implement Zod Auth Validation (AUDIT-SEC-001)
- **Files Modified**: 
  - `backend/src/utils/validation.js` (NEW)
  - `backend/src/controllers/auth.controller.js`
- **Description**: 
  - Create `utils/validation.js` and add a `zod` schema for `registerSchema` (requires email, password min 8) and `loginSchema`.
  - Update `auth.controller.js` to validate `req.body` using these schemas before processing login/register.
  - Return HTTP 400 with a clean error message if validation fails.
- **Automated Verify**: `cd backend && npm run test`

### Task 3-02-02: Prevent LLM Prompt Injection (AUDIT-SEC-002)
- **Files Modified**: 
  - `backend/src/services/llm.service.js`
- **Description**: 
  - In `buildPrompt` (or where user inputs are interpolated into LLM prompts), add a sanitization utility.
  - Truncate `fitness_goal` and `activity_level` to a maximum of 100 characters.
  - Strip characters like `<` and `>` to prevent basic XML/HTML injection formatting.
- **Automated Verify**: `cd backend && npm run test`
