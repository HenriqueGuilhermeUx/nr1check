import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  HelpCircle,
  Lock,
  MessageSquare,
  RefreshCcw,
  Send,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

type PhaseStatus = "feito" | "em_andamento" | "proximo" | "pendente";

type Phase = {
  id: number;
  title: string;
  description: string;
  status: PhaseStatus;
  route: string;
  button: string;
  evidence: string;
};

type ObligationItem = {
  title: string;
  detail: string;
  done: boolean;
};

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

const STATUS_CONFIG: Record<PhaseStatus, { label: string; tone: "green" | "brand" | "yellow" | "gray"; dotClass: string }> = {
  feito: {
    label: "Feito",
    tone: "green",
    dotClass: "border-green-200 bg-green-50 text-green-700",
  },
  em_andamento: {
    label: "Em andamento",
    tone: "brand",
    dotClass: "border-brand-200 bg-brand-50 text-brand-700",
  },
  proximo: {
    label: "Próximo passo",
    tone: "yellow",
    dotClass: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  pendente: {
    label: "Pendente",
    tone: "gray",
    dotClass: "border-gray-200 bg-gray-50 text-gray-600",
  },
};

function getPhaseStatus(done: boolean, enabled: boolean, previousDone: boolean): PhaseStatus {
  if (done) return "feito";
  if (enabled) return "em_andamento";
  if (previousDone) return "proximo";
  return "pendente";
}

function phaseProgressValue(status: PhaseStatus) {
  if (status === "feito") return 1;
  if (status === "em_andamento") return 0.5;
  if (status === "proximo") return 0.2;
  return 0;
}

export default function NR1Obligations() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [slowCompanyLoad, setSlowCompanyLoad] = useState(false);

  const {
    data: companies,
    isLoading: loadingCompanies,
    isFetching: fetchingCompanies,
    refetch: refetchCompanies,
    error: companyError,
  } = trpc.company.my.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_COMPANY_KEY);
    if (stored) setSelectedCompanyId(Number(stored));
  }, []);

  useEffect(() => {
    if (!loadingCompanies && !fetchingCompanies) {
      setSlowCompanyLoad(false);
      return;
    }

    const timer = window.setTimeout(() => setSlowCompanyLoad(true), 7000);
    return () => window.clearTimeout(timer);
  }, [loadingCompanies, fetchingCompanies]);

  const company = useMemo(() => {
    if (!companies?.length) return undefined;

    if (selectedCompanyId) {
      return companies.find((item) => item.id === selectedCompanyId) ?? companies[0];
    }

    return companies[0];
  }, [companies, selectedCompanyId]);

  const companyId = company?.id ?? 0;

  const { data: employees, isFetching: fetchingEmployees } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const { data: cycles, isFetching: fetchingCycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const { data: findings, isFetching: fetchingFindings } = trpc.psychosocial.listFindings.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const { data: inventory, isFetching: fetchingInventory } = trpc.psychosocial.listInventory.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const { data: documents, isFetching: fetchingDocuments } = trpc.psychosocial.listDocuments.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const employeeCount = employees?.length ?? 0;
  const cycleCount = cycles?.length ?? 0;
  const activeCycle = cycles?.find((cycle) => cycle.status === "active") ?? cycles?.[0];
  const responseCount = Number(activeCycle?.totalResponded ?? 0);
  const invitedCount = Number(activeCycle?.totalInvited ?? employeeCount);
  const responseRate = invitedCount ? Math.round((responseCount / invitedCount) * 100) : 0;
  const findingCount = findings?.length ?? 0;
  const inventoryCount = inventory?.length ?? 0;
  const pendingActions = inventory?.filter((item) => item.actionStatus !== "concluido").length ?? 0;
  const documentCount = documents?.length ?? 0;

  const hasCompany = !!company;
  const hasEmployees = employeeCount > 0;
  const hasCycle = cycleCount > 0;
  const hasMinimumResponses = responseCount >= 3;
  const hasFindings = findingCount > 0;
  const hasInventory = inventoryCount > 0;
  const hasActionPlanDone = inventoryCount > 0 && pendingActions === 0;
  const hasDocuments = documentCount > 0;

  const phases: Phase[] = [
    {
      id: 1,
      title: "Cadastrar/selecionar empresa",
      description: "Empresa vinculada à conta para começar o fluxo NR-1 psicossocial.",
      status: getPhaseStatus(hasCompany, !hasCompany, true),
      route: "/comecar",
      button: hasCompany ? "Ver empresa" : "Cadastrar empresa",
      evidence: hasCompany ? `${company?.name} cadastrada.` : "Nenhuma empresa selecionada.",
    },
    {
      id: 2,
      title: "Cadastrar trabalhadores",
      description: "Base mínima para enviar avaliação e gerar evidências de participação.",
      status: getPhaseStatus(hasEmployees, hasCompany, hasCompany),
      route: "/funcionarios",
      button: "Cadastrar equipe",
      evidence: `${employeeCount} trabalhador(es) cadastrado(s).`,
    },
    {
      id: 3,
      title: "Abrir avaliação psicossocial",
      description: "Criar ciclo e disponibilizar questionário por link, QR ou outro canal.",
      status: getPhaseStatus(hasCycle, hasEmployees, hasEmployees),
      route: "/avaliacao-psicossocial",
      button: "Abrir avaliação",
      evidence: `${cycleCount} ciclo(s) criado(s).`,
    },
    {
      id: 4,
      title: "Coletar respostas",
      description: "Acompanhar participação sem expor respostas individuais.",
      status: getPhaseStatus(hasMinimumResponses, hasCycle, hasCycle),
      route: "/avaliacao-psicossocial",
      button: "Gerenciar coleta",
      evidence: `${responseCount}/${invitedCount || 0} resposta(s) · ${responseRate}% participação.`,
    },
    {
      id: 5,
      title: "Gerar achados agregados",
      description: "Transformar respostas em achados por dimensão: carga, ritmo, apoio, liderança e bem-estar.",
      status: getPhaseStatus(hasFindings, hasMinimumResponses, hasMinimumResponses),
      route: "/achados-psicossociais",
      button: "Gerar achados",
      evidence: `${findingCount} achado(s) salvo(s).`,
    },
    {
      id: 6,
      title: "Criar inventário psicossocial",
      description: "Converter achados em riscos psicossociais por setor, função ou grupo exposto.",
      status: getPhaseStatus(hasInventory, hasFindings, hasFindings),
      route: "/inventario-riscos",
      button: "Abrir inventário",
      evidence: `${inventoryCount} risco(s) psicossocial(is) registrado(s).`,
    },
    {
      id: 7,
      title: "Definir plano de ação",
      description: "Registrar responsáveis, prazos, medidas e evidências esperadas.",
      status: hasActionPlanDone ? "feito" : hasInventory ? "em_andamento" : hasFindings ? "proximo" : "pendente",
      route: "/inventario-riscos",
      button: "Ver plano",
      evidence: hasInventory
        ? `${pendingActions} ação(ões) ainda pendente(s).`
        : "Plano nasce a partir do inventário.",
    },
    {
      id: 8,
      title: "Canal de relatos e ocorrências",
      description: "Manter canal para relatos sobre assédio, conflitos, violência, sobrecarga e outros fatores.",
      status: hasCompany ? "em_andamento" : "pendente",
      route: "/denuncias",
      button: "Abrir relatos",
      evidence: hasCompany
        ? "Canal disponível para registro e acompanhamento."
        : "Disponível após cadastro da empresa.",
    },
    {
      id: 9,
      title: "Gerar documentos e assinaturas",
      description: "Gerar ata, termo de ciência, lista de presença, cartilha, código de conduta e dossiê.",
      status: getPhaseStatus(hasDocuments, hasInventory, hasInventory),
      route: "/documentos-assinaturas",
      button: "Gerar documentos",
      evidence: `${documentCount} documento(s) registrado(s).`,
    },
    {
      id: 10,
      title: "Revisão e seção psicossocial do PGR",
      description: "Organizar evidências para revisão periódica e anexação ao processo de SST/PGR.",
      status: hasDocuments ? "em_andamento" : hasInventory ? "proximo" : "pendente",
      route: "/painel-defesa",
      button: "Ver defesa",
      evidence: hasDocuments
        ? "Dossiê iniciado. Revisão deve ser acompanhada periodicamente."
        : "Depende de inventário, plano e documentos.",
    },
  ];

  const completed = phases.filter((phase) => phase.status === "feito").length;
  const inProgress = phases.filter((phase) => phase.status === "em_andamento").length;
  const next = phases.filter((phase) => phase.status === "proximo").length;
  const total = phases.length;
  const progress = Math.round((phases.reduce((sum, phase) => sum + phaseProgressValue(phase.status), 0) / total) * 100);
  const nextPhase = phases.find((phase) => phase.status === "em_andamento") ?? phases.find((phase) => phase.status === "proximo") ?? phases[0];

  const obligations: ObligationItem[] = [
    {
      title: "Identificar fatores psicossociais",
      detail: "Mapear sobrecarga, metas, ritmo, liderança, apoio, conflitos, autonomia, jornada e bem-estar.",
      done: hasCycle || hasFindings || hasInventory,
    },
    {
      title: "Consultar trabalhadores com confidencialidade",
      detail: "Coletar percepção dos trabalhadores sem expor respostas individuais ao empregador.",
      done: responseCount > 0,
    },
    {
      title: "Analisar resultados agregados",
      detail: "Consolidar dados por empresa, setor ou grupo, respeitando mínimo para preservar anonimato.",
      done: hasFindings,
    },
    {
      title: "Criar inventário psicossocial",
      detail: "Registrar riscos identificados, fontes, consequências e trabalhadores expostos.",
      done: hasInventory,
    },
    {
      title: "Definir plano de ação",
      detail: "Criar medidas preventivas/corretivas com responsável, prazo, evidência e monitoramento.",
      done: hasInventory,
    },
    {
      title: "Registrar evidências",
      detail: "Guardar comunicação, respostas agregadas, achados, ações, revisões e documentos gerados.",
      done: hasDocuments,
    },
    {
      title: "Revisar o PGR",
      detail: "Atualizar a seção psicossocial quando houver nova avaliação, ocorrência ou revisão periódica.",
      done: false,
    },
  ];

  const anySecondaryLoading =
    fetchingEmployees || fetchingCycles || fetchingFindings || fetchingInventory || fetchingDocuments;

  function handleCompanyChange(value: string) {
    const id = Number(value);
    setSelectedCompanyId(id);
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Roadmap real da empresa"
        title="Obrigações NR-1 psicossocial"
        description="Esta tela agora mostra o que já foi feito com base nos dados reais da empresa selecionada: trabalhadores, avaliação, respostas, achados, inventário, plano e documentos."
        action={
          nextPhase ? (
            <Link to={nextPhase.route} className="btn-primary">
              {nextPhase.button} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />

      {loadingCompanies && slowCompanyLoad ? (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
            <div>
              <h2 className="font-semibold text-yellow-900">A empresa está demorando para carregar</h2>
              <p className="mt-1 text-sm text-yellow-800">
                Isso geralmente é API acordando ou banco lento. Você pode tentar recarregar a lista.
              </p>
              <button type="button" onClick={() => refetchCompanies()} className="btn-secondary mt-3 text-sm">
                <RefreshCcw className="h-4 w-4" />
                Tentar carregar de novo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {companyError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
            <div>
              <h2 className="font-semibold text-red-900">Não foi possível carregar empresas</h2>
              <p className="mt-1 text-sm text-red-800">{companyError.message}</p>
              <button type="button" onClick={() => refetchCompanies()} className="btn-secondary mt-3 text-sm">
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!loadingCompanies && !companies?.length ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Cadastre uma empresa primeiro"
          description="O roadmap fica real depois que uma empresa é cadastrada ou selecionada."
          action={<Link to="/comecar" className="btn-primary">Cadastrar empresa →</Link>}
        />
      ) : (
        <div className="space-y-6">
          {companies && companies.length > 1 ? (
            <div className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Empresa selecionada</h2>
                  <p className="text-sm text-gray-500">
                    O status abaixo muda conforme a empresa escolhida.
                  </p>
                </div>
                <select
                  className="input md:max-w-sm"
                  value={company?.id ?? ""}
                  onChange={(event) => handleCompanyChange(event.target.value)}
                >
                  {companies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Empresa" value={company?.name ?? "Carregando"} helper={company?.cnpj ? `CNPJ ${company.cnpj}` : "aguardando dados"} />
            <MetricCard label="Progresso real" value={`${progress}%`} helper={`${completed} feita(s), ${inProgress} em andamento, ${next} próxima(s)`} tone={progress >= 70 ? "green" : progress >= 35 ? "yellow" : "red"} />
            <MetricCard label="Próximo passo" value={nextPhase?.id ?? "-"} helper={nextPhase?.title ?? "Aguardando empresa"} tone="brand" />
          </section>

          {anySecondaryLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-500">
              Atualizando status da empresa...
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Roadmap da empresa</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Nada aqui é marcado como feito sem registro real no sistema.
                  </p>
                </div>
                {nextPhase ? (
                  <Link to={nextPhase.route} className="btn-primary hidden sm:inline-flex">
                    {nextPhase.button} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {phases.map((phase) => {
                  const cfg = STATUS_CONFIG[phase.status];

                  return (
                    <div key={phase.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${cfg.dotClass}`}>
                            {phase.status === "feito" ? <CheckCircle2 className="h-5 w-5" /> : phase.id}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{phase.title}</h3>
                              <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{phase.description}</p>
                            <p className="mt-2 text-xs text-gray-500">
                              <strong>Registro real:</strong> {phase.evidence}
                            </p>
                          </div>
                        </div>

                        <Link to={phase.route} className="btn-secondary whitespace-nowrap text-sm">
                          {phase.button} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="card border-brand-200 bg-brand-50">
                <div className="flex gap-3">
                  <Lock className="mt-1 h-5 w-5 text-brand-700" />
                  <div>
                    <h2 className="font-bold text-brand-900">Regra de ouro</h2>
                    <p className="mt-1 text-sm text-brand-800">
                      O empregador deve ver resultados agregados, não respostas individuais. Isso aumenta confiança
                      e protege a empresa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Checklist de obrigação prática</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Check verde só aparece quando há evidência real.
                </p>
                <div className="mt-4 space-y-3">
                  {obligations.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      {item.done ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      ) : (
                        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Canais de resposta</h2>
                <p className="mt-1 text-sm text-gray-500">
                  O app não depende só de WhatsApp. Suporta formas simples e auditáveis.
                </p>
                <div className="mt-4 grid gap-2">
                  {["Link individual", "QR Code individual", "E-mail", "Intranet", "Comunicado interno", "WhatsApp/Z-API opcional"].map((channel) => (
                    <div key={channel} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <Send className="h-4 w-4 text-gray-400" />
                      {channel}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Resumo da empresa</h2>
                <div className="mt-4 grid gap-3">
                  <MiniStat icon={<Building2 className="h-4 w-4" />} label="Empresa" value={hasCompany ? "ok" : "pendente"} />
                  <MiniStat icon={<MessageSquare className="h-4 w-4" />} label="Respostas" value={String(responseCount)} />
                  <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Riscos" value={String(inventoryCount)} />
                  <MiniStat icon={<FileCheck className="h-4 w-4" />} label="Documentos" value={String(documentCount)} />
                </div>
              </div>
            </aside>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
