import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  MessageSquare,
  Plus,
  Printer,
  Send,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type ManualRiskLevel = "baixo" | "medio" | "alto" | "critico";

type ManualFinding = {
  id: string;
  area: string;
  dimension: string;
  score: number;
  comments: string;
  recommendedAction: string;
  responsible: string;
  deadline: string;
  createdAt: string;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação Psicossocial", icon: Brain },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: ClipboardList },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Gestão", icon: Shield },
];

const DIMENSIONS = [
  {
    key: "sobrecarga_ritmo",
    label: "Sobrecarga e ritmo de trabalho",
    description: "Volume de demandas, pressão de tempo, acúmulo de tarefas e interrupções constantes.",
    action: "Revisar distribuição de demandas, priorização, pausas e capacidade real da equipe.",
  },
  {
    key: "metas_cobranca",
    label: "Metas, cobrança e pressão por resultado",
    description: "Cobranças excessivas, metas incompatíveis, exposição pública de desempenho ou pressão contínua.",
    action: "Revisar metas, critérios de cobrança, comunicação da liderança e rituais de acompanhamento.",
  },
  {
    key: "lideranca_suporte",
    label: "Liderança e suporte",
    description: "Falta de apoio da gestão, comunicação agressiva, ausência de orientação ou baixa disponibilidade da liderança.",
    action: "Treinar lideranças, criar rotina de 1:1, orientar feedback respeitoso e canal de escalonamento.",
  },
  {
    key: "clareza_papel",
    label: "Clareza de função e autonomia",
    description: "Papéis confusos, falta de autonomia, conflitos de prioridade e pouca previsibilidade sobre responsabilidades.",
    action: "Formalizar responsabilidades, fluxos de decisão, critérios de prioridade e limites de autonomia.",
  },
  {
    key: "relacoes_conflitos",
    label: "Relações, conflitos e clima",
    description: "Conflitos interpessoais, comunicação ruim, isolamento, falta de confiança ou ambiente hostil.",
    action: "Mapear conflitos, mediar situações, reforçar regras de convivência e acompanhamento pelo gestor/RH.",
  },
  {
    key: "assedio_violencia",
    label: "Assédio, violência e discriminação",
    description: "Indícios de assédio moral/sexual, discriminação, humilhação, ameaça ou violência externa/interna.",
    action: "Ativar protocolo de apuração, canal confidencial, medidas de proteção e comunicação formal de tolerância zero.",
  },
  {
    key: "jornada_recuperacao",
    label: "Jornada, pausas e recuperação",
    description: "Jornadas longas, pausas insuficientes, excesso de horas extras, plantões ou dificuldade de desconexão.",
    action: "Revisar jornada, pausas, escalas, horas extras e regras de comunicação fora do expediente.",
  },
  {
    key: "mudancas_inseguranca",
    label: "Mudanças, insegurança e comunicação",
    description: "Mudanças sem comunicação, incerteza sobre emprego, falta de transparência e ruídos organizacionais.",
    action: "Criar plano de comunicação, FAQ interno, rituais de atualização e canal de dúvidas.",
  },
];

const SCALE_LABELS = [
  { value: 1, label: "Baixo", detail: "controlado" },
  { value: 2, label: "Atenção", detail: "ponto pontual" },
  { value: 3, label: "Moderado", detail: "precisa ação" },
  { value: 4, label: "Alto", detail: "prioritário" },
  { value: 5, label: "Crítico", detail: "ação imediata" },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getRiskLevel(score: number): ManualRiskLevel {
  if (score <= 1.8) return "baixo";
  if (score <= 2.8) return "medio";
  if (score <= 3.8) return "alto";
  return "critico";
}

function getRiskLabel(level: ManualRiskLevel) {
  const labels: Record<ManualRiskLevel, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
    critico: "Crítico",
  };
  return labels[level];
}

function getRiskClass(level: ManualRiskLevel) {
  const classes: Record<ManualRiskLevel, string> = {
    baixo: "border-green-200 bg-green-50 text-green-700",
    medio: "border-yellow-200 bg-yellow-50 text-yellow-700",
    alto: "border-orange-200 bg-orange-50 text-orange-700",
    critico: "border-red-200 bg-red-50 text-red-700",
  };
  return classes[level];
}

function getStorageKey(companyId?: number) {
  return `nr1check:psychosocial-assessment:${companyId ?? "demo"}`;
}

