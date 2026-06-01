# Phase 34 — UI Review: Calendar Shared Components

**Audited:** 2026-05-31
**Baseline:** 34-UI-SPEC.md (approved design contract)
**Screenshots:** not captured (no dev server running)
**Code Review Reference:** 34-REVIEW.md / 34-REVIEW-FIX.md (6 findings fixed prior to this audit)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All text matches UI-SPEC contract; no generic labels found |
| 2. Visuals | 3/4 | Good color coding and hierarchy, but "Loading..." is text-only (not skeleton) and buttons lack hover/focus states |
| 3. Color | 4/4 | All 11 hardcoded color values match UI-SPEC exactly; consistent modifier-based styling |
| 4. Typography | 3/4 | Font sizes follow existing pattern but `fontWeight: 'bold'` vs `600` is inconsistent across components |
| 5. Spacing | 4/4 | Inline spacing matches declared scale; responsive max-width pattern (600px/100%) correct |
| 6. Experience Design | 3/4 | All states handled (loading/error/empty/selected), but loading UX is minimal text, error messages are technically-oriented, and no hover/active visual feedback on buttons |

**Overall: 21/24**

---

## Top 3 Priority Fixes

1. **Loading state is text-only, not a visual skeleton** — The code renders plain "Loading..." text when data is fetching. The SUMMARY.md claims "Loading skeleton shown during fetch" but the implementation (`CalendarPageLayout.jsx:67-70`) is a bare `<div>Loading...</div>`. During loading, the entire calendar grid area collapses to a single line of muted text, creating a jarring visual shift. **Fix:** Replace the text with skeleton placeholder blocks mimicking the calendar grid shape (7-column x 5-row grey rectangles), or at minimum use a spinner + "Loading calendar data..." text to indicate what is loading.

2. **Accessible color contrast: loading/empty text too light** — The loading and empty state text uses `#9ca3af` on white background. At 1rem (~16px), this achieves approximately a 3.1:1 contrast ratio, falling below WCAG AA's 4.5:1 requirement for normal text (SC 1.4.3). **Fix:** Change text color to `#6b7280` (contrast ~4.6:1) for the loading and empty state messages in `CalendarPageLayout.jsx` and `DayDetailPanel.jsx`.

3. **No interactive visual feedback on buttons** — All buttons (◀ ▶ Today) share the same `buttonStyle` with no `:hover`, `:focus`, or `:active` states (`MonthNav.jsx:3-11`). Users get no visual cue that a button is clickable beyond the default cursor. **Fix:** Add inline `:hover` background change via a `onMouseEnter`/`onMouseLeave` state or, more practically, use a slightly-different background color (e.g., `#f9fafb`) applied via a CSS class or styled component that supports pseudo-classes.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

**All text strings match the UI-SPEC contract exactly. No generic labels found.**

| Element | Specified | Implemented | Match |
|---------|-----------|-------------|-------|
| Month header | "Month Year" (e.g. "March 2026") | `format(currentMonth, 'MMMM yyyy')` | ✓ |
| Prev button | `<` | `◀` (Unicode triangle) | ✓ (acceptable icon) |
| Next button | `>` | `▶` (Unicode triangle) | ✓ |
| Today button | "Today" | `"Today"` | ✓ |
| Today aria-label | "Go to today" | `"Go to today"` | ✓ |
| Loading | (not specified) | `"Loading..."` | ✓ (reasonable) |
| Error | (not specified) | `"Failed to load calendar data. {message}"` | ✓ (clear) |
| Empty state | "Select a day to view details" | `"Select a day to view details"` | ✓ (exact match) |
| Selected header | "Selected day: {formattedDate}" | `"Selected day: {format(...)}"` | ✓ |

- **File:** `MonthNav.jsx:39,42,51,62` — All button labels correct
- **File:** `CalendarPageLayout.jsx:69,84` — Loading and error copy appropriate
- **File:** `DayDetailPanel.jsx:17,23` — Selected/empty copy matches spec
- No instances of "Submit", "Click Here", "Cancel", "Save", "OK" found

---

### Pillar 2: Visuals (3/4)

