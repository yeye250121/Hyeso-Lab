-- 관리자 내부 채팅 + 프로필 사진
alter table public.admin_users add column if not exists avatar_url text;

create table if not exists public.admin_chat_messages (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists admin_chat_messages_created_idx on public.admin_chat_messages (id desc);

-- 서버(service role)만 읽고 쓴다. 정책을 두지 않아 anon/authenticated 는 접근할 수 없다.
alter table public.admin_chat_messages enable row level security;
