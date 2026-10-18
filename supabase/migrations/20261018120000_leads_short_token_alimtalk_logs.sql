-- 알림톡 링크용 짧은 토큰과 발송 로그.
-- 알림톡 버튼 URL 은 https://www.hyeso.kr/c/<short_token> 으로 고정 도메인 + 변수 경로를 쓴다.
alter table public.leads add column if not exists short_token text;
alter table public.leads add column if not exists alimtalk_error text;
create unique index if not exists leads_short_token_idx on public.leads (short_token) where short_token is not null;
comment on column public.leads.short_token is '알림톡 링크용 8자리 토큰(/c/<token>). 추측 불가, 대소문자 구분.';
comment on column public.leads.alimtalk_error is '마지막 알림톡 발송 실패 사유. 성공하면 null.';

create table if not exists public.alimtalk_logs (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,                     -- application_link / application_received / statement_sent …
  lead_id uuid references public.leads(id) on delete set null,
  application_ref text,                      -- 서비스별 신청서 id (fk 없이 문자열)
  to_phone text not null,
  template_id text not null,
  variables jsonb not null default '{}'::jsonb,
  success boolean not null,
  provider_group_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists alimtalk_logs_lead_idx on public.alimtalk_logs (lead_id, created_at desc);
comment on table public.alimtalk_logs is '알림톡 발송 기록(솔라피). RLS 정책 없음 = service_role 전용.';
alter table public.alimtalk_logs enable row level security;
