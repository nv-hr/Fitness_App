# Research Summary: Progress Tracking Features

**Domain:** Weight logging, goal setting, weight trend chart, progress dashboard
**Researched:** 2026-06-01
**Overall confidence:** HIGH

## Executive Summary

Adding progress tracking (weight logging, goals, weight chart) to the existing fitness app requires minimal stack additions. The existing React 19 + Express 5 + Supabase PostgreSQL stack handles almost everything without modification.

**The single new dependency is Recharts v3.8.1** for the weight trend line chart. It's the largest React chart library by adoption (49M weekly downloads), supports React 19 in its peerDependencies, and has a built-in `<ReferenceLine>` component that renders a goal threshold line — no custom plugin code needed. Alternatives (react-chartjs-2, Nivo, visx) either require custom reference-line plugins or are over-engineered for simple line charts.

**For the database**, two new tables are needed: `weight_log` (user_id, weight_kg, measured_at, notes) for body weight time-series data, and `goals` (user_id, goal_type, target_value, current_value, deadline_date, status) for goal tracking. PostgreSQL's `date_trunc` and `generate_series` handle time-series bucketing server-side — no TimescaleDB or other extensions needed.

**No other stack changes are required.** date-fns (already in the project) covers all date formatting and bucketing. The existing Route → Controller → Service → Repository pattern is followed for the new endpoints. TanStack React Query handles the new data fetching with zero new infrastructure.

## Key Findings

**Stack:** Recharts v3.8.1 (frontend), weight_log + goals tables (database), date-fns (already present — no change). No backend library additions.

**Architecture:** Two new feature modules (weight tracking, goals) following the existing pattern. Weight trend chart rendered as a Recharts LineChart with ReferenceLine for goal overlay.

**Critical pitfall:** Over-engineering. Weight chart is a simple line chart — don't add D3, don't add a state management library, don't add TimescaleDB. The existing stack handles everything.

## Implications for Roadmap

Suggested phase structure for progress tracking features:

1. **Database schema + backend API** — Create `weight_log` and `goals` tables, migrations, repositories, services, controllers, routes for CRUD operations
   - Addresses: persistence layer for all progress features
   - Avoids: integrating chart before data exists to test with

2. **Weight chart (frontend)** — Install Recharts, build LineChart with weight data, add ReferenceLine for goal overlay, integrate with date range filter
   - Addresses: weight trend visualization
   - Avoids: building chart before API endpoints exist

3. **Goal management UI** — Goal creation form, goal list, goal status tracking, integrate goal display on chart
   - Addresses: goal setting feature
   - Avoids: building goals without understanding chart display requirements

4. **Progress dashboard** — Aggregate views, progress indicators, combine weight chart + goal list + summary stats
   - Addresses: holistic progress view
   - Avoids: premature dashboard layout decisions before component APIs settle

**Phase ordering rationale:**
- Database must come first (data layer dependency)
- Chart before goals UI (goals display on chart influences goal schema)
- Dashboard last (composes all other components)

**Research flags for phases:**
- Phase 1: No flags — standard CRUD following existing patterns (HIGH confidence)
- Phase 2: LOW risk — Recharts is well-documented, ReferenceLine is straightforward
- Phase 3: Verify goal overlay design works with weight data shape
- Phase 4: May need UX validation for dashboard layout

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Chart library (Recharts) | HIGH | Verified React 19 compatibility in peerDeps; 49M weekly downloads; built-in ReferenceLine |
| Database schema | MEDIUM | Schema design from industry reference (sqlexplain.ai fitness schema); no load testing for scale |
| Date handling | HIGH | date-fns already in project; PostgreSQL date_trunc covers server-side bucketing |
| Backend additions | HIGH | Zero new libraries; follows existing pattern exactly |
| No-overengineering | HIGH | Confirmed Recharts is lighter-weight than Nivo/visx; PostgreSQL is sufficient over TimescaleDB |

## Gaps to Address

- **Chart testing strategy:** Recharts renders SVG — integration tests should verify chart renders with data, not test chart internals. Need to decide if snapshot testing or visual regression testing is used.
- **Goal type enumeration:** What goal types are supported initially? Weight target, body fat %, or more? Feeds into `goals.goal_type` CHECK constraint and UI design.
- **Weight log notes schema:** Allow notes on weight entries? The `weight_log.notes TEXT` column is optional but needs frontend UI consideration.
- **Dashboard metric aggregation:** What period-averages (weekly, monthly) and derived metrics (trend line, moving average) are computed server-side vs client-side? Impacts API response shape.
