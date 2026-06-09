-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
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
CREATE TABLE public.profiles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL UNIQUE,
  weight_kg numeric NOT NULL,
  height_cm numeric NOT NULL,
  age integer NOT NULL,
  gender USER-DEFINED NOT NULL,
  fitness_goal USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activity_level USER-DEFINED,
  calorie_rate character varying,
  target_weight_kg numeric CHECK (target_weight_kg IS NULL OR target_weight_kg > 0::numeric),
  target_date date,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.foods (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer,
  name character varying NOT NULL,
  calories_per_100g integer NOT NULL,
  category USER-DEFINED NOT NULL,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT foods_pkey PRIMARY KEY (id),
  CONSTRAINT foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.food_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  food_id integer,
  custom_food_name character varying,
  calories integer NOT NULL,
  portion_grams integer NOT NULL,
  log_date date NOT NULL,
  meal_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (id),
  CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT food_logs_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.activities (
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

CREATE TABLE public.activity_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  activity_id integer NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  intensity USER-DEFINED NOT NULL,
  calories_burned integer NOT NULL CHECK (calories_burned >= 0),
  logged_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT activity_logs_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.weekly_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  week_start date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_plans_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.activity_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  plan_date date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_plans_pkey PRIMARY KEY (id),
  CONSTRAINT activity_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.daily_meal_plans (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  plan_date date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT daily_meal_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.weight_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0::numeric),
  logged_date date NOT NULL,
  source text NOT NULL DEFAULT 'manual'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);