-- 가전렌탈(Electronics Rental) 스키마.
--
-- 설계 요지
--  1) 카테고리는 자기참조 트리다. 대분류(주방/생활/공기) 아래 소분류(정수기 등)를
--     두고, URL 은 소분류 slug 하나로 라우팅한다. 카테고리를 추가할 때 코드를
--     건드리지 않고 데이터만 넣으면 되도록 filter_schema 를 카테고리가 들고 있다.
--  2) 제품(모델)과 요금제(약정 x 관리방법 x 구분)를 분리한다. 정책표에서 모델 하나가
--     평균 15개 요금제로 갈라지기 때문에 한 테이블로는 표현이 안 된다.
--  3) 수수료(우리 마진)는 electronics_plan_commissions 로 물리적으로 분리하고
--     anon/authenticated 의 권한을 통째로 회수한다. 요금제 테이블을 select * 해도
--     절대 따라오지 않게 하려는 것이 목적이다.

create table if not exists public.electronics_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.electronics_categories(id) on delete cascade,
  slug text not null unique,
  name text not null,
  icon_url text,
  description text,
  display_order integer not null default 0,
  -- 이 카테고리의 필터 축 정의. 목록 페이지의 필터 UI 가 이걸 읽어 렌더링한다.
  -- [{ "key": "purifyFunction", "label": "정수기능",
  --    "options": ["정수전용", "냉정", "온정", "냉온정", "얼음", "냉온정+얼음"] }]
  filter_schema jsonb not null default '[]'::jsonb
    check (jsonb_typeof(filter_schema) = 'array'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.electronics_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.electronics_categories(id) on delete restrict,
  brand text not null,
  model_code text not null,
  slug text not null unique,
  display_name text not null,
  description text,
  image_urls text[] not null default '{}',
  -- 카테고리별 스펙. 정수기는 productType/purifyFunction/waterType/colors 등.
  -- 카테고리마다 축이 달라 컬럼으로 고정하지 않는다.
  specs jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specs) = 'object'),
  review_count integer not null default 0 check (review_count >= 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, model_code)
);

create table if not exists public.electronics_product_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.electronics_products(id) on delete cascade,
  contract_months integer not null check (contract_months > 0),
  -- 방문관리 / 자가관리 / 관리없음. 정책표에 정보가 없는 브랜드가 있어 null 을 허용한다.
  care_type text check (care_type is null or care_type in ('방문관리', '자가관리', '관리없음')),
  care_cycle_months integer check (care_cycle_months is null or care_cycle_months > 0),
  -- 일반 / 패키지 / 타사보상 / 신규결합 등 브랜드별 판매 구분
  plan_variant text not null default '일반',
  monthly_fee integer not null check (monthly_fee >= 0),
  list_price integer check (list_price is null or list_price >= 0),
  ownership_months integer check (ownership_months is null or ownership_months > 0),
  promotion_note text,
  -- 브랜드 고유 항목(리스구분, 규정코드, Suffix, SKU명 등)
  extra jsonb not null default '{}'::jsonb
    check (jsonb_typeof(extra) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 우리가 남기는 수수료. 고객에게 절대 노출되면 안 되므로 테이블 자체를 분리한다.
create table if not exists public.electronics_plan_commissions (
  plan_id uuid primary key
    references public.electronics_product_plans(id) on delete cascade,
  commission integer check (commission is null or commission >= 0),
  memo text,
  updated_at timestamptz not null default now()
);

comment on table public.electronics_plan_commissions is
  '내부 전용 수수료. anon/authenticated 권한 없음. 서버(service_role)에서만 조회할 것.';

-- 6단계 렌탈 신청서. 계좌번호/생년월일 등 민감정보를 포함하므로
-- anon 은 어떤 권한도 갖지 않는다. 제출은 서버 라우트가 service_role 로 처리한다.
create table if not exists public.electronics_applications (
  id uuid primary key default gen_random_uuid(),

  -- 1단계: 상품 및 가입조건
  product_id uuid references public.electronics_products(id) on delete set null,
  plan_id uuid references public.electronics_product_plans(id) on delete set null,
  decide_after_consult boolean not null default false,
  contract_months integer check (contract_months is null or contract_months > 0),
  care_type text,
  product_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(product_snapshot) = 'object'),

  -- 2단계: 가입자 정보
  customer_type text not null default '개인'
    check (customer_type in ('개인', '개인사업자', '법인사업자', '외국인')),
  applicant_name text not null,
  birth_date date,
  gender text check (gender is null or gender in ('남성', '여성')),
  carrier text,
  phone_number text not null,
  agent_phone_number text,
  email text,

  -- 3단계: 설치 주소
  zonecode text,
  address text,
  address_detail text,

  -- 4단계: 사은품 수령
  gift_receiver text,
  gift_bank text,
  gift_account_number text,

  -- 5단계: 납부 방법 (건너뛸 수 있다)
  payment_method text
    check (payment_method is null or payment_method in ('은행 자동이체', '카드 결제')),
  payment_bank text,
  payment_account_number text,
  payment_same_as_gift boolean not null default false,

  -- 6단계: 약관
  agreed_required boolean not null default false,
  agreed_marketing boolean not null default false,
  customer_note text,

  -- 운영
  referrer_url text,
  marketer_code text not null default '',
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'contracted', 'cancelled')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.electronics_applications.gift_account_number is
  '민감정보. 평문 저장 중 — 암호화/보관기간 정책은 후속 과제.';
