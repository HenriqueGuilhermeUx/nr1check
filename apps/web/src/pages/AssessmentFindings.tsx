import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Lock,
  MessageSquare,
  Printer,
  Send,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type RiskLevel = "baixo" | "medio" | "alto" | "critico";

type CycleLite = {
  id: number;
  name: string;
  status: string;
  totalInvited?: number | null;
  totalResponded?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

type AssessmentResponseLite = {
  id?: number;
  scores?: Record<string, number> | null;
  riskLevel?: RiskLevel | null;
  completedAt?: string | Date | null;
};

type Finding = {
  id: string;
  dimension: string;
  average: number;
  level: RiskLevel;
  respondentCount: number;
  finding: string;
  recommendedAction: string;
  evidence: string;
  createdAt: string;
};

type InventoryItem = {
  id: string;
  department: string;
  role: string;
  factor: string;
  description: string;
  source: string;
  consequences: string;
  exposedWorkers: string;
  evidence: string;
  probability: number;
  severity: number;
  existingMeasures: string;
  recommendedAction: string;
  responsible: string;
  deadline: string;
  monitoring: string;
  status: "pendente" | "em_andamento" | "concluido";
  sourceId?: string;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", icon: BarChart3 },
  { to: "/achados-psicossociais", label: "Achados", icon: Brain },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const DIMENSION_RULES: Record<string, { factor: string; finding: string; action: string; consequences: string }> = {
  "Exigências Quantitativas": {
    factor: "sobrecarga",
    finding: "Indício agregado de sobrecarga, falta de tempo, acúmulo de demandas e pressão por entrega.",
    action: "Revisar distribuição de tarefas, metas, prioridades, prazos e dimensionamento da equipe.",
    consequences: "Aumento de estresse, fadiga, erros, conflitos e queda de desempenho.",
  },
  "Ritmo de Trabalho": {
    factor: "sobrecarga",
    finding: "Indício agregado de ritmo acelerado, prazos apertados e exigência de atenção constante.",
    action: "Rever fluxo de trabalho, pausas, filas de demanda, metas operacionais e suporte da liderança.",
    consequences: "Cansaço, tensão, irritabilidade, sensação de pressão contínua e maior risco de falhas.",
  },
  "Autonomia e Influência": {
    factor: "baixa_autonomia",
    finding: "Indício agregado de baixa autonomia, pouca influência nas decisões e pouca participação na organização do trabalho.",
    action: "Criar rotinas de escuta, participação, alinhamento de prioridades e clareza de decisão.",
    consequences: "Baixo engajamento, frustração, conflitos e dificuldade de adaptação às demandas.",
  },
  "Apoio Social": {
    factor: "comunicacao",
    finding: "Indício agregado de suporte insuficiente entre colegas, liderança ou canais internos de apoio.",
    action: "Treinar liderança, criar rituais de acompanhamento, melhorar feedback e estruturar canal de apoio.",
    consequences: "Isolamento, piora do clima, conflitos e dificuldade de resolução de problemas.",
  },
  "Qualidade de Liderança": {
    factor: "lideranca",
    finding: "Indício agregado de falhas de liderança, planejamento, desenvolvimento ou gestão de conflitos.",
    action: "Capacitar gestores, registrar acordos de liderança, melhorar planejamento e acompanhar reincidências.",
    consequences: "Conflitos, insegurança, queda de confiança e aumento de relatos ou insatisfação.",
  },
  "Insegurança no Trabalho": {
    factor: "inseguranca",
    finding: "Indício agregado de insegurança, preocupação com mudanças e incerteza sobre estabilidade ou futuro do trabalho.",
    action: "Melhorar comunicação interna, transparência nas mudanças, previsibilidade e orientação aos trabalhadores.",
    consequences: "Ansiedade, queda de foco, resistência a mudanças e insegurança organizacional.",
  },
  "Satisfação no Trabalho": {
    factor: "reconhecimento",
    finding: "Indício agregado de baixa satisfação, baixo reconhecimento ou baixo aproveitamento de capacidades.",
    action: "Revisar reconhecimento, feedback, oportunidades, condições de trabalho e uso das capacidades da equipe.",
    consequences: "Desmotivação, queda de produtividade, rotatividade e enfraquecimento do clima organizacional.",
  },
  "Saúde e Bem-Estar": {
    factor: "bem_estar",
    finding: "Indício agregado de desgaste, estresse, dificuldade de desligamento ou impacto negativo do trabalho no bem-estar.",
    action: "Priorizar análise de carga, pausas, jornada, suporte, encaminhamentos e monitoramento recorrente.",
    consequences: "Esgotamento, absenteísmo, presenteísmo, conflitos e maior risco de adoecimento relacionado ao trabalho.",
  },
};

function createId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

function classifyRisk(score: number): RiskLevel {
  if (score >= 75) return "critico";
  if (score >= 50) return "alto";
  if (score >= 25) return "medio";
  return "baixo";
}

function riskLabel(level: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
    critico: "Crítico",
  };
  return map[level];
}

function riskClass(level: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    baixo: "border-green-200 bg-green-50 text-green-700",
    medio: "border-yellow-200 bg-yellow-50 text-yellow-700",
    alto: "border-orange-200 bg-orange-50 text-orange-700",
    critico: "border-red-200 bg-red-50 text-red-700",
  };
  return map[level];
}

