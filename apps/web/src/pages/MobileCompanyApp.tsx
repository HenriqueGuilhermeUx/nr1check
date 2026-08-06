import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import {
  AlertTriangle,
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

type TabId = "inicio" | "funcionarios" | "convite" | "avaliacao" | "documentos" | "relatos";

type CompanySummary = {
  id: number;
  name: string;
  cnpj?: string | null;
  onboardingCompleted?: boolean | null;
};

const DEMO_COMPANY: CompanySummary = {
  id: 900001,
  name: "Empresa Demonstração Google Play",
  cnpj: "90000000000001",
  onboardingCompleted: true,
};

function isGoogleReviewEmail(email?: string | null) {
  return email?.trim().toLowerCase() === GOOGLE_REVIEW_EMAIL;
}

function getInitialTab(): TabId {
  if (typeof window === "undefined") return "inicio";
  const value = new URLSearchParams(window.location.search).get("aba");
  if (value === "funcionarios" || value === "convite" || value === "avaliacao" || value === "documentos" || value === "relatos") return value;
  return "inicio";
}

export default function MobileCompanyApp() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState<TabId>(() => getInitialTab());

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
  const reviewMode = isGoogleReviewEmail(email);
  const waitingForClerk = !isLoaded || (Boolean(user) && !email);
  const canQueryApi = isLoaded && Boolean(user) && Boolean(email) && !reviewMode;

  const {
    data: companies,
    isLoading,
    error,
    refetch,
  } = trpc.company.my.useQuery(undefined, {
    enabled: canQueryApi,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const companyList = reviewMode ? [DEMO_COMPANY] : ((companies ?? []) as CompanySummary[]);
  const selectedCompany = companyList[0];

  if (selectedCompany?.id && typeof window !== "undefined") {
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(selectedCompany.id));
  }

  const showLoading = !reviewMode && (waitingForClerk || isLoading);
  const showApiError = !reviewMode && !waitingForClerk && Boolean(error);

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
            <p className="mt-3 truncate text-sm text-brand-50">{email ?? "sincronizando conta..."}</p>
            {reviewMode ? (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                Acesso de revisão Google Play
              </p>
            ) : null}
          </section>

          {showLoading ? (
            <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-bold text-gray-900">Carregando acesso...</p>
              <p className="mt-1 text-sm text-gray-500">Estamos sincronizando sua sessão com segurança.</p>
            </div>
          ) : showApiError ? (
            <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
                <div>
                  <p className="font-bold text-yellow-950">Sessão em sincronização</p>
                  <p className="mt-1 text-sm leading-6 text-yellow-900">
                    O app carregou sua conta, mas a API ainda não confirmou a autorização. Tente novamente em alguns segundos.
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

              <MobileTabContent tab={tab} reviewMode={reviewMode} />

              <nav className="mt-5 grid grid-cols-2 gap-3">
                <MobileNavButton active={tab === "inicio"} icon={<Building2 className="h-5 w-5" />} title="Início" onClick={() => setTab("inicio")} />
                <MobileNavButton active={tab === "funcionarios"} icon={<Users className="h-5 w-5" />} title="Funcionários" onClick={() => setTab("funcionarios")} />
                <MobileNavButton active={tab === "convite"} icon={<Send className="h-5 w-5" />} title="Enviar link" onClick={() => setTab("convite")} />
                <MobileNavButton active={tab === "avaliacao"} icon={<ClipboardCheck className="h-5 w-5" />} title="Avaliação" onClick={() => setTab("avaliacao")} />
                <MobileNavButton active={tab === "documentos"} icon={<FileCheck className="h-5 w-5" />} title="Documentos" onClick={() => setTab("documentos")} />
                <MobileNavButton active={tab === "relatos"} icon={<MessageSquare className="h-5 w-5" />} title="Relatos" onClick={() => setTab("relatos")} />
              </nav>
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

function MobileTabContent({ tab, reviewMode }: { tab: TabId; reviewMode: boolean }) {
  const content: Record<TabId, { title: string; description: string; items: string[] }> = {
    inicio: {
      title: "Resumo da rotina",
      description: reviewMode
        ? "Ambiente demonstrativo liberado para revisão do Google Play."
        : "Acompanhe as ações principais da empresa pelo celular.",
      items: ["Empresa demo ativa", "2 funcionários cadastrados", "Avaliação pronta para envio", "Documentos e relatos disponíveis"],
    },
    funcionarios: {
      title: "Funcionários",
      description: "Cadastre ou importe trabalhadores pela versão completa.",
      items: ["Ana Souza — Administrativo", "Carlos Lima — Operacional", "CPF e telefone controlados", "Acesso por link da empresa"],
    },
    convite: {
      title: "Enviar link",
      description: "Compartilhe o acesso do app com os funcionários.",
      items: ["Link da empresa disponível", "Envio por WhatsApp ou e-mail", "Funcionário entra com CPF", "Código de acesso protege a entrada"],
    },
    avaliacao: {
      title: "Avaliação psicossocial",
      description: "Controle o envio e acompanhe respostas agregadas.",
      items: ["Ciclo de avaliação demonstrativo", "Convite aos trabalhadores", "Participação acompanhada", "Achados agregados por dimensão"],
    },
    documentos: {
      title: "Documentos",
      description: "Organize evidências e confirmações de ciência.",
      items: ["Comunicado interno", "Plano de ação", "Ciência de documentos", "Dossiê de evidências"],
    },
    relatos: {
      title: "Relatos",
      description: "Acompanhe o canal de ocorrências e relatos.",
      items: ["Canal disponível", "Status de tratativa", "Histórico de ocorrência", "Ações internas"],
    },
  };

  const selected = content[tab];

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

function MobileNavButton({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left shadow-sm transition ${
        active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        {icon}
      </div>
      <p className="mt-3 text-sm font-extrabold text-gray-950">{title}</p>
    </button>
  );
}
