import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Clipboard, MessageCircle, QrCode, Send, Smartphone, Users } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, PageHeader, StatusBadge } from "../components/AppShell";

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

function getBaseUrl() {
  if (typeof window === "undefined") return "https://nr1check.netlify.app";
  return window.location.origin;
}

export default function EmployeeInvite() {
  const { data: companies, isLoading } = trpc.company.my.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(SELECTED_COMPANY_KEY);
    return stored ? Number(stored) : null;
  });

  const selectedCompany = useMemo(() => {
    if (!companies?.length) return undefined;
    if (selectedCompanyId) {
      return companies.find((company) => company.id === selectedCompanyId) ?? companies[0];
    }
    return companies[0];
  }, [companies, selectedCompanyId]);

  const baseUrl = getBaseUrl();
  const employeeAppLink = selectedCompany
    ? `${baseUrl}/app?perfil=funcionario&companyId=${selectedCompany.id}`
    : `${baseUrl}/app?perfil=funcionario`;
  const employeeAccessLink = selectedCompany
    ? `${baseUrl}/acesso-funcionario?companyId=${selectedCompany.id}`
    : `${baseUrl}/acesso-funcionario`;

  const message = selectedCompany
    ? `Olá! A ${selectedCompany.name} está usando o NR1Check para organizar a NR-1 psicossocial.\n\nAcesse pelo celular:\n${employeeAppLink}\n\nDepois toque em “Sou funcionário” e use seu CPF cadastrado para receber o código de acesso.`
    : `Olá! Acesse o NR1Check pelo celular:\n${employeeAppLink}`;

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  }

  function selectCompany(id: number) {
    setSelectedCompanyId(id);
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
  }

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Convite para funcionários"
        title="Envie o app aos trabalhadores."
        description="Compartilhe um link simples para os funcionários acessarem pelo celular. O acesso exige CPF cadastrado na empresa e código de verificação."
        action={
          <Link to="/funcionarios" className="btn-secondary">
            <Users className="h-4 w-4" />
            Ver funcionários
          </Link>
        }
      />

      {isLoading ? (
        <div className="card">
          <p className="text-gray-500">Carregando empresas...</p>
        </div>
      ) : !companies?.length ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Cadastre uma empresa primeiro"
          description="Para enviar link aos trabalhadores, você precisa ter uma empresa cadastrada."
          action={<Link to="/comecar" className="btn-primary">Cadastrar empresa →</Link>}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Empresa do convite</h2>
                  <p className="mt-1 text-sm text-gray-500">O link levará o funcionário para o acesso desta empresa.</p>
                </div>
                <StatusBadge tone="green">Acesso controlado por CPF</StatusBadge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {companies.map((company) => {
                  const active = selectedCompany?.id === company.id;
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => selectCompany(company.id)}
                      className={`rounded-2xl border p-4 text-left transition ${active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500" : "border-gray-200 bg-white hover:border-brand-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900">{company.name}</p>
                          <p className="mt-1 text-xs text-gray-500">ID da empresa: {company.id}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card border-brand-200 bg-brand-50">
              <div className="flex gap-3">
                <Smartphone className="mt-1 h-6 w-6 text-brand-700" />
                <div>
                  <h2 className="text-lg font-bold text-brand-900">Link do app PWA para funcionários</h2>
                  <p className="mt-1 text-sm text-brand-800">
                    Envie este link por WhatsApp, e-mail, mural interno ou QR Code. Depois, quando houver app oficial na Google Play, trocamos a mensagem para o link da loja.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-brand-200 bg-white p-4">
                <p className="break-all text-sm font-semibold text-gray-900">{employeeAppLink}</p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => copy(employeeAppLink, "Link do app")} className="btn-primary justify-center">
                  <Clipboard className="h-4 w-4" />
                  Copiar link
                </button>

                <button type="button" onClick={() => copy(message, "Mensagem")} className="btn-secondary justify-center">
                  <Send className="h-4 w-4" />
                  Copiar mensagem
                </button>

                <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-secondary justify-center">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Mensagem pronta</h2>
              <textarea readOnly value={message} className="input mt-4 h-44 text-sm" />
            </div>
          </section>

          <aside className="space-y-6">
            <div className="card bg-gray-900 text-white">
              <QrCode className="h-7 w-7 text-brand-200" />
              <h2 className="mt-4 text-xl font-bold">Fluxo seguro</h2>
              <div className="mt-5 space-y-3">
                <Step text="Patrão/RH precisa ter plano ativo." />
                <Step text="Funcionário precisa estar cadastrado na empresa." />
                <Step text="Acesso do funcionário exige CPF + código." />
                <Step text="Respostas individuais não aparecem para o patrão." />
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900">Link direto de acesso</h2>
              <p className="mt-2 text-sm text-gray-500">
                Este link pula a tela inicial do app e vai direto para o login do funcionário.
              </p>
              <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                <p className="break-all text-xs font-semibold text-gray-700">{employeeAccessLink}</p>
              </div>
              <button type="button" onClick={() => copy(employeeAccessLink, "Link direto")} className="btn-secondary mt-4 w-full justify-center">
                Copiar direto
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Step({ text }: { text: string }) {
  return (
    <div className="flex gap-2 text-sm text-gray-200">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-300" />
      {text}
    </div>
  );
}
