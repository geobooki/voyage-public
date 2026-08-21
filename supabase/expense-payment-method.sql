alter table if exists public.expenses
  add column if not exists payment_method text;
