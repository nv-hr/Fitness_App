# Phase 5 Research: BMI Calculator Result Card Style Fix

## Objective
Harmonize the styling of the "Your Result" card in the BMI Calculator with the "Your Daily Calorie Needs" card in the TDEE Calculator. 

## Findings

1. **Current Styling (BMI Results)**
   - Utilizes a single giant card (`bg-slate-900 border-slate-700 relative overflow-hidden` with a `#1a1a1a` background override).
   - Renders a large `text-5xl text-emerald-400` score.
   - Embeds a dynamic badge (`status.label`) and gender/age subtext inside the same card.

2. **Target Styling (TDEE Results)**
   - Utilizes a 2-column grid (`grid grid-cols-2 gap-3 text-center`).
   - Cards in the grid use `py-4 bg-[#121212] rounded-xl border border-[#2d2d2d]`.
   - Title text style: `text-[10px] text-slate-400 uppercase tracking-widest font-semibold`.
   - Value text styles:
     - Left card: `text-2xl font-display font-black text-white mt-0.5 font-mono` (BMR).
     - Right card: `text-2xl font-display font-black text-red-400 mt-0.5 font-mono` (TDEE).

## Proposed Solution
Refactor the BMI calculator results to display as a two-column grid matching the BMR/TDEE layout:
- **Left Card**:
  - Title: "BMI Score"
  - Value: `calculatedResults.bmi.toFixed(1)`
  - Style: `text-white font-mono text-2xl font-black` (matches BMR layout)
- **Right Card**:
  - Title: "Weight Status"
  - Value: `status.label`
  - Style: `text-red-400 text-2xl font-black` (matches TDEE layout)
- **Subtext**: Render gender and age subtext centered underneath the grid cards.
- **Outer Wrapper / Structure**: Keep the surrounding health guidance box and standard BMI ranges intact but ensure their styling integrates cleanly.
