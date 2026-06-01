# Feature Research: Progress Tracking

**Domain:** Health/Fitness App — Weight Logging, Goal Setting, Weight Chart, Progress Dashboard
**Researched:** 2026-06-01
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Auto-log weight on profile update** | Users update their weight in the profile form; they expect it to be recorded historically, not just overwritten. Every fitness app (MyFitnessPal, Lose It!, Cronometer) saves weight changes as trackable history. | LOW | Intercept PUT `/api/profile` to INSERT into a new `weight_log` table. The existing `profiles.weight_kg` field is the "current" value; weight_log stores the time series. |
| **Manual weight entry** | Users may weigh themselves without updating their full profile. A dedicated weight entry form (number input + optional notes) should be available. | LOW | Simple form: date pre-filled to today, weight input (decimal), optional note. Backend endpoint POST `/api/weight-log`. |
| **Set target weight + target date** | Goal setting is the foundation of progress tracking. Users need to specify where they want to be and by when. Standard across all competitors. | LOW | Add `target_weight_kg` and `target_date` columns to `profiles` table. Already have `fitness_goal` and `calorieRate` — these are complementary. |
| **Weight history view (table)** | Users expect to see a chronological list of past weight entries with dates and values, sortable or filterable. | LOW | GET `/api/weight-log` returns ordered list. Simple table view with date, weight, change from last entry. |
| **Weight trend line chart** | A line chart showing weight over time is the universal standard — MyFitnessPal, Lose It!, Cronometer, WeightFit all have this as their primary progress visualization. | MEDIUM | Use Recharts (Lightweight: ~45 KB). LineChart with `type="monotone"` for smooth curve. X-axis = dates, Y-axis = weight. Dates sorted ascending. |
| **Progress summary card** | Users expect a snapshot: current weight, starting weight, change, kg to goal, % complete. Displayed at top of progress dashboard. | LOW | Pure math on the frontend from weight_log data and profile target. No extra backend needed beyond existing GET endpoints. |
| **Goal line on chart** | A horizontal dashed line at the target weight on the weight chart. Users need to see how far they are from their goal visually. | LOW | Recharts `ReferenceLine` component with `strokeDasharray="5 5"` and label "Goal: XX kg". |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Trend prediction / projected date** | Calculates the current rate of weight change (kg/week) and projects when the user will reach their goal weight. Motivational and adds insight beyond raw data. | MEDIUM | Linear regression over last N entries (e.g., 14 days). Formula: slope = rate of change, projected_days = (target - current) / slope. Display as "On track to reach goal by [date]". |
| **Moving average overlay** | A 7-day rolling average line overlaid on the weight chart smooths out daily fluctuations. Users learn to focus on trends, not daily noise. | MEDIUM | Calculate 7-day moving average from weight_log data. Display as a second line on the chart (lighter color or area fill). Common pattern in WeightFit and Cronometer. |
| **Animated goal line** | When the user first sets a goal, the goal line animates from their current weight to the target position. Creates a "wow" moment. | LOW | Recharts supports animation natively. Use CSS transition or SVG animation on the ReferenceLine. |
| **Milestone celebration** | When the user crosses a milestone (e.g., 10% of goal, 50%, 90%, or hits goal weight), show a congratulatory message or visual indicator. | MEDIUM | Compare last two weight_log entries. If `(start - current) / (start - target)` crosses a threshold (0.25, 0.5, 0.75, 0.9, 1.0), show toast/alert. Store `last_milestone` on profile to avoid re-triggering. |
| **Weight change rate indicator** | Shows "You're losing 0.8 kg/week" or "You're gaining 0.3 kg/week" based on recent trend. Provides actionable feedback tied to the existing `calorieRate` targets. | MEDIUM | Calculate rate from slope of last 7+ entries. Compare to target rate (from `calorieRate`: 0.25/0.5/1.0 kg/week). Color-coded: green = on track, yellow = close, red = off track. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Multiple weight entries per day** | "I weigh myself morning and night" or "I forgot to log and want to add a second entry" | Creates ambiguity: which value is the "current" weight? Charts get noisy with intra-day fluctuations. Conflicts with the auto-log-on-update pattern (what happens when profile update also creates a log entry on the same day?). | **Last-entry-wins per day.** If user enters 2+ weights on the same date, only the most recent is used for trend calculations. Store all entries in the DB but deduplicate for display. |
| **Auto-generate weight goals from BMI** | "Just calculate my ideal weight from my height" | BMI ideal weight is a range (18.5-22.9 BMI). Picking a single number is arbitrary and the user may disagree. Creates confusion when auto-calculated goal doesn't match user expectation. | Let the user set their own target weight. Show BMI category as context, but don't auto-fill the goal. |
| **Body fat / measurements tracking** | "I want to track more than just weight" | Scope creep. Requires new schema, separate chart, different visualization. Body fat measurement is unreliable without consistent technique. Not aligned with the Core Value (BMI + TDEE focused). | Document as "consider for v2" in OUT_OF_SCOPE. Weight-only focus for now keeps the feature vertical clean. |
| **Weight logging reminders/notifications** | "Remind me to weigh myself every morning" | Requires push notification infrastructure (not currently built). Adds complexity for a non-critical feature. Users who want to track weight will do so. | Simple UI hint ("Tip: weigh yourself at the same time each morning for best results") without push infrastructure. |

