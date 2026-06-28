import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, FileCheck, Loader2, RefreshCcw, Shield, Users } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Funcionários", icon: Users },
  { id: 3, title: "Painel", icon: FileCheck },
];

function cleanDocument(value: string) {
  return value.replace(/\D/g, "");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Não foi possível salvar. Tente novamente.";
}

function isDuplicateCompanyError(message: string) {
  const text = message.toLowerCase();
  return text.includes("já existe") || text.includes("already") || text.includes("duplicate") || text.includes("conflict");
}

function timeoutAfter(ms: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("TIMEOUT_ONBOARDING_COMPANY_CREATE"));
    }, ms);
  });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">NR1Check</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ir para dashboard →
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Configure sua empresa</h1>
        <p className="text-gray-600 mt-1">
          Comece em poucos passos. Você pode completar os detalhes depois.
        </p>

        <ol className="mt-8 flex items-center w-full">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "w-full" : ""}`}>
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s.id ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300 text-gray-400"
                }`}
                title={s.title}
              >
                <s.icon className="w-5 h-5" />
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-brand-600" : "bg-gray-200"}`} />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 card">
          {step === 1 && <Step1Company onDone={() => setStep(2)} onGoDashboard={() => navigate("/dashboard")} />}
          {step === 2 && <Step2Employees onDone={() => setStep(3)} onBack={() => setStep(1)} onGoDashboard={() => navigate("/dashboard")} />}
          {step === 3 && <Step3Ready onFinish={() => navigate("/dashboard")} />}
        </div>
      </div>
    </div>
  );
}

