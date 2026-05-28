---
phase: 05
plan: 01
subsystem: database
tags: [schema, seed-data, mysql]
dependency_graph:
  requires: []
  provides: [activities_table, user_activity_log_table, 35_seed_activities]
  affects: [05-02]
tech_stack:
  added: [MySQL 8.4 JSON columns]
  patterns: [CREATE TABLE IF NOT EXISTS, JSON arrays, FOREIGN KEY CASCADE]
key_files:
  created: []
  modified: [backend/db/init.sql]
decisions:
  - Added 35 activities (exceeds minimum of 30-40 per D-42)
  - All activities home-suitable, no gym equipment required
  - Goal tag distribution: lose_weight=18, maintain=28, gain_weight=14
metrics:
  duration: 10min
  completed_date: 2026-05-18
---

# Phase 05 Plan 01: Database Schema & Activity Seeding Summary

**One-liner:** Added `activities` and `user_activity_log` tables with 35 Indonesian home exercise seed data, all tagged by fitness goal.

## Objective

Add activities and user_activity_log tables to the database schema, and seed 35 Indonesian home exercises suitable for all fitness goals.

## What Was Built

### Tables Added (2)

1. **activities** — 7 columns + id + created_at: `name`, `description`, `duration_min`, `estimated_calories`, `goal_tags JSON`, `equipment_needed JSON`
2. **user_activity_log** — 6 columns + id + created_at: `user_id`, `activity_id`, `completed_date`, `notes`, with FK cascade and index on `(user_id, completed_date)`

### Seed Data (35 Activities)

| Category | Count | Focus |
|----------|-------|-------|
| Cardio | 6 | lose_weight |
| Bodyweight strength | 8 | gain_weight |
| Flexibility/balance | 6 | maintain |
| HIIT circuits | 4 | lose_weight/maintain |
| Core focused | 5 | maintain/gain_weight |
| Additional balanced | 6 | mixed |

### Goal Tag Distribution

- `lose_weight`: 18 activities
- `maintain`: 28 activities
- `gain_weight`: 14 activities

All activities use home-suitable equipment: `[]`, `["matras"]`, or `["kursi"]`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `CREATE TABLE IF NOT EXISTS activities` present with all 7 columns
- [x] `CREATE TABLE IF NOT EXISTS user_activity_log` present with all 6 columns
- [x] 35 activity rows seeded (verified by line count)
- [x] All activities have non-empty goal_tags JSON arrays
- [x] No gym equipment required
- [x] All descriptions in Bahasa Indonesia
- [x] Section header comments present
