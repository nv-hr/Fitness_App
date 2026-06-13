# Phase 1: general-codebase-audit - Research

**Researched:** 2026-06-09
**Domain:** Codebase Audit, Security, Performance
**Confidence:** HIGH

## User Constraints

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

## Summary

This phase requires executing a comprehensive audit across both frontend and backend systems, with deep focus on Auth (`src/controllers/auth.controller.js`, `src/config/passport.js`) and AI Integrations (`src/services/llm.service.js`). The output must not be code changes (except for immediate redacting of secrets), but rather a structured JSON report classifying issues by severity, alongside actionable code fixes and confidence scores.

**Primary recommendation:** Divide the plan into specific functional sweeps (e.g., Auth, LLM, Database, Dependency) to thoroughly audit each area, producing incremental JSON artifacts that consolidate into a final report.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication Audit | API / Backend | Browser / Client | Most security flaws occur in token validation (`passport.js`, JWTs) and session handling. |
| AI Integration Audit | API / Backend | — | The `llm.service.js` handles the OpenAI API mapping to Gemini. Prompt injection and token leaks occur here. |
| DB Performance | Database / Storage | API / Backend | N+1 queries manifest in controller/service layers using `pg` but resolve at the DB layer. |
| Dependency Audit | Environment | — | Vulnerabilities live in `package.json` (`npm audit` required for both frontend and backend). |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm audit | built-in | Dependency CVE checking | Meets D-11 requirement natively |
| eslint | v9+ | Static analysis | Detects unhandled promises and logic errors |

**Installation:**
No new installations required for the audit itself.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| eslint | npm | 10 yrs | 30M/wk | github.com/eslint/eslint | [OK] | Approved |

## Architecture Patterns

### Recommended Audit Workflow
1. **Dependency Scan:** Run `npm audit --json` in both `frontend/` and `backend/`. (Initial checks show 0 vulnerabilities currently, but the plan must include this verification).
2. **Secret Scan:** Grep for hardcoded tokens, API keys, or JWT secrets in source code. Redact immediately if found (D-10).
3. **Logic & Security Deep Dive:**
   - Audit `backend/src/services/llm.service.js` for prompt injection, token limits, and error handling.
   - Audit `backend/src/config/passport.js` and `auth.controller.js` for improper token validation or exposed PII.
4. **Performance Deep Dive:** Audit database repositories and controllers for loops executing `pg` queries (N+1).
5. **Report Generation:** Create `audit-report.json` with the required structure.

### Pattern 1: Structured JSON Finding
**What:** The format for reporting issues (D-05, D-06, D-07, D-08)
**When to use:** For every identified vulnerability, bottleneck, or logic error.
**Example:**
```json
{
  "id": "AUDIT-001",
  "category": "Security",
  "severity": "Critical",
  "component": "backend/src/controllers/auth.controller.js",
  "description": "Hardcoded JWT secret found in token generation.",
  "actionable_fix": "Replace 'secret123' with process.env.JWT_SECRET.",
  "confidence_score": 1.0
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency CVE Checks | Custom parsers for package-lock.json | `npm audit --json` | Built-in and continuously updated by npm registry. |

## Common Pitfalls

### Pitfall 1: Fixing Without Reporting
**What goes wrong:** The agent fixes a non-critical bug inline but fails to add it to the JSON report.
**Why it happens:** AI agents tend to optimize by fixing as they read.
**How to avoid:** The plan must explicitly forbid inline fixes (except for Critical secrets per D-10). All other findings must strictly be reported in the JSON output to fulfill the phase contract.

### Pitfall 2: Shallow Audits
**What goes wrong:** The audit scans files but misses architectural logic flaws (e.g. business logic bypassing validation).
**How to avoid:** Prioritize deep analysis of the Auth and LLM flows over superficial scans of the whole repo.

## Environment Availability Audit

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| npm | Dependency audit | ✓ | v10+ | — |
| node | Script execution | ✓ | v18+ | — |

## Sources

### Primary (HIGH confidence)
- [Local Context] - `01-CONTEXT.md` explicitly defined the boundaries and JSON report structure.
- [Codebase] - Discovered `src/services/llm.service.js` and `src/config/passport.js` as the targets for deep-dive.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Built-in npm tools suffice.
- Architecture: HIGH - Matches the requested JSON format and domain requirements.
- Pitfalls: HIGH - Common behavioral constraints for autonomous auditing.

**Research date:** 2026-06-09
**Valid until:** 30 days
