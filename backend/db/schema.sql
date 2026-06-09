-- ============================================================
-- PostgreSQL Schema for Fitness_App
-- Idempotent: type and table creation
-- ============================================================

-- ============================================================
-- ENUM Types
-- Created BEFORE any table that references them
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'intensity_level' AND n.nspname = current_schema()) THEN
        CREATE TYPE intensity_level AS ENUM ('light', 'moderate', 'vigorous');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'gender' AND n.nspname = current_schema()) THEN
        CREATE TYPE gender AS ENUM ('male', 'female', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'fitness_goal' AND n.nspname = current_schema()) THEN
        CREATE TYPE fitness_goal AS ENUM ('lose_weight', 'maintain', 'gain_weight');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'activity_level' AND n.nspname = current_schema()) THEN
        CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'very_active', 'extra_active');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'food_category' AND n.nspname = current_schema()) THEN
        CREATE TYPE food_category AS ENUM ('proteins', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'drinks', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'meal_type' AND n.nspname = current_schema()) THEN
        CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  email character varying UNIQUE,
  password_hash character varying,
  google_id character varying UNIQUE,
  pdp_consent boolean DEFAULT false,
  pdp_consent_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL UNIQUE,
  weight_kg numeric NOT NULL,
  height_cm numeric NOT NULL,
  age integer NOT NULL,
  gender gender NOT NULL,
  fitness_goal fitness_goal NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activity_level activity_level,
  calorie_rate character varying,
  target_weight_kg numeric CHECK (target_weight_kg IS NULL OR target_weight_kg > 0::numeric),
  target_date date,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS foods (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer,
  name character varying NOT NULL,
  calories_per_100g integer NOT NULL,
  category food_category NOT NULL,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT foods_pkey PRIMARY KEY (id),
  CONSTRAINT foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  food_id integer,
  custom_food_name character varying,
  calories integer NOT NULL,
  portion_grams integer NOT NULL,
  log_date date NOT NULL,
  meal_type meal_type NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (id),
  CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT food_logs_food_id_fkey FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  description text NOT NULL,
  duration_min integer NOT NULL,
  estimated_calories integer NOT NULL,
  goal_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  equipment_needed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  activity_id integer NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  intensity intensity_level NOT NULL,
  calories_burned integer NOT NULL CHECK (calories_burned >= 0),
  logged_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT activity_logs_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  week_start date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_plans_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS activity_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  plan_date date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_plans_pkey PRIMARY KEY (id),
  CONSTRAINT activity_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_meal_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  plan_date date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT daily_meal_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0::numeric),
  logged_date date NOT NULL,
  source text NOT NULL DEFAULT 'manual'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Indexes
-- ============================================================

-- foods table indexes
CREATE INDEX IF NOT EXISTS idx_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_user_category ON foods(user_id, category);

-- food_logs table indexes
CREATE INDEX IF NOT EXISTS idx_user_date ON food_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_user_recent ON food_logs(user_id, log_date DESC);

-- activity_logs table indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, logged_date);

-- weekly_plans table indexes
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON weekly_plans(user_id, week_start);