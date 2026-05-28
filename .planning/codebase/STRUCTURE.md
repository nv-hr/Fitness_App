---
title: "Structure"
last_mapped_commit: a161cdd
last_updated: "2026-05-17"
focus: arch
---

# STRUCTURE.md — Directory Structure

## Overview

The repository has a **flat structure** with no subdirectories (excluding `.planning/` which is GSD tooling). All files are at the root level.

## Directory Tree

```
Fitness_App/
├── .planning/
│   └── codebase/          # GSD codebase mapping documents
├── BMI Calculator          # Feature description file (3 lines)
├── KCAL Calculator         # Feature description file (3 lines)
├── TDEE Calculator         # Feature description file (3 lines)
├── Workout Planner         # Feature description file (3 lines)
├── Workout Progress        # Feature description file (3 lines)
├── LICENSE                 # GNU GPL v3 (674 lines)
└── README.md               # Project documentation (22 lines)
```

## Key Locations

| Path | Description |
|------|-------------|
| `README.md` | Main project documentation in Indonesian |
| `LICENSE` | GNU GPL v3 license text |
| `BMI Calculator` | Feature description — calculates BMI index |
| `KCAL Calculator` | Feature description — tracks calorie intake/burn |
| `TDEE Calculator` | Feature description — calculates daily calorie burn |
| `Workout Planner` | Feature description — creates exercise plans |
| `Workout Progress` | Feature description — tracks workout progress |

## Naming Conventions

- Feature files use **Title Case with spaces** (e.g., `BMI Calculator`, `Workout Planner`)
- No file extensions on feature description files
- All documentation in **Indonesian (Bahasa Indonesia)**
- Repository name uses **snake_case**: `Fitness_App`

## File Types

| Extension | Count | Purpose |
|-----------|-------|---------|
| (none) | 5 | Feature description files |
| `.md` | 1 | README documentation |
| (none) | 1 | LICENSE text |

## Notes

- Feature files are plain text descriptions, not executable code
- No source code directories, no `src/`, no `lib/`, no `components/`
- Structure suggests this is a **planning/ideation repository** awaiting implementation
