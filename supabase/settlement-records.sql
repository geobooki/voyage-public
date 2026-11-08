-- Supabase SQL Editor에서 한 번 실행하세요. 기존 지출은 변경하지 않습니다.
create table if not exists public.settlement_records (
  trip_id uuid not null references public.trips(id) on delete cascade,
  id uuid not null,
  kind text not null check (kind in ('split', 'payment')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  primary key (trip_id, id)
);
alter table public.settlement_records enable row level security;
grant select, insert, update, delete on public.settlement_records to authenticated;
drop policy if exists "settlement read" on public.settlement_records;
create policy "settlement read" on public.settlement_records for select to authenticated using (public.voyage_can_access(trip_id, 'viewer'));
drop policy if exists "settlement insert" on public.settlement_records;
create policy "settlement insert" on public.settlement_records for insert to authenticated with check (public.voyage_can_access(trip_id, 'editor'));
drop policy if exists "settlement update" on public.settlement_records;
create policy "settlement update" on public.settlement_records for update to authenticated using (public.voyage_can_access(trip_id, 'editor')) with check (public.voyage_can_access(trip_id, 'editor'));
drop policy if exists "settlement delete" on public.settlement_records;
create policy "settlement delete" on public.settlement_records for delete to authenticated using (public.voyage_can_access(trip_id, 'editor'));
notify pgrst, 'reload schema';
