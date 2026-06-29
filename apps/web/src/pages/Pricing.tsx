import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Check, Mail, MessageCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

const PLANS = [
  {
    id: "nr1_solo",
    name: "Empresa Solo",
    price: "R$ 79",
    period: "mês",
    description: "Para empresas de até 20 trabalhadores",
    features: [
      "1 empresa cadastrada",
      "Avaliação psicossocial",
      "Inventário e plano de ação",
      "Documentos básicos",
      "Painel de pendências",
    ],
  },
  {
    id: "nr1_pro",
    name: "PME Pro",
    price: "R$ 139",
    period: "mês",
    description: "Para empresas de até 50 trabalhadores",
    features: [
      "Tudo do Solo",
      "Até 50 trabalhadores",
      "Documentos assináveis",
      "Canal de relatos",
      "Painel de defesa",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    id: "contador",
    name: "Contador/Consultor",
    price: "R$ 199",
    period: "mês",
    description: "Para atender até 10 empresas clientes",
    features: [
      "Dashboard multiempresas",
      "Cadastrar e selecionar clientes",
      "Importação de trabalhadores por CSV",
      "Status NR-1 por empresa",
      "R$ 29/mês por empresa adicional",
      "Acima de 30 empresas: sob consulta",
    ],
    accountant: true,
  },
];

export default function Pricing() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = async (planId: "nr1_solo" | "nr1_pro" | "contador") => {
    if (planId === "contador") {
      window.localStorage.setItem("nr1check:user-mode", "contador");
      navigate(isSignedIn ? "/clientes" : "/cadastro");
      return;
    }

    if (!isSignedIn) {
      navigate("/cadastro");
      return;
    }

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

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Planos simples</h1>
          <p className="mt-3 text-lg text-gray-600">
            Para empresa pequena, PME e contador que atende várias empresas.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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
                <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-gray-500">/{p.period}</span>
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
                onClick={() => handleSubscribe(p.id as "nr1_solo" | "nr1_pro" | "contador")}
                disabled={createCheckout.isPending}
                className={`mt-6 w-full ${p.highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {createCheckout.isPending ? "Redirecionando..." : p.accountant ? "Começar como contador" : "Assinar agora"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label="Enviar e-mail"
            title="Enviar e-mail"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-700"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/${CONTACT_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Falar no WhatsApp"
            title="Falar no WhatsApp"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-700"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
