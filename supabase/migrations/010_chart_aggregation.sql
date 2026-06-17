-- 010_chart_aggregation.sql
-- Move the Progress/Dashboard volume math server-side, no user-visible change.
--
-- The charts bucket each set by its *workout's* finished_at, and every set in a
-- workout shares that timestamp — so per-set volume bucketing is identical to
-- per-workout bucketing. These RPCs pre-sum volume per workout (and per
-- workout×muscle-group), collapsing potentially thousands of set rows into a
-- handful. All date bucketing stays client-side on the same finished_at values,
-- so weekly/monthly results — including timezone handling — are unchanged.
--
-- security invoker (default privilege model) so RLS still applies: workouts are
-- scoped to the caller by the workouts SELECT policy, exactly like 008's
-- get_workout_summaries. The caller only ever sees their own data.

-- Total volume per finished workout since `since`. Feeds the Progress "Total"
-- chart (6-month window) and the Dashboard weekly volume stat (week window).
create or replace function public.get_workout_volume(since timestamptz)
returns table (
  finished_at timestamptz,
  volume_kg   numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    w.finished_at,
    coalesce(sum(coalesce(s.reps, 0) * coalesce(s.weight_kg, 0)), 0) as volume_kg
  from public.workouts w
  join public.workout_sets s on s.workout_id = w.id
  where w.finished_at is not null
    and w.finished_at >= since
  group by w.id, w.finished_at;
$$;

revoke all on function public.get_workout_volume(timestamptz) from public;
grant execute on function public.get_workout_volume(timestamptz) to authenticated;

-- Volume per finished workout broken down by muscle group. Feeds the Progress
-- "Muscle" stacked chart (12-week window).
create or replace function public.get_muscle_volume(since timestamptz)
returns table (
  finished_at timestamptz,
  category    text,
  volume_kg   numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    w.finished_at,
    e.category,
    coalesce(sum(coalesce(s.reps, 0) * coalesce(s.weight_kg, 0)), 0) as volume_kg
  from public.workouts w
  join public.workout_sets s on s.workout_id = w.id
  join public.exercises e    on e.id = s.exercise_id
  where w.finished_at is not null
    and w.finished_at >= since
  group by w.id, w.finished_at, e.category;
$$;

revoke all on function public.get_muscle_volume(timestamptz) from public;
grant execute on function public.get_muscle_volume(timestamptz) to authenticated;
