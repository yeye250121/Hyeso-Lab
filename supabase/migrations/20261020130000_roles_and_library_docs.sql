-- 구성원 역할 + 교육자료 라이브러리.
-- 역할: owner(대표자) / admin(관리자) / marketer(외부 마케터). 라이브러리 열람은 전원, 편집은 owner·admin.
alter table public.admin_users
  add column if not exists role text not null default 'admin'
  check (role in ('owner', 'admin', 'marketer'));

alter table public.admin_invite_keys
  add column if not exists role text not null default 'admin'
  check (role in ('owner', 'admin', 'marketer'));

-- 초대키의 역할을 가입 계정에 물려준다
create or replace function public.register_admin_with_invite(
  p_invite_key text,
  p_login_id text,
  p_password_hash text,
  p_nickname text
)
returns table (
  user_id uuid,
  user_login_id text,
  user_nickname text,
  user_unique_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.admin_users%rowtype;
  v_role text;
begin
  update public.admin_invite_keys
  set is_used = true
  where key = p_invite_key
    and is_used = false
    and expires_at > now()
  returning role into v_role;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'invalid_or_expired_invite_key';
  end if;

  insert into public.admin_users (login_id, password_hash, unique_code, nickname, role)
  values (
    p_login_id,
    p_password_hash,
    'S-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    p_nickname,
    coalesce(v_role, 'admin')
  )
  returning * into v_user;

  return query
  select v_user.id, v_user.login_id, v_user.nickname, v_user.unique_code;
end;
$$;

-- 라이브러리 문서(트리). 본문은 편집기 HTML, 검색용으로 태그를 뺀 텍스트를 따로 둔다.
create table if not exists public.library_docs (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.library_docs(id) on delete cascade,
  title text not null default '제목 없음',
  emoji text,
  content text not null default '',
  content_text text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references public.admin_users(id) on delete set null,
  updated_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists library_docs_parent_idx on public.library_docs (parent_id, sort_order);
create index if not exists library_docs_search_idx on public.library_docs using gin (to_tsvector('simple', title || ' ' || content_text));
create trigger library_docs_set_updated_at
  before update on public.library_docs
  for each row execute function public.set_updated_at();
comment on table public.library_docs is '교육자료 라이브러리. RLS 정책 없음 = service_role 전용. 열람은 전 구성원, 편집은 owner·admin.';
alter table public.library_docs enable row level security;

-- 기존 두 계정은 운영 DB 에서 직접 owner 로 지정했다(마이그레이션에는 싣지 않음).
