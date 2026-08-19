create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  country text,
  city text,
  destination_currency text not null default 'JPY',
  latitude double precision,
  longitude double precision,
  start_date date,
  end_date date,
  status text not null default 'planning' check (status in ('planning', 'active', 'completed')),
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trips add column if not exists latitude double precision;
alter table trips add column if not exists longitude double precision;
alter table trips add column if not exists slug text;
alter table trips add column if not exists destination_currency text not null default 'JPY';
create unique index if not exists trips_slug_idx on trips(slug) where slug is not null;

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  type text not null default 'other',
  address text,
  latitude double precision,
  longitude double precision,
  expected_cost numeric(12, 2) not null default 0 check (expected_cost >= 0),
  visit_date date,
  must_go boolean not null default false,
  visited boolean not null default false,
  memo text,
  created_at timestamptz not null default now()
);

alter table places add column if not exists expected_cost numeric(12, 2) not null default 0;
alter table places add column if not exists visit_date date;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  place_id uuid references places(id) on delete set null,
  payer_id uuid,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'KRW',
  category text not null default 'other',
  spent_at timestamptz not null default now(),
  memo text,
  created_at timestamptz not null default now()
);

alter table expenses add column if not exists krw_amount numeric(12, 2);

create table if not exists travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_payer_id_fkey') then
    alter table expenses add constraint expenses_payer_id_fkey foreign key (payer_id) references travelers(id) on delete set null;
  end if;
end $$;

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null check (kind in ('packing', 'preparation')),
  category text not null default 'General',
  name text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists checklist_categories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null default 'packing' check (kind in ('packing', 'preparation')),
  name text not null,
  color text not null default '#FDE68A',
  created_at timestamptz not null default now(),
  unique (trip_id, kind, name)
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text not null default 'Other',
  estimated_amount numeric(12, 2) not null default 0 check (estimated_amount >= 0),
  currency text not null default 'KRW',
  name text,
  detail text,
  payment_method text,
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null default 'other',
  title text not null,
  date date,
  end_date date,
  time time,
  location text,
  departure_location text,
  arrival_location text,
  departure_time time,
  arrival_time time,
  airline text,
  terminal text,
  reservation_number text,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  memo text,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  place_id uuid references places(id) on delete set null,
  date date not null,
  time time,
  type text not null default 'other',
  title text not null,
  note text,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table schedule_items add column if not exists completed boolean not null default false;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text,
  good_things text,
  bad_things text,
  revisit_places text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists souvenirs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  estimated_price numeric(12, 2) not null default 0 check (estimated_price >= 0),
  purchased boolean not null default false,
  actual_price numeric(12, 2) not null default 0 check (actual_price >= 0),
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists exchange_plans (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips(id) on delete cascade,
  from_currency text not null default 'KRW',
  to_currency text not null default 'JPY',
  rate numeric(12, 6) not null default 0,
  expected_cash numeric(12, 2) not null default 0,
  card_estimate numeric(12, 2) not null default 0,
  planned_exchange numeric(12, 2) not null default 0,
  actual_exchange numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists weather_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null,
  temperature numeric(5, 1),
  condition text,
  icon text,
  unique (trip_id, date)
);

create table if not exists dashboard_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null check (kind in ('do', 'eat', 'souvenir', 'tip')),
  title text not null,
  detail text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists places_trip_id_idx on places(trip_id);
create index if not exists expenses_trip_id_idx on expenses(trip_id);
create index if not exists expenses_place_id_idx on expenses(place_id);
create index if not exists expenses_payer_id_idx on expenses(payer_id);
create index if not exists travelers_trip_id_idx on travelers(trip_id);
create index if not exists checklist_items_trip_id_idx on checklist_items(trip_id);
create index if not exists checklist_categories_trip_id_idx on checklist_categories(trip_id);
create index if not exists budget_items_trip_id_idx on budget_items(trip_id);
create index if not exists reservations_trip_id_idx on reservations(trip_id);
create index if not exists schedule_items_trip_id_idx on schedule_items(trip_id);
create index if not exists souvenirs_trip_id_idx on souvenirs(trip_id);
create index if not exists weather_days_trip_id_idx on weather_days(trip_id);
create index if not exists dashboard_items_trip_id_idx on dashboard_items(trip_id);
