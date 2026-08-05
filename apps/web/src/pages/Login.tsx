import { SignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";

function getRedirectUrl() {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (!redirect || !redirect.startsWith("/")) return "/dashboard";
  return redirect;
}

export default function Login() {
  const { user } = useUser();
  const redirectUrl = getRedirectUrl();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Link to="/app" className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">NR1Check</span>
      </Link>

      <SignedIn>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex justify-center">
            <UserButton afterSignOutUrl="/app" />
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">Você já está logado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Conta atual: <strong>{user?.primaryEmailAddress?.emailAddress ?? "usuário logado"}</strong>
          </p>

          <div className="mt-6 grid gap-3">
            <Link to={redirectUrl} className="btn-primary">
              Continuar
            </Link>
            <Link to="/app" className="btn-secondary">
              Abrir app
            </Link>
            <Link to="/trocar-conta" className="btn-secondary">
              <LogOut className="h-4 w-4" />
              Sair e entrar com outra conta
            </Link>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="mb-4 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Use o e-mail cadastrado para acessar a empresa.
          </p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/cadastro"
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
        />
      </SignedOut>
    </div>
  );
}
