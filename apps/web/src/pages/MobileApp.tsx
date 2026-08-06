import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileCheck,
  LogOut,
  MessageSquare,
  Send,
  Shield,
  Users,
} from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";

function withCompanyId(path: string, companyId: string | null) {
  if (!companyId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}companyId=${encodeURIComponent(companyId)}`;
}

export default function MobileApp() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("companyId");

  const employeeAccessPath = withCompanyId("/acesso-funcionario", companyId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
        <header className="flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none text-gray-950">NR1Check</p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">App de acesso rápido</p>
            </div>
          </Link>

          <SignedIn>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/app" })}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </SignedIn>
        </header>

        <SignedOut>
          <section className="mt-7 rounded-[2rem] bg-gray-950 p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-200">NR-1 psicossocial</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Acesso simples para sua rotina.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Entre como funcionário para responder e registrar informações, ou como patrão/RH para acompanhar a empresa.
            </p>
          </section>

          {companyId ? (
            <div className="mt-4 rounded-3xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">Empresa identificada</p>
              <p className="mt-1 text-sm font-semibold text-green-950">Código da empresa: {companyId}</p>
            </div>
          ) : null}

          <section className="mt-5 space-y-3">
            <AccessCard
              icon={<Users className="h-6 w-6" />}
              title="Sou funcionário"
              description="Acesse com CPF cadastrado e código recebido."
              to={employeeAccessPath}
              label="Entrar como funcionário"
              tone="green"
            />

            <AccessCard
              icon={<Building2 className="h-6 w-6" />}
              title="Sou patrão, RH ou gestor"
              description="Entre para acompanhar pendências, equipe, avaliação e documentos."
              to="/login?redirect=/app/empresa"
              label="Entrar como empresa"
              tone="blue"
            />
          </section>

          <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-950">O que dá para fazer no app</h2>
            <div className="mt-4 space-y-3">
              <Feature icon={<ClipboardCheck className="h-4 w-4" />} label="Responder avaliação pelo celular" />
              <Feature icon={<MessageSquare className="h-4 w-4" />} label="Enviar relato quando necessário" />
              <Feature icon={<FileCheck className="h-4 w-4" />} label="Acompanhar documentos e ciência" />
              <Feature icon={<Send className="h-4 w-4" />} label="Enviar link para trabalhadores" />
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="mt-7 rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-600/20">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-100">Conta da empresa</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Painel rápido</h1>
            <p className="mt-3 truncate text-sm text-brand-50">{user?.primaryEmailAddress?.emailAddress}</p>
          </section>

          <section className="mt-5 grid gap-3">
            <QuickAction
              icon={<Building2 className="h-5 w-5" />}
              title="Minha empresa"
              description="Ver resumo e status da empresa."
              to="/app/empresa"
            />
            <QuickAction
              icon={<Users className="h-5 w-5" />}
              title="Funcionários"
              description="Conferir rotina de equipe no app."
              to="/app/empresa?aba=funcionarios"
            />
            <QuickAction
              icon={<Send className="h-5 w-5" />}
              title="Enviar link aos funcionários"
              description="Compartilhar acesso do app com a equipe."
              to="/app/empresa?aba=convite"
            />
            <QuickAction
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Avaliação"
              description="Acompanhar avaliação psicossocial."
              to="/app/empresa?aba=avaliacao"
            />
            <QuickAction
              icon={<FileCheck className="h-5 w-5" />}
              title="Documentos"
              description="Ver documentos e evidências."
              to="/app/empresa?aba=documentos"
            />
            <QuickAction
              icon={<MessageSquare className="h-5 w-5" />}
              title="Relatos"
              description="Acompanhar canal de relatos."
              to="/app/empresa?aba=relatos"
            />
          </section>

          <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
              <p className="text-sm text-yellow-900">
                As respostas individuais dos trabalhadores não devem ser usadas como diagnóstico médico. O foco é gestão organizacional e evidências.
              </p>
            </div>
          </div>
        </SignedIn>

        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-xs font-semibold text-gray-500">{COMPANY_NAME}</p>
          <p className="mt-1 text-[11px] text-gray-400">CNPJ {COMPANY_CNPJ}</p>
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-gray-400">
            <Link to="/privacidade" className="hover:text-gray-900">Privacidade</Link>
            <Link to="/excluir-conta" className="hover:text-gray-900">Excluir dados</Link>
            <Link to="/suporte" className="hover:text-gray-900">Suporte</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function AccessCard({
  icon,
  title,
  description,
  to,
  label,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
  label: string;
  tone: "green" | "blue";
}) {
  const toneClass = tone === "green" ? "bg-green-50 text-green-700" : "bg-brand-50 text-brand-700";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          {icon}
        </div>
        <div>
          <h2 className="font-extrabold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-gray-600">{description}</p>
        </div>
      </div>
      <Link to={to} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-extrabold text-white">
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function QuickAction({ icon, title, description, to }: { icon: ReactNode; title: string; description: string; to: string }) {
  return (
    <Link to={to} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-gray-600">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
      </div>
    </Link>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700">
      <div className="text-brand-700">{icon}</div>
      {label}
    </div>
  );
}
