import { SignUp, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";

export default function Signup() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">NR1Check</span>
      </Link>

      <SignedIn>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex justify-center">
            <UserButton afterSignOutUrl="/cadastro" />
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">Você já está logado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Conta atual: <strong>{user?.primaryEmailAddress?.emailAddress ?? "usuário logado"}</strong>
          </p>

          <div className="mt-6 grid gap-3">
            <Link to="/dashboard" className="btn-primary">
              Ir para dashboard
            </Link>
            <Link to="/comecar" className="btn-secondary">
              Configurar empresa
            </Link>
            <Link to="/trocar-conta" className="btn-secondary">
              <LogOut className="h-4 w-4" />
              Sair e criar/entrar com outra conta
            </Link>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="mb-4 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">Criar conta NR1Check</h1>
          <p className="mt-1 text-sm text-gray-500">
            Se já tem conta, use “Entrar”.
          </p>
        </div>

        <SignUp
          routing="path"
          path="/cadastro"
          signInUrl="/login"
          fallbackRedirectUrl="/comecar"
          forceRedirectUrl="/comecar"
        />
      </SignedOut>
    </div>
  );
}
