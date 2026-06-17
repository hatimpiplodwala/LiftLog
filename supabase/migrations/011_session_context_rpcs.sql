-- 011_session_context_rpcs.sql
-- Collapse the active-workout screen's per-exercise N+1 into two batched RPCs.
-- Previously each exercise block fired its own "last set" query plus a two-step
-- "previous session" lookup; a 6-exercise session was ~18 round trips. These
-- take the whole exercise list at once and return one payload each.
--
-- Both are security invoker so RLS applies: workouts are scoped to the caller by
-- the workouts SELECT policy (same pattern as 008/010). Existing index
-- workout_sets_exercise_completed_idx (exercise_id, completed_at desc) already
-- serves both access paths.

-- For each exercise, the most recent set from any *finished* workout.
create or replace function public.get_last_sets(exercise_ids uuid[])
returns table (
  exercise_id   uuid,
  reps          int,
  weight_kg     numeric,
  duration_secs int
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (s.exercise_id)
    s.exercise_id, s.reps, s.weight_kg, s.duration_secs
  from public.workout_sets s
  join public.workouts w on w.id = s.workout_id
  where s.exercise_id = any(exercise_ids)
    and w.finished_at is not null
  order by s.exercise_id, s.completed_at desc;
$$;

revoke all on function public.get_last_sets(uuid[]) from public;
grant execute on function public.get_last_sets(uuid[]) to authenticated;

-- For each exercise, every set from that exercise's most recent prior *finished*
-- workout (excluding the in-progress one), ordered by set number. dense_rank ties
-- all of a workout's sets to the same rank, so rnk = 1 is exactly that session.
create or replace function public.get_previous_session_sets(
  exercise_ids uuid[],
  exclude_workout_id uuid
)
returns table (
  exercise_id   uuid,
  reps          int,
  weight_kg     numeric,
  duration_secs int,
  set_number    int
)
language sql
stable
security invoker
set search_path = public
as $$
  with ranked as (
    select
      s.exercise_id, s.workout_id,
      s.reps, s.weight_kg, s.duration_secs, s.set_number,
      dense_rank() over (
        partition by s.exercise_id
        order by w.started_at desc, s.workout_id desc
      ) as rnk
    from public.workout_sets s
    join public.workouts w on w.id = s.workout_id
    where s.exercise_id = any(exercise_ids)
      and w.finished_at is not null
      and (exclude_workout_id is null or s.workout_id <> exclude_workout_id)
  )
  select exercise_id, reps, weight_kg, duration_secs, set_number
  from ranked
  where rnk = 1
  order by exercise_id, set_number;
$$;

revoke all on function public.get_previous_session_sets(uuid[], uuid) from public;
grant execute on function public.get_previous_session_sets(uuid[], uuid) to authenticated;
