import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  FileText,
  GraduationCap,
  Handshake,
  PenLine,
  Printer,
  Scale,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

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

type Template = {
  id: TemplateId;
  title: string;
  badge: string;
  description: string;
  signature: string;
  icon: ComponentType<{ className?: string }>;
};

type CycleLite = {
  id: number;
  name: string;
  status: string;
  totalInvited?: number | null;
  totalResponded?: number | null;
};

const TEMPLATES: Template[] = [
  { id: "relatorio_avaliacao", title: "Relatório Consolidado da Avaliação Psicossocial", badge: "Central", description: "Ciclo, convidados, respondentes, participação e confidencialidade.", signature: "Assinatura do responsável da empresa/RH.", icon: FileCheck },
  { id: "inventario_plano", title: "Inventário Psicossocial + Plano de Ação", badge: "Central", description: "Riscos, fontes, consequências, ações, responsáveis e prazos.", signature: "Assinatura do responsável da empresa e, quando aplicável, responsável técnico.", icon: ClipboardCheck },
  { id: "ata_comunicacao", title: "Ata de Comunicação da Avaliação", badge: "Evidência", description: "Prova que a empresa comunicou avaliação, prazo, canais e confidencialidade.", signature: "Assinatura do responsável pela comunicação.", icon: FileText },
  { id: "lista_presenca", title: "Lista de Presença — Sensibilização Psicossocial", badge: "Assinável", description: "Treinamento, palestra, DDS ou sensibilização.", signature: "Assinatura dos trabalhadores presentes.", icon: GraduationCap },
  { id: "termo_ciencia", title: "Termo de Ciência sobre Riscos Psicossociais", badge: "Assinável", description: "Trabalhador declara ciência sobre riscos, canal de relatos e condutas.", signature: "Assinatura individual do trabalhador.", icon: PenLine },
  { id: "codigo_conduta", title: "Código de Conduta e Prevenção ao Assédio", badge: "Conduta", description: "Política básica de respeito, assédio, discriminação, retaliação e canal.", signature: "Assinatura da empresa; aceite individual em termo separado.", icon: Scale },
  { id: "termo_aceite_codigo", title: "Termo de Recebimento e Aceite do Código", badge: "Assinável", description: "Prova que o trabalhador recebeu e reconhece o Código de Conduta.", signature: "Assinatura individual do trabalhador.", icon: Handshake },
  { id: "cartilha", title: "Cartilha de Saúde Mental e Riscos Psicossociais", badge: "Educativo", description: "Material simples para distribuição interna.", signature: "Pode ser acompanhada de termo de ciência.", icon: BookOpen },
  { id: "aditivo_funcao", title: "Aditivo de Ciência — Fatores Psicossociais da Função", badge: "Complementar", description: "Complementa documentos de função/OS com fatores psicossociais.", signature: "Assinatura individual ou por função.", icon: FileText },
  { id: "dossie", title: "Dossiê NR-1 Psicossocial", badge: "Dossiê", description: "Pacote final para auditoria, fiscalização e gestão interna.", signature: "Assinatura do responsável da empresa.", icon: Shield },
];

function statusTone(status: string): "gray" | "yellow" | "green" | "brand" {
  if (status === "assinado") return "green";
  if (status === "impresso") return "yellow";
  if (status === "arquivado") return "brand";
  return "gray";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    gerado: "Gerado",
    impresso: "Impresso",
    assinado: "Assinado",
    arquivado: "Arquivado",
  };
  return map[status] ?? status;
}

