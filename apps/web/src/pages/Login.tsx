import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Login() {
  return (
    <>
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">NR1Check</span>
          </Link>

          <div className="mb-4 max-w-md text-center">
            <h1 className="text-xl font-bold text-gray-900">Entrar na sua conta</h1>
            <p className="mt-1 text-sm text-gray-500">
              Use o mesmo e-mail que você cadastrou. Se já estiver logado, vamos direto ao dashboard.
            </p>
          </div>

          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/cadastro"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </SignedOut>
    </>
  );
}
