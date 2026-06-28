import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

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

function riskTone(level: RiskLevel): "green" | "yellow" | "orange" | "red" {
  if (level === "baixo") return "green";
  if (level === "medio") return "yellow";
  if (level === "alto") return "orange";
  return "red";
}

function statusTone(status: ActionStatus): "red" | "yellow" | "green" {
  if (status === "concluido") return "green";
  if (status === "em_andamento") return "yellow";
  return "red";
}

export default function RiskInventory() {
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
    <AppShell>
      <PageHeader
        eyebrow="Inventário + plano de ação"
        title="Riscos psicossociais transformados em ação"
        description="Cadastre riscos, defina probabilidade/severidade, indique responsável, prazo, evidência e acompanhe o status."
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Imprimir / salvar PDF
          </button>
        }
      />

      {isLoading ? (
        <div className="card">
          <p className="text-gray-500">Carregando empresa...</p>
        </div>
      ) : !company ? (
        <EmptyPanel
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Cadastre a empresa primeiro"
          description="O inventário precisa estar vinculado a uma empresa."
          action={<Link to="/comecar" className="btn-primary">Configurar empresa →</Link>}
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
            <MetricCard label="Riscos" value={stats.total} helper="inventário atual" />
            <MetricCard label="Críticos" value={stats.critical} helper="ação imediata" tone={stats.critical ? "red" : "gray"} />
            <MetricCard label="Altos" value={stats.high} helper="prioridade alta" tone={stats.high ? "orange" : "gray"} />
            <MetricCard label="Pendentes" value={stats.pending} helper="plano de ação" tone={stats.pending ? "yellow" : "green"} />
            <MetricCard label="Conclusão" value={`${stats.completion}%`} helper={`${stats.done} concluída(s)`} tone="green" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[420px_1fr] print:block">
            <div className="card print:hidden">
              <h2 className="text-lg font-bold text-gray-900">Adicionar risco psicossocial</h2>
              <p className="mt-1 text-sm text-gray-500">Use linguagem objetiva. Isso vira evidência e plano.</p>

              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Setor / área *" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
                  <Field label="Função / grupo exposto" value={form.role} onChange={(value) => setForm({ ...form, role: value })} />
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

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">Classificação automática</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge tone={riskTone(currentLevel)}>{getRiskLabel(currentLevel)}</StatusBadge>
                    <span className="text-sm text-gray-600">Score {currentScore}/25</span>
                  </div>
                </div>

                <Field label="Ação preventiva/corretiva *" value={form.recommendedAction} onChange={(value) => setForm({ ...form, recommendedAction: value })} textarea />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Responsável" value={form.responsible} onChange={(value) => setForm({ ...form, responsible: value })} />
                  <div>
                    <label className="label">Prazo</label>
                    <input className="input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
                  </div>
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
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Inventário salvo</h2>
                    <p className="text-sm text-gray-500">Itens vindos dos achados ou cadastrados manualmente.</p>
                  </div>
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
                  const actionStatus = risk.actionStatus as ActionStatus;

                  return (
                    <div key={risk.id} className="card">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{risk.factor}</h3>
                            <StatusBadge tone={riskTone(level)}>{getRiskLabel(level)} · {score}/25</StatusBadge>
                            <StatusBadge tone={statusTone(actionStatus)}>{STATUS_LABEL[actionStatus] ?? actionStatus}</StatusBadge>
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
                <EmptyPanel
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="Nenhum risco registrado"
                  description="Gere achados em Achados Psicossociais ou cadastre manualmente nesta tela."
                  action={<Link to="/achados-psicossociais" className="btn-primary">Gerar achados <ArrowRight className="h-4 w-4" /></Link>}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea className="input min-h-[74px]" value={value} onChange={(event) => onChange(event.target.value)} />
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
