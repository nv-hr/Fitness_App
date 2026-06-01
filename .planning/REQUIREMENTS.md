# Requirements: KalaFit

**Defined:** 2026-06-02
**Core Value:** Users can track their fitness metrics and get personalized AI-generated workout and meal plans tailored to their goals.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can register with email and password
- [ ] **AUTH-02**: User can log in and receive a JWT session cookie
- [ ] **AUTH-03**: User can log out, clearing their session
- [ ] **AUTH-04**: User can authenticate via Google OAuth
- [ ] **AUTH-05**: User session persists across browser refreshes via httpOnly cookie

### Activity Tracking

- [ ] **ACTV-01**: User can log workouts/activities with type, duration, and intensity
- [ ] **ACTV-02**: User can view a list of their logged activities
- [ ] **ACTV-03**: User can edit or delete their logged activities
- [ ] **ACTV-04**: User receives AI-generated weekly workout plans
- [ ] **ACTV-05**: User can swap or regenerate individual activities in their plan

### Meal Plans & Food Logging

- [ ] **MEAL-01**: User receives AI-generated daily meal plans
- [ ] **MEAL-02**: User can log food/meals with calorie and macro breakdown
- [ ] **MEAL-03**: User can search for foods and create custom entries
- [ ] **MEAL-04**: User can track daily calorie budget and remaining allowance

### Profile & Biometrics

- [ ] **PROF-01**: User can manage their profile (name, goals, preferences)
- [ ] **PROF-02**: User can log weight entries over time
- [ ] **PROF-03**: User can view weight trend/progress chart

### Progress Dashboard

- [ ] **DASH-01**: User can view a summary dashboard of their fitness data
- [ ] **DASH-02**: User can see visualizations of their progress over time

### Infrastructure

- [ ] **INFRA-01**: Application runs locally with `npm run dev`
- [ ] **INFRA-02**: Backend connects to PostgreSQL database (Supabase)
- [ ] **INFRA-03**: LLM integration works with OpenRouter API
- [ ] **INFRA-04**: All existing tests pass
- [ ] **INFRA-05**: API endpoints are rate-limited for AI plan generation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social

- **SOCL-01**: User can share workout plans with friends
- **SOCL-02**: User can follow other users' progress

### Advanced Features

- **ADVN-01**: User can set custom macronutrient targets
- **ADVN-02**: User receives notifications/reminders for logging
- **ADVN-03**: User can export their data (CSV/PDF)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native apps | Web-only for now; responsive design covers mobile browsers |
| Real-time collaboration | Single-user fitness tracking by design |
| Payment/subscription | No monetization planned |
| Video workout content | Storage/bandwidth costs, not core to tracking |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| ACTV-01 | Phase 2 | Pending |
| ACTV-02 | Phase 2 | Pending |
| ACTV-03 | Phase 2 | Pending |
| ACTV-04 | Phase 2 | Pending |
| ACTV-05 | Phase 2 | Pending |
| MEAL-01 | Phase 2 | Pending |
| MEAL-02 | Phase 2 | Pending |
| MEAL-03 | Phase 2 | Pending |
| MEAL-04 | Phase 2 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0

---

*Requirements defined: 2026-06-02*
*Last updated: 2026-06-02 after initial definition*
