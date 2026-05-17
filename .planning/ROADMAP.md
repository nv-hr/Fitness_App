# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Phases:** 5
**Granularity:** Coarse
**Coverage:** 30/30 requirements mapped ✓

## Phases

- [ ] **Phase 1: Foundation & Authentication** — Users can securely register, login, and access the app with PDP consent
- [ ] **Phase 2: Profile & BMI Calculator** — Users can set body metrics and view BMI results with Asian-Pacific cutoffs
- [ ] **Phase 3: TDEE Calculator & Goals** — Users can calculate daily calorie targets based on activity level and fitness goals
- [ ] **Phase 4: Food Database & Calorie Logging** — Users can search Indonesian foods, log meals, and track daily calorie balance
- [ ] **Phase 5: Activity Recommendations & Polish** — Users receive goal-based activity suggestions; app is fully responsive and in Bahasa Indonesia

## Phase Details

### Phase 1: Foundation & Authentication
**Goal:** Users can securely create accounts, authenticate, and access the application with proper data protection consent
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, UI-01
**Success Criteria** (what must be TRUE):
  1. User can register a new account with email and password
  2. User can log in with email/password or Google OAuth and stay logged in across page refreshes
  3. User can log out from any page in the application
  4. User must explicitly consent to PDP terms before any health data is collected
  5. All visible UI text is in Bahasa Indonesia
**Plans:** TBD
**UI hint**: yes

### Phase 2: Profile & BMI Calculator
**Goal:** Users can set their body metrics and view their BMI with proper regional context
**Depends on:** Phase 1
**Requirements:** PROF-01, PROF-02, PROF-03, BMI-01, BMI-02, BMI-03
**Success Criteria** (what must be TRUE):
  1. User can set and update their profile data (weight, height, age, gender, fitness goal)
  2. User can calculate BMI from their profile data and see the result with Asian-Pacific category (underweight, normal, overweight, obese)
  3. BMI display includes a clear disclaimer that the result is an estimate, not a diagnosis
**Plans:** TBD
**UI hint**: yes

### Phase 3: TDEE Calculator & Goals
**Goal:** Users can calculate their daily calorie target based on activity level and fitness goals
**Depends on:** Phase 2
**Requirements:** TDEE-01, TDEE-02, TDEE-03
**Success Criteria** (what must be TRUE):
  1. User can calculate TDEE using Mifflin-St Jeor formula with their profile data and selected activity level
  2. TDEE result is displayed as a range (not a precise number) with activity level description
  3. User sees a recommended daily calorie target adjusted for their fitness goal (deficit for weight loss, surplus for weight gain)
**Plans:** TBD
**UI hint**: yes

### Phase 4: Food Database & Calorie Logging
**Goal:** Users can search Indonesian foods, log their daily meals, and understand their calorie balance
**Depends on:** Phase 3
**Requirements:** FOOD-01, FOOD-02, FOOD-03, FOOD-04, LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06
**Success Criteria** (what must be TRUE):
  1. User can search a pre-seeded database of 200+ Indonesian foods and see calorie info per serving
  2. User can add custom foods not in the database (name + calories)
  3. User can log food consumption for a specific date with quantity
  4. User can view daily total calories consumed, calorie balance against TDEE target, and calorie history for past days
  5. User sees a warning when daily intake shows extreme deficit (<1200 kcal) and can quick-add recently logged foods
**Plans:** TBD
**UI hint**: yes

### Phase 5: Activity Recommendations & Polish
**Goal:** Users receive personalized activity suggestions and the application works seamlessly across devices
**Depends on:** Phase 4
**Requirements:** ACT-01, ACT-02, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User receives randomized activity recommendations appropriate for their fitness goal
  2. Recommended activities are suitable for home use without gym equipment
  3. Application layout is fully responsive and usable on both mobile and desktop screens
  4. All UI elements have clean, minimal styling consistent across the application
**Plans:** TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 0/0 | Not started | - |
| 2. Profile & BMI Calculator | 0/0 | Not started | - |
| 3. TDEE Calculator & Goals | 0/0 | Not started | - |
| 4. Food Database & Calorie Logging | 0/0 | Not started | - |
| 5. Activity Recommendations & Polish | 0/0 | Not started | - |

---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-17*
