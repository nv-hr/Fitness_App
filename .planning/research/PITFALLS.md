# Domain Pitfalls: Fitness/Health Tracking Web App

**Domain:** Fitness & health tracking (BMI, TDEE, calorie logging, food database)
**Target market:** Indonesian users
**Researched:** 2026-05-17

---

## Critical Pitfalls

Mistakes that cause rewrites, regulatory exposure, or user abandonment.

### Pitfall 1: Treating TDEE as Precise Instead of an Estimate

**What goes wrong:** Presenting TDEE results as exact numbers (e.g., "Your TDEE is 2,173 calories") gives users false confidence. TDEE formulas (Mifflin-St Jeor, Harris-Benedict) are population-level estimates with individual error margins of +/- 200-500 calories. Research from the International Journal of Obesity found people overestimate their physical activity by an average of 51%, making the activity multiplier the single biggest source of error.

**Why it happens:** Developers copy formulas from calculators without understanding the statistical uncertainty. UI design encourages precision (exact numbers feel more "professional").

**Consequences:**
- Users follow calorie targets that don't match their actual metabolism
- When results don't match expectations, users blame the app and abandon it
- Potential harm if users with eating disorders take the number as authoritative

**Prevention:**
- Display TDEE as a range (e.g., "2,000-2,400 calories/day")
- Add explicit disclaimer: "This is an estimate. Track your weight for 2-3 weeks and adjust based on real results."
- Show all activity levels side-by-side so users can self-calibrate
- Use Mifflin-St Jeor as default (most accurate for general population per Academy of Nutrition and Dietetics)
- Offer Katch-McArdle as an option if body fat % is known

**Detection:** Users complain "the numbers are wrong" or "I'm not losing weight at my TDEE."

**Phase to address:** Phase — BMI & TDEE Calculators

---

### Pitfall 2: Unverified or Inaccurate Food Database Entries

**What goes wrong:** A food database with wrong calorie values undermines the entire app. MyFitnessPal's database of 14+ million items is notorious for unverified user submissions — studies show database errors can skew calorie counts by 10-30%. A single wrong entry (e.g., "Nasi Goreng" listed at 150 cal instead of 400 cal) destroys user trust.

**Why it happens:** Developers seed databases from unreliable sources (scraped data, unverified user contributions, outdated nutrition tables) without validation. For Indonesian foods, this is amplified because most global databases (USDA, Edamam) have poor coverage of local dishes.

**Consequences:**
- Users systematically under- or over-report calorie intake
- Research shows users already underestimate intake by up to 47% — bad data makes this worse
- Once users discover one wrong entry, they distrust all entries
- Custom foods with no validation multiply the problem

**Prevention:**
- Seed the database from authoritative sources: USDA FoodData Central (free, 400K+ items) combined with Indonesian-specific datasets (e.g., the Kaggle Indonesian Food & Drink Nutrition Dataset with 1,346 items covering local foods)
- Mark every entry with its source (e.g., "Source: USDA", "Source: Komposisi Pangan Indonesia")
- Implement a verification flag system — user-submitted custom foods are marked "unverified"
- For the pre-seeded Indonesian food database, cross-reference with Indonesian Ministry of Health nutrition tables (Tabel Komposisi Pangan Indonesia / TKPI)
- Allow users to flag incorrect entries for review

**Detection:** Search for a known food and compare against published nutrition labels or authoritative databases. Check if custom foods have wildly different values for the same item.

**Phase to address:** Phase — Food Database & Calorie Logging

---

### Pitfall 3: High Friction Food Logging Drives Abandonment

**What goes wrong:** 80% of fitness app users abandon within 3 months. The #1 reason: logging food becomes tedious. Manual entry of every ingredient in a homemade meal (e.g., a stir-fry with oil, vegetables, protein, sauces entered individually) takes 5-10 minutes per meal. Users quit within 2-8 weeks.

**Why it happens:** Developers design for completeness (log every ingredient) rather than speed. Search interfaces return hundreds of conflicting results for common foods, causing decision fatigue. No quick-add or recent-favorites features.

**Consequences:**
- Users stop logging entirely after the initial enthusiasm period
- App becomes a "guilt machine" — users feel bad about not logging
- The calorie balance feature becomes useless without consistent data

