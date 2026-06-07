# Phase 2 Plan: Polish & Verification

## Objective
Verify existing features work smoothly with the new goal form.
Requirement: REQ-02: Ensure goal setting data integrates with LLM planning.

## Architecture Impact
- **Backend Prompts**: The LLM prompts for generating weekly activity plans and daily meal plans need to be updated to consume the `targetWeightKg` and `targetDate` fields from the user's profile.
- **Backend Services**: `llm.service.js` and `dailyMealPlan.service.js` must pass the target settings into the context when calling the LLM API.

## Implementation Steps

### 1. Update Prompt Templates
- **File**: `backend/prompts/weekly-plan-prompt.md`
- **File**: `backend/prompts/daily-meal-plan-prompt.md`
- **Action**: Add `- Target Weight: {{targetWeightKg}} kg` and `- Target Date: {{targetDate}}` under the `# User Profile` section.

### 2. Inject Goal Settings into Prompts
- **File**: `backend/src/services/llm.service.js`
- **Action**: Modify `buildSystemPrompt` to pass `targetWeightKg: String(profile.target_weight_kg || '')` and `targetDate: String(profile.target_date || '')` to `buildPrompt`.
- **File**: `backend/src/services/dailyMealPlan.service.js`
- **Action**: Modify `buildDailyMealPlanPrompt` to pass `targetWeightKg` and `targetDate` from the user profile.

### 3. Verification
- Use Heroku CLI or local server to verify that the LLM generates plans appropriately considering the target settings.

## State Management
- **ROADMAP.md**: Update Phase 2 status to 🏗️ In Progress.
- **STATE.md**: Set `currentPhase` to 2.
