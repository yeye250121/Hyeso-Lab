-- 파트너 랜딩(/m/<코드>): 1차 여과 답변과 방문 기록
alter table public.leads add column if not exists existing_service text check (existing_service is null or existing_service in ('new', 'existing'));
comment on column public.leads.existing_service is '랜딩에서 답한 신규/기존 이용 여부 (new: 처음, existing: 쓰는 중)';

create table if not exists public.landing_views (
  id uuid primary key default gen_random_uuid(),
  marketer_code text not null,
  service text,
  created_at timestamptz not null default now()
);
create index if not exists landing_views_code_created_idx on public.landing_views (marketer_code, created_at desc);
alter table public.landing_views enable row level security;
comment on table public.landing_views is '파트너 랜딩 방문 기록. 파트너 홈 퍼널(방문→접수)용';
