import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  Link as LinkIcon,
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

type FindingStatus = "novo" | "enviado_inventario" | "em_acao";
type FindingRiskLevel = "baixo" | "medio" | "alto" | "critico";

type FindingForm = {
  department: string;
  dimension: string;
  description: string;
  evidenceSource: string;
  probability: number;
  severity: number;
  suggestedAction: string;
  responsible: string;
  deadline: string;
};

type PsychosocialFinding = FindingForm & {
  id: string;
  status: FindingStatus;
  createdAt: string;
  sentToInventoryAt?: string;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação Psicossocial", icon: BarChart3 },
  { to: "/inventario-riscos", label: "Inventário Psicossocial", icon: ClipboardList },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
];

const EMPTY_FINDING: FindingForm = {
  department: "",
  dimension: "Sobrecarga de trabalho",
  description: "",
  evidenceSource: "Questionário psicossocial / consulta aos trabalhadores",
  probability: 3,
  severity: 3,
  suggestedAction: "",
  responsible: "",
  deadline: "",
};

const DIMENSIONS = [
  "Sobrecarga de trabalho",
  "Metas e cobrança intensa",
  "Assédio moral / tratamento abusivo",
  "Assédio sexual",
  "Conflitos interpessoais",
  "Suporte da liderança",
  "Autonomia e controle do trabalho",
  "Clareza de função",
  "Jornada e pausas",
  "Comunicação interna",
  "Violência externa / clientes / público",
  "Reconhecimento e justiça organizacional",
];

