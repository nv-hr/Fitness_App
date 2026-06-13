---
phase: 04
slug: frontend-static-analysis-deduplication
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-13
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| fallow CLI → project filesystem | fallow reads source files; outputs are read-only analysis JSON | Read-only analysis |
| `git mv` → working tree | moves files without deleting; safe operation | File paths |
| shared/ui → feature components | MetricItem/Card receive props from feature components; no user input crosses this boundary | Component props |
| fallow CLI output | Read-only JSON; no code execution | JSON |
| Test suite | Runs existing test files; read-only verification | Test results |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | fallow output JSON | accept | Output is read-only analysis; no code execution by fallow | closed |
| T-04-02 | Information Disclosure | `_deprecated/` files | accept | Deprecated files preserved in git; no new exposure | closed |
| T-04-SC | Tampering | npm install (fallow) | mitigate | fallow is a well-known, established tool; verify via `npmjs.com/package/fallow` if in doubt | closed |
| T-04-03 | Tampering | MetricItem JSX rendering | accept | Component renders static className strings; no user-controlled className injection | closed |
| T-04-04 | Information Disclosure | shared/ui barrel | accept | Barrel exports are internal — no new public API surface created | closed |
| T-04-05 | Repudiation | Phase completion claim | mitigate | SUMMARY.md with before/after fallow metrics provides audit trail | closed |
| T-04-06 | Denial of Service | Accidentally deleting a live component | mitigate | D-02 strategy: only `git mv` to _deprecated/, git history always recoverable | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-04-01 | T-04-01 | Output is read-only analysis; no code execution by fallow | gsd-security-auditor | 2026-06-13 |
| R-04-02 | T-04-02 | Deprecated files preserved in git; no new exposure | gsd-security-auditor | 2026-06-13 |
| R-04-03 | T-04-03 | Component renders static className strings; no user-controlled className injection | gsd-security-auditor | 2026-06-13 |
| R-04-04 | T-04-04 | Barrel exports are internal — no new public API surface created | gsd-security-auditor | 2026-06-13 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-13 | 7 | 7 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-13
