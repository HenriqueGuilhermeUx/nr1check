NR1Check Essencial — Setup simples
Este é o checklist enxuto para colocar o NR1Check Essencial no ar sem complicar.
Decisão atual
Vamos usar o máximo possível da base já pronta, mas simplificar a operação:
GitHub: código fonte.
Supabase: banco de dados agora; auth/storage entram na próxima fase.
Render: backend.
Netlify: frontend.
OpenAI: opcional para rascunho de PGR.
Woovi: fica para a fase final de pagamento Pix.
Por enquanto, não vamos depender de Cloudflare R2, Stripe, Z-API ou setup complexo para colocar a primeira versão funcional no ar.
---
1. Conferir repositório
Repo:
```txt
https://github.com/HenriqueGuilhermeUx/nr1check
```
Branch principal:
```txt
main
```
---
2. Criar Supabase
Acesse o Supabase.
Crie projeto: `nr1check-prod`.
Região: se disponível, use São Paulo/South America.
Copie a connection string em modo URI.
Formato:
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
```
Depois, no SQL Editor, rode o arquivo:
```txt
infra/supabase/rls.sql
```
---
3. Backend no Render
No Render:
New + → Web Service.
Conecte o GitHub.
Escolha o repo `HenriqueGuilhermeUx/nr1check`.
Configure:
```txt
Name: nr1check-api
Root Directory: apps/api
Build Command: pnpm install --no-frozen-lockfile && pnpm --filter @nr1check/api build
Start Command: pnpm --filter @nr1check/api start
Health Check Path: /health
```
Variáveis mínimas para subir:
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
APP_BASE_URL=https://SEU-SITE.netlify.app,http://localhost:5173
OPENAI_MODEL=gpt-4o-mini
```
Se a versão atual ainda pedir Clerk/Stripe/R2, preencha temporariamente com as chaves de teste ou siga a próxima fase para remover essas dependências do código.
Teste após deploy:
```txt
https://nr1check-api.onrender.com/health
```
Esperado:
```json
{"status":"ok"}
```
---
4. Frontend no Netlify
No Netlify:
Add new site → Import an existing project.
Escolha o GitHub e o repo `nr1check`.
Use a configuração da raiz do repo.
Configuração recomendada:
```txt
Base directory: deixe vazio
Build command: pnpm install --no-frozen-lockfile && pnpm --filter @nr1check/web build
Publish directory: apps/web/dist
```
Variáveis mínimas:
```env
VITE_API_BASE_URL=https://nr1check-api.onrender.com
```
Se a versão atual ainda usar Clerk no frontend, adicione temporariamente:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```
Depois vamos substituir por Supabase Auth.
---
5. Smoke test
Depois que Render e Netlify subirem:
```txt
/                  -> landing abre
/login             -> login abre
/comecar           -> cadastro da empresa
/dashboard         -> painel carrega
/funcionarios      -> cadastro/lista funcionários
/painel-defesa     -> status NR1
```
Se algum item quebrar, corrigimos nessa ordem:
build do backend;
build do frontend;
variáveis de ambiente;
login;
rotas internas.
---
6. Próxima fase técnica
Depois do primeiro deploy:
trocar Clerk por Supabase Auth;
criar inventário de riscos explícito;
criar plano de ação explícito;
simplificar PGR para HTML/impressão;
trocar Stripe por Woovi Pix.
---
7. Próxima fase comercial
Oferta inicial sugerida:
```txt
NR1Check Implantação Assistida
R$497 para configurar
+ R$139/mês
```
Entrega inicial:
cadastro da empresa;
cadastro de funcionários;
avaliação psicossocial;
inventário de riscos inicial;
plano de ação;
PGR básico;
painel de status.