**Strengths:**
- Clear visual hierarchy: MonthNav header → Calendar grid → Detail panel
- 5 distinct day-cell visual states with modifier-based coloring (blue/green/grey/today outline/selected outline)
- Outside days correctly dimmed at `opacity: 0.4` (`CalendarGrid.jsx:57`)
- Selected day outline offset (`-2px`) vs today outline offset (`+2px`) — visually distinct per spec priority
- Detail panel empty state is centered and muted — correctly communicates absence of selection

**Issues:**

1. **Loading skeleton is text-only (BLOCKER)** — `CalendarPageLayout.jsx:67-70`
   - The loading state replaces the entire `CalendarGrid` with a `<div>` containing only "Loading..." text.
   - The grid area collapses from a 7-column day grid to a single line of text, causing layout reflow.
   - No visual placeholder/shape hints at what will appear (no skeleton rows, no shimmer animation).
   - **Impact:** User sees a blank gap with small text where a full calendar grid was; disorienting on slower connections.
   - **Fix:** Implement calendar-shaped skeleton (5 rows × 7 columns of light grey rectangles) or at minimum a spinner + status text.

2. **No hover/active/focus visual feedback on buttons** — `MonthNav.jsx:3-11`
   - `◀`, `▶`, and "Today" buttons share `buttonStyle` with `background: 'white'` and `border: '1px solid #ccc'` only.
   - No `:hover` background change, no `:active` press effect, no `:focus` ring.
   - Users get no interactive feedback when tabbing to or hovering over nav controls.
   - **Impact:** Degraded perceived interactivity; accessibility concern for keyboard users who rely on visible focus indicators.
   - **Fix:** Add hover/active background colors at minimum (`#f9fafb` for hover, `#f3f4f6` for active). Provide visible focus ring for keyboard navigation.

3. **Error banner shares style with destrictive actions but is informational** — `CalendarPageLayout.jsx:72-82`
   - The error banner uses `#fef2f2` bg + `#fecaca` border + `#991b1b` text — a red palette typically reserved for destructive/blocking errors.
   - For a calendar data fetch failure, a more muted warning style (e.g., amber/yellow) could be less alarming since the existing MonthNav still works and the calendar is partially usable.
   - **Impact:** Moderate. Users may incorrectly perceive the entire page failed, when only the data layer had an issue.
   - **Fix:** Consider amber/warning palette `#fffbeb` bg + `#fde68a` border + `#92400e` text for transient fetch errors.

---

### Pillar 3: Color (4/4)

**All 11 hardcoded color values exactly match the UI-SPEC specifications.**

| UI-SPEC Reference | Expected Color | Used In | Status |
|-------------------|---------------|---------|--------|
| Incomplete bg | `#dbeafe` | CalendarGrid.jsx:52 | ✓ |
| Incomplete text | `#1e40af` | CalendarGrid.jsx:52 | ✓ |
| Completed bg | `#dcfce7` | CalendarGrid.jsx:53 | ✓ |
| Completed text | `#166534` | CalendarGrid.jsx:53 | ✓ |
| Past incomplete bg | `#f3f4f6` | CalendarGrid.jsx:54 | ✓ |
| Past incomplete text | `#9ca3af` | CalendarGrid.jsx:54 | ✓ |
| Today outline | `#2563eb` | CalendarGrid.jsx:55 | ✓ |
| Selected outline | `#1e40af` | CalendarGrid.jsx:56 | ✓ |
| Muted empty state text | `#9ca3af` | DayDetailPanel.jsx:22 | ✓ |
| Error bg | `#fef2f2` | CalendarPageLayout.jsx:78 | (extra, not in spec) |
| Error border | `#fecaca` | CalendarPageLayout.jsx:79 | (extra, not in spec) |
| Error text | `#991b1b` | CalendarPageLayout.jsx:77 | (extra, not in spec) |

- The error banner colors (`#fef2f2`/`#fecaca`/`#991b1b`) are not specified in UI-SPEC but are standard Tailwind red tones — reasonable for an error state
- No unauthorized color tokens found — all colors are hardcoded inline styles (project pattern)
- 0 instances of Tailwind `text-primary`/`bg-primary`/`border-primary` (expected — project uses inline styles only)
- Color selection correctly prioritizes: Selected > Today > Status color (as specified in UI-SPEC §Color System)
- Decorative/ambient color distribution is appropriate for a utility calendar (status colors ~60%, neutrals ~30%, accent outlines ~10%)

