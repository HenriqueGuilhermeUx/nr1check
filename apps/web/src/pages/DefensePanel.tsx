import { DashboardLayout } from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

export default function DefensePanel() {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const { data: panel } = trpc.compliance.defensePanel.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );
  const { data: pgrAlert } = trpc.compliance.pgrReview.checkAlerts.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  if (!panel) return <DashboardLayout><p>Carregando...</p></DashboardLayout>;

  const config = {
    green: { label: "Protegido", color: "text-green-700", bg: "bg-green-50", icon: CheckCircle2, border: "border-green-200" },
    yellow: { label: "Atenção", color: "text-yellow-700", bg: "bg-yellow-50", icon: AlertTriangle, border: "border-yellow-200" },
    red: { label: "Em risco", color: "text-red-700", bg: "bg-red-50", icon: AlertCircle, border: "border-red-200" },
  }[panel.overallStatus as "green" | "yellow" | "red"];

  const Icon = config.icon;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Painel de Defesa do Empregador</h1>

      <div className={`card ${config.bg} ${config.border} border-2 mb-6`}>
        <div className="flex items-center gap-4">
          <Icon className={`h-12 w-12 ${config.color}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Status da empresa</p>
            <h2 className={`text-3xl font-bold ${config.color}`}>{config.label}</h2>
            <p className="text-sm mt-1 opacity-80">Score de conformidade: {panel.score}/100</p>
          </div>
        </div>
      </div>

      {pgrAlert && pgrAlert.alert !== "ok" && (
        <div className={`card mb-6 ${pgrAlert.alert === "critical" ? "bg-red-50 border-red-200 border-2" : "bg-yellow-50 border-yellow-200 border-2"}`}>
          <p className="font-semibold">⚠️ {pgrAlert.message}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Checklist NR-1</h2>
      <div className="card">
        <ul className="divide-y divide-gray-200">
          {panel.checks.map((c: any) => (
            <li key={c.id} className="py-4 flex items-start gap-3">
              {c.status === "green" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : c.status === "yellow" ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{c.label}</p>
                <p className="text-xs text-gray-500">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        💡 Em caso de fiscalização, imprima este painel. Ele é seu relatório de compliance NR-1.
      </p>
    </DashboardLayout>
  );
}
