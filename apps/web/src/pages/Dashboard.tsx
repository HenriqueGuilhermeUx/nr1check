import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, HelpCircle, Lock, PlayCircle } from "lucide-react";
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

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [userMode, setUserMode] = useState<string>("empresa");

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_COMPANY_KEY);
    if (stored) setSelectedCompanyId(Number(stored));
    setUserMode(window.localStorage.getItem("nr1check:user-mode") ?? "empresa");
  }, []);

  const company = useMemo(() => {
    if (!companies?.length) return undefined;
    if (selectedCompanyId) return companies.find((item) => item.id === selectedCompanyId) ?? companies[0];
    return companies[0];
  }, [companies, selectedCompanyId]);

  const companyId = company?.id ?? 0;
  const isConsultantMode = (companies?.length ?? 0) > 1 || userMode === "contador";

  const { data: employees } = trpc.employee.list.useQuery({ companyId }, { enabled: !!companyId });
  const { data: cycles } = trpc.assessment.cycles.useQuery({ companyId }, { enabled: !!companyId });
  const { data: findings } = trpc.psychosocial.listFindings.useQuery({ companyId }, { enabled: !!companyId });
  const { data: inventory } = trpc.psychosocial.listInventory.useQuery({ companyId }, { enabled: !!companyId });
  const { data: documents } = trpc.psychosocial.listDocuments.useQuery({ companyId }, { enabled: !!companyId });

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
      title: "Cadastrar a empresa",
      description: "Informe nome, CNPJ e atividade. Pode completar detalhes depois.",
      route: "/comecar",
      cta: "Cadastrar empresa",
      status: hasCompany ? "feito" : "pendente",
      evidence: hasCompany ? `${company?.name} vinculada à sua conta.` : "Nenhuma empresa cadastrada.",
    },
    {
      id: 2,
      title: "Colocar os trabalhadores",
      description: "Cadastre quem trabalha na empresa. Para começar, pode ser só nome e CPF.",
      route: "/funcionarios",
      cta: "Cadastrar trabalhadores",
      status: employeeCount > 0 ? "feito" : hasCompany ? "em_andamento" : "pendente",
      evidence: `${employeeCount} trabalhador(es) cadastrado(s).`,
    },
    {
      id: 3,
      title: "Enviar a avaliação",
      description: "O app gera link ou QR Code para os trabalhadores responderem.",
      route: "/avaliacao-psicossocial",
      cta: "Enviar avaliação",
      status: cycleCount > 0 ? "feito" : employeeCount > 0 ? "em_andamento" : "pendente",
      evidence: `${cycleCount} avaliação(ões) criada(s).`,
    },
    {
      id: 4,
      title: "Coletar respostas",
      description: "Acompanhe quantas pessoas responderam sem expor respostas individuais.",
      route: "/avaliacao-psicossocial",
      cta: "Ver respostas",
      status: Number(responseCount) >= 3 ? "feito" : cycleCount > 0 ? "em_andamento" : "pendente",
      evidence: `${responseCount}/${invitedCount || 0} resposta(s) · ${responseRate}% participação.`,
    },
    {
      id: 5,
      title: "Gerar achados",
      description: "Transforme as respostas em pontos de atenção por tema.",
      route: "/achados-psicossociais",
      cta: "Gerar achados",
      status: findingCount > 0 ? "feito" : Number(responseCount) >= 3 ? "em_andamento" : "pendente",
      evidence: `${findingCount} achado(s) salvo(s).`,
    },
    {
      id: 6,
      title: "Criar plano de ação",
      description: "Defina o que será feito, por quem e até quando.",
      route: "/inventario-riscos",
      cta: "Abrir plano",
      status: inventoryCount > 0 ? "feito" : findingCount > 0 ? "em_andamento" : "pendente",
      evidence: `${inventoryCount} risco(s); ${pendingActions} ação(ões) pendente(s).`,
    },
    {
      id: 7,
      title: "Gerar documentos",
      description: "Imprima ou salve ata, termos, lista de presença, cartilha e dossiê.",
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

  function handleCompanyChange(value: string) {
    const id = Number(value);
    setSelectedCompanyId(id);
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={isConsultantMode ? "Painel do contador/consultor" : "Passo a passo para PME"}
        title="Organize a NR-1 psicossocial da empresa em poucos passos."
        description="Cadastre a empresa, inclua trabalhadores, envie a avaliação, gere o plano de ação e salve os documentos. Sem juridiquês."
        action={
          <div className="flex flex-wrap gap-2">
            {isConsultantMode && <Link to="/clientes" className="btn-secondary">Meus clientes</Link>}
            <Link to={nextStep.route} className="btn-primary">{nextStep.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        }
      />

      {loadingCompany ? (
        <div className="card"><p className="text-gray-500">Carregando...</p></div>
      ) : !company ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Comece cadastrando uma empresa"
          description="Pode ser uma loja, boteco, salão, clínica, escritório ou primeiro cliente do contador."
          action={<Link to="/comecar" className="btn-primary">Cadastrar agora →</Link>}
        />
      ) : (
        <div className="space-y-6">
          {isConsultantMode && companies && companies.length > 1 && (
            <div className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Empresa em atendimento</h2>
                  <p className="text-sm text-gray-500">Escolha o cliente que você quer organizar agora.</p>
                </div>
                <select className="input md:max-w-sm" value={company.id} onChange={(event) => handleCompanyChange(event.target.value)}>
                  {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <section className={`card border-2 ${overallClass(overallLevel)}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide">Status da empresa</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {overallLevel === "verde" && "Tudo caminhando bem"}
                  {overallLevel === "amarelo" && "Falta completar alguns passos"}
                  {overallLevel === "vermelho" && "Tem pendência importante para resolver"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm opacity-90">
                  O objetivo é simples: ouvir trabalhadores, gerar um plano de ação e guardar documentos que provem que a empresa está cuidando do tema.
                </p>
                <p className="mt-3 flex items-center gap-1 text-sm"><Building2 className="h-4 w-4" />{company.name}</p>
              </div>

              <div className="min-w-[220px] rounded-2xl bg-white/60 p-4 text-center">
                <p className="text-sm font-semibold">Andamento</p>
                <p className="mt-2 text-5xl font-bold">{progress}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-current" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs opacity-80">{done}/{steps.length} passos concluídos</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Trabalhadores" value={employeeCount} helper="cadastrados" />
            <MetricCard label="Participação" value={`${responseRate}%`} helper={`${responseCount}/${invitedCount || 0} respostas`} tone={Number(responseCount) >= 3 ? "green" : "yellow"} />
            <MetricCard label="Achados" value={findingCount} helper="pontos de atenção" />
            <MetricCard label="Riscos/Ações" value={inventoryCount} helper={`${pendingActions} pendente(s)`} tone={criticalRisks ? "red" : "gray"} />
            <MetricCard label="Documentos" value={documentCount} helper="salvos" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">O que fazer agora</h2>
              <p className="mt-1 text-sm text-gray-500">Siga de cima para baixo. O app mostra exatamente o próximo passo.</p>

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
                          <p className="mt-2 text-xs text-gray-500"><strong>Registro:</strong> {step.evidence}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{step.cta} <ArrowRight className="h-4 w-4" /></span>
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
                    <h2 className="font-bold">Próximo passo</h2>
                    <p className="mt-1 text-sm text-gray-300">{nextStep.description}</p>
                    <Link to={nextStep.route} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                      {nextStep.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Resumo simples</h2>
                <div className="mt-4 space-y-3">
                  <StatusLine ok={employeeCount > 0} title="Equipe cadastrada" detail={employeeCount > 0 ? "Já dá para enviar avaliação." : "Cadastre pelo menos os trabalhadores principais."} />
                  <StatusLine ok={Number(responseCount) >= 3} title="Respostas suficientes" detail={Number(responseCount) >= 3 ? "Já há base agregada." : "Colete respostas antes de gerar achados."} />
                  <StatusLine ok={inventoryCount > 0} title="Plano de ação" detail={inventoryCount > 0 ? "A empresa já tem ações registradas." : "Gere achados e envie ao inventário."} />
                  <StatusLine ok={documentCount > 0} title="Documentos" detail={documentCount > 0 ? "Já existem evidências salvas." : "Gere documentos assináveis no fim."} />
                </div>
              </div>

              <div className="card border-brand-200 bg-brand-50">
                <div className="flex gap-3">
                  <Lock className="mt-1 h-5 w-5 text-brand-700" />
                  <div>
                    <h2 className="font-bold text-brand-900">Importante</h2>
                    <p className="mt-1 text-sm text-brand-800">O dono da empresa não vê respostas individuais. O app trabalha com dados agregados, plano de ação e documentos.</p>
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
