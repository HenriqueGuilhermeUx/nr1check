import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"cpf" | "token">("cpf");
  const [cpf, setCpf] = useState("");
  const [token, setToken] = useState("");
  const [manualCompanyId, setManualCompanyId] = useState("");

  const urlCompanyId = useMemo(() => {
    const url = new URL(window.location.href);
    const raw = Number(url.searchParams.get("companyId"));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }, []);

  const resolvedCompanyId = urlCompanyId ?? Number(manualCompanyId || 0) || null;

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

  function ensureCompanyId() {
    if (!resolvedCompanyId) {
      toast.error("Abra pelo link enviado pela empresa ou informe o código da empresa.");
      return null;
    }

    return resolvedCompanyId;
  }

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

        {!urlCompanyId ? (
          <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Link da empresa não identificado</p>
                <p className="mt-1 text-xs text-yellow-800">
                  O ideal é abrir pelo link enviado pelo patrão/RH. Se recebeu um código da empresa, informe abaixo.
                </p>
              </div>
            </div>
            <input
              className="input mt-3"
              placeholder="Código da empresa"
              value={manualCompanyId}
              onChange={(e) => setManualCompanyId(onlyDigits(e.target.value))}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-semibold text-green-900">Empresa identificada</p>
            <p className="mt-1 text-xs text-green-700">Código da empresa: {urlCompanyId}</p>
          </div>
        )}

        {step === "cpf" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const companyId = ensureCompanyId();
              if (!companyId) return;
              request.mutate({ cpf: onlyDigits(cpf), companyId });
            }}
            className="mt-6 space-y-3"
          >
            <input
              className="input"
              placeholder="CPF (apenas números)"
              required
              value={cpf}
              onChange={(e) => setCpf(onlyDigits(e.target.value))}
            />
            <button type="submit" disabled={request.isPending} className="btn-primary w-full">
              {request.isPending ? "Enviando..." : "Enviar código"} <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const companyId = ensureCompanyId();
              if (!companyId) return;
              verify.mutate({ cpf: onlyDigits(cpf), token, companyId });
            }}
            className="mt-6 space-y-3"
          >
            <input
              className="input text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
              value={token}
              onChange={(e) => setToken(onlyDigits(e.target.value))}
            />
            <button type="submit" disabled={verify.isPending} className="btn-primary w-full">
              {verify.isPending ? "Verificando..." : "Entrar"}
            </button>
            <button type="button" onClick={() => setStep("cpf")} className="text-sm text-gray-500 hover:text-gray-700 w-full">
              ← Voltar
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-gray-500">
          Apenas trabalhadores cadastrados pela empresa conseguem acessar.
        </p>

        <Link to="/app" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
          Abrir app NR1Check
        </Link>
      </div>
    </div>
  );
}
