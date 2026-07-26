alter table public.cards
  add column if not exists official_product_url text,
  add column if not exists application_url text,
  add column if not exists official_product_url_verified_at timestamptz;

comment on column public.cards.official_product_url is
  '카드사 공식 도메인의 비제휴 상품 상세 페이지 URL';

comment on column public.cards.application_url is
  '제휴·프로모션 파라미터를 포함할 수 있는 카드 신청 경로';

comment on column public.cards.official_product_url_verified_at is
  '공식 상품 URL의 마지막 정상 응답 및 상품명 검증 시각';

alter table public.cards
  drop constraint if exists cards_official_product_url_format,
  add constraint cards_official_product_url_format
    check (
      official_product_url is null
      or official_product_url ~ '^https?://'
    ),
  drop constraint if exists cards_application_url_format,
  add constraint cards_application_url_format
    check (
      application_url is null
      or application_url ~ '^https?://'
    );
