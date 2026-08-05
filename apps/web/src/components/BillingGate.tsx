import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, CheckCircle2, Clock, Lock, QrCode, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type BillingMode = "company" | "accountant" | "either";

type CompanySummary = {
  id: number;
  name: string;
  stripeStatus?: string | null;
  createdAt?: string | Date | null;
};

type BillingCompanySummary = {
  id: number;
  isActive: boolean;
  isTrialActive?: boolean;
  trialDaysLeft?: number;
  billingStatus?: string | null;
  stripeStatus?: string | null;
};

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";
const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function getTrialInfo(createdAt?: string | Date | null) {
  if (!createdAt) return { isTrialActive: false, trialDaysLeft: 0 };

  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return { isTrialActive: false, trialDaysLeft: 0 };

  const trialEndsAt = created + TRIAL_DAYS * DAY_MS;
  const remainingMs = trialEndsAt - Date.now();
  const trialDaysLeft = Math.max(0, Math.ceil(remainingMs / DAY_MS));

  return {
    isTrialActive: remainingMs > 0,
    trialDaysLeft,
  };
}

function isAuthSyncError(message?: string | null) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("login") ||
    normalized.includes("unauthorized") ||
    normalized.includes("não autorizado") ||
    normalized.includes("nao autorizado") ||
    normalized.includes("sessão") ||
    normalized.includes("sessao")
  );
}

function getCurrentPath() {
  if (typeof window === "undefined") return "/app";
  return `${window.location.pathname}${window.location.search}` || "/app";
}

