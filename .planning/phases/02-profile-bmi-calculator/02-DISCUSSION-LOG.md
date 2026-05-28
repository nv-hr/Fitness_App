# Phase 2: Profile & BMI Calculator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 02-Profile & BMI Calculator
**Areas discussed:** Profile data storage, BMI calculation endpoint, Profile UI layout, BMI display format, Profile flow, Units, Goals

---

## Profile Data Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Extend users table (Recommended) | Add weight, height, age, gender, fitness_goal columns to existing users table. Simpler, fewer joins. | |
| Separate profiles table | Create separate profiles table with user_id FK. Better separation, allows profile history later. | ✓ |

**User's choice:** Separate profiles table
**Notes:** Allows profile history tracking later (weight changes over time). Profiles table: id, user_id (FK), weight_kg, height_cm, age, gender, fitness_goal, created_at, updated_at.

---

## BMI Calculation Endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Computed on profile save (Recommended) | Save profile → backend calculates BMI automatically → returns BMI with response. Simple, always up-to-date. | ✓ |
| Separate endpoint | Separate POST /api/bmi/calculate endpoint. User can calculate without saving profile. | |
| Both — auto + on-demand | Save profile computes BMI, but also allow GET /api/bmi for on-demand calculation from current profile. | |

**User's choice:** Computed on profile save (Recommended)
**Notes:** No separate BMI endpoint needed for v1. BMI returned with profile save response.

---

## Profile UI Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Combined form + result (Recommended) | Single page: form at top, BMI result appears below after save. Clean, minimal clicks. | ✓ |
| Separate pages | Profile page for editing, separate BMI page showing result and history. | |
| Modal form | Modal/popup form from dashboard, result shown in modal or inline. | |

**User's choice:** Combined form + result (Recommended)
**Notes:** Single page experience. Form at top, BMI result below after save.

---

## BMI Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Number + color badge + disclaimer (Recommended) | Large BMI number, category badge with color (green=normal, yellow=overweight, red=obese), disclaimer text below. | ✓ |
| Gauge/meter visualization | BMI number with a visual gauge/meter showing where user falls on the spectrum. | |
| Simple text only | Simple text only: 'BMI Anda: 22.5 (Normal)' with disclaimer. | |

**User's choice:** Number + color badge + disclaimer (Recommended)
**Notes:** Color coding: green=normal, yellow=overweight, red=obese, blue=underweight. Disclaimer in Indonesian: "Hasil ini adalah estimasi dan bukan diagnosis medis."

---

## Profile Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory on first login (Recommended) | After first login, redirect to profile setup page. Must complete before accessing other features. | ✓ |
| Optional from dashboard | Dashboard shows 'Set up your profile' prompt, but user can skip and use calculators without profile. | |
| During registration | Profile fields integrated into registration form — complete during signup. | |

**User's choice:** Mandatory on first login (Recommended)
**Notes:** Redirect to profile page after first authentication. Must complete before accessing other features. Profile can be updated later from dashboard.

---

## Units

| Option | Description | Selected |
|--------|-------------|----------|
| kg + cm (Recommended) | kg for weight, cm for height. Standard in Indonesia. | ✓ |
| kg + meters | kg for weight, meters for height (e.g., 1.70). | |

**User's choice:** kg + cm (Recommended)
**Notes:** Standard Indonesian units. Height stored as cm, converted to meters for BMI calculation.

---

## Goals

| Option | Description | Selected |
|--------|-------------|----------|
| 3 options (Recommended) | lose_weight, maintain, gain_weight — simple 3 options. | ✓ |
| 5 options | Add aggressive_cut, lean_bulk for more granularity. | |

**User's choice:** 3 options (Recommended)
**Notes:** Simple enum: lose_weight, maintain, gain_weight.

---

## the agent's Discretion

- Profile validation rules (min/max weight, height ranges)
- Exact color values for BMI category badges
- Whether to store BMI in database or compute on-the-fly (recommendation: compute on-the-fly, no BMI column needed)
- Exact Indonesian text for form labels and validation messages

## Deferred Ideas

- BMI history tracking — belongs in future phase (Track BMI over time)
- Profile photo upload — not in v1 requirements
- Multiple profile presets (e.g., different goals) — out of scope
- BMI comparison with ideal weight range — could be Phase 3 (TDEE) feature