function riskToMatrix(level: RiskLevel) {
  if (level === "critico") return { probability: 5, severity: 5 };
  if (level === "alto") return { probability: 4, severity: 4 };
  if (level === "medio") return { probability: 3, severity: 3 };
  return { probability: 2, severity: 2 };
}

function inventoryStorageKey(companyId?: number) {
  return `nr1check:psychosocial-risk-inventory:${companyId ?? "demo"}`;
}

function findingsStorageKey(companyId?: number, cycleId?: number | null) {
  return `nr1check:assessment-findings:${companyId ?? "demo"}:${cycleId ?? "no-cycle"}`;
}

function buildFinding(dimension: string, average: number, respondentCount: number, cycleName: string): Finding {
  const level = classifyRisk(average);
  const rule = DIMENSION_RULES[dimension] ?? {
    factor: "outros",
    finding: `Indício agregado de atenção na dimensão ${dimension}.`,
    action: "Analisar causas, consultar trabalhadores de forma agregada e definir medidas preventivas proporcionais.",
    consequences: "Possível impacto no clima, no desempenho, no bem-estar e na organização do trabalho.",
  };

  return {
    id: createId("finding"),
    dimension,
    average,
    level,
    respondentCount,
    finding: rule.finding,
    recommendedAction: rule.action,
    evidence: `Achado calculado a partir do ciclo "${cycleName}", com ${respondentCount} resposta(s) consideradas.`,
    createdAt: new Date().toISOString(),
  };
}

function convertFindingToInventory(finding: Finding): InventoryItem {
  const rule = DIMENSION_RULES[finding.dimension] ?? {
    factor: "outros",
    consequences: "Possível impacto no clima, no desempenho, no bem-estar e na organização do trabalho.",
  };
  const matrix = riskToMatrix(finding.level);

  return {
    id: createId("risk"),
    sourceId: finding.id,
    department: "Empresa / análise agregada",
    role: "Trabalhadores avaliados no ciclo",
    factor: rule.factor,
    description: `${finding.finding} Score médio: ${finding.average}/100. Nível: ${riskLabel(finding.level)}.`,
    source: "Avaliação psicossocial agregada",
    consequences: rule.consequences,
    exposedWorkers: `${finding.respondentCount} respondente(s) no ciclo`,
    evidence: finding.evidence,
    probability: matrix.probability,
    severity: matrix.severity,
    existingMeasures: "",
    recommendedAction: finding.recommendedAction,
    responsible: "Gestor/RH/Responsável designado",
    deadline: "",
    monitoring: "Reavaliar após implantação das ações e registrar evidências.",
    status: "pendente",
  };
}

