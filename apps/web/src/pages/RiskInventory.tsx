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

type PsychosocialFactor =
  | "sobrecarga"
  | "metas_excessivas"
  | "assedio_moral"
  | "assedio_sexual"
  | "conflitos"
  | "lideranca"
  | "baixa_autonomia"
  | "falta_clareza"
  | "jornada"
  | "violencia_clientes"
  | "inseguranca"
  | "comunicacao"
  | "outros";

type ActionStatus = "pendente" | "em_andamento" | "concluido";
type RiskLevel = "baixo" | "medio" | "alto" | "critico";

type PsychosocialRisk = {
  id: string;
  department: string;
  role: string;
  factor: PsychosocialFactor;
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
  status: ActionStatus;
  createdAt: string;
};

type RiskForm = Omit<PsychosocialRisk, "id" | "createdAt">;

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/inventario-riscos", label: "Riscos psicossociais", icon: ClipboardList },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
  { to: "/painel-defesa", label: "Painel de gestão", icon: Shield },
];

const FACTOR_LABEL: Record<PsychosocialFactor, string> = {
  sobrecarga: "Sobrecarga de trabalho",
  metas_excessivas: "Metas excessivas / cobrança intensa",
  assedio_moral: "Assédio moral",
  assedio_sexual: "Assédio sexual",
  conflitos: "Conflitos interpessoais",
  lideranca: "Falhas de liderança / suporte insuficiente",
  baixa_autonomia: "Baixa autonomia",
  falta_clareza: "Falta de clareza de função",
  jornada: "Jornada excessiva / pausas insuficientes",
  violencia_clientes: "Violência externa / clientes / público",
  inseguranca: "Insegurança no trabalho",
  comunicacao: "Comunicação deficiente",
  outros: "Outros fatores psicossociais",
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const EMPTY_FORM: RiskForm = {
  department: "",
  role: "",
  factor: "sobrecarga",
  description: "",
  source: "",
  consequences: "",
  exposedWorkers: "",
  evidence: "",
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
  return `nr1check:psychosocial-risk-inventory:${companyId ?? "demo"}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RiskInventory() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];

  const [risks, setRisks] = useState<PsychosocialRisk[]>([]);
  const [form, setForm] = useState<RiskForm>(EMPTY_FORM);
  const [filter, setFilter] = useState<"todos" | PsychosocialFactor>("todos");

  useEffect(() => {
    if (isLoading) return;

    const raw = window.localStorage.getItem(storageKey(company?.id));
    if (!raw) {
      setRisks([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PsychosocialRisk[];
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

    const item: PsychosocialRisk = {
      ...form,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setRisks((current) => [item, ...current]);
    setForm(EMPTY_FORM);
    toast.success("Fator psicossocial adicionado ao inventário.");
  }

  function deleteRisk(id: string) {
    setRisks((current) => current.filter((risk) => risk.id !== id));
    toast.success("Registro removido.");
  }

  function updateStatus(id: string, status: ActionStatus) {
    setRisks((current) => current.map((risk) => (risk.id === id ? { ...risk, status } : risk)));
  }

  function addExamples() {
    const examples: PsychosocialRisk[] = [
      {
        id: createId(),
        department: "Atendimento",
        role: "Atendentes e supervisores",
        factor: "sobrecarga",
        description: "Alta demanda de atendimento, filas e pressão para resolver solicitações rapidamente.",
        source: "Organização do trabalho, volume de chamados e contato direto com público.",
        consequences: "Estresse, exaustão, irritabilidade, conflitos e aumento de absenteísmo.",
        exposedWorkers: "Equipe de atendimento",
        evidence: "Relatos, taxa de absenteísmo, registros de fila, reclamações e pesquisa interna.",
        probability: 4,
        severity: 3,
        existingMeasures: "Reuniões pontuais com supervisão.",
        recommendedAction: "Revisar escala, criar pausas programadas, definir fluxo de escalonamento e orientar liderança para situações críticas.",
        responsible: "Gestor de atendimento / RH",
        deadline: "",
        monitoring: "Acompanhar relatos, absenteísmo, rotatividade e nova avaliação em 60 dias.",
        status: "em_andamento",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Comercial",
        role: "Vendedores",
        factor: "metas_excessivas",
        description: "Cobrança intensa por resultados, metas pouco claras e pressão diária por performance.",
        source: "Modelo de metas, comunicação de liderança e rotina de acompanhamento.",
        consequences: "Ansiedade, sensação de incapacidade, competição nociva e queda de engajamento.",
        exposedWorkers: "Equipe comercial",
        evidence: "Histórico de metas, mensagens de cobrança, feedbacks, relatos e pesquisa psicossocial.",
        probability: 4,
        severity: 4,
        existingMeasures: "Reuniões semanais de resultado.",
        recommendedAction: "Revisar critérios de metas, criar comunicação de cobrança saudável e treinar lideranças em gestão psicossocial.",
        responsible: "Diretoria comercial",
        deadline: "",
        monitoring: "Revisão mensal de metas, relatos e indicadores de rotatividade.",
        status: "pendente",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        department: "Operação",
        role: "Equipe operacional",
        factor: "falta_clareza",
        description: "Trabalhadores relatam dúvidas sobre prioridades, responsabilidades e quem decide em situações de conflito.",
        source: "Processos pouco documentados, comunicação informal e falta de definição de papéis.",
        consequences: "Conflitos, retrabalho, insegurança, erros operacionais e desgaste emocional.",
        exposedWorkers: "Equipe operacional",
        evidence: "Relatos, retrabalhos, conversas com gestores e registros de ocorrência.",
        probability: 3,
        severity: 3,
        existingMeasures: "Orientações verbais.",
        recommendedAction: "Formalizar responsabilidades por função, criar rotina de alinhamento e registrar decisões de processo.",
        responsible: "Gestor operacional",
        deadline: "",
        monitoring: "Revisão quinzenal de dúvidas recorrentes e feedback dos trabalhadores.",
        status: "pendente",
        createdAt: new Date().toISOString(),
      },
    ];

    setRisks((current) => [...examples, ...current]);
    toast.success("Exemplos psicossociais adicionados.");
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

            <p className="mt-2 text-sm font-semibold text-brand-700">NR-1 · Escopo psicossocial</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Inventário Psicossocial + Plano de Ação</h1>

            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Registre fatores psicossociais relacionados ao trabalho, classifique prioridade e acompanhe ações.
              Esta tela não trata riscos físicos, químicos, biológicos, acidentes ou ergonomia como escopo principal.
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

        <section className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 print:border-gray-300 print:bg-white">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-brand-700" />
            <div>
              <h2 className="font-semibold text-brand-900">Foco do NR1Check</h2>
              <p className="mt-1 text-sm text-brand-800">
                O objetivo é ajudar a empresa a demonstrar gestão ativa dos riscos psicossociais:
                identificação, escuta, classificação, plano de ação, monitoramento e evidências.
                Não é diagnóstico médico individual e não substitui responsável técnico.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
          <MetricCard label="Fatores mapeados" value={stats.total} helper="Inventário psicossocial" />
          <MetricCard label="Críticos" value={stats.critical} helper="Prioridade máxima" tone="red" />
          <MetricCard label="Altos" value={stats.high} helper="Acompanhar de perto" tone="orange" />
          <MetricCard label="Ações pendentes" value={stats.pending} helper="Plano de ação" tone="yellow" />
          <MetricCard label="Conclusão" value={`${stats.completion}%`} helper={`${stats.done} concluída(s)`} tone="green" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[430px_1fr] print:block">
          <div className="card print:hidden">
            <h2 className="text-lg font-bold text-gray-900">Adicionar fator psicossocial</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use linguagem simples e objetiva. O registro deve virar evidência e orientar ações concretas.
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
                  onChange={(event) => setForm({ ...form, factor: event.target.value as PsychosocialFactor })}
                >
                  {Object.entries(FACTOR_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Descrição do fator identificado *</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Ex: alta pressão por atendimento rápido, conflitos com clientes e falta de pausas"
                />
              </div>

              <div>
                <label className="label">Fonte / causa organizacional</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.source}
                  onChange={(event) => setForm({ ...form, source: event.target.value })}
                  placeholder="Ex: metas, escala, organização do trabalho, liderança, comunicação, jornada"
                />
              </div>

              <div>
                <label className="label">Consequências possíveis</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.consequences}
                  onChange={(event) => setForm({ ...form, consequences: event.target.value })}
                  placeholder="Ex: estresse, exaustão, conflitos, absenteísmo, rotatividade, queda de desempenho"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Trabalhadores expostos</label>
                  <input
                    className="input"
                    value={form.exposedWorkers}
                    onChange={(event) => setForm({ ...form, exposedWorkers: event.target.value })}
                    placeholder="Ex: 8 atendentes"
                  />
                </div>

                <div>
                  <label className="label">Evidência / sinal observado</label>
                  <input
                    className="input"
                    value={form.evidence}
                    onChange={(event) => setForm({ ...form, evidence: event.target.value })}
                    placeholder="Ex: relatos, pesquisa, absenteísmo"
                  />
                </div>
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
                  Score {currentScore}/25 — Prioridade {getRiskLabel(currentLevel)}
                </p>
              </div>

              <div>
                <label className="label">Medidas existentes</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.existingMeasures}
                  onChange={(event) => setForm({ ...form, existingMeasures: event.target.value })}
                  placeholder="Ex: reuniões com liderança, pausas informais, canal de RH, orientações internas"
                />
              </div>

              <div>
                <label className="label">Ação preventiva/corretiva *</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.recommendedAction}
                  onChange={(event) => setForm({ ...form, recommendedAction: event.target.value })}
                  placeholder="Ex: revisar metas, formalizar pausas, treinar liderança, criar fluxo de relatos"
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
                  placeholder="Ex: nova avaliação em 60 dias, reunião mensal, análise de relatos"
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
                  <h2 className="text-lg font-bold text-gray-900">Inventário Psicossocial</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Fatores relacionados à organização, gestão e relações de trabalho.
                  </p>
                </div>

                <select
                  className="input max-w-xs print:hidden"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as "todos" | PsychosocialFactor)}
                >
                  <option value="todos">Todos os fatores</option>
                  {Object.entries(FACTOR_LABEL).map(([value, label]) => (
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
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fator</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Descrição</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">P×S</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Prioridade</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 print:hidden">Status</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 print:hidden">Ações</th>
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
                              <p className="mt-1 text-xs text-gray-400">{risk.exposedWorkers}</p>
                            </td>

                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                                {FACTOR_LABEL[risk.factor]}
                              </span>
                            </td>

                            <td className="px-3 py-3 max-w-sm">
                              <p className="font-medium text-gray-900">{risk.description}</p>
                              {risk.source && <p className="mt-1 text-xs text-gray-500">Causa: {risk.source}</p>}
                              {risk.consequences && <p className="mt-1 text-xs text-gray-500">Consequências: {risk.consequences}</p>}
                              {risk.evidence && <p className="mt-1 text-xs text-gray-500">Evidência: {risk.evidence}</p>}
                            </td>

                            <td className="px-3 py-3">
                              <p className="font-semibold text-gray-900">{risk.probability}×{risk.severity}</p>
                              <p className="text-xs text-gray-500">Score {score}/25</p>
                            </td>

                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRiskClass(level)}`}>
                                {getRiskLabel(level)}
                              </span>
                            </td>

                            <td className="px-3 py-3 print:hidden">
                              <select
                                className={`rounded-lg border px-2 py-1 text-xs font-medium ${getStatusClass(risk.status)}`}
                                value={risk.status}
                                onChange={(event) => updateStatus(risk.id, event.target.value as ActionStatus)}
                              >
                                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3 text-right print:hidden">
                              <button
                                onClick={() => deleteRisk(risk.id)}
                                className="inline-flex items-center rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Remover"
                              >
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
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-3 font-semibold text-gray-900">Nenhum fator psicossocial registrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comece adicionando exemplos ou cadastre um fator observado na empresa.
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Plano de Ação Psicossocial</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cada fator mapeado deve ter ação, responsável, prazo e monitoramento.
              </p>

              {risks.length ? (
                <div className="mt-5 space-y-3">
                  {risks.map((risk) => {
                    const level = getRiskLevel(getRiskScore(risk.probability, risk.severity));

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
                            </div>

                            <h3 className="mt-3 font-semibold text-gray-900">{risk.recommendedAction}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Fator: {FACTOR_LABEL[risk.factor]} · Setor: {risk.department}
                            </p>

                            {risk.existingMeasures && (
                              <p className="mt-2 text-xs text-gray-500">
                                <strong>Medidas existentes:</strong> {risk.existingMeasures}
                              </p>
                            )}

                            {risk.monitoring && (
                              <p className="mt-1 text-xs text-gray-500">
                                <strong>Monitoramento:</strong> {risk.monitoring}
                              </p>
                            )}
                          </div>

                          <div className="min-w-[180px] rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                            <p><strong>Responsável:</strong> {risk.responsible || "Não informado"}</p>
                            <p className="mt-1"><strong>Prazo:</strong> {risk.deadline || "Não definido"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm text-gray-500">
                  O plano de ação será criado automaticamente a partir dos fatores psicossociais cadastrados.
                </p>
              )}
            </div>

            <div className="card">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Como usar no PGR</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Use este inventário como base para a seção psicossocial do PGR: fatores identificados, grupos expostos,
                    critérios de avaliação, classificação, medidas existentes, plano de ação e evidências de acompanhamento.
                  </p>
                </div>
              </div>
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
  tone = "brand",
}: {
  label: string;
  value: string | number;
  helper: string;
  tone?: "brand" | "red" | "orange" | "yellow" | "green";
}) {
  const toneClass = {
    brand: "border-brand-100 bg-white text-brand-700",
    red: "border-red-100 bg-red-50 text-red-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    yellow: "border-yellow-100 bg-yellow-50 text-yellow-700",
    green: "border-green-100 bg-green-50 text-green-700",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{helper}</p>
    </div>
  );
}
