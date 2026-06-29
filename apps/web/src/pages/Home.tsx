import { Link } from "react-router-dom";
import { useUser, SignUpButton, UserButton } from "@clerk/clerk-react";
import {
  BarChart3,
  Building2,
  Check,
  ClipboardList,
  FileCheck,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Shield,
  Users,
  Zap,
} from "lucide-react";

const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NR1Check</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-gray-900">Funcionalidades</a>
            <a href="#contador" className="hover:text-gray-900">Para contadores</a>
            <a href="#planos" className="hover:text-gray-900">Planos</a>
            <Link to="/precos" className="hover:text-gray-900">Preços</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <UserButton afterSignOutUrl="/" />
                <Link to="/dashboard" className="btn-primary">Dashboard</Link>
                <Link to="/trocar-conta" className="hidden sm:inline-flex btn-secondary text-sm">
                  <LogOut className="h-4 w-4" />
                  Trocar conta
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">Entrar</Link>
                <Link to="/cadastro" className="btn-primary">Começar</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Zap className="h-3 w-3" /> NR-1 · Riscos psicossociais · PME · Contadores
            </span>

            <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
              NR-1 psicossocial simples para <span className="text-brand-600">empresas e contadores</span>.
            </h1>

            <p className="mt-6 text-lg text-gray-600">
              Cadastre a empresa, importe trabalhadores, envie a avaliação, gere plano de ação e organize documentos assináveis sem juridiquês.
            </p>

            {isSignedIn ? (
              <div className="mt-6 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">
                  Sessão ativa: {user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Para usar outra conta, clique em “Trocar conta”.
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {isSignedIn ? (
                <>
                  <Link to="/dashboard" className="btn-primary text-base px-6 py-3">
                    Ir para dashboard →
                  </Link>
                  <Link to="/clientes" className="btn-secondary text-base px-6 py-3">
                    Área do contador
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/cadastro" className="btn-primary text-base px-6 py-3">
                    Começar como empresa →
                  </Link>
                  <Link to="/cadastro" onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")} className="btn-secondary text-base px-6 py-3">
                    Sou contador/consultor
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Não faz diagnóstico médico individual. O foco é gestão organizacional, evidências e plano de ação.
            </p>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              O fluxo que uma pequena empresa consegue seguir
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Da escuta dos trabalhadores ao inventário, plano de ação, evidências e acompanhamento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card hover:shadow-md transition">
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contador" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                Para contadores e consultores
              </span>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Atenda vários clientes em um painel multiempresas.
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                O contador já tem cadastro, folha e relação com o cliente. O NR1Check vira um serviço recorrente para organizar a parte psicossocial da NR-1 por empresa.
              </p>

              <div className="mt-6 grid gap-3">
                {ACCOUNTANT_FEATURES.map((item) => (
                  <div key={item} className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 text-brand-600" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/cadastro" onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")} className="btn-primary">
                  Criar conta de contador →
                </Link>
                <Link to="/precos" className="btn-secondary">
                  Ver planos
                </Link>
              </div>
            </div>

            <div className="card border-brand-200 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Modelo comercial sugerido</h3>
              <p className="mt-2 text-sm text-gray-500">
                Para contador, o valor acompanha a carteira de clientes.
              </p>

              <div className="mt-6 space-y-3">
                <PriceLine title="Até 10 empresas" price="R$ 199/mês" helper="ideal para começar" />
                <PriceLine title="Empresa adicional" price="R$ 29/mês" helper="por empresa ativa" />
                <PriceLine title="Carteira grande" price="Sob consulta" helper="acima de 30 empresas" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Planos claros</h2>
            <p className="mt-4 text-lg text-gray-600">
              Para empresa pequena, PME e contador que atende clientes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`card ${plan.highlighted ? "border-brand-500 ring-2 ring-brand-500" : ""}`}>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.helper}</p>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">/{plan.period}</span>}
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 shrink-0 text-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={plan.to} className={`mt-6 w-full justify-center ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6">
          <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center p-12 border-0">
            <h2 className="text-3xl font-bold">
              Comece pela empresa. Depois o app mostra o próximo passo.
            </h2>
            <p className="mt-3 text-brand-100 text-lg">
              Cadastrar trabalhadores, enviar avaliação, gerar achados, montar plano e salvar documentos.
            </p>

            <div className="mt-6">
              {isSignedIn ? (
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50">
                  Ir para dashboard →
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50">
                    Começar
                  </button>
                </SignUpButton>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            O NR1Check não substitui profissional legalmente habilitado, médico, psicólogo, engenheiro de segurança ou consultoria jurídica.
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-10">
        <div className="mx-auto max-w-7xl px-6 text-sm text-gray-500 flex flex-col md:flex-row justify-between gap-4">
          <p>© 2026 NR1Check · Alternative Ventures</p>
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              aria-label="Enviar e-mail"
              title="Enviar e-mail"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/${CONTACT_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Falar no WhatsApp"
              title="Falar no WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PriceLine({ title, price, helper }: { title: string; price: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{helper}</p>
        </div>
        <p className="font-bold text-brand-700">{price}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "Avaliação psicossocial",
    description: "Colete sinais organizacionais por setor, sem expor diagnóstico individual dos trabalhadores.",
  },
  {
    icon: ClipboardList,
    title: "Inventário psicossocial",
    description: "Mapeie sobrecarga, metas, assédio, liderança, conflitos, jornada, autonomia e comunicação.",
  },
  {
    icon: Check,
    title: "Plano de ação",
    description: "Defina responsáveis, prazos, medidas preventivas, monitoramento e evidências por fator de risco.",
  },
  {
    icon: MessageSquare,
    title: "Canal de relatos",
    description: "Registre situações sensíveis, conflitos, assédio, pressão excessiva e ocorrências relacionadas ao trabalho.",
  },
  {
    icon: FileCheck,
    title: "Documentos assináveis",
    description: "Gere ata, termo de ciência, cartilha, lista de presença e dossiê de evidências.",
  },
  {
    icon: Lock,
    title: "Painel de gestão",
    description: "Acompanhe pendências, riscos críticos, ações atrasadas e histórico de revisão.",
  },
];

const ACCOUNTANT_FEATURES = [
  "Cadastrar e selecionar empresas clientes.",
  "Importar trabalhadores por CSV exportado do Excel.",
  "Acompanhar status da NR-1 por cliente.",
  "Gerar documentos e evidências por empresa.",
  "Modelo de cobrança por empresa ativa.",
];

const PLANS = [
  {
    name: "Empresa Solo",
    helper: "até 20 trabalhadores",
    price: "R$ 79",
    period: "mês",
    to: "/cadastro",
    cta: "Começar",
    items: ["1 empresa", "avaliação psicossocial", "plano de ação", "documentos básicos"],
  },
  {
    name: "PME Pro",
    helper: "até 50 trabalhadores",
    price: "R$ 139",
    period: "mês",
    to: "/cadastro",
    cta: "Assinar Pro",
    highlighted: true,
    items: ["1 empresa", "mais trabalhadores", "documentos assináveis", "painel de defesa"],
  },
  {
    name: "Contador",
    helper: "multiempresas",
    price: "R$ 199",
    period: "mês",
    to: "/cadastro",
    cta: "Criar conta contador",
    items: ["até 10 empresas", "R$ 29 por empresa adicional", "importação CSV", "dashboard por cliente"],
  },
];
