# Requirements: Fitness_App

**Defined:** 2026-05-17
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake, and understand their calorie balance — all in one integrated, easy-to-use Indonesian-language health tool.

## v1 Requirements

### Authentication & User Management

- [ ] **AUTH-01**: User can register with email and password
- [ ] **AUTH-02**: User can login with email and password
- [ ] **AUTH-03**: User can login with Google OAuth
- [ ] **AUTH-04**: User session persists via httpOnly JWT cookie across page refreshes
- [ ] **AUTH-05**: User can logout from any page
- [ ] **AUTH-06**: User must consent to PDP (Personal Data Protection) terms before health data collection

### User Profile

- [ ] **PROF-01**: User can set profile data (weight, height, age, gender)
- [ ] **PROF-02**: User can update profile data at any time
- [ ] **PROF-03**: User can set fitness goal (lose weight, maintain, gain weight)

### BMI Calculator

- [ ] **BMI-01**: User can calculate BMI from profile data (weight, height)
- [ ] **BMI-02**: User sees BMI result with category using Asian-Pacific cutoffs (underweight <18.5, normal 18.5-22.9, overweight 23-24.9, obese >=25)
- [ ] **BMI-03**: BMI display includes disclaimer that result is an estimate

### TDEE Calculator

- [x] **TDEE-01**: User can calculate TDEE using Mifflin-St Jeor formula with profile data and activity level
- [x] **TDEE-02**: TDEE result displays as a range (not exact number) with activity level description
- [x] **TDEE-03**: User sees recommended daily calorie target based on fitness goal (deficit/surplus adjustments)

### Food Database

- [ ] **FOOD-01**: User can search pre-seeded Indonesian food database by name
- [ ] **FOOD-02**: Food search returns results with calorie info (kcal per serving)
- [ ] **FOOD-03**: User can add custom foods not in the database (name + calories)
- [ ] **FOOD-04**: Database contains minimum 200 curated Indonesian foods at launch

### Calorie Logging

- [ ] **LOG-01**: User can log food consumption for a specific date (select food + quantity)
- [ ] **LOG-02**: User can view daily total calories consumed
- [ ] **LOG-03**: User can view daily calorie balance (consumed vs TDEE target)
- [ ] **LOG-04**: User can view calorie history (past days' logs)
- [ ] **LOG-05**: Quick-add feature for recently logged foods
- [ ] **LOG-06**: Warning displayed if daily intake shows extreme deficit (<1200 kcal)

### Activity Recommendations

- [ ] **ACT-01**: User receives randomized simple activity recommendations based on their fitness goal
- [ ] **ACT-02**: Activities are suitable for home use (no gym equipment required)

### UI/UX

- [ ] **UI-01**: All UI text is in Bahasa Indonesia
- [ ] **UI-02**: Application is responsive (works on mobile and desktop)
- [ ] **UI-03**: Minimal but clean styling

## v2 Requirements

### Notifications

- **NOTF-01**: User receives daily reminder to log meals
- **NOTF-02**: User receives weekly progress summary

### Advanced Nutrition

- **NUTR-01**: Display macro breakdown (protein, carbs, fat) for foods
- **NUTR-02**: User can set macro targets

### Social Features

- **SOCL-01**: User can share progress with friends
- **SOCL-02**: Community challenges

### AI Recommendations

- **AI-01**: ML-based personalized activity recommendations
- **AI-02**: Smart food suggestions based on logging history

## Out of Scope

| Feature | Reason |
|---------|--------|
| Barcode scanning | Poor Indonesian food coverage, high complexity |
| Macro tracking in v1 | Adds UI complexity for beginners, defer to v2 |
| Social features | Not core to individual health tracking |
| Mobile app (native) | Web-first, responsive design sufficient |
| Real AI/ML in v1 | Rule-based randomization validated by research |
| Video exercise tutorials | Storage/bandwidth costs, defer to v2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| BMI-01 | Phase 2 | Pending |
| BMI-02 | Phase 2 | Pending |
| BMI-03 | Phase 2 | Pending |
| TDEE-01 | Phase 3 | Complete |
| TDEE-02 | Phase 3 | Complete |
| TDEE-03 | Phase 3 | Complete |
| FOOD-01 | Phase 4 | Pending |
| FOOD-02 | Phase 4 | Pending |
| FOOD-03 | Phase 4 | Pending |
| FOOD-04 | Phase 4 | Pending |
| LOG-01 | Phase 4 | Pending |
| LOG-02 | Phase 4 | Pending |
| LOG-03 | Phase 4 | Pending |
| LOG-04 | Phase 4 | Pending |
| LOG-05 | Phase 4 | Pending |
| LOG-06 | Phase 4 | Pending |
| ACT-01 | Phase 5 | Pending |
| ACT-02 | Phase 5 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after initial definition*
