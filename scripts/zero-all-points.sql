-- DryLeague: zerar pontos de todas as contas
-- Executar no Supabase: Dashboard → SQL Editor → New query → colar e Run
-- Requer permissão de escrita nas tabelas (o editor usa o role postgres).

-- Pontos globais + nível + contagem de apostas criadas (progressão por desafios)
update public.profiles
set
  points = 0,
  level = 1,
  total_challenges_created = 0;

-- Pontos por liga (classificação interna de cada competição)
update public.league_members
set points_in_league = 0;

-- Nota: conquistas (user_badges) e streaks não são alteradas aqui.
-- Para também limpar streaks / última atividade de treino, descomenta:
-- update public.profiles
-- set
--   streak_current = 0,
--   last_workout_at = null,
--   last_activity_date = null;
