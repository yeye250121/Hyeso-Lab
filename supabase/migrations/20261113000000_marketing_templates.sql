-- 이미지 센터 "템플릿": 블로그 등에 그대로 붙여 쓰는 이미지 묶음.
-- 스토리지 키는 ASCII 만 허용돼서 한글 파일명은 여기 매니페스트에 둔다(ZIP·개별 저장 시 원래 이름으로 복원).
create table if not exists public.marketing_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- 표시 이름·ZIP 파일명 (예: 혜소_가전렌탈_블로그템플릿_01)
  folder text not null unique,        -- 스토리지 폴더 (templates/<folder>/)
  files jsonb not null default '[]',  -- [{ key, name, size, width, height, type }]
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.marketing_templates is '이미지 센터 템플릿 묶음. RLS 정책 없음 = service_role 전용.';
alter table public.marketing_templates enable row level security;
