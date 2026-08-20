-- 여행 팁 링크의 카테고리를 저장합니다.
-- 기존 데이터와 테이블을 삭제하지 않으며 반복 실행할 수 있습니다.
alter table if exists dashboard_items
  add column if not exists category text;
