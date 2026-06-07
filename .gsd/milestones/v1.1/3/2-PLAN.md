---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: Extract FoodLogForm Business Logic

## Objective
Extract data fetching, local states (`logs`, `history`, `recentFoods`, `selectedFood`, `portion`, `mealType`), and API integration from `FoodLogForm.jsx` into a new custom hook `useFoodLog.js`.

## Context
- .gsd/phases/3/RESEARCH.md
- frontend/src/features/food-log/components/FoodLogForm.jsx
- frontend/src/features/food-log/hooks/useFoodLog.js (to be created)

## Tasks

<task type="auto">
  <name>Create useFoodLog hook</name>
  <files>frontend/src/features/food-log/hooks/useFoodLog.js</files>
  <action>
    - Move `logs`, `history`, `recentFoods`, `selectedFood`, `portion`, `mealType`, `showCustomForm`, `error`, `successMsg`, `loading`, `submitting` state.
    - Extract `useEffect` data loading logic.
    - Extract `handleFoodSelect`, `handleQuickAdd`, `handleLogFood`, `handleDeleteLog`, and `handleCustomFoodSuccess`.
    - Return state variables and handlers.
  </action>
  <verify>Get-Content frontend/src/features/food-log/hooks/useFoodLog.js -TotalCount 5</verify>
  <done>Hook encapsulates all state and handlers.</done>
</task>

<task type="auto">
  <name>Refactor FoodLogForm.jsx</name>
  <files>frontend/src/features/food-log/components/FoodLogForm.jsx</files>
  <action>
    - Refactor `FoodLogForm.jsx` to use the `useFoodLog` hook.
    - Ensure all passed props to sub-components (`FoodSearch`, `CustomFoodForm`, `FoodLogTable`, `CalorieHistory`) remain intact.
  </action>
  <verify>npm run build --workspace=frontend</verify>
  <done>FoodLogForm renders purely from hook state without local state management.</done>
</task>

## Success Criteria
- [ ] FoodLogForm.jsx acts primarily as a view layer.
- [ ] useFoodLog.js correctly manages state and API calls.
- [ ] The application builds correctly.
