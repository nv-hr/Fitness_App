# Phase 4: Frontend Static Analysis & Deduplication — Research

**Researched:** 2026-06-12
**Domain:** Frontend React codebase cleanup — dead code removal and UI component deduplication
**Confidence:** HIGH (all findings are based on direct codebase inspection)

## Summary

The Fitness App frontend is a Vite + React 19 + TailwindCSS SPA organized in a feature-sliced layout under `frontend/src/`. The project already has a `shared/ui/` layer with barrel exports for cross-cutting components, which is the right extraction target for duplicated UI patterns.

Manual grep analysis reveals a clear and repeated "metric card row" pattern across `ActivitySummary.jsx` and `CalorieSummary.jsx` — both components independently implement the same label+value display cell (`text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1` repeated 7+ times across these two files alone). The root card container className is also duplicated (`p-6 rounded-2xl border transition-all duration-300`).

Fallow will be the primary tool for dead code and dependency analysis. The `PageHeader` component in `shared/ui/` has **no consumers** — it is exported in the barrel but never imported anywhere. This is confirmed dead code.

**Primary recommendation:** Run `fallow dead-code --format json --quiet` (from the `frontend/` directory with the Vite plugin auto-detected), then run `fallow dupes --format json --quiet --mode mild`. Use findings to drive a targeted refactoring in waves: dead code → deprecated folder first, then shared component extraction of the "MetricItem" pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dead code identification | Browser / Client | — | Static analysis runs on frontend source tree |
| Shared UI component extraction | Browser / Client | — | JSX components live in `frontend/src/shared/ui/` |
| Dead utility/hook identification | Browser / Client | — | Hooks and lib utilities are frontend-only |
| Dependency cleanup | Frontend package.json | Root workspace package.json | Monorepo workspace; `lucide-react` is in root, not frontend |

---

## Codebase Structure

```
frontend/src/
├── __tests__/              # Integration tests (vitest + @testing-library/react)
│   └── api-integration.test.js
├── app/
│   ├── App.jsx
│   ├── Providers.jsx       # React Query provider + Toast context
│   ├── Router.jsx          # react-router-dom v7 routes
│   ├── guards/             # ProtectedRoute, PublicRoute, PasswordGuard
│   └── layout/             # AppShell, AuthLayout
├── features/               # Feature-sliced modules (10 features)
│   ├── activities/         # ActivityPage, components/, api/, hooks/, utils/
│   ├── auth/               # LoginForm, RegisterForm, SetupPassword
│   ├── calculators/        # BMICalculator, TDEECalculator, result components
│   ├── dashboard/          # DashboardPage, OnboardingModal
│   ├── food-log/           # FoodLogPage, FoodLogTable, CalorieSummary, MealCalendarSection…
│   ├── landing/            # LandingPage
│   ├── profile/            # ProfileForm, BmiResult, TdeeResult
│   ├── progress/           # WeightEntryCard, WeightHistoryTable, WeightTrendChart…
│   ├── settings/           # ChangePasswordPage
│   └── weekly-plan/        # weeklyPlanApi.js (no page component found)
├── shared/
│   ├── calendar/           # CalendarGrid, CalendarPageLayout, MonthNav, DayDetailPanel
│   ├── hooks/              # useCountdownTimer.js, useResponsive.js
│   ├── lib/                # countdown.js, http.js
│   └── ui/                 # Loader, Toast, DateSwitcher, AiBannerCard, SectionHeader,
│                             PageHeader, FormField, DayActivityRow  (barrel: index.js)
├── index.css
└── main.jsx
```

**Total source files:** ~80 JSX/JS files (excluding tests and node_modules)

---

## Confirmed Dead Code Findings (Pre-Fallow Analysis)

| Item | File | Evidence | Confidence |
|------|------|----------|-----------|
| `PageHeader` component | `shared/ui/PageHeader.jsx` | Exported in `shared/ui/index.js` line 14 but has **zero imports** anywhere in codebase | HIGH [VERIFIED: grep search] |
| `weekly-plan` feature | `features/weekly-plan/` | Only contains `weeklyPlanApi.js` — no page component, no routes in Router.jsx found | MEDIUM [ASSUMED — verify with fallow] |
| `useCountdownTimer` / `countdown.js` | `shared/hooks/useCountdownTimer.js`, `shared/lib/countdown.js` | Appears duplicated functionality (countdown.js is util, hook wraps it) — verify if either is imported | MEDIUM [ASSUMED] |

