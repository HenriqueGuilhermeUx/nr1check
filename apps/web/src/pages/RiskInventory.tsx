import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
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

type ActionStatus = "pendente" | "em_andamento" | "concluido";
type RiskLevel = "baixo" | "medio" | "alto" | "critico";

type RiskForm = {
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
  actionStatus: ActionStatus;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação Psicossocial", icon: BarChart3 },
  { to: "/achados-psicossociais", label: "Achados", icon: CheckCircle2 },
  { to: "/inventario-riscos", label: "Inventário Psicossocial", icon: ClipboardList },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
];

const PSYCHOSOCIAL_FACTORS = [
  "Sobrecarga de trabalho",
  "Ritmo de trabalho intenso",
  "Metas excessivas / cobrança intensa",
  "Assédio moral",
  "Assédio sexual",
  "Conflitos interpessoais",
  "Falhas de liderança",
  "Apoio social insuficiente",
  "Baixa autonomia",
  "Falta de clareza de função",
  "Jornada excessiva / pausas insuficientes",
  "Violência externa / clientes / público",
  "Insegurança no trabalho",
  "Comunicação deficiente",
  "Reconhecimento e satisfação",
  "Saúde e bem-estar",
  "Outros fatores psicossociais",
];

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
  actionStatus: "pendente",
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
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

