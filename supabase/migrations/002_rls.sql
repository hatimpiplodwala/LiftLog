-- Row Level Security policies for LiftLog

-- Enable RLS
alter table public.profiles            enable row level security;
alter table public.exercises           enable row level security;
alter table public.workouts            enable row level security;
alter table public.workout_sets        enable row level security;
alter table public.workout_templates   enable row level security;
alter table public.template_exercises  enable row level security;

-- profiles
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- exercises (anyone can read — needed for share view; users can create their own; seeded immutable)
drop policy if exists "exercises: select all" on public.exercises;
create policy "exercises: select all" on public.exercises
  for select using (true);

drop policy if exists "exercises: insert own" on public.exercises;
create policy "exercises: insert own" on public.exercises
  for insert with check (auth.uid() = created_by);

drop policy if exists "exercises: delete own" on public.exercises;
create policy "exercises: delete own" on public.exercises
  for delete using (auth.uid() = created_by);

-- workouts (CRUD own; public read via share_token)
drop policy if exists "workouts: select own" on public.workouts;
create policy "workouts: select own" on public.workouts
  for select using (auth.uid() = user_id);

drop policy if exists "workouts: select shared" on public.workouts;
create policy "workouts: select shared" on public.workouts
  for select using (share_token is not null);

drop policy if exists "workouts: insert own" on public.workouts;
create policy "workouts: insert own" on public.workouts
  for insert with check (auth.uid() = user_id);

drop policy if exists "workouts: update own" on public.workouts;
create policy "workouts: update own" on public.workouts
  for update using (auth.uid() = user_id);

drop policy if exists "workouts: delete own" on public.workouts;
create policy "workouts: delete own" on public.workouts
  for delete using (auth.uid() = user_id);

-- workout_sets (CRUD sets owned by user's workouts; public read for shared)
drop policy if exists "workout_sets: select own" on public.workout_sets;
create policy "workout_sets: select own" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and (w.user_id = auth.uid() or w.share_token is not null)
    )
  );

drop policy if exists "workout_sets: insert own" on public.workout_sets;
create policy "workout_sets: insert own" on public.workout_sets
  for insert with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = auth.uid()
    )
  );

drop policy if exists "workout_sets: update own" on public.workout_sets;
create policy "workout_sets: update own" on public.workout_sets
  for update using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = auth.uid()
    )
  );

drop policy if exists "workout_sets: delete own" on public.workout_sets;
create policy "workout_sets: delete own" on public.workout_sets
  for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = auth.uid()
    )
  );

-- workout_templates
drop policy if exists "templates: select own" on public.workout_templates;
create policy "templates: select own" on public.workout_templates
  for select using (auth.uid() = user_id);

drop policy if exists "templates: insert own" on public.workout_templates;
create policy "templates: insert own" on public.workout_templates
  for insert with check (auth.uid() = user_id);

drop policy if exists "templates: update own" on public.workout_templates;
create policy "templates: update own" on public.workout_templates
  for update using (auth.uid() = user_id);

drop policy if exists "templates: delete own" on public.workout_templates;
create policy "templates: delete own" on public.workout_templates
  for delete using (auth.uid() = user_id);

-- template_exercises
drop policy if exists "template_exercises: select own" on public.template_exercises;
create policy "template_exercises: select own" on public.template_exercises
  for select using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "template_exercises: insert own" on public.template_exercises;
create policy "template_exercises: insert own" on public.template_exercises
  for insert with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "template_exercises: delete own" on public.template_exercises;
create policy "template_exercises: delete own" on public.template_exercises
  for delete using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id and t.user_id = auth.uid()
    )
  );

grant usage on schema public to anon;
grant select on public.workouts, public.workout_sets, public.exercises to anon;
