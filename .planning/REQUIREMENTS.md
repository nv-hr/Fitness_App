# Requirements: Fitness_App

**Defined:** 2026-05-18
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by ingredients, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.1 Requirements

### Ingredient Database

- [ ] **INGR-01**: Database contains comprehensive international ingredients (proteins, grains, vegetables, fruits, dairy, oils, etc.)
- [ ] **INGR-02**: Each ingredient has calories per 100g value
- [ ] **INGR-03**: Ingredients organized by category for browsing
- [ ] **INGR-04**: User can search ingredients by name

### Ingredient Logging

- [x] **LOG-07**: User can select an ingredient and enter weight in grams
- [x] **LOG-08**: System calculates calories automatically (weight × calories per 100g)
- [x] **LOG-09**: User can add custom ingredients not in database (name + calories per 100g)

### English UI

- [x] **UI-04**: All UI text in English — form labels, buttons, error messages, navigation
- [x] **UI-05**: Category names in English (proteins, grains, vegetables, fruits, dairy, oils)
- [x] **UI-06**: Meal type labels in English (breakfast, lunch, dinner, snack)

### Calorie Display

- [x] **CALC-01**: Daily calorie summary shows total from ingredient-based logging
- [x] **CALC-02**: Calorie balance against TDEE target still works with new logging model

## v2 Requirements

### Notifications

- **NOTF-01**: User receives daily reminder to log meals
- **NOTF-02**: User receives weekly progress summary

### Advanced Nutrition

- **NUTR-01**: Display macro breakdown (protein, carbs, fat) for ingredients
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
| Barcode scanning | Poor international ingredient coverage, high complexity |
| Macro tracking in v1 | Adds UI complexity for beginners, defer to v2 |
| Social features | Not core to individual health tracking |
| Mobile app (native) | Web-first, responsive design sufficient |
| Real AI/ML in v1 | Rule-based randomization validated by research |
| Video exercise tutorials | Storage/bandwidth costs, defer to v2+ |
| Meal/recipe logging | Ingredient-level only for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGR-01 | Phase 6 | Pending |
| INGR-02 | Phase 6 | Pending |
| INGR-03 | Phase 6 | Pending |
| INGR-04 | Phase 6 | Pending |
| LOG-07 | Phase 7 | Complete |
| LOG-08 | Phase 7 | Complete |
| LOG-09 | Phase 7 | Complete |
| UI-04 | Phase 8 | Complete |
| UI-05 | Phase 8 | Complete |
| UI-06 | Phase 8 | Complete |
| CALC-01 | Phase 7 | Complete |
| CALC-02 | Phase 7 | Complete |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after v1.1 roadmap created*