**Prevention:**
- Implement quick-add: "Add 300 cal" in one tap for users who just want a rough estimate
- Show recent foods and favorites at the top of search
- Limit search results to the most relevant 5-10 items (not hundreds)
- Support meal templates: save "Breakfast" as a group of foods to log in one tap
- For v1 (calories only), keep the interface minimal — food name + calorie number, nothing more
- Add a "custom food" shortcut that doesn't require navigating away from the logging screen

**Detection:** Track time-to-log-a-meal metric. If average logging time exceeds 60 seconds per meal, friction is too high. Monitor day-7 and day-30 retention rates.

**Phase to address:** Phase — Food Database & Calorie Logging

---

### Pitfall 4: Ignoring Indonesia's PDP Law for Health Data

**What goes wrong:** Indonesia's Personal Data Protection Law (Law No. 27 of 2022, fully effective October 2024) classifies health data as **sensitive personal data** requiring explicit consent, stronger safeguards, and specific processing purposes. Health data under the PDP Law includes body weight, height, BMI category, calorie intake, and activity level — everything this app collects. The law is GDPR-inspired with penalties up to 6% of annual revenue.

**Why it happens:** Developers assume health apps are exempt from data protection laws (they're not), or that Indonesian law doesn't apply to small apps (it does — applies to all entities processing Indonesian citizens' data). Many also assume HIPAA applies (it doesn't — that's US-only).

**Consequences:**
- Legal liability for processing sensitive health data without proper consent
- Data breach exposure: weight, BMI, and eating patterns are sensitive information
- Cross-border data transfer restrictions if using cloud providers outside Indonesia
- Users lose trust if they discover their health data isn't protected

**Prevention:**
- Obtain explicit consent for processing health data during onboarding (separate from general terms of service)
- Encrypt health data at rest (AES-256 in MySQL) and in transit (HTTPS/TLS)
- Implement data minimization: only collect what's needed (weight, height, age, gender, food logs — nothing more)
- Provide data export and deletion capabilities (PDP Law grants data subjects the right to access and delete their data)
- Hash passwords using bcrypt (not MD5/SHA1) — the project spec mentions `crypto module` which should be used for hashing, not encryption
- Store JWT tokens securely (httpOnly cookies, not localStorage)
- Write a privacy policy in Bahasa Indonesia explaining what data is collected and why
- If using Docker with external cloud providers, verify data residency considerations

**Detection:** Audit: can you answer "what health data do we store, where, and who can access it?" If not, you're at risk.

**Phase to address:** Phase — Authentication & User Management (consent + data handling) and all subsequent phases

---

### Pitfall 5: BMI Presented Without Context or Limitations

**What goes wrong:** Displaying BMI category (underweight/normal/overweight/obese) as a definitive health assessment is misleading. BMI doesn't distinguish between muscle mass and fat mass, doesn't account for fat distribution, and has known limitations for athletes, elderly, and certain ethnic groups. For Southeast Asian populations, WHO recommends lower BMI cutoffs for overweight (>=23) and obese (>=25) categories compared to global standards (>=25 and >=30).

**Why it happens:** Developers use the standard WHO global cutoffs without considering regional variations. The UI presents BMI as a diagnosis rather than a screening tool.

**Consequences:**
- Muscular users get classified as "overweight" and feel discouraged
- Southeast Asian users with "normal" global BMI may actually be at health risk (higher body fat at lower BMI)
- Users with eating disorders may fixate on the number
- App appears unprofessional to informed users

**Prevention:**
- Use WHO Asian-Pacific cutoffs for Indonesian users:
  - Underweight: < 18.5
  - Normal: 18.5 - 22.9
  - Overweight: 23.0 - 24.9
  - Obese I: 25.0 - 29.9
  - Obese II: >= 30.0
- Add context: "BMI is a screening tool, not a diagnosis. It doesn't measure body fat directly."
- Never use stigmatizing language — use neutral category names
- If possible, allow users to see both global and Asian-Pacific classifications
- Include a brief explanation of what BMI measures and what it doesn't

**Detection:** Review the BMI result screen — does it look like a medical diagnosis or an informative estimate?

**Phase to address:** Phase — BMI & TDEE Calculators

---

## Moderate Pitfalls

### Pitfall 6: No Calorie Deficit Safety Warnings

**What goes wrong:** Allowing users to set arbitrary calorie targets without warnings enables dangerous behavior. A TDEE of 2,000 cal with a target of 800 cal is a 1,200-calorie deficit — potentially harmful.

**Prevention:** Flag deficits exceeding 35% of TDEE with a warning. Never recommend below 1,200 cal/day for women or 1,500 cal/day for men without a medical disclaimer.

**Phase to address:** Phase — Calorie Balance Dashboard

---

### Pitfall 7: JWT Stored in localStorage (XSS Vulnerability)

**What goes wrong:** The project spec mentions JWT for session persistence. Storing JWT in localStorage makes it accessible to any JavaScript running on the page — including malicious scripts from XSS attacks. An attacker who injects script can steal the token and impersonate the user.

**Prevention:** Store JWT in httpOnly, secure cookies instead of localStorage. This prevents JavaScript access. Set SameSite=Strict or Lax to prevent CSRF. Use short-lived access tokens with refresh tokens.

**Phase to address:** Phase — Authentication & User Management

---

### Pitfall 8: Password Hashing with Weak Algorithms

**What goes wrong:** The project spec mentions using Node.js `crypto` module for auth. Using MD5, SHA1, or even plain SHA256 for password hashing is insecure — these are fast hashes vulnerable to brute-force and rainbow table attacks.

**Prevention:** Use `crypto.scrypt()` or `crypto.pbkdf2()` from the Node.js crypto module with appropriate parameters (scrypt: N=16384, r=8, p=1; pbkdf2: 100,000+ iterations with SHA-256). Better yet, use bcrypt via the `bcrypt` npm package.

**Phase to address:** Phase — Authentication & User Management

---

### Pitfall 9: Food Database Search Returns Duplicates and Conflicts

**What goes wrong:** When a user searches "nasi goreng," they get 15 different entries with calorie values ranging from 200 to 600. This causes decision fatigue and undermines trust. This is the #1 complaint about MyFitnessPal's search experience.

**Prevention:**
- Deduplicate entries: keep only the best-sourced version of each food
- Group similar items (e.g., "Nasi Goreng" as one entry with a representative value)
- Sort results by relevance and data quality (verified sources first)
- Show the source for each entry so users can judge reliability
- For v1, limit the database to ~200-300 well-curated Indonesian foods rather than thousands of unverified entries

**Phase to address:** Phase — Food Database & Calorie Logging

---

### Pitfall 10: No Offline or Degraded Mode

**What goes wrong:** Users want to log meals on the go, often in areas with poor connectivity (restaurants, gyms, commuting). If the app requires a server round-trip for every action, it becomes unusable offline.

**Prevention:** For v1, at minimum cache the food database locally (IndexedDB) so search works offline. Queue food log entries locally and sync when connectivity returns.

**Phase to address:** Phase — Food Database & Calorie Logging (can be deferred to v2 if scope is tight)

---

## Minor Pitfalls

### Pitfall 11: Unit Confusion (Metric vs Imperial)

**What goes wrong:** Indonesian users expect metric (kg, cm), but if the app accidentally uses imperial units or mixes them, BMI and TDEE calculations will be wildly wrong.

**Prevention:** Default to metric units for Indonesian users. Clearly label all input fields with units. Validate input ranges (e.g., weight 20-300 kg, height 50-250 cm) to catch unit errors early.

**Phase to address:** Phase — BMI & TDEE Calculators

---

### Pitfall 12: Activity Level Labels Are Misleading

**What goes wrong:** Users consistently overestimate their activity level. "Moderately active" to one person means 3 gym sessions per week; to another it means walking to the warung. The activity multiplier directly determines TDEE, so this choice has outsized impact.

**Prevention:** Use concrete descriptions instead of vague labels:
- "Sedentary" -> "Kantor, jarang olahraga" (desk job, rarely exercises)
- "Light" -> "Olahraga ringan 1-3 hari/minggu"
- "Moderate" -> "Olahraga 3-5 hari/minggu"
- "Active" -> "Olahraga berat 6-7 hari/minggu"
- "Very Active" -> "Olahraga sangat berat setiap hari"

Show the multiplier value (1.2, 1.375, 1.55, 1.725, 1.9) so users understand the impact.

**Phase to address:** Phase — BMI & TDEE Calculators

---

### Pitfall 13: Randomized Activity Recommendations Feel Irrelevant

**What goes wrong:** If activity recommendations are truly random, users will get suggestions that don't match their fitness level, goals, or available equipment. This feels like the app doesn't "understand" them.

**Prevention:** Use rule-based filtering (not pure random):
- Filter by user's stated goal (lose weight, maintain, gain)
- Filter by activity level (don't suggest advanced workouts to sedentary users)
- Rotate through a curated pool of 20-30 activities so it feels varied but relevant
- Label them as "suggestions" not "personalized recommendations"

**Phase to address:** Phase — Activity Recommendations

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Authentication & User Registration | Weak password hashing, JWT in localStorage, no PDP consent | Use bcrypt/scrypt, httpOnly cookies, explicit health data consent |
| BMI & TDEE Calculators | Presenting estimates as precise numbers, wrong BMI cutoffs for Asian population | Show ranges, use Asian-Pacific cutoffs, add disclaimers |
| Food Database & Calorie Logging | Inaccurate entries, high friction logging, search duplicates | Curate from authoritative sources, quick-add feature, deduplicate |
| Calorie Balance Dashboard | No safety warnings for extreme deficits | Flag deficits >35% of TDEE, minimum calorie floors |
| Activity Recommendations | Irrelevant random suggestions | Rule-based filtering by goal and activity level |
| All Phases | Indonesia PDP Law non-compliance | Explicit consent, encryption, data minimization, privacy policy in Bahasa Indonesia |

---

## Sources

- **TDEE accuracy:** Legion Athletics TDEE Calculator (legionathletics.com/tdee-calculator), Kalo Health TDEE Guide (getkalohealth.com/blog/how-to-calculate-tdee) — research showing 51% activity overestimation from International Journal of Obesity
- **BMI Asian cutoffs:** WHO Expert Consultation on BMI for Asian populations (2004)
- **Food database accuracy:** Nutrient Metrics AI Calorie Tracking Audit (nutrientmetrics.com/en/guides/ai-calorie-tracking-common-mistakes-audit, 2026-04-24) — 10-30% database error variance
- **Calorie tracking abandonment:** YOMP Blog (yomp.fit/blog/why-calorie-tracking-apps-dont-work, 2024-12-15) — 80% abandonment within 3 months
- **Food logging accuracy study:** PubMed research on MyFitnessPal naturalistic use (2018) — 18% food item omission, 20% would continue use
- **Fitness app retention:** ProductGrowth.in (productgrowth.in/insights/healthtech/fitness-app-retention, 2025-11) — streak mechanics, social accountability, motivation decay curve
- **Calorie counting app retention:** Welling.ai (welling.ai/articles/stop-giving-up-calorie-counting-apps, 2026-05-06) — 23% consistent logging after 3 months, decision fatigue from search results
- **Indonesia PDP Law:** ICLG Data Protection Indonesia 2025-2026 (iclg.com/practice-areas/data-protection-laws-and-regulations/indonesia), Fortra PDP Guide (fortra.com/blog/navigating-indonesias-personal-data-protection-law, 2024-09-16), CookieChimp PDP Guide (cookiechimp.com/guides/regulations/id_pdp, 2026-05-15)
- **Indonesian food dataset:** Kaggle Indonesian Food & Drink Nutrition Dataset (kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset) — 1,346 items
- **USDA FoodData Central:** fdc.nal.usda.gov — free, 400K+ food items
- **FTC Health App Best Practices:** ftc.gov/business-guidance/resources/mobile-health-app-developers-ftc-best-practices
- **HIPAA compliance lessons (applicable principles):** Digital Scientists (digitalscientists.com/blog/why-most-healthcare-apps-fail-hipaa-compliance, 2026-02-03) — PHI misunderstanding, logging/analytics exposure
