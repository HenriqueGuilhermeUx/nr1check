import { Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Activity, Users, FileText, MessageSquare, Shield } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: Activity },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/denuncias", label: "Denúncias", icon: MessageSquare },
  { to: "/painel-defesa", label: "Painel de Defesa", icon: Shield },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          <span className="text-sm text-gray-500">Minha conta</span>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
