-- Eu Duvido! — desafios com aposta, provas, juízes, reações e carteira (ledger).
-- Executar após profiles + auth existirem (ex.: full_setup ou migrations anteriores).

-- ---------------------------------------------------------------------------
-- Extensão de perfis (estatísticas do produto de desafios)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists total_challenges_created integer not null default 0;
alter table public.profiles add column if not exists total_challenges_completed integer not null default 0;
alter table public.profiles add column if not exists total_challenges_failed integer not null default 0;
alter table public.profiles add column if not exists total_money_won numeric(12, 2) not null default 0;
alter table public.profiles add column if not exists total_money_lost numeric(12, 2) not null default 0;
alter table public.profiles add column if not exists total_money_donated numeric(12, 2) not null default 0;
alter table public.profiles add column if not exists reputation_score integer not null default 0;

-- ---------------------------------------------------------------------------
-- ONGs / caridades
-- ---------------------------------------------------------------------------
create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  category text,
  total_received numeric(12, 2) not null default 0,
  is_verified boolean not null default false,
  website_url text,
  pix_key text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Desafios
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  cover_image_url text,
  bet_amount numeric(12, 2) not null,
  currency text not null default 'BRL',
  failure_destination text not null,
  failure_destination_details jsonb,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'draft',
  is_public boolean not null default true,
  proof_type text not null,
  proof_frequency text,
  tags text[] default '{}',
  views_count integer not null default 0,
  cheers_count integer not null default 0,
  doubters_count integer not null default 0,
  escrow_payment_intent_id text,
  escrow_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_dates_ok check (end_date > start_date),
  constraint challenges_bet_nonneg check (bet_amount >= 0),
  constraint challenges_status_check check (
    status in ('draft', 'active', 'pending_proof', 'judging', 'completed', 'failed', 'cancelled')
  ),
  constraint challenges_failure_dest_check check (
    failure_destination in ('charity', 'friend', 'rival')
  ),
  constraint challenges_escrow_status_check check (
    escrow_status in ('pending', 'locked', 'released', 'transferred')
  )
);

create index if not exists challenges_creator_id_idx on public.challenges (creator_id);
create index if not exists challenges_created_at_idx on public.challenges (created_at desc);
create index if not exists challenges_status_public_idx on public.challenges (status, is_public);

-- ---------------------------------------------------------------------------
-- Provas
-- ---------------------------------------------------------------------------
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  proof_type text not null,
  media_url text,
  note text,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending',
  day_number integer,
  constraint proofs_status_check check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists proofs_challenge_id_idx on public.proofs (challenge_id);

-- ---------------------------------------------------------------------------
-- Participantes (juízes, apoiadores, observadores)
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  invited_by uuid references public.profiles (id),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint challenge_participants_role_check check (role in ('judge', 'supporter', 'observer')),
  constraint challenge_participants_status_check check (status in ('pending', 'accepted', 'declined')),
  unique (challenge_id, user_id)
);

create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);

-- ---------------------------------------------------------------------------
-- Votos dos juízes
-- ---------------------------------------------------------------------------
create table if not exists public.judge_votes (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  proof_id uuid references public.proofs (id) on delete set null,
  judge_id uuid not null references public.profiles (id) on delete cascade,
  vote text not null,
  comment text,
  voted_at timestamptz not null default now(),
  constraint judge_votes_vote_check check (vote in ('approved', 'rejected'))
);

-- ---------------------------------------------------------------------------
-- Reações: Eu Acredito! / Eu Duvido!
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_reactions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id),
  constraint challenge_reactions_type_check check (reaction_type in ('cheer', 'doubt'))
);

create index if not exists challenge_reactions_challenge_idx on public.challenge_reactions (challenge_id);

