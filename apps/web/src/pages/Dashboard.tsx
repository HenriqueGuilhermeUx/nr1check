import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HelpCircle,
  Lock,
  PlayCircle,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

type StepStatus = "feito" | "em_andamento" | "pendente";

type CockpitStep = {
  id: number;
  title: string;
  description: string;
  route: string;
  cta: string;
  status: StepStatus;
  evidence: string;
};

function stepTone(status: StepStatus): "green" | "yellow" | "gray" {
  if (status === "feito") return "green";
  if (status === "em_andamento") return "yellow";
  return "gray";
}

function stepLabel(status: StepStatus) {
  const map: Record<StepStatus, string> = {
    feito: "Feito",
    em_andamento: "Em andamento",
    pendente: "Pendente",
  };
  return map[status];
}

function overallClass(level: "verde" | "amarelo" | "vermelho") {
  const map = {
    verde: "border-green-200 bg-green-50 text-green-800",
    amarelo: "border-yellow-200 bg-yellow-50 text-yellow-800",
    vermelho: "border-red-200 bg-red-50 text-red-800",
  };
  return map[level];
}

export default function Dashboard() {
  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: employees } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: cycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: findings } = trpc.psychosocial.listFindings.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: inventory } = trpc.psychosocial.listInventory.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: documents } = trpc.psychosocial.listDocuments.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const hasCompany = !!company;
  const employeeCount = employees?.length ?? 0;
  const cycleCount = cycles?.length ?? 0;
  const activeCycle = cycles?.find((cycle) => cycle.status === "active") ?? cycles?.[0];
  const responseCount = activeCycle?.totalResponded ?? 0;
  const invitedCount = activeCycle?.totalInvited ?? employeeCount;
  const responseRate = invitedCount ? Math.round((Number(responseCount) / Number(invitedCount)) * 100) : 0;

  const findingCount = findings?.length ?? 0;
  const inventoryCount = inventory?.length ?? 0;
  const pendingActions = inventory?.filter((item) => item.actionStatus !== "concluido").length ?? 0;
  const criticalRisks = inventory?.filter((item) => item.riskLevel === "critico").length ?? 0;
  const highRisks = inventory?.filter((item) => item.riskLevel === "alto").length ?? 0;
  const documentCount = documents?.length ?? 0;

  const steps: CockpitStep[] = [
    {
      id: 1,
      title: "Configurar empresa",
      description: "Dados mínimos da empresa, CNPJ, setor e responsável.",
      route: "/comecar",
      cta: "Configurar",
      status: hasCompany ? "feito" : "pendente",
      evidence: "Empresa vinculada ao gestor.",
    },
    {
      id: 2,
      title: "Cadastrar trabalhadores",
      description: "Base para convites, links, QR e evidências.",
      route: "/funcionarios",
      cta: "Cadastrar equipe",
      status: employeeCount > 0 ? "feito" : hasCompany ? "em_andamento" : "pendente",
      evidence: `${employeeCount} trabalhador(es) cadastrado(s).`,
    },
    {
      id: 3,
      title: "Abrir avaliação psicossocial",
      description: "Criar ciclo e disponibilizar questionário.",
      route: "/avaliacao-psicossocial",
      cta: "Abrir avaliação",
      status: cycleCount > 0 ? "feito" : employeeCount > 0 ? "em_andamento" : "pendente",
      evidence: `${cycleCount} ciclo(s) criado(s).`,
    },
    {
      id: 4,
      title: "Coletar respostas",
      description: "Usar link, QR, intranet, e-mail ou WhatsApp opcional.",
      route: "/avaliacao-psicossocial",
      cta: "Gerenciar coleta",
      status: Number(responseCount) >= 3 ? "feito" : cycleCount > 0 ? "em_andamento" : "pendente",
      evidence: `${responseCount}/${invitedCount || 0} resposta(s) · ${responseRate}% participação.`,
    },
    {
      id: 5,
      title: "Gerar achados agregados",
      description: "Transformar respostas em achados por dimensão.",
      route: "/achados-psicossociais",
      cta: "Gerar achados",
      status: findingCount > 0 ? "feito" : Number(responseCount) >= 3 ? "em_andamento" : "pendente",
      evidence: `${findingCount} achado(s) salvo(s).`,
    },
    {
      id: 6,
      title: "Criar inventário e plano",
      description: "Converter achados em riscos, ações, prazos e responsáveis.",
      route: "/inventario-riscos",
      cta: "Abrir inventário",
      status: inventoryCount > 0 ? "feito" : findingCount > 0 ? "em_andamento" : "pendente",
      evidence: `${inventoryCount} risco(s); ${pendingActions} ação(ões) pendente(s).`,
    },
    {
      id: 7,
      title: "Gerar documentos assináveis",
      description: "Ata, termo de ciência, lista de presença, cartilha, código de conduta e dossiê.",
      route: "/documentos-assinaturas",
      cta: "Gerar documentos",
      status: documentCount > 0 ? "feito" : inventoryCount > 0 ? "em_andamento" : "pendente",
      evidence: `${documentCount} documento(s) registrado(s).`,
    },
  ];

  const done = steps.filter((step) => step.status === "feito").length;
  const progress = Math.round((done / steps.length) * 100);
  const overallLevel: "verde" | "amarelo" | "vermelho" =
    criticalRisks > 0 ? "vermelho" : highRisks > 0 || pendingActions > 0 || progress < 70 ? "amarelo" : "verde";
  const nextStep = steps.find((step) => step.status !== "feito") ?? steps[steps.length - 1];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cockpit do empresário"
        title="O que falta para sua empresa ficar defensável?"
        description="Siga a trilha: avaliar, gerar achados, montar inventário, executar plano de ação e guardar evidências assináveis."
        action={
          <Link to={nextStep.route} className="btn-primary">
            {nextStep.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {loadingCompany ? (
        <div className="card">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : !company ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Nenhuma empresa cadastrada"
          description="Cadastre sua empresa para iniciar a gestão dos riscos psicossociais da NR-1."
          action={<Link to="/comecar" className="btn-primary">Configurar empresa →</Link>}
        />
      ) : (
        <div className="space-y-6">
          <section className={`card border-2 ${overallClass(overallLevel)}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide">Status NR-1 Psicossocial</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {overallLevel === "verde" && "Fluxo em boa ordem"}
                  {overallLevel === "amarelo" && "Atenção: ainda há pendências"}
                  {overallLevel === "vermelho" && "Prioridade: risco crítico ou pendência relevante"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm opacity-90">
                  A meta é demonstrar gestão ativa: escuta dos trabalhadores, análise agregada, inventário,
                  plano de ação e evidências organizadas.
                </p>
                <p className="mt-3 flex items-center gap-1 text-sm">
                  <Building2 className="h-4 w-4" />
                  {company.name}
                </p>
              </div>

              <div className="min-w-[220px] rounded-2xl bg-white/60 p-4 text-center">
                <p className="text-sm font-semibold">Prontidão</p>
                <p className="mt-2 text-5xl font-bold">{progress}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-current" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs opacity-80">{done}/{steps.length} etapas concluídas</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Trabalhadores" value={employeeCount} helper="base cadastrada" />
            <MetricCard label="Participação" value={`${responseRate}%`} helper={`${responseCount}/${invitedCount || 0} respostas`} tone={Number(responseCount) >= 3 ? "green" : "yellow"} />
            <MetricCard label="Achados" value={findingCount} helper="salvos no Supabase" />
            <MetricCard label="Riscos" value={inventoryCount} helper={`${criticalRisks} crítico(s)`} tone={criticalRisks ? "red" : "gray"} />
            <MetricCard label="Documentos" value={documentCount} helper="gerados/registrados" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Fluxo guiado NR1Check</h2>
              <p className="mt-1 text-sm text-gray-500">A ordem abaixo evita que o empresário fique perdido.</p>

              <div className="mt-5 space-y-3">
                {steps.map((step) => (
                  <Link key={step.id} to={step.route} className="block rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                          step.status === "feito" ? "border-green-200 bg-green-50 text-green-700" :
                          step.status === "em_andamento" ? "border-yellow-200 bg-yellow-50 text-yellow-700" :
                          "border-gray-200 bg-gray-50 text-gray-600"
                        }`}>
                          {step.status === "feito" ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <StatusBadge tone={stepTone(step.status)}>{stepLabel(step.status)}</StatusBadge>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            <strong>Evidência:</strong> {step.evidence}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                        {step.cta} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="card bg-gray-900 text-white">
                <div className="flex gap-3">
                  <PlayCircle className="mt-1 h-5 w-5 text-white/70" />
                  <div>
                    <h2 className="font-bold">Próxima melhor ação</h2>
                    <p className="mt-1 text-sm text-gray-300">{nextStep.description}</p>
                    <Link to={nextStep.route} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                      {nextStep.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Semáforo executivo</h2>
                <div className="mt-4 space-y-3">
                  <StatusLine ok={Number(responseCount) >= 3} title="Coleta mínima" detail={Number(responseCount) >= 3 ? "Já há base agregada." : "Colete pelo menos 3 respostas."} />
                  <StatusLine ok={findingCount > 0} title="Achados" detail={findingCount > 0 ? "Dimensões analisadas." : "Gere achados por dimensão."} />
                  <StatusLine ok={inventoryCount > 0} title="Inventário" detail={inventoryCount > 0 ? "Riscos formalizados." : "Envie achados ao inventário."} />
                  <StatusLine ok={pendingActions === 0 && inventoryCount > 0} title="Plano de ação" detail={pendingActions === 0 && inventoryCount > 0 ? "Sem ações pendentes." : `${pendingActions} ação(ões) pendente(s).`} />
                  <StatusLine ok={documentCount > 0} title="Documentos" detail={documentCount > 0 ? "Evidências documentais geradas." : "Gere documentos assináveis."} />
                </div>
              </div>

              <div className="card border-brand-200 bg-brand-50">
                <div className="flex gap-3">
                  <Lock className="mt-1 h-5 w-5 text-brand-700" />
                  <div>
                    <h2 className="font-bold text-brand-900">Regra do produto</h2>
                    <p className="mt-1 text-sm text-brand-800">
                      Respostas individuais não são mostradas ao empregador. O valor é análise agregada,
                      plano de ação e evidência.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function StatusLine({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
