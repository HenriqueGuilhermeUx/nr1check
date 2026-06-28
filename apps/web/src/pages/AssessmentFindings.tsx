import { useMemo, useState } from "react";
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
  Send,
  Shield,
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
  endDate?: string | Date | null;
};

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", icon: BarChart3 },
  { to: "/achados-psicossociais", label: "Achados", icon: Brain },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
];

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

function formatDate(value?: string | Date | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

export default function AssessmentFindings() {
  const { user } = useUser();
  const utils = trpc.useUtils();

  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: cycles, isLoading: loadingCycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const cycleList = ((cycles ?? []) as CycleLite[]);
  const activeCycle = cycleList.find((cycle) => cycle.status === "active") ?? cycleList[0] ?? null;

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const currentCycleId = selectedCycleId ?? activeCycle?.id ?? null;
  const currentCycle = cycleList.find((cycle) => cycle.id === currentCycleId) ?? activeCycle;

  const { data: cycleResults } = trpc.assessment.cycleResults.useQuery(
    { companyId, cycleId: currentCycleId ?? 0 },
    { enabled: !!companyId && !!currentCycleId },
  );

  const { data: findings, isLoading: loadingFindings } = trpc.psychosocial.listFindings.useQuery(
    { companyId, cycleId: currentCycleId ?? undefined },
    { enabled: !!companyId && !!currentCycleId },
  );

  const generateFindings = trpc.psychosocial.generateFindingsFromCycle.useMutation({
    onSuccess: async (rows) => {
      toast.success(`${rows.length} achado(s) salvo(s) no Supabase.`);
      await utils.psychosocial.listFindings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const sendToInventory = trpc.psychosocial.sendFindingsToInventory.useMutation({
    onSuccess: async (rows) => {
      toast.success(`${rows.length} risco(s) criado(s) no inventário.`);
      await utils.psychosocial.listInventory.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const responseCount = cycleResults?.responses?.length ?? currentCycle?.totalResponded ?? 0;
  const invitedCount = currentCycle?.totalInvited ?? 0;
  const responseRate = invitedCount ? Math.round((Number(responseCount) / Number(invitedCount)) * 100) : 0;
  const findingList = findings ?? [];

  const stats = useMemo(() => {
    const total = findingList.length;
    const critical = findingList.filter((finding) => finding.riskLevel === "critico").length;
    const high = findingList.filter((finding) => finding.riskLevel === "alto").length;
    const average = total
      ? Math.round(findingList.reduce((sum, finding) => sum + finding.averageScore, 0) / total)
      : 0;

    return { total, critical, high, average };
  }, [findingList]);

  function handleGenerate() {
    if (!companyId || !currentCycleId) {
      toast.error("Selecione um ciclo.");
      return;
    }

    generateFindings.mutate({ companyId, cycleId: currentCycleId, minResponses: 3 });
  }

  function handleSendToInventory() {
    if (!companyId || !currentCycleId) {
      toast.error("Selecione um ciclo.");
      return;
    }

    sendToInventory.mutate({ companyId, cycleId: currentCycleId });
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
              Persistente no Supabase
            </div>
            <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">
              Achados Agregados por Dimensão
            </h1>
            <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">
              Gere achados a partir das respostas do ciclo e salve tudo no Supabase.
              Depois envie os achados para o inventário psicossocial.
            </p>
            {company && (
              <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={handleGenerate}
              disabled={generateFindings.isPending}
              className="btn-secondary text-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {generateFindings.isPending ? "Gerando..." : "Gerar/salvar achados"}
            </button>
            <button
              onClick={handleSendToInventory}
              disabled={sendToInventory.isPending}
              className="btn-primary text-sm"
            >
              <Send className="h-4 w-4" />
              {sendToInventory.isPending ? "Enviando..." : "Enviar ao inventário"}
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
                <p className="mt-1 text-sm text-yellow-800">Os achados precisam estar vinculados a uma empresa.</p>
                <Link to="/comecar" className="btn-primary mt-4">Configurar empresa →</Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Respondentes" value={String(responseCount)} helper={`${responseRate}% de participação`} />
          <MetricCard label="Achados salvos" value={loadingFindings ? "..." : String(stats.total)} helper="no Supabase" />
          <MetricCard label="Altos/críticos" value={String(stats.high + stats.critical)} helper="prioridade de ação" />
          <MetricCard label="Score médio" value={stats.total ? `${stats.average}/100` : "—"} helper="média das dimensões" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Ciclo analisado</h2>
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
                  Nenhum ciclo encontrado.
                </div>
              )}

              {currentCycle && (
                <div className="mt-4 grid gap-2 text-sm">
                  <Info label="Nome" value={currentCycle.name} />
                  <Info label="Status" value={currentCycle.status} />
                  <Info label="Prazo" value={formatDate(currentCycle.endDate)} />
                </div>
              )}
            </div>

            <div className="card border-brand-200 bg-brand-50">
              <div className="flex gap-3">
                <Lock className="mt-1 h-5 w-5 text-brand-700" />
                <div>
                  <h2 className="font-bold text-brand-900">Confidencialidade</h2>
                  <p className="mt-1 text-sm text-brand-800">
                    O backend exige pelo menos 3 respostas para gerar achados agregados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!currentCycleId ? (
              <EmptyState title="Selecione um ciclo" description="Escolha um ciclo para gerar achados." />
            ) : !findingList.length ? (
              <EmptyState
                title="Nenhum achado salvo ainda"
                description="Clique em Gerar/salvar achados. O ciclo precisa ter pelo menos 3 respostas."
              />
            ) : (
              findingList.map((finding) => (
                <div key={finding.id} className="card">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">{finding.dimension}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${riskClass(finding.riskLevel as RiskLevel)}`}>
                          {riskLabel(finding.riskLevel as RiskLevel)}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          {finding.averageScore}/100
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{finding.findingText}</p>
                    </div>
                    <div className="flex min-w-[120px] items-center justify-center rounded-xl bg-gray-50 p-3">
                      <div className="text-center">
                        <TrendingUp className="mx-auto h-5 w-5 text-gray-500" />
                        <p className="mt-1 text-xs text-gray-500">{finding.respondentCount} resposta(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <DetailCard title="Ação recomendada">{finding.recommendedAction}</DetailCard>
                    <DetailCard title="Evidência">{finding.evidence ?? "Avaliação psicossocial agregada"}</DetailCard>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string }) {
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

function DetailCard({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
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
