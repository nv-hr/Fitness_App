---
title: "Conventions"
last_mapped_commit: a161cdd
last_updated: "2026-05-17"
focus: quality
---

# CONVENTIONS.md — Coding Conventions

## Overview

**No coding conventions exist** because there is no source code in the repository. The only conventions that can be inferred are from documentation naming and structure.

## Code Style

- **Not applicable** — No source code files to analyze.

## Naming Conventions (observed in documentation)

| Element | Convention | Example |
|---------|-----------|---------|
| Repository name | snake_case | `Fitness_App` |
| Feature files | Title Case with spaces | `BMI Calculator`, `Workout Planner` |
| README sections | Title Case with `##` headers | `## BMI Calculator` |
| Git commits | Imperative mood | `Create Workout Planner`, `Update README.md` |

## Documentation Language

- **Indonesian (Bahasa Indonesia)** — All feature descriptions and README content are written in Indonesian.
- Example: "Menghitung berat badan ideal seseorang, sesuai dengan umur dan tinggi badannya."

## Error Handling

- **Not applicable** — No code exists.

## Patterns

- **None observed** — No code patterns to analyze.

## Git Conventions

| Aspect | Observation |
|--------|-------------|
| Commit style | Simple imperative (`Create X`, `Update Y`) |
| Branch naming | `features` (from PR #1 merge) |
| PR style | Standard GitHub merge |

## Recommendations for Future Implementation

When code is added, consider establishing:

1. **Language-specific linting** (ESLint, Prettier, ruff, etc.)
2. **TypeScript** for type safety if building a web app
3. **Consistent file extensions** (feature files currently have none)
4. **Standardized commit messages** (Conventional Commits recommended)
5. **Code documentation** in Indonesian to match existing docs, or English for broader accessibility

## Notes

- This document should be updated once source code is added to the project
