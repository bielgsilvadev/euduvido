-- =============================================================================
-- Eu Duvido! — Bootstrap mínimo para Supabase NOVO (sem tabelas ainda)
-- =============================================================================
-- Corrige: GET .../rest/v1/profiles → 404 (tabela inexistente).
--
-- Onde correr: Supabase Dashboard → SQL Editor → New query → colar → Run
--
-- Ordem recomendada:
--   1) Este ficheiro (profiles + follows + trigger de signup)
--   2) migrations/20260329130000_eu_duvido_challenges.sql (desafios, reações, etc.)
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users) — o que a app espera em fetchProfile / AuthContext
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  points integer not null default 0,
  level integer not null default 1,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  last_workout_at timestamptz,
  last_activity_date date,
  onboarding_completed boolean not null default false,
  push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_len check (char_length(username) >= 3)
);

-- ---------------------------------------------------------------------------
-- Seguidores (usado no perfil / explore)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Criar linha em profiles automaticamente após signup (Auth)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_name text;
begin
  base_name := nullif(trim(new.raw_user_meta_data->>'username'), '');
  if base_name is null or char_length(base_name) < 3 then
    base_name := 'user_' || left(replace(gen_random_uuid()::text, '-', ''), 12);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_name,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  );
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (
      new.id,
      'user_' || left(replace(gen_random_uuid()::text, '-', ''), 12),
      coalesce(
        nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
        'Atleta'
      )
    );
    return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.follows enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Follows readable" on public.follows;
create policy "Follows readable"
  on public.follows for select to authenticated using (true);

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows"
  on public.follows for insert to authenticated with check (auth.uid() = follower_id);

drop policy if exists "Users delete own follows" on public.follows;
create policy "Users delete own follows"
  on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- Contas criadas ANTES deste script (Auth existe, profiles não)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, username, display_name)
select
  u.id,
  case
    when length(trim(coalesce(u.raw_user_meta_data->>'username', ''))) >= 3
      then trim(u.raw_user_meta_data->>'username')
    else 'user_' || left(replace(u.id::text, '-', ''), 12)
  end,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(u.email, 'user'), '@', 1)
  )
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
