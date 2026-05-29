# Requirements: Fitness_App

**Defined:** 2026-05-29
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by ingredients, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1 Requirements

Requirements for v1.3 Activity Tracking & Smart Suggestions. Each maps to roadmap phases.

### Activity Logger

- [ ] **ACT-01**: User can log an activity by selecting from the existing activity database, entering duration in minutes, and choosing intensity level (light/moderate/vigorous)
- [ ] **ACT-02**: User can view their activity history list showing date, activity name, duration, intensity, and calories burned
- [ ] **ACT-03**: User can delete logged activities from history
- [ ] **ACT-04**: Daily activity summary shows total active minutes and calories burned, with net calorie display (consumed − burned vs TDEE target)

### LLM Weekly Activity Suggestions

- [ ] **LLM-01**: System auto-generates a personalized weekly activity plan by selecting from the existing activity database, considering user's profile (weight, goals, activity level) and recent activity history
- [ ] **LLM-02**: User can view their weekly activity plan as day-by-day cards showing suggested activities
- [ ] **LLM-03**: User can request to regenerate a single day/card from the weekly plan (rate-limited to prevent abuse)
- [ ] **LLM-04**: System gracefully falls back to cached plan or shows a message when LLM is unavailable
- [ ] **LLM-05**: LLM provider integration with OpenRouter API key management, rate limiting for cost control, and output validation to ensure only database activities are suggested

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Activity Features

- **ACT-05**: User can add custom activities with name and calories per minute
- **ACT-06**: User can one-click log a suggested activity from the weekly plan
- **ACT-07**: User can edit previously logged activities

### Notifications

- **NOTF-01**: User receives weekly plan reminder at start of week
- **NOTF-02**: User receives daily activity reminder

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom activity entry | Not selected for this milestone; can add custom activities later |
| One-click plan-to-log | Deferred to v2; requires deeper UX work |
| Edit logged activities | Deferred — delete-and-recreate is sufficient for v1.3 |
| Notifications (email/push) | Out of scope for activity tracking milestone |
| Real-time activity sync | No wearable/device integration |
| Social features (sharing, leaderboards) | Not core to individual health tracking |
| LLM-generated activity descriptions | LLM only selects from existing database, no generative descriptions |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACT-01 | Phase 14 | Pending |
| ACT-02 | Phase 14 | Pending |
| ACT-03 | Phase 14 | Pending |
| ACT-04 | Phase 14 | Pending |
| LLM-01 | Phase 15 | Pending |
| LLM-02 | Phase 16 | Pending |
| LLM-03 | Phase 16 | Pending |
| LLM-04 | Phase 15 | Pending |
| LLM-05 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✅

---

*Requirements defined: 2026-05-29*
*Last updated: 2026-05-29 after milestone v1.3 scoping*
