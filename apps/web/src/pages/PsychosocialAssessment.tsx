import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  Link as LinkIcon,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  Printer,
  QrCode,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", icon: BarChart3 },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const DIMENSION_GUIDE: Record<string, { meaning: string; finding: string; action: string }> = {
  "Exigências Quantitativas": {
    meaning: "Carga, volume, acúmulo de tarefas e pressão por entrega.",
    finding: "Indício agregado de sobrecarga, falta de tempo e acúmulo de demandas.",
    action: "Revisar distribuição de tarefas, prioridades, metas e dimensionamento da equipe.",
  },
  "Ritmo de Trabalho": {
    meaning: "Velocidade exigida, prazos apertados e atenção constante.",
    finding: "Indício agregado de ritmo intenso e prazos pressionados.",
    action: "Rever fluxos, pausas, filas de trabalho, metas operacionais e suporte da liderança.",
  },
  "Autonomia e Influência": {
    meaning: "Participação, liberdade para organizar o trabalho e influência nas decisões.",
    finding: "Indício agregado de baixa autonomia ou pouca participação nas decisões do trabalho.",
    action: "Criar rotinas de escuta, participação, alinhamento de prioridades e clareza de decisão.",
  },
  "Apoio Social": {
    meaning: "Suporte de colegas, chefia e disponibilidade para ouvir problemas de trabalho.",
    finding: "Indício agregado de suporte insuficiente entre equipe e liderança.",
    action: "Treinar liderança, criar rituais de acompanhamento e canal estruturado de apoio.",
  },
  "Qualidade de Liderança": {
    meaning: "Planejamento, desenvolvimento, justiça em conflitos e prioridade ao ambiente saudável.",
    finding: "Indício agregado de falhas de liderança, planejamento ou gestão de conflitos.",
    action: "Capacitar gestores, registrar acordos de liderança e acompanhar reincidências.",
  },
  "Insegurança no Trabalho": {
    meaning: "Preocupação com emprego, mudanças indesejadas e estabilidade profissional.",
    finding: "Indício agregado de insegurança e incerteza organizacional.",
    action: "Melhorar comunicação interna, transparência de mudanças e previsibilidade de decisões.",
  },
  "Satisfação no Trabalho": {
    meaning: "Reconhecimento, condições, uso de capacidades e percepção geral sobre o trabalho.",
    finding: "Indício agregado de baixa satisfação, reconhecimento ou aproveitamento de capacidades.",
    action: "Revisar reconhecimento, feedback, oportunidades e condições de trabalho.",
  },
  "Saúde e Bem-Estar": {
    meaning: "Esgotamento, estresse, ansiedade, sono, irritação e impacto do trabalho na saúde.",
    finding: "Indício agregado de desgaste, estresse ou impacto negativo do trabalho no bem-estar.",
    action: "Priorizar análise da carga, pausas, suporte, encaminhamentos e monitoramento recorrente.",
  },
};

type EmployeeLite = {
  id: number;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  companyId: number;
};

type CycleLite = {
  id: number;
  name: string;
  status: string;
  totalInvited?: number | null;
  totalResponded?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

type DistributionRecord = {
  id: string;
  channel: string;
  audience: string;
  message: string;
  evidence: string;
  createdAt: string;
};

const CHANNEL_OPTIONS = [
  "Link individual",
  "QR Code individual",
  "E-mail",
  "Intranet",
  "Comunicado interno",
  "SMS manual",
  "WhatsApp manual",
  "WhatsApp/Z-API",
];

function formatDate(value?: string | Date | null) {
  if (!value) return "Sem prazo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem prazo";
  return date.toLocaleDateString("pt-BR");
}

function getCycleStatusLabel(status?: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    active: "Ativo",
    closed: "Encerrado",
    archived: "Arquivado",
  };
  return map[status ?? ""] ?? status ?? "Sem status";
}

