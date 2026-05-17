---
title: "Architecture"
last_mapped_commit: a161cdd
last_updated: "2026-05-17"
focus: arch
---

# ARCHITECTURE.md — System Architecture

## Overview

Fitness_App currently has **no implemented architecture**. The repository consists solely of documentation files describing planned features. No system design, no code structure, and no architectural patterns exist.

## Architectural Pattern

- **Not applicable** — No codebase to analyze for patterns.
- Planned features suggest a **tool-based** architecture where each calculator/planner is a standalone module.

## Layers

No layers exist. Planned feature breakdown:

| Layer | Planned Components |
|-------|-------------------|
| UI | 5 feature pages (BMI, KCAL, TDEE, Workout Planner, Workout Progress) |
| Logic | Calculation engines for BMI, KCAL, TDEE formulas |
| Data | Progress tracking storage (Workout Progress) |

## Data Flow

- **Not implemented** — No data flow exists.
- Expected flow once built:
  1. User inputs data (weight, height, age, activity level)
  2. Calculator processes using standard formulas
  3. Results displayed to user
  4. Progress data saved/loaded (Workout Progress feature)

## Abstractions

- **None** — No abstractions, interfaces, or base classes defined.

## Entry Points

- **None** — No executable entry points (`index.html`, `main.py`, `App.tsx`, etc.).

## Key Formulas (for future implementation)

- **BMI**: weight(kg) / height(m)²
- **TDEE**: BMR × Activity Multiplier
- **BMR**: Mifflin-St Jeor or Harris-Benedict equation
- **KCAL**: Food item calorie summation

## Notes

- Project is in pre-implementation phase
- Architecture decisions should be made during planning phase before coding begins
