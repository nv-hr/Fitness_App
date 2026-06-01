# Requirements: Fitness_App

**Defined:** 2026-06-01
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1 Requirements

Requirements for v1.9 Progress Tracking milestone. Each maps to roadmap phases.

### Database & Schema

- [ ] **DB-01**: weight_logs table created with columns (id, user_id, weight_kg, logged_date, source, notes, created_at) and UNIQUE(user_id, logged_date) constraint
- [ ] **DB-02**: target_weight_kg and target_date columns added to profiles table
- [ ] **DB-03**: Existing user weight backfilled — INSERT INTO weight_logs FROM profiles for every existing user on migration
- [ ] **DB-04**: Index created on weight_logs(user_id, logged_date DESC) for efficient range queries

### Weight Logging

- [ ] **WLOG-01**: Weight auto-logged to weight_logs when user updates profile via PUT /api/profile (non-blocking — profile update succeeds even if weight log fails)
- [ ] **WLOG-02**: Weight auto-log is transactional — weight_log inserted AFTER profile update succeeds
- [ ] **WLOG-03**: Second weight entry on same day UPSERTs (last-write-wins), not duplicates
- [ ] **WLOG-04**: User can manually log weight via POST /api/progress/weight with weight, date, and optional notes
- [ ] **WLOG-05**: User can view weight history list with date, weight, source badge, ordered by date DESC
- [ ] **WLOG-06**: User can delete weight log entries
- [ ] **WLOG-07**: Weight logged to history when profile is first created (seeds initial entry)

### Goal Setting

- [ ] **GOAL-01**: User can set target weight (kg) and target date in profile form
- [ ] **GOAL-02**: Goal fields included in PUT /api/profile and GET /api/profile responses
- [ ] **GOAL-03**: Goal validation: target_weight 2-300kg, target_date >= today, direction matches fitness_goal

### Weight Chart

- [ ] **CHRT-01**: Weight trend line chart rendered with Recharts on progress page
- [ ] **CHRT-02**: X-axis shows dates, Y-axis shows weight with auto-scaled domain (dataMin - 2, dataMax + 2)
- [ ] **CHRT-03**: Goal reference line (dashed horizontal line at target_weight_kg) displayed when goal is set
- [ ] **CHRT-04**: Chart handles empty state (0 entries → prompt to log), insufficient data (1 entry → message), and normal display (2+ entries)
- [ ] **CHRT-05**: Date range filter (30/60/90 days) to control chart time window

### Progress Dashboard

- [ ] **DASH-01**: New /progress route with full dashboard page
- [ ] **DASH-02**: Summary card showing current weight, starting weight, change, kg to goal, % complete
- [ ] **DASH-03**: Dashboard integrates chart, weight history table, manual weight entry form, and goal display
- [ ] **DASH-04**: Loading, empty, and error states for all dashboard sub-components
- [ ] **DASH-05**: Nav link to progress page added

### Trend Prediction (P2)

- [ ] **TRND-01**: Estimated completion date calculated from actual weight trend (not calorie_rate)
- [ ] **TRND-02**: Trend prediction displayed on dashboard when sufficient data exists (3+ entries, 2+ weeks)
- [ ] **TRND-03**: Progress direction shown as rate (e.g., "losing 0.5 kg/week") with color coding

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Progress Tracking

- **TRND-04**: Moving average overlay (7-day rolling average) on weight chart
- **TRND-05**: Milestone celebrations (toast at 25/50/75/90/100% of goal)
- **DASH-06**: Progress page replaces DashboardPlaceholder at `/` route
- **DASH-07**: Calorie and activity trends integrated into dashboard page

## Out of Scope

| Feature | Reason |
|---------|--------|
| Body fat / measurements tracking | Scope creep — weight-only for v1.9 |
| Smart scale / wearable integration | Requires external API, not core |
| Weight logging reminders / notifications | No push infrastructure exists |
| Multiple weight entries per day | One-entry-per-day (UPSERT pattern) — sufficient for daily weigh-in |
| Data export (CSV/PDF) | Nice-to-have, not core to progress tracking |
| Progress photos | Requires storage infrastructure |
| Separate goals table | Goal is 1:1 with profile — columns on profiles table is simpler |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | — | Pending |
| DB-02 | — | Pending |
| DB-03 | — | Pending |
| DB-04 | — | Pending |
| WLOG-01 | — | Pending |
| WLOG-02 | — | Pending |
| WLOG-03 | — | Pending |
| WLOG-04 | — | Pending |
| WLOG-05 | — | Pending |
| WLOG-06 | — | Pending |
| WLOG-07 | — | Pending |
| GOAL-01 | — | Pending |
| GOAL-02 | — | Pending |
| GOAL-03 | — | Pending |
| CHRT-01 | — | Pending |
| CHRT-02 | — | Pending |
| CHRT-03 | — | Pending |
| CHRT-04 | — | Pending |
| CHRT-05 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| TRND-01 | — | Pending |
| TRND-02 | — | Pending |
| TRND-03 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-06-01*
*Last updated: 2026-06-01 after initial definition*
