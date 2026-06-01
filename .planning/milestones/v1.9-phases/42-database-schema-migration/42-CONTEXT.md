# Phase 42: Database Schema & Migration - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — smart discuss skipped)

<domain>
## Phase Boundary

Weight tracking and goal database schema in place with existing data backfilled.

Deliverables:
1. weight_logs table with columns (id, user_id, weight_kg, logged_date, source, notes, created_at) and UNIQUE(user_id, logged_date) constraint
2. target_weight_kg and target_date columns added to profiles table
3. Existing user weights backfilled from profiles.weight_kg → weight_logs
4. B-tree index on weight_logs(user_id, logged_date DESC)
5. All migrations are re-runnable (idempotent)

</domain>

<decisions>
## Implementation Decisions

### The Agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure phase. Use existing migration patterns from the codebase (supabase/migrations/ directory).

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

Key references:
- supabase/migrations/ — existing migration patterns
- backend/src/repositories/ — existing pg query patterns
- Existing profiles table schema for reference

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Requirements DB-01 through DB-04 define the scope.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase scope is well-defined.

</deferred>
