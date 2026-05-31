---
phase: quick
plan: 260531-mmv
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/scripts/test-llm-output.js
  - .planning/quick/260531-mmv-try-testing-the-llm-and-its-output-retor/260531-mmv-SUMMARY.md
autonomous: true
requirements: []
user_setup: []
must_haves:
  truths:
    - "LLM diagnostic script exists and runs without crashing"
    - "Script logs the FULL rendered prompt (with variable substitution) for both activity plan and meal plan"
    - "Script makes a real API call to OpenRouter and captures raw response"
    - "Script runs validation on the response and shows errors/warnings/fixes"
    - "Detailed findings are recorded in SUMMARY.md"
  artifacts:
    - path: "backend/scripts/test-llm-output.js"
      provides: "LLM diagnostic that shows full prompt, response, validation results"
      min_lines: 100
  key_links:
    - from: "backend/scripts/test-llm-output.js"
      to: "backend/src/services/llm.service.js"
      via: "imports buildPrompt, callLlmApi, validatePlanStructure, validateAndFixPlan, buildSystemPrompt"
    - from: "backend/scripts/test-llm-output.js"
      to: "backend/prompts/system-prompt.md"
      via: "reads prompt template and renders with sample data"
    - from: "backend/scripts/test-llm-output.js"
      to: "backend/prompts/daily-meal-plan-prompt.md"
      via: "reads prompt template and renders with sample data"
---

<objective>
Test the LLM (OpenRouter) end-to-end and return a detailed diagnostic of the prompt sent, the raw response received, and all validation/fix steps applied.

**Purpose:** The user wants to see exactly what the LLM is being asked (the full rendered prompt with all variables filled in) and exactly what comes back — including whether validation succeeds, how the name-fixing (fuzzy match) transforms the data, and any errors or warnings.

**Output:** `backend/scripts/test-llm-output.js` (diagnostic script) + `260531-mmv-SUMMARY.md` (findings report)
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/services/llm.service.js
@backend/src/services/dailyMealPlan.service.js
@backend/prompts/system-prompt.md
@backend/prompts/daily-meal-plan-prompt.md
@backend/prompts/correction-prompt.md
@backend/scripts/test-openrouter.js
@backend/src/utils/food.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create comprehensive LLM diagnostic script</name>
  <files>backend/scripts/test-llm-output.js</files>
  <action>
    Create `backend/scripts/test-llm-output.js` — a thorough LLM diagnostic that reveals the full prompt, response, and validation pipeline.

    **Structure:**

    ```
    ============================================================
    LLM DIAGNOSTIC — Full Prompt & Response Analysis
    ============================================================
    
    1. CONFIG
    2. ACTIVITY PLAN — Rendered Prompt
    3. ACTIVITY PLAN — API Response (raw)
    4. ACTIVITY PLAN — Validation Results
    5. ACTIVITY PLAN — Name Fixing Results
    6. MEAL PLAN — Rendered Prompt
    7. MEAL PLAN — API Response (raw)
    8. MEAL PLAN — Validation Results
    9. MEAL PLAN — Name Fixing Results
    10. SUMMARY
    ```

    **Detailed behavior:**

    ### Section 1: Config
    Show the exact LLM model, base URL, temperature, max tokens being used.

    ### Section 2: Activity Plan — Rendered Prompt
    Build the system prompt using `buildSystemPrompt()` with sample realistic data:
    
    - Profile: weight 75kg, height 180cm, age 28, gender 'male', fitness_goal 'lose weight', activity_level 'moderate'
    - Activity history (14 days): 10-12 varied entries including Walking, Running, Yoga, Cycling with varied durations and intensities
    - Available activities: 10+ with realistic calorie values (Walking 200cal/30min, Running 350cal/30min, Yoga 150cal/45min, Cycling 300cal/30min, Swimming 400cal/30min, Strength Training 250cal/30min, etc.)
    - weekStart: the Monday of the current week (computed dynamically)

    CRITICAL: Print the ENTIRE rendered prompt. Not truncated. Every section, every substitution.
    Use a clear ASCII header before printing: `===== ACTIVITY PLAN SYSTEM PROMPT (RENDERED) =====`.

    ### Section 3: Activity Plan — API Response
    Call `callLlmApi(prompt)` to make a real API call.
    Print the raw response content as received. Wrap it with:
    ```
    ===== ACTIVITY PLAN RAW RESPONSE =====
    {raw JSON or text}
    ===== END RAW RESPONSE =====
    ```
    Include the response model name if available.

    ### Section 4: Activity Plan — Validation
    Call `validatePlanStructure(parsed, weekStart)`.
    Print:
    ```
    ===== ACTIVITY PLAN VALIDATION =====
    Result: VALID / INVALID
    Errors found: [list each error]
    ```

    ### Section 5: Activity Plan — Name Fixing
    If validation passed, call `validateAndFixPlan(parsed, dbActivities)`.
    Show:
    ```
    ===== ACTIVITY PLAN NAME FIXING =====
    Result: VALID / INVALID
    Fixes applied: [list each fuzzy match with original → fixed]
    Warnings: [each unmatched or corrected]
    ```

    ### Section 6: Meal Plan — Rendered Prompt
    Build the meal plan prompt using the same approach but with `buildPrompt('daily-meal-plan-prompt.md', ...)`.
    
    - Same profile as above
    - Food database: 15+ realistic food items across categories (protein, carbs, vegetables, fruits, dairy) with calories_per_100g
    - Recent food logs: 5 days of realistic log entries
    - Calorie target: 2000
    - Plan date: current date

    Print the FULL rendered prompt:
    ```
    ===== MEAL PLAN SYSTEM PROMPT (RENDERED) =====
    ```

    ### Section 7: Meal Plan — API Response
    Call `callLlmApi(prompt)` to make a real API call.
    Print raw response:
    ```
    ===== MEAL PLAN RAW RESPONSE =====
    ```

    ### Section 8: Meal Plan — Validation  
    Call `validateDailyMealPlanStructure(parsed)` — import this from dailyMealPlan.service.js.

    ### Section 9: Meal Plan — Name Fixing
    Call `validateAndFixDailyMealPlan(parsed, dbFoods)` — import this from dailyMealPlan.service.js.

    ### Section 10: Summary
    Print a compact summary table:
    ```
    ============================================================
    SUMMARY
    ============================================================
    Activity Plan:
      Model used: {model name}
      Prompt size: {character count}
      Response size: {character count}
      Validation: PASS/FAIL
      Name fixes: {count}
      Errors: {list}
    
    Meal Plan:
      Model used: {model name}
      Prompt size: {character count}
      Response size: {character count}
      Validation: PASS/FAIL
      Name fixes: {count}
      Errors: {list}
    ```

    **Error handling:**
    - If an API call fails, catch the error and print `[LLM API ERROR] {status}: {message}` — do NOT crash the script; continue to the next section.
    - If the response is not valid JSON, print `[PARSE ERROR] Raw content was not valid JSON` followed by the raw content.
    - If validation fails, print all errors and continue.

    **Technical requirements:**
    - Use ES module imports (import syntax, not require)
    - Load dotenv from backend root: `dotenv.config({ path: path.resolve(__dirname, '../.env') })`
    - Exit code 0 always (this is a diagnostic, not a pass/fail test)
    - Use `console.log` for all output (no test runners)
    - Import from relative paths using `import` syntax with file extensions (.js)
    - Use `path.dirname(fileURLToPath(import.meta.url))` for __dirname equivalent
    - DO NOT import from src/services/llm.service.js for variables/constants that use env vars at module level (those may fail if .env not loaded). Instead inline or wrap dependencies.

    **Important:** For imports from `dailyMealPlan.service.js`, only import `validateDailyMealPlanStructure` and `validateAndFixDailyMealPlan` — do NOT import `generateDailyMealPlan` (that would execute the full generation including DB calls). We only want the prompt + API + validation flow.
  </action>
  <verify>
    <automated>cd backend && node scripts/test-llm-output.js 2&gt;&amp;1 | head -5</automated>
  </verify>
  <done>
    - Script runs without crashing
    - Shows activity plan section headers
    - Makes API calls with realistic sample data
  </done>
