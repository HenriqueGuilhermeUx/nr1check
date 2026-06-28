import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Plus,
  Printer,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type RiskCategory = "fisico" | "quimico" | "biologico" | "ergonomico" | "acidente" | "psicossocial";
type ActionStatus = "pendente" | "em_andamento" | "concluido";
type RiskLevel = "baixo" | "medio" | "alto" | "critico";

type RiskItem = {
  id: string;
  department: string;
  role: string;
  category: RiskCategory;
  description: string;
  hazardSource: string;
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

type RiskForm = Omit<RiskItem, "id" | "createdAt">;

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: ClipboardList },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  fisico: "Físico",
  quimico: "Químico",
  biologico: "Biológico",
  ergonomico: "Ergonômico",
  acidente: "Acidente",
  psicossocial: "Psicossocial",
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const EMPTY_FORM: RiskForm = {
  department: "",
  role: "",
  category: "ergonomico",
  description: "",
  hazardSource: "",
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

function storageKey(companyId?: number) {
  return `nr1check:risk-inventory:${companyId ?? "demo"}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RiskInventory() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [form, setForm] = useState<RiskForm>(EMPTY_FORM);
  const [filter, setFilter] = useState<"todos" | RiskCategory>("todos");

  useEffect(() => {
    if (isLoading) return;
    const raw = window.localStorage.getItem(storageKey(company?.id));
    if (!raw) {
      setRisks([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as RiskItem[];
      setRisks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRisks([]);
    }
  }, [company?.id, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    window.localStorage.setItem(storageKey(company?.id), JSON.stringify(risks));
  }, [company?.id, isLoading, risks]);

  const filteredRisks = useMemo(() => {
    if (filter === "todos") return risks;
    return risks.filter((risk) => risk.category === filter);
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
      toast.error("Descreva o risco identificado.");
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
    toast.success("Risco adicionado ao inventário.");
  }

  function deleteRisk(id: string) {
    setRisks((current) => current.filter((risk) => risk.id !== id));
    toast.success("Risco removido.");
  }

  function updateStatus(id: string, status: ActionStatus) {
    setRisks((current) => current.map((risk) => (risk.id === id ? { ...risk, status } : risk)));
  }

  function addExamples() {
    const examples: RiskItem[] = [
      {
        id: createId(),
        department: "Administrativo",
        role: "Equipe de escritório",
        category: "ergonomico",
        description: "Postura inadequada e permanência prolongada sentado durante a jornada.",
        hazardSource: "Mobiliário, layout do posto de trabalho e rotina sedentária.",
        consequences: "Dores lombares, fadiga, desconforto muscular e queda de produtividade.",
        exposedWorkers: "Colaboradores administrativos",
        probability: 3,
        severity: 3,
        existingMeasures: "Cadeiras ajustáveis em parte dos postos.",
        recommendedAction: "Revisar ergonomia dos postos, orientar pausas e ajustar mobiliário.",
        responsible: "Gestor administrativo",
        deadline: "",
        monitoring: "Revisão trimestral e registro de evidências fotográficas.",
        status: "pendente",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Atendimento",
        role: "Atendentes",
        category: "psicossocial",
        description: "Alta demanda, pressão por atendimento rápido e conflitos ocasionais com clientes.",
        hazardSource: "Organização do trabalho, metas, filas e contato direto com público.",
        consequences: "Estresse, exaustão, conflitos interpessoais e absenteísmo.",
        exposedWorkers: "Equipe de atendimento",
        probability: 4,
        severity: 3,
        existingMeasures: "Reuniões pontuais com liderança.",
        recommendedAction: "Definir fluxo de escalonamento, pausas e orientação de liderança para situações críticas.",
        responsible: "Responsável RH / gestor da unidade",
        deadline: "",
        monitoring: "Avaliação psicossocial periódica e análise de relatos.",
        status: "em_andamento",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Operação",
        role: "Equipe operacional",
        category: "acidente",
        description: "Risco de queda, tropeço ou escorregamento em áreas de circulação.",
        hazardSource: "Cabos, piso molhado, caixas e circulação desorganizada.",
        consequences: "Quedas, lesões leves ou afastamentos.",
        exposedWorkers: "Todos os trabalhadores da unidade",
        probability: 3,
        severity: 4,
        existingMeasures: "Sinalização básica em algumas áreas.",
        recommendedAction: "Organizar circulação, sinalizar áreas molhadas e criar rotina de inspeção.",
        responsible: "Gestor da unidade",
        deadline: "",
        monitoring: "Checklist mensal de inspeção.",
        status: "pendente",
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
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Inventário de Riscos + Plano de Ação</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registre riscos ocupacionais, classifique probabilidade/severidade e acompanhe ações preventivas.
            </p>
            {company && (
              <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={addExamples} className="btn-secondary text-sm">
              <Plus className="h-4 w-4" />
              Adicionar exemplos
            </button>
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir / salvar PDF
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
          <MetricCard label="Riscos registrados" value={stats.total} helper="Inventário atual" />
          <MetricCard label="Críticos" value={stats.critical} helper="Ação prioritária" tone="red" />
          <MetricCard label="Altos" value={stats.high} helper="Acompanhar de perto" tone="orange" />
          <MetricCard label="Ações pendentes" value={stats.pending} helper="Plano de ação" tone="yellow" />
          <MetricCard label="Conclusão" value={`${stats.completion}%`} helper={`${stats.done} concluída(s)`} tone="green" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr] print:block">
          <div className="card print:hidden">
            <h2 className="text-lg font-bold text-gray-900">Adicionar risco</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use linguagem simples. O objetivo é criar evidência e orientar o plano de ação.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Setor / área *</label>
                  <input
                    className="input"
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                    placeholder="Ex: Administrativo"
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
                <label className="label">Tipo de risco</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as RiskCategory })}
                >
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Risco identificado *</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Ex: pressão excessiva por atendimento rápido e conflitos com clientes"
                />
              </div>

              <div>
                <label className="label">Fonte / causa do perigo</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.hazardSource}
                  onChange={(event) => setForm({ ...form, hazardSource: event.target.value })}
                  placeholder="Ex: organização do trabalho, metas, layout, máquinas, produtos ou circulação"
                />
              </div>

              <div>
                <label className="label">Consequências possíveis</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.consequences}
                  onChange={(event) => setForm({ ...form, consequences: event.target.value })}
                  placeholder="Ex: estresse, queda, lesão, afastamento, fadiga, erro operacional"
                />
              </div>

              <div>
                <label className="label">Trabalhadores expostos</label>
                <input
                  className="input"
                  value={form.exposedWorkers}
                  onChange={(event) => setForm({ ...form, exposedWorkers: event.target.value })}
                  placeholder="Ex: 8 atendentes / todos da unidade"
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
                  placeholder="Ex: sinalização, orientação verbal, EPIs, pausas, treinamento"
                />
              </div>

              <div>
                <label className="label">Ação preventiva/corretiva *</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.recommendedAction}
                  onChange={(event) => setForm({ ...form, recommendedAction: event.target.value })}
                  placeholder="Ex: criar checklist, revisar posto de trabalho, orientar liderança, sinalizar área"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Responsável</label>
                  <input
                    className="input"
                    value={form.responsible}
                    onChange={(event) => setForm({ ...form, responsible: event.target.value })}
                    placeholder="Ex: Gestor da unidade"
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
                  placeholder="Ex: revisão mensal, checklist, evidência fotográfica"
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
                  <h2 className="text-lg font-bold text-gray-900">Inventário de Riscos Ocupacionais</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Matriz simples: Probabilidade × Severidade. Use como base para o PGR.
                  </p>
                </div>

                <select
                  className="input max-w-xs print:hidden"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as "todos" | RiskCategory)}
                >
                  <option value="todos">Todos os tipos</option>
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
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
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Risco</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Tipo</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">P×S</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Nível</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 print:hidden">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRisks.map((risk) => {
                        const score = getRiskScore(risk.probability, risk.severity);
                        const level = getRiskLevel(score);

                        return (
                          <tr key={risk.id} className="align-top">
                            <td className="px-3 py-3">
                              <p className="font-medium text-gray-900">{risk.department}</p>
                              <p className="text-xs text-gray-500">{risk.role || "Grupo não informado"}</p>
                            </td>
                            <td className="px-3 py-3 max-w-md">
                              <p className="text-gray-900">{risk.description}</p>
                              {risk.consequences && <p className="mt-1 text-xs text-gray-500">Consequências: {risk.consequences}</p>}
                            </td>
                            <td className="px-3 py-3">{CATEGORY_LABEL[risk.category]}</td>
                            <td className="px-3 py-3">
                              {risk.probability} × {risk.severity} = {score}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRiskClass(level)}`}>
                                {getRiskLabel(level)}
                              </span>
                            </td>
                            <td className="px-3 py-3 print:hidden">
                              <button onClick={() => deleteRisk(risk.id)} className="text-red-600 hover:text-red-700">
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
                <EmptyInventory onAddExamples={addExamples} />
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Plano de Ação</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cada risco cadastrado gera uma ação de prevenção, correção ou monitoramento.
              </p>

              {risks.length ? (
                <div className="mt-5 space-y-3">
                  {risks.map((risk) => {
                    const score = getRiskScore(risk.probability, risk.severity);
                    const level = getRiskLevel(score);

                    return (
                      <div key={risk.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRiskClass(level)}`}>
                                {getRiskLabel(level)}
                              </span>
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusClass(risk.status)}`}>
                                {STATUS_LABEL[risk.status]}
                              </span>
                              <span className="text-xs text-gray-500">{risk.department}</span>
                            </div>

                            <p className="mt-2 font-semibold text-gray-900">{risk.recommendedAction}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              Risco: {risk.description}
                            </p>

                            <div className="mt-3 grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                              <p><strong>Responsável:</strong> {risk.responsible || "não informado"}</p>
                              <p><strong>Prazo:</strong> {risk.deadline || "não definido"}</p>
                              <p><strong>Monitoramento:</strong> {risk.monitoring || "não informado"}</p>
                            </div>
                          </div>

                          <div className="print:hidden">
                            <select
                              className="input min-w-[170px]"
                              value={risk.status}
                              onChange={(event) => updateStatus(risk.id, event.target.value as ActionStatus)}
                            >
                              <option value="pendente">Pendente</option>
                              <option value="em_andamento">Em andamento</option>
                              <option value="concluido">Concluído</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 font-medium text-gray-900">Nenhuma ação criada ainda</p>
                  <p className="mt-1 text-sm text-gray-500">Adicione um risco para gerar o plano de ação.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 card border-blue-100 bg-blue-50 text-blue-900 print:hidden">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Uso recomendado</p>
              <p className="mt-1 text-sm text-blue-800">
                Esta tela organiza informações para apoiar o GRO/PGR. A validação técnica deve ser feita pelo responsável legal/técnico da empresa quando aplicável.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = "gray" }: { label: string; value: string | number; helper: string; tone?: "gray" | "red" | "orange" | "yellow" | "green" }) {
  const tones = {
    gray: "border-gray-200 bg-white text-gray-900",
    red: "border-red-200 bg-red-50 text-red-900",
    orange: "border-orange-200 bg-orange-50 text-orange-900",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
    green: "border-green-200 bg-green-50 text-green-900",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{helper}</p>
    </div>
  );
}

function EmptyInventory({ onAddExamples }: { onAddExamples: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-3 font-semibold text-gray-900">Inventário vazio</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">
        Comece adicionando riscos reais da empresa ou use exemplos para visualizar como o inventário e o plano de ação ficam.
      </p>
      <button onClick={onAddExamples} className="btn-secondary mt-4 text-sm">
        <Plus className="h-4 w-4" />
        Adicionar exemplos
      </button>
    </div>
  );
}
