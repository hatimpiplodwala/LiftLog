-- 007_perf.sql — backend efficiency pass (no behavior change).
--
-- Three things, all preserving existing query results and security semantics:
--   1. Composite indexes that match the app's real access paths (filter + sort).
--   2. Drop single-column / duplicate indexes now subsumed by those composites.
--   3. Rewrite every RLS policy to call (select auth.uid()) instead of bare
--      auth.uid(). Bare auth.uid() is re-evaluated per row; wrapping it in a
--      scalar subquery lets Postgres evaluate it once per statement (initPlan).
--      See: Supabase "RLS performance and best practices".
--
-- Note: CREATE INDEX takes a brief lock. On a large production table prefer
-- `create index concurrently` (must run outside a transaction). These tables
-- are small here, so plain create-if-not-exists inside the migration is fine.

-- ---------------------------------------------------------------------------
-- 1. Composite indexes for the hot read paths
-- ---------------------------------------------------------------------------

-- useWorkouts: where user_id = ? [and finished_at is not null] order by started_at desc limit ?
create index if not exists workouts_user_started_idx
  on public.workouts (user_id, started_at desc);

-- useFinishedAts / useWeeklySetsTotal / Progress + Dashboard joins:
-- where user_id = ? and finished_at is not null [and finished_at >= ?]
create index if not exists workouts_user_finished_idx
  on public.workouts (user_id, finished_at desc)
  where finished_at is not null;

-- useWorkoutSets / useWorkoutExerciseOrder: where workout_id = ? order by completed_at
create index if not exists workout_sets_workout_completed_idx
  on public.workout_sets (workout_id, completed_at);

-- useLastSetForExercise / usePreviousSessionSets / useExerciseSets:
-- where exercise_id = ? order by completed_at desc
create index if not exists workout_sets_exercise_completed_idx
  on public.workout_sets (exercise_id, completed_at desc);

-- useTemplateExercises: where template_id = ? order by sort_order
create index if not exists template_exercises_template_sort_idx
  on public.template_exercises (template_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. Drop indexes now redundant (leading column of a composite, or a dup of
--    the share_token UNIQUE constraint). Keeps writes cheaper.
-- ---------------------------------------------------------------------------
drop index if exists public.workouts_user_id_idx;       -- covered by workouts_user_started_idx
drop index if exists public.workouts_finished_at_idx;   -- covered by workouts_user_finished_idx
drop index if exists public.workouts_share_token_idx;   -- duplicate of share_token UNIQUE
drop index if exists public.workout_sets_workout_id_idx; -- covered by workout_sets_workout_completed_idx
drop index if exists public.workout_sets_exercise_id_idx;-- covered by workout_sets_exercise_completed_idx
drop index if exists public.template_exercises_template_id_idx; -- covered by template_exercises_template_sort_idx

-- ---------------------------------------------------------------------------
-- 3. RLS: re-create every policy with (select auth.uid()).
--    Reproduces the current effective policy set (post-004/005) verbatim,
--    changing only auth.uid() -> (select auth.uid()).
-- ---------------------------------------------------------------------------

-- profiles
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);

-- exercises (select all is unchanged — no auth.uid() to optimize)
drop policy if exists "exercises: insert own" on public.exercises;
create policy "exercises: insert own" on public.exercises
  for insert with check ((select auth.uid()) = created_by);

drop policy if exists "exercises: delete own" on public.exercises;
create policy "exercises: delete own" on public.exercises
  for delete using ((select auth.uid()) = created_by);

-- workouts
drop policy if exists "workouts: select own" on public.workouts;
create policy "workouts: select own" on public.workouts
  for select using ((select auth.uid()) = user_id);

drop policy if exists "workouts: insert own" on public.workouts;
create policy "workouts: insert own" on public.workouts
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "workouts: update own" on public.workouts;
create policy "workouts: update own" on public.workouts
  for update using ((select auth.uid()) = user_id);

drop policy if exists "workouts: delete own" on public.workouts;
create policy "workouts: delete own" on public.workouts
  for delete using ((select auth.uid()) = user_id);

-- workout_sets (owner-only, via parent workout)
drop policy if exists "workout_sets: select own" on public.workout_sets;
create policy "workout_sets: select own" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = (select auth.uid())
    )
  );

drop policy if exists "workout_sets: insert own" on public.workout_sets;
create policy "workout_sets: insert own" on public.workout_sets
  for insert with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = (select auth.uid())
    )
  );

drop policy if exists "workout_sets: update own" on public.workout_sets;
create policy "workout_sets: update own" on public.workout_sets
  for update using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = (select auth.uid())
    )
  );

drop policy if exists "workout_sets: delete own" on public.workout_sets;
create policy "workout_sets: delete own" on public.workout_sets
  for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = (select auth.uid())
    )
  );

-- workout_templates
drop policy if exists "templates: select own" on public.workout_templates;
create policy "templates: select own" on public.workout_templates
  for select using ((select auth.uid()) = user_id);

drop policy if exists "templates: insert own" on public.workout_templates;
create policy "templates: insert own" on public.workout_templates
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "templates: update own" on public.workout_templates;
create policy "templates: update own" on public.workout_templates
  for update using ((select auth.uid()) = user_id);

drop policy if exists "templates: delete own" on public.workout_templates;
create policy "templates: delete own" on public.workout_templates
  for delete using ((select auth.uid()) = user_id);

-- template_exercises (via parent template)
drop policy if exists "template_exercises: select own" on public.template_exercises;
create policy "template_exercises: select own" on public.template_exercises
  for select using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id
        and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "template_exercises: insert own" on public.template_exercises;
create policy "template_exercises: insert own" on public.template_exercises
  for insert with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id
        and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "template_exercises: delete own" on public.template_exercises;
create policy "template_exercises: delete own" on public.template_exercises
  for delete using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_exercises.template_id
        and t.user_id = (select auth.uid())
    )
  );

-- body_weight_logs
drop policy if exists "body_weight: select own" on public.body_weight_logs;
create policy "body_weight: select own" on public.body_weight_logs
  for select using ((select auth.uid()) = user_id);

drop policy if exists "body_weight: insert own" on public.body_weight_logs;
create policy "body_weight: insert own" on public.body_weight_logs
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "body_weight: update own" on public.body_weight_logs;
create policy "body_weight: update own" on public.body_weight_logs
  for update using ((select auth.uid()) = user_id);

drop policy if exists "body_weight: delete own" on public.body_weight_logs;
create policy "body_weight: delete own" on public.body_weight_logs
  for delete using ((select auth.uid()) = user_id);
