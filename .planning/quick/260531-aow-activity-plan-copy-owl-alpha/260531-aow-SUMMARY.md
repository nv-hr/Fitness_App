---
quick_id: 260531-aow
tags: llm, activity-plan, clipboard, config
subsystem: backend-llm, frontend-activity-plan
completed_at: '2026-05-31'
duration_min: 5
tasks:
  total: 2
  completed: 2
commits:
  - c07008d: feat(260531-aow): change LLM model to openrouter/owl-alpha with no fallbacks
  - ff3027a: feat(260531-aow): add Copy Plan button to ActivityPlanSection
deviations: []
---

# Quick Task 260531-aow: Activity Plan Copy + Owl Alpha Model Change

**One-liner:** Switched LLM model to OpenRouter's Owl Alpha exclusively and added a Copy Plan button to the activity plan UI.

## Task Results

### Task 1: Change LLM model to Owl Alpha (only model, no fallbacks) ✅

**Files modified:**
- `backend/.env` — `LLM_MODEL=openrouter/owl-alpha`, fallbacks commented out
- `backend/.env.example` — same changes as .env
- `backend/src/services/llm.service.js` — CONFIG defaults: model→`'openrouter/owl-alpha'`, fallbacks→`''` (empty string). Startup log now shows `(fallbacks: none)`

**Verification:** All 42 existing LLM service unit tests pass. The `callLlmApi` function's `if (!model) continue;` check at line 134 already skips empty string models, so fallbacks with empty defaults are correctly bypassed.

### Task 2: Add Copy Plan button to Activity Plan Section ✅

**Files modified:**
- `frontend/src/features/activities/components/ActivityPlanSection.jsx`

**Changes:**
- Added `copied` state for 2-second visual feedback
- Added `handleCopyPlan` handler that formats the plan as plain text and copies to clipboard
- Added "Copy Plan" button next to "Regenerate" in the header area
- Button background turns green (`#f0fdf4`) with green text (`#16a34a`) showing "Copied ✓" for 2 seconds
- Uses `navigator.clipboard.writeText()` with `document.execCommand('copy')` fallback
- No external dependencies added

**Copied text format:**
```
Today's Activity Plan
==============================
Generated 5 min ago

1. Walking — 30min light ~120 cal [Pending]
2. Cycling — 45min moderate ~315 cal [Pending]
3. Swimming — 20min vigorous ~200 cal [Logged]

Source: Fitness App
```

## Success Criteria

- [x] `.env` sets `LLM_MODEL=openrouter/owl-alpha` with fallbacks cleared
- [x] `.env.example` matches the same model config
- [x] `llm.service.js` CONFIG defaults to `openrouter/owl-alpha` with fallbacks as empty strings
- [x] All LLM service tests pass (42/42)
- [x] ActivityPlanSection has a working "Copy Plan" button
- [x] Copied text includes activity name, duration, intensity, calories_burned, and log status
- [x] Button shows "Copied ✓" feedback for 2 seconds (green highlight)

## Log
- 2026-05-31T??:??:??Z — Start Task 1: LLM model change
- 2026-05-31T??:??:??Z — Task 1 verified + committed (c07008d)
- 2026-05-31T??:??:??Z — Start Task 2: Copy Plan button
- 2026-05-31T??:??:??Z — Task 2 verified + committed (ff3027a)
- 2026-05-31T??:??:??Z — SUMMARY created
