# Roadmap: KalaFit

## Overview

KalaFit is a brownfield fitness tracking app with an existing codebase. The roadmap focuses on two phases: restoring the codebase to a working state, then running and verifying the application.

## Phases

- [ ] **Phase 1: Install Dependencies** - Restore deleted files, install npm packages, configure environment
- [ ] **Phase 2: Run & Verify** - Start both services, verify all features work

## Phase Details

### Phase 1: Install Dependencies
**Goal**: Codebase is restored to a runnable state with all dependencies installed and configured
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. All 279 deleted source files restored from git history
  2. `npm install` completes without errors in both frontend and backend
  3. `.env` file exists with required configuration (DATABASE_URL, OPENROUTER_API_KEY, etc.)
  4. Database schema migrations apply successfully
  5. `npm test` runs without import errors (tests may fail due to missing DB, but modules resolve)
**Plans**: TBD

### Phase 2: Run & Verify
**Goal**: Application runs locally with all features accessible and verified
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ACTV-01, ACTV-02, ACTV-03, ACTV-04, ACTV-05, MEAL-01, MEAL-02, MEAL-03, MEAL-04, PROF-01, PROF-02, PROF-03, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts both frontend and backend without errors
  2. Backend API responds to health check endpoints
  3. Frontend loads in browser without build errors
  4. Authentication flow works (register, login, logout)
  5. All existing features are accessible and functional
**Plans**: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Install Dependencies | 0/TBD | Not started | - |
| 2. Run & Verify | 0/TBD | Not started | - |
