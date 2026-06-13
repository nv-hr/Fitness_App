# Fitness App

## What This Is

A full-stack fitness application that allows users to track their body metrics, nutrition, and daily activities. It provides AI-assisted, personalized weekly and daily meal and activity plans to help users achieve their fitness goals.

## Core Value

Streamlining the process of tracking fitness progress with intelligent, AI-driven recommendations and tracking capabilities. 

## Current Milestone: Pending

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ React Single Page Application (SPA) frontend built with Vite and styled with TailwindCSS
- ✓ Express.js REST API backend
- ✓ Integration with Google Gemini for AI features (e.g., plan generation)
- ✓ PostgreSQL database for storing user profiles, food logs, activities, and AI-generated plans
- ✓ Identify and remove duplicated code in the frontend — v1.1
- ✓ Identify and remove duplicated code in the backend — v1.1
- ✓ Identify and remove dead code in both environments — v1.1
- ✓ Enforce DRY principles via refactoring — v1.1

### Active

<!-- Current scope. Building toward these. -->

- [ ] Refactor codebase and do cleanup
- [ ] General audit to find hidden bugs, security issues, and performance bottlenecks
- [ ] Static analysis of the frontend to map API usage and trace calls to backend routes
- [ ] Remove unused backend routes and DB tables that are no longer referenced by the frontend
- [ ] Fix discovered issues and remove dead code

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [New feature development] — The current phase is strictly focused on refactoring, cleanup, and technical debt reduction.

## Context

- The project is a brownfield, full-stack monorepo (`/frontend` and `/backend`).
- The user initiated a comprehensive cleanup and refactoring effort to ensure system health.
- The database schema has recently been translated from MySQL to PostgreSQL.
- Shipped v1.1 successfully, removing deprecated tests and files, extracting duplicated frontend UI elements (MetricItem, Card), and deduplicating backend logic.

## Constraints

- **Tech Stack**: Must remain within the existing React + Express + PostgreSQL stack.
- **Data Integrity**: Refactoring and table removal must not cause data loss for actively used features.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static Analysis for cleanup | The most reliable way to find dead routes and tables is mapping frontend API usage | — Pending |
| Deprecated `fallow` test dependencies in frontend | `fallow` static analysis was causing noise in UAT for deprecated testing dependencies | ✓ Good |
| Extracting duplicated logic to `utils` folder | Enforces DRY without over-engineering an abstraction layer | ✓ Good |

---
*Last updated: 2026-06-13 after milestone v1.1 completion*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
