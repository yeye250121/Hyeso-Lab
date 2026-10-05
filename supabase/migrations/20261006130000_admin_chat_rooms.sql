-- 관리자 채팅을 방 단위로 바꾼다: 공지(전원) · 1:1 · 그룹
create table if not exists public.admin_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('notice', 'direct', 'group')),
  name text,
  -- 1:1 방은 두 사람 id 를 정렬해 이어 붙인 값으로 하나만 만들어지게 한다
  direct_key text unique,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_chat_members (
  room_id uuid not null references public.admin_chat_rooms(id) on delete cascade,
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  last_read_id bigint not null default 0,
  joined_at timestamptz not null default now(),
  primary key (room_id, admin_id)
);
create index if not exists admin_chat_members_admin_idx on public.admin_chat_members (admin_id);

-- 기존 메시지 표(아직 글 없음)에 방을 붙인다
alter table public.admin_chat_messages
  add column if not exists room_id uuid not null references public.admin_chat_rooms(id) on delete cascade;
create index if not exists admin_chat_messages_room_idx on public.admin_chat_messages (room_id, id desc);

-- 서버(service role)만 읽고 쓴다. 정책을 두지 않아 anon/authenticated 는 접근할 수 없다.
alter table public.admin_chat_rooms enable row level security;
alter table public.admin_chat_members enable row level security;

-- 공지방은 하나. 모든 관리자가 자동으로 본다(구성원 행은 읽음 위치를 적을 때 생긴다).
insert into public.admin_chat_rooms (type, name)
select 'notice', '공지' where not exists (select 1 from public.admin_chat_rooms where type = 'notice');

-- 내 방 목록: 마지막 글, 안 읽은 수, 구성원
create or replace function public.admin_chat_overview(p_admin uuid)
returns table (
  room_id uuid,
  type text,
  name text,
  member_ids uuid[],
  last_body text,
  last_at timestamptz,
  last_author uuid,
  unread bigint,
  created_at timestamptz
)
language sql
stable
set search_path = public
as $$
  select r.id, r.type, r.name,
    coalesce((select array_agg(m.admin_id) from admin_chat_members m where m.room_id = r.id), '{}'),
    lm.body, lm.created_at, lm.admin_id,
    (select count(*) from admin_chat_messages x
      where x.room_id = r.id and x.id > coalesce(me.last_read_id, 0) and x.admin_id <> p_admin),
    r.created_at
  from admin_chat_rooms r
  left join admin_chat_members me on me.room_id = r.id and me.admin_id = p_admin
  left join lateral (
    select body, created_at, admin_id from admin_chat_messages where room_id = r.id order by id desc limit 1
  ) lm on true
  where r.type = 'notice' or me.admin_id is not null;
$$;
revoke all on function public.admin_chat_overview(uuid) from public, anon, authenticated;
grant execute on function public.admin_chat_overview(uuid) to service_role;
