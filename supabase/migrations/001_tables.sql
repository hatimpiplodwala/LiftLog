create extension if not exists "uuid-ossp";

-- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text,
  avatar_url  text,
  units       text not null default 'kg' check (units in ('kg', 'lbs')),
  created_at  timestamptz not null default now()
);

-- exercises
create table if not exists public.exercises (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  category    text not null check (category in ('chest','back','legs','shoulders','arms','core','cardio')),
  type        text not null check (type in ('strength','cardio','bodyweight')),
  created_by  uuid references public.profiles(id) on delete set null
);
create index if not exists exercises_category_idx on public.exercises(category);
create index if not exists exercises_created_by_idx on public.exercises(created_by);

-- workouts
create table if not exists public.workouts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  notes        text,
  share_token  uuid unique
);
create index if not exists workouts_user_id_idx on public.workouts(user_id);
create index if not exists workouts_finished_at_idx on public.workouts(finished_at);
create index if not exists workouts_share_token_idx on public.workouts(share_token);

-- workout_sets
create table if not exists public.workout_sets (
  id             uuid primary key default uuid_generate_v4(),
  workout_id     uuid not null references public.workouts(id) on delete cascade,
  exercise_id    uuid not null references public.exercises(id) on delete restrict,
  set_number     int not null,
  reps           int,
  weight_kg      numeric,
  duration_secs  int,
  completed_at   timestamptz not null default now()
);
create index if not exists workout_sets_workout_id_idx on public.workout_sets(workout_id);
create index if not exists workout_sets_exercise_id_idx on public.workout_sets(exercise_id);

-- workout_templates
create table if not exists public.workout_templates (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists workout_templates_user_id_idx on public.workout_templates(user_id);

-- template_exercises
create table if not exists public.template_exercises (
  id            uuid primary key default uuid_generate_v4(),
  template_id   uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id   uuid not null references public.exercises(id) on delete restrict,
  sort_order    int not null default 0
);
create index if not exists template_exercises_template_id_idx on public.template_exercises(template_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
