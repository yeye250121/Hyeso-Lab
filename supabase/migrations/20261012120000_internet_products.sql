-- 인터넷 가입 상품. 정책표(.dev/policy_table/internet_policy_table_2610) 를 통신사 × 속도 × 추가상품 조합 단위로 적재한다.
-- 가전렌탈과 같은 원칙: 수수료는 별도 테이블(RLS 정책 없음 = service_role 전용), 고객용 테이블은 anon 읽기만.

create table if not exists public.internet_carriers (
  id text primary key,                       -- kt, lgu, skt, skb, skylife, hellovision, lg-soho
  name text not null,                        -- 화면 표기명
  logo_url text,                             -- /internet/logos/<id>.svg
  product_note text,                         -- 정책표 "상품기준" (WiFi 포함 여부, 셋톱 기준)
  business_only boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.internet_products (
  id uuid primary key default gen_random_uuid(),
  carrier_id text not null references public.internet_carriers(id) on delete restrict,
  internet_name text not null,               -- 인터넷슬림, 광랜, 기가 …
  speed text not null,                       -- 100M, 160M, 200M, 500M, 1G
  speed_mbps integer not null check (speed_mbps > 0),
  -- none(인터넷 단독) / tv / phone / cctv. 추천 필터("TV 보세요?")가 이 값을 본다.
  addon_type text not null default 'none' check (addon_type in ('none', 'tv', 'phone', 'cctv')),
  addon_name text,                           -- TV베이직, 모든G, 070전화 … (단독이면 null)
  monthly_fee integer not null check (monthly_fee >= 0),  -- 정책표 금액 그대로(원)
  -- 고객에게 지급하는 현금 사은품. 관리자가 정한다. null 이면 "상담 시 안내".
  customer_gift integer check (customer_gift is null or customer_gift >= 0),
  -- 통신사(상위업체)가 지급하는 상품권. 정책표 "고객상품권".
  voucher integer check (voucher is null or voucher >= 0),
  is_recommended boolean not null default false,
  -- 정책표 비고상 "요금 및 정책 문의" 등 바로 노출할 수 없는 조합은 숨긴다
  is_active boolean not null default true,
  policy_set text not null default '2610',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (carrier_id, internet_name, speed, addon_type, addon_name)
);

create index if not exists internet_products_carrier_idx on public.internet_products (carrier_id, is_active);

create table if not exists public.internet_product_commissions (
  product_id uuid primary key references public.internet_products(id) on delete cascade,
  commission integer check (commission is null or commission >= 0),
  family_commission integer check (family_commission is null or family_commission >= 0),
  memo text,
  updated_at timestamptz not null default now()
);
comment on table public.internet_product_commissions is
  '내부 전용 수수료. RLS 정책 없음 = anon/authenticated 접근 불가. 서버(service_role)에서만 조회할 것.';

-- 추가정책·차감정책·환수규정 등 조합 단위가 아닌 정책 항목. 관리자 참고용.
create table if not exists public.internet_policy_notes (
  id uuid primary key default gen_random_uuid(),
  carrier_id text references public.internet_carriers(id) on delete cascade, -- null = 공통
  kind text not null,                        -- 추가정책 / 차감정책 / 환수규정 / 접수필수사항 …
  item text not null,
  amount integer,
  note text,
  policy_set text not null default '2610'
);
comment on table public.internet_policy_notes is '내부 전용. 수수료 가감 항목 포함. RLS 정책 없음 = service_role 전용.';

alter table public.internet_carriers enable row level security;
alter table public.internet_products enable row level security;
alter table public.internet_product_commissions enable row level security;
alter table public.internet_policy_notes enable row level security;

create policy "internet_carriers_public_read" on public.internet_carriers
  for select to anon, authenticated using (is_active);

create policy "internet_products_public_read" on public.internet_products
  for select to anon, authenticated using (is_active);
