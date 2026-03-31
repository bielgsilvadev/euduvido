-- DryLeague: apagar todas as postagens
-- Executar no Supabase: Dashboard → SQL Editor → New query → colar e Run
--
-- Remove todas as linhas de `posts`. Tabelas com FK a `posts` e ON DELETE CASCADE
-- são limpas automaticamente: post_likes, post_comments, post_reports,
-- post_league_audiences (se existir).
--
-- Não apaga: alcohol_logs (registos de álcool sem post), perfis, ligas, notificações.

delete from public.posts;
