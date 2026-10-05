-- 상세페이지 카탈로그 이미지(브랜드 공식 자료). 대표 사진(image_urls)과 따로 둔다.
alter table public.electronics_products add column if not exists detail_image_urls text[] not null default '{}';
comment on column public.electronics_products.detail_image_urls is '상세페이지 카탈로그 이미지(브랜드 공식 자료). 위에서 아래 순서.';
