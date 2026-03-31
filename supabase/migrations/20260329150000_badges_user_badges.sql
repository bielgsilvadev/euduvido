-- Eu Duvido! — Conquistas (badges) + desbloqueios por utilizador
-- Executar após profiles existir (bootstrap / migrations anteriores).

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon_key text not null
);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx on public.user_badges (user_id);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists badges_select_authenticated on public.badges;
create policy badges_select_authenticated on public.badges for select to authenticated using (true);

drop policy if exists user_badges_select_own on public.user_badges;
create policy user_badges_select_own on public.user_badges for select to authenticated using (user_id = (select auth.uid()));

-- Catálogo alinhado a mobile/constants/badgeSeed.ts (atualizar ambos em conjunto)
insert into public.badges (id, name, description, icon_key) values
  ('duel_first', 'Primeiro duelo', 'Criou a primeira aposta P2P.', 'flag'),
  ('duel_five', 'Cinco na mesa', 'Criou 5 duelos.', 'flag'),
  ('duel_ten', 'Dez apostas', 'Criou 10 duelos.', 'flag'),
  ('duel_twenty_five', 'Veterano', 'Criou 25 duelos.', 'trophy'),
  ('win_first', 'Primeira vitória', 'Ganhou o primeiro duelo resolvido.', 'trophy'),
  ('win_five', 'Cinco vitórias', '5 duelos ganhos.', 'trophy'),
  ('win_ten', 'Dez vitórias', '10 duelos ganhos.', 'trophy'),
  ('win_twenty_five', 'Colecionador de vitórias', '25 duelos ganhos.', 'medal'),
  ('win_fifty', 'Imbatível', '50 duelos ganhos.', 'medal'),
  ('streak_wins_3', 'Sequência quente', '3 vitórias seguidas.', 'flame'),
  ('streak_wins_5', 'Embalado', '5 vitórias seguidas.', 'flame'),
  ('streak_wins_10', 'Máquina', '10 vitórias seguidas.', 'flash'),
  ('bet_bold_100', 'Aposta firme', 'Duelo com R$ 100+ por lado.', 'cash'),
  ('bet_bold_500', 'Alto risco', 'Duelo com R$ 500+ por lado.', 'cash'),
  ('open_challenge_first', 'Portas abertas', 'Primeira aposta aberta à comunidade.', 'globe'),
  ('open_challenge_five', 'Desafio público', '5 apostas abertas criadas.', 'globe'),
  ('arbiter_first', 'Juiz estreante', 'Foi árbitro pela primeira vez.', 'scale'),
  ('arbiter_five', 'Árbitro experiente', 'Julgou 5 duelos.', 'scale'),
  ('arbiter_ten', 'Justiça em cena', 'Julgou 10 duelos.', 'shield'),
  ('cheer_first', 'Eu acredito!', 'Primeira reação de apoio num duelo.', 'heart'),
  ('cheer_fifty', 'Torcedor', '50 reações de apoio.', 'heart'),
  ('doubt_first', 'Eu duvido!', 'Primeira reação de dúvida (no bom sentido).', 'flash'),
  ('doubt_twenty_five', 'Cético social', '25 reações “duvido”.', 'flash'),
  ('comment_first', 'Primeira palavra', 'Primeiro comentário num duelo.', 'chat'),
  ('comment_ten', 'Debatedor', '10 comentários na comunidade.', 'chat'),
  ('followers_ten', 'Começando audiência', '10 seguidores.', 'people'),
  ('followers_fifty', 'Influência', '50 seguidores.', 'people'),
  ('followers_hundred', 'Referência', '100 seguidores.', 'star'),
  ('community_first', 'Entrou na roda', 'Participou da primeira comunidade.', 'people'),
  ('community_three', 'Três mesas', 'Está em 3 comunidades.', 'people'),
  ('community_champ', 'Campeão do grupo', 'Primeiro lugar no ranking de uma comunidade.', 'trophy'),
  ('profile_ready', 'Perfil no ponto', 'Foto e nome para a comunidade reconhecer.', 'person'),
  ('bio_writer', 'Quem sou eu', 'Preencheu a bio.', 'person'),
  ('rep_hundred', 'Credível', '100 pontos de reputação.', 'analytics'),
  ('rep_five_hundred', 'Respeitado', '500 de reputação.', 'analytics'),
  ('rep_thousand', 'Nome na praça', '1000 de reputação.', 'ribbon'),
  ('top_global_once', 'Topo do mundo', 'Liderou o ranking global.', 'ribbon'),
  ('proof_streak_7', 'Uma semana firme', '7 dias seguidos com prova em duelo.', 'flame'),
  ('proof_streak_30', 'Mês na régua', '30 dias seguidos de provas.', 'flash'),
  ('proof_marathon', 'Prova final', 'Completou duelo com prova única no fim.', 'medal'),
  ('early_adopter', 'Cedo demais', 'Entre os primeiros na arena.', 'star'),
  ('night_owl_duel', 'Duelo da madrugada', 'Criou ou aceitou duelo após 22h.', 'moon'),
  ('weekend_bet', 'Fim de semana no jogo', 'Duelo com marco num sábado ou domingo.', 'calendar')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon_key = excluded.icon_key;
