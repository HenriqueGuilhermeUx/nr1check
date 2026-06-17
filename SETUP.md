# NR1Check — Setup Checklist

Use este checklist para colocar a plataforma no ar em **~2 horas**.

## 1️⃣ Criar contas externas (30 min)

- [ ] **GitHub** — criar conta + repositório `nr1check` (privado)
- [ ] **Supabase** — criar projeto (escolha região São Paulo)
- [ ] **Clerk** — criar aplicação, copiar API Keys
- [ ] **Cloudflare** — criar bucket R2 + token de API
- [ ] **Stripe** — ativar conta Brasil (precisa de CNPJ)
- [ ] **Z-API** — criar instância, escanear QR do WhatsApp
- [ ] **OpenAI** — criar API key (modelo gpt-4o-mini é suficiente)
- [ ] **Netlify** — conectar GitHub
- [ ] **Render** — conectar GitHub
- [ ] **Registro.br** — confirmar `nr1check.com.br` (apontar DNS para Cloudflare)

## 2️⃣ Banco de dados (15 min)

```bash
# 1. Copie .env.example para .env na raiz
cp .env.example .env
# 2. Preencha DATABASE_URL com a connection string do Supabase
# 3. Rode:
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
```

Depois, no Supabase SQL Editor, rode `infra/supabase/rls.sql`.

## 3️⃣ Subir pro GitHub (5 min)

```bash
git init
git add .
git commit -m "feat: initial NR1Check monorepo"
git remote add origin https://github.com/SEU_USUARIO/nr1check.git
git branch -M main
git push -u origin main
```

## 4️⃣ Deploy do Backend no Render (10 min)

1. Dashboard Render → **New Web Service** → conectar repo
2. O `render.yaml` será detectado. Confirme:
   - Name: `nr1check-api`
   - Region: `Oregon` (free tier)
   - Branch: `main`
3. **Environment** → adicione TODAS as variáveis do `.env`
4. Deploy automático. URL gerada: `https://nr1check-api.onrender.com`

## 5️⃣ Deploy do Front no Netlify (10 min)

1. Dashboard Netlify → **Add new site** → Import from Git
2. Conecte ao repo
3. Configure:
   - Base directory: `apps/web`
   - Build command: `pnpm install --filter @nr1check/web... --frozen-lockfile && pnpm --filter @nr1check/web build`
   - Publish directory: `apps/web/dist`
4. **Environment variables**:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL` = URL do Render
   - `VITE_STRIPE_PUBLISHABLE_KEY`
5. Deploy. URL: `https://nr1check.netlify.app`

## 6️⃣ Configurar domínio (10 min)

No Cloudflare (DNS):

```
CNAME  nr1check.com.br       → nr1check.netlify.app
CNAME  api.nr1check.com.br   → nr1check-api.onrender.com
CNAME  www                   → nr1check.netlify.app
```

No Netlify → **Domain settings** → aponte `nr1check.com.br` e `www.nr1check.com.br`.

No Render → **Custom domains** → adicione `api.nr1check.com.br`.

## 7️⃣ Webhooks (15 min)

### Clerk
- Endpoint: `https://api.nr1check.com.br/webhooks/clerk`
- Eventos: `user.*`

### Stripe
- Endpoint: `https://api.nr1check.com.br/webhooks/stripe`
- Eventos: `checkout.session.completed`, `customer.subscription.*`

## 8️⃣ Smoke test (5 min)

- [ ] Acessar https://nr1check.com.br → página inicial carrega
- [ ] Clicar "Começar grátis" → signup do Clerk funciona
- [ ] Ir em `/comecar` → cadastrar empresa teste
- [ ] Verificar Dashboard → aparece o nome da empresa
- [ ] Clicar "Gerar PGR com IA" → documento criado em segundos
- [ ] Em `/painel-defesa` → status reflete a situação

## Pronto! 🎉

Seu NR1Check está no ar em **https://nr1check.com.br**.

---

## Próximos passos sugeridos

1. **Validar com 3-5 clientes beta** (empresários amigos, contador, RH)
2. **Configurar preço real no Stripe** (R$79 e R$139)
3. **Ativar WhatsApp Marketing** com a Z-API (campanhas de disparo)
4. **Criar landing page de aquisição** focada em "multa NR-1" como keyword
5. **Publicar no Google Search Console** e Product Hunt
6. **Quando bater 10 clientes**, contratar advogado parceiro para revisar documentos jurídicos
