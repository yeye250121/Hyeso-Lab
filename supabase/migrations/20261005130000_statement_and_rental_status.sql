-- 신청서에 "렌탈 신규/기존" 을 받고, 명세서를 상위 렌탈업체에 전달한 시각을 기록한다.
alter table public.electronics_applications
  add column if not exists rental_status text check (rental_status is null or rental_status in ('신규', '기존')),
  add column if not exists existing_rental_note text,
  add column if not exists statement_sent_at timestamptz;
alter table public.leads add column if not exists statement_sent_at timestamptz;
comment on column public.electronics_applications.rental_status is '렌탈 신규/기존 사용 여부. 타사보상·결합 할인이 갈려서 상위 업체 상담에 가장 먼저 필요한 값.';
comment on column public.electronics_applications.statement_sent_at is '명세서를 상위 렌탈업체에 전달한 시각.';
comment on column public.leads.statement_sent_at is '명세서를 상위 렌탈업체에 전달한 시각.';