export default function AssessmentFindings() {
  const { user } = useUser();
  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0] as { id: number; name: string } | undefined;
  const companyId = company?.id ?? 0;

  const { data: cycles, isLoading: loadingCycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: questions } = trpc.assessment.questions.useQuery();

  const cycleList = ((cycles ?? []) as CycleLite[]);
  const activeCycle = cycleList.find((cycle) => cycle.status === "active") ?? cycleList[0] ?? null;

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const currentCycleId = selectedCycleId ?? activeCycle?.id ?? null;
  const currentCycle = cycleList.find((cycle) => cycle.id === currentCycleId) ?? activeCycle;

  const { data: cycleResults, isLoading: loadingResults } = trpc.assessment.cycleResults.useQuery(
    { companyId, cycleId: currentCycleId ?? 0 },
    { enabled: !!companyId && !!currentCycleId },
  );

  const responses = ((cycleResults?.responses ?? []) as AssessmentResponseLite[]);
  const respondentCount = responses.length;
  const invitedCount = Number(currentCycle?.totalInvited ?? 0);
  const responseRate = invitedCount ? Math.round((respondentCount / invitedCount) * 100) : 0;
  const canShowFindings = respondentCount >= 3;

  const dimensions = useMemo(() => {
    const set = new Set<string>();
    for (const question of questions ?? []) {
      if (question.dimension) set.add(question.dimension);
    }

    for (const response of responses) {
      for (const dimension of Object.keys(response.scores ?? {})) {
        set.add(dimension);
      }
    }

    return Array.from(set);
  }, [questions, responses]);

  const findings = useMemo(() => {
    if (!currentCycle || !canShowFindings) return [];

    return dimensions
      .map((dimension) => {
        const values = responses
          .map((response) => response.scores?.[dimension])
          .filter((value): value is number => typeof value === "number");

        if (!values.length) return null;

        const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
        return buildFinding(dimension, average, values.length, currentCycle.name);
      })
      .filter((finding): finding is Finding => Boolean(finding))
      .sort((a, b) => b.average - a.average);
  }, [canShowFindings, currentCycle, dimensions, responses]);

  const highFindings = findings.filter((finding) => finding.level === "alto" || finding.level === "critico");
  const averageScore = findings.length
    ? Math.round(findings.reduce((sum, finding) => sum + finding.average, 0) / findings.length)
    : 0;
  const overallLevel = classifyRisk(averageScore);

  function saveFindingsEvidence() {
    if (!companyId || !currentCycleId) {
      toast.error("Selecione um ciclo antes de salvar.");
      return;
    }

    window.localStorage.setItem(findingsStorageKey(companyId, currentCycleId), JSON.stringify(findings));
    toast.success("Achados salvos como evidência local.");
  }

  function sendToInventory() {
    if (!companyId || !currentCycleId) {
      toast.error("Selecione um ciclo antes de enviar.");
      return;
    }

    if (!findings.length) {
      toast.error("Não há achados suficientes para enviar.");
      return;
    }

    const key = inventoryStorageKey(companyId);
    const existingRaw = window.localStorage.getItem(key);
    let existing: InventoryItem[] = [];

    try {
      existing = existingRaw ? (JSON.parse(existingRaw) as InventoryItem[]) : [];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    const existingSourceIds = new Set(existing.map((item) => item.sourceId).filter(Boolean));
    const newItems = findings
      .filter((finding) => !existingSourceIds.has(finding.id))
      .filter((finding) => finding.level !== "baixo")
      .map(convertFindingToInventory);

    const next = [...newItems, ...existing];
    window.localStorage.setItem(key, JSON.stringify(next));
    window.localStorage.setItem(findingsStorageKey(companyId, currentCycleId), JSON.stringify(findings));

    toast.success(`${newItems.length} achado(s) enviado(s) ao inventário.`);
  }

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
                item.to === "/achados-psicossociais" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
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
              <Brain className="h-3.5 w-3.5" />
              Fase 4 do roadmap
            </div>
            <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">
              Achados Agregados por Dimensão
            </h1>
            <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">
              Transforme respostas da avaliação em achados psicossociais por dimensão, respeitando confidencialidade
              e preparando riscos para o inventário e plano de ação.
            </p>
            {company && (
              <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button onClick={saveFindingsEvidence} className="btn-secondary text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Salvar evidência
            </button>
            <button onClick={sendToInventory} className="btn-primary text-sm">
              <Send className="h-4 w-4" />
              Enviar ao inventário
            </button>
          </div>
        </div>

        {loadingCompany ? (
          <div className="card">
            <p className="text-gray-500">Carregando empresa...</p>
          </div>
        ) : !company ? (
          <div className="card border-yellow-200 bg-yellow-50">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-semibold text-yellow-900">Cadastre a empresa primeiro</h2>
                <p className="mt-1 text-sm text-yellow-800">
                  Os achados precisam estar vinculados a uma empresa.
                </p>
                <Link to="/comecar" className="btn-primary mt-4">
                  Configurar empresa →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Respondentes" value={loadingResults ? "..." : String(respondentCount)} helper={`${responseRate}% de participação`} />
          <MetricCard label="Dimensões" value={String(dimensions.length)} helper="avaliadas no ciclo" />
          <MetricCard label="Achados altos/críticos" value={String(highFindings.length)} helper="prioridade para ação" />
          <MetricCard label="Nível geral" value={findings.length ? riskLabel(overallLevel) : "—"} helper={findings.length ? `score médio ${averageScore}/100` : "sem dados suficientes"} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Ciclo analisado</h2>
              <p className="mt-1 text-sm text-gray-500">
                Escolha o ciclo para calcular os achados agregados.
              </p>

              {loadingCycles ? (
                <p className="mt-4 text-sm text-gray-500">Carregando ciclos...</p>
              ) : cycleList.length ? (
                <select
                  className="input mt-4"
                  value={currentCycleId ?? ""}
                  onChange={(event) => setSelectedCycleId(Number(event.target.value))}
                >
                  {cycleList.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name} — {cycle.status}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Nenhum ciclo encontrado. Crie um ciclo em Avaliação Psicossocial.
                </div>
              )}

              {currentCycle && (
                <div className="mt-4 grid gap-2 text-sm">
                  <Info label="Nome" value={currentCycle.name} />
                  <Info label="Status" value={currentCycle.status} />
                  <Info label="Prazo" value={formatDate(currentCycle.endDate)} />
                </div>
              )}

              <Link to="/avaliacao-psicossocial" className="btn-secondary mt-4 w-full text-sm">
                Abrir avaliação <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="card border-brand-200 bg-brand-50">
              <div className="flex gap-3">
                <Lock className="mt-1 h-5 w-5 text-brand-700" />
                <div>
                  <h2 className="font-bold text-brand-900">Regra de confidencialidade</h2>
                  <p className="mt-1 text-sm text-brand-800">
                    O app só exibe achados quando houver pelo menos 3 respostas no ciclo. Para empresas pequenas,
                    isso ajuda a evitar exposição individual.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Como interpretar</h2>
              <div className="mt-4 space-y-2">
                <Legend level="baixo" text="0–24: monitorar" />
                <Legend level="medio" text="25–49: atenção" />
                <Legend level="alto" text="50–74: ação recomendada" />
                <Legend level="critico" text="75–100: prioridade imediata" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!currentCycleId ? (
              <EmptyState title="Selecione um ciclo" description="Crie ou selecione um ciclo de avaliação para calcular achados." />
            ) : respondentCount < 3 ? (
              <div className="card border-yellow-200 bg-yellow-50">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-700" />
                  <div>
                    <h2 className="font-semibold text-yellow-900">Dados insuficientes para achados agregados</h2>
                    <p className="mt-1 text-sm text-yellow-800">
                      Este ciclo tem {respondentCount} resposta(s). Recomendação: coletar pelo menos 3 respostas antes
                      de gerar achados, para preservar confidencialidade.
                    </p>
                    <Link to="/avaliacao-psicossocial" className="btn-primary mt-4">
                      Voltar para coleta →
                    </Link>
                  </div>
                </div>
              </div>
            ) : findings.length ? (
              <>
                <div className="card">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Achados sugeridos</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Média por dimensão calculada a partir dos scores salvos nas respostas do ciclo.
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(overallLevel)}`}>
                      Geral: {riskLabel(overallLevel)}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {findings.map((finding) => (
                      <div key={finding.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-gray-900">{finding.dimension}</h3>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${riskClass(finding.level)}`}>
                                {riskLabel(finding.level)}
                              </span>
                              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                {finding.average}/100
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{finding.finding}</p>
                          </div>
                          <div className="flex min-w-[120px] items-center justify-center rounded-xl bg-gray-50 p-3">
                            <div className="text-center">
                              <TrendingUp className="mx-auto h-5 w-5 text-gray-500" />
                              <p className="mt-1 text-xs text-gray-500">{finding.respondentCount} resposta(s)</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <DetailCard title="Ação recomendada" icon={<Target className="h-4 w-4" />}>
                            {finding.recommendedAction}
                          </DetailCard>
                          <DetailCard title="Evidência" icon={<FileText className="h-4 w-4" />}>
                            {finding.evidence}
                          </DetailCard>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-gray-900 text-white">
                  <h2 className="text-lg font-bold">Próxima fase: Inventário Psicossocial</h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Ao enviar os achados para o inventário, o app cria riscos com probabilidade, severidade,
                    consequência e ação recomendada. Depois seguimos para o Plano de Ação Inteligente.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={sendToInventory} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                      Enviar ao inventário <ArrowRight className="h-4 w-4" />
                    </button>
                    <Link to="/inventario-riscos" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                      Abrir inventário
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="Sem achados calculáveis" description="Não foram encontrados scores por dimensão neste ciclo." />
            )}
          </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Legend({ level, text }: { level: RiskLevel; text: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${riskClass(level)}`}>
      {text}
    </div>
  );
}

function DetailCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-gray-700">{children}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="card text-center py-12">
      <Brain className="mx-auto h-10 w-10 text-gray-400" />
      <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
