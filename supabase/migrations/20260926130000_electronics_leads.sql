-- 명세서(리드)와 신청서를 분리한다.
--  · 명세서: 랜딩/상담 신청 폼. 전화번호만 필수. 협력업체에 넘기는 요청 내용.
--  · 신청서: 6단계 셀프 가입 폼. 알림톡으로 받은 링크를 타고 고객이 직접 작성한다.
-- 직전 마이그레이션(lead_form_columns)이 신청서 테이블에 얹었던 명세서 칼럼은 되돌린다.

alter table public.electronics_applications
  drop column if exists needs,
  drop column if exists preferred_contact_time,
  drop column if exists region_sido,
  drop column if exists region_sigungu,
  alter column applicant_name set not null;

create table if not exists public.electronics_leads (
  id uuid primary key default gen_random_uuid(),

  -- 명세서 내용. 정확한 요금제는 상담원이 다시 정하므로 방향만 담긴다.
  category_slug text,
  product_id uuid references public.electronics_products(id) on delete set null,
  plan_id uuid references public.electronics_product_plans(id) on delete set null,
  contract_months integer check (contract_months is null or contract_months > 0),
  care_type text,
  product_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(product_snapshot) = 'object'),
  needs jsonb not null default '{}'::jsonb
    check (jsonb_typeof(needs) = 'object'),

  -- 고객
  applicant_name text,
  phone_number text not null,
  agreed_required boolean not null default true,
  agreed_marketing boolean not null default false,

  -- 운영
  referrer_url text,
  marketer_code text not null default '',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'applied', 'closed')),
  alimtalk_sent_at timestamptz,
  application_id uuid references public.electronics_applications(id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.electronics_leads is
  '상담 신청(명세서). 협력업체가 전화하는 데 필요한 최소 정보. anon 접근 불가.';

alter table public.electronics_applications
  add column if not exists lead_id uuid references public.electronics_leads(id) on delete set null;

create index if not exists electronics_leads_status_idx
  on public.electronics_leads (status, submitted_at desc);
create index if not exists electronics_leads_phone_idx
  on public.electronics_leads (phone_number);

drop trigger if exists electronics_leads_set_updated_at on public.electronics_leads;
create trigger electronics_leads_set_updated_at
  before update on public.electronics_leads
  for each row execute function public.set_updated_at();

alter table public.electronics_leads enable row level security;
revoke all privileges on table public.electronics_leads from anon, authenticated;
grant all privileges on table public.electronics_leads to service_role;
