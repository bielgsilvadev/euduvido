# Deploy: Supabase, Vercel e GitHub

Guia único para ligar o **mobile** (Expo), o **deploy web na Vercel** (export Expo = mesma app que no telemóvel) e o **backend** (Supabase) depois de preencher `mobile/.env`.

---

## 1. Supabase

### 1.1 Schema e storage

1. No [Dashboard](https://supabase.com/dashboard) → **SQL Editor** → cole e execute o ficheiro  
   `supabase/migrations/20240328000000_initial_schema.sql`.
2. Confirma **Storage** → bucket **`workout-photos`** existe e as policies batem com o que o app espera (upload autenticado, leitura conforme a migration).

### 1.2 Chaves no mobile

Em `mobile/.env` (já no teu disco, **não** commits):

| Variável | Onde copiar no Supabase |
|----------|-------------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API → anon public** |

Reinicia o Metro (`npx expo start -c`) após alterar o `.env`.

### 1.3 Auth (e-mail / recuperação)

1. **Authentication → URL configuration**
   - **Site URL**: para app nativo com scheme `dryleague`, usa por exemplo `dryleague://` ou o URL que o Supabase aceitar como base; muitos projetos usam `https://supabase.com` só como placeholder e dependem dos redirect extras.
   - **Additional Redirect URLs** — adiciona **todas** as que forem usar sessão OAuth ou magic link:
     - `dryleague://**`
     - `exp://127.0.0.1:8081/--/**` (Expo Go em desenvolvimento, ajusta porta se for outra)
     - `https://auth.expo.io/**` (se ainda usares fluxos Expo legacy)
2. **Authentication → Providers**: ativa **Email** (e depois Apple/Google quando integrares).

### 1.4 EAS Build (loja)

O `.env` local **não** vai para a cloud sozinho. Para builds na EAS:

```bash
cd mobile
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..." --scope project
eas secret:create --name EXPO_PUBLIC_LEGAL_TERMS_URL --value "https://teu-site.vercel.app/terms" --scope project
eas secret:create --name EXPO_PUBLIC_LEGAL_PRIVACY_URL --value "https://teu-site.vercel.app/privacy" --scope project
```

O `app.config.ts` injeta estes valores em `extra` no build.

---

## 2. Vercel (app Expo — pasta `mobile/`)

A URL pública (ex.: `dryleague.vercel.app`) deve servir **a mesma app** que vês no Expo (`expo start` / Expo Go), via **React Native Web** (`expo export --platform web`). Não uses a pasta `web/` (Next.js) como deploy principal do produto.

1. [Vercel](https://vercel.com) → **Add New Project** → importa o repositório **GitHub**.
2. **Root Directory**: **`mobile`** (obrigatório para coincidir com o Expo).
3. Nome do projeto na Vercel: só **minúsculas**, números, `.`, `_`, `-` (ex.: `dryleague`).
4. Framework: **Other** (o `mobile/vercel.json` define `installCommand`, `buildCommand` e `outputDirectory: dist`).
5. **Environment Variables** no painel Vercel (produção): as mesmas que no build local, se precisares de URLs públicas — normalmente `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_LEGAL_*` (ou injeta via EAS/build; para Vercel adiciona em **Settings → Environment Variables**).
6. Deploy. Copia a URL final (ex.: `https://dryleague.vercel.app`).

A pasta **`web/`** é um site Next opcional (marketing); não confundir com a app DryLeague em produção.

### Ligar termos/privacidade no app

No `mobile/.env`, atualiza:

```env
EXPO_PUBLIC_LEGAL_TERMS_URL=https://SUA-URL.vercel.app/terms
EXPO_PUBLIC_LEGAL_PRIVACY_URL=https://SUA-URL.vercel.app/privacy
```

---

## 3. GitHub

1. Na raiz do projeto (onde está `mobile/`, `web/`, `supabase/`):

   ```bash
   git init
   git add .
   git commit -m "chore: DryLeague"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

2. O workflow **`.github/workflows/ci.yml`** corre em `push` / `pull_request` para `main` ou `master`:
   - `npm run typecheck` em `mobile/`
   - `npm run export:web` em `mobile/` (valida o bundle web da app Expo)

3. **Deploy automático (opcional)** — em **Repository → Settings → Secrets and variables → Actions**:

   | Secret | Onde obter |
   |--------|------------|
   | `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
   | `VERCEL_ORG_ID` | Ficheiro `mobile/.vercel/project.json` após `npx vercel link` na pasta `mobile/` (campo `orgId`) |
   | `VERCEL_PROJECT_ID` | Idem (`projectId`) |
   | `SUPABASE_ACCESS_TOKEN` | [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
   | `SUPABASE_PROJECT_REF` | Dashboard do projeto → **Settings → General → Reference ID** |

   - **`.github/workflows/deploy-expo-vercel.yml`**: deploy da app Expo (web) em produção quando alteras `mobile/` na `main`.
   - **`.github/workflows/supabase-migrate.yml`**: corre `supabase db push` quando alteras `supabase/migrations/`.

4. **Script local (Windows):** `.\scripts\SETUP-AUTOMATICO.ps1` na raiz — guia `vercel link`, opcional `supabase db push`, e lembra os secrets.

5. **Não** commits de `.env`, chaves `service_role` ou `.p8`/keystore. O `.gitignore` cobre `mobile/.env`.

6. (Opcional) **Branch protection** em `main`: exigir CI verde antes de merge.

---

## 4. Ordem recomendada

1. Supabase: migration + copiar URL/anon para `mobile/.env`.  
2. Vercel: deploy da pasta `mobile/` → copiar URLs `/terms` e `/privacy` para o `.env` do mobile (as rotas vêm da app Expo).  
3. GitHub: push do código → confirmar que o CI fica verde.  
4. EAS: `eas secret:create` com as mesmas `EXPO_PUBLIC_*` antes do primeiro build de loja.

---

## Checklist rápido

- [ ] SQL inicial aplicado no Supabase  
- [ ] Bucket `workout-photos` OK  
- [ ] Redirect URLs do Auth alinhadas ao scheme `dryleague`  
- [ ] `mobile/.env` com Supabase + URLs legais da Vercel  
- [ ] Vercel com Root Directory = `mobile`  
- [ ] Repositório no GitHub com CI a passar  
