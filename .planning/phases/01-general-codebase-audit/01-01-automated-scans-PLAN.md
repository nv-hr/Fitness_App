---
phase: 01-general-codebase-audit
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [audit-report-scans.json]
autonomous: true
requirements: [AUDIT-01]
must_haves:
  truths:
    - "Dependency vulnerabilities are identified across frontend and backend"
    - "Hardcoded secrets are identified and redacted"
  artifacts:
    - path: "audit-report-scans.json"
      provides: "Scans report"
  key_links: []
---

<objective>
Run automated dependency scans and grep for hardcoded secrets, then output findings.
Purpose: Identify low-hanging fruit and critical vulnerabilities early.
Output: audit-report-scans.json
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
  <name>Task 1: Run Dependency Scans</name>
  <files>audit-report-scans.json</files>
  <action>Run `npm audit --json` in both `frontend/` and `backend/`. Parse the output and add any High/Critical CVEs as structured findings to `audit-report-scans.json` (per D-11). If 0 vulnerabilities, output an empty array or a single "Passed" finding.</action>
  <verify>
    <automated>test -f audit-report-scans.json</automated>
  </verify>
  <done>Scans completed and documented in JSON.</done>
</task>

<task type="auto">
  <name>Task 2: Scan for Hardcoded Secrets</name>
  <files>audit-report-scans.json</files>
  <action>Grep the codebase for exposed API keys or JWT secrets (e.g. `secret123`, `AIzaSy`). Append findings to `audit-report-scans.json` with severity "Critical" (per D-10). If any are found, immediately redact them from the source code by replacing them with `process.env.VAR_NAME`.</action>
  <verify>
    <automated>test -f audit-report-scans.json</automated>
  </verify>
  <done>Secrets scanned, redacted if necessary, and logged.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| Tooling | npm audit fetching from remote registries |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Info Disclosure | Hardcoded Secrets | mitigate | Redact immediately upon discovery (Task 2) |
</threat_model>

<verification>
Check `audit-report-scans.json` for proper structure and verify no plaintext secrets remain.
</verification>

<success_criteria>
`audit-report-scans.json` is created with valid findings or empty array.
</success_criteria>

<output>
Create `.planning/phases/01-general-codebase-audit/01-01-SUMMARY.md` when done
</output>
