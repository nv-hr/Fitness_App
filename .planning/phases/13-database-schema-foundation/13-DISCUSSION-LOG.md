# Phase 13: Database Schema & Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 13-Database Schema & Foundation
**Areas discussed:** Schema change approach, weekly_plans JSONB schema, Package version strategy, Migration execution method, activity_logs calories column

---

## Schema Change Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Update schema.sql in-place | Edit backend/db/schema.sql with new tables+ENUM, drop user_activity_log. Single source of truth. | ✓ |
| New migration file | Create backend/db/migrations/001-activity-tracking.sql with only the delta. Preserves history. | |

**User's choice:** Update schema.sql in-place
**Notes:** User then chose a separate cleanup script for the DROP operation rather than burying it in schema.sql.

**Follow-up — Old table drop:**

| Option | Description | Selected |
|--------|-------------|----------|
| DROP IF EXISTS in schema.sql | Add DROP TABLE IF EXISTS user_activity_log CASCADE at bottom of schema.sql | |
| Separate cleanup script | Create backend/db/drop_user_activity_log.sql that runs before schema.sql | ✓ |

**User's choice:** Separate cleanup script

---

## weekly_plans JSONB Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Expanded (name + id) | Stores activity names alongside IDs so frontend can render without extra joins | ✓ |
| Minimal (id only) | Stores only activity_ids, frontend fetches names via API | |
| LLM-native format | Store LLM output as-is with validation — most flexible but least predictable | |

**User's choice:** Expanded (name + id)
**Notes:** Self-describing JSONB structure with days array, activities array, generated_at, llm_model fields.

**Follow-up — Status column:**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add status column | TEXT column with values: active, generating, fallback, unavailable | ✓ |
| No, keep it simple | Presence/absence of plan_data and generated_at is sufficient | |

**User's choice:** Yes, add status column

---

## Package Version Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Caret ranges (recommended) | Keep ^6.1.0 and ^5.1.2 for automatic minor/patch updates | ✓ |
| Exact versions | Pin to exact versions for more reproducible builds | |

**User's choice:** Caret ranges (recommended)

**Follow-up — Node compat:**

| Option | Description | Selected |
|--------|-------------|----------|
| Add engines field + Docker check | Add node >=18 to package.json engines and Dockerfile check | ✓ |
| No version check needed | Assume Node 18+ compatibility | |

**User's choice:** Add engines field + Docker check

---

## Migration Execution Method

| Option | Description | Selected |
|--------|-------------|----------|
| psql with schema.sql + cleanup script | Run cleanup script then schema.sql via psql (existing pattern) | |
| Supabase SQL Editor (manual) | Apply changes through Supabase web UI with visual feedback | ✓ |

**User's choice:** Supabase SQL Editor (manual)
**Notes:** schema.sql remains the canonical source of truth.

**Follow-up — Verify step:**

| Option | Description | Selected |
|--------|-------------|----------|
| Manual apply only | Just apply via SQL Editor, schema.sql as source of truth | |
| Add a verify script | Add db:verify npm script comparing local schema against live DB | ✓ |

**User's choice:** Add a verify script

---

## activity_logs Calories Column

| Option | Description | Selected |
|--------|-------------|----------|
| Store pre-calculated (recommended) | Add calories_burned INT, computed at insert time | ✓ |
| Calculate at query time | Join + formula in every query, no stored column | |

**User's choice:** Store pre-calculated (recommended)

**Follow-up — Intensity multipliers:**

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed multipliers (recommended) | light=0.7, moderate=1.0, vigorous=1.3 | ✓ |
| Wider multipliers | light=0.5, moderate=1.0, vigorous=1.5 | |

**User's choice:** Fixed multipliers (recommended)

---

## the agent's Discretion

No areas deferred to agent discretion.

## Deferred Ideas

None.
