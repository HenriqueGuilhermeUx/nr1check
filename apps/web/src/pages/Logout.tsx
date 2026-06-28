import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { LogOut, Shield } from "lucide-react";

export default function Logout() {
  const { signOut } = useClerk();
  const location = useLocation();
  const [failed, setFailed] = useState(false);

  const redirectUrl = useMemo(() => {
    if (location.pathname.includes("trocar-conta")) return "/login";
    return "/";
  }, [location.pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFailed(true);
    }, 5000);

    void signOut({ redirectUrl }).finally(() => {
      window.clearTimeout(timer);
    });

    return () => window.clearTimeout(timer);
  }, [signOut, redirectUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
          <Shield className="h-6 w-6 text-white" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Saindo da conta...
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Aguarde enquanto limpamos sua sessão.
        </p>

        {failed ? (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left">
            <p className="text-sm font-semibold text-yellow-900">Se não saiu automaticamente:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-yellow-800">
              <li>Atualize a página.</li>
              <li>Abra em aba anônima.</li>
              <li>Ou limpe cookies do site nr1check.netlify.app.</li>
            </ol>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <Link to="/login" className="btn-primary">
            <LogOut className="h-4 w-4" />
            Ir para login
          </Link>
          <Link to="/" className="btn-secondary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