export default function DocumentsSignatures() {
  const utils = trpc.useUtils();
  const { data: companies, isLoading: loadingCompany } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id ?? 0;

  const { data: cycles } = trpc.assessment.cycles.useQuery(
    { companyId },
    { enabled: !!companyId },
  );

  const cycleList = ((cycles ?? []) as CycleLite[]);
  const activeCycle = cycleList.find((cycle) => cycle.status === "active") ?? cycleList[0] ?? null;

  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(activeCycle?.id);
  const currentCycleId = selectedCycleId ?? activeCycle?.id;

  const { data: documents, isLoading: loadingDocuments } = trpc.psychosocial.listDocuments.useQuery(
    { companyId, cycleId: currentCycleId },
    { enabled: !!companyId },
  );

  const createDocument = trpc.psychosocial.createDocument.useMutation({
    onSuccess: async () => {
      toast.success("Documento registrado no Supabase.");
      await utils.psychosocial.listDocuments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = trpc.psychosocial.updateDocumentStatus.useMutation({
    onSuccess: async () => {
      await utils.psychosocial.listDocuments.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("relatorio_avaliacao");
  const [notes, setNotes] = useState("");

  const selectedTemplate = TEMPLATES.find((template) => template.id === selectedTemplateId) ?? TEMPLATES[0];
  const documentList = documents ?? [];

  const stats = useMemo(() => {
    const total = documentList.length;
    const signed = documentList.filter((doc) => doc.status === "assinado").length;
    const printed = documentList.filter((doc) => doc.status === "impresso").length;
    const archived = documentList.filter((doc) => doc.status === "arquivado").length;
    return { total, signed, printed, archived };
  }, [documentList]);

  function handleCreate(status = "gerado") {
    if (!companyId) {
      toast.error("Cadastre a empresa primeiro.");
      return;
    }

    createDocument.mutate({
      companyId,
      cycleId: currentCycleId,
      templateId: selectedTemplate.id,
      title: selectedTemplate.title,
      status,
      notes,
      metadata: {
        source: "documents_signatures_page",
      },
    });
  }

  function handlePrint() {
    handleCreate("impresso");
    setTimeout(() => window.print(), 150);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Documentos e assinaturas"
        title="Pasta de evidências pronta para PME"
        description="Gere, imprima, colete assinatura física ou registre controle digital dos documentos psicossociais."
        action={
          <>
            <button onClick={() => handleCreate("gerado")} className="btn-secondary">
              <CheckCircle2 className="h-4 w-4" />
              Registrar gerado
            </button>
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="h-4 w-4" />
              Imprimir / salvar PDF
            </button>
          </>
        }
      />

      {loadingCompany ? (
        <div className="card">
          <p className="text-gray-500">Carregando empresa...</p>
        </div>
      ) : !company ? (
        <EmptyPanel
          icon={<FileCheck className="h-6 w-6" />}
          title="Cadastre a empresa primeiro"
          description="Os documentos precisam sair com os dados da empresa."
          action={<Link to="/comecar" className="btn-primary">Configurar empresa →</Link>}
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Modelos" value={TEMPLATES.length} helper="prontos para gerar" />
            <MetricCard label="Documentos" value={stats.total} helper="registrados" />
            <MetricCard label="Assinados" value={stats.signed} helper="controle atual" tone={stats.signed ? "green" : "gray"} />
            <MetricCard label="Arquivados" value={stats.archived} helper="pasta final" tone={stats.archived ? "brand" : "gray"} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[420px_1fr] print:block">
            <div className="space-y-6 print:hidden">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Escolha o modelo</h2>
                <p className="mt-1 text-sm text-gray-500">O app registra o documento no Supabase e permite impressão.</p>

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
                            <StatusBadge>{template.badge}</StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Ciclo e observações</h2>

                {cycleList.length > 0 && (
                  <div className="mt-4">
                    <label className="label">Ciclo relacionado</label>
                    <select className="input" value={currentCycleId ?? ""} onChange={(event) => setSelectedCycleId(Number(event.target.value))}>
                      {cycleList.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>{cycle.name} — {cycle.status}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-4">
                  <label className="label">Observações internas</label>
                  <textarea
                    className="input min-h-[90px]"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ex: impresso para assinatura física; enviado ao RH; aguardando coleta."
                  />
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Controle de documentos</h2>

                {loadingDocuments ? (
                  <p className="mt-4 text-sm text-gray-500">Carregando documentos...</p>
                ) : documentList.length ? (
                  <div className="mt-4 space-y-3">
                    {documentList.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{doc.title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {doc.generatedAt ? new Date(doc.generatedAt).toLocaleString("pt-BR") : "Sem data"}
                            </p>
                            {doc.notes && <p className="mt-2 text-xs text-gray-500">{doc.notes}</p>}
                          </div>
                          <StatusBadge tone={statusTone(doc.status)}>{statusLabel(doc.status)}</StatusBadge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {["gerado", "impresso", "assinado", "arquivado"].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateStatus.mutate({ companyId, id: doc.id, status })}
                              className="btn-secondary text-xs"
                            >
                              {statusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">Nenhum documento registrado ainda.</p>
                )}
              </div>
            </div>

            <div className="card print:shadow-none print:border-0 print:p-0">
              <DocumentPreview template={selectedTemplate} company={company} cycle={cycleList.find((cycle) => cycle.id === currentCycleId) ?? activeCycle} />
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function DocumentPreview({ template, company, cycle }: { template: Template; company: any; cycle?: CycleLite | null }) {
  return (
    <article className="mx-auto max-w-4xl bg-white text-gray-900 print:max-w-none">
      <header className="border-b border-gray-300 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">NR1Check · Evidência psicossocial</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{template.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{template.description}</p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Info label="Empresa" value={company?.name ?? "Empresa não informada"} />
        <Info label="CNPJ" value={company?.cnpj ?? "Não informado"} />
        <Info label="Ciclo" value={cycle?.name ?? "Não selecionado"} />
        <Info label="Data" value={new Date().toLocaleDateString("pt-BR")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">Conteúdo do documento</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Este documento compõe a pasta de evidências da gestão de riscos psicossociais da empresa.
          Deve ser usado para demonstrar organização, comunicação, análise, plano de ação
          ou ciência dos trabalhadores, conforme o tipo de documento selecionado.
        </p>

        <div className="mt-5 rounded-xl border border-gray-300 p-4">
          <p className="text-sm font-semibold text-gray-900">Declaração / registro</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            A empresa registra, por meio deste documento, as medidas relacionadas ao ciclo psicossocial,
            preservando a confidencialidade das respostas individuais e mantendo o foco em análise agregada,
            melhoria organizacional e evidências de gestão.
          </p>
        </div>

        <div className="mt-5 min-h-[160px] rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Espaço para conteúdo complementar, lista de presença, observações, anexos, participantes
          ou informações específicas do documento.
        </div>
      </section>

      <footer className="mt-10 border-t border-gray-300 pt-6">
        <p className="text-sm font-semibold text-gray-900">Assinaturas</p>
        <p className="mt-1 text-xs text-gray-500">{template.signature}</p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <SignatureLine label="Responsável da empresa" />
          <SignatureLine label="Data" />
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-gray-500">
          Documento gerado pelo NR1Check como ferramenta de organização de evidências.
          A empresa deve validar tecnicamente e juridicamente os documentos quando aplicável.
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
