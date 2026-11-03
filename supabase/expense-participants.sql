alter table if exists public.expenses
  add column if not exists participant_ids jsonb not null default '[]'::jsonb;
