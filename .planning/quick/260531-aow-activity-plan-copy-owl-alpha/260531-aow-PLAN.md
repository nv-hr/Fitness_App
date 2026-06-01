---
quick_id: 260531-aow
description: Add copy-to-clipboard for activity plan UI page and change LLM model to Owl Alpha only
type: quick
autonomous: true
files_modified:
  - frontend/src/features/activities/components/ActivityPlanSection.jsx
  - backend/.env
  - backend/.env.example
  - backend/src/services/llm.service.js
---

# Quick Task: Activity Plan Copy + Owl Alpha Model Change

<objective>
**Purpose:** Make the activity plan portable from the UI (copy as text) and switch the LLM model exclusively to OpenRouter's Owl Alpha model (no fallbacks).

**Outputs:**
1. "Copy Plan" button in ActivityPlanSection that copies formatted plan text to clipboard
2. `.env` / `.env.example` updated to use `openrouter/owl-alpha` as the only model
3. `llm.service.js` CONFIG defaults changed so fallback models default to empty (skipped unless explicitly configured)
</objective>

<context>
@frontend/src/features/activities/components/ActivityPlanSection.jsx
@backend/.env
@backend/.env.example
@backend/src/services/llm.service.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Change LLM model to Owl Alpha (only model, no fallbacks)</name>
  <files>
    backend/.env
    backend/.env.example
    backend/src/services/llm.service.js
  </files>
  <action>
    === PART A: Update `backend/.env` ===

    Change the model lines:
    - Set `LLM_MODEL=openrouter/owl-alpha`
    - Comment out or remove `LLM_FALLBACK_MODEL` and `LLM_FALLBACK_MODEL_2` lines

    Final result:
    ```
    ## Primary model for weekly plan generation:
    LLM_MODEL=openrouter/owl-alpha
    ## Fallback models removed — using only Owl Alpha per user decision
    # LLM_FALLBACK_MODEL=
    # LLM_FALLBACK_MODEL_2=
    ```

    === PART B: Update `backend/.env.example` ===

    Same changes:
    ```
    ## Primary model for weekly plan generation (must be available on OpenRouter):
    LLM_MODEL=openrouter/owl-alpha
    ## Fallback models removed — using only Owl Alpha per user decision
    # LLM_FALLBACK_MODEL=
    # LLM_FALLBACK_MODEL_2=
    ```

    === PART C: Update `backend/src/services/llm.service.js` ===

    In the CONFIG object (lines 37-44), change the defaults so fallback models default to empty string instead of specific models:

    **Before:**
    ```js
    const CONFIG = {
      model: process.env.LLM_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
      fallbackModel: process.env.LLM_FALLBACK_MODEL || 'openai/gpt-oss-120b:free',
      fallbackModel2: process.env.LLM_FALLBACK_MODEL_2 || 'deepseek/deepseek-chat:free',
      temperature: 0.2,
      maxTokens: 2000,
      retryDelayMs: 1000,
    };
    ```

    **After:**
    ```js
    const CONFIG = {
      model: process.env.LLM_MODEL || 'openrouter/owl-alpha',
      fallbackModel: process.env.LLM_FALLBACK_MODEL || '',
      fallbackModel2: process.env.LLM_FALLBACK_MODEL_2 || '',
      temperature: 0.2,
      maxTokens: 2000,
      retryDelayMs: 1000,
    };
    ```

    Also update the startup log message on line 46 to reflect the change:
    **Before:**
    ```js
    console.log(`[LLM] Using model: ${CONFIG.model}. Verify this model is available on OpenRouter.`);
    ```

    **After:**
    ```js
    console.log(`[LLM] Using model: ${CONFIG.model} (fallbacks: ${CONFIG.fallbackModel ? 'enabled' : 'none'}). Verify this model is available on OpenRouter.`);
    ```

    **Why:** The `callLlmApi` function already checks `if (!model) continue;` when iterating through models (line 134). Empty string is falsy, so fallbacks with empty string default are skipped. This means Owl Alpha is the only model tried. If someone explicitly sets `LLM_FALLBACK_MODEL` in their env, fallbacks are re-enabled — preserving escape hatch without code changes.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const env=fs.readFileSync('backend/.env','utf8'); const ex=fs.readFileSync('backend/.env.example','utf8'); console.assert(env.includes('openrouter/owl-alpha'), '.env missing owl-alpha'); console.assert(ex.includes('openrouter/owl-alpha'), '.env.example missing owl-alpha'); console.assert(!env.includes('LLM_FALLBACK_MODEL=openai'), '.env still has old fallback'); console.assert(!ex.includes('LLM_FALLBACK_MODEL=openai'), '.env.example still has old fallback'); console.log('.env/.env.example OK');"</automated>
    <automated>node -e "const fs=require('fs'); const s=fs.readFileSync('backend/src/services/llm.service.js','utf8'); console.assert(s.includes(\"fallbackModel: process.env.LLM_FALLBACK_MODEL || ''\"), 'fallbackModel default not updated'); console.assert(s.includes(\"model: process.env.LLM_MODEL || 'openrouter/owl-alpha'\"), 'model default not updated'); console.assert(!s.includes(\"|| 'openai/gpt-oss-120b:free'\"), 'old fallback default still present'); console.assert(!s.includes(\"|| 'nvidia/nemotron-3-nano-30b-a3b:free'\"), 'old model default still present'); console.log('llm.service.js OK');"</automated>
    <automated>node -e "const p=require('child_process'); const r=p.execSync('npx jest backend/tests/unit/llm.service.test.js --no-coverage 2>&1',{encoding:'utf8',cwd:'backend'}); console.log(r.slice(-500)); if(r.includes('FAIL')) process.exit(1);"</automated>
  </verify>
  <done>
    - backend/.env: LLM_MODEL=openrouter/owl-alpha, fallbacks removed
    - backend/.env.example: same changes
    - backend/src/services/llm.service.js: CONFIG defaults updated (model→owl-alpha, fallbacks→empty string)
    - All existing LLM service tests still pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Add Copy Plan button to Activity Plan Section</name>
  <files>
    frontend/src/features/activities/components/ActivityPlanSection.jsx
  </files>
  <action>
    Add a "Copy Plan" button to `ActivityPlanSection.jsx` that copies the formatted activity plan as text to the clipboard.

    === Changes ===

    1. **Add import** (at the top, after existing imports):
    ```jsx
    import { useState, useEffect, useRef, useCallback } from 'react';
    import { getActivityPlan, generateActivityPlan, logActivities } from '../api/activityPlanApi.js';
    ```

    (No new import needed — Clipboard API is native `navigator.clipboard.writeText`)

    2. **Add `copied` state** (after the existing state declarations, around line 14):
    ```jsx
    const [copied, setCopied] = useState(false);
    ```

    3. **Add copy handler** (after `handleLogActivity`, before the render section):
    ```jsx
    const handleCopyPlan = () => {
      if (!plan || !plan.activities || plan.activities.length === 0) return;
      const lines = ['Today\'s Activity Plan', '='.repeat(30)];
      if (plan.generated_at) {
        const minsAgo = Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / 60000);
        lines.push(`Generated ${minsAgo} min ago`);
        lines.push('');
      }
      plan.activities.forEach((act, i) => {
        const status = act.logged ? '[Logged]' : '[Pending]';
        const calText = act.calories_burned > 0 ? ` ~${act.calories_burned} cal` : '';
        lines.push(`${i + 1}. ${act.name} — ${act.duration_min}min ${act.intensity}${calText} ${status}`);
      });
      lines.push('', `Source: Fitness App`);

      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback for older browsers — select text method
        const ta = document.createElement('textarea');
        ta.value = lines.join('\n');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
    ```

    4. **Add "Copy Plan" button** in the header area (after the "Regenerate" button). In the header `div` at line 118-127, add it after the `<h3>` and before the "Regenerate" button:

    **Before (lines 118-127):**
    ```jsx
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Today's Activity Plan</h3>
      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
      >
        {generating ? '...' : 'Regenerate'}
      </button>
    </div>
    ```

    **After:**
    ```jsx
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Today's Activity Plan</h3>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={handleCopyPlan}
          style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: copied ? '#f0fdf4' : '#fff', color: copied ? '#16a34a' : '#000', minHeight: '44px' }}
        >
          {copied ? 'Copied ✓' : 'Copy Plan'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
        >
          {generating ? '...' : 'Regenerate'}
        </button>
      </div>
    </div>
    ```

    **Important:**
    - Preserve ALL existing logic (auto-generation guard, loading states, retry-after, log functionality)
    - The `copied` state resets after 2 seconds
    - Use `navigator.clipboard.writeText()` with a `document.execCommand('copy')` fallback for compatibility
    - Do NOT add any external dependencies (no clipboard libraries)
    - Keep the existing inline styles consistent

    **Copied text format (example):**
    ```
    Today's Activity Plan
    ==============================
    Generated 5 min ago

    1. Walking — 30min light ~120 cal [Pending]
    2. Cycling — 45min moderate ~315 cal [Pending]
    3. Swimming — 20min vigorous ~200 cal [Pending]

    Source: Fitness App
    ```
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const c=fs.readFileSync('frontend/src/features/activities/components/ActivityPlanSection.jsx','utf8'); console.assert(c.includes('handleCopyPlan'), 'handleCopyPlan missing'); console.assert(c.includes('Copy Plan'), 'Copy Plan button missing'); console.assert(c.includes('navigator.clipboard'), 'clipboard API usage missing'); console.assert(c.includes('setCopied'), 'copied state missing'); console.log('ActivityPlanSection.jsx OK');"</automated>
  </verify>
  <done>
    - "Copy Plan" button renders in the activity plan header next to "Regenerate"
    - Clicking it copies formatted plan text (activity name, duration, intensity, calories, log status)
    - Button briefly shows "Copied ✓" in green for 2 seconds
    - Works with Clipboard API + fallback for older browsers
    - All existing functionality preserved (auto-gen, log, regenerate, loading/error states)
  </done>
</task>

</tasks>

<verification>
1. Task 1 verify: .env + .env.example use `openrouter/owl-alpha`, llm.service.js defaults updated
2. Task 1 verify: All existing `backend/tests/unit/llm.service.test.js` tests still pass
3. Task 2 verify: ActivityPlanSection.jsx has `handleCopyPlan` function and "Copy Plan" button
4. Task 2 manual: Open the Activities page, observe "Copy Plan" button next to "Regenerate", click it, verify clipboard content matches expected format, observe green "Copied ✓" state
</verification>

<success_criteria>
- [ ] `.env` sets `LLM_MODEL=openrouter/owl-alpha` with fallbacks cleared
- [ ] `.env.example` matches the same model config
- [ ] `llm.service.js` CONFIG defaults to `openrouter/owl-alpha` with fallbacks as empty strings
- [ ] All LLM service tests pass
- [ ] ActivityPlanSection has a working "Copy Plan" button
- [ ] Copied text includes activity name, duration, intensity, calories_burned, and log status
- [ ] Button shows "Copied ✓" feedback for 2 seconds
</success_criteria>

<output>
After completion, create `.planning/quick/260531-aow-activity-plan-copy-owl-alpha/260531-aow-SUMMARY.md`
</output>
