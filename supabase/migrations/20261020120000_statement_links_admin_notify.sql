-- 담당자 전용 명세서 링크, 관리자 알림 설정, 사은품 안내 금액.
alter table public.admin_users add column if not exists phone text;
alter table public.admin_users add column if not exists notify_leads boolean not null default false;
comment on column public.admin_users.notify_leads is '새 상담 신청 알림톡을 받을지';

alter table public.leads add column if not exists gift_amount integer check (gift_amount is null or gift_amount >= 0);
alter table public.electronics_applications add column if not exists gift_amount integer check (gift_amount is null or gift_amount >= 0);
alter table public.internet_applications add column if not exists gift_amount integer check (gift_amount is null or gift_amount >= 0);
comment on column public.electronics_applications.gift_amount is '담당자에게 안내한 고객 사은품 금액(원). 관리자가 명세서 전달 시 입력.';

-- 담당자가 알림톡 버튼으로 여는 명세서 링크. 토큰은 추측 불가, 기본 120시간 뒤 만료.
create table if not exists public.statement_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  kind text not null check (kind in ('lead', 'electronics_application', 'internet_application')),
  ref_id uuid not null,
  created_by uuid references public.admin_users(id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists statement_links_ref_idx on public.statement_links (kind, ref_id, created_at desc);
comment on table public.statement_links is '담당자 전용 명세서 링크. RLS 정책 없음 = service_role 전용. /s/<token> 이 조회한다.';
alter table public.statement_links enable row level security;

-- 관리자 전화번호·알림 설정은 운영 DB 에서 직접 입력한다(마이그레이션에는 싣지 않음).
