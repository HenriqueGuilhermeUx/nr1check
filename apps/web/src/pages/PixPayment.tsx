import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Loader2, RefreshCcw, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

export default function PixPayment() {
  const navigate = useNavigate();
  const params = useParams();
  const paymentId = Number(params.paymentId);

  const {
    data: payment,
    isLoading,
    refetch,
  } = trpc.woovi.paymentStatus.useQuery(
    { paymentId },
    {
      enabled: Number.isFinite(paymentId) && paymentId > 0,
      refetchInterval: (query) => {
        const data = query.state.data;
        return data?.isPaid ? false : 5000;
      },
    },
  );

  useEffect(() => {
    if (payment?.isPaid) {
      toast.success("Pagamento confirmado!");
    }
  }, [payment?.isPaid]);

  function copyPix() {
    if (!payment?.brCode) {
      toast.error("Pix copia e cola não disponível.");
      return;
    }

    navigator.clipboard.writeText(payment.brCode);
    toast.success("Pix copia e cola copiado!");
  }

  const nextRoute = payment?.scope === "accountant" ? "/clientes" : "/dashboard";

  if (!Number.isFinite(paymentId) || paymentId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">Pagamento inválido</h1>
          <Link to="/precos" className="btn-primary mt-6">Voltar aos planos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">NR1Check</span>
          </Link>
          <Link to="/precos" className="text-sm text-gray-600 hover:text-gray-900">
            ← Planos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {isLoading ? (
          <div className="card text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
            <p className="mt-3 text-gray-600">Carregando Pix...</p>
          </div>
        ) : !payment ? (
          <div className="card text-center">
            <h1 className="text-xl font-bold text-gray-900">Pagamento não encontrado</h1>
            <Link to="/precos" className="btn-primary mt-6">Voltar aos planos</Link>
          </div>
        ) : payment.isPaid ? (
          <div className="card mx-auto max-w-lg text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
            <p className="mt-2 text-gray-600">
              Seu plano foi ativado automaticamente.
            </p>
            <button onClick={() => navigate(nextRoute)} className="btn-primary mt-6 w-full">
              Continuar →
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <div className="card text-center">
              <h1 className="text-2xl font-bold text-gray-900">Pague com Pix</h1>
              <p className="mt-2 text-gray-600">
                Valor: <strong>{payment.amountFormatted}</strong>
              </p>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
                {payment.qrCodeImage ? (
                  <img
                    src={payment.qrCodeImage}
                    alt="QR Code Pix"
                    className="mx-auto h-72 w-72 rounded-xl object-contain"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                    QR Code não disponível. Use o Pix copia e cola.
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                <button onClick={copyPix} className="btn-primary w-full">
                  <Copy className="h-4 w-4" />
                  Copiar Pix
                </button>

                <button onClick={() => refetch()} className="btn-secondary w-full">
                  <RefreshCcw className="h-4 w-4" />
                  Verificar pagamento
                </button>

                {payment.paymentLinkUrl ? (
                  <a href={payment.paymentLinkUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">
                    Abrir página da Woovi
                  </a>
                ) : null}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Como funciona</h2>
              <div className="mt-5 space-y-4">
                <Step number="1" title="Escaneie o QR Code" description="Use o aplicativo do banco ou copie o Pix." />
                <Step number="2" title="Pague o Pix" description="A confirmação costuma chegar rapidamente pela Woovi." />
                <Step number="3" title="Liberação automática" description="Quando o webhook chegar, o sistema ativa o plano no banco." />
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-yellow-900">Aguardando pagamento</p>
                <p className="mt-1 text-sm text-yellow-800">
                  Esta página verifica automaticamente a cada poucos segundos. Você também pode clicar em “Verificar pagamento”.
                </p>
              </div>

              {payment.brCode ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-gray-900">Pix copia e cola</p>
                  <textarea readOnly value={payment.brCode} className="input h-32 text-xs" />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {number}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
