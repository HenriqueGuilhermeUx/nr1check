# Guia de Deploy — NR1Check

Este guia cobre o deploy completo do NR1Check em produção, do zero até o site no ar em **nr1check.com.br**.

## Arquitetura

| Serviço | URL | Custo estimado |
|---|---|---|
| **Netlify** (frontend) | https://nr1check.com.br | Free |
| **Render** (backend) | https://api.nr1check.com.br (ou subdomínio) | Free → US$7/mês |
| **Supabase** (database) | https://app.supabase.com | Free → US$25/mês |
| **Clerk** (auth) | https://dashboard.clerk.com | Free até 10k MAU |
| **Cloudflare R2** (storage) | https://dash.cloudflare.com | Free até 10GB |
| **Stripe** (pagamento) | https://dashboard.stripe.com | 4% por transação |
| **Z-API** (WhatsApp) | https://www.z-api.io | R$60/mês |
| **OpenAI** (IA) | https://platform.openai.com | ~US$5-30/mês |

**Total estimado: US$0-50/mês** para começar.

---

## Pré-requisitos

1. **Contas criadas** (todas têm free tier):
   - [ ] GitHub
   - [ ] Netlify
   - [ ] Render
   - [ ] Supabase
   - [ ] Clerk
   - [ ] Cloudflare
   - [ ] Stripe
   - [ ] Z-API
   - [ ] OpenAI

2. **Domínio `nr1check.com.br`** registrado e com DNS configurável.

3. **Node 20+** e **pnpm 9+** instalados localmente.

---

## Passo 1 — Banco de Dados (Supabase)

1. Crie um projeto em https://app.supabase.com
2. Em **Settings → Database**, copie a **Connection string** (URI mode)
3. Adicione ao `.env` do projeto:
   ```env
   DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
   ```
4. Localmente, rode:
   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```
5. Em **SQL Editor**, rode o conteúdo de `infra/supabase/rls.sql` para ativar RLS.

---

## Passo 2 — Auth (Clerk)

1. Crie uma aplicação em https://dashboard.clerk.com
2. Em **API Keys**, copie:
   - `CLERK_PUBLISHABLE_KEY` → `VITE_CLERK_PUBLISHABLE_KEY` (frontend)
   - `CLERK_SECRET_KEY` (backend)
3. Em **Webhooks**, crie um endpoint:
   - URL: `https://api.nr1check.com.br/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copie o **Signing Secret** → `CLERK_WEBHOOK_SECRET`
4. Em **Paths**, configure:
   - Sign-in: `/login`
   - Sign-up: `/cadastro`
   - After sign-in: `/comecar`
   - After sign-up: `/comecar`

---

## Passo 3 — Storage (Cloudflare R2)

1. Crie um bucket em https://dash.cloudflare.com → R2
2. Em **Manage R2 API Tokens**, gere um token com permissão de leitura/escrita
3. Anote:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET=nr1check-documents`
4. Em **Settings → Public Access**, habilite o bucket (pegue a URL pública → `R2_PUBLIC_URL`)
5. Endpoint: `https://<account_id>.r2.cloudflarestorage.com` → `R2_ENDPOINT`

---

## Passo 4 — Pagamentos (Stripe)

1. Em https://dashboard.stripe.com → **Developers → API keys**:
   - Copie `STRIPE_SECRET_KEY` e `STRIPE_PUBLISHABLE_KEY` (essa última vai pro front: `VITE_STRIPE_PUBLISHABLE_KEY`)
2. Em **Webhooks**, adicione endpoint:
   - URL: `https://api.nr1check.com.br/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copie o **Signing Secret** → `STRIPE_WEBHOOK_SECRET`
3. Os produtos/preços são **criados automaticamente** pela API na primeira chamada de checkout.

---

## Passo 5 — WhatsApp (Z-API)

1. Crie conta em https://www.z-api.io
2. Crie uma instância, escaneie o QR com seu WhatsApp
3. Anote:
   - `ZAPI_INSTANCE_ID`
   - `ZAPI_TOKEN`
   - `ZAPI_CLIENT_TOKEN` (em "Security")

---

## Passo 6 — OpenAI

1. Em https://platform.openai.com → **API Keys**, crie uma chave
2. Adicione ao `.env`:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

---

## Passo 7 — Deploy do Backend (Render)

1. Suba o código pro GitHub (veja `GITHUB.md`)
2. Em https://dashboard.render.com → **New → Web Service**
3. Conecte ao seu repo GitHub
4. O `render.yaml` na raiz será detectado automaticamente. Confirme:
   - Root: `apps/api`
   - Build: `pnpm install --filter @nr1check/api... --frozen-lockfile && pnpm --filter @nr1check/api build`
   - Start: `pnpm --filter @nr1check/api start`
5. Adicione as **Environment Variables** (use o `.env.example` como guia)
6. Após deploy, copie a URL (ex: `https://nr1check-api.onrender.com`)

---

## Passo 8 — Deploy do Frontend (Netlify)

1. Em https://app.netlify.com → **Add new site → Import existing project**
2. Conecte ao GitHub
3. Configure:
   - Base: `apps/web`
   - Build: `pnpm install --filter @nr1check/web... --frozen-lockfile && pnpm --filter @nr1check/web build`
   - Publish: `apps/web/dist`
4. Environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL=https://nr1check-api.onrender.com`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
5. **Domain settings**: aponte `nr1check.com.br` e `www.nr1check.com.br`
6. SSL é automático via Let's Encrypt

---

## Passo 9 — Domínio (Registro.br → Cloudflare → Netlify)

Recomendamos usar **Cloudflare** como DNS proxy (grátis):

1. Adicione o domínio no Cloudflare
2. Aponte os nameservers do Registro.br para o Cloudflare
3. Em **DNS**, crie:
   - `nr1check.com.br` → CNAME para o site Netlify
   - `api.nr1check.com.br` → CNAME para `nr1check-api.onrender.com`
4. SSL/TLS: **Full (strict)**

---

## Passo 10 — Smoke Test

Após deploy:

1. Acesse https://nr1check.com.br
2. Crie uma conta (signup)
3. Vá em `/comecar` e cadastre uma empresa
4. Verifique o Dashboard
5. Acesse https://api.nr1check.com.br/health (deve retornar `{"status":"ok"}`)

---

## Troubleshooting

### Erro de CORS no front
Adicione a URL do Netlify em `APP_BASE_URL` no Render (separado por vírgula se múltiplos).

### Webhook do Clerk não chega
- Em Clerk, o endpoint deve estar em `https://api.nr1check.com.br/webhooks/clerk` (HTTPS obrigatório)
- Verifique se o `CLERK_WEBHOOK_SECRET` está correto

### PGR não gera
- Verifique se `OPENAI_API_KEY` tem créditos
- Veja os logs no Render

### WhatsApp não envia
- Confirme que a instância Z-API está **conectada** (QR escaneado)
- Teste com o número exato com DDI: `55` + DDD + número

---

## Custos mensais (estimativa para ~10 clientes PME)

| Item | Custo |
|---|---|
| Netlify | US$ 0 |
| Render | US$ 0-7 |
| Supabase | US$ 0-25 |
| Clerk | US$ 0 |
| R2 | US$ 0-1 |
| Z-API | R$ 60 (~US$ 12) |
| OpenAI | US$ 5-20 |
| Domínio .com.br | R$ 40/ano (~US$ 0,30/mês) |
| **Total** | **~US$ 20-65/mês** |

Para 10 clientes × R$139/mês = R$1.390/mês (~US$ 280), a margem é excelente.