## Feature Dependencies

```
[Auto-log weight on profile update]
    └──requires──> [weight_log table] (new DB migration)
                        └──requires──> [profiles table] (already exists)

[Manual weight entry]
    └──requires──> [weight_log table]

[Weight trend chart]
    └──requires──> [weight_log table]
    └──requires──> [Recharts library] (add to frontend)

[Goal setting (target weight + date)]
    └──requires──> [profiles table columns: target_weight_kg, target_date]

[Goal line on chart]
    └──requires──> [Weight trend chart]
    └──requires──> [Goal setting]

[Progress summary card]
    └──requires──> [Weight trend chart] (for start/current weight data)
    └──requires──> [Goal setting] (for target values)

[Trend prediction / projected date]
    └──requires──> [Progress summary card] (consumes same data)
    └──enhances──> [Weight trend chart]

[Moving average overlay]
    └──enhances──> [Weight trend chart]

[Milestone celebration]
    └──requires──> [Progress summary card] (to calculate % complete)
```

### Dependency Notes

- **Auto-log requires new table:** The existing `profiles.weight_kg` is a single current value. Weight history needs a separate `weight_log` table with `(user_id, weight_kg, logged_date, notes)`. The profile update endpoint must `INSERT INTO weight_log` as a side effect.
- **Goal setting enhances existing profile:** The `profiles` table already stores `fitness_goal`, `calorie_rate`, and `weight_kg`. Adding `target_weight_kg` and `target_date` is a natural extension — an ALTER TABLE migration, not a new table.
- **Recharts is a new frontend dependency:** The project doesn't currently have a charting library. Recharts v3.x is recommended because it's React-native, composable, lightweight (~45 KB), and the most popular React charting library. Install: `npm install recharts`.
- **Progress dashboard is a new page/route:** The dashboard needs its own route (e.g., `/progress`). Currently, the home route `/` shows `DashboardPlaceholder` — this can be replaced with the real dashboard.

## MVP Definition

### Launch With (v1.9)

Minimum viable product — what's needed for progress tracking.