function Step1Company({ onDone, onGoDashboard }: { onDone: () => void; onGoDashboard: () => void }) {
  const utils = trpc.useUtils();
  const { data: companies, refetch } = trpc.company.my.useQuery();

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    sector: "",
    cnaeCode: "",
  });

  const [saving, setSaving] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [lastError, setLastError] = useState("");

  const create = trpc.company.create.useMutation();

  async function checkExistingCompanyAndContinue() {
    const result = await refetch();
    const company = result.data?.[0] ?? companies?.[0];

    if (company) {
      toast.success("Empresa encontrada. Vamos continuar.");
      onDone();
      return true;
    }

    return false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLastError("");
    setStuck(false);

    const cnpj = cleanDocument(form.cnpj);

    if (!form.name.trim()) {
      toast.error("Informe a razão social.");
      return;
    }

    if (cnpj.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos.");
      return;
    }

    if (companies?.length) {
      toast.success("Empresa já cadastrada. Vamos continuar.");
      onDone();
      return;
    }

    setSaving(true);

    try {
      await Promise.race([
        create.mutateAsync({
          name: form.name.trim(),
          cnpj,
          sector: form.sector.trim() || undefined,
          cnaeCode: form.cnaeCode.trim() || undefined,
          type: "empresa",
          size: "micro",
        }),
        timeoutAfter(12000),
      ]);

      await utils.company.my.invalidate();
      toast.success("Empresa cadastrada!");
      onDone();
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === "TIMEOUT_ONBOARDING_COMPANY_CREATE") {
        setStuck(true);
        setLastError("A API demorou para responder. A empresa pode ter sido criada, mas o app não recebeu confirmação.");
        toast.error("A API demorou para responder. Verifique se criou ou tente novamente.");
        return;
      }

      if (isDuplicateCompanyError(message)) {
        await utils.company.my.invalidate();
        const found = await checkExistingCompanyAndContinue();
        if (!found) {
          toast.success("Empresa já existe. Continue pelo dashboard.");
          onGoDashboard();
        }
        return;
      }

      setLastError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">Passo 1 — Dados básicos da empresa</h2>
      <p className="text-sm text-gray-500 mt-1">
        Informe o mínimo para criar o painel. CNAE e dados complementares podem ser preenchidos depois.
      </p>

      {companies?.length ? (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-green-700" />
            <div>
              <p className="font-semibold text-green-900">Empresa já cadastrada</p>
              <p className="mt-1 text-sm text-green-800">
                Encontramos {companies[0].name}. Você pode continuar para os trabalhadores ou ir direto ao dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onDone} className="btn-primary text-sm">
                  Continuar →
                </button>
                <button type="button" onClick={onGoDashboard} className="btn-secondary text-sm">
                  Ir para dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {stuck ? (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
            <div>
              <p className="font-semibold text-yellow-900">Salvamento demorou demais</p>
              <p className="mt-1 text-sm text-yellow-800">
                Isso costuma acontecer quando o backend está acordando ou demorou para responder. A empresa pode ter sido criada.
              </p>
              {lastError && <p className="mt-2 text-xs text-yellow-800">{lastError}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={checkExistingCompanyAndContinue} className="btn-primary text-sm">
                  Verificar se criou
                </button>
                <button type="submit" className="btn-secondary text-sm">
                  <RefreshCcw className="h-4 w-4" />
                  Tentar novamente
                </button>
                <button type="button" onClick={onGoDashboard} className="btn-secondary text-sm">
                  Ir para dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : lastError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {lastError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <div>
          <label className="label">Razão social *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Alternative Ventures Ltda"
          />
        </div>

        <div>
          <label className="label">CNPJ *</label>
          <input
            className="input"
            required
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div>
          <label className="label">Setor de atividade</label>
          <input
            className="input"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            placeholder="Ex: comércio, escritório, clínica, indústria, restaurante"
          />
        </div>

        <div>
          <label className="label">
            CNAE principal <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            className="input"
            value={form.cnaeCode}
            onChange={(e) => setForm({ ...form, cnaeCode: e.target.value })}
            placeholder="Se souber, informe. Se não, deixe em branco."
          />
          <p className="mt-1 text-xs text-gray-400">
            O CNAE ajuda a sugerir riscos depois, mas não é necessário para começar.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Continuar →"
          )}
        </button>

        <button type="button" onClick={onGoDashboard} className="btn-secondary">
          Ir para dashboard
        </button>
      </div>
    </form>
  );
}

function Step2Employees({
  onDone,
  onBack,
  onGoDashboard,
}: {
  onDone: () => void;
  onBack: () => void;
  onGoDashboard: () => void;
}) {
  const { data: companies, isLoading } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const [list, setList] = useState([{ name: "", cpf: "", phone: "", role: "" }]);

  const bulk = trpc.employee.bulkCreate.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.created} funcionário(s) cadastrado(s)`);
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  const validEmployees = list.filter((employee) => employee.name && employee.cpf);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold">Passo 2 — Funcionários</h2>
        <p className="mt-3 text-sm text-gray-500">Carregando empresa...</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div>
        <h2 className="text-xl font-bold">Passo 2 — Funcionários</h2>
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
            <div>
              <p className="font-semibold text-yellow-900">Empresa ainda não encontrada</p>
              <p className="mt-1 text-sm text-yellow-800">
                Volte e tente salvar a empresa novamente, ou vá ao dashboard para verificar se ela já foi criada.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onBack} className="btn-primary text-sm">
                  ← Voltar para empresa
                </button>
                <button type="button" onClick={onGoDashboard} className="btn-secondary text-sm">
                  Ir para dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Passo 2 — Funcionários</h2>
      <p className="text-sm text-gray-500 mt-1">
        Adicione alguns funcionários agora ou pule esta etapa e complete depois no dashboard.
      </p>

      <div className="mt-6 space-y-3">
        {list.map((emp, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <input
              className="input"
              placeholder="Nome"
              value={emp.name}
              onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="input"
              placeholder="CPF"
              value={emp.cpf}
              onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, cpf: e.target.value } : x)))}
            />
            <input
              className="input"
              placeholder="WhatsApp"
              value={emp.phone}
              onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))}
            />
            <input
              className="input"
              placeholder="Cargo"
              value={emp.role}
              onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setList([...list, { name: "", cpf: "", phone: "", role: "" }])}
          className="btn-secondary text-sm"
        >
          + Adicionar linha
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={onBack} className="btn-secondary">
          ← Voltar
        </button>

        <button
          onClick={() => {
            if (!validEmployees.length) {
              onDone();
              return;
            }

            bulk.mutate(
              validEmployees.map((employee) => ({
                ...employee,
                companyId,
                phone: employee.phone || undefined,
                role: employee.role || undefined,
              })),
            );
          }}
          disabled={bulk.isPending}
          className="btn-primary"
        >
          {bulk.isPending ? "Salvando..." : validEmployees.length ? "Salvar e continuar →" : "Pular por enquanto →"}
        </button>
      </div>
    </div>
  );
}

function Step3Ready({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <Shield className="h-9 w-9 text-green-600" />
      </div>

      <h2 className="mt-4 text-2xl font-bold text-gray-900">Painel criado!</h2>
      <p className="mt-2 text-gray-600 max-w-xl mx-auto">
        Agora você pode completar a avaliação psicossocial, gerar achados, montar inventário, acompanhar ações
        e gerar documentos de evidência.
      </p>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">Avaliação</p>
          <p className="mt-1 text-sm text-gray-500">Colete respostas dos trabalhadores.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">Inventário</p>
          <p className="mt-1 text-sm text-gray-500">Mapeie riscos e plano de ação.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">Documentos</p>
          <p className="mt-1 text-sm text-gray-500">Gere evidências imprimíveis.</p>
        </div>
      </div>

      <button onClick={onFinish} className="btn-primary mt-6">
        Ir para dashboard →
      </button>
    </div>
  );
}
