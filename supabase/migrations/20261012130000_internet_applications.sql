-- 인터넷 셀프 가입 신청서. 계좌번호 등 민감정보를 포함하므로 RLS 정책 없음(anon/authenticated 접근 불가).
-- 제출은 /api/internet/applications 가 service_role 로 처리한다.
create table if not exists public.internet_applications (
  id uuid primary key default gen_random_uuid(),

  -- 1. 상품
  product_id uuid references public.internet_products(id) on delete set null,
  decide_after_consult boolean not null default false,
  product_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(product_snapshot) = 'object'),

  -- 2. 연락처
  applicant_is_self boolean not null default true,
  applicant_name text not null,
  phone_carrier text,
  phone_number text not null,

  -- 3. 가입 정보
  customer_type text not null default '개인' check (customer_type in ('개인', '개인사업자', '법인사업자', '외국인')),
  business_name text,
  business_number text,
  current_internet text check (current_internet is null or current_internet in ('none', 'using')),
  current_carrier text,
  has_mobile_bundle boolean,
  zonecode text,
  address text,
  address_detail text,
  email text,

  -- 4. 사은품
  gift_skipped boolean not null default false,
  gift_receiver text,
  gift_bank text,
  gift_account_number text,

  -- 5. 납부
  payment_skipped boolean not null default false,
  payment_payer text,
  payment_same_as_gift boolean not null default false,
  payment_bank text,
  payment_account_number text,

  -- 6. 동의·기타
  agreed_required boolean not null default false,
  agreed_marketing boolean not null default false,
  customer_note text,
  -- 건너뛴 항목이 하나라도 있으면 true. 해피콜에서 보완한다.
  needs_followup boolean not null default false,

  status text not null default 'new' check (status in ('new', 'in_progress', 'contracted', 'cancelled')),
  admin_memo text,
  statement_sent_at timestamptz,
  referrer_url text,
  lead_id uuid references public.leads(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internet_applications_status_idx on public.internet_applications (status, submitted_at desc);

create trigger internet_applications_set_updated_at
  before update on public.internet_applications
  for each row execute function public.set_updated_at();

alter table public.internet_applications enable row level security;