function getWorkerLink(companyId: number, cycleId: number, employeeId: number) {
  return `${window.location.origin}/responder-avaliacao?companyId=${companyId}&cycleId=${cycleId}&employeeId=${employeeId}`;
}

function getQrUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

async function copyText(value: string, message = "Copiado!") {
  await navigator.clipboard.writeText(value);
  toast.success(message);
}

function storageKey(companyId?: number, cycleId?: number | null) {
  return `nr1check:assessment-distribution:${companyId ?? "demo"}:${cycleId ?? "no-cycle"}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function PsychosocialAssessment() {
  const { user } = useUser();
  const utils = trpc.useUtils();

  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: employees } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: questions, isLoading: loadingQuestions } = trpc.assessment.questions.useQuery();

  const { data: cycles, isLoading: loadingCycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const activeCycle = useMemo(() => {
    const list = (cycles ?? []) as CycleLite[];
    return list.find((cycle) => cycle.status === "active") ?? list[0] ?? null;
  }, [cycles]);

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const currentCycleId = selectedCycleId ?? activeCycle?.id ?? null;

  const { data: cycleResults } = trpc.assessment.cycleResults.useQuery(
    { companyId, cycleId: currentCycleId ?? 0 },
    { enabled: !!companyId && !!currentCycleId },
  );

  const [cycleName, setCycleName] = useState("Avaliação Psicossocial NR-1");
  const [endDate, setEndDate] = useState("");
  const [showQrKit, setShowQrKit] = useState(false);

  const [distributionForm, setDistributionForm] = useState({
    channel: "Link individual",
    audience: "Todos os trabalhadores convidados",
    message: "Avaliação psicossocial NR-1 disponibilizada aos trabalhadores com garantia de confidencialidade.",
    evidence: "",
  });
  const [distributionRecords, setDistributionRecords] = useState<DistributionRecord[]>([]);

  const createCycle = trpc.assessment.createCycle.useMutation({
    onSuccess: async (result) => {
      toast.success(`Ciclo criado. ${result.employeesNotified} trabalhador(es) convidado(s).`);
      setSelectedCycleId(result.cycle.id);
      await utils.assessment.cycles.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const closeCycle = trpc.assessment.closeCycle.useMutation({
    onSuccess: async () => {
      toast.success("Ciclo encerrado.");
      await utils.assessment.cycles.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const employeeList = ((employees ?? []) as EmployeeLite[]);
  const questionList = questions ?? [];
  const cycleList = ((cycles ?? []) as CycleLite[]);
  const currentCycle = cycleList.find((cycle) => cycle.id === currentCycleId) ?? activeCycle;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(companyId, currentCycleId));
    if (!raw) {
      setDistributionRecords([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DistributionRecord[];
      setDistributionRecords(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDistributionRecords([]);
    }
  }, [companyId, currentCycleId]);

  useEffect(() => {
    if (!companyId || !currentCycleId) return;
    window.localStorage.setItem(storageKey(companyId, currentCycleId), JSON.stringify(distributionRecords));
  }, [companyId, currentCycleId, distributionRecords]);

  const dimensions = useMemo(() => {
    const map = new Map<string, number>();
    for (const question of questionList) {
      const dimension = question.dimension || "Sem dimensão";
      map.set(dimension, (map.get(dimension) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([dimension, count]) => ({
      dimension,
      count,
      guide: DIMENSION_GUIDE[dimension] ?? {
        meaning: "Dimensão psicossocial avaliada pelo questionário.",
        finding: "Achado agregado a ser interpretado pela empresa.",
        action: "Definir medida preventiva/corretiva proporcional ao risco identificado.",
      },
    }));
  }, [questionList]);

  const responseCount = cycleResults?.responses?.length ?? currentCycle?.totalResponded ?? 0;
  const invitedCount = currentCycle?.totalInvited ?? employeeList.length;
  const responseRate = invitedCount ? Math.round((Number(responseCount) / Number(invitedCount)) * 100) : 0;
  const generalInstructionText = currentCycleId && companyId
    ? `Acesse o link individual ou QR Code entregue pela empresa para responder a Avaliação Psicossocial NR-1 do ciclo "${currentCycle?.name ?? "Avaliação Psicossocial NR-1"}".`
    : "Crie ou selecione um ciclo para gerar os links de resposta.";

  function handleCreateCycle() {
    if (!companyId) {
      toast.error("Cadastre uma empresa antes de criar a avaliação.");
      return;
    }

    createCycle.mutate({
      companyId,
      name: cycleName.trim() || "Avaliação Psicossocial NR-1",
      endDate: endDate ? new Date(`${endDate}T23:59:59`).toISOString() : undefined,
    });
  }

  function addDistributionRecord() {
    if (!currentCycleId || !companyId) {
      toast.error("Crie ou selecione um ciclo antes de registrar distribuição.");
      return;
    }

    const record: DistributionRecord = {
      id: createId(),
      channel: distributionForm.channel,
      audience: distributionForm.audience || "Trabalhadores convidados",
      message: distributionForm.message || "Avaliação psicossocial disponibilizada.",
      evidence: distributionForm.evidence,
      createdAt: new Date().toISOString(),
    };

    setDistributionRecords((current) => [record, ...current]);
    setDistributionForm((current) => ({ ...current, evidence: "" }));
    toast.success("Distribuição registrada como evidência.");
  }

  function removeDistributionRecord(id: string) {
    setDistributionRecords((current) => current.filter((item) => item.id !== id));
    toast.success("Registro removido.");
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <QrCode className="h-3.5 w-3.5" />
              Fase 3 do roadmap
            </div>
            <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">
              Coleta sem depender de WhatsApp
            </h1>
            <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">
              Gere links e QR Codes individuais para os trabalhadores responderem a avaliação psicossocial.
              Use e-mail, intranet, SMS manual, comunicado interno, QR impresso ou WhatsApp quando disponível.
            </p>
            {company && (
              <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir evidência
            </button>
            <button onClick={() => setShowQrKit((value) => !value)} className="btn-secondary text-sm">
              <QrCode className="h-4 w-4" />
              {showQrKit ? "Ocultar QR" : "Kit QR"}
            </button>
            <Link to="/inventario-riscos" className="btn-primary text-sm">
              Levar achados ao inventário <ArrowRight className="h-4 w-4" />
            </Link>
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
                <p className="mt-1 text-sm text-yellow-800">
                  A avaliação precisa estar vinculada a uma empresa.
                </p>
                <Link to="/comecar" className="btn-primary mt-4">
                  Configurar empresa →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Perguntas ativas" value={loadingQuestions ? "..." : String(questionList.length)} helper={`${dimensions.length} dimensão(ões)`} />
          <MetricCard label="Trabalhadores" value={String(employeeList.length)} helper="Base convidável" />
          <MetricCard label="Respostas do ciclo" value={String(responseCount)} helper={`${responseRate}% de participação`} />
          <MetricCard label="Registros de distribuição" value={String(distributionRecords.length)} helper="Evidência da comunicação" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Criar ciclo de avaliação</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cada ciclo representa uma coleta de respostas para gerar evidência e achados psicossociais.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="label">Nome do ciclo</label>
                  <input
                    className="input"
                    value={cycleName}
                    onChange={(event) => setCycleName(event.target.value)}
                    placeholder="Ex: Avaliação Psicossocial 2026"
                  />
                </div>

                <div>
                  <label className="label">Prazo para resposta</label>
                  <input
                    className="input"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>

                <button
                  onClick={handleCreateCycle}
                  disabled={createCycle.isPending || !companyId}
                  className="btn-primary w-full"
                >
                  <Plus className="h-4 w-4" />
                  {createCycle.isPending ? "Criando..." : "Criar ciclo e preparar convites"}
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Ciclos existentes</h2>

              {loadingCycles ? (
                <p className="mt-3 text-sm text-gray-500">Carregando ciclos...</p>
              ) : ((cycles ?? []) as CycleLite[]).length ? (
                <div className="mt-4 space-y-2">
                  {((cycles ?? []) as CycleLite[]).map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => setSelectedCycleId(cycle.id)}
                      className={`w-full rounded-xl border p-3 text-left ${
                        currentCycleId === cycle.id ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">{cycle.name}</p>
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          {getCycleStatusLabel(cycle.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {cycle.totalResponded ?? 0}/{cycle.totalInvited ?? 0} respostas · Prazo: {formatDate(cycle.endDate)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Nenhum ciclo criado ainda.</p>
              )}

              {currentCycle?.status === "active" && currentCycleId && (
                <button
                  onClick={() => closeCycle.mutate({ companyId, cycleId: currentCycleId })}
                  disabled={closeCycle.isPending}
                  className="btn-secondary mt-4 w-full text-sm"
                >
                  Encerrar ciclo atual
                </button>
              )}
            </div>

            <div className="card border-brand-200 bg-brand-50">
              <div className="flex gap-3">
                <Lock className="mt-1 h-5 w-5 text-brand-700" />
                <div>
                  <h2 className="font-bold text-brand-900">Confidencialidade</h2>
                  <p className="mt-1 text-sm text-brand-800">
                    O objetivo é gerar análise agregada da organização. Evite expor respostas individuais ao empregador.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Instrumento de avaliação disponível</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Questionário base com dimensões psicossociais para alimentar achados agregados e inventário.
                  </p>
                </div>
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {questionList.length} perguntas ativas
                </span>
              </div>

              {questionList.length ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {dimensions.map((item) => (
                    <div key={item.dimension} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900">{item.dimension}</h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          {item.count}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{item.guide.meaning}</p>
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-700">Achado esperado</p>
                        <p className="mt-1 text-xs text-gray-500">{item.guide.finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                    <div>
                      <p className="font-semibold text-yellow-900">Nenhuma pergunta ativa encontrada</p>
                      <p className="mt-1 text-sm text-yellow-800">
                        Verifique a tabela copsoq_questions no Supabase.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Links e QR Codes individuais</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Funcionam sem WhatsApp e sem login do funcionário.
                  </p>
                </div>
              </div>

              {!currentCycleId ? (
                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-900">Crie ou selecione um ciclo para gerar links.</p>
                </div>
              ) : !employeeList.length ? (
                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-900">Nenhum trabalhador cadastrado.</p>
                  <p className="mt-1 text-sm text-yellow-800">
                    Cadastre trabalhadores para gerar links individuais.
                  </p>
                  <Link to="/funcionarios" className="btn-primary mt-4">
                    Cadastrar funcionários →
                  </Link>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Trabalhador</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Cargo</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Canais</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employeeList.slice(0, 12).map((employee) => {
                        const link = getWorkerLink(companyId, currentCycleId, employee.id);

                        return (
                          <tr key={employee.id}>
                            <td className="px-3 py-3">
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.email || employee.phone || "Sem contato cadastrado"}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{employee.role || "Não informado"}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-1">
                                <ChannelTag icon={LinkIcon} label="Link" />
                                <ChannelTag icon={QrCode} label="QR" />
                                {employee.email && <ChannelTag icon={Mail} label="E-mail" />}
                                {employee.phone && <ChannelTag icon={Smartphone} label="SMS/WhatsApp" />}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => copyText(link, `Link de ${employee.name} copiado!`)} className="btn-secondary text-xs">
                                  <Copy className="h-3.5 w-3.5" />
                                  Copiar
                                </button>
                                <button onClick={() => setShowQrKit(true)} className="btn-secondary text-xs">
                                  <QrCode className="h-3.5 w-3.5" />
                                  QR
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {employeeList.length > 12 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Mostrando 12 de {employeeList.length}. O ciclo convidou todos os trabalhadores cadastrados.
                    </p>
                  )}
                </div>
              )}
            </div>

            {showQrKit && currentCycleId && employeeList.length > 0 && (
              <div className="card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Kit QR para impressão</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Imprima ou salve em PDF. Cada QR é individual para registrar resposta no ciclo correto.
                    </p>
                  </div>
                  <button onClick={() => window.print()} className="btn-secondary text-sm">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {employeeList.slice(0, 9).map((employee) => {
                    const link = getWorkerLink(companyId, currentCycleId, employee.id);

                    return (
                      <div key={employee.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                        <img src={getQrUrl(link)} alt={`QR Code de ${employee.name}`} className="mx-auto h-36 w-36 rounded-lg border border-gray-100" />
                        <p className="mt-3 font-semibold text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.role || "Trabalhador(a)"}</p>
                        <p className="mt-3 text-[11px] text-gray-500 break-all">{link}</p>
                      </div>
                    );
                  })}
                </div>

                {employeeList.length > 9 && (
                  <p className="mt-3 text-xs text-gray-500">
                    Mostrando 9 QR Codes. Para equipes maiores, use links copiáveis ou gere por lotes.
                  </p>
                )}
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Registro de distribuição</h2>
              <p className="mt-1 text-sm text-gray-500">
                Registre como a empresa comunicou a avaliação. Isso vira evidência.
              </p>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <div>
                  <label className="label">Canal</label>
                  <select
                    className="input"
                    value={distributionForm.channel}
                    onChange={(event) => setDistributionForm({ ...distributionForm, channel: event.target.value })}
                  >
                    {CHANNEL_OPTIONS.map((channel) => (
                      <option key={channel} value={channel}>{channel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Público</label>
                  <input
                    className="input"
                    value={distributionForm.audience}
                    onChange={(event) => setDistributionForm({ ...distributionForm, audience: event.target.value })}
                    placeholder="Ex: todos os trabalhadores / setor atendimento"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="label">Mensagem comunicada</label>
                  <textarea
                    className="input min-h-[90px]"
                    value={distributionForm.message}
                    onChange={(event) => setDistributionForm({ ...distributionForm, message: event.target.value })}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="label">Evidência / observação</label>
                  <input
                    className="input"
                    value={distributionForm.evidence}
                    onChange={(event) => setDistributionForm({ ...distributionForm, evidence: event.target.value })}
                    placeholder="Ex: comunicado enviado por e-mail em 28/06, cartaz afixado, reunião realizada"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={addDistributionRecord} className="btn-primary text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Registrar distribuição
                </button>
                <button onClick={() => copyText(generalInstructionText, "Texto de comunicado copiado!")} className="btn-secondary text-sm">
                  <Copy className="h-4 w-4" />
                  Copiar comunicado
                </button>
              </div>

              {distributionRecords.length > 0 && (
                <div className="mt-5 space-y-3">
                  {distributionRecords.map((record) => (
                    <div key={record.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{record.channel}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleString("pt-BR")} · {record.audience}
                          </p>
                          <p className="mt-2 text-sm text-gray-600">{record.message}</p>
                          {record.evidence && (
                            <p className="mt-2 text-xs text-gray-500">
                              <strong>Evidência:</strong> {record.evidence}
                            </p>
                          )}
                        </div>
                        <button onClick={() => removeDistributionRecord(record.id)} className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card bg-gray-900 text-white">
              <h2 className="text-lg font-bold">Próxima fase: achados agregados automáticos</h2>
              <p className="mt-2 text-sm text-gray-300">
                Na Fase 4 vamos transformar as respostas por dimensão em achados sugeridos,
                respeitando confidencialidade e levando para inventário psicossocial.
              </p>
              <Link to="/obrigacoes-nr1" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                Ver roadmap <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function ChannelTag({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
