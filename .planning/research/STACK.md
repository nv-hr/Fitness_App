# Stack Research — Progress Tracking Features

**Domain:** Weight logging, goal setting, weight trend chart, progress dashboard
**Researched:** 2026-06-01
**Confidence:** HIGH

## Recommended Stack

### Charting Library

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| [recharts](https://recharts.github.io) | ^3.8.1 | Weight trend line chart with goal overlay | React 19 native (peer dep declared for 16–19); 49M weekly npm downloads — highest of any React chart lib; declarative `<LineChart>` + `<ReferenceLine>` components handle goal threshold lines **without custom plugins**; SVG-based, Vite-compatible, TypeScript-first. |

### Database Tables (Additions)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `weight_log` | Time-series body weight entries per user | `id UUID, user_id UUID FK, weight_kg NUMERIC(5,2), measured_at DATE, notes TEXT` |
| `goals` | User-defined fitness goals with target tracking | `id UUID, user_id UUID FK, goal_type TEXT, title TEXT, target_value NUMERIC(10,2), current_value NUMERIC(10,2), unit TEXT, deadline_date DATE, status TEXT` |

### No Changes Needed

| Area | Reason |
|------|--------|
| **date-fns** (v3.6.x) | Already in `frontend/package.json`. `eachDayOfInterval`, `format`, `subDays`, `startOfWeek`, `startOfMonth` cover all date-bucketing needs for chart axes and date range filters. |
| **Express middleware stack** | Helmet, CORS, rate-limit, auth — all unchanged. Weight/goal routes follow existing Route → Controller → Service → Repository pattern. |
| **pg driver** | No ORM needed. Raw SQL with `date_trunc` and `generate_series` handles time-series bucketing server-side. |
| **TanStack React Query** | Already used for all data fetching. Weight/goal queries are `useQuery` + `useMutation` — zero new fetch infrastructure. |

### Installation

```bash
# frontend/ — only recharts needed
npm install recharts

# backend/ — no new dependencies needed
# (pg, date-fns, zod already available or not needed server-side)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Recharts 3.8.1 | **react-chartjs-2** (Chart.js wrapper) | When rendering 10K+ data points and canvas performance matters. **Downside:** Goal threshold lines require a custom `afterDraw` plugin — more code for the same result. |
| Recharts 3.8.1 | **Nivo** | When server-side rendering or canvas rendering for large datasets is needed. **Downside:** Heavier bundle, more complex API for simple line charts. |
| Recharts 3.8.1 | **Visx** (Airbnb) | When building non-standard, highly custom visualizations. **Downside:** Low-level primitives — overkill for a weight trend line. |
| Recharts 3.8.1 | **ApexCharts** (react-apexcharts) | When needing advanced interactivity (zoom, brush, annotations) out of the box. **Downside:** Less React-idiomatic API, heavier bundle. |
| Recharts 3.8.1 | **Victory** | When sharing chart code between React Web and React Native. **Downside:** Slower development pace, larger bundle. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **D3.js directly** | Raw D3 is too low-level for a simple line chart. Recharts wraps D3 with declarative React components. | Recharts |
| **TimescaleDB** | Over-engineered for personal weight tracking. PostgreSQL with a `weight_log` table + index on `(user_id, measured_at)` handles millions of rows easily. | Plain PostgreSQL table |
| **Redux for chart state** | Weight chart data is server state, not client state. TanStack React Query already handles caching, refetching, and loading states. | TanStack React Query |
| **react-chartjs-2 without plugins** | Goal reference lines need a custom `afterDraw` plugin. Recharts has `<ReferenceLine>` built in. | Recharts |

## Stack Patterns by Variant

**If weight data grows to 100K+ entries per user:**
- Add PostgreSQL table partitioning by month on `weight_log.measured_at`
- Add a materialized view `weight_log_monthly_agg` for dashboard aggregation queries
- No library changes needed

**If adding advanced chart features (trend line, goal area fill, annotations):**
- Recharts supports `<ReferenceArea>` for goal range highlighting, custom dot shapes for annotations, and `dot` props for emphasis
- No additional library needed

**If adding body composition chart (weight + body fat % dual-axis):**
- Recharts `<LineChart>` supports multiple `<Line>` components with independent Y-axes using `yAxisId`

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@^3.8.1 | react@^19.2.0 | Verified in peerDependencies |
| recharts@^3.8.1 | vite@^8.0.0 | Pure ESM, works with Vite tree-shaking |
| recharts@^3.8.1 | date-fns@^3.6.0 | No conflict — date-fns is used for date formatting, recharts uses native Date |

## Sources

- [recharts GitHub — peerDependencies](https://github.com/recharts/recharts/blob/main/package.json) — React 19 support confirmed
- [recharts npm — v3.8.1](https://www.npmjs.com/package/recharts) — 49M weekly downloads, latest version
- [npm release alert — recharts versions](https://releasealert.dev/npmjs/_/recharts) — v3.8.1 released 2026-03-25, v3.8.0 added TypeScript generics
- [recharts ReferenceLine docs](https://recharts.github.io/en-US/api/ReferenceLine) — built-in component for goal threshold lines
- [recharts GitHub status update #7355](https://github.com/recharts/recharts/issues/7355) — active maintenance, new hooks for coordinate mapping
- [SQLExplain — Fitness Tracking Schema](https://sqlexplain.ai/blog/fitness-tracking-schema) — reference schema for `body_measurements` and `goals` tables
- [date-fns eachDayOfInterval](https://github.com/date-fns/date-fns/blob/main/pkgs/core/src/eachDayOfInterval/index.ts) — verified date bucketing capability (already in project)
- [usedatabrain — Best React Chart Libraries 2026](https://www.usedatabrain.com/blog/react-chart-libraries) — independent comparison, Recharts listed as "default React-native pick"

---
*Stack research for: Progress Tracking (weight log, goals, chart)*
*Researched: 2026-06-01*
