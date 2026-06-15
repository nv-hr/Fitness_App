# Capability: activity-plan-algorithm

## Purpose
TBD: Activity plan generation based on user activity level.

## Requirements

### Requirement: Activity Level to Calorie Ceiling Mapping
The system SHALL map each `activity_level` profile value to a maximum calorie-per-activity ceiling used to filter candidate activities:
- `sedentary` → max 80 cal
- `lightly_active` → max 150 cal
- `moderately_active` → max 250 cal
- `very_active` → max 400 cal
- `extra_active` → no ceiling (all activities eligible)

#### Scenario: Sedentary user gets low-intensity activities
- **WHEN** a plan is generated for a user whose `activity_level` is `sedentary`
- **THEN** the algorithm MUST only include activities whose `estimated_calories` is ≤ 80 in the candidate pool

#### Scenario: Extra-active user gets full activity pool
- **WHEN** a plan is generated for a user whose `activity_level` is `extra_active`
- **THEN** the algorithm SHALL not apply a calorie ceiling and all activities matching the `fitness_goal` tag are eligible

### Requirement: Fitness Goal Tag Filtering
The system SHALL filter the candidate activity pool by matching the user's `fitness_goal` against each activity's `goal_tags` JSONB array before applying the calorie ceiling.

#### Scenario: Goal-tagged activities are preferred
- **WHEN** a plan is generated for a user with `fitness_goal = "weight_loss"`
- **THEN** only activities whose `goal_tags` contain `"weight_loss"` (and that meet the calorie ceiling) SHALL be included in the primary candidate pool

#### Scenario: Fallback when no activities match goal + ceiling
- **WHEN** no activities match both the `fitness_goal` tag and the calorie ceiling
- **THEN** the system SHALL fall back to activities matching only the calorie ceiling; if still empty, all activities SHALL be used and a warning SHALL be logged

### Requirement: Weekly Schedule Structure
The system SHALL generate a 7-day schedule with exactly 2 rest days and 5 active days per week.

#### Scenario: Rest days are randomly placed
- **WHEN** a weekly plan is generated
- **THEN** exactly 2 days in the 7-day plan SHALL have `rest_day: true` and the remaining 5 SHALL have `rest_day: false`; rest day positions SHALL be randomized each generation

### Requirement: Daily Duration Tiers
The system SHALL assign a total workout duration target per active day based on the user's `activity_level`:

| Activity Level | Daily Duration Target |
|---|---|
| sedentary | 20 min |
| lightly_active | 40 min |
| moderately_active | 60 min |
| very_active | 80 min |
| extra_active | 100 min |

#### Scenario: Sedentary daily duration capped at 20 min
- **WHEN** a plan day is built for a sedentary user
- **THEN** the sum of `duration_min` across all activities in that day SHALL NOT exceed 20 minutes

#### Scenario: Very active daily duration targets 80 min
- **WHEN** a plan day is built for a very active user
- **THEN** the sum of `duration_min` across activities SHALL target 80 minutes total

### Requirement: Activity Set Count Per Day
Each active day SHALL contain between 3 and 4 activity sets. Activities are added until the count reaches 3–4 or the daily duration tier is exhausted, whichever comes first.

#### Scenario: Active day has 3 to 4 activities
- **WHEN** a plan day is constructed
- **THEN** the `activities` array for that day SHALL contain between 3 and 4 entries

#### Scenario: Activity repetition allowed when pool is small
- **WHEN** the candidate pool has fewer than 3 distinct activities
- **THEN** activities MAY be repeated across days in the same week to satisfy the minimum set count

### Requirement: Deterministic Plan Shape
The algorithm SHALL produce a plan in the same JSON shape expected by the existing API consumers — a `{ days: [...] }` object where each day has `date`, `rest_day`, and `activities` fields.

#### Scenario: Generated plan matches existing schema
- **WHEN** the algorithm returns a plan
- **THEN** it SHALL conform to `{ days: [ { date: string, rest_day: boolean, activities: [ { activity_id, name, duration_min, intensity, calories_burned, completed } ] } ] }`
