-- Adds auto-track / manual-log support to an existing Ninety database.
-- Run once in the Supabase SQL Editor. Safe to re-run. Fresh installs already get these columns from schema.sql.

alter table public.habits
  add column if not exists mode_history jsonb not null default '[]'::jsonb;

alter table public.habit_logs
  add column if not exists edited boolean not null default false;
