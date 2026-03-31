-- Destino "desenvolvedores" em desafios; remoção de conquistas ligadas a caridade/terceiro.

alter table public.challenges drop constraint if exists challenges_failure_dest_check;
alter table public.challenges add constraint challenges_failure_dest_check check (
  failure_destination in ('charity', 'friend', 'rival', 'developers')
);

delete from public.user_badges where badge_id in ('charity_destination', 'third_party_fair');
delete from public.badges where id in ('charity_destination', 'third_party_fair');
