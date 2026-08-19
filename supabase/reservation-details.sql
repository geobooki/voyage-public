-- 예약 상세 정보를 추가하는 안전한 증분 마이그레이션입니다.
alter table if exists reservations add column if not exists end_date date;
alter table if exists reservations add column if not exists airline text;
alter table if exists reservations add column if not exists terminal text;
notify pgrst, 'reload schema';
