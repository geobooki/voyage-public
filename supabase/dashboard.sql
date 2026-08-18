-- 대시보드 일정 보조 정보용 안전한 마이그레이션
create table if not exists public.dashboard_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null check (kind in ('do', 'eat', 'souvenir', 'tip')),
  title text not null,
  detail text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_items_trip_id_idx on public.dashboard_items(trip_id);
alter table public.dashboard_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'voyage dashboard read') then create policy "voyage dashboard read" on public.dashboard_items for select to anon using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage dashboard insert') then create policy "voyage dashboard insert" on public.dashboard_items for insert to anon with check (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage dashboard update') then create policy "voyage dashboard update" on public.dashboard_items for update to anon using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'voyage dashboard delete') then create policy "voyage dashboard delete" on public.dashboard_items for delete to anon using (true); end if;
end $$;

notify pgrst, 'reload schema';
