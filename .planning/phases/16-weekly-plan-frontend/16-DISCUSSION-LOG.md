# Phase 16: Weekly Plan Frontend — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 16-Weekly Plan Frontend
**Areas discussed:** Plan page location, Plan retrieval endpoint, Day card layout, Regeneration UX, Rate-limit countdown

---

## Plan Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| New /weekly-plan route | Clean separation — own orchestrator page, no impact on existing ActivitiesPage | ✓ |
| Section on /activities page | Add a 'Weekly Plan' section or tab above/below existing content | |
| Tab/switch on /activities | Toggle between 'Log Activity' view and 'Weekly Plan' view | |

**User's choice:** New /weekly-plan route
**Notes:** User agreed with recommendation — cleaner code, matches how other features have their own pages.

---

## Plan Retrieval Endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Add GET endpoint | GET /api/weekly-plans for read-only plan viewing (no rate-limit cost) | ✓ |
| POST /generate on every load | Keep single endpoint; every page load costs a rate-limit slot | |

**User's choice:** Add GET endpoint
**Notes:** User agreed with recommendation — viewing a plan shouldn't consume rate-limit quota.

---

## Day Card Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical scrolling | One day block below another (Mon-Sun). Matches rest of app layout | ✓ |
| Horizontal scroll + tabs | Day tabs at top, click to see that day's activities | |
| Collapsible accordion | Day headers expand/collapse, one open at a time | |

**User's choice:** Vertical scrolling
**Notes:** User agreed with recommendation — consistent with existing app layout patterns.

---

## Regeneration UX

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerate button visible always | Small 'Regenerate' always visible on each day card | |
| Expand day then regenerate | Click to expand day card, then see 'Regenerate Day' button inside | ✓ |

**User's choice:** Expand day then regenerate
**Notes:** User chose the compact approach — cards show summary, click to expand, then regenerate.

Regarding "Regenerate All":
| Option | Description | Selected |
|--------|-------------|----------|
| No, single-day only | Users regenerate individual days as needed | ✓ |
| Yes, plus 'Regen All' button | With rate-limit slot consumed each time | |

**User's choice:** No, single-day only

---

## Rate-limit Countdown

| Option | Description | Selected |
|--------|-------------|----------|
| Button countdown timer | Disabled button shows 'Wait 2:30' ticking down | ✓ |
| Banner notification | Banner at top: 'Rate limit reached. Try again in 2:30' | |
| Both | Button countdown + banner | |

**User's choice:** Button countdown timer
**Notes:** User agreed with recommendation — self-contained per-button countdown, no banner.

---

## the agent's Discretion

- Exact GET endpoint path and response format for plan retrieval
- Whether single-day regeneration uses a new endpoint or a modified existing endpoint
- Component file structure within `features/activities/components/` for the new page
- Whether to reuse or adapt the existing `ActivityCard` component for day card activities
- Color/symbol indicators for intensity levels on day cards
- Expand/collapse animation style

## Deferred Ideas

- One-click plan-to-log (ACT-06) — belongs in v2
- Full week regeneration — not needed
