import { Link, useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, Plus, Users } from "lucide-react";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

export default function Clients() {
  const navigate = useNavigate();
  const { data: companies, isLoading } = trpc.company.my.useQuery();

  function openCompany(id: number) {
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
    window.localStorage.setItem("nr1check:user-mode", "contador");
    navigate("/dashboard");
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Modo contador/consultor"
        title="Clientes atendidos"
        description="Cadastre empresas clientes e organize a NR-1 psicossocial de cada uma. A cobrança pode ser por empresa ativa."
        action={
          <Link to="/comecar" className="btn-primary" onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}>
            <Plus className="h-4 w-4" />
            Cadastrar cliente
          </Link>
        }
      />

      {isLoading ? (
        <div className="card"><p className="text-gray-500">Carregando clientes...</p></div>
      ) : !companies?.length ? (
        <EmptyPanel
          icon={<Building2 className="h-6 w-6" />}
          title="Nenhum cliente cadastrado"
          description="Cadastre a primeira empresa cliente para começar a organizar o fluxo NR-1 psicossocial."
          action={
            <Link to="/comecar" className="btn-primary" onClick={() => window.localStorage.setItem("nr1check:user-mode", "contador")}>
              Cadastrar primeiro cliente →
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Clientes" value={companies.length} helper="empresas cadastradas" tone="brand" />
            <MetricCard label="Modelo" value="Por empresa" helper="ideal para contador" />
            <MetricCard label="Próximo passo" value="Cobrança" helper="plano por cliente ativo" />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} className="card hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">{company.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">{company.cnpj ? `CNPJ ${company.cnpj}` : "CNPJ não informado"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge tone={company.onboardingCompleted ? "green" : "yellow"}>
                          {company.onboardingCompleted ? "Onboarding feito" : "Em configuração"}
                        </StatusBadge>
                        {company.stripeStatus === "active" && <StatusBadge tone="green">Ativo</StatusBadge>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  <button onClick={() => openCompany(company.id)} className="btn-primary w-full">
                    <CheckCircle2 className="h-4 w-4" />
                    Abrir cockpit
                  </button>
                  <Link to="/funcionarios" onClick={() => openCompany(company.id)} className="btn-secondary w-full justify-center">
                    <Users className="h-4 w-4" />
                    Trabalhadores
                  </Link>
                </div>
              </div>
            ))}
          </section>

          <div className="card border-brand-200 bg-brand-50">
            <h2 className="text-lg font-bold text-brand-900">Ideia de cobrança para contador</h2>
            <p className="mt-2 text-sm text-brand-800">
              O contador pode ter uma assinatura base e pagar por empresa ativa. Exemplo: R$ 199/mês até 10 empresas ou R$ 19 a R$ 39 por empresa adicional.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
