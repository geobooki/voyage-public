-- Voyage MVP RLS policies (non-destructive / repeatable)
--
-- 이 파일은 데이터, 테이블, 기존 정책을 삭제하지 않습니다.
-- Auth 없는 MVP에서 anon key가 CRUD할 수 있도록 공개 정책을 추가합니다.
-- 실제 개인 서비스 전환 시에는 Supabase Auth와 auth.uid() 기반 정책으로 교체하세요.

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'trips', 'places', 'expenses', 'travelers', 'checklist_items',
    'budget_items', 'reservations', 'schedule_items', 'reviews',
    'souvenirs', 'exchange_plans', 'weather_days'
  ] loop
    -- RLS가 이미 켜져 있으면 그대로 두고, 꺼져 있을 때만 활성화합니다.
    if not exists (
      select 1
      from pg_class
      where oid = to_regclass(format('public.%I', table_name))
        and relrowsecurity
    ) then
      execute format('alter table public.%I enable row level security', table_name);
    end if;

    foreach policy_name in array array[
      'voyage anon read', 'voyage anon insert',
      'voyage anon update', 'voyage anon delete'
    ] loop
      if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = table_name
          and policyname = policy_name
      ) then
        if policy_name = 'voyage anon read' then
          execute format('create policy %I on public.%I for select to anon using (true)', policy_name, table_name);
        elsif policy_name = 'voyage anon insert' then
          execute format('create policy %I on public.%I for insert to anon with check (true)', policy_name, table_name);
        elsif policy_name = 'voyage anon update' then
          execute format('create policy %I on public.%I for update to anon using (true) with check (true)', policy_name, table_name);
        else
          execute format('create policy %I on public.%I for delete to anon using (true)', policy_name, table_name);
        end if;
      end if;
    end loop;
  end loop;
end $$;
