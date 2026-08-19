-- 예약 PDF 보관용 private Storage bucket과 메타데이터 테이블입니다.
-- 기존 데이터나 테이블을 삭제하지 않으며, 여러 번 실행해도 안전합니다.

create table if not exists reservation_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  reservation_id uuid not null references reservations(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reservation_documents_reservation_id_idx
  on reservation_documents(reservation_id);

insert into storage.buckets (id, name, public)
values ('reservation-pdfs', 'reservation-pdfs', false)
on conflict (id) do nothing;

alter table reservation_documents enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reservation_documents' and policyname = 'voyage anon reservation documents read') then
    create policy "voyage anon reservation documents read" on public.reservation_documents for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reservation_documents' and policyname = 'voyage anon reservation documents insert') then
    create policy "voyage anon reservation documents insert" on public.reservation_documents for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reservation_documents' and policyname = 'voyage anon reservation documents delete') then
    create policy "voyage anon reservation documents delete" on public.reservation_documents for delete to anon using (true);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'voyage anon reservation pdf read') then
    create policy "voyage anon reservation pdf read" on storage.objects for select to anon using (bucket_id = 'reservation-pdfs');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'voyage anon reservation pdf insert') then
    create policy "voyage anon reservation pdf insert" on storage.objects for insert to anon with check (bucket_id = 'reservation-pdfs');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'voyage anon reservation pdf delete') then
    create policy "voyage anon reservation pdf delete" on storage.objects for delete to anon using (bucket_id = 'reservation-pdfs');
  end if;
end $$;
