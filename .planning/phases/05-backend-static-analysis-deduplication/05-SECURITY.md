---
phase: 5
slug: backend-static-analysis-deduplication
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-13
---

# Phase 5 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| App → Backend Controllers | API requests containing input dates, times, and day indexes | Date strings, index values |
| Backend → Repositories | Data queries to fetch historic data | Date cutoff strings |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-01 | Tampering / IDOR | Timezone Date Validation | mitigate | `isDateWithinTimezoneRange` correctly scopes logging and swapping to today/yesterday/tomorrow relative to server UTC | closed |
| T-05-02 | Tampering | Week & Day Index bounds | mitigate | `validateWeekAndDay` enforces type checking, bounds (0-6), and valid date format before any further controller logic | closed |
| T-05-03 | Denial of Service | SSE Connection | accept | Server-Sent Events architecture correctly leaves connections open. OS handles limits, and LLM termination ends stream. | closed |
| T-05-04 | Information Disclosure | Historic Log Query | mitigate | `getHistoryCutoffStr` enforces 1-365 days bound constraint in both activity and food repositories | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-05-01 | T-05-03 | SSE connections naturally remain open until server closes or client drops. Node defaults are sufficient for MVP traffic limits. | gsd-security-auditor | 2026-06-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-13 | 4 | 4 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-13
