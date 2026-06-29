import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

export default function Clients() {
  const navigate = useNavigate();
  const { data: companies, isLoading } = trpc.company.my.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  function openCompany(id: number, nextRoute = "/dashboard") {
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
    window.localStorage.setItem("nr1check:user-mode", "contador");
    navigate(nextRoute);
  }

  const totalClients = companies?.length ?? 0;
  const configuredClients = companies?.filter((company) => company.onboardingCompleted).length ?? 0;
  const extraCompanies = Math.max(totalClients - 10, 0);
  const estimatedMonthly = 199 + extraCompanies * 29;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard do contador"
        title="Gerencie a NR-1 dos seus clientes."
        description="Cadastre empresas, selecione o cliente em atendimento, importe trabalhadores da folha e acompanhe o status de cada empresa."
        action={
          <Link
            to="/comecar"
            className="btn-primary"
            onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
          >
            <Plus className="h-4 w-4" />
            Cadastrar cliente
          </Link>
        }
      />

      {isLoading ? (
        <div className="card">
          <p className="text-gray-500">Carregando clientes...</p>
        </div>
      ) : !companies?.length ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Nenhum cliente cadastrado"
          description="Cadastre a primeira empresa cliente para começar a organizar o fluxo NR-1 psicossocial."
          action={
            <Link
              to="/comecar"
              className="btn-primary"
              onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
            >
              Cadastrar primeiro cliente →
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Clientes" value={totalClients} helper="empresas cadastradas" tone="brand" />
            <MetricCard label="Configurados" value={configuredClients} helper="onboarding concluído" />
            <MetricCard label="Modelo" value="Por empresa" helper="base + adicional" />
            <MetricCard label="Estimativa" value={`R$ ${estimatedMonthly}`} helper="mês, simulação" tone="green" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Empresas clientes</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecione uma empresa para abrir o cockpit, cadastrar trabalhadores ou importar planilha.
                  </p>
                </div>
                <Link
                  to="/comecar"
                  className="btn-secondary"
                  onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}
                >
                  <Plus className="h-4 w-4" />
                  Novo cliente
                </Link>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {companies.map((company) => (
                  <div key={company.id} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                        <Building2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-gray-900">{company.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {company.cnpj ? `CNPJ ${company.cnpj}` : "CNPJ não informado"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusBadge tone={company.onboardingCompleted ? "green" : "yellow"}>
                            {company.onboardingCompleted ? "Configurada" : "Configurar"}
                          </StatusBadge>
                          {company.stripeStatus === "active" ? <StatusBadge tone="green">Ativa</StatusBadge> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      <button type="button" onClick={() => openCompany(company.id, "/dashboard")} className="btn-primary justify-center text-sm">
                        Cockpit
                      </button>

                      <button type="button" onClick={() => openCompany(company.id, "/funcionarios")} className="btn-secondary justify-center text-sm">
                        Equipe
                      </button>

                      <button type="button" onClick={() => openCompany(company.id, "/funcionarios")} className="btn-secondary justify-center text-sm">
                        Importar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="card border-brand-200 bg-brand-50">
                <div className="flex gap-3">
                  <FileSpreadsheet className="mt-1 h-5 w-5 text-brand-700" />
                  <div>
                    <h2 className="font-bold text-brand-900">Importação da folha</h2>
                    <p className="mt-1 text-sm text-brand-800">
                      Exporte do Excel/folha como CSV com colunas: nome, cpf, telefone, cargo. Depois importe na tela de trabalhadores.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const first = companies[0];
                        if (first) openCompany(first.id, "/funcionarios");
                      }}
                      className="btn-primary mt-4 text-sm"
                    >
                      Ir para importação <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Como vender para cliente</h2>
                <div className="mt-4 space-y-3">
                  {[
                    "Cadastrar empresa do cliente",
                    "Importar trabalhadores da folha",
                    "Enviar avaliação por link ou QR",
                    "Gerar plano de ação e documentos",
                    "Cobrar recorrente por empresa ativa",
                  ].map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900">Cobrança sugerida</h2>
                <div className="mt-4 space-y-3">
                  <PriceLine label="Base contador" value="R$ 199/mês" />
                  <PriceLine label="Inclui" value="10 empresas" />
                  <PriceLine label="Adicional" value="R$ 29/empresa" />
                  <PriceLine label="Carteira grande" value="sob consulta" />
                </div>
              </div>
            </aside>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
