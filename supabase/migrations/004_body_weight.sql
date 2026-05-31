create table if not exists public.body_weight_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  weight_kg  numeric not null check (weight_kg > 0),
  logged_at  timestamptz not null default now(),
  notes      text
);
create index if not exists body_weight_logs_user_logged_idx
  on public.body_weight_logs(user_id, logged_at desc);

alter table public.body_weight_logs enable row level security;

drop policy if exists "body_weight: select own" on public.body_weight_logs;
create policy "body_weight: select own" on public.body_weight_logs
  for select using (auth.uid() = user_id);

drop policy if exists "body_weight: insert own" on public.body_weight_logs;
create policy "body_weight: insert own" on public.body_weight_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "body_weight: update own" on public.body_weight_logs;
create policy "body_weight: update own" on public.body_weight_logs
  for update using (auth.uid() = user_id);

drop policy if exists "body_weight: delete own" on public.body_weight_logs;
create policy "body_weight: delete own" on public.body_weight_logs
  for delete using (auth.uid() = user_id);
