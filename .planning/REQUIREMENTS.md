# Requirements: Fitness_App

**Defined:** 2026-05-31
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by ingredients, log physical activities with calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.5 Requirements

### Activity Plan Persistence & Auto-Log

- [ ] **ACT-01**: System persists generated activity plans to activity_plans table (mirrors meal_plans pattern)
- [ ] **ACT-02**: User can batch-log activities from plan to activity_logs with single click (completed toggle)
- [ ] **ACT-03**: System tracks logged/completed status of each activity item in plan_data JSONB

### 3-Day Meal Plan Backend

- [ ] **MEAL-01**: System generates 3-day meal recommendations (changed from 7-day)
- [ ] **MEAL-02**: System persists daily meal plans to daily_meal_plans table
- [ ] **MEAL-03**: User can batch-log meals from plan to food_logs
- [ ] **MEAL-04**: System tracks logged status of each meal item in plan_data JSONB

### Auto-Generation & Inline Management

- [ ] **AUTO-01**: System auto-generates plan on page visit when no plan exists for current period
- [ ] **AUTO-02**: Always-visible regenerate button on merged pages
- [ ] **AUTO-03**: Auto-generation respects rate limits (shows countdown when exhausted)
- [ ] **AUTO-04**: One-shot guard prevents infinite regeneration loop on failed LLM calls

### UI Consolidation

- [ ] **UI-01**: Activity Plan section embedded in Activities page (no separate route)
- [ ] **UI-02**: Meal Plan section embedded in Food Log page (no separate route)
- [ ] **UI-03**: Old /weekly-plan and /meal-plan routes redirect to /activities and /food-log

## v2.0 / Future Requirements

### Meal Plan Enhancements

- **MEAL-05**: User can select alternative meals for individual meal slots
- **MEAL-06**: User can customize generated meal portions

### Social & Sharing

- **SOC-01**: User can share meal plans with others
- **SOC-02**: Community meal ratings and reviews

## Out of Scope

| Feature | Reason |
|---------|--------|
| Select alternatives for meals | Deferred to v1.6 — complex UX, not blocking main merge |
| Custom activity entry | Existing deferred item — not needed for plan-to-log flow |
| Edit logged activities | Delete-and-recreate sufficient |
| Notifications (email/push) | Out of scope for health tracking |
| Real-time sync / wearables | No wearable integration |
| Supabase Auth / RLS | Current auth architecture works |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACT-01 | — | Pending |
| ACT-02 | — | Pending |
| ACT-03 | — | Pending |
| MEAL-01 | — | Pending |
| MEAL-02 | — | Pending |
| MEAL-03 | — | Pending |
| MEAL-04 | — | Pending |
| AUTO-01 | — | Pending |
| AUTO-02 | — | Pending |
| AUTO-03 | — | Pending |
| AUTO-04 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |

**Coverage:**
- v1.5 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after initial definition*
