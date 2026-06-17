import { DashboardLayout } from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { useState } from "react";
import toast from "react-hot-toast";
import { FileText, Download } from "lucide-react";

export default function Documents() {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const { data: orders } = trpc.compliance.serviceOrder.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );
  const { data: pgrs } = trpc.pgr.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );
  const generatePgr = trpc.pgr.generate.useMutation({
    onSuccess: () => toast.success("PGR gerado com sucesso!"),
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documentos</h1>
        <button
          onClick={() => companyId && generatePgr.mutate({ companyId })}
          disabled={generatePgr.isPending}
          className="btn-primary"
        >
          {generatePgr.isPending ? "Gerando..." : "Gerar PGR com IA"}
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Programas de Gerenciamento de Riscos (PGR)</h2>
        <div className="card">
          {pgrs?.length ? (
            <ul className="divide-y divide-gray-200">
              {pgrs.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.status} · {p.generatedAt ? new Date(p.generatedAt).toLocaleDateString("pt-BR") : "rascunho"}
                    </p>
                  </div>
                  {p.pdfUrl && (
                    <a href={p.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm flex items-center gap-1">
                      <Download className="h-4 w-4" /> Baixar
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum PGR gerado. Clique em "Gerar PGR com IA".</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Ordens de Serviço</h2>
        <div className="card">
          {orders?.length ? (
            <ul className="divide-y divide-gray-200">
              {orders.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="font-medium">OS — {o.jobTitle}</p>
                      <p className="text-xs text-gray-500">
                        {o.signedAt ? `Assinada em ${new Date(o.signedAt).toLocaleDateString("pt-BR")}` : "Aguardando assinatura"}
                      </p>
                    </div>
                  </div>
                  {o.pdfUrl && (
                    <a href={o.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm flex items-center gap-1">
                      <Download className="h-4 w-4" /> PDF
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhuma Ordem de Serviço gerada ainda.</p>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
