-- 009_pr_rpc_and_input_bounds.sql
-- Three changes, no user-visible behavior change:
--   1. Server-side per-exercise PR aggregates so the app stops transferring the
--      user's entire set history just to compute a few maxes (mirrors 008's
--      get_workout_summaries).
--   2. Make signup robust: the username constraint can no longer abort the
--      auth.users insert via the on-signup trigger.
--   3. Upper bounds on numeric inputs so a client can't store absurd values
--      that poison volume/PR aggregates (and are shown to anon share viewers).

-- ---------------------------------------------------------------------------
-- 1. Per-exercise PRs. security invoker (default privilege model) so RLS on
--    workout_sets still applies — the caller only ever aggregates their own
--    sets, matching the previous client-side reduce (in-progress workouts
--    included, same as before). Replaces pulling every set client-side.
-- ---------------------------------------------------------------------------
create or replace function public.get_exercise_prs()
returns table (
  exercise_id       uuid,
  max_weight_kg     numeric,
  max_reps          int,
  max_duration_secs int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.exercise_id,
    coalesce(max(s.weight_kg), 0)     as max_weight_kg,
    coalesce(max(s.reps), 0)          as max_reps,
    coalesce(max(s.duration_secs), 0) as max_duration_secs
  from public.workout_sets s
  group by s.exercise_id;
$$;

revoke all on function public.get_exercise_prs() from public;
grant execute on function public.get_exercise_prs() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user: truncate the username to the column's 50-char cap so a
--    long value in raw_user_meta_data can never violate profiles_username_len
--    and roll back the whole signup. nullif('') also restores the intended
--    fallback to the email local-part when the client sends an empty username.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    left(
      coalesce(
        nullif(new.raw_user_meta_data->>'username', ''),
        split_part(new.email, '@', 1)
      ),
      50
    )
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Upper bounds on numeric inputs. Generous — far above any legitimate
--    entry — purely to keep garbage out of aggregates. NULLs stay allowed.
--    Drop-then-add so the migration is re-runnable.
-- ---------------------------------------------------------------------------
alter table public.workout_sets
  drop constraint if exists workout_sets_reps_max,
  drop constraint if exists workout_sets_weight_max,
  drop constraint if exists workout_sets_duration_max;
alter table public.workout_sets
  add constraint workout_sets_reps_max     check (reps is null or reps <= 10000),
  add constraint workout_sets_weight_max   check (weight_kg is null or weight_kg <= 10000),
  add constraint workout_sets_duration_max check (duration_secs is null or duration_secs <= 86400);

alter table public.body_weight_logs
  drop constraint if exists body_weight_max;
alter table public.body_weight_logs
  add constraint body_weight_max check (weight_kg <= 1000);
