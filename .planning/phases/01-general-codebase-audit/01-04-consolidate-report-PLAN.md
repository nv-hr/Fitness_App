---
phase: 01-general-codebase-audit
plan: 04
type: execute
wave: 2
depends_on: [01-01, 01-02, 01-03]
files_modified: [audit-report.json]
autonomous: true
requirements: [AUDIT-01, AUDIT-02, AUDIT-03]
must_haves:
  truths:
    - "A unified structured JSON report exists"
    - "All findings from previous plans are consolidated"
  artifacts:
    - path: "audit-report.json"
      provides: "Final consolidated audit report"
  key_links: []
---

<objective>
Consolidate the intermediate JSON reports into the final `audit-report.json`.
Purpose: Fulfill the final JSON reporting requirement (D-05).
Output: audit-report.json
</objective>

<execution_context>
@~/.gemini/antigravity/gsd-core/workflows/execute-plan.md
@~/.gemini/antigravity/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-general-codebase-audit/01-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Consolidate JSON Reports</name>
  <files>audit-report.json</files>
  <action>Read `audit-report-scans.json`, `audit-report-security.json`, and `audit-report-performance.json`. Merge all arrays of findings into a single JSON array and write it to `audit-report.json` (D-05). Ensure the final JSON is valid and formatted.</action>
  <verify>
    <automated>node -e "require('./audit-report.json')"</automated>
  </verify>
  <done>Final unified report is generated.</done>
</task>

<task type="auto">
  <name>Task 2: Cleanup Intermediate Reports</name>
  <files>audit-report-scans.json, audit-report-security.json, audit-report-performance.json</files>
  <action>Delete the intermediate JSON files (`audit-report-scans.json`, `audit-report-security.json`, `audit-report-performance.json`) to leave a clean directory with only `audit-report.json`.</action>
  <verify>
    <automated>test ! -f audit-report-scans.json</automated>
  </verify>
  <done>Intermediate files removed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| File I/O | Merging JSON files locally |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-04 | Tampering | Final Report | accept | Handled purely locally |
</threat_model>

<verification>
Ensure `audit-report.json` is a valid JSON file and contains findings from all previous steps.
</verification>

<success_criteria>
`audit-report.json` created and intermediate files removed.
</success_criteria>

<output>
Create `.planning/phases/01-general-codebase-audit/01-04-SUMMARY.md` when done
</output>
