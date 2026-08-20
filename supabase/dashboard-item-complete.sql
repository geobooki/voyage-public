-- 여행 메인 위시리스트의 완료 여부를 저장하는 안전한 변경사항입니다.
alter table if exists public.dashboard_items
  add column if not exists completed boolean not null default false;

notify pgrst, 'reload schema';
