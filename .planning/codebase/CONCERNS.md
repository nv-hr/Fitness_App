---
title: "Concerns"
last_mapped_commit: a161cdd
last_updated: "2026-05-17"
focus: concerns
---

# CONCERNS.md — Technical Debt and Concerns

## Overview

This is a **pre-implementation** repository. Most concerns relate to the absence of code rather than issues within code.

## Technical Debt

| Severity | Concern | Details |
|----------|---------|---------|
| HIGH | No source code | Repository contains only documentation — no working application exists |
| HIGH | No project structure | No `src/`, no build system, no dependency management |
| MEDIUM | Feature files lack extensions | Files like `BMI Calculator` have no file extension, making their purpose ambiguous |
| LOW | README typos | Indonesian text contains typos ("Menghitum" → "Menghitung", "Meenghitung" → "Menghitung") |

## Security Concerns

| Severity | Concern | Details |
|----------|---------|---------|
| MEDIUM | No input validation | When implemented, calculators will need input sanitization (weight, height, age values) |
| LOW | No auth system | If user data/progress is stored, authentication will be needed |
| INFO | GPL v3 license | Ensure compliance if using any GPL-incompatible dependencies in the future |

## Performance Concerns

- **Not applicable** — No code to evaluate for performance.
- Future considerations:
  - Calculation formulas are O(1) — no performance concerns for calculators
  - Progress tracking may need efficient storage if data grows

## Maintainability Concerns

| Concern | Impact |
|---------|--------|
| No code = no patterns to follow | Future developers have no codebase conventions to follow |
| Documentation in Indonesian only | May limit contributor pool |
| No CI/CD | No automated quality gates |
| No issue tracker usage | GitHub Issues not being utilized |

## Fragile Areas

- **Entire project** — Nothing is implemented yet; all work is ahead
- Feature descriptions are vague — no detailed specifications exist

## Known Issues

- None documented in code (no code exists)
- README contains minor typos in Indonesian text

## Recommendations

1. **Define tech stack** — Choose language, framework, build tools
2. **Create project structure** — Set up `src/`, config files, dependency manifests
3. **Implement one calculator first** — Start with BMI (simplest) as a vertical slice
4. **Add testing infrastructure** — Even simple calculators need tests
5. **Set up CI/CD** — GitHub Actions for automated testing
6. **Fix README typos** — Clean up Indonesian text
7. **Add detailed specs** — Each feature needs a proper specification document

## Positive Notes

- Clear feature scope (5 well-defined tools)
- GPL v3 license properly included
- Git history shows active development intent
- Repository is clean — no legacy code to refactor
