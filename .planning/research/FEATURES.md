# Feature Landscape

**Domain:** Fitness/Health Tracking Web App (Indonesian market)
**Researched:** 2026-05-17

## Table Stakes

Features users expect in any health tracking product. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **User registration & login** (email/password + OAuth) | Baseline for any personalized app | Low | Standard auth pattern; Google OAuth expected in 2026 |
| **BMI Calculator** | Most searched health calculator globally; entry point for health awareness | Low | WHO-standard formula; display category (underweight/normal/overweight/obese) with color coding |
| **TDEE Calculator** | Core to calorie tracking — users need their daily target before logging food | Low | Mifflin-St Jeor equation (industry standard, ±10% accuracy in 80% of individuals); activity level multiplier (1.2–1.9) |
| **Calorie logging** (manual food entry) | Fundamental tracking behavior; users will not adopt without it | Medium | Food name + calories + date; running daily total |
| **Daily calorie balance view** | Users need to see consumed vs. target at a glance | Low | Simple subtraction: TDEE − consumed = remaining/overage |
| **Food database search** | Manual entry for every meal is the #1 cause of tracking abandonment | High (data) | Pre-seeded Indonesian foods; search by name; must include common local dishes (nasi goreng, rendang, gado-gado, etc.) |
| **Custom food entry** | No database covers everything; users must add missing items | Low | User-created foods saved to their profile |
| **Responsive web UI** | Mobile-first market; Indonesia is 80%+ mobile web | Medium | Must work well on phones; desktop secondary |
| **Bahasa Indonesia UI** | Target market requirement | Low | All labels, messages, categories in Indonesian |

## Differentiators

Features that set this product apart. Not expected, but highly valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Indonesian food database (pre-seeded)** | Competitors (MyFitnessPal, Cronometer) have poor Indonesian coverage; this is the core competitive moat | High (data curation) | Source from TKPI (Tabel Komposisi Pangan Indonesia) — the official Indonesian food composition table from Kemenkes; Kaggle dataset (1,346 items) provides a starting seed with calories/protein/fat/carbs |
| **Integrated BMI + TDEE + Calorie Tracking in one flow** | Most apps are either calculators-only OR trackers-only; combining them creates a complete "know your numbers → track against them" loop | Medium | User calculates BMI/TDEE once, then those values auto-populate the tracking dashboard |
| **Activity recommendations based on user goal** | Provides actionable next steps beyond tracking; increases engagement and perceived value | Low (rule-based) | For v1: randomized suggestions from a curated pool, filtered by goal (lose weight / maintain / gain); no ML needed |
| **Calorie deficit/surplus guidance** | Shows users how their TDEE translates to weight loss/gain targets (e.g., −500 kcal/day ≈ −0.5 kg/week using 7,700 kcal/kg heuristic) | Low | Simple math; adds educational value |
| **Weight goal selection** | Users want to specify their target (lose/maintain/gain) and see adjusted calorie targets | Low | Maps goal to calorie adjustment: extreme loss (−1 kg/wk), moderate (−0.5 kg/wk), mild (−0.25 kg/wk), maintain, gain |

## Anti-Features

Features to explicitly NOT build in v1. These add complexity without proportional value for the target market.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AI/ML-powered recommendations** | Over-engineering for v1; requires training data, model infrastructure, and ongoing tuning that doesn't exist yet | Use rule-based randomization from a curated activity pool (already decided in PROJECT.md) |
| **Macro tracking** (protein/carbs/fat breakdown) | Adds UI complexity and database requirements; target users are beginners who need calorie awareness first | Store macros in food database for future use, but only display calories in v1 |
| **Barcode scanning** | Indonesian packaged food barcode databases are sparse; would require integration with global APIs (FatSecret, Edamam) that add cost and complexity | Defer to v2; focus on search + manual entry |
| **Social features** (sharing, community, leaderboards) | Not core to individual health tracking; adds moderation, privacy, and infrastructure overhead | Defer; validate core tracking first |
| **Wearable/device integration** | Indonesian market has low wearable penetration; integration adds significant complexity | Defer; manual entry is sufficient for v1 |
| **Meal planning / recipe generation** | Requires extensive recipe database and nutrition calculation engine; out of scope for individual tracking | Defer; focus on logging what users already eat |
| **Micronutrient tracking** (vitamins, minerals) | Target users don't need this level of detail; adds database complexity | Defer; store data in food database schema for future expansion |
| **Photo-based food logging** | Requires AI vision models; high complexity, uncertain accuracy for Indonesian cuisine | Defer to v2+ |
| **Intermittent fasting timer** | Niche feature; not aligned with core calorie tracking value proposition | Defer; can be added if user research shows demand |

## Feature Dependencies

```
User Registration → BMI Calculator (requires user profile)
User Registration → TDEE Calculator (requires user profile)
BMI Calculator → Dashboard (BMI result displayed on home)
TDEE Calculator → Calorie Tracking (TDEE becomes daily target)
Food Database → Calorie Logging (search selects food to log)
Calorie Logging → Daily Balance View (logged calories feed the balance)
Custom Food Entry → Calorie Logging (custom foods appear in search results)
Activity Recommendations → TDEE Calculator (goal from TDEE filters suggestions)
Weight Goal Selection → TDEE Calculator (adjusts target calories)
```

### Dependency Graph (visual)

