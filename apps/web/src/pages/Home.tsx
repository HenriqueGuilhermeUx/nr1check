import { Link } from "react-router-dom";
import { useUser, SignUpButton, UserButton } from "@clerk/clerk-react";
import {
  ArrowRight,
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
  Store,
  Users,
  Zap,
} from "lucide-react";

const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="block text-xl font-bold leading-tight text-gray-900">NR1Check</span>
              <span className="hidden text-[11px] text-gray-500 sm:block">Grupo Alternative Ventures</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#produtos" className="hover:text-gray-900">Produtos</a>
            <a href="#contador" className="hover:text-gray-900">Contadores</a>
            <a href="#planos" className="hover:text-gray-900">Valores</a>
            <a href="#funcionalidades" className="hover:text-gray-900">Funcionalidades</a>
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

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_460px] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                <Zap className="h-3 w-3" />
                NR-1 psicossocial para empresas, contadores e consultores
              </span>

              <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
                Organize a <span className="text-brand-600">NR-1 psicossocial</span> sem complicar a rotina da empresa.
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-gray-600">
                Cadastre a empresa, importe trabalhadores, envie a avaliação, gere plano de ação e salve documentos assináveis em um fluxo simples.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroMiniCard title="Empresas" value="R$ 79/mês" helper="até 20 trabalhadores" />
                <HeroMiniCard title="PMEs" value="R$ 139/mês" helper="até 50 trabalhadores" />
                <HeroMiniCard title="Contadores" value="R$ 199/mês" helper="até 10 empresas" />
              </div>

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

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {isSignedIn ? (
                  <>
                    <Link to="/dashboard" className="btn-primary text-base px-6 py-3">
                      Ir para dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/clientes" className="btn-secondary text-base px-6 py-3">
                      Área do contador
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/cadastro" className="btn-primary text-base px-6 py-3">
                      Começar como empresa <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/cadastro"
                      onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
                      className="btn-secondary text-base px-6 py-3"
                    >
                      Sou contador/consultor
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Não faz diagnóstico médico individual. O foco é gestão organizacional, evidências, plano de ação e documentos.
              </p>
            </div>

            <div className="card border-brand-200 bg-white shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-brand-700">Produto principal</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">Cockpit NR-1</h2>
                </div>
                <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
                  <p className="text-xs text-gray-500">a partir de</p>
                  <p className="text-2xl font-extrabold text-brand-700">R$ 79/mês</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Passo a passo para dono de pequena empresa",
                  "Avaliação psicossocial por link ou QR Code",
                  "Achados agregados sem expor resposta individual",
                  "Inventário, plano de ação e documentos assináveis",
                  "Área multiempresas para contador/consultor",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-yellow-900">Para contadores</p>
                <p className="mt-1 text-sm text-yellow-800">
                  Transforme a organização da NR-1 psicossocial em serviço recorrente para sua carteira de clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produtos" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-3xl">
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Produtos definidos
            </span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Escolha o produto certo para cada tipo de cliente.
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              A proposta fica clara para o empresário e para o contador que quer vender isso como serviço.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <div key={product.name} className={`card ${product.highlighted ? "border-brand-500 ring-2 ring-brand-500" : ""}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <product.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">{product.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{product.description}</p>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="mt-1 text-3xl font-extrabold text-gray-900">{product.price}</p>
                  <p className="mt-1 text-xs text-gray-500">{product.helper}</p>
                </div>

                <ul className="mt-5 space-y-2">
                  {product.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 shrink-0 text-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={product.to}
                  onClick={() => {
                    if (product.mode) window.localStorage.setItem("nr1check:user-mode", product.mode);
                  }}
                  className={`mt-6 w-full justify-center ${product.highlighted ? "btn-primary" : "btn-secondary"}`}
                >
                  {product.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contador" className="py-20 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
                Área para contadores e consultores
              </span>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold">
                Cadastre vários clientes e acompanhe a NR-1 de cada empresa.
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                O contador já tem a folha, os dados dos funcionários e a confiança do empresário. O NR1Check transforma isso em uma nova receita recorrente.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {ACCOUNTANT_CARDS.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-100">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/cadastro"
                  onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Criar conta de contador <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/precos" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Ver valores
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-gray-900">
              <h3 className="text-2xl font-bold">Plano Contador</h3>
              <p className="mt-2 text-sm text-gray-500">
                Para escritórios que querem atender vários clientes.
              </p>

              <div className="mt-6 rounded-2xl bg-brand-50 p-5">
                <p className="text-sm font-semibold text-brand-700">Assinatura base</p>
                <p className="mt-1 text-4xl font-extrabold text-gray-900">R$ 199/mês</p>
                <p className="mt-1 text-sm text-gray-500">inclui até 10 empresas</p>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-700">Empresa adicional</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">R$ 29/mês</p>
                <p className="mt-1 text-sm text-gray-500">por empresa ativa</p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Dashboard multiempresas",
                  "Importação de funcionários por CSV",
                  "Status por cliente",
                  "Documentos por empresa",
                  "Modelo recorrente para escritório contábil",
                ].map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 shrink-0 text-brand-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Valores em destaque</h2>
            <p className="mt-4 text-lg text-gray-600">
              Planos simples, com proposta clara para cada público.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`card text-center ${plan.highlighted ? "border-brand-500 ring-2 ring-brand-500" : ""}`}>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.helper}</p>
                <p className="mt-6 text-4xl font-extrabold text-gray-900">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-500">{plan.period}</p>
                <Link
                  to={plan.to}
                  onClick={() => {
                    if (plan.mode) window.localStorage.setItem("nr1check:user-mode", plan.mode);
                  }}
                  className={`mt-6 w-full justify-center ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              O fluxo que a empresa consegue seguir
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

      <section className="py-20">
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
        <div className="mx-auto max-w-7xl px-6 text-sm text-gray-500 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-gray-700">NR1Check · Grupo Alternative Ventures</p>
            <p className="mt-1 text-xs">Alternative Ventures Ltda · CNPJ 61.922.930/0001-97</p>
          </div>

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

function HeroMiniCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-extrabold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

const PRODUCTS = [
  {
    icon: Store,
    name: "NR1Check Empresa Solo",
    description: "Para pequenos negócios que precisam organizar a NR-1 sem equipe de RH estruturada.",
    price: "R$ 79/mês",
    helper: "até 20 trabalhadores",
    to: "/cadastro",
    cta: "Começar como empresa",
    items: ["1 empresa", "passo a passo simples", "avaliação psicossocial", "plano e documentos"],
  },
  {
    icon: Building2,
    name: "NR1Check PME Pro",
    description: "Para empresas que querem mais controle, documentos e painel de evidências.",
    price: "R$ 139/mês",
    helper: "até 50 trabalhadores",
    to: "/cadastro",
    cta: "Assinar PME Pro",
    highlighted: true,
    items: ["1 empresa", "até 50 trabalhadores", "documentos assináveis", "painel de defesa"],
  },
  {
    icon: Users,
    name: "NR1Check Contador",
    description: "Para escritórios contábeis e consultores atenderem vários clientes com cobrança recorrente.",
    price: "R$ 199/mês",
    helper: "até 10 empresas + R$ 29 por adicional",
    to: "/cadastro",
    cta: "Começar como contador",
    mode: "contador",
    items: ["multiempresas", "importação CSV", "status por cliente", "receita recorrente"],
  },
];

const ACCOUNTANT_CARDS = [
  {
    icon: Building2,
    title: "Multiempresas",
    description: "Cadastre e selecione clientes sem misturar dados entre empresas.",
  },
  {
    icon: FileCheck,
    title: "Importação da folha",
    description: "Importe trabalhadores por CSV exportado do Excel ou sistema de folha.",
  },
  {
    icon: BarChart3,
    title: "Status por cliente",
    description: "Veja quais empresas ainda precisam de avaliação, plano ou documentos.",
  },
  {
    icon: ClipboardList,
    title: "Novo serviço recorrente",
    description: "Venda a organização da NR-1 psicossocial como serviço mensal.",
  },
];

const PRICING = [
  {
    name: "Empresa Solo",
    helper: "pequeno negócio",
    price: "R$ 79",
    period: "por mês",
    to: "/cadastro",
    cta: "Começar",
  },
  {
    name: "PME Pro",
    helper: "empresa em crescimento",
    price: "R$ 139",
    period: "por mês",
    to: "/cadastro",
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Contador",
    helper: "até 10 empresas",
    price: "R$ 199",
    period: "+ R$ 29 por empresa adicional",
    to: "/cadastro",
    cta: "Criar conta contador",
    mode: "contador",
  },
];

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
