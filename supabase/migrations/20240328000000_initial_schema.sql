-- DryLeague: schema inicial (Supabase / Postgres)
-- Execute via Supabase CLI: supabase db push

-- Extensões
create extension if not exists "uuid-ossp";

-- Enums
create type league_type as enum ('free', 'paid');
create type league_status as enum ('draft', 'active', 'ended', 'cancelled');
create type prize_distribution as enum ('winner_take_all', 'top_3', 'proportional');
create type payment_status as enum ('unpaid', 'paid', 'waived');
create type post_visibility as enum ('global', 'followers', 'league_only');

-- Perfis (1:1 com auth.users)
create table public.profiles (
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

-- Seguir usuários
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- Ligas
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  description text,
  league_type league_type not null default 'free',
  entry_fee_cents integer not null default 0,
  duration_days integer not null default 30,
  max_participants integer not null default 20,
  prize_distribution prize_distribution not null default 'winner_take_all',
  rules_json jsonb not null default '{}'::jsonb,
  -- rules_json exemplo: {"workout_points":1,"inactivity_penalty":2,"alcohol_penalty":15,"progressive_inactivity":false}
  rules_locked_at timestamptz,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  prize_pool_cents integer not null default 0,
  status league_status not null default 'draft',
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entry_fee_non_negative check (entry_fee_cents >= 0),
  constraint max_participants_positive check (max_participants > 0)
);

-- Membros da liga
create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  payment_status payment_status not null default 'waived',
  points_in_league integer not null default 0,
  abandoned boolean not null default false,
  primary key (league_id, user_id)
);

-- Posts de treino (validação: foto + descrição obrigatórios na app)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  description text not null,
  workout_date date not null default (timezone('utc', now()))::date,
  visibility post_visibility not null default 'global',
  league_id uuid references public.leagues (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint description_not_empty check (char_length(trim(description)) > 0)
);

create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_league_id_idx on public.posts (league_id);

-- Curtidas
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Comentários
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint body_len check (char_length(trim(body)) > 0)
);

create index post_comments_post_id_idx on public.post_comments (post_id);

-- Registro de álcool (penalidade -15 por evento; configurável via rules_json da liga para contexto futuro)
create table public.alcohol_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  logged_at timestamptz not null default now(),
  league_id uuid references public.leagues (id) on delete set null
);

-- Conquistas / badges
create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon_key text not null
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- Notificações in-app
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- Denúncias / anti-fraude (moderation)
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

-- Função: atualizar updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger leagues_updated_at before update on public.leagues
  for each row execute function public.set_updated_at();

-- Perfil automático ao registrar
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_name text;
begin
  base_name := coalesce(new.raw_user_meta_data->>'username', 'user_' || replace(gen_random_uuid()::text, '-', ''));
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_name,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1))
  );
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (
      new.id,
      'user_' || replace(gen_random_uuid()::text, '-', ''),
      coalesce(new.raw_user_meta_data->>'display_name', 'Atleta')
    );
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pontos: +1 treino + streak (dias consecutivos com base em workout_date)
create or replace function public.apply_workout_points()
returns trigger as $$
declare
  p_last date;
  p_sc int;
  p_sb int;
  new_sc int;
  new_last date;
begin
  select last_activity_date, streak_current, streak_best
  into p_last, p_sc, p_sb
  from public.profiles
  where id = new.user_id;

  if p_last is null then
    new_sc := 1;
    new_last := new.workout_date;
  elsif new.workout_date = p_last then
    new_sc := p_sc;
    new_last := p_last;
  elsif new.workout_date > p_last then
    if new.workout_date = p_last + 1 then
      new_sc := p_sc + 1;
    else
      new_sc := 1;
    end if;
    new_last := new.workout_date;
  else
    new_sc := p_sc;
    new_last := p_last;
  end if;

  update public.profiles
  set
    points = points + 1,
    last_workout_at = new.created_at,
    last_activity_date = new_last,
    streak_current = new_sc,
    streak_best = greatest(p_sb, new_sc)
  where id = new.user_id;

  if new.league_id is not null then
    update public.league_members
    set points_in_league = points_in_league + 1
    where league_id = new.league_id and user_id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_workout_post after insert on public.posts
  for each row execute function public.apply_workout_points();