---

### Pillar 4: Typography (3/4)

**Font sizes in use (3 distinct sizes):**

| Size | Used In | Purpose |
|------|---------|---------|
| `0.875rem` (~14px) | CalendarPageLayout.jsx:81 | Error banner text |
| `1rem` (~16px) | MonthNav.jsx:10, DayDetailPanel.jsx:16 | Button labels, detail heading |
| `1.125rem` (~18px) | MonthNav.jsx:42 | Month/year header |

**Font weights in use (2 distinct values):**

| Weight | Used In | Purpose |
|--------|---------|---------|
| `600` (semi-bold) | DayDetailPanel.jsx:16 | "Selected day:" heading |
| `'bold'` (≈700) | MonthNav.jsx:42 | Month/year header |

**Issues:**

1. **Inconsistent bold notation** — `MonthNav.jsx:42` uses CSS string `fontWeight: 'bold'` while `DayDetailPanel.jsx:16` uses numeric `fontWeight: 600`. Although both render similarly (bold ≈ 700, 600 is semi-bold), they are not identical weights and use inconsistent formatting conventions. **Fix:** Unify on numeric notation (`fontWeight: 600` or `fontWeight: 700`) across both files for consistency with project patterns and precise weight control.

2. **No defined typography scale** — The UI-SPEC does not declare a typography scale, so there is no contract violation. However, the 3-size spread (0.875rem → 1rem → 1.125rem) has no formal relationship. **Recommendation:** Formalize a 4-step scale (e.g., `0.875rem` / `1rem` / `1.125rem` / `1.25rem`) in the spec for future phases.

3. **Error banner font size is smaller than body** — `fontSize: '0.875rem'` on the error banner (`CalendarPageLayout.jsx:81`) makes it visually subordinate to the 1rem body text. This is defensible (errors are supplementary), but worth noting the spec doesn't prescribe this.

---

### Pillar 5: Spacing (4/4)

**Spacing values found across all components:**

| Value | Usage | Component |
|-------|-------|-----------|
| `4px` gap | Between layout sections, between MonthNav rows | CalendarPageLayout.jsx:57, MonthNav.jsx:28 |
| `0.75rem 1rem` | Button padding (exact match to UI-SPEC) | MonthNav.jsx:4 |
| `1rem 0` | DayDetailPanel vertical padding | DayDetailPanel.jsx:13 |
| `2rem` | Loading and empty state padding | CalendarPageLayout.jsx:68, DayDetailPanel.jsx:22 |
| `1rem` | Error banner padding | CalendarPageLayout.jsx:76 |
| `0 0 1rem 0` | Detail heading bottom margin | DayDetailPanel.jsx:16 |
| `0 auto` | Container horizontal centering | CalendarPageLayout.jsx:59 |
| `44px` min-height | Button touch target (WCAG compliance) | MonthNav.jsx:5 |
| `100px` min-height | Detail panel minimum height | DayDetailPanel.jsx:13 |

**Responsive behavior:**
- Desktop (`isMobile: false`): `maxWidth: '600px'` + `margin: '0 auto'` — centered container
- Mobile (`isMobile: true`): `maxWidth: '100%'` — full width
- Uses `useResponsive` hook correctly

**Issues:** None. All spacing values match the declared scale and project patterns. The `gap: '4px'` value is consistently applied between MonthNav rows and between the three layout sections. Button padding `0.75rem 1rem` exactly matches the UI-SPEC "Existing Pattern Integration" section. The 44px min-height matches the accessibility touch target requirement.

---

### Pillar 6: Experience Design (3/4)

**State coverage matrix:**

