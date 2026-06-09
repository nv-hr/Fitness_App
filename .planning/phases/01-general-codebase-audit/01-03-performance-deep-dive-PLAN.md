---
phase: 01-general-codebase-audit
plan: 03
type: execute
wave: 1
depends_on: []
files_modified: [audit-report-performance.json]
autonomous: true
requirements: [AUDIT-03]
must_haves:
  truths:
    - "Database performance bottlenecks are identified"
    - "Dependency replacements are suggested where applicable"
  artifacts:
    - path: "audit-report-performance.json"
      provides: "Performance findings report"
  key_links: []
---

<objective>
Analyze the codebase for database performance bottlenecks and audit dependency usage.
Purpose: Identify N+1 queries and inefficient dependencies.
Output: audit-report-performance.json
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
  <name>Task 1: Audit Database Performance</name>
  <files>backend/src/controllers/*.js, backend/src/services/*.js, audit-report-performance.json</files>
  <action>Analyze backend code for database query efficiency, specifically focusing on N+1 query issues in loops or repeated service calls (D-02). Output findings in structured JSON (D-05), categorized by severity (D-06), with actionable fixes (D-07) and confidence scores (D-08).</action>
  <verify>
    <automated>test -f audit-report-performance.json</automated>
  </verify>
  <done>Performance findings recorded.</done>
</task>

<task type="auto">
  <name>Task 2: Dependency Usage Deep Review</name>
  <files>backend/package.json, frontend/package.json, audit-report-performance.json</files>
  <action>Perform a deep review of dependency usage and potential replacements across both frontend and backend (D-03). E.g. Identify bloated packages that can be replaced with native APIs or lighter alternatives. Append findings to the JSON report.</action>
  <verify>
    <automated>test -f audit-report-performance.json</automated>
  </verify>
  <done>Dependency usage findings recorded.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| Internal | Code architecture affecting performance |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-03 | Denial of Service | DB Queries | mitigate | Fix N+1 queries to prevent performance exhaustion |
</threat_model>

<verification>
Check `audit-report-performance.json` for proper structure and actionable fixes.
</verification>

<success_criteria>
Performance and dependency report generated.
</success_criteria>

<output>
Create `.planning/phases/01-general-codebase-audit/01-03-SUMMARY.md` when done
</output>
