---
phase: 1
level: 2
researched_at: 2026-06-08
---

# Phase 1 Research

## Questions Investigated
1. How to map dependencies and find circular dependencies in our Express backend?
2. How to find dead code and unused exports?
3. How to measure code complexity and identify targets for refactoring?

## Findings

### Dependency Mapping
The backend uses modern ES Modules (`"type": "module"` in `package.json`). For JS module mapping, `madge` is the industry standard tool. It provides capabilities to find circular dependencies and orphaned files, and can even generate visual graphs.

**Recommendation:** Run `npx madge --circular --orphans backend/src` during the execution phase.

### Dead Code Detection
To find unused exports, files, and dependencies, `knip` is a modern and highly effective tool that works well with ES Modules out of the box. 

**Recommendation:** Initialize Knip and run `npx knip` to flag dead code.

### Complexity Measurement
While there are complex cyclomatic analysis tools, the most pragmatic approach for our backend size is to analyze Line of Code (LOC) counts for each module using a tool like `scc`, combined with manual review. Files exceeding a certain length threshold (e.g., controllers or services > 200 lines) are prime candidates for refactoring.

**Recommendation:** Run `scc backend/src` and identify the largest files. 

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dependency Tool | `madge` | Best-in-class for ES modules and circular dependencies. |
| Dead Code Tool | `knip` | Fast, accurate, and catches unused exports and unused npm dependencies. |
| Complexity Tool | `scc` + Manual | Simple LOC counting helps prioritize which files need manual architectural review. |

## Patterns to Follow
- Strict separation of concerns: **Controllers** (HTTP layer) → **Services** (Business Logic) → **Repositories** (Data layer).
- Centralized error handling using middleware.

## Anti-Patterns to Avoid
- **Fat Controllers**: Controllers should not contain business logic or raw SQL queries.
- **Leaking DB logic**: Services should not contain SQL; they should call repository methods.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| madge | latest | Dependency mapping and circular reference detection |
| knip | latest | Dead code analysis |
| scc | latest | Line-of-code and complexity analysis |

## Risks
- **False Positives in Dead Code**: Dynamic imports or implicitly required files might be flagged as unused.
  - **Mitigation**: Manually verify any file or export flagged by Knip before removal.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
