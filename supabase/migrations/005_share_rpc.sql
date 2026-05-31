-- 1. Drop the over-permissive anon-share policy on workouts.
drop policy if exists "workouts: select shared" on public.workouts;

-- 2. Tighten workout_sets SELECT to owner-only (no more shared-via-OR).
drop policy if exists "workout_sets: select own" on public.workout_sets;
create policy "workout_sets: select own" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.user_id = auth.uid()
    )
  );

-- 3. Revoke anon table-level SELECT on workouts and workout_sets.
--    (exercises stays anon-readable — needed so the share RPC's caller can
--    resolve exercise names via the existing `exercises: select all` policy.)
revoke select on public.workouts     from anon;
revoke select on public.workout_sets from anon;

-- 4. Security-definer share RPC. Returns null when the token doesn't match.
create or replace function public.get_shared_workout(token uuid)
returns json
language sql
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
  )
  select case
    when not exists (select 1 from w) then null
    else json_build_object(
      'workout', (select row_to_json(w) from w),
      'sets',    coalesce((select json_agg(row_to_json(s)) from s), '[]'::json)
    )
  end;
$$;

-- Lock down execution: explicit grants only.
revoke all on function public.get_shared_workout(uuid) from public;
grant execute on function public.get_shared_workout(uuid) to anon, authenticated;
