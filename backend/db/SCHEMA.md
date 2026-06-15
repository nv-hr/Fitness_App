## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `email` | `varchar` |  Nullable Unique |
| `password_hash` | `varchar` |  Nullable |
| `google_id` | `varchar` |  Nullable Unique |
| `pdp_consent` | `bool` |  Nullable |
| `pdp_consent_date` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  Unique |
| `weight_kg` | `numeric` |  |
| `height_cm` | `numeric` |  |
| `age` | `int4` |  |
| `gender` | `gender` |  |
| `fitness_goal` | `fitness_goal` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `activity_level` | `activity_level` |  Nullable |
| `calorie_rate` | `varchar` |  Nullable |
| `target_weight_kg` | `numeric` |  Nullable |
| `target_date` | `date` |  Nullable |

## Table `foods`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  Nullable |
| `name` | `varchar` |  |
| `calories_per_100g` | `int4` |  |
| `category` | `food_category` |  |
| `is_custom` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `food_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `food_id` | `int4` |  Nullable |
| `custom_food_name` | `varchar` |  Nullable |
| `calories` | `int4` |  |
| `portion_grams` | `int4` |  |
| `log_date` | `date` |  |
| `meal_type` | `meal_type` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `activities`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `name` | `varchar` |  |
| `description` | `text` |  |
| `duration_min` | `int4` |  |
| `estimated_calories` | `int4` |  |
| `goal_tags` | `jsonb` |  |
| `equipment_needed` | `jsonb` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `user_activity_log`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `activity_id` | `int4` |  |
| `completed_date` | `date` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `activity_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `activity_id` | `int4` |  |
| `duration_min` | `int4` |  |
| `intensity` | `intensity_level` |  |
| `calories_burned` | `int4` |  |
| `logged_date` | `date` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `weekly_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `week_start` | `date` |  |
| `plan_data` | `jsonb` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `meal_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `week_start` | `date` |  |
| `plan_data` | `jsonb` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `activity_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `plan_date` | `date` |  |
| `plan_data` | `jsonb` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `daily_meal_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `plan_date` | `date` |  |
| `plan_data` | `jsonb` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `weight_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `user_id` | `int4` |  |
| `weight_kg` | `numeric` |  |
| `logged_date` | `date` |  |
| `source` | `text` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

