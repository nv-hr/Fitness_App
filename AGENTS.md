<!-- GSD:project-start source:PROJECT.md -->
## Project

**Fitness_App**

A web-based health application that helps Indonesian users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption, and receive simple physical activity recommendations. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake, and understand their calorie balance — all in one integrated, easy-to-use Indonesian-language health tool.

### Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React + Express + MySQL (already decided)
- **Language**: Indonesian UI required
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Overview
## Languages
- **None yet** — No source code files exist in the repository.
- Planned features are described in Indonesian (Bahasa Indonesia) in `README.md`.
## Runtime / Platform
- **Not applicable** — No runtime configuration files exist (no `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, etc.).
- The `README.md` mentions "Akses aplikasi di google" (access the app on Google), suggesting a planned **web-based** deployment.
## Frameworks
- **None** — No framework dependencies declared.
## Dependencies
- **None** — No dependency manifest files exist.
## Configuration Files
| File | Purpose |
|------|---------|
| `LICENSE` | GNU GPL v3 license |
| `README.md` | Project description and feature list |
## Planned Features (from README.md)
## Build / Tooling
- **None** — No build scripts, CI/CD configs, or tooling files present.
## Notes
- Repository is hosted at `https://github.com/nv-hr/Fitness_App.git`
- 9 git commits total, all related to README updates and feature file creation
- Last commit: `a161cdd` — "Update README.md"
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
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
## Notes
- This document should be updated once source code is added to the project
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Overview
## Architectural Pattern
- **Not applicable** — No codebase to analyze for patterns.
- Planned features suggest a **tool-based** architecture where each calculator/planner is a standalone module.
## Layers
| Layer | Planned Components |
|-------|-------------------|
| UI | 5 feature pages (BMI, KCAL, TDEE, Workout Planner, Workout Progress) |
| Logic | Calculation engines for BMI, KCAL, TDEE formulas |
| Data | Progress tracking storage (Workout Progress) |
## Data Flow
- **Not implemented** — No data flow exists.
- Expected flow once built:
## Abstractions
- **None** — No abstractions, interfaces, or base classes defined.
## Entry Points
- **None** — No executable entry points (`index.html`, `main.py`, `App.tsx`, etc.).
## Key Formulas (for future implementation)
- **BMI**: weight(kg) / height(m)²
- **TDEE**: BMR × Activity Multiplier
- **BMR**: Mifflin-St Jeor or Harris-Benedict equation
- **KCAL**: Food item calorie summation
## Notes
- Project is in pre-implementation phase
- Architecture decisions should be made during planning phase before coding begins
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
