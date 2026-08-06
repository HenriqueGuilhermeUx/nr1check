import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ClipboardCheck,
  FileCheck,
  LogOut,
  MessageSquare,
  Send,
  Shield,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const GOOGLE_REVIEW_EMAIL = "notarizex@gmail.com";
const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

type CompanySummary = {
  id: number;
  name: string;
  cnpj?: string | null;
  onboardingCompleted?: boolean | null;
};

function isGoogleReviewEmail(email?: string | null) {
  return email?.toLowerCase() === GOOGLE_REVIEW_EMAIL;
}

function getCurrentTab() {
  if (typeof window === "undefined") return "inicio";
  return new URLSearchParams(window.location.search).get("aba") ?? "inicio";
}

export default function MobileCompanyApp() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const reviewMode = isGoogleReviewEmail(email);
  const tab = getCurrentTab();

  const {
    data: companies,
    isLoading,
    error,
    refetch,
  } = trpc.company.my.useQuery(undefined, {
    enabled: Boolean(user),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const companyList = (companies ?? []) as CompanySummary[];
  const selectedCompany = companyList[0];

  if (selectedCompany?.id && typeof window !== "undefined") {
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(selectedCompany.id));
  }

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
              <p className="mt-1 text-[11px] font-medium text-gray-500">Empresa</p>
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
          <section className="mt-7 rounded-[2rem] border border-yellow-200 bg-yellow-50 p-6">
            <AlertTriangle className="h-7 w-7 text-yellow-700" />
            <h1 className="mt-4 text-2xl font-black text-yellow-950">Entre para continuar</h1>
            <p className="mt-2 text-sm leading-6 text-yellow-900">
              O painel da empresa precisa de uma conta de patrão, RH ou gestor.
            </p>
            <Link to="/login?redirect=/app/empresa" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gray-950 px-4 py-3 text-sm font-extrabold text-white">
              Entrar como empresa
            </Link>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="mt-7 rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-600/20">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-100">Conta da empresa</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Painel rápido</h1>
            <p className="mt-3 truncate text-sm text-brand-50">{email}</p>
            {reviewMode ? (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                Acesso de revisão Google Play
              </p>
            ) : null}
          </section>

          {isLoading ? (
            <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-bold text-gray-900">Carregando empresa...</p>
              <p className="mt-1 text-sm text-gray-500">Aguarde alguns segundos.</p>
            </div>
          ) : error ? (
            <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
                <div>
                  <p className="font-bold text-yellow-950">Sessão em sincronização</p>
                  <p className="mt-1 text-sm leading-6 text-yellow-900">
                    O app carregou sua conta, mas a API ainda não confirmou a autorização. Volte ao app ou tente novamente.
                  </p>
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => refetch()} className="rounded-2xl bg-gray-950 px-4 py-3 text-sm font-extrabold text-white">
                      Tentar novamente
                    </button>
                    <Link to="/app" className="rounded-2xl border border-yellow-300 bg-white px-4 py-3 text-center text-sm font-extrabold text-yellow-900">
                      Voltar ao app
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : !selectedCompany ? (
            <div className="mt-5 rounded-3xl border border-brand-200 bg-brand-50 p-5">
              <Building2 className="h-7 w-7 text-brand-700" />
              <h2 className="mt-4 text-xl font-black text-brand-950">Cadastre sua empresa</h2>
              <p className="mt-2 text-sm leading-6 text-brand-900">
                O teste grátis de 7 dias começa quando você cadastra a empresa.
              </p>
              <Link to="/comecar" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white">
                Cadastrar empresa
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Empresa ativa</p>
                <h2 className="mt-2 text-xl font-black text-gray-950">{selectedCompany.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedCompany.cnpj ? `CNPJ ${selectedCompany.cnpj}` : "CNPJ não informado"}</p>
                <p className="mt-3 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                  {reviewMode ? "Liberada para revisão" : "Teste grátis ativo por até 7 dias"}
                </p>
              </div>

              <MobileTabContent tab={tab} />

              <nav className="mt-5 grid grid-cols-2 gap-3">
                <MobileNavCard icon={<Building2 className="h-5 w-5" />} title="Início" to="/app/empresa" />
                <MobileNavCard icon={<Users className="h-5 w-5" />} title="Funcionários" to="/app/empresa?aba=funcionarios" />
                <MobileNavCard icon={<Send className="h-5 w-5" />} title="Enviar link" to="/app/empresa?aba=convite" />
                <MobileNavCard icon={<ClipboardCheck className="h-5 w-5" />} title="Avaliação" to="/app/empresa?aba=avaliacao" />
                <MobileNavCard icon={<FileCheck className="h-5 w-5" />} title="Documentos" to="/app/empresa?aba=documentos" />
                <MobileNavCard icon={<MessageSquare className="h-5 w-5" />} title="Relatos" to="/app/empresa?aba=relatos" />
              </nav>

              <div className="mt-5 grid gap-3">
                <Link to="/dashboard" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-700 shadow-sm">
                  Abrir versão completa
                </Link>
              </div>
            </>
          )}
        </SignedIn>

        <footer className="mt-auto pt-8 pb-4 text-center">
          <div className="flex justify-center gap-4 text-[11px] text-gray-400">
            <Link to="/privacidade" className="hover:text-gray-900">Privacidade</Link>
            <Link to="/excluir-conta" className="hover:text-gray-900">Excluir dados</Link>
            <Link to="/suporte" className="hover:text-gray-900">Suporte</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MobileTabContent({ tab }: { tab: string }) {
  const content: Record<string, { title: string; description: string; items: string[] }> = {
    inicio: {
      title: "Resumo da rotina",
      description: "Acompanhe as ações principais da empresa pelo celular.",
      items: ["Conferir funcionários cadastrados", "Enviar link de acesso", "Acompanhar avaliação", "Organizar documentos"],
    },
    funcionarios: {
      title: "Funcionários",
      description: "Cadastre ou importe trabalhadores pela versão completa.",
      items: ["Ver equipe cadastrada", "Importar planilha", "Controlar CPF e telefone", "Liberar acesso por link"],
    },
    convite: {
      title: "Enviar link",
      description: "Compartilhe o acesso do app com os funcionários.",
      items: ["Gerar link por empresa", "Enviar por WhatsApp", "Funcionário entra com CPF", "Código de acesso protege a entrada"],
    },
    avaliacao: {
      title: "Avaliação psicossocial",
      description: "Controle o envio e acompanhe respostas agregadas.",
      items: ["Criar ciclo de avaliação", "Enviar aos trabalhadores", "Acompanhar participação", "Ver achados agregados"],
    },
    documentos: {
      title: "Documentos",
      description: "Organize evidências e confirmações de ciência.",
      items: ["Documentos da empresa", "Comunicados", "Assinaturas/ciência", "Dossiê de evidências"],
    },
    relatos: {
      title: "Relatos",
      description: "Acompanhe o canal de ocorrências e relatos.",
      items: ["Relatos recebidos", "Status de tratativa", "Histórico de ocorrência", "Ações internas"],
    },
  };

  const selected = content[tab] ?? content.inicio;

  return (
    <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-gray-950">{selected.title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{selected.description}</p>
      <div className="mt-4 space-y-2">
        {selected.items.map((item) => (
          <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileNavCard({ icon, title, to }: { icon: ReactNode; title: string; to: string }) {
  return (
    <Link to={to} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        {icon}
      </div>
      <p className="mt-3 text-sm font-extrabold text-gray-950">{title}</p>
    </Link>
  );
}
