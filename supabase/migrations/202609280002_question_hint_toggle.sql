alter table public.questions
add column if not exists hint_enabled boolean not null default false;