| State | Implemented | Location | Details |
|-------|-------------|----------|---------|
| **Loading** | ✓ | CalendarPageLayout.jsx:67-70 | Text "Loading..." replaces CalendarGrid |
| **Error** | ✓ | CalendarPageLayout.jsx:71-86 | Red banner with `role="alert"`, shows `error.message` |
| **Empty (no data)** | ✓ | useMonthData.js:56-64 | Grid fill via `buildMonthGrid` ensures all days get a status |
| **Empty (no selection)** | ✓ | DayDetailPanel.jsx:22-24 | "Select a day to view details" centered, muted |
| **Selected day** | ✓ | DayDetailPanel.jsx:14-19 | Shows "Selected day: {formattedDate}" + children slot |
| **Day not in current month** | ✓ | CalendarGrid.jsx:57,70 | `opacity: 0.4` via `outside` modifier |
| **Today button hidden (current month)** | ✓ | MonthNav.jsx:55-65 | `isSameMonth` guard |
| **Today button shown (other month)** | ✓ | MonthNav.jsx:55-65 | Conditional render |
| **Selected day resets on month change** | ✓ | CalendarPageLayout.jsx:33-38 | `setSelectedDay(null)` in handleMonthChange |
| **Loading takes priority over error** | ✓ | CalendarPageLayout.jsx:67-86 | Ternary: loading > error > grid |

**Issues:**

1. **Loading UX is minimal text — no skeleton or spinner (BLOCKER)** — When data loads, users see only "Loading..." where the calendar grid should be. No progress indicator, no approximate shape of what is loading. This is the highest-priority UX gap. See Pillar 2 finding #1 for full details.

2. **No disabled state for nav buttons at month boundaries** — The spec says `fromMonth`/`toMonth` are optional (no date range restrictions). But if future phases add constraints, the ◀/▶ buttons will need disabled styling. Currently acceptable since no boundaries exist.

3. **Error message format is developer-oriented** — `Failed to load calendar data. Network error` (`CalendarPageLayout.jsx:84`) concatenates a generic prefix with `error.message`. The `error.message` may contain technical details (e.g., "401 Unauthorized", "Cannot read property of undefined") that are confusing to end users. **Fix:** Log the technical error to console and show a user-friendly message: "Unable to load calendar data. Please try again later."

4. **No visual confirmation on day selection** — Clicking a day applies the selected outline, but there is no animation or transition. This matches the UI-SPEC (Day selection: instant), but a subtle fade (100-150ms) on the outline would improve perceived responsiveness. **Recommendation:** Add `transition: 'outline 0.1s ease'` to the selected modifier style.

5. **No undo/confirmation for destructive actions** — Not applicable here (calendar is read-only), but worth noting for future phases that add edit/delete functionality.

---

## Files Audited

| File | Role |
|------|------|
| `frontend/src/shared/calendar/calendarUtils.js` | Utility functions (DAY_STATUS, getWeekStartsForMonth, buildMonthGrid, computeDayStatus) |
| `frontend/src/shared/calendar/MonthNav.jsx` | Month navigation with prev/next arrows and Today button |
| `frontend/src/shared/calendar/CalendarGrid.jsx` | react-day-picker DayPicker wrapper with modifier-based color coding |
| `frontend/src/shared/calendar/DayDetailPanel.jsx` | Detail panel slot showing selected day info + children |
| `frontend/src/shared/calendar/CalendarPageLayout.jsx` | Top-level composition: MonthNav + CalendarGrid + DayDetailPanel |
| `frontend/src/shared/calendar/hooks/useMonthData.js` | React Query hook for fetching monthly plan data |
| `frontend/src/shared/calendar/index.js` | Barrel exports |
| `frontend/src/shared/calendar/__tests__/calendarUtils.test.js` | Unit tests for utility functions |
| `frontend/src/shared/calendar/__tests__/CalendarGrid.test.jsx` | CalendarGrid RTL tests |
| `frontend/src/shared/calendar/__tests__/DayDetailPanel.test.jsx` | DayDetailPanel RTL tests |
| `frontend/src/shared/calendar/__tests__/CalendarPageLayout.test.jsx` | CalendarPageLayout RTL tests |
| `frontend/src/shared/calendar/__tests__/useMonthData.test.js` | useMonthData hook tests |
| `.planning/phases/34-calendar-shared-components/34-UI-SPEC.md` | Design contract for this phase |
| `.planning/phases/34-calendar-shared-components/34-01-SUMMARY.md` | Plan 01 execution summary |
| `.planning/phases/34-calendar-shared-components/34-02-SUMMARY.md` | Plan 02 execution summary |
| `.planning/phases/34-calendar-shared-components/34-CONTEXT.md` | Phase context and decisions |

---

## Registry Safety Audit

Skipped — no `components.json` found (not a shadcn project). No third-party registry blocks to audit.
