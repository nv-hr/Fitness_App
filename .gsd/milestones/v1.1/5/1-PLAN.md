---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Match BMI Calculator Result Styling with TDEE

## Objective
Harmonize the "Your Results" layout, colors, and typography of the BMI Calculator with the TDEE Calculator's "Your Daily Calorie Needs" card.

## Context
- frontend/src/features/calculators/components/BMICalculator.jsx
- frontend/src/features/calculators/components/TDEECalculator.jsx

## Tasks

<task type="auto">
  <name>Refactor BMI Results Card</name>
  <files>
    - frontend/src/features/calculators/components/BMICalculator.jsx
  </files>
  <action>
    Replace the single large card wrapper under `calculatedResults && status` with a grid layout matching `TDEECalculator.jsx`.
    Use class `grid grid-cols-2 gap-3 text-center` for the grid.
    Make the individual grid cells use `py-4 bg-[#121212] rounded-xl border border-[#2d2d2d]`.
    Set up the two cells:
      - Cell 1: Header "BMI SCORE", value `calculatedResults.bmi.toFixed(1)` using `text-2xl font-display font-black text-white mt-0.5 font-mono`.
      - Cell 2: Header "WEIGHT STATUS", value `status.label` using `text-2xl font-display font-black text-red-400 mt-0.5`.
    Render the gender and age text below the grid cards, centered.
  </action>
  <verify>Get-Content frontend/src/features/calculators/components/BMICalculator.jsx | Select-String "BMI SCORE"</verify>
  <done>BMICalculator.jsx results card styling matches TDEECalculator.</done>
</task>

<task type="auto">
  <name>Verify Build</name>
  <files>
    - frontend/package.json
  </files>
  <action>
    Run `npm run build --workspace=frontend` to check for compilation or syntax errors.
  </action>
  <verify>npm run build --workspace=frontend</verify>
  <done>Frontend builds successfully.</done>
</task>

## Success Criteria
- [ ] BMI calculator result layout matches TDEE style (grid columns, dark bg `#121212`, border `#2d2d2d`).
- [ ] BMI score is white text (`text-white`) and weight status is red text (`text-red-400`).
- [ ] Build succeeds.
