-- 008_backend_hardening.sql
-- Three changes, no user-visible behavior change:
--   1. Stop leaking user-created exercise names to everyone (incl. anon).
--   2. Bound workout_sets numeric fields (match body_weight_logs' integrity).
--   3. Server-side per-workout aggregates so History stops transferring every set.

-- ---------------------------------------------------------------------------
-- 1. Exercises: restrict reads to seeded (created_by is null) + own.
--    Previously "select all (true)" + anon grant existed only so the share
--    page could resolve exercise names. The share RPC now returns them
--    (see step 3 below), so anon no longer needs table access here.
-- ---------------------------------------------------------------------------
drop policy if exists "exercises: select all" on public.exercises;
create policy "exercises: select own or seeded" on public.exercises
  for select using (created_by is null or created_by = (select auth.uid()));

revoke select on public.exercises from anon;

-- Fold exercise name/category/type into the shared-workout payload. The
-- function is security definer, so it returns exactly the exercises used by
-- the shared workout's sets — no broad anon read of the exercises table.
create or replace function public.get_shared_workout(token uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with w as (
    select id, name, started_at, finished_at
    from public.workouts
    where share_token = token
    limit 1
  ),
  s as (
    select id, exercise_id, set_number, reps, weight_kg, duration_secs, completed_at
    from public.workout_sets
    where workout_id = (select id from w)
    order by completed_at
  ),
  ex as (
    select distinct e.id, e.name, e.category, e.type
    from public.exercises e
    where e.id in (select exercise_id from s)
  )
  select case
    when not exists (select 1 from w) then null
    else json_build_object(
      'workout',   (select row_to_json(w) from w),
      'sets',      coalesce((select json_agg(row_to_json(s)) from s), '[]'::json),
      'exercises', coalesce((select json_agg(row_to_json(ex)) from ex), '[]'::json)
    )
  end;
$$;

revoke all on function public.get_shared_workout(uuid) from public;
grant execute on function public.get_shared_workout(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. workout_sets: reject negative numbers. NULLs stay allowed (a set may log
--    only reps, only duration, etc.). Drops bad data out of volume/PR math.
-- ---------------------------------------------------------------------------
alter table public.workout_sets
  drop constraint if exists workout_sets_reps_nonneg,
  drop constraint if exists workout_sets_weight_nonneg,
  drop constraint if exists workout_sets_duration_nonneg;
alter table public.workout_sets
  add constraint workout_sets_reps_nonneg     check (reps is null or reps >= 0),
  add constraint workout_sets_weight_nonneg   check (weight_kg is null or weight_kg >= 0),
  add constraint workout_sets_duration_nonneg check (duration_secs is null or duration_secs >= 0);

-- ---------------------------------------------------------------------------
-- 3. Per-workout aggregates for the History list. security invoker (default
--    privilege model) so RLS on workout_sets still applies — the caller only
--    ever aggregates their own sets. Replaces pulling every set client-side.
-- ---------------------------------------------------------------------------
create or replace function public.get_workout_summaries(workout_ids uuid[])
returns table (
  workout_id     uuid,
  set_count      bigint,
  exercise_count bigint,
  volume_kg      numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.workout_id,
    count(*)                                                       as set_count,
    count(distinct s.exercise_id)                                  as exercise_count,
    coalesce(sum(coalesce(s.reps, 0) * coalesce(s.weight_kg, 0)), 0) as volume_kg
  from public.workout_sets s
  where s.workout_id = any(workout_ids)
  group by s.workout_id;
$$;

revoke all on function public.get_workout_summaries(uuid[]) from public;
grant execute on function public.get_workout_summaries(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Cap free-text fields. Generous limits — well above any legitimate input —
--    purely to stop a client from storing megabytes (workout.name is also
--    served to anonymous viewers via the share RPC). NULLs stay allowed.
--    Drop-then-add so the migration is re-runnable.
-- ---------------------------------------------------------------------------
alter table public.workouts
  drop constraint if exists workouts_name_len,
  drop constraint if exists workouts_notes_len;
alter table public.workouts
  add constraint workouts_name_len  check (char_length(name)  <= 200),
  add constraint workouts_notes_len check (notes is null or char_length(notes) <= 5000);

alter table public.profiles
  drop constraint if exists profiles_username_len,
  drop constraint if exists profiles_avatar_len;
alter table public.profiles
  add constraint profiles_username_len check (username is null or char_length(username) <= 50),
  add constraint profiles_avatar_len  check (avatar_url is null or char_length(avatar_url) <= 2048);

alter table public.exercises
  drop constraint if exists exercises_name_len;
alter table public.exercises
  add constraint exercises_name_len check (char_length(name) <= 100);

alter table public.workout_templates
  drop constraint if exists workout_templates_name_len;
alter table public.workout_templates
  add constraint workout_templates_name_len check (char_length(name) <= 200);

alter table public.body_weight_logs
  drop constraint if exists body_weight_notes_len;
alter table public.body_weight_logs
  add constraint body_weight_notes_len check (notes is null or char_length(notes) <= 1000);
