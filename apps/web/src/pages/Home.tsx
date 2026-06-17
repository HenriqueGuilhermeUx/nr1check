import { Link } from "react-router-dom";
import { useUser, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Check, Shield, FileCheck, Lock, Users, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-700 hover:text-gray-900">Entrar</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary">Começar grátis</button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Zap className="h-3 w-3" /> Adequação à NR-1 + Lei 15.377/2026
            </span>
            <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
              Sua empresa em conformidade com a <span className="text-brand-600">NR-1</span> em <span className="underline decoration-brand-500">30 minutos</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Geramos toda a documentação obrigatória, treinamentos, pesquisas psicossociais e o canal de denúncias — blindando sua empresa contra multas e ações trabalhistas.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {isSignedIn ? (
                <Link to="/comecar" className="btn-primary text-base px-6 py-3">Configurar minha empresa →</Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="btn-primary text-base px-6 py-3">Começar agora →</button>
                </SignUpButton>
              )}
              <Link to="/precos" className="btn-secondary text-base px-6 py-3">Ver planos</Link>
            </div>
            <p className="mt-4 text-xs text-gray-500">7 dias grátis · Sem cartão · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Tudo que a NR-1 exige, em um só lugar</h2>
            <p className="mt-4 text-lg text-gray-600">PGR, COPSOQ, Ordens de Serviço, EPI, Denúncias anônimas, Painel de Defesa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition">
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900">Pronto em 5 passos</h2>
          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="text-5xl font-extrabold text-brand-100">{i + 1}</div>
                <h3 className="mt-2 text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center p-12 border-0">
            <h2 className="text-3xl font-bold">Pare de correr atrás de papelada.</h2>
            <p className="mt-3 text-brand-100 text-lg">Configure tudo em 30 minutos e fique em conformidade com a NR-1 ainda hoje.</p>
            <div className="mt-6">
              {isSignedIn ? (
                <Link to="/comecar" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50">Configurar agora →</Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50">Começar grátis</button>
                </SignUpButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
  { icon: Shield, title: "PGR com IA", description: "Programa de Gerenciamento de Riscos gerado em minutos com base no seu CNAE e no COPSOQ." },
  { icon: BarChart3, title: "COPSOQ II-Br", description: "Pesquisa psicossocial obrigatória (40 questões, 8 dimensões) enviada por WhatsApp." },
  { icon: FileCheck, title: "Documentos em PDF", description: "Ordens de Serviço, Fichas de EPI, Registro de Incidentes — todos com hash imutável." },
  { icon: Lock, title: "Canal de Denúncias", description: "Atende à Lei 15.377/2026 com protocolo SHA-256 anônimo e rastreável." },
  { icon: Users, title: "Funcionários pelo celular", description: "Login via CPF + código no WhatsApp. Sem senha, sem email, sem fricção." },
  { icon: Check, title: "Painel de Defesa", description: "Semáforo verde/amarelo/vermelho mostra exatamente o que falta para você ficar 100% protegido." },
];

const STEPS = [
  { title: "Cadastre a empresa", description: "CNPJ, setor, porte. Leva 5 minutos." },
  { title: "Importe funcionários", description: "Planilha Excel ou cadastro manual." },
  { title: "Gere o PGR", description: "IA cria o documento com linguagem defensiva." },
  { title: "Envie a pesquisa", description: "WhatsApp dispara o COPSOQ automaticamente." },
  { title: "Monitore o painel", description: "Semáforo de proteção em tempo real." },
];
