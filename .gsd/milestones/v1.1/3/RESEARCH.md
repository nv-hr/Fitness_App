---
phase: 3
level: 2
researched_at: 2026-06-07T17:28:00+07:00
---

# Phase 3 Research

## Questions Investigated
1. Which page-level components are the largest and most complex, requiring business logic extraction?
2. What pattern should be used to extract business logic and ensure consistency?
3. How can we break down the UI chunks within these massive components without causing prop drilling?

## Findings

### Complex Page Components
We used `grep_search` to identify components heavily reliant on `useState` and `useEffect`. The primary candidates for refactoring are:
- `features/profile/components/ProfileForm.jsx` (433 lines, mixes complex form handling, API logic, and large JSX sections)
- `features/food-log/components/FoodLogForm.jsx` (308 lines, multiple states for tracking history, selected foods, form submissions)
- `features/progress/components/ProgressPage.jsx` (multiple useEffects)
- `features/dashboard/components/DashboardPage.jsx` (fetches profile, tracks events)
- `features/calculators/components/TDEECalculator.jsx` and `BMICalculator.jsx`
- `features/activities/ActivityPage.jsx`

**Recommendation:** We should start with `ProfileForm.jsx` and `FoodLogForm.jsx` as they are the largest and most critical.

### Business Logic Extraction
The standard React pattern is to extract data fetching, state management, and side effects into custom hooks (e.g., `useProfileForm`, `useFoodLog`). 

**Recommendation:** Move all data fetching and state manipulation logic to dedicated `hooks/` directories inside each feature. The page component should primarily be responsible for layout and passing props from the hook to the UI components.

### Breaking Down UI Chunks
For massive files like `ProfileForm.jsx`, the UI is split into logical sections (e.g., "Editor Card Panel" vs "Live Analysis Display"). 
**Recommendation:** Instead of creating dozens of micro-components which lead to prop drilling, we will extract the top-level feature logic into a hook, and keep the UI in the page file. If the file is still too large, we extract the major structural panels into `features/.../components/` (e.g. `ProfileEditor`, `ProfileAnalysis`).

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Extraction Pattern | Feature-Specific Custom Hooks | Decouples business logic from UI, making testing easier and the component more readable. |
| Prioritization | ProfileForm & FoodLogForm first | These are the most bloated components with complex lifecycles and multiple side effects. |
| UI Componentization | Extract major sections, not every field | Prevents excessive prop drilling while still achieving human readability. |

## Patterns to Follow
- Create a custom hook for any page component with multiple `useState` or `useEffect` calls.
- Return only necessary state and handler functions from custom hooks.
- Prefix custom hooks with `use` (e.g. `useProfileLogic`).

## Anti-Patterns to Avoid
- **Massive files:** Avoid files over 200-250 lines if possible.
- **Prop Drilling:** Avoid passing state setters multiple levels down; keep state as close to where it's used as possible, or use the custom hook in the parent.

## Dependencies Identified
None added. We will continue using `react-hook-form`, `zod`, and standard React hooks (`useState`, `useEffect`).

## Risks
- **Regression:** Breaking down working components might introduce bugs if side effects run in different orders. 
  - *Mitigation:* We will test each page manually after refactoring and rely on the already implemented UI components from Phase 2.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
