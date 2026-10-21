-- Ninety schema. Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Every row carries user_id and is locked to its owner by row-level security.

create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  kind       text not null check (kind in ('add', 'remove')),
  category   text,
  created_at timestamptz not null default now()
);

-- Active stretches. An archived habit has end_date set on its latest period.
-- Time between periods is archived time and never counts toward adherence.
create table if not exists public.habit_periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  start_date date not null,
  end_date   date,
  check (end_date is null or end_date >= start_date)
);

-- One row per habit per day. adhered = true is a good day, false is a slip.
create table if not exists public.habit_logs (
  habit_id  uuid not null references public.habits (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date  date not null,
  adhered   boolean not null,
  primary key (habit_id, log_date)
);

-- Forgive-and-restart history, with the user's reflection. The latest reset_on drives the 14-day cooldown.
create table if not exists public.habit_resets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  reset_on   date not null,
  reflection text not null default ''
);

create index if not exists habit_periods_habit_idx on public.habit_periods (habit_id);
create index if not exists habit_resets_habit_idx on public.habit_resets (habit_id);

alter table public.habits        enable row level security;
alter table public.habit_periods enable row level security;
alter table public.habit_logs    enable row level security;
alter table public.habit_resets  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['habits', 'habit_periods', 'habit_logs', 'habit_resets'] loop
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format(
      'create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
