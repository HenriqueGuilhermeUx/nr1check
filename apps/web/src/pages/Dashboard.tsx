import { Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/inventario-riscos", label: "Riscos psicossociais", icon: ClipboardList },
  { to: "/denuncias", label: "Relatos", icon: MessageSquare },
  { to: "/documentos", label: "Evidências / PGR", icon: FileText },
  { to: "/painel-defesa", label: "Painel de gestão", icon: Shield },
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                item.to === "/dashboard" ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">NR-1 · Riscos psicossociais</p>
            <h1 className="mt-1 text-2xl font-bold">Olá, {user?.firstName ?? "gestor"} 👋</h1>
            {companies?.[0] ? (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="h-4 w-4" />
                {companies[0].name}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Configure sua empresa para começar a gestão psicossocial.
              </p>
            )}
          </div>

          <Link to="/inventario-riscos" className="btn-primary">
            Mapear riscos psicossociais →
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !companies?.length ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <PsychosocialHero defense={defense} />
            <NextActions />
            <ComplianceFlow />
          </div>
        )}
      </main>
    </div>
  );
}

function PsychosocialHero({ defense }: { defense: any }) {
  const status = defense?.overallStatus ?? "yellow";
  const score = typeof defense?.score === "number" ? defense.score : null;

  const colorMap = {
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };

  const labelMap = {
    green: "Rotina em acompanhamento",
    yellow: "Atenção necessária",
    red: "Ações urgentes",
  };

  return (
    <section className={`card border-2 ${colorMap[status as keyof typeof colorMap] ?? colorMap.yellow}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">Status psicossocial NR-1</p>
          <h2 className="mt-1 text-3xl font-bold">{labelMap[status as keyof typeof labelMap] ?? labelMap.yellow}</h2>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            O objetivo é demonstrar gestão ativa: ouvir trabalhadores, identificar fatores psicossociais, criar ações,
            acompanhar prazos e guardar evidências para o GRO/PGR.
          </p>
          {score !== null && <p className="mt-2 text-sm font-medium">Score atual: {score}/100</p>}
        </div>

        <Shield className="h-16 w-16 opacity-30" />
      </div>
    </section>
  );
}

function NextActions() {
  const cards = [
    {
      title: "1. Mapear fatores psicossociais",
      description: "Cadastre riscos como sobrecarga, metas excessivas, assédio, conflitos, baixa autonomia e falhas de liderança.",
      to: "/inventario-riscos",
      icon: ClipboardList,
      cta: "Abrir inventário",
    },
    {
      title: "2. Registrar relatos e sinais",
      description: "Centralize ocorrências, relatos sensíveis e situações que indiquem necessidade de ação preventiva.",
      to: "/denuncias",
      icon: MessageSquare,
      cta: "Ver relatos",
    },
    {
      title: "3. Organizar evidências",
      description: "Guarde documentos, atas, comunicações, treinamentos, registros de ação e revisões para apoiar o PGR.",
      to: "/documentos",
      icon: FileText,
      cta: "Ver evidências",
    },
  ];

  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Próximas ações</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} to={card.to} className="card hover:shadow-md transition">
            <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <card.icon className="h-5 w-5" />
            </div>
            <h4 className="mt-4 font-semibold text-gray-900">{card.title}</h4>
            <p className="mt-2 text-sm text-gray-500">{card.description}</p>
            <p className="mt-4 text-sm font-semibold text-brand-700">{card.cta} →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ComplianceFlow() {
  const items = [
    {
      icon: Users,
      title: "Trabalhadores e setores",
      detail: "Base para entender quem está exposto aos fatores psicossociais.",
    },
    {
      icon: BarChart3,
      title: "Avaliação / escuta",
      detail: "Coleta sinais organizacionais sem diagnóstico médico individual.",
    },
    {
      icon: AlertTriangle,
      title: "Riscos psicossociais",
      detail: "Classificação por probabilidade, severidade e prioridade.",
    },
    {
      icon: Activity,
      title: "Plano de ação",
      detail: "Responsável, prazo, medida, monitoramento e evidência.",
    },
  ];

  return (
    <section className="card">
      <h3 className="text-lg font-semibold text-gray-900">Fluxo do NR1Check</h3>
      <p className="mt-1 text-sm text-gray-500">
        A plataforma é focada no ciclo psicossocial da NR-1. Outros riscos de SST podem existir na empresa,
        mas não são o escopo principal do NR1Check.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4">
            <item.icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-semibold text-gray-900">{item.title}</p>
            <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-12">
      <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
      <h2 className="mt-4 text-xl font-semibold">Nenhuma empresa cadastrada</h2>
      <p className="text-gray-500 mt-2">
        Cadastre sua empresa para iniciar a gestão dos riscos psicossociais da NR-1.
      </p>
      <Link to="/comecar" className="btn-primary mt-6">
        Configurar empresa →
      </Link>
    </div>
  );
}
