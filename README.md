NR1Check
> Plataforma simples para empresas brasileiras organizarem GRO/PGR, inventário de riscos, avaliação psicossocial, plano de ação e evidências da NR-1.
O NR1Check é um produto da Alternative Ventures para PMEs que precisam sair da planilha e da papelada solta e manter uma rotina ativa de conformidade com a NR-1.
A proposta é direta:
ajudar o empresário a entender o status NR-1 da empresa;
organizar inventário de riscos e plano de ação;
coletar avaliação psicossocial dos funcionários;
registrar relatos, ocorrências e evidências;
gerar um PGR básico estruturado;
manter histórico e trilha de auditoria.
> Importante: o NR1Check **não substitui engenheiro de segurança, médico do trabalho, advogado ou responsável técnico**. Ele organiza informações, evidências, processos e documentos para apoiar a gestão do GRO/PGR.
---
Produto atual: NR1Check Essencial
O foco agora é simples, funcional e vendável.
Para o empresário
Dashboard de status NR-1.
Cadastro da empresa.
Cadastro de funcionários.
Inventário de riscos por setor/função.
Plano de ação com responsáveis e prazos.
Avaliação psicossocial agregada.
Relatos e ocorrências.
PGR básico para impressão/exportação.
Para o funcionário
Responder avaliação psicossocial.
Informar risco percebido.
Usar canal de relato/denúncia.
Acessar orientações básicas de segurança.
---
Escopo NR-1 coberto
O sistema foi redimensionado para cobrir o essencial do GRO/PGR:
Cadastro da empresa e responsáveis
CNPJ, CNAE, setor, unidade, responsável legal e dados principais.
Inventário de Riscos Ocupacionais
riscos físicos, químicos, biológicos, ergonômicos, de acidentes e psicossociais;
probabilidade, severidade e nível de risco;
medidas existentes e recomendadas.
Plano de Ação
ação, responsável, prazo, status, evidência e data de conclusão.
Consulta e comunicação com trabalhadores
relato de risco, situação grave, denúncia sensível e protocolo.
Avaliação psicossocial
coleta de respostas dos funcionários;
análise agregada por empresa/setor;
sem diagnóstico médico individual.
Ocorrências e revisão do PGR
registro de acidentes/incidentes;
gatilhos de revisão por mudança de processo, acidente, fiscalização ou revisão periódica.
PGR básico
dados da empresa;
inventário;
matriz de risco;
plano de ação;
histórico de revisão.
---
Stack enxuta
Camada	Tecnologia	Hospedagem
Frontend	Vite + React + TypeScript + Tailwind CSS	Netlify
Backend	Express + tRPC + Node 22	Render
Banco	PostgreSQL	Supabase
Auth	Transição para Supabase Auth	Supabase
Storage	Supabase Storage ou HTML/PDF simples	Supabase
Pagamento	Woovi Pix	Woovi
IA	OpenAI opcional para rascunhos de PGR	OpenAI
Observação sobre a base legada
A primeira versão do código ainda contém integrações herdadas com Clerk, Stripe, Cloudflare R2, Z-API e OpenAI. A estratégia agora é:
manter o que já funciona;
remover dependências desnecessárias em etapas;
trocar Clerk por Supabase Auth;
trocar Stripe por Woovi no final;
usar PGR em HTML/impressão antes de storage complexo.
---
Estrutura do monorepo
```txt
nr1check/
├── apps/
│   ├── web/          # Frontend Vite + React
│   └── api/          # Backend Express + tRPC
├── packages/
│   ├── db/           # Drizzle schema + migrations
│   ├── shared/       # Types, validações e utilitários
│   └── pdf/          # Geração futura de documentos
├── infra/
│   └── supabase/     # SQL e políticas RLS
├── docs/             # Deploy e operação
└── README.md
```
---
Setup local
Pré-requisitos
Node.js 22+
pnpm 9+
Conta Supabase
Rodar localmente
```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```
Frontend local:
```txt
http://localhost:5173
```
Backend local:
```txt
http://localhost:3000/health
```
---
Deploy simples
Netlify: frontend.
Render: backend.
Supabase: banco, auth e storage.
Veja o passo a passo em `SETUP.md` e `docs/DEPLOY.md`.
---
Planos comerciais sugeridos
Plano	Preço sugerido	Limite
Implantação Assistida	R$497	configuração inicial
NR1Check Solo	R$79/mês	até 20 funcionários
NR1Check Pro	R$139/mês	até 50 funcionários
Corporativo	sob consulta	50+ funcionários
A recomendação comercial inicial é vender implantação assistida + mensalidade, para gerar caixa mais rápido.
---
Prioridade atual
Subir backend no Render.
Subir frontend no Netlify.
Garantir cadastro/login.
Garantir cadastro de empresa e funcionários.
Garantir avaliação psicossocial.
Criar inventário de riscos e plano de ação claros.
Gerar PGR básico.
Trocar pagamento para Woovi Pix.
---
Licença
Proprietário © 2026 NR1Check / Alternative Ventures.
