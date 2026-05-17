# Phase 4: Food Database & Calorie Logging - Discussion Log

**Date:** 2026-05-18
**Phase:** 04-food-database-calorie-logging

## Areas Discussed

All 4 gray areas were selected for discussion.

### 1. Database Schema & Seeding

**Question:** How should we structure the food database?

**Options presented:**
- Single foods table with user_id (Recommended)
- Separate tables: foods + user_foods
- Minimal: just name + calories

**User selected:** Single foods table with user_id (Recommended)

**Follow-up:** How many Indonesian foods to pre-seed?

**Options presented:**
- ~30-50 common foods (Recommended)
- 100+ comprehensive list
- Minimal 10-15 staples

**User selected:** 100+ comprehensive list

**Decisions captured:** D-30, D-31, D-32

### 2. Logging Interface

**Question:** Where should the food logging interface live?

**Options presented:**
- Dedicated /food-log page (Recommended)
- Extend /profile page
- Split: /food-log + /dashboard

**User selected:** Dedicated /food-log page (Recommended)

**Follow-up:** How should users find foods to log?

**Options presented:**
- Search-as-you-type (Recommended)
- Category browse + search
- Recent foods + search

**User selected:** Search-as-you-type (Recommended)

**Decisions captured:** D-34, D-35

### 3. Calorie Balance Display

**Question:** How should the calorie balance be displayed?

**Options presented:**
- Summary bar on /food-log (Recommended)
- Separate dashboard page
- On /profile page with TDEE

**User selected:** Summary bar on /food-log (Recommended)

**Decisions captured:** D-36

### 4. Custom Food Entry

**Question:** What fields should be required for custom food entry?

**Options presented:**
- Name + calories per serving (Recommended)
- Name + calories + serving size + unit
- Name + calories + optional notes

**User selected:** Name + calories per serving (Recommended)

**Decisions captured:** D-37, D-38

## Deferred Ideas

- Weekly/monthly calorie trend charts
- Macro tracking (protein/carbs/fat)
- Barcode scanning for packaged foods
- Meal plan generation based on calorie target
- Social food sharing
- Photo-based food logging

---

*Phase: 04-Food Database & Calorie Logging*
*Discussion completed: 2026-05-18*
