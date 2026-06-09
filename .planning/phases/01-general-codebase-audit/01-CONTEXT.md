# Phase 1: General Codebase Audit - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Perform a general codebase audit for performance bottlenecks, hidden bugs, logic errors, and security vulnerabilities across the entire codebase (frontend and backend).

</domain>

<decisions>
## Implementation Decisions

### Audit Scope & Focus
- **D-01:** Focus deeply on critical paths (Gemini AI integration, Auth) rather than a shallow broad sweep.
- **D-02:** When evaluating performance, focus on database query efficiency and N+1 issues.
- **D-03:** For dependencies, perform a deep review of dependency usage and potential replacements.
- **D-04:** For logic errors, review all business logic against requirements.

### Reporting Format
- **D-05:** Produce the final audit report as structured JSON items for programmatic tracking or automated issue creation.
- **D-06:** Categorize issues by severity (Critical, High, Medium, Low) for prioritization.
- **D-07:** Provide actionable code fixes for every issue identified.
- **D-08:** Include a 'Confidence Score' for each finding to handle false positives.

### Security Priorities
- **D-09:** Prioritize all types of security vulnerabilities (Authentication/Authorization flaws, Data exposure, Injection flaws).
- **D-10:** Flag exposed API keys or secrets as Critical and immediately redact them from code.
- **D-11:** Audit dependencies for known CVEs by running automated scans (e.g., npm audit) and reporting High/Critical CVEs.
- **D-12:** Investigate data validation issues by ensuring all API inputs are validated and sanitized.

### the agent's Discretion
None

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- The project enforces token efficiency and avoiding secrets in source control (as noted in CONCERNS.md).
- Both frontend and backend use isolated packages, requiring separate vulnerability scanning (e.g. `npm audit`).

### Integration Points
- Audit focuses heavily on Gemini API integrations centrally located in `backend/prompts/` and `backend/src/` as well as Auth flows.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-General Codebase Audit*
*Context gathered: 2026-06-09*
