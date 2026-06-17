import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Check, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const PLANS = [
  {
    id: "nr1_solo",
    name: "NR1Check Solo",
    price: 79,
    description: "Para empresas de até 20 funcionários",
    features: [
      "PGR gerado com IA",
      "COPSOQ II-Br (40 questões)",
      "4 cursos de micro-learning",
      "Ordens de Serviço e EPI",
      "Canal de Denúncias anônimo",
      "Painel de Defesa",
      "Notificações por WhatsApp",
    ],
  },
  {
    id: "nr1_pro",
    name: "NR1Check Pro",
    price: 139,
    description: "Para empresas de até 50 funcionários",
    features: [
      "Tudo do Solo, mais:",
      "Limite de 50 funcionários",
      "Múltiplos gestores (RH + SST)",
      "Exportação XML eSocial S-2240",
      "Suporte prioritário",
      "Treinamento da equipe incluso",
    ],
    highlighted: true,
  },
];

export default function Pricing() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = async (planId: "nr1_solo" | "nr1_pro") => {
    if (!isSignedIn) {
      navigate("/cadastro");
      return;
    }
    // Pegar primeira empresa do usuário
    const companies = await utils.company.my.fetch();
    if (!companies.length) {
      toast.error("Cadastre sua empresa antes de assinar. Vamos te levar lá.");
      navigate("/comecar");
      return;
    }
    createCheckout.mutate({
      companyId: companies[0].id,
      planId,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">NR1Check</span>
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">← Voltar</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Planos simples, sem fidelidade</h1>
          <p className="mt-3 text-lg text-gray-600">Cancele quando quiser. Sem letras miúdas.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`card relative ${p.highlighted ? "border-brand-500 ring-2 ring-brand-500" : ""}`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">R${p.price}</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 text-brand-600 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(p.id as "nr1_solo" | "nr1_pro")}
                disabled={createCheckout.isPending}
                className={`mt-6 w-full ${p.highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {createCheckout.isPending ? "Redirecionando..." : "Assinar agora"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Precisa de mais de 50 funcionários? <a href="mailto:henriquecampos66@gmail.com" className="text-brand-600 hover:underline">Fale com a gente</a> para o plano corporativo.
        </p>
      </div>
    </div>
  );
}
