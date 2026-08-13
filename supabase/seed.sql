-- Run after schema.sql for a local/demo Supabase workspace.
-- IDs are stable so the app can open /trips/tokyo.
insert into trips (id, title, country, city, latitude, longitude, start_date, end_date, status)
values ('00000000-0000-0000-0000-000000000001', 'Tokyo autumn escape', 'Japan', 'Tokyo', 35.6762, 139.6503, '2026-09-10', '2026-09-15', 'planning')
on conflict (id) do nothing;

insert into travelers (id, trip_id, name) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Minji'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Jisu')
on conflict (id) do nothing;

insert into places (id, trip_id, name, type, address, latitude, longitude, expected_cost, visit_date, must_go, visited, memo) values
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Tsukiji Outer Market', 'Restaurant', '4 Chome-16-2 Tsukiji', 35.6655, 139.7708, 5000, '2026-09-10', false, false, 'Breakfast'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'TeamLab Borderless', 'Activity', 'Azabudai Hills', 35.6626, 139.7388, 3800, '2026-09-10', true, false, 'Tickets booked'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Shibuya Sky', 'Sightseeing', 'Shibuya Scramble Square', 35.6580, 139.7016, 2500, '2026-09-10', true, false, 'Sunset view')
on conflict (id) do nothing;

insert into checklist_items (trip_id, kind, category, name, checked) values
  ('00000000-0000-0000-0000-000000000001', 'packing', 'Basics', 'Passport', true),
  ('00000000-0000-0000-0000-000000000001', 'packing', 'Basics', 'Charger', false),
  ('00000000-0000-0000-0000-000000000001', 'preparation', 'Before you go', 'Activate eSIM', false),
  ('00000000-0000-0000-0000-000000000001', 'preparation', 'Money', 'Exchange some cash', false);

insert into budget_items (trip_id, category, estimated_amount, currency) values
  ('00000000-0000-0000-0000-000000000001', 'Flights', 620000, 'KRW'),
  ('00000000-0000-0000-0000-000000000001', 'Accommodation', 840000, 'KRW'),
  ('00000000-0000-0000-0000-000000000001', 'Food', 420000, 'KRW');

insert into reservations (trip_id, type, title, date, cost, memo) values
  ('00000000-0000-0000-0000-000000000001', 'Stay', 'K5 Hotel', '2026-09-10', 840000, 'Booking.com · confirmation K5TOKYO');

insert into schedule_items (trip_id, place_id, date, time, type, title, note, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', '2026-09-10', '09:00', 'Food', 'Breakfast at Tsukiji', null, 0),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', '2026-09-10', '11:30', 'Activity', 'TeamLab Borderless', 'Must Go', 1),
  ('00000000-0000-0000-0000-000000000001', null, '2026-09-10', '15:00', 'Stay', 'Check in at K5 Hotel', null, 2);

insert into expenses (trip_id, place_id, payer_id, amount, currency, category, memo, spent_at) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', 2500, 'JPY', 'Food', 'Breakfast', '2026-09-10T09:30:00Z');

insert into souvenirs (trip_id, name, estimated_price, purchased, actual_price, memo) values
  ('00000000-0000-0000-0000-000000000001', 'Ceramic ramen bowl', 2800, false, 0, 'Kappabashi'),
  ('00000000-0000-0000-0000-000000000001', 'Matcha KitKat', 900, true, 780, 'Airport');

insert into exchange_plans (trip_id, from_currency, to_currency, rate, expected_cash, card_estimate, planned_exchange, actual_exchange)
values ('00000000-0000-0000-0000-000000000001', 'KRW', 'JPY', 0.11, 80000, 120000, 90000, 0)
on conflict (trip_id) do nothing;

insert into weather_days (trip_id, date, temperature, condition, icon) values
  ('00000000-0000-0000-0000-000000000001', '2026-09-10', 28, 'Sunny', '☀'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-11', 24, 'Cloudy', '☁'),
  ('00000000-0000-0000-0000-000000000001', '2026-09-12', 26, 'Light rain', '🌦');
