import { DashboardLayout } from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";

const STATUS_LABEL = {
  recebida: "Recebida",
  em_apuracao: "Em apuração",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

const STATUS_BADGE = {
  recebida: "badge-yellow",
  em_apuracao: "badge-yellow",
  concluida: "badge-green",
  arquivada: "badge",
};

export default function Complaints() {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const { data: complaints } = trpc.complaint.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Denúncias (Canal Anônimo)</h1>

      <div className="card">
        {complaints?.length ? (
          <ul className="divide-y divide-gray-200">
            {complaints.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{c.protocolNumber}</span>
                    <span className={`badge ${STATUS_BADGE[c.status as keyof typeof STATUS_BADGE]}`}>
                      {STATUS_LABEL[c.status as keyof typeof STATUS_LABEL]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Categoria: {c.category} · Setor: {c.involvedDepartment ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 py-8 text-center">Nenhuma denúncia registrada ainda.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
