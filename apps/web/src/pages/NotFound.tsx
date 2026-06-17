import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Shield className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 text-3xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">Página não encontrada.</p>
      <Link to="/" className="btn-primary mt-6">Voltar ao início</Link>
    </div>
  );
}
