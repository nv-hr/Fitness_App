---
phase: 3
slug: cleanup-issue-resolution
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest |
| **Config file** | none |
| **Quick run command** | `cd backend && npm run test` |
| **Full suite command** | `cd backend && npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npm run test`
- **After every plan wave:** Run `cd backend && npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | RFACT-03 | — | N/A | unit | `cd backend && npm run test` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | RFACT-04 | — | N/A | unit | `cd backend && npm run test` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | AUDIT-SEC-001 | T-3-01-03 | Strict validation for email/password | unit | `cd backend && npm run test` | ✅ | ⬜ pending |
| 3-01-04 | 01 | 1 | AUDIT-SEC-002 | T-3-01-04 | Silent truncation of LLM inputs | unit | `cd backend && npm run test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Validates email | AUDIT-SEC-001 | End-to-end user flow | Attempt to register with weak password |
| Truncates input | AUDIT-SEC-002 | External LLM API | Send long `fitness_goal` profile request |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-09
