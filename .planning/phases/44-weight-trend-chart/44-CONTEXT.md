# Phase 44: Weight Trend Chart - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (ROADMAP scope is well-defined)

<domain>
## Phase Boundary

Interactive weight trend line chart with goal reference line and date range filter, using Recharts. This creates the chart component that will be integrated into the Progress Dashboard (Phase 45).

Requirements: CHRT-01 through CHRT-05

</domain>

<decisions>
## Implementation Decisions

### Chart Architecture
- Component created at `frontend/src/features/progress/components/WeightTrendChart.jsx`
- Data sourced from existing `GET /api/progress/weight` endpoint (built in Phase 43)
- Recharts LineChart with CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine
- Date range filter as button group (30/60/90 days) that filters chart data
- Accepts optional `profile` prop for goal reference line data

### Chart States
- Empty state (0 entries): Show prompt to log first weight
- Insufficient data (1 entry): Show message to log more data
- Normal state (2+ entries): Render chart with all features

### The Agent's Discretion
- Exact Recharts styling (colors, line width, dot size)
- Responsive container implementation
- Tooltip formatting details
- Date range button styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/features/progress/api/weightApi.js` — getWeightHistory for data fetching
- Recharts v3.x installed — LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer

### Established Patterns
- React functional components with hooks
- Inline styles (no CSS framework)

### Integration Points
- Component consumed by Phase 45 Progress Dashboard
- Currently standalone — will be assembled into dashboard page

</code_context>

<specifics>
## Specific Ideas

- Date range: 30/60/90 days as tabs/buttons above the chart
- Goal line: dashed horizontal ReferenceLine at target_weight_kg (when profile has goal set)
- Auto-scaled Y-axis: domain [dataMin - 2, dataMax + 2]
- X-axis: dates formatted as locale date string

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is well-defined.

</deferred>
