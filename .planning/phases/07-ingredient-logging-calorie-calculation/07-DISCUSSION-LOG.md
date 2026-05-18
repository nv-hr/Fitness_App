# Phase 07: Ingredient Logging & Calorie Calculation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 07-Ingredient Logging & Calorie Calculation
**Areas discussed:** Calorie Preview Display, Logging Flow Layout, Custom Ingredient Entry, Quick-add Portion Default

---

## Calorie Preview Display

| Option | Description | Selected |
|--------|-------------|----------|
| Live preview | Show calculated calories in real-time as user types weight | ✓ |
| Calculate on button click | Only show after user clicks a 'Calculate' button | |
| Show after logging | Show formula result only after user confirms logging | |

**User's choice:** Live preview — real-time display as weight is typed
**Notes:** Preview appears inline below weight input, hidden when empty/invalid, rounded to whole number

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below weight input | Put preview right below the weight input in the same section | ✓ |
| Next to log button | Show next to the 'Log Food' button | |
| Floating tooltip | Show a small floating tooltip near the weight input | |

**User's choice:** Inline below weight input

| Option | Description | Selected |
|--------|-------------|----------|
| Hide when empty/invalid | Show nothing when weight field is empty or invalid | ✓ |
| Always show placeholder | Always show the line, even if it says '0 kkal' | |

**User's choice:** Hide when empty/invalid

| Option | Description | Selected |
|--------|-------------|----------|
| Round to whole number | Match existing calculateCalories() — Math.round() | ✓ |
| Show 1 decimal place | Show one decimal place for precision | |

**User's choice:** Round to whole number

---

## Logging Flow Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Keep search-first | Keep current pattern: search → select → portion → meal type → log | ✓ |
| Add category browsing alongside search | Add category tabs/filters above search | |
| Category-first browsing | Switch to category-first: show category grid, tap to see ingredients | |

**User's choice:** Keep search-first pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Add category filter chips above search | Show category filter chips when query is short or empty | |
| No category UI on logging page | Pure search only, keep it simple | ✓ |

**User's choice:** No category UI on logging page

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current layout | Meal type selector stays below portion input, above log button | ✓ |
| Move meal type to top | Move meal type to top of form so user picks meal first | |

**User's choice:** Keep current layout

| Option | Description | Selected |
|--------|-------------|----------|
| Keep single selected item panel | Log one ingredient at a time, same as current | ✓ |
| Multi-item meal builder | Allow multiple ingredients before hitting log | |

**User's choice:** Single ingredient logging at a time

---

## Custom Ingredient Entry

| Option | Description | Selected |
|--------|-------------|----------|
| Name + calories only | Just name + calories per 100g, category auto-assigned to 'other' | ✓ |
| Keep category requirement | Keep current form with name, calories, AND category dropdown | |
| Category optional | Name + calories required, category optional | |

**User's choice:** Name + calories only, no category required

| Option | Description | Selected |
|--------|-------------|----------|
| Save to database | Save custom ingredients to foods table (is_custom=TRUE) | ✓ |
| One-off logging only | Custom ingredients are one-off only, not saved | |

**User's choice:** Save to database for future use

| Option | Description | Selected |
|--------|-------------|----------|
| Same toggle button below search | Keep '+ Add custom ingredient' button below search results | ✓ |
| Separate page or modal | Move custom entry to a separate page/modal | |

**User's choice:** Same toggle button below search

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 0-5000 range | Same as current validation in food.service.js | ✓ |
| Allow any positive number | Remove upper limit or raise it significantly | |

**User's choice:** Keep 0-5000 range

---

## Quick-add Portion Default

| Option | Description | Selected |
|--------|-------------|----------|
| Remember last portion per ingredient | Pre-fill weight with user's last logged portion for that ingredient | ✓ |
| Always 100g standard | Always default to 100g for quick-add | |
| Average of last 3 portions | Default to average of user's last 3 portions | |

**User's choice:** Remember last portion per ingredient

| Option | Description | Selected |
|--------|-------------|----------|
| Show last portion in recent list | Show last portion next to ingredient name (e.g., "Chicken breast — last: 150g") | ✓ |
| No portion hint in list | Keep recent foods list as-is | |

**User's choice:** Show last portion in recent list

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback to 100g if no history | If ingredient never logged before, fall back to 100g | ✓ |
| Fallback to 150g | Fallback to 150g as more realistic typical portion | |

**User's choice:** Fallback to 100g

---

## Agent's Discretion

- Backend API endpoint design for fetching last portion per ingredient — planner decides whether to extend existing `/api/food/recent` endpoint or create a new one
- Database query optimization for last-portion lookup — planner decides indexing strategy

## Deferred Ideas

None — discussion stayed within phase scope
