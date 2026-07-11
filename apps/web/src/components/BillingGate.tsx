import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, CheckCircle2, Lock, QrCode, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

type BillingMode = "company" | "accountant" | "either";

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

export function BillingGate({
  children,
  mode = "either",
}: {
  children: ReactNode;
  mode?: BillingMode;
}) {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

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

  const selectedCompany = useMemo(() => {
    if (!companies?.length) return undefined;

    if (selectedCompanyId) {
      return companies.find((company) => company.id === selectedCompanyId) ?? companies[0];
    }

    return companies[0];
  }, [companies, selectedCompanyId]);

  const selectedCompanyBilling = billing?.companies.find((company) => company.id === selectedCompany?.id);

  const companyActive = Boolean(selectedCompanyBilling?.isActive || selectedCompany?.stripeStatus === "active");
  const accountantActive = Boolean(billing?.accountant.isActive);

  const allowed =
    mode === "company"
      ? companyActive
      : mode === "accountant"
        ? accountantActive
        : companyActive || accountantActive;

  if (loadingCompanies || loadingBilling) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl card">
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-5 w-5 animate-spin text-brand-600" />
            <div>
              <h1 className="font-bold text-gray-900">Verificando assinatura...</h1>
              <p className="text-sm text-gray-500">Conferindo status do pagamento Woovi/Pix.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (companiesError || billingError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl card border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
            <div>
              <h1 className="font-bold text-red-900">Não foi possível verificar assinatura</h1>
              <p className="mt-1 text-sm text-red-800">{companiesError?.message ?? billingError?.message}</p>
              <button
                type="button"
                onClick={() => {
                  refetchCompanies();
                  refetchBilling();
                }}
                className="btn-secondary mt-4"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (allowed) return <>{children}</>;

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
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          ← Voltar para início
        </Link>

        <div className="mt-6 card overflow-hidden border-brand-200">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Lock className="h-6 w-6" />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-gray-900">Plano necessário para continuar</h1>
              <p className="mt-2 text-gray-600">
                Esta área faz parte do produto pago. Escolha um plano, pague com Pix via Woovi e o acesso será liberado automaticamente.
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

              {needsCompany ? (
                <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <h2 className="font-bold text-yellow-900">Cadastre uma empresa primeiro</h2>
                  <p className="mt-1 text-sm text-yellow-800">Para assinar plano de empresa, você precisa ter uma empresa cadastrada.</p>
                  <Link to="/comecar" className="btn-primary mt-4">Cadastrar empresa →</Link>
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

              {createPixCharge.isPending ? <p className="mt-4 text-sm text-gray-500">Gerando Pix Woovi...</p> : null}
            </div>

            <div className="bg-gray-900 p-6 text-white lg:p-8">
              <QrCode className="h-8 w-8 text-brand-200" />
              <h2 className="mt-4 text-xl font-bold">Liberação automática por Pix</h2>
              <p className="mt-2 text-sm text-gray-300">
                Depois do pagamento, a Woovi envia o webhook e o sistema ativa o acesso automaticamente.
              </p>

              <div className="mt-6 space-y-3">
                {["Gera QR Code Pix", "Confirma pagamento via webhook", "Ativa billing_status = active", "Libera módulos do produto"].map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-gray-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-300" />
                    {item}
                  </div>
                ))}
              </div>

              <Link to="/precos" className="mt-8 inline-flex text-sm font-semibold text-brand-200 hover:text-white">
                Ver todos os planos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
