# Supabase — DryLeague

## Migration inicial

**Opção A — CLI** (com `npx supabase login` + `supabase link --project-ref SEU_REF`):

```bash
npx supabase@latest db push
```

**Opção B — Dashboard**: cola no **SQL Editor** o ficheiro `migrations/20240328000000_initial_schema.sql`.

Isto cria tabelas (`profiles`, `posts`, `leagues`, etc.), RLS, triggers de pontos e o bucket de storage para fotos de treino.

## Depois da migration

1. **Authentication → URL configuration**: redirect URLs para o app (`dryleague://**`, etc.) — vê [docs/DEPLOY.md](../docs/DEPLOY.md).
2. Confirma **Storage → workout-photos** e policies.
3. **Nunca** uses a chave `service_role` no app mobile; só `anon` + RLS.

Passo a passo completo: **[docs/DEPLOY.md](../docs/DEPLOY.md)**.
