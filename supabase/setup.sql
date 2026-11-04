-- Voyage Supabase one-time setup
-- Supabase SQL Editor에서 이 파일 하나만 실행하세요.
-- 기존 데이터는 삭제하지 않으며, 반복 실행할 수 있습니다.

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique,
  country text, city text, destination_currency text not null default 'JPY',
  trip_type text not null default 'international' check (trip_type in ('domestic','international')),
  latitude double precision, longitude double precision, start_date date, end_date date,
  status text not null default 'planning' check (status in ('planning','active','completed')),
  cover_image text, owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.trips add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.trips add column if not exists destination_currency text not null default 'JPY';
alter table public.trips add column if not exists trip_type text not null default 'international';
create unique index if not exists trips_slug_idx on public.trips(slug) where slug is not null;
create index if not exists trips_owner_id_idx on public.trips(owner_id);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null, type text not null default 'other', address text, latitude double precision, longitude double precision,
  expected_cost numeric(12,2) not null default 0, visit_date date, must_go boolean not null default false,
  visited boolean not null default false, memo text, created_at timestamptz not null default now()
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null, payer_id uuid, amount numeric(12,2) not null default 0,
  currency text not null default 'KRW', category text not null default 'other', spent_at timestamptz not null default now(),
  memo text, name text, krw_amount numeric(12,2), payment_method text,
  participant_ids jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.travelers (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null, created_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_payer_id_fkey') then
    alter table public.expenses add constraint expenses_payer_id_fkey foreign key (payer_id) references public.travelers(id) on delete set null;
  end if;
end $$;

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null check (kind in ('packing','preparation')), category text not null default 'General',
  name text not null, checked boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.checklist_categories (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null default 'packing' check (kind in ('packing','preparation')), name text not null,
  color text not null default '#FDE68A', created_at timestamptz not null default now(), unique(trip_id,kind,name)
);
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default 'Other', estimated_amount numeric(12,2) not null default 0, currency text not null default 'KRW',
  name text, detail text, payment_method text, created_at timestamptz not null default now()
);
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null default 'other', title text not null, date date, end_date date, time time, location text,
  departure_location text, arrival_location text, departure_time time, arrival_time time, airline text, terminal text,
  reservation_number text, cost numeric(12,2) not null default 0, memo text, link text, created_at timestamptz not null default now()
);
create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null, date date not null, time time, type text not null default 'other',
  title text not null, note text, completed boolean not null default false, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.schedule_documents (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  schedule_id uuid not null references public.schedule_items(id) on delete cascade,
  file_name text not null, storage_path text not null, mime_type text not null, size bigint not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.souvenirs (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null, estimated_price numeric(12,2) not null default 0, purchased boolean not null default false,
  actual_price numeric(12,2) not null default 0, memo text, created_at timestamptz not null default now()
);
create table if not exists public.exchange_plans (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null unique references public.trips(id) on delete cascade,
  from_currency text not null default 'KRW', to_currency text not null default 'JPY', rate numeric(12,6) not null default 0,
  expected_cash numeric(12,2) not null default 0, card_estimate numeric(12,2) not null default 0,
  planned_exchange numeric(12,2) not null default 0, actual_exchange numeric(12,2) not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.weather_days (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null, temperature numeric(5,1), condition text, icon text, unique(trip_id,date)
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null unique references public.trips(id) on delete cascade,
  rating smallint, comment text, good_things text, bad_things text, revisit_places text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.dashboard_items (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null check (kind in ('do','eat','souvenir','tip')), title text not null, detail text, category text,
  url text, completed boolean not null default false, created_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, member_email text not null,
  role text not null default 'viewer' check (role in ('viewer','editor')), invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), unique(trip_id,member_email)
);
create table if not exists public.trip_shares (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  token text not null unique, permission text not null default 'view' check (permission in ('view','edit')),
  invite_email text, invited_by text, accepted_at timestamptz, created_at timestamptz not null default now(), revoked_at timestamptz
);

-- 이미 일부 스키마가 존재하는 경우에도 필요한 최신 컬럼을 보완합니다.
alter table public.trips add column if not exists slug text;
alter table public.places add column if not exists expected_cost numeric(12,2) not null default 0;
alter table public.places add column if not exists visit_date date;
alter table public.expenses add column if not exists name text;
alter table public.expenses add column if not exists krw_amount numeric(12,2);
alter table public.expenses add column if not exists payment_method text;
alter table public.expenses add column if not exists participant_ids jsonb not null default '[]'::jsonb;
alter table public.schedule_items add column if not exists completed boolean not null default false;
alter table public.dashboard_items add column if not exists category text;
alter table public.dashboard_items add column if not exists completed boolean not null default false;

create or replace function public.voyage_can_access(target_trip uuid, required_role text default 'viewer') returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips t where t.id=target_trip and (t.owner_id=auth.uid() or exists
    (select 1 from public.trip_members m where m.trip_id=target_trip and (m.user_id=auth.uid() or lower(m.member_email)=lower(coalesce(auth.jwt()->>'email','')))
      and (required_role='viewer' or m.role='editor'))));
$$;
create or replace function public.voyage_claim_memberships() returns void
language sql security definer set search_path = public as $$
  update public.trip_members set user_id=auth.uid() where user_id is null and lower(member_email)=lower(coalesce(auth.jwt()->>'email',''));
$$;
grant execute on function public.voyage_claim_memberships() to authenticated;

do $$ declare t text; begin
  foreach t in array array['trips','places','expenses','travelers','checklist_items','checklist_categories','budget_items','reservations','schedule_items','schedule_documents','reviews','souvenirs','exchange_plans','weather_days','dashboard_items','trip_members','trip_shares'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I','voyage anon read',t);
    execute format('drop policy if exists %I on public.%I','voyage anon insert',t);
    execute format('drop policy if exists %I on public.%I','voyage anon update',t);
    execute format('drop policy if exists %I on public.%I','voyage anon delete',t);
  end loop;
end $$;

drop policy if exists "voyage share read" on public.trip_shares;
drop policy if exists "voyage share insert" on public.trip_shares;
drop policy if exists "voyage share revoke" on public.trip_shares;

drop policy if exists "voyage trips read" on public.trips;
drop policy if exists "voyage trips insert" on public.trips;
drop policy if exists "voyage trips update" on public.trips;
drop policy if exists "voyage trips delete" on public.trips;
create policy "voyage trips read" on public.trips for select to authenticated using (owner_id=auth.uid() or public.voyage_can_access(id,'viewer'));
create policy "voyage trips insert" on public.trips for insert to authenticated with check (owner_id=auth.uid());
create policy "voyage trips update" on public.trips for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "voyage trips delete" on public.trips for delete to authenticated using (owner_id=auth.uid());

do $$ declare t text; begin
  foreach t in array array['places','expenses','travelers','checklist_items','checklist_categories','budget_items','reservations','schedule_items','schedule_documents','reviews','souvenirs','exchange_plans','weather_days','dashboard_items'] loop
    execute format('drop policy if exists %I on public.%I','voyage member read',t);
    execute format('drop policy if exists %I on public.%I','voyage member insert',t);
    execute format('drop policy if exists %I on public.%I','voyage member update',t);
    execute format('drop policy if exists %I on public.%I','voyage member delete',t);
    execute format('create policy %I on public.%I for select to authenticated using (public.voyage_can_access(trip_id,''viewer''))','voyage member read',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.voyage_can_access(trip_id,''editor''))','voyage member insert',t);
    execute format('create policy %I on public.%I for update to authenticated using (public.voyage_can_access(trip_id,''editor'')) with check (public.voyage_can_access(trip_id,''editor''))','voyage member update',t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.voyage_can_access(trip_id,''editor''))','voyage member delete',t);
  end loop;
end $$;

drop policy if exists "voyage members read" on public.trip_members;
drop policy if exists "voyage members insert" on public.trip_members;
drop policy if exists "voyage members update" on public.trip_members;
drop policy if exists "voyage members delete" on public.trip_members;
create policy "voyage members read" on public.trip_members for select to authenticated using (public.voyage_can_access(trip_id,'viewer') or invited_by=auth.uid());
create policy "voyage members insert" on public.trip_members for insert to authenticated with check (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));
create policy "voyage members update" on public.trip_members for update to authenticated using (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));
create policy "voyage members delete" on public.trip_members for delete to authenticated using (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));

