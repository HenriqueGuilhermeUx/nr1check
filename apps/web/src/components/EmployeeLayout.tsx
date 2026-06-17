import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, ClipboardList, BookOpen, MessageSquare, FileText, LogOut } from "lucide-react";

type EmployeeSession = {
  employee: {
    id: number;
    name: string;
    role: string | null;
    companyId: number;
    companyName?: string;
  };
};

const NAV = [
  { to: "/portal", label: "Início", icon: Shield, exact: true },
  { to: "/portal/avaliacao", label: "Pesquisa COPSOQ", icon: ClipboardList },
  { to: "/portal/cursos", label: "Cursos", icon: BookOpen },
  { to: "/portal/denuncia", label: "Denúncia anônima", icon: MessageSquare },
  { to: "/portal/documentos", label: "Meus documentos", icon: FileText },
];

export function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<EmployeeSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("employee_session");
    if (!stored) {
      navigate("/acesso-funcionario");
      return;
    }
    setSession(JSON.parse(stored));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("employee_session");
    navigate("/acesso-funcionario");
  };

  if (!session) return null;
  const emp = session.employee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile + desktop header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{emp.companyName ?? "NR1Check"}</p>
              <p className="text-xs text-gray-500 leading-tight">Olá, {emp.name.split(" ")[0]} 👋</p>
            </div>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-gray-700 p-2" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <nav className="space-y-1 sticky top-20">
            {NAV.map((n) => {
              const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <Outlet context={session} />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40">
        {NAV.slice(0, 4).map((n) => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-0.5 p-2 text-[10px] font-medium ${
                active ? "text-brand-600" : "text-gray-500"
              }`}
            >
              <n.icon className="h-5 w-5" />
              {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
