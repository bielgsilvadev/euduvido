# DryLeague

App social de fitness gamificado: treinos validados com **foto + descrição** (+1 ponto), penalidades por **inatividade** (implementação agendada no backend) e **álcool** (−15 por registro), **ligas** grátis ou pagas, feed global, feed por liga, curtidas, comentários e seguir usuários.

## Estrutura do repositório

| Pasta | Descrição |
|--------|-----------|
| `mobile/` | App **Expo (React Native)** + Expo Router — iOS / Android / web estático |
| `web/` | **Next.js** para termos, privacidade e landing — deploy na **Vercel** |
| `supabase/migrations/` | **SQL** inicial: tabelas, RLS, storage `workout-photos`, triggers de pontos |
| `.github/workflows/ci.yml` | CI: `typecheck` do mobile + `build` do web |
| `docs/DEPLOY.md` | **Supabase + Vercel + GitHub + EAS Secrets** (checklist) |

## Automatização local (Windows)

Na raiz do repositório:

```powershell
.\scripts\SETUP-AUTOMATICO.ps1
```

Guia completo e secrets do GitHub: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Pré-requisitos

- Node 20+
- Conta [Supabase](https://supabase.com) (projeto novo)
- (Opcional) [Expo EAS](https://docs.expo.dev/eas/) para build de loja
- (Opcional) Conta [Vercel](https://vercel.com) apontando para a pasta `web/`

## Supabase

1. Crie um projeto e execute a migration `supabase/migrations/20240328000000_initial_schema.sql` (SQL Editor ou CLI `supabase db push`).
2. Confirme o bucket **`workout-photos`** (a migration tenta criar; ajuste no Dashboard se necessário).
3. Em **Authentication → Providers**, habilite e-mail (e depois Apple/Google conforme os fluxos nativos).
4. Copie **URL** e **anon key** para `mobile/.env` (`EXPO_PUBLIC_SUPABASE_*`).
5. Configure **redirect URLs** para o scheme `dryleague` — ver **[docs/DEPLOY.md](docs/DEPLOY.md)**.

### Penalidade diária (−2) sem treino

Não está no SQL automático (depende de fuso e regras progressivas). Recomendação: **Supabase Edge Function** agendada (pg_cron ou serviço externo) que:

- Para cada usuário, verifica se há `posts` na data D;
- Se não houver, aplica débito em `profiles.points` e opcionalmente notificação em `notifications`.

## App mobile (`mobile/`)

```bash
cd mobile
cp .env.example .env
# Edite EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start
```

Variáveis vêm de `mobile/.env` (`EXPO_PUBLIC_*`). O ficheiro **`mobile/app.config.ts`** replica-as em `extra` para builds **EAS** (use `eas secret:create` com os mesmos nomes).

### App Store

- Atualize `eas.json` e `app.json` → `extra.eas.projectId` com `eas init`.
- Revise **termos/privacidade** em `web/` e o e-mail de suporte nos textos.
- **Ligas pagas**: integre **Stripe** (Checkout ou Payment Element) numa Edge Function e marque `league_members.payment_status = paid` após webhook; avalie exigências da **Apple** para o seu modelo (IAP vs fluxo web).

### Pagamentos e fraude

- Rate limit de posts por usuário (Edge Function ou RPC).
- Denúncias: tabela `post_reports` já existe; ligue a um painel de moderação.
- Fotos: bucket privado + URLs assinadas se quiser restringir leitura (ajuste RLS/policies).

## Site legal (`web/`)

```bash
cd web
npm run build
```

Na Vercel: **Root Directory** = `web` (há `web/vercel.json`). Após o deploy, no `mobile/.env`:

- `EXPO_PUBLIC_LEGAL_TERMS_URL` e `EXPO_PUBLIC_LEGAL_PRIVACY_URL` com as URLs reais (`…/terms`, `…/privacy`).

Guia completo: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Design

Tokens: `mobile/constants/theme.ts` e `.cursor/rules/dryleague.mdc` (fundo `#0A0A0B`, acento `#C8F135`, Bebas Neue + DM Sans no app).

## GitHub

```bash
git init
git add .
git commit -m "chore: projeto inicial DryLeague"
git remote add origin https://github.com/USUARIO/REPO.git
git branch -M main
git push -u origin main
```

O CI (`.github/workflows/ci.yml`) corre em `main`/`master`. Não commites `mobile/.env` nem chaves privadas.

---

Modelo jurídico nas páginas Next é **informativo**; valide com advogado antes do lançamento comercial.
