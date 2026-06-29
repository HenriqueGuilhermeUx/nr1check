import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, Plus, RefreshCcw, Upload, Users } from "lucide-react";
import { trpc } from "../lib/trpc";
import { AppShell, EmptyPanel, MetricCard, PageHeader, StatusBadge } from "../components/AppShell";

const SELECTED_COMPANY_KEY = "nr1check:selected-company-id";

type EmployeeDraft = {
  name: string;
  cpf: string;
  phone?: string;
  role?: string;
};

function cleanCpf(value: string) {
  return value.replace(/\D/g, "");
}

function splitCsvLine(line: string) {
  if (line.includes(";")) return line.split(";").map((item) => item.trim());
  if (line.includes("\t")) return line.split("\t").map((item) => item.trim());
  return line.split(",").map((item) => item.trim());
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseEmployeesCsv(text: string): EmployeeDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const first = splitCsvLine(lines[0]);
  const normalized = first.map(normalizeHeader);
  const hasHeader = normalized.some((item) => ["nome", "name", "cpf", "telefone", "whatsapp", "cargo", "funcao"].includes(item));

  const header = hasHeader ? normalized : ["nome", "cpf", "telefone", "cargo"];
  const dataLines = hasHeader ? lines.slice(1) : lines;

  function getIndex(names: string[]) {
    return header.findIndex((item) => names.includes(item));
  }

  const nameIndex = getIndex(["nome", "name", "funcionario", "colaborador"]);
  const cpfIndex = getIndex(["cpf", "documento"]);
  const phoneIndex = getIndex(["telefone", "phone", "celular", "whatsapp", "zap"]);
  const roleIndex = getIndex(["cargo", "funcao", "role"]);

  return dataLines
    .map((line) => {
      const cols = splitCsvLine(line);
      const name = cols[nameIndex >= 0 ? nameIndex : 0]?.trim() ?? "";
      const cpf = cleanCpf(cols[cpfIndex >= 0 ? cpfIndex : 1] ?? "");
      const phone = cols[phoneIndex >= 0 ? phoneIndex : 2]?.trim() ?? "";
      const role = cols[roleIndex >= 0 ? roleIndex : 3]?.trim() ?? "";

      return {
        name,
        cpf,
        phone: phone || undefined,
        role: role || undefined,
      };
    })
    .filter((item) => item.name && item.cpf.length >= 11);
}

