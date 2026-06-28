import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Plus,
  Printer,
  Shield,
  Trash2,
  Users,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type ActionStatus = "pendente" | "em_andamento" | "concluido";
type RiskLevel = "baixo" | "medio" | "alto" | "critico";

type RiskItem = {
  id: string;
  origin?: string;
  originFindingId?: string;
  department: string;
  role: string;
  factor: string;
  description: string;
  evidence: string;
  consequences: string;
  exposedWorkers: string;
  probability: number;
  severity: number;
  existingMeasures: string;
  recommendedAction: string;
  responsible: string;
  deadline: string;
  monitoring: string;
  status: ActionStatus;
  createdAt: string;
};

type RiskForm = Omit<RiskItem, "id" | "createdAt" | "origin" | "originFindingId">;

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação Psicossocial", icon: BarChart3 },
  { to: "/inventario-riscos", label: "Inventário Psicossocial", icon: ClipboardList },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
];

const PSYCHOSOCIAL_FACTORS = [
  "Sobrecarga de trabalho",
  "Metas excessivas / cobrança intensa",
  "Assédio moral",
  "Assédio sexual",
  "Conflitos interpessoais",
  "Falhas de liderança / suporte insuficiente",
  "Baixa autonomia",
  "Falta de clareza de função",
  "Jornada excessiva / pausas insuficientes",
  "Violência externa / clientes / público",
  "Insegurança no trabalho",
  "Comunicação deficiente",
  "Reconhecimento e justiça organizacional",
  "Outros fatores psicossociais",
];

const STATUS_LABEL: Record<ActionStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const EMPTY_FORM: RiskForm = {
  department: "",
  role: "",
  factor: "Sobrecarga de trabalho",
  description: "",
  evidence: "Avaliação psicossocial / relato / observação",
  consequences: "",
  exposedWorkers: "",
  probability: 3,
  severity: 3,
  existingMeasures: "",
  recommendedAction: "",
  responsible: "",
  deadline: "",
  monitoring: "",
  status: "pendente",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function riskInventoryStorageKey(companyId?: number) {
  return `nr1check:psychosocial-risk-inventory:${companyId ?? "demo"}`;
}

function legacyRiskInventoryStorageKey(companyId?: number) {
  return `nr1check:risk-inventory:${companyId ?? "demo"}`;
}

function findingsStorageKey(companyId?: number) {
  return `nr1check:psychosocial-findings:${companyId ?? "demo"}`;
}

function getRiskScore(probability: number, severity: number) {
  return probability * severity;
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 4) return "baixo";
  if (score <= 9) return "medio";
  if (score <= 16) return "alto";
  return "critico";
}

function getRiskLabel(level: RiskLevel) {
  const labels: Record<RiskLevel, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
    critico: "Crítico",
  };
  return labels[level];
}

function getRiskClass(level: RiskLevel) {
  const classes: Record<RiskLevel, string> = {
    baixo: "bg-green-50 text-green-700 border-green-200",
    medio: "bg-yellow-50 text-yellow-700 border-yellow-200",
    alto: "bg-orange-50 text-orange-700 border-orange-200",
    critico: "bg-red-50 text-red-700 border-red-200",
  };
  return classes[level];
}

