-- 앱(Capacitor) 푸시 토큰. 콘솔에 로그인한 기기마다 한 줄. 같은 토큰으로 다른 계정이 로그인하면 주인이 바뀐다.
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  token text not null unique,
  app_version text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists push_devices_user_idx on public.push_devices (admin_user_id);
comment on table public.push_devices is '앱 푸시 토큰(APNs/FCM). RLS 정책 없음 = service_role 전용.';
alter table public.push_devices enable row level security;
