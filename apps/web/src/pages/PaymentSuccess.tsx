import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Shield } from "lucide-react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const confirm = trpc.stripe.createCheckout.useMutation(); // fallback
  const utils = trpc.useUtils();

  useEffect(() => {
    if (sessionId) {
      // Webhook do Stripe normalmente cuida disso. Aqui só atualizamos a UI.
      utils.company.my.invalidate();
      toast.success("Pagamento confirmado! Bem-vindo ao NR1Check.");
    }
  }, [sessionId, utils]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="card max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
        <p className="mt-2 text-gray-600">Sua assinatura está ativa. Vamos configurar sua empresa.</p>
        <Link to="/comecar" className="btn-primary mt-6 w-full">
          Configurar minha empresa →
        </Link>
        <Link to="/dashboard" className="mt-3 text-sm text-gray-500 hover:text-gray-700 block">
          Ir para o dashboard
        </Link>
      </div>
    </div>
  );
}
