# Phase 4 Context: Frontend Static Analysis & Deduplication

## Domain
Identifying unused/duplicated code in the frontend and refactoring shared UI/logic.

## Decisions

### Analysis Tooling
- **Decision**: Use `fallow` (provided as a skill) for fast, comprehensive codebase intelligence and static analysis.

### Dead Code Strategy
- **Decision**: Rename unused components/utilities to `.deprecated` or move to a `_deprecated` folder first. Do not delete them immediately.

### Component Extraction
- **Decision**: Use a mix of both primitive components for generic layouts (e.g. `<Card>`, `<Flex>`) and semantic components for domain-specific UI.

## Canonical References
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
