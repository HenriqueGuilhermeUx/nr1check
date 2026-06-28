import { Link } from "react-router-dom";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import {
  BarChart3,
  Check,
  ClipboardList,
  FileCheck,
  Lock,
  LogOut,
  MessageSquare,
  Shield,
  Users,
  Zap,
} from "lucide-react";

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
            <a href="#como-funciona" className="hover:text-gray-900">Como funciona</a>
            <Link to="/precos" className="hover:text-gray-900">Preços</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <div className="hidden lg:block text-right">
                  <p className="text-xs text-gray-400">Logado como</p>
                  <p className="max-w-[190px] truncate text-xs font-semibold text-gray-700">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
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
              <Zap className="h-3 w-3" /> NR-1 · Riscos psicossociais · GRO/PGR
            </span>

            <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
              Gestão de <span className="text-brand-600">riscos psicossociais</span> da NR-1 para empresas.
            </h1>

            <p className="mt-6 text-lg text-gray-600">
              Mapeie fatores psicossociais do trabalho, registre evidências, crie plano de ação e organize a seção psicossocial do PGR sem transformar isso em burocracia.
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
                  <Link to="/comecar" className="btn-secondary text-base px-6 py-3">
                    Configurar empresa
                  </Link>
                  <Link to="/trocar-conta" className="btn-secondary text-base px-6 py-3">
                    Trocar conta
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-base px-6 py-3">
                    Entrar
                  </Link>
                  <Link to="/cadastro" className="btn-primary text-base px-6 py-3">
                    Começar agora →
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Sem diagnóstico médico individual. O foco é gestão organizacional, evidências e plano de ação.
            </p>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              O fluxo que a empresa precisa para tratar riscos psicossociais
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

      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Como o NR1Check ajuda
          </h2>

          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="text-5xl font-extrabold text-brand-100">{index + 1}</div>
                <h3 className="mt-2 text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center p-12 border-0">
            <h2 className="text-3xl font-bold">
              Transforme a exigência psicossocial da NR-1 em rotina de gestão.
            </h2>
            <p className="mt-3 text-brand-100 text-lg">
              Cadastre a empresa, mapeie fatores de risco, gere ações e acompanhe evidências em um só lugar.
            </p>

            <div className="mt-6">
              {isSignedIn ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
                >
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
            O NR1Check não substitui profissional legalmente habilitado, médico, psicólogo, engenheiro de segurança ou consultoria jurídica. Ele organiza gestão, evidências e rotina.
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-10">
        <div className="mx-auto max-w-7xl px-6 text-sm text-gray-500 flex flex-col md:flex-row justify-between gap-4">
          <p>© 2026 NR1Check · Alternative Ventures</p>
          <p>Contato: henriquecampos66@gmail.com · (11) 94798-4328</p>
        </div>
      </footer>
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
    title: "Evidências para o PGR",
    description: "Organize registros que demonstram que a empresa identificou, avaliou e tratou os riscos psicossociais.",
  },
  {
    icon: Lock,
    title: "Painel de gestão",
    description: "Acompanhe pendências, riscos críticos, ações atrasadas e histórico de revisão.",
  },
];

const STEPS = [
  { title: "Cadastre a empresa", description: "Crie o painel e organize setores, funções e responsáveis." },
  { title: "Inclua trabalhadores", description: "Adicione equipes ou comece apenas com os setores principais." },
  { title: "Mapeie fatores", description: "Identifique riscos psicossociais por área, função e exposição." },
  { title: "Gere ações", description: "Crie plano de ação com prazo, responsável, medida e evidência." },
  { title: "Acompanhe", description: "Monitore pendências e use os registros na rotina do GRO/PGR." },
];
