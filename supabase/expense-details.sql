-- 실제 지출 이름을 저장합니다. 기존 데이터는 삭제하지 않습니다.
alter table if exists expenses add column if not exists name text;
