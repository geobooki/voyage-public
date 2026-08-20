-- 일정 종료 시간 또는 소요 시간을 저장합니다. 기존 데이터는 유지됩니다.
alter table if exists schedule_items add column if not exists end_time time;
alter table if exists schedule_items add column if not exists duration_minutes integer;
