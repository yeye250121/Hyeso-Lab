-- 파트너스 전용 가입(승인제). 가입 신청 → 대표자 승인 → 로그인 가능.
alter table public.admin_users
  add column if not exists status text not null default 'active'
  check (status in ('pending', 'active', 'rejected', 'disabled'));
alter table public.admin_users add column if not exists bank_name text;
alter table public.admin_users add column if not exists bank_account text;
alter table public.admin_users add column if not exists account_holder text;
alter table public.admin_users add column if not exists channel_url text;
alter table public.admin_users add column if not exists applied_at timestamptz;
alter table public.admin_users add column if not exists reviewed_at timestamptz;
alter table public.admin_users add column if not exists reviewed_by uuid references public.admin_users(id) on delete set null;
comment on column public.admin_users.status is 'pending(승인 대기) / active / rejected / disabled. active 만 로그인 가능.';
comment on column public.admin_users.bank_account is '파트너스 정산 계좌. 관리자 화면에서는 가려서 보여준다.';
