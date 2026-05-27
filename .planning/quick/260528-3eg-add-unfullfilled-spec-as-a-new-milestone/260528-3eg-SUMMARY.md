---
id: 260528-3eg
title: Add unfulfilled BMI/TDEE spec as milestone
status: complete
created: 2026-05-27
commit: 44edebb
---

## Summary

Audited the existing BMI/BMR/TDEE implementation against the user's detailed formula spec. Found two gaps:

1. **Activity levels**: Only 3 (low/medium/high with 1.2/1.55/1.9) → should be 5 (sedentary/light/moderate/very_active/extra_active with 1.2/1.375/1.55/1.725/1.9)
2. **Calorie targets**: Flat adjustments (-500/0/+300) → should be tiered based on weight change rate (±275/550/1100 for 0.25/0.5/1 kg per week)

All gaps fixed across backend (service, controller, repository, schema) and frontend (form, result display, translations).
