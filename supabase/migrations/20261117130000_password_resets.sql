-- 비밀번호 재설정 링크. 토큰은 해시로만 저장한다(DB 가 새도 링크를 못 만든다). 30분 유효, 1회용.
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  requested_ip text,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on public.password_resets (admin_user_id, created_at desc);
comment on table public.password_resets is '구성원 비밀번호 재설정 토큰(해시). RLS 정책 없음 = service_role 전용.';
alter table public.password_resets enable row level security;