export default function RiskInventory() {
  const navigate = useNavigate();
  const { user } = useUser();
  const utils = trpc.useUtils();

  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: risks, isLoading: loadingRisks } = trpc.psychosocial.listInventory.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const createRisk = trpc.psychosocial.createInventoryItem.useMutation({
    onSuccess: async () => {
      toast.success("Risco salvo no Supabase.");
      setForm(EMPTY_FORM);
      await utils.psychosocial.listInventory.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = trpc.psychosocial.updateInventoryStatus.useMutation({
    onSuccess: async () => {
      await utils.psychosocial.listInventory.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteRisk = trpc.psychosocial.deleteInventoryItem.useMutation({
    onSuccess: async () => {
      toast.success("Risco removido.");
      await utils.psychosocial.listInventory.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [form, setForm] = useState<RiskForm>(EMPTY_FORM);
  const [filter, setFilter] = useState("todos");

  const riskList = risks ?? [];

  const filteredRisks = useMemo(() => {
    if (filter === "todos") return riskList;
    return riskList.filter((risk) => risk.factor === filter);
  }, [filter, riskList]);

  const stats = useMemo(() => {
    const total = riskList.length;
    const critical = riskList.filter((risk) => risk.riskLevel === "critico").length;
    const high = riskList.filter((risk) => risk.riskLevel === "alto").length;
    const pending = riskList.filter((risk) => risk.actionStatus !== "concluido").length;
    const done = riskList.filter((risk) => risk.actionStatus === "concluido").length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    return { total, critical, high, pending, done, completion };
  }, [riskList]);

  const currentScore = getRiskScore(form.probability, form.severity);
  const currentLevel = getRiskLevel(currentScore);

  function addRisk() {
    if (!companyId) {
      toast.error("Cadastre uma empresa primeiro.");
      return;
    }

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

    createRisk.mutate({
      companyId,
      ...form,
    });
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
              Agora salvo no Supabase: risco, matriz, ação, responsável, prazo e status.
            </p>
            {company && <p className="mt-2 text-sm text-gray-500">{company.name}</p>}
          </div>

          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <Printer className="h-4 w-4" />
            Imprimir / salvar PDF
          </button>
        </div>

        {isLoading ? (
          <div className="card">
            <p className="text-gray-500">Carregando empresa...</p>
          </div>
        ) : !company ? (
          <div className="card border-yellow-200 bg-yellow-50">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-semibold text-yellow-900">Cadastre a empresa primeiro</h2>
                <Link to="/comecar" className="btn-primary mt-4">Configurar empresa →</Link>
              </div>
            </div>
          </div>
        ) : null}

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

            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Setor / área *</label>
                  <input className="input" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                </div>
                <div>
                  <label className="label">Função / grupo exposto</label>
                  <input className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Fator psicossocial</label>
                <select className="input" value={form.factor} onChange={(event) => setForm({ ...form, factor: event.target.value })}>
                  {PSYCHOSOCIAL_FACTORS.map((factor) => <option key={factor} value={factor}>{factor}</option>)}
                </select>
              </div>

              <Field label="Descrição do risco *" value={form.description} onChange={(value) => setForm({ ...form, description: value })} textarea />
              <Field label="Fonte de evidência" value={form.evidence} onChange={(value) => setForm({ ...form, evidence: value })} />
              <Field label="Consequências possíveis" value={form.consequences} onChange={(value) => setForm({ ...form, consequences: value })} textarea />
              <Field label="Trabalhadores expostos" value={form.exposedWorkers} onChange={(value) => setForm({ ...form, exposedWorkers: value })} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Probabilidade: {form.probability}</label>
                  <select className="input" value={form.probability} onChange={(event) => setForm({ ...form, probability: Number(event.target.value) })}>
                    <option value={1}>1 - Rara</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Possível</option>
                    <option value={4}>4 - Provável</option>
                    <option value={5}>5 - Frequente</option>
                  </select>
                </div>
                <div>
                  <label className="label">Severidade: {form.severity}</label>
                  <select className="input" value={form.severity} onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}>
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
                <p className="mt-1 text-sm">Score {currentScore}/25 — Risco {getRiskLabel(currentLevel)}</p>
              </div>

              <Field label="Medidas existentes" value={form.existingMeasures} onChange={(value) => setForm({ ...form, existingMeasures: value })} textarea />
              <Field label="Ação preventiva/corretiva *" value={form.recommendedAction} onChange={(value) => setForm({ ...form, recommendedAction: value })} textarea />
              <Field label="Responsável" value={form.responsible} onChange={(value) => setForm({ ...form, responsible: value })} />
              <div>
                <label className="label">Prazo</label>
                <input className="input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
              </div>
              <Field label="Monitoramento" value={form.monitoring} onChange={(value) => setForm({ ...form, monitoring: value })} textarea />

              <button onClick={addRisk} disabled={createRisk.isPending} className="btn-primary w-full">
                <Plus className="h-4 w-4" />
                {createRisk.isPending ? "Salvando..." : "Salvar no Supabase"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card print:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900">Inventário salvo</h2>
                <select className="input max-w-xs" value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="todos">Todos os fatores</option>
                  {PSYCHOSOCIAL_FACTORS.map((factor) => <option key={factor} value={factor}>{factor}</option>)}
                </select>
              </div>
            </div>

            {loadingRisks ? (
              <div className="card"><p className="text-gray-500">Carregando inventário...</p></div>
            ) : filteredRisks.length ? (
              filteredRisks.map((risk) => {
                const score = getRiskScore(risk.probability, risk.severity);
                const level = risk.riskLevel as RiskLevel;

                return (
                  <div key={risk.id} className="card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{risk.factor}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getRiskClass(level)}`}>
                            {getRiskLabel(level)} · {score}/25
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusClass(risk.actionStatus as ActionStatus)}`}>
                            {STATUS_LABEL[risk.actionStatus as ActionStatus] ?? risk.actionStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{risk.department} {risk.role ? `· ${risk.role}` : ""}</p>
                        <p className="mt-3 text-sm text-gray-700">{risk.description}</p>
                      </div>

                      <button
                        onClick={() => deleteRisk.mutate({ companyId, id: risk.id })}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 print:hidden"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Info title="Evidência" text={risk.evidence ?? "Não informada"} />
                      <Info title="Consequências" text={risk.consequences ?? "Não informadas"} />
                      <Info title="Ação" text={risk.recommendedAction} />
                      <Info title="Responsável / Prazo" text={`${risk.responsible ?? "Não definido"}${risk.deadline ? ` · ${new Date(risk.deadline).toLocaleDateString("pt-BR")}` : ""}`} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                      {(["pendente", "em_andamento", "concluido"] as ActionStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus.mutate({ companyId, id: risk.id, actionStatus: status })}
                          className="btn-secondary text-xs"
                        >
                          {STATUS_LABEL[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card text-center py-12">
                <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
                <h2 className="mt-4 text-lg font-bold text-gray-900">Nenhum risco registrado</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Gere achados em /achados-psicossociais ou cadastre manualmente.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea className="input min-h-[70px]" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-sm text-gray-700">{text}</p>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = "gray" }: { label: string; value: string | number; helper: string; tone?: "gray" | "red" | "orange" | "yellow" | "green" }) {
  const tones = {
    gray: "text-gray-900",
    red: "text-red-700",
    orange: "text-orange-700",
    yellow: "text-yellow-700",
    green: "text-green-700",
  };

  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}