```
                    ┌─────────────────┐
                    │  Registration   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌───────────┐  ┌──────────────────┐
        │   BMI    │  │   TDEE    │  │  Weight Goal     │
        │Calculator│  │Calculator │  │  Selection       │
        └────┬─────┘  └─────┬─────┘  └────────┬─────────┘
             │              │                  │
             │              ▼                  ▼
             │       ┌─────────────┐    ┌──────────────┐
             │       │ Daily Cal   │◄───│ Activity     │
             │       │ Target      │    │ Recommend.   │
             │       └──────┬──────┘    └──────────────┘
             │              │
             ▼              ▼
        ┌────────────────────────┐
        │   Food Database        │
        │   (pre-seeded + custom)│
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │   Calorie Logging      │
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │   Daily Balance View   │
        │   (consumed vs target) │
        └────────────────────────┘
```

## MVP Recommendation

**Prioritize (ship in v1):**
1. User registration & login (email/password + Google OAuth) — foundation for everything
2. BMI Calculator — quick win, builds trust, low complexity
3. TDEE Calculator with weight goal selection — establishes the daily calorie target
4. Pre-seeded Indonesian food database (100–200 common items) — the core differentiator
5. Calorie logging with food search — the primary daily-use feature
6. Daily calorie balance view — closes the loop
7. Custom food entry — handles database gaps
8. Rule-based activity recommendations — adds engagement

**Defer to v2:**
- Macro display (data stored but not shown) — reason: adds UI complexity without validated demand
- Barcode scanning — reason: Indonesian barcode coverage is poor; global APIs add cost
- Weight history tracking — reason: useful but not blocking for v1
- Intermittent fasting — reason: niche; validate core tracking first
- Photo food logging — reason: requires AI infrastructure

**Defer to v3+:**
- Social features — reason: not core to individual tracking
- Wearable integration — reason: low Indonesian market penetration
- Meal planning — reason: requires extensive recipe database
- AI-powered recommendations — reason: requires training data and model infrastructure

## Indonesian Food Database Considerations

### Data Sources

| Source | Coverage | Fields | License | Suitability |
|--------|----------|--------|---------|-------------|
| **TKPI (Tabel Komposisi Pangan Indonesia)** — Kemenkes | Official government food composition tables; most authoritative for Indonesian foods | Energy, protein, fat, carbs, vitamins, minerals per 100g | Government publication; verify reuse terms | **Primary source** — most accurate for local foods |
| **Kaggle: Indonesian Food & Drink Nutrition Dataset** (anasfikrihanif) | 1,346 food/drink entries | Name, calories, protein, fat, carbs, image URL | Kaggle (check specific license) | **Seed dataset** — quick start, covers common items |
| **FAO/INFOODS Indonesia** | Historical food composition tables (1967–1995) | Various nutrients | Open | **Supplementary** — older data but comprehensive |
| **USDA FoodData Central** | Global database with some Southeast Asian items | Full nutrient profile | Public domain (CC0) | **Gap-filler** — for items not in Indonesian sources |

### Key Indonesian Foods to Include (priority categories)

| Category | Examples | Why Important |
|----------|----------|---------------|
| **Staples** | Nasi putih, nasi merah, mie instan, roti tawar, kentang | Eaten daily by most users |
| **Main dishes** | Nasi goreng, rendang, ayam goreng, sate, gado-gado, soto, bakso | Most common restaurant/home meals |
| **Snacks** | Gorengan, kerupuk, martabak, pisang goreng, klepon | High-calorie, frequently consumed |
| **Beverages** | Teh manis, kopi susu, es jeruk, jus alpukat, teh tawar | Liquid calories often untracked |
| **Fruits** | Pisang, mangga, pepaya, jeruk, semangka, durian | Common, healthy options |
| **Proteins** | Telur, tempe, tahu, ikan, ayam, daging sapi | Core macro sources |

### Database Schema Considerations

- Store `per_100g` values as the canonical unit (aligns with TKPI standard)
- Allow user-defined serving sizes (e.g., "1 porsi nasi goreng" = ~350g)
- Include both Indonesian and English names for search flexibility
- Tag foods by category (staple, main dish, snack, beverage, fruit, protein)
- Schema should support future macro/micronutrient columns even if not displayed in v1

## Sources

- MyFitnessPal vs Cronometer vs Lose It comparisons (Nutrola, 2026-04-12) — calorie tracker feature analysis
- Welling.ai "Calories Tracking Apps" (2026-04-17) — tracking accuracy factors
- Forbes Health "Best Workout And Fitness Apps Of 2026" (2025-12-29) — fitness app landscape
- FAO/INFOODS Indonesia food composition tables — official Indonesian food data sources
- Kaggle Indonesian Food & Drink Nutrition Dataset (1,346 items) — seed database candidate
- MiniWebTool TDEE Calculator — industry-standard calculator UX patterns
- Pearson Calorie & Deficit Calculator — Mifflin-St Jeor equation implementation reference
- Edamam Nutrition API documentation — food database API options
- FatSecret Platform API — global food nutrition database (58 countries)
- Open Food Facts API — open-source food database alternative
- USDA FoodData Central API — public domain nutrient data
- Adsum Software "Cost to Build AI Fitness App" (2025-10-02) — fitness app development patterns
- Scientific Reports "Personalized fitness recommendations using ML" (2025-11-24) — recommendation engine approaches