comment on column public.electronics_applications.payment_account_number is
  '민감정보. 평문 저장 중 — 암호화/보관기간 정책은 후속 과제.';

-- 인덱스
create index if not exists electronics_categories_parent_idx
  on public.electronics_categories (parent_id, display_order);
create index if not exists electronics_products_category_idx
  on public.electronics_products (category_id, display_order);
create index if not exists electronics_products_brand_idx
  on public.electronics_products (brand);
-- specs 는 JSONB 필터(제품유형/정수기능/정수타입)에 쓰이므로 GIN 이 필요하다
create index if not exists electronics_products_specs_idx
  on public.electronics_products using gin (specs jsonb_path_ops);
create index if not exists electronics_plans_product_idx
  on public.electronics_product_plans (product_id, contract_months);
-- 목록의 "월 최저가" 계산용
create index if not exists electronics_plans_fee_idx
  on public.electronics_product_plans (product_id, monthly_fee);
create index if not exists electronics_applications_status_idx
  on public.electronics_applications (status, submitted_at desc);
create index if not exists electronics_applications_marketer_idx
  on public.electronics_applications (marketer_code);

-- updated_at 트리거 (public.set_updated_at 은 기존 마이그레이션에서 생성됨)
drop trigger if exists electronics_categories_set_updated_at on public.electronics_categories;
create trigger electronics_categories_set_updated_at
  before update on public.electronics_categories
  for each row execute function public.set_updated_at();

drop trigger if exists electronics_products_set_updated_at on public.electronics_products;
create trigger electronics_products_set_updated_at
  before update on public.electronics_products
  for each row execute function public.set_updated_at();

drop trigger if exists electronics_plans_set_updated_at on public.electronics_product_plans;
create trigger electronics_plans_set_updated_at
  before update on public.electronics_product_plans
  for each row execute function public.set_updated_at();

drop trigger if exists electronics_applications_set_updated_at on public.electronics_applications;
create trigger electronics_applications_set_updated_at
  before update on public.electronics_applications
  for each row execute function public.set_updated_at();

-- RLS
alter table public.electronics_categories enable row level security;
alter table public.electronics_products enable row level security;
alter table public.electronics_product_plans enable row level security;
alter table public.electronics_plan_commissions enable row level security;
alter table public.electronics_applications enable row level security;

-- 카탈로그 3종은 공개 읽기 (cards 와 동일한 패턴)
revoke insert, update, delete, truncate, references, trigger
  on table public.electronics_categories from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.electronics_products from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.electronics_product_plans from anon, authenticated;

grant select on table public.electronics_categories to anon, authenticated;
grant select on table public.electronics_products to anon, authenticated;
grant select on table public.electronics_product_plans to anon, authenticated;

drop policy if exists "electronics_categories_public_read" on public.electronics_categories;
create policy "electronics_categories_public_read"
  on public.electronics_categories for select
  to anon, authenticated
  using (is_active);

drop policy if exists "electronics_products_public_read" on public.electronics_products;
create policy "electronics_products_public_read"
  on public.electronics_products for select
  to anon, authenticated
  using (is_active);

drop policy if exists "electronics_plans_public_read" on public.electronics_product_plans;
create policy "electronics_plans_public_read"
  on public.electronics_product_plans for select
  to anon, authenticated
  using (is_active);

-- 수수료와 신청서는 클라이언트에서 접근 불가
revoke all privileges on table public.electronics_plan_commissions from anon, authenticated;
revoke all privileges on table public.electronics_applications from anon, authenticated;

grant all privileges on table public.electronics_categories to service_role;
grant all privileges on table public.electronics_products to service_role;
grant all privileges on table public.electronics_product_plans to service_role;
grant all privileges on table public.electronics_plan_commissions to service_role;
grant all privileges on table public.electronics_applications to service_role;
