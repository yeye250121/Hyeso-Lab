-- 사이트 방문 기록(자체 수집). Vercel Analytics 는 1개월만 보관하므로 장기 추이는 여기서 본다.
-- 개인을 식별하지 않는다: visitor 는 브라우저에 심은 무작위 쿠키 값, 경로·유입처·기기·파트너 코드만 남긴다.
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  marketer_code text,
  visitor text,
  device text,
  is_new boolean not null default false
);
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_code_created_idx on public.page_views (marketer_code, created_at desc) where marketer_code is not null;
create index if not exists page_views_path_created_idx on public.page_views (path, created_at desc);
alter table public.page_views enable row level security;
comment on table public.page_views is '공개 페이지 방문 로그(관리자 콘솔·명세서 제외). 대시보드 방문 추이·파트너 링크 유입 집계용';

-- 일별 방문자·페이지뷰 (한국 시간 기준). p_code 가 있으면 그 파트너 유입만
create or replace function public.traffic_daily(p_from timestamptz, p_to timestamptz, p_code text default null)
returns table(day date, pageviews bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select (created_at at time zone 'Asia/Seoul')::date as day,
         count(*) as pageviews,
         count(distinct visitor) as visitors
  from page_views
  where created_at >= p_from and created_at < p_to
    and (p_code is null or marketer_code = p_code)
  group by 1 order by 1
$$;

-- 차원별 상위 항목: dim = 'path' | 'referrer' | 'partner' | 'utm_source' | 'device'
create or replace function public.traffic_top(p_from timestamptz, p_to timestamptz, p_dim text, p_limit int default 10, p_code text default null)
returns table(key text, pageviews bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(case p_dim
           when 'path' then path
           when 'referrer' then referrer_host
           when 'partner' then marketer_code
           when 'utm_source' then utm_source
           when 'device' then device
         end, '(없음)') as key,
         count(*) as pageviews,
         count(distinct visitor) as visitors
  from page_views
  where created_at >= p_from and created_at < p_to
    and (p_code is null or marketer_code = p_code)
    and (p_dim <> 'partner' or marketer_code is not null)
  group by 1 order by 2 desc limit p_limit
$$;

revoke all on function public.traffic_daily(timestamptz, timestamptz, text) from public, anon;
revoke all on function public.traffic_top(timestamptz, timestamptz, text, int, text) from public, anon;