</task>

<task type="auto">
  <name>Task 2: Run diagnostic and document findings</name>
  <files>.planning/quick/260531-mmv-try-testing-the-llm-and-its-output-retor/260531-mmv-SUMMARY.md</files>
  <action>
    Execute the script:
    ```bash
    cd backend && node scripts/test-llm-output.js
    ```
    
    Capture ALL output. Write a comprehensive `260531-mmv-SUMMARY.md` with:

    1. **EXECUTION LOG** — The full stdout from the script (in a code block)
    2. **KEY FINDINGS** — Analyze and summarize:
       a. Prompt sizes (are they too large? too small?)
       b. Response quality (is the LLM following instructions? producing valid JSON?)
       c. Validation results (how many plans pass validation on first try?)
       d. Name fixing (how many fuzzy matches occur? what kinds?)
       e. Any errors or failures
    3. **DATA FLOW DIAGRAM** (ASCII):
       ```
       Profile/History → buildSystemPrompt() → Rendered Prompt → callLlmApi() → Raw Response → JSON Parse → validatePlanStructure() → validateAndFixPlan() → Cached Plan
       ```
    4. **RECOMMENDATIONS** — Any improvements suggested by the diagnostic

    If the script exits without making API calls (e.g., missing OPENROUTER_API_KEY), note this explicitly and mark as "API call not executed — missing env var".
    If API key is available but the call fails, include the error details.
  </action>
  <verify>
    <automated>Test-Path -LiteralPath "C:\Users\LENOVO\Documents\VsCode\GitHub\Fitness_App\.planning\quick\260531-mmv-try-testing-the-llm-and-its-output-retor\260531-mmv-SUMMARY.md"</automated>
  </verify>
  <done>
    - SUMMARY.md exists with full execution log and analysis
    - All sections documented: prompt, response, validation, fixes
    - Key findings and recommendations recorded
  </done>
</task>

</tasks>

<verification>
- [ ] Task 1: Script created at backend/scripts/test-llm-output.js
- [ ] Task 1: Script can be run with `node backend/scripts/test-llm-output.js`
- [ ] Task 2: Diagnostic executed, output captured
- [ ] Task 2: SUMMARY.md written with full log and analysis
</verification>

<success_criteria>
- Script produces a complete diagnostic of the LLM prompt → response → validation pipeline
- User can see exactly what the LLM receives (full rendered prompt) and what it returns (raw JSON)
- All validation and correction steps are documented
- Any issues in the pipeline are surfaced
</success_criteria>

<output>
After completion, create `.planning/quick/260531-mmv-try-testing-the-llm-and-its-output-retor/260531-mmv-SUMMARY.md`
</output>
