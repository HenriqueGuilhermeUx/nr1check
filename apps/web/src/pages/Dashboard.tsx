import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

const ACTIONS = [
  {
    title: "Cadastrar funcionários",
    description: "Adicione trabalhadores para liberar avaliação, relatos e histórico da empresa.",
    to: "/funcionarios",
    icon: Users,
    tag: "Base do sistema",
  },
  {
    title: "Avaliação psicossocial",
    description: "Envie a pesquisa e acompanhe riscos psicossociais de forma agregada, sem diagnóstico individual.",
    to: "/painel-defesa",
    icon: ClipboardCheck,
    tag: "NR-1",
  },
  {
    title: "Inventário de riscos",
    description: "Organize riscos físicos, químicos, biológicos, ergonômicos, acidentes e psicossociais.",
    to: "/documentos",
    icon: ListChecks,
    tag: "GRO/PGR",
  },
  {
    title: "Plano de ação e PGR",
    description: "Gere documentos, registre medidas, responsáveis, prazos e evidências.",
    to: "/documentos",
    icon: FileText,
    tag: "Documentos",
  },
  {
    title: "Relatos e ocorrências",
    description: "Centralize relatos, denúncias, incidentes e situações que exigem acompanhamento.",
    to: "/denuncias",
    icon: MessageSquare,
    tag: "Evidências",
  },
  {
    title: "Painel de Defesa",
    description: "Veja o status geral de conformidade e os próximos pontos de atenção.",
    to: "/painel-defesa",
    icon: Shield,
    tag: "Gestão",
  },
];

export default function Dashboard() {
  const { user } = useUser();
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const company = companies?.[0];
  const companyId = company?.id;

  const { data: defense } = trpc.compliance.defensePanel.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="text-sm min-w-0">
            <p className="font-medium truncate">{user?.firstName || "Gestor"}</p>
            <p className="text-gray-500 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.firstName || "gestor"} 👋</h1>
            {company ? (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="h-4 w-4" />
                {company.name}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Configure sua empresa para começar o painel NR-1.</p>
            )}
          </div>

          {company && (
            <Link to="/painel-defesa" className="btn-primary w-full md:w-auto text-center">
              Ver status NR-1
            </Link>
          )}
        </div>

        {isLoading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !company ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <DefenseSummary defense={defense} />
            <QuickActions />
            <NextSteps />
          </div>
        )}
      </main>
    </div>
  );
}

function DefenseSummary({ defense }: { defense: any }) {
  if (!defense) {
    return (
      <div className="card border-2 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-7 w-7 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-700">Status em preparação</p>
            <h2 className="text-2xl font-bold text-yellow-800 mt-1">Complete os primeiros dados</h2>
            <p className="text-sm text-yellow-700 mt-1">
              Cadastre funcionários e documentos iniciais para calcular o status da empresa.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const status = defense.overallStatus as keyof typeof colorMap;

  return (
    <div className={`card border-2 ${colorMap[status] || colorMap.yellow}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">Status NR-1</p>
          <h2 className="text-3xl font-bold mt-1">{labelMap[status] || "Atenção"}</h2>
          <p className="text-sm mt-1 opacity-80">Score atual: {defense.score ?? 0}/100</p>
        </div>
        <Shield className="h-16 w-16 opacity-30" />
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Próximas ações</h2>
          <p className="text-sm text-gray-500">Escolha uma etapa para avançar na rotina NR-1.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="card hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {action.tag}
              </span>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">{action.title}</h3>
            <p className="mt-2 text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NextSteps() {
  const steps = [
    "Cadastrar ou revisar funcionários",
    "Registrar riscos por setor e função",
    "Enviar avaliação psicossocial",
    "Criar plano de ação com responsáveis e prazos",
    "Guardar evidências e ocorrências importantes",
  ];

  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-gray-900">Checklist rápido de implantação</h2>
      <p className="text-sm text-gray-500 mt-1">
        Use esta lista para deixar a empresa pronta para uma primeira revisão de conformidade.
      </p>

      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-3 text-sm text-gray-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-12">
      <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
      <h2 className="mt-4 text-xl font-semibold">Nenhuma empresa cadastrada</h2>
      <p className="text-gray-500 mt-2">Crie sua empresa para liberar o painel NR-1.</p>
      <Link to="/comecar" className="btn-primary mt-6">
        Configurar empresa →
      </Link>
    </div>
  );
}
