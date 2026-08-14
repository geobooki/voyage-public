-- Existing projects: safely add optional budget metadata columns.
alter table if exists public.budget_items add column if not exists name text;
alter table if exists public.budget_items add column if not exists detail text;
alter table if exists public.budget_items add column if not exists payment_method text;
