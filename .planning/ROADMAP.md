# Roadmap v1.1

**2 phases** | **6 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 4 | Frontend Static Analysis & Deduplication | 2/3 | In Progress|  |
| 5 | Backend Static Analysis & Deduplication | 1/1 | Complete   | 2026-06-12 |

### Phase Details

### Phase 4: Frontend Static Analysis & Deduplication

**Goal**: Identify unused/duplicated code in frontend and refactor shared UI/logic
**Requirements**: FE-01, FE-02, FE-03
**Success Criteria**:

1. Use fallow or eslint to identify dead and duplicate code
2. Dead frontend code removed
3. Duplicated UI components extracted into shared components

### Phase 5: Backend Static Analysis & Deduplication

**Goal**: Identify unused/duplicated code in backend and refactor shared services
**Requirements**: BE-01, BE-02, BE-03
**Success Criteria**:

1. Use static analysis to find dead and duplicate backend code
2. Dead backend code removed
3. Duplicated route handlers and queries extracted to shared modules