-- ---------------------------------------------------------------------------
-- Comentários em desafios
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_comments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_id uuid references public.challenge_comments (id) on delete cascade,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists challenge_comments_challenge_idx on public.challenge_comments (challenge_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Transações financeiras (Stripe / ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  challenge_id uuid references public.challenges (id) on delete set null,
  type text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'BRL',
  payment_method text,
  payment_provider text,
  provider_transaction_id text,
  status text not null default 'pending',
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint wallet_transactions_status_check check (
    status in ('pending', 'processing', 'completed', 'failed', 'refunded')
  )
);

create index if not exists wallet_transactions_user_idx on public.wallet_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists challenges_updated_at on public.challenges;
create trigger challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

drop trigger if exists challenge_comments_updated_at on public.challenge_comments;
create trigger challenge_comments_updated_at
  before update on public.challenge_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Função: manter contadores de reações no desafio
-- ---------------------------------------------------------------------------
create or replace function public.challenge_reaction_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.reaction_type = 'cheer' then
      update public.challenges set cheers_count = cheers_count + 1 where id = new.challenge_id;
    elsif new.reaction_type = 'doubt' then
      update public.challenges set doubters_count = doubters_count + 1 where id = new.challenge_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.reaction_type = 'cheer' and new.reaction_type = 'doubt' then
      update public.challenges set cheers_count = cheers_count - 1, doubters_count = doubters_count + 1 where id = new.challenge_id;
    elsif old.reaction_type = 'doubt' and new.reaction_type = 'cheer' then
      update public.challenges set doubters_count = doubters_count - 1, cheers_count = cheers_count + 1 where id = new.challenge_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.reaction_type = 'cheer' then
      update public.challenges set cheers_count = greatest(0, cheers_count - 1) where id = old.challenge_id;
    elsif old.reaction_type = 'doubt' then
      update public.challenges set doubters_count = greatest(0, doubters_count - 1) where id = old.challenge_id;
    end if;
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_challenge_reactions_ai on public.challenge_reactions;
create trigger tr_challenge_reactions_ai
  after insert on public.challenge_reactions
  for each row execute function public.challenge_reaction_counts();

drop trigger if exists tr_challenge_reactions_au on public.challenge_reactions;
create trigger tr_challenge_reactions_au
  after update on public.challenge_reactions
  for each row execute function public.challenge_reaction_counts();

drop trigger if exists tr_challenge_reactions_ad on public.challenge_reactions;
create trigger tr_challenge_reactions_ad
  after delete on public.challenge_reactions
  for each row execute function public.challenge_reaction_counts();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.charities enable row level security;
alter table public.challenges enable row level security;
alter table public.proofs enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.judge_votes enable row level security;
alter table public.challenge_reactions enable row level security;
alter table public.challenge_comments enable row level security;
alter table public.wallet_transactions enable row level security;

-- Charities: leitura pública
drop policy if exists charities_select_all on public.charities;
create policy charities_select_all on public.charities for select using (true);

-- Challenges
drop policy if exists challenges_select_visible on public.challenges;
create policy challenges_select_visible on public.challenges for select using (
  is_public = true
  or creator_id = (select auth.uid())
  or exists (
    select 1 from public.challenge_participants cp
    where cp.challenge_id = challenges.id
      and cp.user_id = (select auth.uid())
      and cp.status = 'accepted'
  )
);

drop policy if exists challenges_insert_own on public.challenges;
create policy challenges_insert_own on public.challenges for insert with check (creator_id = (select auth.uid()));

drop policy if exists challenges_update_own on public.challenges;
create policy challenges_update_own on public.challenges for update using (creator_id = (select auth.uid()));

-- Proofs
drop policy if exists proofs_select_participants on public.proofs;
create policy proofs_select_participants on public.proofs for select using (
  user_id = (select auth.uid())
  or exists (select 1 from public.challenges c where c.id = proofs.challenge_id and c.creator_id = (select auth.uid()))
  or exists (
    select 1 from public.challenge_participants cp
    where cp.challenge_id = proofs.challenge_id
      and cp.user_id = (select auth.uid())
      and cp.role = 'judge'
      and cp.status = 'accepted'
  )
);

drop policy if exists proofs_insert_own on public.proofs;
create policy proofs_insert_own on public.proofs for insert with check (user_id = (select auth.uid()));

-- Participants
drop policy if exists cp_select on public.challenge_participants;
create policy cp_select on public.challenge_participants for select using (
  user_id = (select auth.uid())
  or exists (select 1 from public.challenges c where c.id = challenge_participants.challenge_id and c.creator_id = (select auth.uid()))
);

drop policy if exists cp_insert_creator on public.challenge_participants;
create policy cp_insert_creator on public.challenge_participants for insert with check (
  exists (select 1 from public.challenges c where c.id = challenge_participants.challenge_id and c.creator_id = (select auth.uid()))
);

drop policy if exists cp_update_self on public.challenge_participants;
create policy cp_update_self on public.challenge_participants for update using (user_id = (select auth.uid()));

-- Judge votes (juiz + criador vê)
drop policy if exists jv_select on public.judge_votes;
create policy jv_select on public.judge_votes for select using (
  judge_id = (select auth.uid())
  or exists (select 1 from public.challenges c where c.id = judge_votes.challenge_id and c.creator_id = (select auth.uid()))
);

drop policy if exists jv_insert_judge on public.judge_votes;
create policy jv_insert_judge on public.judge_votes for insert with check (judge_id = (select auth.uid()));

-- Reactions
drop policy if exists cr_select on public.challenge_reactions;
create policy cr_select on public.challenge_reactions for select using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_reactions.challenge_id
      and (c.is_public = true or c.creator_id = (select auth.uid()))
  )
);

drop policy if exists cr_write_own on public.challenge_reactions;
create policy cr_write_own on public.challenge_reactions for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Comments
drop policy if exists cc_select on public.challenge_comments;
create policy cc_select on public.challenge_comments for select using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_comments.challenge_id
      and (c.is_public = true or c.creator_id = (select auth.uid()))
  )
);

drop policy if exists cc_insert on public.challenge_comments;
create policy cc_insert on public.challenge_comments for insert with check (user_id = (select auth.uid()));

-- Wallet: só o próprio utilizador
drop policy if exists wt_select_own on public.wallet_transactions;
create policy wt_select_own on public.wallet_transactions for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Seed mínimo de caridades (opcional)
-- ---------------------------------------------------------------------------
insert into public.charities (name, description, category, is_verified)
select v.name, v.description, v.category, v.is_verified
from (
  values
    ('Médicos Sem Fronteiras'::text, 'Ajuda humanitária internacional.'::text, 'saude'::text, true),
    ('Ampara Animal'::text, 'Proteção e adoção responsável.'::text, 'animal'::text, true)
) as v(name, description, category, is_verified)
where not exists (select 1 from public.charities c where c.name = v.name);
