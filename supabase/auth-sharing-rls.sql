-- Voyage 인증 기반 소유권/공유 멤버/RLS/Realtime 마이그레이션
-- 데이터 삭제 없이 컬럼, 멤버 테이블, 함수, 정책만 추가·교체합니다.
-- 실행 전 Supabase Auth에서 Email provider를 활성화하세요.

alter table public.trips add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists trips_owner_id_idx on public.trips(owner_id);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  member_email text not null,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (trip_id, member_email)
);
alter table public.trip_members enable row level security;
create index if not exists trip_members_trip_id_idx on public.trip_members(trip_id);
create index if not exists trip_members_email_idx on public.trip_members(lower(member_email));

create or replace function public.voyage_can_access(target_trip uuid, required_role text default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = target_trip
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_members m
          where m.trip_id = target_trip
            and (m.user_id = auth.uid() or lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
            and (required_role = 'viewer' or m.role = 'editor')
        )
      )
  );
$$;

-- 이메일 초대가 가입 전이어도 저장할 수 있도록, 로그인한 초대자가 자신의 멤버십을 연결합니다.
create or replace function public.voyage_claim_memberships()
returns void
language sql
security definer
set search_path = public
as $$
  update public.trip_members
  set user_id = auth.uid()
  where user_id is null
    and lower(member_email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;
grant execute on function public.voyage_claim_memberships() to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'trips', 'places', 'expenses', 'travelers', 'checklist_items', 'checklist_categories',
    'budget_items', 'reservations', 'schedule_items', 'reviews', 'souvenirs',
    'exchange_plans', 'weather_days', 'dashboard_items'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage anon read', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage anon insert', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage anon update', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage anon delete', table_name);
    end if;
  end loop;
end $$;

drop policy if exists "voyage share read" on public.trip_shares;
drop policy if exists "voyage share insert" on public.trip_shares;
drop policy if exists "voyage share revoke" on public.trip_shares;

drop policy if exists "voyage trips read" on public.trips;
drop policy if exists "voyage trips insert" on public.trips;
drop policy if exists "voyage trips update" on public.trips;
drop policy if exists "voyage trips delete" on public.trips;
create policy "voyage trips read" on public.trips for select to authenticated
  using (owner_id = auth.uid() or public.voyage_can_access(id, 'viewer'));
create policy "voyage trips insert" on public.trips for insert to authenticated
  with check (owner_id = auth.uid());
create policy "voyage trips update" on public.trips for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "voyage trips delete" on public.trips for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "voyage members read" on public.trip_members;
drop policy if exists "voyage members insert" on public.trip_members;
drop policy if exists "voyage members update" on public.trip_members;
drop policy if exists "voyage members delete" on public.trip_members;
create policy "voyage members read" on public.trip_members for select to authenticated
  using (public.voyage_can_access(trip_id, 'viewer') or invited_by = auth.uid());
create policy "voyage members insert" on public.trip_members for insert to authenticated
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "voyage members update" on public.trip_members for update to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "voyage members delete" on public.trip_members for delete to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'places', 'expenses', 'travelers', 'checklist_items', 'checklist_categories',
    'budget_items', 'reservations', 'schedule_items', 'reviews', 'souvenirs',
    'exchange_plans', 'weather_days', 'dashboard_items'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', 'voyage member read', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage member insert', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage member update', table_name);
      execute format('drop policy if exists %I on public.%I', 'voyage member delete', table_name);
      execute format('create policy %I on public.%I for select to authenticated using (public.voyage_can_access(trip_id, ''viewer''))', 'voyage member read', table_name);
      execute format('create policy %I on public.%I for insert to authenticated with check (public.voyage_can_access(trip_id, ''editor''))', 'voyage member insert', table_name);
      execute format('create policy %I on public.%I for update to authenticated using (public.voyage_can_access(trip_id, ''editor'')) with check (public.voyage_can_access(trip_id, ''editor''))', 'voyage member update', table_name);
      execute format('create policy %I on public.%I for delete to authenticated using (public.voyage_can_access(trip_id, ''editor''))', 'voyage member delete', table_name);
    end if;
  end loop;
end $$;

drop policy if exists "voyage shares owner read" on public.trip_shares;
drop policy if exists "voyage shares owner insert" on public.trip_shares;
drop policy if exists "voyage shares owner update" on public.trip_shares;
create policy "voyage shares owner read" on public.trip_shares for select to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "voyage shares owner insert" on public.trip_shares for insert to authenticated
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "voyage shares owner update" on public.trip_shares for update to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

-- Realtime은 아래 테이블 변경을 전달합니다. 이미 등록된 테이블은 건너뜁니다.
do $$
declare table_name text;
begin
  foreach table_name in array array['trips','trip_members','places','expenses','reservations','schedule_items','checklist_items','budget_items','exchange_plans','dashboard_items'] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      exception when duplicate_object then null;
      end;
    end if;
  end loop;
end $$;

-- 기존 여행 데이터는 자동으로 임의 사용자에게 귀속시키지 않습니다.
-- 최초 로그인 후 Supabase SQL Editor에서 본인 UUID로 한 번만 소유자를 지정하세요.
-- update public.trips set owner_id = 'YOUR_AUTH_USER_UUID' where slug = 'your-trip-slug' and owner_id is null;
