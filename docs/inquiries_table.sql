-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_email  text not null,
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at  timestamptz not null default now()
);

-- 서비스 롤만 읽기/쓰기 (RLS 활성화, 일반 사용자 직접 접근 차단)
alter table public.inquiries enable row level security;

-- 일반 사용자: 자신의 문의만 insert 가능
create policy "Users can insert own inquiries"
  on public.inquiries for insert
  with check (auth.uid() = user_id);

-- 일반 사용자: 자신의 문의만 조회 가능
create policy "Users can view own inquiries"
  on public.inquiries for select
  using (auth.uid() = user_id);
