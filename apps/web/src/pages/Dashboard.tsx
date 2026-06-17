import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Building2, Users, FileText, MessageSquare, Shield, Activity } from "lucide-react";
import { trpc } from "../lib/trpc";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/denuncias", label: "Denúncias", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

export default function Dashboard() {
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;

  const { data: defense } = trpc.compliance.defensePanel.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">NR1Check</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="text-sm">
            <p className="font-medium">{user?.firstName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Olá, {user?.firstName} 👋</h1>
            {companies?.[0] && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="h-4 w-4" />
                {companies[0].name}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !companies?.length ? (
          <EmptyState />
        ) : (
          <DefenseSummary defense={defense} companyId={companyId} />
        )}
      </main>
    </div>
  );
}

function DefenseSummary({ defense, companyId }: { defense: any; companyId?: number }) {
  if (!defense) return null;
  const colorMap = {
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  const labelMap = {
    green: "Protegido",
    yellow: "Atenção",
    red: "Em risco",
  };

  return (
    <div>
      <div className={`card border-2 ${colorMap[defense.overallStatus as keyof typeof colorMap]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">Status de proteção</p>
            <h2 className="text-3xl font-bold mt-1">{labelMap[defense.overallStatus as keyof typeof labelMap]}</h2>
            <p className="text-sm mt-1 opacity-80">Score: {defense.score}/100</p>
          </div>
          <Shield className="h-16 w-16 opacity-30" />
        </div>
      </div>

      <h3 className="mt-8 mb-3 text-lg font-semibold">Checklist de conformidade</h3>
      <div className="card">
        <ul className="divide-y divide-gray-200">
          {defense.checks.map((c: any) => (
            <li key={c.id} className="py-3 flex items-start gap-3">
              <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                c.status === "green" ? "bg-green-500" : c.status === "yellow" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{c.label}</p>
                <p className="text-xs text-gray-500">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link to="/painel-defesa" className="btn-primary">Ver Painel de Defesa completo →</Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-12">
      <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
      <h2 className="mt-4 text-xl font-semibold">Nenhuma empresa cadastrada</h2>
      <p className="text-gray-500 mt-2">Comece pelo onboarding guiado.</p>
      <Link to="/comecar" className="btn-primary mt-6">Configurar empresa →</Link>
    </div>
  );
}