export function BillingGate({
  children,
  mode = "either",
}: {
  children: ReactNode;
  mode?: BillingMode;
}) {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [slowLoading, setSlowLoading] = useState(false);

  const {
    data: companies,
    isLoading: loadingCompanies,
    refetch: refetchCompanies,
    error: companiesError,
  } = trpc.company.my.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const {
    data: billing,
    isLoading: loadingBilling,
    refetch: refetchBilling,
    error: billingError,
  } = trpc.woovi.billingStatus.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const companyList = (companies ?? []) as CompanySummary[];
  const billingCompanies = (billing?.companies ?? []) as BillingCompanySummary[];

  const createPixCharge = trpc.woovi.createPixCharge.useMutation({
    onSuccess: (data) => {
      navigate(`/pagamento/pix/${data.paymentId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_COMPANY_KEY);
    if (stored) setSelectedCompanyId(Number(stored));
  }, []);

  useEffect(() => {
    if (!loadingCompanies && !loadingBilling) {
      setSlowLoading(false);
      return;
    }

    const timer = window.setTimeout(() => setSlowLoading(true), 7000);
    return () => window.clearTimeout(timer);
  }, [loadingCompanies, loadingBilling]);

  const selectedCompany = useMemo(() => {
    if (!companyList.length) return undefined;

    if (selectedCompanyId) {
      return companyList.find((company: CompanySummary) => company.id === selectedCompanyId) ?? companyList[0];
    }

    return companyList[0];
  }, [companyList, selectedCompanyId]);

  const selectedCompanyBilling = billingCompanies.find((company: BillingCompanySummary) => company.id === selectedCompany?.id);
  const trialInfo = getTrialInfo(selectedCompany?.createdAt);

  const companyActive = Boolean(
    selectedCompany?.stripeStatus === "active" ||
      selectedCompanyBilling?.isActive ||
      selectedCompanyBilling?.isTrialActive ||
      trialInfo.isTrialActive,
  );

  const accountantActive = Boolean(billing?.accountant.isActive);

  const allowed =
    mode === "company"
      ? companyActive
      : mode === "accountant"
        ? accountantActive
        : companyActive || accountantActive;

  if (allowed) return <>{children}</>;

  if (loadingCompanies) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl card">
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-5 w-5 animate-spin text-brand-600" />
            <div>
              <h1 className="font-bold text-gray-900">Carregando sua empresa...</h1>
              <p className="text-sm text-gray-500">Estamos preparando seu acesso.</p>
            </div>
          </div>

          {slowLoading ? (
            <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-900">Está demorando mais que o normal.</p>
              <p className="mt-1 text-sm text-yellow-800">Tente novamente em alguns segundos. Se estiver no Render gratuito, a API pode estar acordando.</p>
              <button type="button" onClick={() => refetchCompanies()} className="btn-secondary mt-4">
                Tentar novamente
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (companiesError) {
    const authProblem = isAuthSyncError(companiesError.message);
    const loginUrl = `/login?redirect=${encodeURIComponent(getCurrentPath())}`;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className={`mx-auto max-w-3xl card ${authProblem ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 ${authProblem ? "text-yellow-700" : "text-red-700"}`} />
            <div>
              <h1 className={`font-bold ${authProblem ? "text-yellow-900" : "text-red-900"}`}>
                {authProblem ? "Sessão não sincronizada" : "Não foi possível carregar sua empresa"}
              </h1>
              <p className={`mt-1 text-sm ${authProblem ? "text-yellow-800" : "text-red-800"}`}>
                {authProblem
                  ? "Sua conta entrou no app, mas a API ainda não recebeu a autorização. Volte ao app ou entre novamente para sincronizar."
                  : companiesError.message}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/app" className="btn-primary">
                  Voltar ao app
                </Link>
                <Link to={loginUrl} className="btn-secondary">
                  Entrar novamente
                </Link>
                <button type="button" onClick={() => refetchCompanies()} className="btn-secondary">
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const needsCompany = mode !== "accountant" && !selectedCompany;

  function payCompany(planId: "nr1_solo" | "nr1_pro") {
    if (!selectedCompany) {
      toast.error("Cadastre uma empresa primeiro.");
      navigate("/comecar");
      return;
    }

    createPixCharge.mutate({
      planId,
      companyId: selectedCompany.id,
    });
  }

  function payAccountant() {
    window.localStorage.setItem("nr1check:user-mode", "contador");
    createPixCharge.mutate({ planId: "contador" });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          ← Voltar para o app
        </Link>

        <div className="mt-6 card overflow-hidden border-brand-200">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Lock className="h-6 w-6" />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-gray-900">Comece com 7 dias grátis</h1>
              <p className="mt-2 text-gray-600">
                Patrões, RH e gestores podem testar o NR1Check por 7 dias. Depois do período de teste, escolha um plano para continuar usando os módulos da empresa.
              </p>

              {selectedCompany ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.name}</p>
                      <p className="text-xs text-gray-500">
                        Status: {selectedCompanyBilling?.billingStatus ?? selectedCompanyBilling?.stripeStatus ?? selectedCompany?.stripeStatus ?? "sem plano ativo"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {billingError ? (
                <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-900">Não conseguimos confirmar a assinatura agora.</p>
                  <p className="mt-1 text-sm text-yellow-800">Você ainda pode iniciar o teste criando uma empresa. Depois verificaremos o plano novamente.</p>
                  <button type="button" onClick={() => refetchBilling()} className="btn-secondary mt-4">
                    Verificar novamente
                  </button>
                </div>
              ) : null}

              {needsCompany ? (
                <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-5 w-5 text-brand-700" />
                    <div>
                      <h2 className="font-bold text-brand-900">Ative seu teste grátis</h2>
                      <p className="mt-1 text-sm text-brand-800">Cadastre a empresa para liberar 7 dias de uso como patrão/RH.</p>
                      <Link to="/comecar" className="btn-primary mt-4">Cadastrar empresa →</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {mode !== "accountant" ? (
                    <>
                      <button type="button" onClick={() => payCompany("nr1_solo")} disabled={createPixCharge.isPending} className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-brand-300 hover:shadow-sm">
                        <p className="text-sm font-bold text-gray-900">Empresa Solo</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900">R$ 79</p>
                        <p className="mt-1 text-xs text-gray-500">até 20 trabalhadores</p>
                      </button>

                      <button type="button" onClick={() => payCompany("nr1_pro")} disabled={createPixCharge.isPending} className="rounded-2xl border border-brand-500 bg-brand-50 p-4 text-left ring-2 ring-brand-500 hover:shadow-sm">
                        <p className="text-sm font-bold text-brand-900">PME Pro</p>
                        <p className="mt-1 text-2xl font-extrabold text-brand-900">R$ 139</p>
                        <p className="mt-1 text-xs text-brand-700">até 50 trabalhadores</p>
                      </button>
                    </>
                  ) : null}

                  {mode !== "company" ? (
                    <button type="button" onClick={payAccountant} disabled={createPixCharge.isPending} className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-brand-300 hover:shadow-sm">
                      <p className="text-sm font-bold text-gray-900">Contador</p>
                      <p className="mt-1 text-2xl font-extrabold text-gray-900">R$ 199</p>
                      <p className="mt-1 text-xs text-gray-500">até 10 empresas</p>
                    </button>
                  ) : null}
                </div>
              )}

              {createPixCharge.isPending ? <p className="mt-4 text-sm text-gray-500">Gerando cobrança...</p> : null}
            </div>

            <div className="bg-gray-900 p-6 text-white lg:p-8">
              <QrCode className="h-8 w-8 text-brand-200" />
              <h2 className="mt-4 text-xl font-bold">Teste grátis + plano mensal</h2>
              <p className="mt-2 text-sm text-gray-300">
                Use o produto por 7 dias, valide com sua equipe e depois mantenha o acesso pelo plano mensal.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "7 dias grátis para patrão/RH",
                  "Funcionários acessam por CPF e código",
                  "Dashboard, equipe, avaliação e documentos",
                  "Plano mensal após o período de teste",
                ].map((item: string) => (
                  <div key={item} className="flex gap-2 text-sm text-gray-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-300" />
                    {item}
                  </div>
                ))}
              </div>

              <Link to="/precos" className="mt-8 inline-flex text-sm font-semibold text-brand-200 hover:text-white">
                Ver planos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
