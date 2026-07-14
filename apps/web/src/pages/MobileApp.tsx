import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Lock,
  MessageSquare,
  QrCode,
  Shield,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";

function withCompanyId(path: string, companyId: string | null) {
  if (!companyId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}companyId=${encodeURIComponent(companyId)}`;
}

export default function MobileApp() {
  const { isSignedIn, user } = useUser();
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("companyId");

  const employeeAccessPath = withCompanyId("/acesso-funcionario", companyId);
  const employeeAssessmentPath = withCompanyId("/responder-avaliacao", companyId);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none">NR1Check</p>
              <p className="mt-1 text-[11px] text-gray-400">Mobile MVP</p>
            </div>
          </Link>

          <Link to={isSignedIn ? "/dashboard" : "/login"} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200">
            {isSignedIn ? "Abrir" : "Entrar"}
          </Link>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-brand-500 via-brand-600 to-blue-700 p-6 shadow-2xl shadow-brand-900/30">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90">
            <Smartphone className="h-3.5 w-3.5" />
            App simples para celular
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight">
            NR-1 no bolso de quem precisa agir.
          </h1>

          <p className="mt-3 text-sm leading-6 text-brand-50">
            Funcionário responde, patrão acompanha e contador opera clientes em uma experiência simples, rápida e mobile-first.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat value="CPF" label="validado" />
            <MiniStat value="Pix" label="Woovi" />
            <MiniStat value="PWA" label="instalável" />
          </div>
        </section>

        {companyId ? (
          <div className="mt-4 rounded-3xl border border-green-400/20 bg-green-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-200">Link da empresa identificado</p>
            <p className="mt-1 text-sm font-semibold text-white">Código da empresa: {companyId}</p>
          </div>
        ) : null}

        {isSignedIn ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sessão ativa</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        ) : null}

        <section className="mt-5 space-y-3">
          <RoleCard
            icon={<Users className="h-6 w-6" />}
            title="Sou funcionário"
            description="Entrar com CPF cadastrado, responder avaliação, enviar relato e confirmar ciência de documentos."
            badge="CPF + código"
            primaryLabel="Entrar como funcionário"
            primaryTo={employeeAccessPath}
            secondaryLabel="Responder avaliação"
            secondaryTo={employeeAssessmentPath}
            tone="green"
          />

          <RoleCard
            icon={<Building2 className="h-6 w-6" />}
            title="Sou dono, RH ou gestor"
            description="Ver o que falta, importar equipe, enviar link do app aos funcionários e baixar documentos."
            badge="Contratante"
            primaryLabel={isSignedIn ? "Abrir cockpit" : "Começar empresa"}
            primaryTo={isSignedIn ? "/dashboard" : "/cadastro"}
            secondaryLabel={isSignedIn ? "Enviar link" : "Ver preços"}
            secondaryTo={isSignedIn ? "/convite-funcionarios" : "/precos"}
            tone="blue"
          />

          <RoleCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Sou contador ou consultor"
            description="Cadastrar clientes, importar folha e acompanhar status por empresa. Mantido como opção complementar."
            badge="Multiempresas"
            primaryLabel={isSignedIn ? "Abrir clientes" : "Criar conta contador"}
            primaryTo={isSignedIn ? "/clientes" : "/cadastro"}
            secondaryLabel="Plano contador"
            secondaryTo="/precos"
            tone="yellow"
            onPrimaryClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
          />
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Como usar no celular</h2>
              <p className="text-xs text-gray-400">Abra pelo navegador e adicione à tela inicial.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Step number="1" title="Abra nr1check.netlify.app/app" />
            <Step number="2" title="Toque em compartilhar ou menu do navegador" />
            <Step number="3" title="Escolha “Adicionar à tela inicial”" />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-bold">Funções chave do app</h2>
          <div className="mt-4 grid gap-2">
            <Feature icon={<MessageSquare className="h-4 w-4" />} label="Canal de relatos" />
            <Feature icon={<FileCheck className="h-4 w-4" />} label="Documentos e ciência" />
            <Feature icon={<CheckCircle2 className="h-4 w-4" />} label="Checklist do patrão" />
            <Feature icon={<Zap className="h-4 w-4" />} label="Link para funcionário por empresa" />
            <Feature icon={<Lock className="h-4 w-4" />} label="Áreas pagas protegidas por Woovi" />
          </div>
        </section>

        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-xs font-semibold text-gray-400">{COMPANY_NAME}</p>
          <p className="mt-1 text-[11px] text-gray-500">CNPJ {COMPANY_CNPJ}</p>
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-gray-500">
            <Link to="/termos" className="hover:text-white">Termos</Link>
            <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link to="/disclaimer" className="hover:text-white">Disclaimer</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-3">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-brand-50">{label}</p>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  badge,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  tone,
  onPrimaryClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
  tone: "green" | "blue" | "yellow";
  onPrimaryClick?: () => void;
}) {
  const toneClass = {
    green: "from-emerald-500/20 to-green-500/5 text-emerald-200 border-emerald-400/20",
    blue: "from-brand-500/20 to-blue-500/5 text-brand-100 border-brand-400/20",
    yellow: "from-yellow-500/20 to-orange-500/5 text-yellow-100 border-yellow-400/20",
  }[tone];

  return (
    <div className={`rounded-[1.75rem] border bg-gradient-to-br p-4 ${toneClass}`}>
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-extrabold text-white">{title}</h2>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
              {badge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-5 text-gray-300">{description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <Link
          to={primaryTo}
          onClick={onPrimaryClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-gray-950"
        >
          {primaryLabel} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to={secondaryTo}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-gray-950">
        {number}
      </div>
      <p className="text-sm font-medium text-gray-200">{title}</p>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3 text-sm text-gray-200">
      <div className="text-brand-200">{icon}</div>
      {label}
    </div>
  );
}
