# Phase 08: English UI Migration - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

All application UI text, category names, and meal labels switched from Indonesian to English for international audience. This is the final phase of v1.1 — the logging flow (Phase 7) must be functional before language migration. Depends on Phase 7.

**Requirements:** UI-04, UI-05, UI-06

</domain>

<decisions>
## Implementation Decisions

### Translation Approach
- **D-16:** In-place replacement of all Indonesian values in `translations.js` with English equivalents — no i18n framework, no language switching capability. English-only app.
- **D-17:** Keep the existing `t()` function and `translations` object structure — only change the string values

### Database meal_type Migration
- **D-18:** ALTER TABLE to change `food_logs.meal_type` ENUM from Indonesian (`sarapan`, `makan_siang`, `makan_malam`, `camilan`) to English (`breakfast`, `lunch`, `dinner`, `snack`)
- **D-19:** UPDATE existing rows to map Indonesian values to English before ALTER — preserves all historical logging data
- **D-20:** Migration order: UPDATE existing data first, then ALTER ENUM — avoids constraint violations

### Unit Convention
- **D-21:** Switch from 'kkal' (Indonesian abbreviation) to 'kcal' (international standard) across all UI text, translations, and display strings
- **D-22:** Database values unchanged — only display layer affected

### Backend Error Messages
- **D-23:** Replace Indonesian hardcoded strings with English directly in controller and service files — no backend i18n layer
- **D-24:** Affected files: `food.controller.js` (6 error messages), `food.service.js` (5 validation messages), `profile.service.js` (5 validation messages)

### the agent's Discretion
- Exact English wording for each translation key — planner maps Indonesian → English consistently
- Migration script structure (inline SQL in init.sql vs separate migration file) — planner decides based on project convention
- Whether to update `init.sql` seed file to use English meal_type values for any test data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, and requirements (UI-04, UI-05, UI-06)
- `.planning/REQUIREMENTS.md` — v1.1 requirements with traceability table

### Frontend Files (to be modified)
- `frontend/src/shared/i18n/translations.js` — All Indonesian translation values → English (lines 1-160)
- `frontend/src/features/food-log/components/FoodSearch.jsx` — Category labels mapping (line 5-14), "kkal/100g" display (line 90)
- `frontend/src/features/food-log/components/FoodLogPage.jsx` — "kkal/100g" display (line 177), "kkal" in preview (line 197)
- `frontend/src/features/food-log/components/CalorieSummary.jsx` — "kkal" display strings (lines 17-18, 43-44)
- `frontend/src/features/food-log/components/FoodLogTable.jsx` — "terakhir" text, "kkal" display
- `frontend/src/features/activities/components/ActivitiesPage.jsx` — "kkal" display
- `frontend/src/features/activities/components/ActivityCard.jsx` — "kkal" display

### Backend Files (to be modified)
- `backend/src/controllers/food.controller.js` — 6 Indonesian error messages (lines 17, 56, 61, 72, 78, 82)
- `backend/src/services/food.service.js` — 5 Indonesian validation messages (lines 40, 44, 48, 66, 70)
- `backend/src/services/profile.service.js` — 5 Indonesian validation messages (lines 100, 103, 106, 109, 112)
- `backend/db/init.sql` — `food_logs.meal_type` ENUM definition (line 69), needs ALTER + UPDATE migration

### Prior Phase Context
- `.planning/phases/07-ingredient-logging-calorie-calculation/07-CONTEXT.md` — Phase 7 decisions, notes Indonesian error messages will be switched in Phase 8
- `.planning/phases/06-international-ingredient-database/06-CONTEXT.md` — Phase 6 decisions, notes meal_type ENUM still uses Indonesian values

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `t()` translation function — simple key lookup, no changes needed. Only translation values change.
- `translations.js` object structure — all keys stay the same, only values change from Indonesian to English
- `food_logs` table — `meal_type` ENUM needs migration; all other columns unaffected

### Established Patterns
- Indonesian error messages in backend controllers/services — Phase 8 replaces with English
- Indonesian UI text via `translations.js` — Phase 8 replaces values in-place
- Category labels in FoodSearch.jsx use `t()` for translation — changing translation values updates these automatically
- "kkal/100g" hardcoded in JSX components — needs manual replacement to "kcal/100g"
- Minimal inline styling — no CSS changes needed

### Integration Points
- `translations.js` — single source of truth for all frontend UI text. Changing values affects all pages.
- `init.sql` — `food_logs.meal_type` ENUM (line 69) needs migration script added
- Backend error messages — scattered across 3 files (food.controller.js, food.service.js, profile.service.js)
- Frontend hardcoded "kkal" strings — scattered across multiple component files

</code_context>

<specifics>
## Specific Ideas

- meal_type mapping: `sarapan → breakfast`, `makan_siang → lunch`, `makan_malam → dinner`, `camilan → snack`
- All "kkal" → "kcal" in display strings (frontend only — database stores integers, no change needed)
- Backend error messages: translate to clear, concise English (e.g., "Porsi harus antara 1-5000 gram" → "Portion must be between 1-5000 grams")
- No new dependencies — keep the app lightweight
- Category labels in translations.js already use English keys (`proteins`, `carbs`, etc.) from Phase 6 — only the Indonesian display values need updating

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-English UI Migration*
*Context gathered: 2026-05-18*
