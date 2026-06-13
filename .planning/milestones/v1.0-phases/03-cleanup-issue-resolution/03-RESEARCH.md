# Phase 3: Cleanup & Issue Resolution - Research

## Discovery
1. **Unused Backend Routes and Tables**:
   - The Phase 2 frontend-route mapping revealed no frontend usages of the `mealPlan` service. The backend `dailyMealPlan` supersedes it.
   - The `backend/src/services/mealPlan` and `backend/src/repositories/mealPlan.repository.js` are dead code.
   - The database table `meal_plans` is unused.
   - The `user_activity_log` table has a drop script (`backend/db/drop_user_activity_log.sql`) and is superseded by `activity_logs`. It can be safely dropped.

2. **Security Issue: Auth Input Validation (AUDIT-SEC-001)**:
   - The `backend/src/controllers/auth.controller.js` (or service) lacks strict validation for email and password.
   - The frontend already uses Zod. Standardizing on Zod for backend validation allows potential future schema sharing and provides robust validation.

3. **Security Issue: LLM Prompt Injection (AUDIT-SEC-002)**:
   - The `backend/src/services/llm.service.js` directly interpolates `fitness_goal` and `activity_level` into LLM system prompts.
   - This risks prompt injection (e.g., "Ignore previous instructions").
   - Solution: Silent truncation to a reasonable character limit (e.g., 100 chars) and stripping of non-alphanumeric or restricted characters if necessary.

## Conclusion
The path forward is to delete the identified dead files and tables, implement a Zod schema in `backend/src/utils/validation.js`, apply it to the auth controller, and add a sanitization utility in the LLM service.