export default function Employees() {
  const utils = trpc.useUtils();
  const { data: companies, isLoading: loadingCompanies } = trpc.company.my.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<EmployeeDraft[]>([]);
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", role: "" });

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_COMPANY_KEY);
    if (stored) setSelectedCompanyId(Number(stored));
  }, []);

  const company = useMemo(() => {
    if (!companies?.length) return undefined;

    if (selectedCompanyId) {
      return companies.find((item) => item.id === selectedCompanyId) ?? companies[0];
    }

    return companies[0];
  }, [companies, selectedCompanyId]);

  const companyId = company?.id ?? 0;

  const { data: employees, refetch, isFetching } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: !!companyId, retry: 1, refetchOnWindowFocus: false },
  );

  const create = trpc.employee.create.useMutation({
    onSuccess: () => {
      toast.success("Trabalhador cadastrado!");
      setShowForm(false);
      setForm({ name: "", cpf: "", phone: "", role: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkCreate = trpc.employee.bulkCreate.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.created} trabalhador(es) importado(s).`);
      if (result.errors.length) {
        toast.error(`${result.errors.length} item(ns) não importado(s).`);
      }
      setCsvText("");
      setPreview([]);
      setShowImport(false);
      utils.employee.list.invalidate({ companyId });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCompanyChange(value: string) {
    const id = Number(value);
    setSelectedCompanyId(id);
    window.localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
  }

  function handleCsvChange(value: string) {
    setCsvText(value);
    setPreview(parseEmployeesCsv(value));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleCsvChange(text);
  }

  function downloadModel() {
    const sample = "nome;cpf;telefone;cargo\nMaria Silva;12345678901;11999999999;Atendente\nJoão Souza;98765432100;11888888888;Gerente";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-importacao-trabalhadores.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function submitImport() {
    if (!companyId) {
      toast.error("Selecione uma empresa.");
      return;
    }

    if (!preview.length) {
      toast.error("Nenhum trabalhador válido encontrado.");
      return;
    }

    bulkCreate.mutate(
      preview.map((employee) => ({
        ...employee,
        companyId,
        cpf: cleanCpf(employee.cpf),
      })),
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Trabalhadores"
        title="Equipe da empresa"
        description="Cadastre manualmente ou importe trabalhadores da folha/Excel usando CSV."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowImport(!showImport)} className="btn-secondary">
              <FileSpreadsheet className="h-4 w-4" />
              Importar CSV
            </button>
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus className="h-4 w-4" />
              {showForm ? "Cancelar" : "Adicionar"}
            </button>
          </div>
        }
      />

      {loadingCompanies ? (
        <div className="card">
          <p className="text-gray-500">Carregando empresas...</p>
        </div>
      ) : !companies?.length ? (
        <EmptyPanel
          icon={<Users className="h-6 w-6" />}
          title="Cadastre uma empresa primeiro"
          description="Antes de cadastrar trabalhadores, selecione ou cadastre uma empresa."
          action={<a href="/comecar" className="btn-primary">Cadastrar empresa →</a>}
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Empresa" value={company?.name ?? "—"} helper="empresa selecionada" />
            <MetricCard label="Trabalhadores" value={employees?.length ?? 0} helper="cadastrados" tone="brand" />
            <MetricCard label="Importação" value="CSV" helper="exportado do Excel" />
          </section>

          {companies.length > 1 ? (
            <div className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Empresa selecionada</h2>
                  <p className="text-sm text-gray-500">Escolha para qual cliente você vai importar/cadastrar trabalhadores.</p>
                </div>
                <select className="input md:max-w-sm" value={company?.id ?? ""} onChange={(event) => handleCompanyChange(event.target.value)}>
                  {companies.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {showImport ? (
            <div className="card border-brand-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Importar trabalhadores por Excel/CSV</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    No Excel, salve/exporte como CSV. Colunas aceitas: nome, cpf, telefone, cargo.
                  </p>
                </div>
                <button type="button" onClick={downloadModel} className="btn-secondary text-sm">
                  Baixar modelo
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="label">Enviar arquivo CSV</label>
                  <input className="input" type="file" accept=".csv,.txt" onChange={handleFile} />

                  <label className="label mt-4">Ou colar conteúdo CSV</label>
                  <textarea
                    className="input min-h-[180px]"
                    value={csvText}
                    onChange={(event) => handleCsvChange(event.target.value)}
                    placeholder={"nome;cpf;telefone;cargo\nMaria Silva;12345678901;11999999999;Atendente"}
                  />

                  <button type="button" onClick={submitImport} disabled={bulkCreate.isPending || !preview.length} className="btn-primary mt-4">
                    <Upload className="h-4 w-4" />
                    {bulkCreate.isPending ? "Importando..." : `Importar ${preview.length} trabalhador(es)`}
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">Prévia da importação</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Conferência antes de salvar no banco.
                  </p>

                  <div className="mt-4 max-h-[300px] overflow-auto rounded-xl bg-white">
                    <table className="w-full text-sm">
                      <thead className="border-b text-left text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Nome</th>
                          <th>CPF</th>
                          <th>Cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((item, index) => (
                          <tr key={`${item.cpf}-${index}`} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">{item.name}</td>
                            <td>{item.cpf}</td>
                            <td>{item.role ?? "—"}</td>
                          </tr>
                        ))}

                        {!preview.length ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                              Nenhum dado válido ainda.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showForm ? (
            <div className="card">
              <h2 className="font-semibold mb-4">Novo trabalhador</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();

                  if (!companyId) {
                    toast.error("Selecione uma empresa.");
                    return;
                  }

                  create.mutate({
                    ...form,
                    companyId,
                    cpf: cleanCpf(form.cpf),
                    phone: form.phone || undefined,
                    role: form.role || undefined,
                  });
                }}
                className="grid md:grid-cols-2 gap-3"
              >
                <input className="input" placeholder="Nome completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="input" placeholder="CPF" required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                <input className="input" placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input" placeholder="Cargo" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                <button type="submit" disabled={create.isPending} className="btn-primary md:col-span-2">
                  {create.isPending ? "Salvando..." : "Cadastrar"}
                </button>
              </form>
            </div>
          ) : null}

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Trabalhadores cadastrados</h2>
              <button type="button" onClick={() => refetch()} className="btn-secondary text-sm">
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </button>
            </div>

            {isFetching ? <p className="mb-3 text-sm text-gray-500">Atualizando lista...</p> : null}

            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="py-2">Nome</th>
                  <th>CPF</th>
                  <th>Cargo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{emp.name}</td>
                    <td>{emp.cpf}</td>
                    <td>{emp.role ?? "—"}</td>
                    <td>
                      <StatusBadge tone={emp.status === "ativo" ? "green" : "yellow"}>
                        {emp.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}

                {!employees?.length ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Nenhum trabalhador cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