- [x] **weight_log table migration** — New table: `(id, user_id, weight_kg, logged_date, notes, created_at)`. Unique constraint on `(user_id, logged_date)`. Index on `(user_id, logged_date DESC)`.
- [x] **Auto-log weight on profile update** — `PUT /api/profile` side-effect: insert weight into `weight_log`. If entry exists for today, UPDATE it (last-entry-wins).
- [x] **Manual weight entry API** — `POST /api/weight-log` (create), `GET /api/weight-log` (list, paginated). Note: no DELETE — users should not be able to remove weight history (anti-cheat; log corrections only via admin if ever needed).
- [x] **Goal setting on profile** — Add `target_weight_kg DECIMAL(5,2)` and `target_date DATE` to `profiles` table. Add to profile form (update Zod schema, add fields to ProfileForm).
- [x] **Weight trend chart** — Recharts `LineChart` with `type="monotone"`, smooth curve. X-axis: logged_date, Y-axis: weight_kg. Min/max domain auto-scaled with padding.
- [x] **Goal reference line** — Recharts `ReferenceLine` at `y={targetWeight}` with dashed stroke and "Goal" label.
- [x] **Progress summary** — Display at top of dashboard: starting weight (first entry), current weight (last entry), change (current - start), kg to goal (current - target), % complete ((start - current) / (start - target) × 100).
- [x] **Progress Dashboard page** — New route `/progress`. Replaces or augments `/` (DashboardPlaceholder). Combines summary card + chart + history table + goal display.

### Add After Validation (v1.9.x)

Features to add once core is working.

- [ ] **Trend prediction** — Calculate rate from recent entries, project completion date. Show as "Predicted: [date]" on the dashboard.
- [ ] **Moving average line** — 7-day rolling average overlay on the chart. Toggleable via legend click.
- [ ] **Milestone celebrations** — Toast messages at 25%, 50%, 75%, 90%, 100% of goal.
- [ ] **Weight change rate indicator** — "Losing 0.8 kg/week" with color-coded status.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Body measurements** (waist, hip, chest, etc.) — New table, new chart type. Requires dedicated feature milestone.
- [ ] **Progress photos** — Image upload + timeline view. Requires storage infrastructure.
- [ ] **Wearable/smart scale integration** — Requires external API integration. Out of scope for web-only app.
- [ ] **Weight logging reminders** — Requires push notification infrastructure.
- [ ] **Data export** — CSV/PDF download of weight history. Nice-to-have, not core.
- [ ] **Streak tracking** — "Logged weight for 7 days in a row" gamification. Adds engagement but not essential.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| weight_log table migration | HIGH | LOW | P1 |
| Auto-log weight on profile update | HIGH | LOW | P1 |
| Manual weight entry | HIGH | LOW | P1 |
| Goal setting (target weight + date) | HIGH | LOW | P1 |
| Weight trend chart | HIGH | MEDIUM | P1 |
| Goal reference line on chart | HIGH | LOW | P1 |
| Progress summary card | HIGH | LOW | P1 |
| Progress Dashboard page | HIGH | MEDIUM | P1 |
| Trend prediction / projected date | MEDIUM | MEDIUM | P2 |
| Moving average overlay | MEDIUM | MEDIUM | P2 |
| Milestone celebrations | MEDIUM | MEDIUM | P2 |
| Weight change rate indicator | MEDIUM | MEDIUM | P2 |
| Body measurements tracking | LOW | HIGH | P3 |
| Progress photos | LOW | HIGH | P3 |
| Data export | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.9 launch
- P2: Should have, add when v1.9 core is stable
- P3: Nice to have, future milestone consideration

## Competitor Feature Analysis

