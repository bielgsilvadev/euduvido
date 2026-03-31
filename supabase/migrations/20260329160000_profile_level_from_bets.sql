-- Nível do utilizador = função do número de apostas (desafios) criados.
-- Cada INSERT em challenges incrementa total_challenges_created do criador e recalcula level.

create or replace function public.profile_level_from_bet_count(bets int)
returns int
language sql
immutable
set search_path = public
as $$
  select greatest(1, least(99, 1 + greatest(0, bets) / 3))::int;
$$;

comment on function public.profile_level_from_bet_count(int) is
  'Nível 1 com 0 apostas; +1 nível a cada 3 desafios criados (máx. 99).';

create or replace function public.trg_challenges_increment_creator_bets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set
    total_challenges_created = x.newc,
    level = public.profile_level_from_bet_count(x.newc),
    updated_at = now()
  from (
    select id, total_challenges_created + 1 as newc
    from public.profiles
    where id = new.creator_id
  ) x
  where p.id = x.id;
  return new;
end;
$$;

drop trigger if exists tr_challenges_creator_bets_ai on public.challenges;
create trigger tr_challenges_creator_bets_ai
  after insert on public.challenges
  for each row
  execute function public.trg_challenges_increment_creator_bets();

-- Sincronizar contadores existentes com a tabela challenges
update public.profiles p
set
  total_challenges_created = coalesce(x.cnt, 0),
  level = public.profile_level_from_bet_count(coalesce(x.cnt, 0)),
  updated_at = now()
from (
  select p2.id, coalesce(c.cnt, 0) as cnt
  from public.profiles p2
  left join (
    select creator_id, count(*)::int as cnt
    from public.challenges
    group by creator_id
  ) c on c.creator_id = p2.id
) x
where p.id = x.id;