function useManualFindings(companyId?: number) {
  const [findings, setFindings] = useState<ManualFinding[]>(() => {
    try {
      const raw = window.localStorage.getItem(getStorageKey(companyId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  function persist(next: ManualFinding[]) {
    setFindings(next);
    window.localStorage.setItem(getStorageKey(companyId), JSON.stringify(next));
  }

  return { findings, persist };
}

export default function PsychosocialAssessment() {
  const navigate = useNavigate();
  const { user } = useUser();
  const utils = trpc.useUtils();
  const { data: companies, isLoading: loadingCompanies } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id;

  const { data: employees } = trpc.employee.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  const { data: cycles, isLoading: loadingCycles } = trpc.assessment.cycles.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  const { data: questions } = trpc.assessment.questions.useQuery();

  const createCycle = trpc.assessment.createCycle.useMutation({
    onSuccess: (result) => {
      toast.success(`Avaliação criada. ${result.employeesNotified} funcionário(s) notificado(s).`);
      if (companyId) utils.assessment.cycles.invalidate({ companyId });
      setCycleName("Avaliação psicossocial inicial");
      setEndDate("");
    },
    onError: (error) => toast.error(error.message),
  });

  const [cycleName, setCycleName] = useState("Avaliação psicossocial inicial");
  const [endDate, setEndDate] = useState("");

  const { findings, persist } = useManualFindings(companyId);
  const [manualArea, setManualArea] = useState("");
  const [manualScores, setManualScores] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, 3])),
  );
  const [manualComments, setManualComments] = useState("");
  const [manualResponsible, setManualResponsible] = useState("");
  const [manualDeadline, setManualDeadline] = useState("");

  const portalLink = companyId
    ? `${window.location.origin}/acesso-funcionario?companyId=${companyId}`
    : `${window.location.origin}/acesso-funcionario`;

  const activeCycle = cycles?.find((cycle: any) => cycle.status === "active") ?? cycles?.[0];

  const manualAverage = useMemo(() => {
    const values = Object.values(manualScores);
    if (!values.length) return 0;
    return values.reduce((total, value) => total + Number(value), 0) / values.length;
  }, [manualScores]);

  const manualLevel = getRiskLevel(manualAverage);

  const findingsStats = useMemo(() => {
    const total = findings.length;
    const highOrCritical = findings.filter((finding) => getRiskLevel(finding.score) === "alto" || getRiskLevel(finding.score) === "critico").length;
    const critical = findings.filter((finding) => getRiskLevel(finding.score) === "critico").length;
    const avg = total ? findings.reduce((sum, finding) => sum + finding.score, 0) / total : 0;
    return { total, highOrCritical, critical, avg };
  }, [findings]);

  function createAssessmentCycle() {
    if (!companyId) {
      toast.error("Cadastre uma empresa antes de criar a avaliação.");
      return;
    }

    createCycle.mutate({
      companyId,
      name: cycleName,
      endDate: endDate ? new Date(`${endDate}T23:59:00`).toISOString() : undefined,
    });
  }

  function copyPortalLink() {
    navigator.clipboard.writeText(portalLink);
    toast.success("Link copiado.");
  }

  function addManualFinding() {
    if (!manualArea.trim()) {
      toast.error("Informe a área/setor avaliado.");
      return;
    }

    const ordered = Object.entries(manualScores)
      .map(([key, score]) => ({
        dimension: DIMENSIONS.find((item) => item.key === key),
        score: Number(score),
      }))
      .filter((item) => item.dimension)
      .sort((a, b) => b.score - a.score);

    const top = ordered[0];
    if (!top?.dimension) return;

    const finding: ManualFinding = {
      id: createId(),
      area: manualArea,
      dimension: top.dimension.label,
      score: manualAverage,
      comments: manualComments,
      recommendedAction: top.dimension.action,
      responsible: manualResponsible,
      deadline: manualDeadline,
      createdAt: new Date().toISOString(),
    };

    persist([finding, ...findings]);
    setManualArea("");
    setManualComments("");
    setManualResponsible("");
    setManualDeadline("");
    setManualScores(Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, 3])));
    toast.success("Resultado agregado registrado.");
  }

  function addDemoFindings() {
    const now = new Date().toISOString();
    const demo: ManualFinding[] = [
      {
        id: createId(),
        area: "Atendimento",
        dimension: "Sobrecarga e ritmo de trabalho",
        score: 4.3,
        comments: "Equipe relata acúmulo de demandas, filas e pressão por respostas rápidas.",
        recommendedAction: "Revisar escala, criar pausas programadas, definir fluxo de escalonamento e acompanhar volume de atendimento.",
        responsible: "Gestor de atendimento",
        deadline: "",
        createdAt: now,
      },
      {
        id: createId(),
        area: "Comercial",
        dimension: "Metas, cobrança e pressão por resultado",
        score: 4.1,
        comments: "Metas percebidas como agressivas e cobrança frequente sem clareza de priorização.",
        recommendedAction: "Revisar metas, rotina de feedback e critérios de cobrança, evitando exposição pública de desempenho.",
        responsible: "Diretoria comercial",
        deadline: "",
        createdAt: now,
      },
      {
        id: createId(),
        area: "Administrativo",
        dimension: "Clareza de função e autonomia",
        score: 3.4,
        comments: "Papéis e prioridades nem sempre são claros entre áreas de suporte.",
        recommendedAction: "Formalizar papéis, responsáveis, fluxos de decisão e canal para dúvidas operacionais.",
        responsible: "Gestor administrativo",
        deadline: "",
        createdAt: now,
      },
    ];

    persist([...demo, ...findings]);
    toast.success("Exemplos adicionados.");
  }

  function deleteFinding(id: string) {
    persist(findings.filter((finding) => finding.id !== id));
    toast.success("Registro removido.");
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
                item.to === "/avaliacao-psicossocial" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
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
        <div className="print:hidden mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar ao dashboard
            </button>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Avaliação Psicossocial NR-1</h1>
            <p className="mt-1 text-sm text-gray-500 max-w-3xl">
              Abra ciclos de avaliação, oriente os trabalhadores e consolide resultados por área para alimentar o inventário psicossocial e o plano de ação.
            </p>
            {company && (
              <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={addDemoFindings} className="btn-secondary text-sm">
              <Plus className="h-4 w-4" />
              Adicionar exemplos
            </button>
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir evidência
            </button>
          </div>
        </div>

        {!company && !loadingCompanies ? (
          <div className="card text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Cadastre a empresa primeiro</h2>
            <p className="mt-2 text-gray-500">A avaliação psicossocial precisa estar vinculada a uma empresa.</p>
            <Link to="/comecar" className="btn-primary mt-6">
              Configurar empresa →
            </Link>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
              <MetricCard label="Funcionários" value={employees?.length ?? 0} helper="base cadastrada" />
              <MetricCard label="Perguntas" value={questions?.length ?? 0} helper="questionário disponível" tone="blue" />
              <MetricCard label="Ciclos" value={cycles?.length ?? 0} helper="avaliações abertas/fechadas" />
              <MetricCard label="Achados" value={findingsStats.total} helper="resultados agregados" tone="yellow" />
              <MetricCard label="Nível médio" value={findingsStats.total ? getRiskLabel(getRiskLevel(findingsStats.avg)) : "—"} helper="manual/agregado" tone={findingsStats.avg >= 3.8 ? "red" : findingsStats.avg >= 2.8 ? "orange" : "green"} />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr] print:block">
              <div className="space-y-6 print:hidden">
                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">Criar ciclo real</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    O ciclo usa os funcionários cadastrados e o portal do funcionário. Se o WhatsApp ainda não estiver configurado, use o link abaixo para orientar acesso.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="label">Nome da avaliação</label>
                      <input className="input" value={cycleName} onChange={(event) => setCycleName(event.target.value)} />
                    </div>

                    <div>
                      <label className="label">Prazo de resposta</label>
                      <input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                    </div>

                    <button onClick={createAssessmentCycle} disabled={createCycle.isPending || !companyId} className="btn-primary w-full">
                      <Send className="h-4 w-4" />
                      {createCycle.isPending ? "Criando..." : "Criar avaliação"}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">Link de acesso dos trabalhadores</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Envie este link para a equipe. O funcionário acessa com CPF e código, responde a avaliação e o resultado fica agregado.
                  </p>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 break-all">
                    {portalLink}
                  </div>

                  <button onClick={copyPortalLink} className="btn-secondary mt-3 w-full text-sm">
                    <Copy className="h-4 w-4" />
                    Copiar link
                  </button>

                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                    <strong>Atenção:</strong> para envio automático por WhatsApp em produção, configure Z-API. Sem isso, use o link manualmente ou teste com usuários internos.
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">Registrar resultado agregado</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Use esta área para lançar achados consolidados por setor e gerar evidência imediata para o plano de ação.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="label">Área / setor avaliado *</label>
                      <input
                        className="input"
                        value={manualArea}
                        onChange={(event) => setManualArea(event.target.value)}
                        placeholder="Ex: Atendimento, Comercial, Operação"
                      />
                    </div>

                    <div className="space-y-3">
                      {DIMENSIONS.map((dimension) => (
                        <div key={dimension.key} className="rounded-xl border border-gray-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{dimension.label}</p>
                              <p className="mt-1 text-xs text-gray-500">{dimension.description}</p>
                            </div>
                            <select
                              className="input w-28 shrink-0 text-sm"
                              value={manualScores[dimension.key] ?? 3}
                              onChange={(event) => setManualScores({ ...manualScores, [dimension.key]: Number(event.target.value) })}
                            >
                              {SCALE_LABELS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.value} - {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`rounded-xl border p-3 ${getRiskClass(manualLevel)}`}>
                      <p className="text-sm font-semibold">Classificação agregada</p>
                      <p className="mt-1 text-sm">
                        Média {manualAverage.toFixed(1)}/5 — Risco {getRiskLabel(manualLevel)}
                      </p>
                    </div>

                    <div>
                      <label className="label">Observações</label>
                      <textarea
                        className="input min-h-[80px]"
                        value={manualComments}
                        onChange={(event) => setManualComments(event.target.value)}
                        placeholder="Ex: equipe relata pressão por prazo, interrupções constantes e baixa autonomia"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Responsável</label>
                        <input className="input" value={manualResponsible} onChange={(event) => setManualResponsible(event.target.value)} placeholder="Ex: RH / gestor" />
                      </div>
                      <div>
                        <label className="label">Prazo</label>
                        <input className="input" type="date" value={manualDeadline} onChange={(event) => setManualDeadline(event.target.value)} />
                      </div>
                    </div>

                    <button onClick={addManualFinding} className="btn-primary w-full">
                      <Plus className="h-4 w-4" />
                      Registrar achado
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:block">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Ciclos de avaliação</h2>
                      <p className="mt-1 text-sm text-gray-500">Histórico de ciclos criados para a empresa.</p>
                    </div>
                  </div>

                  {loadingCycles ? (
                    <p className="mt-4 text-sm text-gray-500">Carregando ciclos...</p>
                  ) : cycles?.length ? (
                    <div className="mt-5 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Avaliação</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Convidados</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Respostas</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Criado em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {cycles.map((cycle: any) => (
                            <tr key={cycle.id}>
                              <td className="px-3 py-3 font-medium text-gray-900">{cycle.name}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${cycle.status === "active" ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                                  {cycle.status === "active" ? "Ativo" : "Fechado"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-gray-600">{cycle.totalInvited ?? 0}</td>
                              <td className="px-3 py-3 text-gray-600">{cycle.totalResponded ?? 0}</td>
                              <td className="px-3 py-3 text-gray-500">{cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString("pt-BR") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyCard
                      icon={Brain}
                      title="Nenhum ciclo criado"
                      description="Crie uma avaliação psicossocial para iniciar a coleta de respostas."
                    />
                  )}
                </div>

                <div className="card">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:block">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Achados psicossociais agregados</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Use estes registros como base para o inventário psicossocial e plano de ação.
                      </p>
                    </div>
                    <Link to="/inventario-riscos" className="btn-secondary text-sm print:hidden">
                      Levar para inventário →
                    </Link>
                  </div>

                  {findings.length ? (
                    <div className="mt-5 space-y-4">
                      {findings.map((finding) => {
                        const level = getRiskLevel(finding.score);
                        return (
                          <article key={finding.id} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{finding.area}</h3>
                                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getRiskClass(level)}`}>
                                    {getRiskLabel(level)} · {finding.score.toFixed(1)}/5
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-gray-700">{finding.dimension}</p>
                                {finding.comments && <p className="mt-2 text-sm text-gray-600">{finding.comments}</p>}
                              </div>
                              <button onClick={() => deleteFinding(finding.id)} className="text-gray-400 hover:text-red-600 print:hidden" title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                              <InfoBox label="Ação recomendada" value={finding.recommendedAction} />
                              <InfoBox label="Responsável" value={finding.responsible || "Definir"} />
                              <InfoBox label="Prazo" value={finding.deadline ? new Date(`${finding.deadline}T12:00:00`).toLocaleDateString("pt-BR") : "Definir"} />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyCard
                      icon={BarChart3}
                      title="Nenhum achado agregado"
                      description="Registre resultados por setor ou adicione exemplos para visualizar o relatório."
                    />
                  )}
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">Dimensões avaliadas</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Estas dimensões representam os principais fatores psicossociais que o app acompanha.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {DIMENSIONS.map((dimension) => (
                      <div key={dimension.key} className="rounded-xl border border-gray-200 p-4">
                        <p className="font-semibold text-gray-900">{dimension.label}</p>
                        <p className="mt-1 text-sm text-gray-500">{dimension.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Uso correto da informação</p>
                      <p className="mt-1 text-sm text-blue-800">
                        A avaliação psicossocial não diagnostica pessoas. Ela identifica fatores organizacionais relacionados ao trabalho e ajuda a empresa a criar medidas preventivas, evidências e plano de ação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = "default" }: { label: string; value: React.ReactNode; helper: string; tone?: "default" | "blue" | "green" | "yellow" | "orange" | "red" }) {
  const tones = {
    default: "border-gray-200 bg-white text-gray-900",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{helper}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-800">{value}</p>
    </div>
  );
}

function EmptyCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}
