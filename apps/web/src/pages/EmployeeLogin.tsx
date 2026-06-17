import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"cpf" | "token">("cpf");
  const [cpf, setCpf] = useState("");
  const [token, setToken] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);

  const request = trpc.employee.requestToken.useMutation({
    onSuccess: (r) => {
      if (r.devToken) toast.success(`Token (dev): ${r.devToken}`, { duration: 30000 });
      else toast.success(r.message);
      setStep("token");
    },
    onError: (err) => toast.error(err.message),
  });

  const verify = trpc.employee.verifyToken.useMutation({
    onSuccess: (r) => {
      localStorage.setItem("employee_session", JSON.stringify(r));
      navigate("/portal");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-6">
      <div className="card max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-brand-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-center text-xl font-bold">Acesso do Funcionário</h1>
        <p className="text-center text-sm text-gray-500 mt-1">
          {step === "cpf" ? "Digite seu CPF para receber o código" : "Digite o código recebido no WhatsApp"}
        </p>

        {step === "cpf" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Buscar empresa pelo CPF — na prática o usuário informaria o ID da empresa também
              // Aqui simplificamos: assumimos que a empresa vem de um link direto
              const url = new URL(window.location.href);
              const cid = Number(url.searchParams.get("companyId")) || companyId || 1;
              request.mutate({ cpf, companyId: cid });
            }}
            className="mt-6 space-y-3"
          >
            <input className="input" placeholder="CPF (apenas números)" required value={cpf} onChange={(e) => setCpf(e.target.value)} />
            <button type="submit" disabled={request.isPending} className="btn-primary w-full">
              {request.isPending ? "Enviando..." : "Enviar código"} <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cid = Number(new URL(window.location.href).searchParams.get("companyId")) || 1;
              verify.mutate({ cpf, token, companyId: cid });
            }}
            className="mt-6 space-y-3"
          >
            <input className="input text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} required value={token} onChange={(e) => setToken(e.target.value)} />
            <button type="submit" disabled={verify.isPending} className="btn-primary w-full">
              {verify.isPending ? "Verificando..." : "Entrar"}
            </button>
            <button type="button" onClick={() => setStep("cpf")} className="text-sm text-gray-500 hover:text-gray-700 w-full">
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