function getStatusClass(status: ActionStatus) {
  const classes: Record<ActionStatus, string> = {
    pendente: "bg-red-50 text-red-700 border-red-200",
    em_andamento: "bg-yellow-50 text-yellow-700 border-yellow-200",
    concluido: "bg-green-50 text-green-700 border-green-200",
  };
  return classes[status];
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function RiskInventory() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id;

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [form, setForm] = useState<RiskForm>(EMPTY_FORM);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    if (isLoading) return;

    const primary = window.localStorage.getItem(riskInventoryStorageKey(companyId));
    const legacy = window.localStorage.getItem(legacyRiskInventoryStorageKey(companyId));

    if (!primary && !legacy) {
      setRisks([]);
      return;
    }

    try {
      const parsed = JSON.parse(primary ?? legacy ?? "[]") as RiskItem[];
      setRisks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRisks([]);
    }
  }, [companyId, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    window.localStorage.setItem(riskInventoryStorageKey(companyId), JSON.stringify(risks));
  }, [companyId, isLoading, risks]);

  const filteredRisks = useMemo(() => {
    if (filter === "todos") return risks;
    return risks.filter((risk) => risk.factor === filter);
  }, [filter, risks]);

  const stats = useMemo(() => {
    const total = risks.length;
    const critical = risks.filter((risk) => getRiskLevel(getRiskScore(risk.probability, risk.severity)) === "critico").length;
    const high = risks.filter((risk) => getRiskLevel(getRiskScore(risk.probability, risk.severity)) === "alto").length;
    const pending = risks.filter((risk) => risk.status !== "concluido").length;
    const done = risks.filter((risk) => risk.status === "concluido").length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    return { total, critical, high, pending, done, completion };
  }, [risks]);

  const currentScore = getRiskScore(form.probability, form.severity);
  const currentLevel = getRiskLevel(currentScore);

  function addRisk() {
    if (!form.department.trim()) {
      toast.error("Informe o setor ou área.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Descreva o fator psicossocial identificado.");
      return;
    }

    if (!form.recommendedAction.trim()) {
      toast.error("Informe uma ação preventiva/corretiva.");
      return;
    }

    const item: RiskItem = {
      ...form,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setRisks((current) => [item, ...current]);
    setForm(EMPTY_FORM);
    toast.success("Risco psicossocial adicionado ao inventário.");
  }

  function deleteRisk(id: string) {
    setRisks((current) => current.filter((risk) => risk.id !== id));
    toast.success("Risco removido.");
  }

  function updateStatus(id: string, status: ActionStatus) {
    setRisks((current) => current.map((risk) => (risk.id === id ? { ...risk, status } : risk)));
  }

  function importFindings() {
    const raw = window.localStorage.getItem(findingsStorageKey(companyId));
    if (!raw) {
      toast.error("Nenhum achado de avaliação encontrado.");
      return;
    }

    try {
      const findings = JSON.parse(raw) as Array<{
        id: string;
        department: string;
        dimension: string;
        description: string;
        evidenceSource: string;
        probability: number;
        severity: number;
        suggestedAction: string;
        responsible: string;
        deadline: string;
      }>;

      const alreadyImported = new Set(risks.map((risk) => risk.originFindingId).filter(Boolean));
      const mapped: RiskItem[] = findings
        .filter((finding) => !alreadyImported.has(finding.id))
        .map((finding) => ({
          id: createId(),
          origin: "avaliacao_psicossocial",
          originFindingId: finding.id,
          department: finding.department,
          role: "Grupo/setor avaliado",
          factor: finding.dimension,
          description: finding.description,
          evidence: finding.evidenceSource,
          consequences:
            "Possível adoecimento relacionado ao trabalho, queda de engajamento, conflitos, absenteísmo ou redução de desempenho.",
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
        }));

      if (!mapped.length) {
        toast("Nenhum novo achado para importar.");
        return;
      }

      setRisks((current) => [...mapped, ...current]);
      toast.success(`${mapped.length} achado(s) importado(s).`);
    } catch {
      toast.error("Não foi possível importar achados.");
    }
  }

  function addExamples() {
    const examples: RiskItem[] = [
      {
        id: createId(),
        department: "Atendimento",
        role: "Atendentes",
        factor: "Sobrecarga de trabalho",
        description: "Alta demanda, pressão por atendimento rápido e dificuldade de pausas durante picos de movimento.",
        evidence: "Avaliação psicossocial + relatos agregados",
        consequences: "Estresse, exaustão emocional, erros de atendimento, absenteísmo e conflitos.",
        exposedWorkers: "Equipe de atendimento",
        probability: 4,
        severity: 4,
        existingMeasures: "Reuniões pontuais com liderança.",
        recommendedAction: "Revisar dimensionamento, definir pausas, criar fluxo de escalonamento e acompanhar carga semanal.",
        responsible: "Gestor de atendimento / RH",
        deadline: todayPlus(30),
        monitoring: "Revisão mensal dos indicadores e nova escuta com equipe.",
        status: "pendente",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Comercial",
        role: "Vendas",
        factor: "Metas excessivas / cobrança intensa",
        description: "Cobrança diária focada apenas em resultado, com baixa previsibilidade de prioridades e pouca orientação de apoio.",
        evidence: "Questionário psicossocial",
        consequences: "Ansiedade, conflito com liderança, queda de engajamento e rotatividade.",
        exposedWorkers: "Equipe comercial",
        probability: 4,
        severity: 3,
        existingMeasures: "Reunião semanal de performance.",
        recommendedAction: "Revisar comunicação de metas, treinar liderança e incluir rotina de feedback construtivo.",
        responsible: "Diretoria comercial / RH",
        deadline: todayPlus(45),
        monitoring: "Acompanhar relatos, turnover e percepção da equipe.",
        status: "em_andamento",
        createdAt: new Date().toISOString(),
      },
    ];

    setRisks((current) => [...examples, ...current]);
    toast.success("Exemplos adicionados.");
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
                item.to === "/inventario-riscos" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
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
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Inventário Psicossocial + Plano de Ação</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registre apenas fatores psicossociais relacionados ao trabalho, classifique prioridade e acompanhe medidas.
            </p>
            {company && (
              <p className="mt-2 text-sm text-gray-500">{company.name}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={importFindings} className="btn-secondary text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Importar achados
            </button>
            <button onClick={addExamples} className="btn-secondary text-sm">
              <Plus className="h-4 w-4" />
              Exemplos
            </button>
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir / salvar PDF
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
          <MetricCard label="Riscos psicossociais" value={stats.total} helper="Inventário atual" />
          <MetricCard label="Críticos" value={stats.critical} helper="Ação imediata" tone="red" />
          <MetricCard label="Altos" value={stats.high} helper="Prioridade alta" tone="orange" />
          <MetricCard label="Ações pendentes" value={stats.pending} helper="Plano de ação" tone="yellow" />
          <MetricCard label="Conclusão" value={`${stats.completion}%`} helper={`${stats.done} concluída(s)`} tone="green" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr] print:block">
          <div className="card print:hidden">
            <h2 className="text-lg font-bold text-gray-900">Adicionar fator psicossocial</h2>
            <p className="mt-1 text-sm text-gray-500">
              O objetivo é criar evidência de gestão: risco, fonte, consequência, ação, responsável e prazo.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Setor / área *</label>
                  <input
                    className="input"
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                    placeholder="Ex: Atendimento"
                  />
                </div>

                <div>
                  <label className="label">Função / grupo exposto</label>
                  <input
                    className="input"
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                    placeholder="Ex: Atendentes"
                  />
                </div>
              </div>

              <div>
                <label className="label">Fator psicossocial</label>
                <select
                  className="input"
                  value={form.factor}
                  onChange={(event) => setForm({ ...form, factor: event.target.value })}
                >
                  {PSYCHOSOCIAL_FACTORS.map((factor) => (
                    <option key={factor} value={factor}>
                      {factor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Descrição do risco *</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Ex: pressão excessiva por metas e dificuldade de pausas"
                />
              </div>

              <div>
                <label className="label">Fonte de evidência</label>
                <input
                  className="input"
                  value={form.evidence}
                  onChange={(event) => setForm({ ...form, evidence: event.target.value })}
                  placeholder="Ex: questionário, relato, reunião, observação"
                />
              </div>

              <div>
                <label className="label">Consequências possíveis</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.consequences}
                  onChange={(event) => setForm({ ...form, consequences: event.target.value })}
                  placeholder="Ex: estresse, exaustão, conflitos, absenteísmo"
                />
              </div>

              <div>
                <label className="label">Trabalhadores expostos</label>
                <input
                  className="input"
                  value={form.exposedWorkers}
                  onChange={(event) => setForm({ ...form, exposedWorkers: event.target.value })}
                  placeholder="Ex: equipe de atendimento / setor comercial"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Probabilidade: {form.probability}</label>
                  <select
                    className="input"
                    value={form.probability}
                    onChange={(event) => setForm({ ...form, probability: Number(event.target.value) })}
                  >
                    <option value={1}>1 - Rara</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Possível</option>
                    <option value={4}>4 - Provável</option>
                    <option value={5}>5 - Frequente</option>
                  </select>
                </div>

                <div>
                  <label className="label">Severidade: {form.severity}</label>
                  <select
                    className="input"
                    value={form.severity}
                    onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}
                  >
                    <option value={1}>1 - Leve</option>
                    <option value={2}>2 - Moderada</option>
                    <option value={3}>3 - Relevante</option>
                    <option value={4}>4 - Grave</option>
                    <option value={5}>5 - Muito grave</option>
                  </select>
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${getRiskClass(currentLevel)}`}>
                <p className="text-sm font-semibold">Classificação automática</p>
                <p className="mt-1 text-sm">
                  Score {currentScore}/25 — Risco {getRiskLabel(currentLevel)}
                </p>
              </div>

              <div>
                <label className="label">Medidas existentes</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.existingMeasures}
                  onChange={(event) => setForm({ ...form, existingMeasures: event.target.value })}
                  placeholder="Ex: reuniões, pausas, canal de relatos, orientação à liderança"
                />
              </div>

              <div>
                <label className="label">Ação preventiva/corretiva *</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.recommendedAction}
                  onChange={(event) => setForm({ ...form, recommendedAction: event.target.value })}
                  placeholder="Ex: revisar metas, treinar liderança, criar fluxo de escalonamento"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Responsável</label>
                  <input
                    className="input"
                    value={form.responsible}
                    onChange={(event) => setForm({ ...form, responsible: event.target.value })}
                    placeholder="Ex: RH / gestor da área"
                  />
                </div>

                <div>
                  <label className="label">Prazo</label>
                  <input
                    className="input"
                    type="date"
                    value={form.deadline}
                    onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Monitoramento</label>
                <input
                  className="input"
                  value={form.monitoring}
                  onChange={(event) => setForm({ ...form, monitoring: event.target.value })}
                  placeholder="Ex: revisão mensal, nova escuta, indicador de absenteísmo"
                />
              </div>

              <button onClick={addRisk} className="btn-primary w-full">
                <Plus className="h-4 w-4" />
                Adicionar ao inventário
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:block">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inventário de fatores psicossociais</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Base para plano de ação, revisão do PGR e evidências de gestão.
                  </p>
                </div>

                <select className="input max-w-xs print:hidden" value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="todos">Todos os fatores</option>
                  {PSYCHOSOCIAL_FACTORS.map((factor) => (
                    <option key={factor} value={factor}>
                      {factor}
                    </option>
                  ))}
                </select>
              </div>

              {filteredRisks.length ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Setor/Função</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fator</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Risco</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">P×S</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Ação</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 print:hidden">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredRisks.map((risk) => {
                        const level = getRiskLevel(getRiskScore(risk.probability, risk.severity));
                        return (
                          <tr key={risk.id} className="align-top">
                            <td className="px-3 py-3">
                              <p className="font-medium text-gray-900">{risk.department}</p>
                              <p className="text-xs text-gray-500">{risk.role || "grupo não informado"}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-700">{risk.factor}</td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-gray-900">{risk.description}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Evidência: {risk.evidence || "não informada"}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getRiskClass(level)}`}>
                                {risk.probability}×{risk.severity} · {getRiskLabel(level)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-gray-700">{risk.recommendedAction}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Resp.: {risk.responsible || "não informado"} · Prazo: {risk.deadline || "sem prazo"}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <select
                                className={`rounded-full border px-2 py-1 text-xs font-semibold print:hidden ${getStatusClass(risk.status)}`}
                                value={risk.status}
                                onChange={(event) => updateStatus(risk.id, event.target.value as ActionStatus)}
                              >
                                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <span className={`hidden rounded-full border px-2 py-1 text-xs font-semibold print:inline-flex ${getStatusClass(risk.status)}`}>
                                {STATUS_LABEL[risk.status]}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right print:hidden">
                              <button onClick={() => deleteRisk(risk.id)} className="text-gray-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <AlertTriangle className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 font-medium text-gray-700">Nenhum risco psicossocial registrado.</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Importe achados da avaliação ou cadastre fatores manualmente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
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
