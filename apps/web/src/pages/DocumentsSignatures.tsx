import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileCheck,
  FileText,
  GraduationCap,
  Handshake,
  MessageSquare,
  PenLine,
  Printer,
  Scale,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type TemplateId =
  | "relatorio_avaliacao"
  | "ata_comunicacao"
  | "lista_presenca"
  | "termo_ciencia"
  | "codigo_conduta"
  | "termo_aceite_codigo"
  | "cartilha"
  | "aditivo_funcao"
  | "inventario_plano"
  | "dossie";

type DocumentStatus = "gerado" | "impresso" | "assinado" | "arquivado";

type GeneratedDocument = {
  id: string;
  templateId: TemplateId;
  title: string;
  status: DocumentStatus;
  createdAt: string;
  notes?: string;
};

type Template = {
  id: TemplateId;
  title: string;
  category: "central" | "evidencia" | "conduta" | "educativo";
  badge: string;
  description: string;
  signature: string;
  icon: LucideIcon;
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

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", icon: BarChart3 },
  { to: "/inventario-riscos", label: "Inventário + Plano", icon: FileText },
  { to: "/documentos-assinaturas", label: "Documentos", icon: FileCheck },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const TEMPLATES: Template[] = [
  {
    id: "relatorio_avaliacao",
    title: "Relatório Consolidado da Avaliação Psicossocial",
    category: "central",
    badge: "Central",
    description: "Documento com ciclo, convidados, respondentes, participação, dimensões avaliadas e observação de confidencialidade.",
    signature: "Assinatura do responsável da empresa/RH.",
    icon: BarChart3,
  },
  {
    id: "inventario_plano",
    title: "Inventário Psicossocial + Plano de Ação",
    category: "central",
    badge: "Central",
    description: "Documento para consolidar riscos psicossociais, fontes, consequências, probabilidade, severidade, ação, responsável e prazo.",
    signature: "Assinatura do responsável da empresa e, quando aplicável, responsável técnico.",
    icon: ClipboardCheck,
  },
  {
    id: "ata_comunicacao",
    title: "Ata de Comunicação da Avaliação",
    category: "evidencia",
    badge: "Evidência",
    description: "Prova que a empresa comunicou a avaliação, prazo, canais de resposta e garantia de confidencialidade.",
    signature: "Assinatura do responsável da comunicação; lista de presença opcional.",
    icon: FileCheck,
  },
  {
    id: "lista_presenca",
    title: "Lista de Presença — Sensibilização Psicossocial",
    category: "evidencia",
    badge: "Assinável",
    description: "Lista para treinamento, palestra, DDS ou sensibilização sobre riscos psicossociais, assédio e canal de relatos.",
    signature: "Assinatura dos trabalhadores presentes.",
    icon: GraduationCap,
  },
  {
    id: "termo_ciencia",
    title: "Termo de Ciência sobre Riscos Psicossociais",
    category: "evidencia",
    badge: "Assinável",
    description: "Folha individual para trabalhador declarar ciência sobre riscos psicossociais, canal de relatos e condutas esperadas.",
    signature: "Assinatura individual do trabalhador.",
    icon: PenLine,
  },
  {
    id: "codigo_conduta",
    title: "Código de Conduta e Prevenção ao Assédio",
    category: "conduta",
    badge: "Conduta",
    description: "Política básica de respeito, prevenção ao assédio, discriminação, violência, retaliação e canal de relatos.",
    signature: "Assinatura da empresa; aceite individual em termo separado.",
    icon: Scale,
  },
  {
    id: "termo_aceite_codigo",
    title: "Termo de Recebimento e Aceite do Código de Conduta",
    category: "conduta",
    badge: "Assinável",
    description: "Documento individual que prova que o trabalhador recebeu, leu e reconhece o Código de Conduta.",
    signature: "Assinatura individual do trabalhador.",
    icon: Handshake,
  },
  {
    id: "cartilha",
    title: "Cartilha de Saúde Mental e Riscos Psicossociais",
    category: "educativo",
    badge: "Educativo",
    description: "Material simples para distribuição interna explicando riscos psicossociais, exemplos, canais e atitudes esperadas.",
    signature: "Não exige assinatura, mas pode ser acompanhada de termo de ciência.",
    icon: BookOpen,
  },
  {
    id: "aditivo_funcao",
    title: "Aditivo de Ciência — Fatores Psicossociais da Função",
    category: "evidencia",
    badge: "Complementar",
    description: "Complementa documentos de função/OS com fatores psicossociais e canais de comunicação.",
    signature: "Assinatura individual por trabalhador ou por função.",
    icon: FileText,
  },
  {
    id: "dossie",
    title: "Dossiê NR-1 Psicossocial",
    category: "central",
    badge: "Dossiê",
    description: "Pacote final com avaliação, comunicação, participação, inventário, plano de ação, relatos e documentos de ciência.",
    signature: "Assinatura do responsável da empresa.",
    icon: Shield,
  },
];

const STATUS_LABEL: Record<DocumentStatus, string> = {
  gerado: "Gerado",
  impresso: "Impresso",
  assinado: "Assinado",
  arquivado: "Arquivado",
};

const STATUS_CLASS: Record<DocumentStatus, string> = {
  gerado: "bg-gray-50 text-gray-700 border-gray-200",
  impresso: "bg-yellow-50 text-yellow-700 border-yellow-200",
  assinado: "bg-green-50 text-green-700 border-green-200",
  arquivado: "bg-brand-50 text-brand-700 border-brand-200",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

function today() {
  return new Date().toLocaleDateString("pt-BR");
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageKey(companyId?: number) {
  return `nr1check:documents-signatures:${companyId ?? "demo"}`;
}

async function copyText(value: string, message = "Copiado!") {
  await navigator.clipboard.writeText(value);
  toast.success(message);
}

export default function DocumentsSignatures() {
  const { user } = useUser();

  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: employees } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const { data: questions } = trpc.assessment.questions.useQuery();

  const { data: cycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const cycleList = ((cycles ?? []) as CycleLite[]);
  const employeeList = ((employees ?? []) as EmployeeLite[]);

  const activeCycle = useMemo(() => {
    return cycleList.find((cycle) => cycle.status === "active") ?? cycleList[0] ?? null;
  }, [cycleList]);

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const currentCycleId = selectedCycleId ?? activeCycle?.id ?? null;
  const currentCycle = cycleList.find((cycle) => cycle.id === currentCycleId) ?? activeCycle;

  const { data: cycleResults } = trpc.assessment.cycleResults.useQuery(
    { companyId, cycleId: currentCycleId ?? 0 },
    { enabled: !!companyId && !!currentCycleId },
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("relatorio_avaliacao");
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) {
      setDocuments([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as GeneratedDocument[];
      setDocuments(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDocuments([]);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(documents));
  }, [companyId, documents]);

  const selectedTemplate = TEMPLATES.find((template) => template.id === selectedTemplateId) ?? TEMPLATES[0];
  const responseCount = cycleResults?.responses?.length ?? currentCycle?.totalResponded ?? 0;
  const invitedCount = currentCycle?.totalInvited ?? employeeList.length;
  const responseRate = invitedCount ? Math.round((Number(responseCount) / Number(invitedCount)) * 100) : 0;
  const questionCount = questions?.length ?? 0;
  const dimensions = useMemo(() => {
    const set = new Set<string>();
    for (const question of questions ?? []) {
      set.add(question.dimension || "Sem dimensão");
    }
    return Array.from(set);
  }, [questions]);

  function registerGeneratedDocument(status: DocumentStatus = "gerado") {
    const item: GeneratedDocument = {
      id: createId(),
      templateId: selectedTemplate.id,
      title: selectedTemplate.title,
      status,
      notes,
      createdAt: new Date().toISOString(),
    };

    setDocuments((current) => [item, ...current]);
    setNotes("");
    toast.success("Documento registrado no controle.");
  }

  function updateDocumentStatus(id: string, status: DocumentStatus) {
    setDocuments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function removeDocument(id: string) {
    setDocuments((current) => current.filter((item) => item.id !== id));
    toast.success("Documento removido do controle.");
  }

  function handlePrint() {
    registerGeneratedDocument("impresso");
    setTimeout(() => window.print(), 100);
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
                item.to === "/documentos-assinaturas" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
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
        <div className="print:hidden mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <FileCheck className="h-3.5 w-3.5" />
              Camada transversal do roadmap
            </div>
            <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">
              Documentos e Assinaturas
            </h1>
            <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">
              Gere documentos imprimíveis e assináveis para formar a pasta de evidências NR-1 Psicossocial:
              avaliação, comunicação, ciência, conduta, treinamento, inventário, plano de ação e dossiê.
            </p>
            {company && (
              <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => registerGeneratedDocument("gerado")} className="btn-secondary text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Registrar gerado
            </button>
            <button onClick={handlePrint} className="btn-primary text-sm">
              <Printer className="h-4 w-4" />
              Imprimir / salvar PDF
            </button>
          </div>
        </div>

        {loadingCompany ? (
          <div className="card print:hidden">
            <p className="text-gray-500">Carregando empresa...</p>
          </div>
        ) : !company ? (
          <div className="card border-yellow-200 bg-yellow-50 print:hidden">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-semibold text-yellow-900">Cadastre a empresa primeiro</h2>
                <p className="mt-1 text-sm text-yellow-800">
                  Os documentos precisam de dados da empresa.
                </p>
                <Link to="/comecar" className="btn-primary mt-4">
                  Configurar empresa →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
          <MetricCard label="Modelos disponíveis" value={String(TEMPLATES.length)} helper="PDF/assinatura física ou digital" />
          <MetricCard label="Trabalhadores" value={String(employeeList.length)} helper="Base para listas e termos" />
          <MetricCard label="Avaliação" value={`${responseRate}%`} helper={`${responseCount}/${invitedCount || 0} respostas`} />
          <MetricCard label="Controle" value={String(documents.length)} helper="Documentos registrados" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr] print:block">
          <div className="space-y-6 print:hidden">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Modelos de documentos</h2>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um documento, revise a prévia e imprima/salve em PDF.
              </p>

              <div className="mt-5 space-y-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedTemplateId === template.id ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                        <template.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{template.title}</p>
                          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            {template.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Ciclo de avaliação</h2>
              <p className="mt-1 text-sm text-gray-500">
                Usado no relatório consolidado, dossiê e evidências.
              </p>

              {cycleList.length ? (
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
                  Nenhum ciclo encontrado. Crie um ciclo em Avaliação Psicossocial.
                </div>
              )}

              <Link to="/avaliacao-psicossocial" className="btn-secondary mt-4 w-full text-sm">
                Abrir avaliação <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Observações internas</h2>
              <textarea
                className="input mt-3 min-h-[90px]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex: documento impresso e entregue ao gestor em reunião; assinatura física será coletada até sexta-feira."
              />
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Controle de documentos</h2>

              {documents.length ? (
                <div className="mt-4 space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{doc.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{new Date(doc.createdAt).toLocaleString("pt-BR")}</p>
                          {doc.notes && <p className="mt-2 text-xs text-gray-500">{doc.notes}</p>}
                        </div>
                        <button onClick={() => removeDocument(doc.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[doc.status]}`}>
                          {STATUS_LABEL[doc.status]}
                        </span>
                        {(["gerado", "impresso", "assinado", "arquivado"] as DocumentStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateDocumentStatus(doc.id, status)}
                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                          >
                            {STATUS_LABEL[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Nenhum documento registrado ainda.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card print:shadow-none print:border-0 print:p-0">
              <DocumentPreview
                template={selectedTemplate}
                company={company}
                employees={employeeList}
                cycle={currentCycle}
                questionCount={questionCount}
                dimensions={dimensions}
                responseCount={Number(responseCount)}
                invitedCount={Number(invitedCount || 0)}
                responseRate={responseRate}
              />
            </div>

            <div className="card bg-gray-900 text-white print:hidden">
              <h2 className="text-lg font-bold">Próxima evolução</h2>
              <p className="mt-2 text-sm text-gray-300">
                Depois vamos persistir documentos e assinaturas no banco, adicionar aceite digital por funcionário
                e anexos de comprovante físico.
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

function DocumentPreview({
  template,
  company,
  employees,
  cycle,
  questionCount,
  dimensions,
  responseCount,
  invitedCount,
  responseRate,
}: {
  template: Template;
  company: any;
  employees: EmployeeLite[];
  cycle: CycleLite | null;
  questionCount: number;
  dimensions: string[];
  responseCount: number;
  invitedCount: number;
  responseRate: number;
}) {
  const cnpj = company?.cnpj ?? "Não informado";
  const companyName = company?.name ?? "Empresa não informada";
  const address = [company?.address, company?.city, company?.state].filter(Boolean).join(" — ") || "Não informado";

  return (
    <article className="mx-auto max-w-4xl bg-white text-gray-900 print:max-w-none">
      <header className="border-b border-gray-300 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">NR1Check · Documentos e Assinaturas</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{template.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{template.description}</p>
          </div>
          <div className="rounded-xl border border-gray-300 px-4 py-3 text-right text-xs text-gray-600">
            <p className="font-semibold text-gray-900">Data</p>
            <p>{today()}</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Info label="Empresa" value={companyName} />
        <Info label="CNPJ" value={cnpj} />
        <Info label="Endereço" value={address} />
        <Info label="Responsável" value="________________________________________" />
      </section>

      <div className="mt-8">
        {template.id === "relatorio_avaliacao" && (
          <RelatorioAvaliacao
            cycle={cycle}
            questionCount={questionCount}
            dimensions={dimensions}
            responseCount={responseCount}
            invitedCount={invitedCount}
            responseRate={responseRate}
          />
        )}

        {template.id === "ata_comunicacao" && (
          <AtaComunicacao cycle={cycle} />
        )}

        {template.id === "lista_presenca" && (
          <ListaPresenca employees={employees} />
        )}

        {template.id === "termo_ciencia" && (
          <TermoCiencia />
        )}

        {template.id === "codigo_conduta" && (
          <CodigoConduta companyName={companyName} />
        )}

        {template.id === "termo_aceite_codigo" && (
          <TermoAceiteCodigo />
        )}

        {template.id === "cartilha" && (
          <Cartilha />
        )}

        {template.id === "aditivo_funcao" && (
          <AditivoFuncao />
        )}

        {template.id === "inventario_plano" && (
          <InventarioPlano />
        )}

        {template.id === "dossie" && (
          <Dossie
            cycle={cycle}
            questionCount={questionCount}
            dimensions={dimensions}
            responseCount={responseCount}
            invitedCount={invitedCount}
            responseRate={responseRate}
          />
        )}
      </div>

      <footer className="mt-10 border-t border-gray-300 pt-6">
        <p className="text-sm font-semibold text-gray-900">Assinaturas</p>
        <p className="mt-1 text-xs text-gray-500">{template.signature}</p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <SignatureLine label="Responsável da empresa" />
          <SignatureLine label="Data" />
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-gray-500">
          Documento gerado pelo NR1Check como ferramenta de organização de evidências. A empresa deve validar
          tecnicamente e juridicamente os documentos quando aplicável, especialmente nos casos que exigirem responsável técnico,
          CIPA, investigação formal, medidas disciplinares ou integração ao PGR completo.
        </p>
      </footer>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="border-b border-gray-400 pb-8" />
      <p className="mt-2 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold text-gray-900">{children}</h2>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-gray-700">{children}</p>;
}

function RelatorioAvaliacao({
  cycle,
  questionCount,
  dimensions,
  responseCount,
  invitedCount,
  responseRate,
}: {
  cycle: CycleLite | null;
  questionCount: number;
  dimensions: string[];
  responseCount: number;
  invitedCount: number;
  responseRate: number;
}) {
  return (
    <section>
      <SectionTitle>1. Identificação do ciclo</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Ciclo" value={cycle?.name ?? "Não selecionado"} />
        <Info label="Status" value={cycle?.status ?? "Não informado"} />
        <Info label="Início" value={formatDate(cycle?.startDate)} />
        <Info label="Prazo/Fim" value={formatDate(cycle?.endDate)} />
      </div>

      <SectionTitle>2. Participação</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Convidados" value={String(invitedCount)} />
        <Info label="Respondentes" value={String(responseCount)} />
        <Info label="Taxa" value={`${responseRate}%`} />
      </div>

      <SectionTitle>3. Instrumento aplicado</SectionTitle>
      <Paragraph>
        A empresa disponibilizou avaliação psicossocial com {questionCount} pergunta(s), distribuídas em {dimensions.length} dimensão(ões).
      </Paragraph>
      <ul className="ml-5 list-disc text-sm text-gray-700">
        {dimensions.map((dimension) => <li key={dimension}>{dimension}</li>)}
      </ul>

      <SectionTitle>4. Confidencialidade</SectionTitle>
      <Paragraph>
        Os resultados devem ser analisados de forma agregada, evitando exposição individual dos trabalhadores.
        O objetivo é identificar fatores de risco relacionados à organização do trabalho e orientar medidas preventivas.
      </Paragraph>
    </section>
  );
}

function AtaComunicacao({ cycle }: { cycle: CycleLite | null }) {
  return (
    <section>
      <SectionTitle>Ata de comunicação</SectionTitle>
      <Paragraph>
        Nesta data, a empresa comunicou aos trabalhadores a realização da avaliação psicossocial referente ao ciclo
        "{cycle?.name ?? "Avaliação Psicossocial NR-1"}".
      </Paragraph>
      <Paragraph>
        A comunicação informou a finalidade da avaliação, o prazo para resposta, os canais de acesso e a orientação de que
        as respostas devem ser usadas em análise agregada, com foco preventivo e organizacional.
      </Paragraph>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="Canais utilizados" value="Link, QR Code, comunicado interno, e-mail, intranet ou outro meio registrado" />
        <Info label="Prazo" value={formatDate(cycle?.endDate)} />
      </div>

      <SectionTitle>Registro da comunicação</SectionTitle>
      <div className="min-h-[90px] rounded-xl border border-gray-300 p-4 text-sm text-gray-600">
        Descrever aqui como a comunicação foi realizada, onde foi publicada e quem foi responsável.
      </div>
    </section>
  );
}

function ListaPresenca({ employees }: { employees: EmployeeLite[] }) {
  const rows = employees.length ? employees.slice(0, 18) : Array.from({ length: 12 }, (_, index) => ({ id: index, name: "", cpf: "", role: "" }));

  return (
    <section>
      <SectionTitle>Sensibilização sobre riscos psicossociais</SectionTitle>
      <Paragraph>
        Tema: riscos psicossociais no trabalho, prevenção ao assédio, condutas esperadas, canais de relatos e compromisso de respeito.
      </Paragraph>
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Data" value="____/____/______" />
        <Info label="Carga horária" value="________" />
        <Info label="Responsável" value="________________" />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left">Nome</th>
              <th className="border border-gray-300 px-2 py-2 text-left">CPF</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Cargo</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee) => (
              <tr key={employee.id}>
                <td className="border border-gray-300 px-2 py-3">{employee.name}</td>
                <td className="border border-gray-300 px-2 py-3">{employee.cpf ?? ""}</td>
                <td className="border border-gray-300 px-2 py-3">{employee.role ?? ""}</td>
                <td className="border border-gray-300 px-2 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TermoCiencia() {
  return (
    <section>
      <SectionTitle>Termo de ciência sobre riscos psicossociais</SectionTitle>
      <Paragraph>
        Declaro que fui informado(a) sobre a existência de fatores psicossociais relacionados ao trabalho, incluindo
        sobrecarga, ritmo intenso, conflitos, assédio, discriminação, violência, falhas de comunicação, falta de apoio,
        jornadas inadequadas e outros fatores que possam afetar a saúde e o bem-estar.
      </Paragraph>
      <Paragraph>
        Declaro também que fui informado(a) sobre os canais internos disponíveis para relatos, orientação ou comunicação
        de situações de risco, bem como sobre a importância de agir com respeito, colaboração e responsabilidade.
      </Paragraph>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <SignatureLine label="Nome do trabalhador" />
        <SignatureLine label="CPF" />
        <SignatureLine label="Assinatura" />
        <SignatureLine label="Data" />
      </div>
    </section>
  );
}

function CodigoConduta({ companyName }: { companyName: string }) {
  return (
    <section>
      <SectionTitle>Código de Conduta e Prevenção ao Assédio</SectionTitle>
      <Paragraph>
        A {companyName} estabelece este Código de Conduta para promover ambiente de trabalho respeitoso, seguro,
        saudável e livre de assédio moral, assédio sexual, discriminação, violência, humilhação, intimidação ou retaliação.
      </Paragraph>

      <SectionTitle>Condutas esperadas</SectionTitle>
      <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
        <li>Tratar colegas, líderes, clientes, fornecedores e terceiros com respeito.</li>
        <li>Evitar comentários ofensivos, humilhantes, discriminatórios ou sexualizados.</li>
        <li>Comunicar situações de assédio, violência, sobrecarga extrema ou conflito recorrente.</li>
        <li>Respeitar pausas, orientações internas, fluxos de trabalho e medidas preventivas.</li>
        <li>Não retaliar trabalhadores que fizerem relatos de boa-fé.</li>
      </ul>

      <SectionTitle>Canal de relatos</SectionTitle>
      <Paragraph>
        A empresa disponibiliza canal de relatos para comunicação de situações de assédio, discriminação, violência,
        conflito, sobrecarga ou outros fatores psicossociais. Os relatos devem ser tratados com seriedade, confidencialidade
        e respeito às pessoas envolvidas.
      </Paragraph>
    </section>
  );
}

function TermoAceiteCodigo() {
  return (
    <section>
      <SectionTitle>Termo de recebimento e aceite do Código de Conduta</SectionTitle>
      <Paragraph>
        Declaro que recebi ou tive acesso ao Código de Conduta e Prevenção ao Assédio da empresa, compreendi suas regras
        gerais e tenho ciência dos canais de comunicação disponíveis.
      </Paragraph>
      <Paragraph>
        Comprometo-me a respeitar as orientações de convivência, prevenção ao assédio, não discriminação, não retaliação
        e comunicação responsável de situações de risco.
      </Paragraph>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <SignatureLine label="Nome do trabalhador" />
        <SignatureLine label="CPF" />
        <SignatureLine label="Assinatura" />
        <SignatureLine label="Data" />
      </div>
    </section>
  );
}

function Cartilha() {
  return (
    <section>
      <SectionTitle>Cartilha de Saúde Mental e Riscos Psicossociais</SectionTitle>
      <Paragraph>
        Riscos psicossociais são fatores relacionados à organização do trabalho, relações, liderança, comunicação,
        carga de trabalho e ambiente social que podem contribuir para estresse, conflitos, exaustão, sofrimento ou adoecimento.
      </Paragraph>

      <SectionTitle>Exemplos</SectionTitle>
      <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
        <li>Sobrecarga, metas excessivas e prazos incompatíveis.</li>
        <li>Assédio moral, assédio sexual, discriminação ou humilhação.</li>
        <li>Falta de clareza de função, baixa autonomia ou comunicação ruim.</li>
        <li>Conflitos recorrentes, violência externa ou falta de suporte da liderança.</li>
        <li>Jornadas extensas, ausência de pausas e dificuldade de desligamento.</li>
      </ul>

      <SectionTitle>O que fazer</SectionTitle>
      <Paragraph>
        Procure orientação interna, use os canais de relato da empresa, comunique situações de risco e colabore para um
        ambiente de trabalho respeitoso e saudável.
      </Paragraph>
    </section>
  );
}

function AditivoFuncao() {
  return (
    <section>
      <SectionTitle>Aditivo de ciência — fatores psicossociais da função</SectionTitle>
      <Paragraph>
        Este documento complementa as orientações da função quanto a fatores psicossociais que podem estar presentes no
        trabalho, sem substituir documentos técnicos de SST quando exigidos.
      </Paragraph>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Função/Cargo" value="________________________________" />
        <Info label="Setor" value="________________________________" />
      </div>

      <SectionTitle>Fatores possíveis</SectionTitle>
      <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
        <li>Demandas intensas, prazos e pressão por resultados.</li>
        <li>Contato com público, clientes ou situações de conflito.</li>
        <li>Necessidade de comunicação clara, respeito e cooperação.</li>
        <li>Uso dos canais internos em caso de assédio, violência, sobrecarga ou conflito.</li>
      </ul>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <SignatureLine label="Nome do trabalhador" />
        <SignatureLine label="CPF" />
        <SignatureLine label="Assinatura" />
        <SignatureLine label="Data" />
      </div>
    </section>
  );
}

function InventarioPlano() {
  const rows = Array.from({ length: 6 }, (_, index) => index + 1);

  return (
    <section>
      <SectionTitle>Inventário Psicossocial + Plano de Ação</SectionTitle>
      <Paragraph>
        Registrar abaixo os riscos psicossociais identificados, suas fontes, consequências possíveis, nível de risco
        e ações preventivas/corretivas.
      </Paragraph>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left">Risco</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Setor/grupo</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Fonte/causa</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Nível</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Ação</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Responsável/prazo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="border border-gray-300 px-2 py-6" />
                <td className="border border-gray-300 px-2 py-6" />
                <td className="border border-gray-300 px-2 py-6" />
                <td className="border border-gray-300 px-2 py-6" />
                <td className="border border-gray-300 px-2 py-6" />
                <td className="border border-gray-300 px-2 py-6" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Dossie({
  cycle,
  questionCount,
  dimensions,
  responseCount,
  invitedCount,
  responseRate,
}: {
  cycle: CycleLite | null;
  questionCount: number;
  dimensions: string[];
  responseCount: number;
  invitedCount: number;
  responseRate: number;
}) {
  return (
    <section>
      <SectionTitle>Dossiê NR-1 Psicossocial</SectionTitle>
      <Paragraph>
        Este dossiê organiza os documentos e evidências do ciclo psicossocial da empresa para facilitar consulta,
        impressão, assinatura, arquivamento e eventual apresentação em auditorias ou fiscalizações.
      </Paragraph>

      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Ciclo" value={cycle?.name ?? "Não selecionado"} />
        <Info label="Participação" value={`${responseCount}/${invitedCount} (${responseRate}%)`} />
        <Info label="Perguntas" value={String(questionCount)} />
      </div>

      <SectionTitle>Itens que devem compor a pasta</SectionTitle>
      <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
        <li>Ata de Comunicação da Avaliação.</li>
        <li>Relatório Consolidado da Avaliação Psicossocial.</li>
        <li>Inventário Psicossocial.</li>
        <li>Plano de Ação.</li>
        <li>Registros de sensibilização/treinamento.</li>
        <li>Código de Conduta e Termos de Aceite.</li>
        <li>Cartilha ou material educativo distribuído.</li>
        <li>Registros de relatos, apuração e medidas adotadas quando houver.</li>
        <li>Revisões e atualizações relacionadas ao PGR.</li>
      </ul>

      <SectionTitle>Dimensões avaliadas</SectionTitle>
      <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
        {dimensions.map((dimension) => <li key={dimension}>{dimension}</li>)}
      </ul>
    </section>
  );
}
