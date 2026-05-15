-- LeanPath Database Schema for Supabase
-- Run this in the Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════════
-- Profiles table (extends Supabase auth.users)
-- ══════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  sex text check (sex in ('male', 'female')),
  age integer,
  height_cm numeric,
  current_weight_kg numeric,
  goal_weight_kg numeric,
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  deficit_level text check (deficit_level in ('gentle', 'moderate', 'aggressive', 'maximum')),
  unit_system text default 'imperial' check (unit_system in ('imperial', 'metric')),
  daily_calorie_target integer default 1800,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════
-- Meal entries
-- ══════════════════════════════════════════════
create table if not exists public.meal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  meal_slot text check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  items jsonb default '[]'::jsonb,
  total_calories integer default 0,
  total_protein numeric default 0,
  total_carbs numeric default 0,
  total_fat numeric default 0,
  input_method text check (input_method in ('search', 'photo', 'description', 'barcode')),
  photo_url text,
  ai_description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ══════════════════════════════════════════════
-- Workout entries
-- ══════════════════════════════════════════════
create table if not exists public.workout_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  type text not null,
  duration_min integer not null,
  intensity text check (intensity in ('low', 'moderate', 'high')) default 'moderate',
  calories_burned integer default 0,
  input_method text check (input_method in ('manual', 'ai')) default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ══════════════════════════════════════════════
-- Step entries (one per user per day)
-- ══════════════════════════════════════════════
create table if not exists public.step_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  step_count integer default 0,
  calories_burned integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- ══════════════════════════════════════════════
-- Weight entries (one per user per day)
-- ══════════════════════════════════════════════
create table if not exists public.weight_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  weight_kg numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- ══════════════════════════════════════════════
-- Row Level Security (RLS)
-- ══════════════════════════════════════════════

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Meal entries
alter table public.meal_entries enable row level security;
create policy "Users can view own meals" on public.meal_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own meals" on public.meal_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own meals" on public.meal_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete own meals" on public.meal_entries
  for delete using (auth.uid() = user_id);

-- Workout entries
alter table public.workout_entries enable row level security;
create policy "Users can view own workouts" on public.workout_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on public.workout_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on public.workout_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete own workouts" on public.workout_entries
  for delete using (auth.uid() = user_id);

-- Step entries
alter table public.step_entries enable row level security;
create policy "Users can view own steps" on public.step_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own steps" on public.step_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own steps" on public.step_entries
  for update using (auth.uid() = user_id);

-- Weight entries
alter table public.weight_entries enable row level security;
create policy "Users can view own weights" on public.weight_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own weights" on public.weight_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own weights" on public.weight_entries
  for update using (auth.uid() = user_id);

-- ══════════════════════════════════════════════
-- Indexes for performance
-- ══════════════════════════════════════════════
create index if not exists idx_meals_user_date on public.meal_entries(user_id, date);
create index if not exists idx_workouts_user_date on public.workout_entries(user_id, date);
create index if not exists idx_steps_user_date on public.step_entries(user_id, date);
create index if not exists idx_weights_user_date on public.weight_entries(user_id, date);