| Feature | MyFitnessPal | Lose It! | Cronometer | WeightFit | Our Approach (v1.9) |
|---------|--------------|----------|------------|-----------|---------------------|
| Auto-log weight on profile update | Yes (implicit when editing profile) | No (separate weight entry) | Yes (profile edit saves to history) | No (dedicated entry only) | Auto-log on profile update + dedicated entry |
| Manual weight entry | Dedicated "Check-In" on Today tab | Dedicated weight screen | "Log Weight" on dashboard | Main screen input | Dedicated form on Progress page |
| Target weight | Guided setup wizard | Onboarding flow | More > Targets > Weight Goal | In profile settings | Profile form fields (target_weight_kg + target_date) |
| Target date | Calculated from rate | Set by user | Auto-calculated from rate | Auto-calculated | User-specified (user + date) — simpler, more flexible |
| Weight trend chart | Line chart with goal line | Line chart with goal line | Area chart with goal line | Line chart | Line chart with ReferenceLine (dashed goal line) |
| Moving average | 7-day avg toggle | Not shown | Weighted trend line | 7-day avg toggle | P2 (post-launch) |
| Progress summary | "X lbs to goal" card | "X% to goal" | Dashboard widget | Full stats page | Summary card: start/current/target, kg to goal, % complete |
| Trend prediction | "On track by [date]" | "Projected to reach goal [date]" | Not shown | "Predicted" | P2 (post-launch) |
| Milestone celebrations | Check-in animations | Achievement badges | Not shown | Notification | P2 (toast notifications at 25/50/75/90/100%) |
| Rate indicator | "Avg loss: X lbs/week" | "Weekly trend" | "Trend" line label | "Avg change" | P2 (color-coded rate indicator) |

## Technical Implementation Notes

### Database Changes

```sql
-- New weight_log table
CREATE TABLE IF NOT EXISTS weight_log (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, logged_date)  -- last-entry-wins per day
);

CREATE INDEX IF NOT EXISTS idx_weight_log_user_date ON weight_log(user_id, logged_date DESC);

-- Profile addition (ALTER TABLE)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,2) NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_date DATE NULL;
```

### Backend API Changes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/weight-log` | GET | List weight history (paginated, ordered by date DESC) |
| `/api/weight-log` | POST | Create manual weight entry |
| `/api/profile` | PUT | **Modified:** side-effect INSERT/UPDATE into weight_log |
| `/api/weight-log/stats` | GET | Computed stats: start weight, current, change, rate, projected date |

### Charts Library Decision

**Recharts v3.x** is the recommended library because:
- Already included in the project's Recharts research (shadcn examples, v3.8.1 latest)
- React-native composable components (fits existing component patterns)
- No additional wrapper needed (unlike Chart.js which requires react-chartjs-2)
- ReferenceLine for goal line is built-in
- Responsive via `ResponsiveContainer` component
- Tree-shakeable — only import what you use

Required imports for the weight chart:
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
```

## Sources

- **Competitor products analyzed:** MyFitnessPal (2026 Today tab + Progress tab), Lose It! (iOS/Android 2026), Cronometer (Mobile - Weight Goal), WeightFit (Google Play, 1M+ downloads), Withings Health Mate, WeightFlow
- **MyFitnessPal Community Discussion:** "Does MyFitnessPal not recognize when you've hit your goal weight?" — February 2025. Confirms manual goal adjustment pattern.
- **Cronometer Support Docs:** Mobile - Weight Goal (April 2026). Detailed goal setting flow: current weight → weight goal → loss/gain rate → goal forecast → energy target.
- **NIDDK Body Weight Planner:** NIH resource for weight prediction modeling. Confirms the mathematical approach to trend prediction.
- **Reddit r/1200isplenty:** "The correct way to track weight loss progression" — community-validated pattern of focusing on weekly averages over daily fluctuations.
- **WeightFlow App:** weightflowapp.com — modern weight tracking app with multiple goals, advanced analytics, trend predictions.
- **Recharts Official Docs:** recharts.org (v3.8.1, 2026). LineChart with ReferenceLine, ResponsiveContainer patterns.
- **shadcn/ui Chart Examples:** shadcn.io — 70+ Recharts chart patterns, theme-aware styling via CSS variables.
- **NIX United Fitness App Development Roadmap (2026):** Industry analysis confirming progress tracking and analytics as core features.

---
*Feature research for: Fitness_App v1.9 Progress Tracking*
*Researched: 2026-06-01*
