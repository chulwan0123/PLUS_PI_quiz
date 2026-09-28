create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null check (length(trim(question_text)) > 0),
  display_lines text[] not null check (cardinality(display_lines) between 1 and 3),
  correct_answer boolean not null,
  explanation text not null check (length(trim(explanation)) > 0),
  hint_enabled boolean not null default false,
  hint_text text not null default '',
  hint_image_url text,
  hint_image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create or replace function public.is_hanwha_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and email_confirmed_at is not null
      and lower(email) ~ '^[^@]+@hanwha\.plus$'
  );
$$;

revoke all on function public.is_hanwha_admin() from public;
grant execute on function public.is_hanwha_admin() to authenticated;

alter table public.questions enable row level security;

drop policy if exists "Public reads active questions" on public.questions;
create policy "Public reads active questions"
on public.questions for select
to anon, authenticated
using (is_active = true or public.is_hanwha_admin());

drop policy if exists "Hanwha admins insert questions" on public.questions;
create policy "Hanwha admins insert questions"
on public.questions for insert
to authenticated
with check (public.is_hanwha_admin());

drop policy if exists "Hanwha admins update questions" on public.questions;
create policy "Hanwha admins update questions"
on public.questions for update
to authenticated
using (public.is_hanwha_admin())
with check (public.is_hanwha_admin());

drop policy if exists "Hanwha admins delete questions" on public.questions;
create policy "Hanwha admins delete questions"
on public.questions for delete
to authenticated
using (public.is_hanwha_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hint-images',
  'hint-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Hanwha admins upload hint images" on storage.objects;
create policy "Hanwha admins upload hint images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'hint-images' and public.is_hanwha_admin());

drop policy if exists "Hanwha admins read hint image metadata" on storage.objects;
create policy "Hanwha admins read hint image metadata"
on storage.objects for select
to authenticated
using (bucket_id = 'hint-images' and public.is_hanwha_admin());

drop policy if exists "Hanwha admins update hint images" on storage.objects;
create policy "Hanwha admins update hint images"
on storage.objects for update
to authenticated
using (bucket_id = 'hint-images' and public.is_hanwha_admin())
with check (bucket_id = 'hint-images' and public.is_hanwha_admin());

drop policy if exists "Hanwha admins delete hint images" on storage.objects;
create policy "Hanwha admins delete hint images"
on storage.objects for delete
to authenticated
using (bucket_id = 'hint-images' and public.is_hanwha_admin());

insert into public.questions (
  question_text,
  display_lines,
  correct_answer,
  explanation,
  sort_order
)
values
  ('미성년 자녀는 직계존속에게 10년간 2천만 원까지 증여재산공제를 받을 수 있다.', array['미성년 자녀는 직계존속에게', '10년간 2천만 원까지', '증여재산공제를 받을 수 있다.'], true, '미성년 자녀는 직계존속 증여 시 10년간 합산해 2천만 원까지 공제받을 수 있어요.', 1),
  ('자녀에게 증여하려면 큰 목돈을 한 번에 준비해야 한다.', array['자녀에게 증여하려면', '큰 목돈을 한 번에', '준비해야 한다.'], false, '목돈을 한 번에 증여하거나 매달 나눠 증여하는 계획을 세울 수 있어요.', 2),
  ('PLUS 파이는 증여 계획만 세우는 앱이라 투자와는 연결되지 않는다.', array['PLUS 파이는 증여 계획만', '세우는 앱이라 투자와는', '연결되지 않는다.'], false, 'PLUS 파이는 증여 계획을 세우고 증여금을 투자와 연결하도록 도와줘요.', 3),
  ('PLUS 파이에서는 증여금을 미국 ETF 투자와 연결할 수 있다.', array['PLUS 파이에서는 증여금을', '미국 ETF 투자와', '연결할 수 있다.'], true, '증여금을 미국 대표 기업에 분산 투자하는 ETF와 연결할 수 있어요.', 4),
  ('PLUS 파이 패키지를 이용해도 신고 서류는 모두 직접 준비해야 한다.', array['PLUS 파이 패키지를 이용해도', '신고 서류는 모두', '직접 준비해야 한다.'], false, '거래내역서와 증여금 평가 명세서 등 신고에 필요한 서류 준비를 도와줘요.', 5)
on conflict do nothing;
