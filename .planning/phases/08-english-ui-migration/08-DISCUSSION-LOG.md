# Phase 08: English UI Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 08-English UI Migration
**Areas discussed:** Translation Approach, Database meal_type Migration, Unit Convention, Backend Error Messages

---

## Translation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| In-place replacement | Replace all Indonesian values in translations.js with English. No language switching, no new dependencies. | ✓ |
| Add i18n framework | Add i18next or react-intl with language files. Enables future language switching. | |
| Dual-language with toggle | Keep translations.js structure but add English as second language with toggle. | |

**User's choice:** In-place replacement — simplest approach, English-only app

---

## Database meal_type Migration

| Option | Description | Selected |
|--------|-------------|----------|
| ALTER ENUM + UPDATE existing rows | ALTER TABLE to change ENUM, UPDATE existing rows to map Indonesian → English. Preserves historical data. | ✓ |
| App-level mapping only | Keep ENUM as-is, add application-level mapping layer. No DB changes. | |
| TRUNCATE + reseed | TRUNCATE food_logs table and reseed. Loses all historical data. | |

**User's choice:** ALTER ENUM + UPDATE existing rows — preserves all historical logging data

---

## Unit Convention

| Option | Description | Selected |
|--------|-------------|----------|
| Switch to 'kcal' | Use international standard abbreviation for kilocalories. Consistent with English UI. | ✓ |
| Keep 'kkal' | Keep Indonesian abbreviation. Users may be familiar with it. | |

**User's choice:** Switch to 'kcal' — international standard

---

## Backend Error Messages

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode English | Replace Indonesian strings with English directly in controller/service files. | ✓ |
| Add backend i18n layer | Add translations module to backend similar to frontend. | |

**User's choice:** Hardcode English — consistent with frontend approach, no new dependencies

---

## Agent's Discretion

- Exact English wording for each translation key — planner maps Indonesian → English consistently
- Migration script structure (inline SQL in init.sql vs separate migration file) — planner decides based on project convention
- Whether to update init.sql seed file to use English meal_type values for any test data

## Deferred Ideas

None — discussion stayed within phase scope