---

## Confirmed Duplication Findings (Pre-Fallow Analysis)

### Pattern 1: Metric Label Cell (HIGH duplication)

**Files:** `ActivitySummary.jsx` (lines 38, 48, 58, 69), `CalorieSummary.jsx` (lines 30, 41, 52)

**Duplicated className (exact match, 7 occurrences across 2 files):**
```jsx
<p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
  <Icon className="w-3.5 h-3.5 text-{color}" /> Label Text
</p>
```

**Duplicated value display (7 occurrences):**
```jsx
<p className="text-xl sm:text-2xl font-display font-black text-white">
  {value} <span className="text-xs sm:text-sm font-sans font-medium text-slate-500">unit</span>
</p>
```

**Extraction target:** `<MetricItem icon={Icon} label="..." value={...} unit="..." />` semantic component in `shared/ui/`

### Pattern 2: Summary Card Container (HIGH duplication)

**Files:** `ActivitySummary.jsx` (line 33), `CalorieSummary.jsx` (line 25)

**Duplicated pattern:**
```jsx
<div className={`p-6 rounded-2xl border transition-all duration-300 ${cardBg}`}>
```

**Extraction target:** A `<SummaryCard className={cardBg}>` primitive or generic `<Card>` primitive wrapper

### Pattern 3: `cardBg` Status-Driven Coloring Logic

**Files:** `ActivitySummary.jsx` and `CalorieSummary.jsx` — both independently implement `cardBg` variable assignment based on a status condition (surplus/deficit or over-target).

This is semantic logic duplication — both use `'bg-[#1a1a1a] border-[#2d2d2d] shadow-lux'` as the default and override with alert colors based on state.

---

## Standard Stack (for this phase)

No new packages needed. This is a pure refactoring phase using existing tooling.

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| `fallow` | latest | Dead code + duplication analysis | Must install via `npm install -g fallow` |
| Vite plugin (auto-detected) | — | fallow auto-detects Vite entry points | Built-in, zero config |
| React Testing Library | existing | Verifying refactored components pass tests | Already configured |
| Vitest | existing | Test runner | Already configured |

**Note on `lucide-react`:** The package is declared in the **root** `package.json` (line 22: `"lucide-react": "^0.546.0"`), not in `frontend/package.json`. This is valid for an npm workspace setup where the root installs shared deps. Fallow's `--unused-deps` analysis on `frontend/package.json` will likely report it as unlisted from the workspace perspective — this is a **false positive** and should be ignored during cleanup.

---

## Architecture Patterns for Shared Component Extraction

### Existing Pattern (from `shared/ui/index.js`)

The barrel export pattern is already established:

```js
// shared/ui/index.js — existing barrel
export { default as Loader }        from './Loader.jsx';
export { default as DateSwitcher }  from './DateSwitcher.jsx';
export { default as FormField }     from './FormField.jsx';
// etc.
```

Consumers import via:
```js
import { DateSwitcher, SectionHeader, Toast } from '../../../shared/ui/index.js';
```

New extracted components follow this same pattern: create the file in `shared/ui/`, export from `index.js`.

### Decision: Mix of Primitives + Semantic Components

Per `04-CONTEXT.md` locked decision:
- **Primitive:** `<Card>` — generic container with `p-6 rounded-2xl border transition-all duration-300 {className}` 
- **Semantic:** `<MetricItem>` — domain-specific label + value + unit + icon display cell used in fitness summary panels

### Deprecation Naming Convention (from CONTEXT.md)

When dead code is confirmed via fallow:
1. Move the file to a `_deprecated/` subfolder within its own feature directory
2. Name: `_deprecated/ComponentName.jsx` (original name preserved for git history tracing)
3. Do NOT delete immediately — wait for next phase or user confirmation

Example:
```
shared/ui/PageHeader.jsx → shared/ui/_deprecated/PageHeader.jsx
```

---

## Common Pitfalls for Refactoring Phases

### Pitfall 1: Fallow False Positives on Workspace Packages
**What goes wrong:** Running `fallow dead-code` from project root reports `lucide-react` as unlisted because it's in the root `package.json` not `frontend/package.json`.
**Prevention:** Run `fallow dead-code --format json --quiet` from `frontend/` directory using `--workspace frontend` or `cd frontend && fallow dead-code`. Cross-reference workspace package resolution before flagging any dep as unused.

