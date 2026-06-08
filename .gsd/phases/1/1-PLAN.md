---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Structural & Dead Code Analysis

## Objective
Run analysis tools (madge, knip, cloc) on the backend to identify circular dependencies, dead code, and complex files. Synthesize the findings into an actionable refactoring guide for Phase 2. Note: Do NOT delete old tests, per decisions.

## Context
- .gsd/ROADMAP.md
- .gsd/DECISIONS.md
- .gsd/phases/1/RESEARCH.md
- backend/

## Tasks

<task type="auto">
  <name>Run Dependency & Complexity Analysis</name>
  <files>
    - backend/package.json
  </files>
  <action>
    1. Navigate to the backend directory.
    2. Run `npx madge --circular --orphans src > ../.gsd/phases/1/madge-report.txt`.
    3. Run `npx cloc src > ../.gsd/phases/1/cloc-report.txt`.
    4. Note: Do not modify source code.
  </action>
  <verify>Get-Content ..\.gsd\phases\1\madge-report.txt -TotalCount 5</verify>
  <done>Madge and cloc reports are generated successfully.</done>
</task>

<task type="auto">
  <name>Run Dead Code Analysis</name>
  <files>
    - backend/package.json
  </files>
  <action>
    1. In the backend directory, run `npx knip > ../.gsd/phases/1/knip-report.txt` (accept installation if prompted).
    2. Review the output for dead code, unused exports, and unused dependencies.
    3. Note: Ignore any warnings related to the old `tests/` or `__tests__/` directory.
  </action>
  <verify>Get-Content ..\.gsd\phases\1\knip-report.txt -TotalCount 5</verify>
  <done>Knip report is generated successfully.</done>
</task>

<task type="auto">
  <name>Synthesize Refactoring Plan</name>
  <files>
    - .gsd/phases/1/REFACTORING_TARGETS.md
  </files>
  <action>
    Analyze the generated reports (madge, knip, cloc) and briefly inspect the largest files in `backend/src`.
    Create `.gsd/phases/1/REFACTORING_TARGETS.md` detailing:
    - Dead code to be removed (from Knip).
    - Files exceeding complexity thresholds or needing splitting.
    - Architectural violations (e.g., controllers with DB queries).
    - Circular dependencies to resolve.
    This document will be the input for Phase 2.
  </action>
  <verify>Test-Path ..\.gsd\phases\1\REFACTORING_TARGETS.md</verify>
  <done>REFACTORING_TARGETS.md is created and contains specific, actionable items for Phase 2.</done>
</task>

## Success Criteria
- [ ] Dependency report is generated.
- [ ] Complexity report is generated.
- [ ] Dead code report is generated.
- [ ] REFACTORING_TARGETS.md is created with specific action items.
