-- 여행 관리/준비물 카테고리 기능을 위한 안전한 보완 SQL
alter table public.trips add column if not exists slug text;
alter table public.trips add column if not exists destination_currency text not null default 'JPY';
create unique index if not exists trips_slug_idx on public.trips(slug) where slug is not null;

create table if not exists public.checklist_categories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null default 'packing' check (kind in ('packing', 'preparation')),
  name text not null,
  color text not null default '#FDE68A',
  created_at timestamptz not null default now(),
  unique (trip_id, kind, name)
);

alter table public.checklist_categories enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'voyage anon read categories') then create policy "voyage anon read categories" on public.checklist_categories for select to anon using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage anon insert categories') then create policy "voyage anon insert categories" on public.checklist_categories for insert to anon with check (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage anon update categories') then create policy "voyage anon update categories" on public.checklist_categories for update to anon using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage anon delete categories') then create policy "voyage anon delete categories" on public.checklist_categories for delete to anon using (true); end if;
end $$;