### Pitfall 2: Breaking Existing Tests When Extracting Components
**What goes wrong:** `ActivitySummary.test.jsx` and other tests import the component directly by path. Moving or renaming breaks the import.
**Prevention:** After extracting to shared, update imports in tests. Run `npm test --workspace=frontend` after each extraction to catch breaks immediately. The `__tests__` directories import via relative path (e.g., `../ActivityHistory.jsx`) so only the file being refactored needs updated test imports.

### Pitfall 3: Barrel Re-export Cycles
**What goes wrong:** Adding a new export to `shared/ui/index.js` that re-imports from another barrel creates a cycle fallow will flag.
**Prevention:** New shared components must import only from external packages or `shared/lib/` — never from `shared/ui/` itself.

### Pitfall 4: TailwindCSS Dynamic Class Safety
**What goes wrong:** If a MetricItem component accepts a color string like `text-{color}-500`, Tailwind's JIT purger cannot statically detect the full class name and will strip it from the bundle.
**Prevention:** Pass full class strings (e.g., `iconClassName="text-orange-500"`) or use an allowlist in `tailwind.config.js` safelist. Never template partial Tailwind classes.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running fallow and vite | ✓ | v22.17.0 | — |
| npm | Package management | ✓ | 10.9.2 | — |
| fallow | Static analysis | ✗ | — | `npx fallow` (no install) |
| Vitest + @testing-library/react | Test verification | ✓ (in source) | per package.json | — |

**Missing with fallback:**
- fallow: Not globally installed. Use `npx fallow dead-code --format json --quiet || true` or install globally with `npm install -g fallow`. Both approaches work.

---

## Security Domain

> ASVS applies minimally to this phase — it is a pure refactoring/cleanup phase with no new API endpoints, authentication changes, or data handling.

| ASVS Category | Applies | Standard Control |
|---------------|---------|--------------------|
| V5 Input Validation | No | Not introducing new inputs |
| V2 Authentication | No | No auth code modified |
| Client-server leak (fallow security) | Low risk | Fallow's `client-server-leak` check can run as a side effect — flag if any shared component accidentally reads env vars |

---

## Validation Architecture

**Test Framework:**
| Property | Value |
|----------|-------|
| Framework | Vitest (inferred from test imports: `import { describe, test, expect, vi } from 'vitest'`) |
| Test renderer | @testing-library/react |
| Test files | `frontend/src/**/__tests__/*.test.jsx` |
| Quick run | `npm test --workspace=frontend` (if script configured) |

**Phase Requirements → Test Map:**

| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| FE-01 | Dead code removed | Manual verification via fallow output | No automated test — verify fallow reports 0 issues post-cleanup |
| FE-02 | Duplication identified | Manual (fallow dupes report) | Document clone groups before and after |
| FE-03 | Shared components extractable without regressions | Unit: run existing `__tests__` suites | Existing test files cover `ActivityHistory`, `ActivityLogForm`, `ActivitySummary` and food-log equivalents |

**Wave 0 Gaps (before implementation begins):**
- [ ] Verify `vitest` and `@testing-library/react` are installed and configured in `frontend/package.json` or root (currently missing from `frontend/package.json` devDeps — likely in root or node_modules)
- [ ] Confirm `npm test` or equivalent command works from project root for frontend tests

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `frontend/src/shared/ui/index.js` — barrel export inventory
- `frontend/src/features/activities/components/ActivitySummary.jsx` — duplication source A
- `frontend/src/features/food-log/components/CalorieSummary.jsx` — duplication source B
- `package.json` (root) — lucide-react workspace dependency
- `frontend/package.json` — frontend-specific deps

### Secondary (MEDIUM confidence)
- `.agents/skills/fallow/SKILL.md` — fallow capabilities, CLI usage, exit codes, agent rules

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `weekly-plan` feature has no page component and is dead code | Dead Code Findings | Medium — if a hidden route loads it dynamically, fallow will flag it correctly |
| A2 | `useCountdownTimer` / `countdown.js` are unused | Dead Code Findings | Low — fallow will confirm or deny |
| A3 | Vitest is properly configured — `npm test` works | Validation Architecture | Medium — if test runner is not configured, need to add vitest config in Wave 0 |

## RESEARCH COMPLETE
