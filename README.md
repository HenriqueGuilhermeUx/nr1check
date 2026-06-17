# NR1Check

> Plataforma de compliance psicossocial NR-1 para PMEs brasileiras.

NR1Check ajuda empresas a cumprir a **NR-1** (Gerenciamento de Riscos Ocupacionais) e a **Lei 15.377/2026** (combate ao assédio), gerando toda a documentação defensiva necessária e protegendo a empresa de multas trabalhistas.

## Stack

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS | **Netlify** |
| Backend | Express + tRPC + Node 20 | **Render** |
| Database | PostgreSQL | **Supabase** |
| Auth | Clerk | Clerk |
| Storage (PDFs) | S3-compatible | **Cloudflare R2** |
| Pagamentos | Stripe | Stripe |
| WhatsApp | Z-API | Z-API |
| IA (PGR/Ordens) | OpenAI GPT-4o-mini | OpenAI |

## Estrutura do Monorepo

```
nr1check/
├── apps/
│   ├── web/          # Frontend Vite + React (Netlify)
│   └── api/          # Backend Express + tRPC (Render)
├── packages/
│   ├── db/           # Drizzle schema + migrations (Postgres)
│   ├── shared/       # Types, Zod schemas, utils compartilhados
│   └── pdf/          # Geração de PDFs (PGR, OS, EPI, Incidente)
├── infra/
│   └── supabase/     # SQL migrations + RLS policies
├── docs/             # Manual, FAQ, plano de comunicação
└── README.md
```

## Quickstart Local

### 1. Pré-requisitos
- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Conta no [Supabase](https://supabase.com) (free tier)
- Conta no [Clerk](https://clerk.com) (free tier)

### 2. Setup

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/nr1check.git
cd nr1check

# Instale as dependências
pnpm install

# Copie o env exemplo
cp .env.example .env
# Preencha as variáveis (Supabase + Clerk no mínimo)

# Gere e rode as migrations
pnpm db:generate
pnpm db:push

# Seed das perguntas COPSOQ
pnpm db:seed

# Inicie tudo (API + Web em paralelo)
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Deploy em Produção

Veja [docs/DEPLOY.md](./docs/DEPLOY.md) para o passo-a-passo completo.

## Pricing

| Plano | Preço | Limite |
|---|---|---|
| **NR1Check Solo** | R$79/mês | até 20 funcionários |
| **NR1Check Pro** | R$139/mês | até 50 funcionários |
| **Corporativo** | sob consulta | 50+ funcionários |

## Funcionalidades

- ✅ Onboarding guiado (5 passos)
- ✅ COPSOQ II-Br (40 questões, 8 dimensões)
- ✅ Gerador de PGR com IA
- ✅ Ordens de Serviço por função
- ✅ Fichas de EPI
- ✅ Registro de Incidentes com hash SHA-256
- ✅ Canal de Denúncias anônimo
- ✅ Painel de Defesa (semáforo verde/amarelo/vermelho)
- ✅ 4 cursos de micro-learning
- ✅ Exportação XML eSocial S-2240
- ✅ Notificações WhatsApp

## Licença

Proprietário © 2026 NR1Check / Alternative Ventures.
Contato: henriquecampos66@gmail.com | (11) 94798-4328
