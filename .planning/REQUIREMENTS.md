# Requirements: Fitness_App

**Defined:** 2026-05-31
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.6 Requirements

Requirements for v1.6 Activity Planner Rework. Each maps to roadmap phases.

### Variable-Day Scheduling

- [x] **SCHD-01**: User can select 4-6 available days per week when generating a plan
- [ ] **SCHD-02**: System generates plans with variable activity days based on user's available days selection
- [x] **SCHD-03**: Rest days are displayed as rest day cards in the weekly plan view

### Profile-Driven Selection

- [ ] **PROF-01**: LLM selects activity types based on user's fitness goal (lose weight, maintain, build muscle)
- [ ] **PROF-02**: LLM adjusts activity duration and intensity based on user's activity level
- [ ] **PROF-03**: LLM can assign multiple activities per day based on user profile

### Activity Swapping

- [x] **SWAP-01**: User can click a swap button on any activity in the plan
- [ ] **SWAP-02**: LLM picks a replacement activity when user swaps
- [ ] **SWAP-03**: Swapped activity replaces in-place in the cached plan without full regeneration
- [ ] **SWAP-04**: Swap has a dedicated rate limit separate from generate/regenerate

### Plan Migration

- [ ] **MIGR-01**: Old-format plans are lazily regenerated on next visit
- [ ] **MIGR-02**: Plan data includes format_version to distinguish old vs new format

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Activity Planning

- **PROF-04**: Profile changes invalidate existing plan and trigger regeneration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Rule-based swap (no LLM) | LLM swap provides context-aware replacement; rule-based is less intelligent |
| Swap undo/history | Too complex for v1.6; simple swap is sufficient |
| Profile field for available days | Established earlier: per-plan override, not profile field |
| Full weekly plan restructuring on swap | Swap merges into existing plan; full restructure would waste rate limit quota |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHD-01 | Phase 32 | Pending |
| SCHD-02 | Phase 30 | Pending |
| SCHD-03 | Phase 32 | Pending |
| PROF-01 | Phase 30 | Pending |
| PROF-02 | Phase 30 | Pending |
| PROF-03 | Phase 30 | Pending |
| SWAP-01 | Phase 32 | Pending |
| SWAP-02 | Phase 31 | Pending |
| SWAP-03 | Phase 31 | Pending |
| SWAP-04 | Phase 31 | Pending |
| MIGR-01 | Phase 33 | Pending |
| MIGR-02 | Phase 30 | Pending |

**Coverage:**
- v1.6 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---

*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after initial definition*
