-- Reconstructed baseline for the first migration recorded on the project.
-- The CREATE statements make a fresh database reproducible while remaining
-- compatible with the schema already present on the connected project.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.cards (
  id text primary key,
  promo text,
  name text not null,
  company text not null,
  type text,
  condition text,
  benefits jsonb,
  fees text,
  card_image_url text,
  detailed_benefits text,
  created_at timestamptz default now(),
  main_benefits jsonb,
  card_image_urls jsonb
);

alter table public.cards
  add column if not exists main_benefits jsonb;

alter table public.cards
  add column if not exists card_image_urls jsonb;

alter table public.cards enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cards'
      and policyname = 'Enable read access for all users'
  ) then
    create policy "Enable read access for all users"
      on public.cards
      for select
      to public
      using (true);
  end if;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  login_id text not null unique,
  password_hash text not null,
  unique_code text not null,
  nickname text not null,
  created_at timestamptz default now()
);

create table if not exists public.admin_invite_keys (
  key text primary key,
  expires_at timestamptz not null,
  created_by uuid references public.admin_users(id),
  is_used boolean default false,
  created_at timestamptz default now()
);
