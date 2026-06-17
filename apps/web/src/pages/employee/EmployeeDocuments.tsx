import { useOutletContext } from "react-router-dom";
import { FileText, Download, Loader2, Shield } from "lucide-react";
import { trpc } from "../../lib/trpc";

type Ctx = { employee: { id: number; companyId: number } };

export function EmployeeDocuments() {
  const { employee } = useOutletContext<Ctx>();
  const { data: orders, isLoading } = trpc.compliance.serviceOrder.list.useQuery({
    companyId: employee.companyId,
  });

  // Filtra apenas as Ordens de Serviço vinculadas a este funcionário
  const myOrders = orders?.filter((o) => o.employeeId === employee.id) ?? [];

  if (isLoading) {
    return <div className="card text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-600" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Meus documentos</h1>
      <p className="text-sm text-gray-500 mb-6">Ordens de Serviço e termos que você assinou eletronicamente.</p>

      <div className="card">
        {myOrders.length ? (
          <ul className="divide-y divide-gray-200">
            {myOrders.map((o) => (
              <li key={o.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Ordem de Serviço — {o.jobTitle}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.signedAt
                        ? `Assinada em ${new Date(o.signedAt).toLocaleDateString("pt-BR")}`
                        : "Aguardando assinatura"}
                    </p>
                    {o.documentHash && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                        Hash: {o.documentHash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
                {o.pdfUrl && (
                  <a
                    href={o.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm flex-shrink-0"
                  >
                    <Download className="h-4 w-4" /> PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm">Nenhum documento vinculado a você ainda.</p>
            <p className="text-xs mt-1">Quando sua empresa gerar uma Ordem de Serviço para sua função, ela aparecerá aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