const QUESTIONNAIRE_MODELS = [
  {
    title: "Questionário base de fatores psicossociais",
    badge: "trabalhadores",
    description:
      "Perguntas por dimensão para identificar fatores como sobrecarga, metas, assédio, liderança, autonomia, clareza e comunicação.",
  },
  {
    title: "Checklist do gestor",
    badge: "empresa",
    description:
      "Roteiro de verificação sobre organização do trabalho, canais de escuta, tratativa de conflitos e medidas de prevenção.",
  },
  {
    title: "Consulta contínua / relatos",
    badge: "canal",
    description:
      "Canal para registrar relatos, ocorrências, conflitos, assédio, violência externa e sinais de risco psicossocial.",
  },
  {
    title: "Plano de ação e evidências",
    badge: "PGR",
    description:
      "Registro de medidas, responsáveis, prazos e monitoramento para demonstrar gestão ativa dos riscos psicossociais.",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findingsStorageKey(companyId?: number) {
  return `nr1check:psychosocial-findings:${companyId ?? "demo"}`;
}

function riskInventoryStorageKey(companyId?: number) {
  return `nr1check:psychosocial-risk-inventory:${companyId ?? "demo"}`;
}

function getRiskScore(probability: number, severity: number) {
  return probability * severity;
}

function getRiskLevel(score: number): FindingRiskLevel {
  if (score <= 4) return "baixo";
  if (score <= 9) return "medio";
  if (score <= 16) return "alto";
  return "critico";
}

function getRiskLabel(level: FindingRiskLevel) {
  const labels: Record<FindingRiskLevel, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
    critico: "Crítico",
  };
  return labels[level];
}

function getRiskClass(level: FindingRiskLevel) {
  const classes: Record<FindingRiskLevel, string> = {
    baixo: "bg-green-50 text-green-700 border-green-200",
    medio: "bg-yellow-50 text-yellow-700 border-yellow-200",
    alto: "bg-orange-50 text-orange-700 border-orange-200",
    critico: "bg-red-50 text-red-700 border-red-200",
  };
  return classes[level];
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function PsychosocialAssessment() {
  const navigate = useNavigate();
  const { user } = useUser();

  const { data: companies, isLoading: loadingCompanies } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id;

  const { data: employees } = trpc.employee.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  const { data: questions } = trpc.assessment.questions.useQuery();

  const { data: cycles, refetch: refetchCycles } = trpc.assessment.cycles.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const selectedCycle = useMemo(() => {
    if (!cycles?.length) return null;
    return cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles.find((cycle) => cycle.status === "active") ?? cycles[0];
  }, [cycles, selectedCycleId]);

  const { data: results } = trpc.assessment.cycleResults.useQuery(
    { companyId: companyId!, cycleId: selectedCycle?.id ?? 0 },
    { enabled: !!companyId && !!selectedCycle?.id },
  );

  const [cycleName, setCycleName] = useState("Avaliação Psicossocial Inicial");
  const [cycleEndDate, setCycleEndDate] = useState(todayPlus(15));
  const [findingForm, setFindingForm] = useState<FindingForm>(EMPTY_FINDING);
  const [findings, setFindings] = useState<PsychosocialFinding[]>([]);

  const createCycle = trpc.assessment.createCycle.useMutation({
    onSuccess: async (result) => {
      toast.success(`Ciclo criado. ${result.employeesNotified} trabalhador(es) vinculados.`);
      setSelectedCycleId(result.cycle.id);
      await refetchCycles();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!companyId || loadingCompanies) return;
    const raw = window.localStorage.getItem(findingsStorageKey(companyId));
    if (!raw) {
      setFindings([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PsychosocialFinding[];
      setFindings(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFindings([]);
    }
  }, [companyId, loadingCompanies]);

  useEffect(() => {
    if (!companyId || loadingCompanies) return;
    window.localStorage.setItem(findingsStorageKey(companyId), JSON.stringify(findings));
  }, [companyId, findings, loadingCompanies]);

  const stats = useMemo(() => {
    const totalEmployees = employees?.length ?? 0;
    const invited = selectedCycle?.totalInvited ?? totalEmployees;
    const responded = selectedCycle?.totalResponded ?? results?.responses?.length ?? 0;
    const responseRate = invited ? Math.round((responded / invited) * 100) : 0;
    const highFindings = findings.filter((finding) => getRiskLevel(getRiskScore(finding.probability, finding.severity)) === "alto").length;
    const criticalFindings = findings.filter((finding) => getRiskLevel(getRiskScore(finding.probability, finding.severity)) === "critico").length;
    const pendingInventory = findings.filter((finding) => finding.status === "novo").length;

    return { totalEmployees, invited, responded, responseRate, highFindings, criticalFindings, pendingInventory };
  }, [employees, findings, results?.responses?.length, selectedCycle]);

  const publicBase = `${window.location.origin}/responder-avaliacao`;

  function getEmployeePublicLink(employeeId: number) {
    if (!companyId || !selectedCycle?.id) return "";
    return `${publicBase}?companyId=${companyId}&cycleId=${selectedCycle.id}&employeeId=${employeeId}`;
  }

  async function copyText(text: string, successMessage = "Copiado.") {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  }

  function copyAllLinks() {
    if (!employees?.length || !selectedCycle?.id) {
      toast.error("Crie um ciclo e cadastre funcionários primeiro.");
      return;
    }

    const list = employees
      .map((employee) => `${employee.name} (${employee.role ?? "sem cargo"}): ${getEmployeePublicLink(employee.id)}`)
      .join("\n");

    void copyText(list, "Lista de links copiada.");
  }

  function addFinding() {
    if (!findingForm.department.trim()) {
      toast.error("Informe o setor/área.");
      return;
    }

    if (!findingForm.description.trim()) {
      toast.error("Descreva o achado psicossocial.");
      return;
    }

    if (!findingForm.suggestedAction.trim()) {
      toast.error("Informe a ação recomendada.");
      return;
    }

    const item: PsychosocialFinding = {
      ...findingForm,
      id: createId(),
      status: "novo",
      createdAt: new Date().toISOString(),
    };

    setFindings((current) => [item, ...current]);
    setFindingForm(EMPTY_FINDING);
    toast.success("Achado agregado registrado.");
  }

  function addExamples() {
    const examples: PsychosocialFinding[] = [
      {
        id: createId(),
        department: "Atendimento",
        dimension: "Sobrecarga de trabalho",
        description: "Relatos agregados indicam alta demanda, pressão por velocidade e dificuldade de pausas no atendimento.",
        evidenceSource: "Questionário psicossocial + reunião com liderança",
        probability: 4,
        severity: 4,
        suggestedAction: "Revisar dimensionamento da equipe, definir pausas, criar regra de escalonamento para clientes críticos e acompanhar carga semanal.",
        responsible: "Gestor de atendimento / RH",
        deadline: todayPlus(30),
        status: "novo",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Comercial",
        dimension: "Metas e cobrança intensa",
        description: "Achado agregado aponta percepção de cobrança intensa, comunicação focada apenas em meta e baixa previsibilidade de prioridades.",
        evidenceSource: "Questionário psicossocial",
        probability: 4,
        severity: 3,
        suggestedAction: "Revisar comunicação de metas, incluir rotina de acompanhamento saudável e treinamento de liderança para feedback construtivo.",
        responsible: "Diretoria comercial / RH",
        deadline: todayPlus(45),
        status: "novo",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Operações",
        dimension: "Clareza de função",
        description: "Parte dos trabalhadores relata dúvida sobre responsabilidades, prioridades e a quem recorrer em situações de conflito.",
        evidenceSource: "Consulta aos trabalhadores",
        probability: 3,
        severity: 3,
        suggestedAction: "Atualizar descrições de função, fluxos de decisão e canais formais de suporte.",
        responsible: "Gestor operacional",
        deadline: todayPlus(60),
        status: "novo",
        createdAt: new Date().toISOString(),
      },
    ];

    setFindings((current) => [...examples, ...current]);
    toast.success("Exemplos adicionados.");
  }

  function deleteFinding(id: string) {
    setFindings((current) => current.filter((finding) => finding.id !== id));
    toast.success("Achado removido.");
  }

  function sendFindingToInventory(finding: PsychosocialFinding) {
    const currentRaw = window.localStorage.getItem(riskInventoryStorageKey(companyId));
    const currentInventory = currentRaw ? JSON.parse(currentRaw) : [];

    const riskItem = {
      id: createId(),
      origin: "avaliacao_psicossocial",
      originFindingId: finding.id,
      department: finding.department,
      role: "Grupo/setor avaliado",
      factor: finding.dimension,
      description: finding.description,
      evidence: finding.evidenceSource,
      consequences: "Possível adoecimento relacionado ao trabalho, queda de engajamento, conflitos, absenteísmo ou redução de desempenho.",
      exposedWorkers: "Trabalhadores do setor/grupo avaliado",
      probability: finding.probability,
      severity: finding.severity,
      existingMeasures: "",
      recommendedAction: finding.suggestedAction,
      responsible: finding.responsible,
      deadline: finding.deadline,
      monitoring: "Acompanhar execução da ação, registrar evidências e reavaliar percepção dos trabalhadores.",
      status: "pendente",
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(riskInventoryStorageKey(companyId), JSON.stringify([riskItem, ...currentInventory]));

    setFindings((current) =>
      current.map((item) =>
        item.id === finding.id
          ? { ...item, status: "enviado_inventario", sentToInventoryAt: new Date().toISOString() }
          : item,
      ),
    );

    toast.success("Achado enviado para o Inventário Psicossocial.");
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
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Avaliação Psicossocial</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crie ciclos, disponibilize questionários, colete respostas e transforme achados agregados em inventário e plano de ação.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir evidência
            </button>
            <Link to="/inventario-riscos" className="btn-primary text-sm">
              Ir para inventário →
            </Link>
          </div>
        </div>

        {!companyId ? (
          <div className="card text-center py-12">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">Cadastre uma empresa primeiro</h2>
            <p className="mt-2 text-sm text-gray-500">A avaliação precisa estar vinculada a uma empresa.</p>
            <Link to="/comecar" className="btn-primary mt-6">
              Configurar empresa
            </Link>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
              <MetricCard label="Trabalhadores" value={stats.totalEmployees} helper="Base cadastrada" />
              <MetricCard label="Convidados" value={stats.invited} helper="Ciclo selecionado" />
              <MetricCard label="Respondidos" value={stats.responded} helper={`${stats.responseRate}% de adesão`} tone="green" />
              <MetricCard label="Achados altos" value={stats.highFindings} helper="Priorizar ação" tone="orange" />
              <MetricCard label="Achados críticos" value={stats.criticalFindings} helper="Ação imediata" tone="red" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr] print:block">
              <div className="space-y-6 print:hidden">
                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">1. Criar ciclo de avaliação</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Um ciclo registra data, público convidado, respostas e evidências da consulta.
                  </p>

                  <div className="mt-5 space-y-3">
                    <div>
                      <label className="label">Nome do ciclo</label>
                      <input className="input" value={cycleName} onChange={(event) => setCycleName(event.target.value)} />
                    </div>

                    <div>
                      <label className="label">Prazo para resposta</label>
                      <input
                        className="input"
                        type="date"
                        value={cycleEndDate}
                        onChange={(event) => setCycleEndDate(event.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => {
                        createCycle.mutate({
                          companyId,
                          name: cycleName,
                          endDate: cycleEndDate ? new Date(`${cycleEndDate}T23:59:59`).toISOString() : undefined,
                        });
                      }}
                      disabled={createCycle.isPending || !cycleName.trim()}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {createCycle.isPending ? "Criando..." : "Criar ciclo"}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">2. Meios de resposta sem WhatsApp</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Use links individuais por funcionário. Pode enviar por e-mail, intranet, SMS manual, QR impresso ou comunicação interna.
                  </p>

                  <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
                    <p className="text-sm font-semibold text-brand-800">Link público seguro o suficiente para MVP</p>
                    <p className="mt-1 text-xs text-brand-700">
                      Cada link contém empresa, ciclo e trabalhador. O gestor acompanha só resultado agregado nesta tela.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={copyAllLinks} className="btn-secondary text-sm">
                      <Copy className="h-4 w-4" />
                      Copiar todos os links
                    </button>

                    <Link to="/funcionarios" className="btn-secondary text-sm">
                      <Users className="h-4 w-4" />
                      Funcionários
                    </Link>
                  </div>

                  <div className="mt-4 max-h-72 space-y-2 overflow-auto">
                    {!selectedCycle ? (
                      <p className="text-sm text-gray-500">Crie ou selecione um ciclo para gerar links.</p>
                    ) : !employees?.length ? (
                      <p className="text-sm text-gray-500">Cadastre funcionários para gerar links individuais.</p>
                    ) : (
                      employees.map((employee) => {
                        const link = getEmployeePublicLink(employee.id);
                        return (
                          <div key={employee.id} className="rounded-lg border border-gray-200 p-3">
                            <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.role ?? "sem cargo informado"}</p>
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => copyText(link, `Link de ${employee.name} copiado.`)} className="btn-secondary text-xs">
                                <Copy className="h-3 w-3" />
                                Copiar
                              </button>
                              <a href={link} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                                <ExternalLink className="h-3 w-3" />
                                Abrir
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">3. Registrar achado agregado</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Use resultados do questionário, relatos e observações para criar achados sem expor respostas individuais.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="label">Setor / grupo *</label>
                      <input
                        className="input"
                        value={findingForm.department}
                        onChange={(event) => setFindingForm({ ...findingForm, department: event.target.value })}
                        placeholder="Ex: Atendimento"
                      />
                    </div>

                    <div>
                      <label className="label">Fator psicossocial</label>
                      <select
                        className="input"
                        value={findingForm.dimension}
                        onChange={(event) => setFindingForm({ ...findingForm, dimension: event.target.value })}
                      >
                        {DIMENSIONS.map((dimension) => (
                          <option key={dimension} value={dimension}>
                            {dimension}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Achado agregado *</label>
                      <textarea
                        className="input min-h-[90px]"
                        value={findingForm.description}
                        onChange={(event) => setFindingForm({ ...findingForm, description: event.target.value })}
                        placeholder="Ex: respostas agregadas indicam pressão por metas e dificuldade de pausas"
                      />
                    </div>

                    <div>
                      <label className="label">Fonte de evidência</label>
                      <input
                        className="input"
                        value={findingForm.evidenceSource}
                        onChange={(event) => setFindingForm({ ...findingForm, evidenceSource: event.target.value })}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Probabilidade: {findingForm.probability}</label>
                        <select
                          className="input"
                          value={findingForm.probability}
                          onChange={(event) => setFindingForm({ ...findingForm, probability: Number(event.target.value) })}
                        >
                          <option value={1}>1 - Rara</option>
                          <option value={2}>2 - Baixa</option>
                          <option value={3}>3 - Possível</option>
                          <option value={4}>4 - Provável</option>
                          <option value={5}>5 - Frequente</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Severidade: {findingForm.severity}</label>
                        <select
                          className="input"
                          value={findingForm.severity}
                          onChange={(event) => setFindingForm({ ...findingForm, severity: Number(event.target.value) })}
                        >
                          <option value={1}>1 - Leve</option>
                          <option value={2}>2 - Moderada</option>
                          <option value={3}>3 - Relevante</option>
                          <option value={4}>4 - Grave</option>
                          <option value={5}>5 - Muito grave</option>
                        </select>
                      </div>
                    </div>

                    <div className={`rounded-xl border p-3 ${getRiskClass(getRiskLevel(getRiskScore(findingForm.probability, findingForm.severity)))}`}>
                      <p className="text-sm font-semibold">Classificação</p>
                      <p className="mt-1 text-sm">
                        Score {getRiskScore(findingForm.probability, findingForm.severity)}/25 — Risco{" "}
                        {getRiskLabel(getRiskLevel(getRiskScore(findingForm.probability, findingForm.severity)))}
                      </p>
                    </div>

                    <div>
                      <label className="label">Ação recomendada *</label>
                      <textarea
                        className="input min-h-[80px]"
                        value={findingForm.suggestedAction}
                        onChange={(event) => setFindingForm({ ...findingForm, suggestedAction: event.target.value })}
                        placeholder="Ex: revisar metas, definir pausas, treinar liderança e acompanhar indicadores"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Responsável</label>
                        <input
                          className="input"
                          value={findingForm.responsible}
                          onChange={(event) => setFindingForm({ ...findingForm, responsible: event.target.value })}
                          placeholder="Ex: RH / gestor"
                        />
                      </div>

                      <div>
                        <label className="label">Prazo</label>
                        <input
                          className="input"
                          type="date"
                          value={findingForm.deadline}
                          onChange={(event) => setFindingForm({ ...findingForm, deadline: event.target.value })}
                        />
                      </div>
                    </div>

                    <button onClick={addFinding} className="btn-primary w-full">
                      <Plus className="h-4 w-4" />
                      Registrar achado
                    </button>

                    <button onClick={addExamples} className="btn-secondary w-full">
                      Adicionar exemplos
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Ciclos de avaliação</h2>
                      <p className="mt-1 text-sm text-gray-500">Selecione o ciclo para visualizar links e resultados.</p>
                    </div>

                    <select
                      className="input max-w-sm print:hidden"
                      value={selectedCycle?.id ?? ""}
                      onChange={(event) => setSelectedCycleId(Number(event.target.value))}
                    >
                      <option value="">Selecione um ciclo</option>
                      {(cycles ?? []).map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name} — {cycle.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCycle ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <InfoTile label="Ciclo" value={selectedCycle.name} />
                      <InfoTile label="Status" value={selectedCycle.status} />
                      <InfoTile label="Respostas" value={`${selectedCycle.totalResponded ?? 0}/${selectedCycle.totalInvited ?? 0}`} />
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-gray-500">Nenhum ciclo selecionado.</p>
                  )}
                </div>

                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">Questionários e evidências disponíveis</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    A NR-1 exige gestão dos fatores psicossociais; o app deixa instrumentos práticos disponíveis para gerar evidência.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {QUESTIONNAIRE_MODELS.map((model) => (
                      <div key={model.title} className="rounded-xl border border-gray-200 p-4">
                        <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          {model.badge}
                        </span>
                        <h3 className="mt-2 font-semibold text-gray-900">{model.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{model.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm font-semibold text-yellow-800">Observação importante</p>
                    <p className="mt-1 text-xs text-yellow-700">
                      Não travamos em um questionário único. O produto precisa oferecer instrumentos, registro de consulta,
                      análise agregada e plano de ação documentado.
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Achados agregados</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Envie cada achado para o Inventário Psicossocial para criar ação, responsável, prazo e monitoramento.
                      </p>
                    </div>

                    <Link to="/inventario-riscos" className="btn-secondary text-sm print:hidden">
                      <LinkIcon className="h-4 w-4" />
                      Ver inventário
                    </Link>
                  </div>

                  {findings.length ? (
                    <div className="mt-5 space-y-3">
                      {findings.map((finding) => {
                        const level = getRiskLevel(getRiskScore(finding.probability, finding.severity));
                        return (
                          <div key={finding.id} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getRiskClass(level)}`}>
                                    {getRiskLabel(level)}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                    {finding.department}
                                  </span>
                                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                                    {finding.dimension}
                                  </span>
                                  {finding.status === "enviado_inventario" && (
                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                                      Enviado ao inventário
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-3 font-semibold text-gray-900">{finding.description}</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                  <strong>Fonte:</strong> {finding.evidenceSource}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                  <strong>Ação:</strong> {finding.suggestedAction}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  Responsável: {finding.responsible || "não informado"} · Prazo: {finding.deadline || "não definido"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 print:hidden">
                                <button
                                  onClick={() => sendFindingToInventory(finding)}
                                  disabled={finding.status === "enviado_inventario"}
                                  className="btn-primary text-xs disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Enviar para inventário
                                </button>

                                <button onClick={() => deleteFinding(finding.id)} className="btn-secondary text-xs">
                                  <Trash2 className="h-3 w-3" />
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                      <p className="text-sm font-medium text-gray-700">Nenhum achado agregado registrado.</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Crie achados a partir do questionário, relatos, entrevistas ou observações da empresa.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper: string;
  tone?: "default" | "green" | "yellow" | "orange" | "red";
}) {
  const tones = {
    default: "bg-white border-gray-200 text-gray-900",
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{helper}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
