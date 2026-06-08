# Deprecated and Unused Tables Analysis

This document tracks tables in the database schema that are either deprecated, completely unused by the application codebase, or anomalous (e.g., used by the code but missing from the schema definition).

## 1. `user_activity_log`

**Status:** 🔴 Deprecated & Unused

**Analysis:**
- **In Schema:** Defined in `schema.sql` (lines 113-123).
- **In Codebase:** A search through all `.js` files reveals that `user_activity_log` is completely unreferenced by any repository or service.
- **Context:** The table was replaced by the new `activity_logs` table (which tracks duration, intensity, and calories instead of just a completed date and notes). The schema explicitly marks its index for removal (`-- REMOVE AFTER MIGRATION: index on deprecated user_activity_log (kept for backward compat until phase 14 cleanup)`).
- **Recommendation:** Drop this table from `schema.sql` and remove the `drop_user_activity_log.sql` file.

## 2. `daily_meal_plans` (Anomaly: Missing from Schema)

**Status:** ⚠️ Used in Code, Missing from Schema

**Analysis:**
- **In Schema:** NOT defined in `schema.sql` or any other `.sql` file in the `db/` folder.
- **In Codebase:** Heavily referenced and queried in `src/repositories/dailyMealPlan.repository.js` (used for `INSERT`, `UPDATE`, and `SELECT`).
- **Context:** While not an "unused" table, this is a critical anomaly. The codebase relies on this table to store daily LLM-generated meal plans, but the table creation statement (`CREATE TABLE IF NOT EXISTS daily_meal_plans ...`) is completely missing from the schema initialization script.
- **Recommendation:** Add the `daily_meal_plans` table definition to `schema.sql` before deploying, or any fresh environment will crash when attempting to fetch or save a daily meal plan.