-- Penalidade álcool
create or replace function public.apply_alcohol_penalty()
returns trigger as $$
declare
  pen int := 15;
begin
  update public.profiles
  set points = greatest(0, points - pen)
  where id = new.user_id;

  if new.league_id is not null then
    update public.league_members
    set points_in_league = greatest(0, points_in_league - pen)
    where league_id = new.league_id and user_id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_alcohol_log after insert on public.alcohol_logs
  for each row execute function public.apply_alcohol_penalty();

-- RLS
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.alcohol_logs enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;
alter table public.post_reports enable row level security;

-- profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- follows
create policy "Follows readable"
  on public.follows for select to authenticated using (true);

create policy "Users manage own follows"
  on public.follows for insert to authenticated with check (auth.uid() = follower_id);

create policy "Users delete own follows"
  on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- leagues
create policy "Leagues readable"
  on public.leagues for select to authenticated using (true);

create policy "Authenticated create league"
  on public.leagues for insert to authenticated with check (auth.uid() = creator_id);

create policy "Creator update league"
  on public.leagues for update to authenticated using (auth.uid() = creator_id);

-- league_members
create policy "League members readable"
  on public.league_members for select to authenticated using (true);

create policy "User join league"
  on public.league_members for insert to authenticated with check (auth.uid() = user_id);

create policy "User update own membership"
  on public.league_members for update to authenticated using (auth.uid() = user_id);

-- posts
create policy "Posts readable"
  on public.posts for select to authenticated using (
    user_id = auth.uid()
    or visibility = 'global'
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = posts.user_id
      )
    )
    or (
      league_id is not null
      and exists (
        select 1 from public.league_members m
        where m.league_id = posts.league_id and m.user_id = auth.uid()
      )
    )
  );

create policy "Users insert own posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

-- likes
create policy "Likes select"
  on public.post_likes for select to authenticated using (true);

create policy "Likes insert own"
  on public.post_likes for insert to authenticated with check (auth.uid() = user_id);

create policy "Likes delete own"
  on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- comments
create policy "Comments select"
  on public.post_comments for select to authenticated using (true);

create policy "Comments insert"
  on public.post_comments for insert to authenticated with check (auth.uid() = user_id);

create policy "Comments delete own"
  on public.post_comments for delete to authenticated using (auth.uid() = user_id);

-- alcohol_logs
create policy "Alcohol logs own"
  on public.alcohol_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- badges
create policy "Badges read"
  on public.badges for select to authenticated using (true);

create policy "User badges read"
  on public.user_badges for select to authenticated using (true);

-- notifications
create policy "Notifications own"
  on public.notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reports
create policy "Reports insert"
  on public.post_reports for insert to authenticated with check (auth.uid() = reporter_id);

-- Storage: bucket workout-photos (criar no dashboard ou via SQL)
insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', true)
on conflict (id) do nothing;

create policy "Authenticated upload own folder"
  on storage.objects for insert to authenticated with check (
    bucket_id = 'workout-photos' and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Public read workout photos"
  on storage.objects for select to public using (bucket_id = 'workout-photos');

create policy "Users update own workout photos"
  on storage.objects for update to authenticated using (
    bucket_id = 'workout-photos' and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users delete own workout photos"
  on storage.objects for delete to authenticated using (
    bucket_id = 'workout-photos' and split_part(name, '/', 1) = auth.uid()::text
  );

-- Seeds badges
insert into public.badges (id, name, description, icon_key) values
  ('first_workout', 'Primeiro treino', 'Registrou o primeiro treino validado.', 'trophy'),
  ('streak_7', 'Fogo de 7 dias', 'Streak de 7 dias.', 'flame'),
  ('streak_30', 'Máquina 30', 'Streak de 30 dias.', 'flame'),
  ('league_champ', 'Campeão de liga', 'Finalizou em 1º lugar numa liga.', 'medal')
on conflict (id) do nothing;

-- Realtime: habilite no Dashboard (Database > Replication) para posts e post_comments se desejar feeds ao vivo
