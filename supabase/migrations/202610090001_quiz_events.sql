-- Quiz participation events for the Baby Fair kiosk statistics in /admin.
-- Anonymous visitors may only INSERT; only @hanwha.plus admins may read.

create table if not exists public.quiz_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('start', 'answer', 'complete', 'qr_open', 'home')),
  round_id uuid not null,
  device_id text check (device_id is null or length(device_id) <= 64),
  question_id text check (question_id is null or length(question_id) <= 64),
  question_index smallint check (question_index is null or question_index between 0 and 9),
  is_correct boolean,
  score smallint check (score is null or score between 0 and 10),
  result_level smallint check (result_level is null or result_level between 0 and 9),
  stage text check (stage is null or stage in ('quiz', 'result')),
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms between 0 and 86400000),
  client_at timestamptz
);

create index if not exists quiz_events_created_at_idx on public.quiz_events (created_at);
create index if not exists quiz_events_type_created_at_idx on public.quiz_events (event_type, created_at);

alter table public.quiz_events enable row level security;

drop policy if exists "Anyone inserts quiz events" on public.quiz_events;
create policy "Anyone inserts quiz events"
on public.quiz_events for insert
to anon, authenticated
with check (true);

drop policy if exists "Hanwha admins read quiz events" on public.quiz_events;
create policy "Hanwha admins read quiz events"
on public.quiz_events for select
to authenticated
using (public.is_hanwha_admin());

drop policy if exists "Hanwha admins delete quiz events" on public.quiz_events;
create policy "Hanwha admins delete quiz events"
on public.quiz_events for delete
to authenticated
using (public.is_hanwha_admin());

grant insert on public.quiz_events to anon, authenticated;
grant select, delete on public.quiz_events to authenticated;
