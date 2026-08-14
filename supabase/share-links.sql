-- Voyage share links migration
-- Existing data and tables are preserved. Safe to run more than once.

create table if not exists public.trip_shares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token text not null unique,
  permission text not null default 'view' check (permission in ('view')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists trip_shares_token_idx on public.trip_shares(token);
create index if not exists trip_shares_trip_id_idx on public.trip_shares(trip_id);

alter table public.trip_shares enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_shares' and policyname = 'voyage share read') then
    create policy "voyage share read" on public.trip_shares for select to anon using (revoked_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_shares' and policyname = 'voyage share insert') then
    create policy "voyage share insert" on public.trip_shares for insert to anon with check (permission = 'view');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_shares' and policyname = 'voyage share revoke') then
    create policy "voyage share revoke" on public.trip_shares for update to anon using (true) with check (revoked_at is not null or permission = 'view');
  end if;
end $$;
