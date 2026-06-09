# Roadmap: Fitness App Refactoring & Cleanup

## Overview

A structured technical debt reduction journey, starting with a comprehensive codebase audit to identify hidden issues, followed by static analysis to map frontend API usage, and concluding with the removal of unused backend routes, database tables, and the implementation of necessary fixes.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: General Codebase Audit** - Identify bugs, performance bottlenecks, and security issues. (completed 2026-06-09)
- [x] **Phase 2: Frontend Static Analysis & Mapping** - Map API calls to find unused routes and tables.
- [x] **Phase 3: Cleanup & Issue Resolution** - Safely remove dead code/tables and fix discovered issues.

## Phase Details

### Phase 1: General Codebase Audit

**Goal**: Identify performance bottlenecks, hidden bugs, and security vulnerabilities across the entire codebase.
**Depends on**: Nothing
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):

  1. A comprehensive audit report is generated detailing all identified issues.
  2. Issues are prioritized by severity for the final phase.

**Plans**: 1 plan

Plans:

- [x] 01-01: Execute general codebase audit and generate report

### Phase 2: Frontend Static Analysis & Mapping

**Goal:** Map all frontend API calls to backend routes to definitively identify unused components.
**Status:** 🟩 Complete (2026-06-09)
**Requirement IDs:** RFACT-01, RFACT-02
**Depends on:** Phase 1
**Success Criteria** (what must be TRUE):

  1. All active frontend API calls are traced to their corresponding backend routes.
  2. A definitive list of unused backend routes and database tables is created.

**Plans**: 1 plan

Plans:

- [x] 02-01: Run static analysis and map unused routes and tables

### Phase 3: Cleanup & Issue Resolution

**Goal**: Remove unused code, routes, and DB tables, and fix the high-priority issues found during the audit.
**Depends on**: Phase 2
**Requirements**: RFACT-03, RFACT-04, AUDIT-04
**Success Criteria** (what must be TRUE):

  1. Identified unused backend routes and associated dead code are removed.
  2. Identified unused database tables are safely dropped without affecting active features.
  3. Critical and high-priority issues identified in the audit are resolved.

**Plans**: 3 plans

Plans:

- [x] 03-01: Safely remove unused backend routes
- [x] 03-02: Safely drop unused database tables
- [x] 03-03: Implement fixes for critical audit findings

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. General Codebase Audit | 4/4 | Complete    | 2026-06-09 |
| 2. Frontend Static Analysis & Mapping | 1/1 | Complete    | 2026-06-09 |
| 3. Cleanup & Issue Resolution | 1/1 | Complete    | 2026-06-09 |
