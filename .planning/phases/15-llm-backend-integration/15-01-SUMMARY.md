---
phase: 15-llm-backend-integration
plan: 01
subsystem: llm-backend
tags: [llm, openrouter, prompts]
key-files:
  created:
    - backend/src/services/llm.service.js
    - backend/prompts/system-prompt.md
    - backend/prompts/correction-prompt.md
  modified:
    - backend/.env.example
metrics:
  files_created: 3
  files_modified: 1
  exports: 4
---

## Summary

Created the LLM service foundation: OpenRouter client setup, prompt templates, and core `generateWeeklyPlan()` function.

### Key Decisions
- Used `nvidia/nemotron-nano-30b-a3b` as default model (D-01)
- Temperature 0.2 for deterministic JSON output (D-02)
- Dependency injection pattern for `generateWeeklyPlan` — testable without mocking DB
- Module-load API key validation (startup warning, not crash) (D-05)

### Deviations
None.

## Commits

| # | Description | Hash |
|---|-------------|------|
| 1 | Create prompt templates and env config | PENDING |
| 2 | Create llm.service.js with OpenRouter integration | PENDING |

## Self-Check: PASSED

- Module imports cleanly (4 exports verified)
- Prompt templates created with `{{variable}}` placeholders
- `.env.example` documents OPENROUTER_API_KEY
- All acceptance criteria met