drop policy if exists "voyage shares owner read" on public.trip_shares;
drop policy if exists "voyage shares owner insert" on public.trip_shares;
drop policy if exists "voyage shares owner update" on public.trip_shares;
create policy "voyage shares owner read" on public.trip_shares for select to authenticated using (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));
create policy "voyage shares owner insert" on public.trip_shares for insert to authenticated with check (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));
create policy "voyage shares owner update" on public.trip_shares for update to authenticated using (exists(select 1 from public.trips where id=trip_id and owner_id=auth.uid()));

do $$ declare t text; begin
  foreach t in array array['trips','trip_members','places','expenses','reservations','schedule_items','schedule_documents','checklist_items','budget_items','exchange_plans','dashboard_items'] loop
    begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
  end loop;
end $$;

-- 기존 여행은 자동으로 임의 사용자에게 소유권을 주지 않습니다.
-- 첫 로그인 후 본인 UUID로 필요한 기존 여행을 1회 연결하세요.
-- update public.trips set owner_id='YOUR_AUTH_USER_UUID' where slug='your-trip-slug' and owner_id is null;

-- 아이디 로그인용 프로필 별칭. 기존 데이터와 auth.users를 삭제하지 않습니다.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username)) where username is not null;
alter table public.profiles enable row level security;
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.voyage_create_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, nullif(lower(trim(new.raw_user_meta_data->>'username')), ''), new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_voyage_profile on auth.users;
create trigger on_auth_user_created_voyage_profile after insert on auth.users
for each row execute procedure public.voyage_create_profile();
insert into public.profiles (id, email)
select id, email from auth.users where email is not null
on conflict (id) do update set email = excluded.email, updated_at = now();
