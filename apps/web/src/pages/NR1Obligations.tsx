import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  Lock,
  MessageSquare,
  Send,
  Shield,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";

type PhaseStatus = "feito" | "em_andamento" | "proximo" | "pendente";

type Phase = {
  id: number;
  title: string;
  description: string;
  status: PhaseStatus;
  route?: string;
  button?: string;
  evidence: string;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", icon: BarChart3 },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: FileText },
  { to: "/documentos-assinaturas", label: "Documentos", icon: FileCheck },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const PHASES: Phase[] = [
  {
    id: 1,
    title: "Mapa de Obrigações NR-1 Psicossocial",
    description: "Centralizar o que a empresa precisa fazer: escuta, análise, inventário, plano de ação, evidências e revisão.",
    status: "feito",
    route: "/obrigacoes-nr1",
    button: "Ver fase",
    evidence: "Checklist de obrigações e trilha de implantação.",
  },
  {
    id: 2,
    title: "Avaliação Psicossocial Base",
    description: "Disponibilizar questionário aos trabalhadores, com linguagem simples, confidencialidade e coleta por ciclo.",
    status: "feito",
    route: "/avaliacao-psicossocial",
    button: "Abrir avaliação",
    evidence: "Ciclo criado, perguntas ativas, convidados e respostas registradas.",
  },
  {
    id: 3,
    title: "Coleta sem depender de WhatsApp",
    description: "Permitir resposta por link individual, QR Code, intranet, comunicado interno, e-mail, SMS manual ou WhatsApp quando disponível.",
    status: "feito",
    route: "/avaliacao-psicossocial",
    button: "Gerenciar coleta",
    evidence: "Links individuais, QR, comunicado e registro de distribuição.",
  },
  {
    id: 4,
    title: "Achados Agregados por Dimensão",
    description: "Transformar respostas em achados por dimensão: carga, ritmo, autonomia, liderança, apoio, insegurança e bem-estar.",
    status: "proximo",
    route: "/avaliacao-psicossocial",
    button: "Ver achados",
    evidence: "Resultado agregado, sem exposição individual do trabalhador.",
  },
  {
    id: 5,
    title: "Inventário Psicossocial",
    description: "Converter achados em riscos psicossociais organizacionais por setor, função ou grupo exposto.",
    status: "pendente",
    route: "/inventario-riscos",
    button: "Abrir inventário",
    evidence: "Risco, fonte, trabalhadores expostos, probabilidade, severidade e nível.",
  },
  {
    id: 6,
    title: "Plano de Ação Inteligente",
    description: "Sugerir ações para cada risco: responsável, prazo, monitoramento, status e evidência esperada.",
    status: "pendente",
    route: "/inventario-riscos",
    button: "Ver plano",
    evidence: "Ações preventivas/corretivas com responsável e prazo.",
  },
  {
    id: 7,
    title: "Canal de Relatos e Ocorrências",
    description: "Manter canal contínuo para relatos sobre assédio, conflitos, violência, sobrecarga e outros fatores psicossociais.",
    status: "pendente",
    route: "/denuncias",
    button: "Abrir relatos",
    evidence: "Protocolos, status de apuração, medidas e histórico.",
  },
  {
    id: 8,
    title: "Dossiê de Evidências",
    description: "Gerar pacote de evidências para demonstrar que a empresa avaliou, analisou, agiu e revisou.",
    status: "em_andamento",
    route: "/documentos-assinaturas",
    button: "Gerar documentos",
    evidence: "PDF com ciclo, participação, achados, ações, relatos e revisões.",
  },
  {
    id: 9,
    title: "Seção Psicossocial do PGR",
    description: "Gerar uma seção psicossocial para anexar ao PGR, sem prometer substituir responsável técnico.",
    status: "pendente",
    route: "/documentos-assinaturas",
    button: "Gerar seção PGR",
    evidence: "Metodologia, riscos identificados, plano de ação e próxima revisão.",
  },
  {
    id: 10,
    title: "Painel Executivo e Monetização",
    description: "Consolidar status, score, pendências, planos pagos, cobrança, renovação e alertas para o empresário.",
    status: "pendente",
    route: "/painel-defesa",
    button: "Ver painel",
    evidence: "Semáforo, pendências críticas, histórico e plano contratado.",
  },
];

const STATUS_CONFIG: Record<PhaseStatus, { label: string; className: string }> = {
  feito: { label: "Feito", className: "border-green-200 bg-green-50 text-green-700" },
  em_andamento: { label: "Em andamento", className: "border-brand-200 bg-brand-50 text-brand-700" },
  proximo: { label: "Próximo", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  pendente: { label: "Pendente", className: "border-gray-200 bg-gray-50 text-gray-600" },
};

const OBLIGATIONS = [
  {
    title: "Identificar fatores psicossociais",
    detail: "Mapear sobrecarga, metas, ritmo, liderança, apoio, conflitos, assédio, autonomia, jornada e bem-estar.",
  },
  {
    title: "Consultar trabalhadores com confidencialidade",
    detail: "Coletar percepção dos trabalhadores sem expor respostas individuais ao empregador.",
  },
  {
    title: "Analisar resultados agregados",
    detail: "Consolidar dados por empresa, setor ou grupo, respeitando número mínimo para preservar anonimato.",
  },
  {
    title: "Criar inventário psicossocial",
    detail: "Registrar riscos psicossociais identificados, fontes, consequências e trabalhadores expostos.",
  },
  {
    title: "Definir plano de ação",
    detail: "Criar medidas preventivas/corretivas com responsável, prazo, evidência e monitoramento.",
  },
  {
    title: "Registrar evidências",
    detail: "Guardar comunicação, respostas agregadas, achados, ações, revisões e documentos gerados.",
  },
  {
    title: "Revisar o PGR",
    detail: "Atualizar a seção psicossocial quando houver nova avaliação, ocorrência, mudança de processo ou revisão periódica.",
  },
];

export default function NR1Obligations() {
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];

  const completed = PHASES.filter((phase) => phase.status === "feito").length;
  const inProgress = PHASES.filter((phase) => phase.status === "em_andamento").length;
  const next = PHASES.filter((phase) => phase.status === "proximo").length;
  const total = PHASES.length;
  const progress = Math.round(((completed + inProgress * 0.5) / total) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col print:hidden">
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">NR1Check</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                item.to === "/obrigacoes-nr1" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="text-sm min-w-0">
            <p className="font-medium truncate">{user?.firstName ?? "Gestor"}</p>
            <p className="text-gray-500 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Shield className="h-3.5 w-3.5" />
              Roadmap oficial NR1Check
            </div>
            <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">
              Obrigações NR-1 Psicossocial
            </h1>
            <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">
              Mapa prático para a empresa sair da dúvida e seguir uma trilha defensável:
              avaliar fatores psicossociais, gerar achados agregados, criar inventário,
              executar plano de ação e guardar evidências.
            </p>
            {company && (
              <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="card min-w-[240px] bg-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progresso do roadmap</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{progress}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {completed} feita(s), {inProgress} em andamento, {next} próxima(s).
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="card">
            <p className="text-gray-500">Carregando empresa...</p>
          </div>
        ) : !companies?.length ? (
          <div className="card border-yellow-200 bg-yellow-50">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-semibold text-yellow-900">Cadastre a empresa primeiro</h2>
                <p className="mt-1 text-sm text-yellow-800">
                  Para seguir a trilha NR-1, comece pelo cadastro da empresa.
                </p>
                <Link to="/comecar" className="btn-primary mt-4">
                  Configurar empresa →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Fases do roadmap" value="10" helper="Sequência oficial do produto" />
          <MetricCard label="Obrigação central" value="Psicossocial" helper="Foco exclusivo NR-1" />
          <MetricCard label="Entrega da empresa" value="Evidências" helper="Provar avaliação, ação e revisão" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Roadmap oficial de entrega</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Vamos seguir essas 10 fases, uma por uma, até o produto ficar completo.
                </p>
              </div>
              <Link to="/documentos-assinaturas" className="btn-primary hidden sm:inline-flex">
                Documentos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {PHASES.map((phase) => {
                const cfg = STATUS_CONFIG[phase.status];

                return (
                  <div key={phase.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                          {phase.id}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{phase.title}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{phase.description}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            <strong>Evidência:</strong> {phase.evidence}
                          </p>
                        </div>
                      </div>

                      {phase.route && (
                        <Link to={phase.route} className="btn-secondary whitespace-nowrap text-sm">
                          {phase.button ?? "Abrir"} <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card border-brand-200 bg-brand-50">
              <div className="flex gap-3">
                <Lock className="mt-1 h-5 w-5 text-brand-700" />
                <div>
                  <h2 className="font-bold text-brand-900">Regra de ouro</h2>
                  <p className="mt-1 text-sm text-brand-800">
                    O empregador deve ver resultados agregados, não respostas individuais. Isso aumenta confiança,
                    reduz resistência dos trabalhadores e protege a empresa.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Checklist de obrigação prática</h2>
              <div className="mt-4 space-y-3">
                {OBLIGATIONS.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Canais de resposta</h2>
              <p className="mt-1 text-sm text-gray-500">
                O app não depende só de WhatsApp. Suporta formas simples e auditáveis.
              </p>
              <div className="mt-4 grid gap-2">
                {["Link individual", "QR Code individual", "E-mail", "Intranet", "Comunicado interno", "WhatsApp/Z-API opcional"].map((channel) => (
                  <div key={channel} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <Send className="h-4 w-4 text-gray-400" />
                    {channel}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}
