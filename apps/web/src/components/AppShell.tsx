import type { ComponentType, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  helper?: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Cockpit", helper: "o que falta fazer", icon: Activity },
  { to: "/obrigacoes-nr1", label: "Obrigações", helper: "mapa NR-1", icon: ClipboardList },
  { to: "/funcionarios", label: "Trabalhadores", helper: "base da avaliação", icon: Users },
  { to: "/avaliacao-psicossocial", label: "Avaliação", helper: "links e respostas", icon: BarChart3 },
  { to: "/achados-psicossociais", label: "Achados", helper: "análise agregada", icon: Sparkles },
  { to: "/inventario-riscos", label: "Inventário + Plano", helper: "riscos e ações", icon: ClipboardCheck },
  { to: "/documentos-assinaturas", label: "Documentos", helper: "PDFs e assinaturas", icon: FileCheck },
  { to: "/denuncias", label: "Relatos", helper: "canal e protocolos", icon: MessageSquare },
  { to: "/painel-defesa", label: "Defesa", helper: "evidências", icon: Shield },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col print:hidden">
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="block text-lg font-bold leading-tight">NR1Check</span>
              <span className="block text-xs text-gray-500">Gestão psicossocial para PME</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 border border-brand-100"
                    : "text-gray-700 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{item.label}</p>
                  {item.helper && <p className="truncate text-xs text-gray-500">{item.helper}</p>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{user?.firstName ?? "Gestor"}</p>
                <p className="text-gray-500 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-5 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow && (
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm lg:text-base text-gray-600">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 print:hidden">{action}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "gray" | "green" | "yellow" | "orange" | "red" | "brand";
}) {
  const toneClass = {
    gray: "text-gray-900",
    green: "text-green-700",
    yellow: "text-yellow-700",
    orange: "text-orange-700",
    red: "text-red-700",
    brand: "text-brand-700",
  }[tone];

  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "yellow" | "orange" | "red" | "brand";
}) {
  const cls = {
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    brand: "border-brand-200 bg-brand-50 text-brand-700",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function EmptyPanel({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card text-center py-12">
      {icon && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">{icon}</div>}
      <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
