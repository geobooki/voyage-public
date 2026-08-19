-- 실제 지출을 원화로 직접 입력할 수 있도록 하는 안전한 보완 SQL입니다.
alter table if exists public.expenses
  add column if not exists krw_amount numeric(12, 2);
