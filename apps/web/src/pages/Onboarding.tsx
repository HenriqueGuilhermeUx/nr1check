import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCheck,
  Loader2,
  RefreshCcw,
  Shield,
  Store,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const STEPS = [
  { id: 1, title: "Modo", icon: Users },
  { id: 2, title: "Empresa", icon: Building2 },
  { id: 3, title: "Pronto", icon: FileCheck },
];

type UserMode = "empresa" | "contador";

function cleanDocument(value: string) {
  return value.replace(/\D/g, "");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Não foi possível salvar. Tente novamente.";
}

function isDuplicateCompanyError(message: string) {
  const text = message.toLowerCase();
  return text.includes("já existe") || text.includes("ja existe") || text.includes("already") || text.includes("duplicate") || text.includes("conflict");
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<UserMode>(() => window.localStorage.getItem("nr1check:user-mode") === "contador" ? "contador" : "empresa");

  function chooseMode(nextMode: UserMode) {
    setMode(nextMode);
    window.localStorage.setItem("nr1check:user-mode", nextMode);
    setStep(2);
  }

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
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500 hover:text-gray-700">Ir para dashboard →</button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Vamos organizar a NR-1 em poucos passos</h1>
        <p className="text-gray-600 mt-1">Sem termos difíceis. Primeiro diga se é para sua empresa ou para um cliente.</p>

        <ol className="mt-8 flex items-center w-full">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "w-full" : ""}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= s.id ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300 text-gray-400"}`}>
                <s.icon className="w-5 h-5" />
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-brand-600" : "bg-gray-200"}`} />}
            </li>
          ))}
        </ol>

        <div className="mt-10 card">
          {step === 1 && <StepMode onChoose={chooseMode} />}
          {step === 2 && <StepCompany mode={mode} onBack={() => setStep(1)} onDone={() => setStep(3)} onGoDashboard={() => navigate(mode === "contador" ? "/clientes" : "/dashboard")} />}
          {step === 3 && <StepReady mode={mode} onFinish={() => navigate(mode === "contador" ? "/clientes" : "/dashboard")} />}
        </div>
      </div>
    </div>
  );
}

function StepMode({ onChoose }: { onChoose: (mode: UserMode) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Você vai usar para quem?</h2>
      <p className="mt-1 text-sm text-gray-500">Escolha o caminho mais parecido com a sua realidade.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <button onClick={() => onChoose("empresa")} className="rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-brand-300 hover:bg-brand-50 transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Store className="h-6 w-6" /></div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">Sou dono/RH da empresa</h3>
          <p className="mt-2 text-sm text-gray-600">Para comércio, restaurante, escritório, clínica, salão ou qualquer empresa pequena/média.</p>
          <p className="mt-4 text-sm font-semibold text-brand-700">Começar minha empresa →</p>
        </button>

        <button onClick={() => onChoose("contador")} className="rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-brand-300 hover:bg-brand-50 transition">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Users className="h-6 w-6" /></div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">Sou contador/consultor</h3>
          <p className="mt-2 text-sm text-gray-600">Para cadastrar clientes, acompanhar empresas e vender a organização da NR-1 como serviço.</p>
          <p className="mt-4 text-sm font-semibold text-brand-700">Cadastrar primeiro cliente →</p>
        </button>
      </div>
    </div>
  );
}

function StepCompany({ mode, onBack, onDone, onGoDashboard }: { mode: UserMode; onBack: () => void; onDone: () => void; onGoDashboard: () => void }) {
  const utils = trpc.useUtils();
  const { data: companies, isLoading: loadingCompanies, refetch } = trpc.company.my.useQuery(undefined, { retry: 1 });
  const [form, setForm] = useState({ name: "", cnpj: "", sector: "", cnaeCode: "" });
  const [saving, setSaving] = useState(false);
  const [slow, setSlow] = useState(false);
  const [lastError, setLastError] = useState("");
  const create = trpc.company.create.useMutation();

  useEffect(() => {
    let timer: number | undefined;
    if (saving) timer = window.setTimeout(() => setSlow(true), 10000);
    return () => { if (timer) window.clearTimeout(timer); };
  }, [saving]);

  async function checkExistingCompanyAndContinue() {
    setLastError("");
    const result = await refetch();
    const company = result.data?.[0];
    if (company) {
      toast.success("Empresa encontrada. Vamos continuar.");
      onDone();
      return;
    }
    toast.error("Ainda não encontrei empresa para esta conta.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLastError("");
    setSlow(false);
    const cnpj = cleanDocument(form.cnpj);

    if (!form.name.trim()) {
      toast.error(mode === "contador" ? "Informe o nome do cliente." : "Informe o nome da empresa.");
      return;
    }
    if (cnpj.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos.");
      return;
    }

    setSaving(true);
    try {
      const saved = await create.mutateAsync({
        name: form.name.trim(),
        cnpj,
        sector: form.sector.trim() || undefined,
        cnaeCode: form.cnaeCode.trim() || undefined,
        type: "empresa",
        size: "micro",
      });
      await utils.company.my.invalidate();
      window.localStorage.setItem("nr1check:selected-company-id", String(saved.id));
      window.localStorage.setItem("nr1check:user-mode", mode);
      toast.success(`${mode === "contador" ? "Cliente" : "Empresa"} cadastrado com sucesso!`);
      onDone();
    } catch (error) {
      const message = getErrorMessage(error);
      if (isDuplicateCompanyError(message)) {
        setLastError("Já existe uma empresa com este CNPJ. Para teste, use outro CNPJ. Para produção, entre com a conta que cadastrou essa empresa.");
        toast.error("CNPJ já cadastrado.");
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{mode === "contador" ? "Cadastre o primeiro cliente" : "Cadastre sua empresa"}</h2>
          <p className="text-sm text-gray-500 mt-1">Coloque só o básico agora. O resto pode ser preenchido depois.</p>
        </div>
        <button type="button" onClick={onBack} className="btn-secondary text-sm">Trocar modo</button>
      </div>

      {loadingCompanies && <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-sm text-gray-600">Conferindo sua conta...</p></div>}

      {mode === "contador" && companies?.length ? (
        <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="font-semibold text-brand-900">Você já tem {companies.length} cliente(s) cadastrado(s).</p>
          <p className="mt-1 text-sm text-brand-800">Pode cadastrar outro cliente agora ou voltar para a lista.</p>
          <button type="button" onClick={onGoDashboard} className="btn-secondary mt-3 text-sm">Ver meus clientes</button>
        </div>
      ) : null}

      {slow && (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
            <div>
              <p className="font-semibold text-yellow-900">Backend demorando para responder</p>
              <p className="mt-1 text-sm text-yellow-800">Aguarde mais alguns segundos. Isso pode acontecer quando o Render ou o banco está acordando.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={checkExistingCompanyAndContinue} className="btn-primary text-sm">Verificar se criou</button>
                <button type="button" onClick={() => { setSaving(false); setSlow(false); setLastError(""); }} className="btn-secondary text-sm">
                  <RefreshCcw className="h-4 w-4" /> Liberar tentativa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lastError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{lastError}</div>}

      <div className="mt-6 grid gap-4">
        <div>
          <label className="label">{mode === "contador" ? "Nome da empresa cliente *" : "Nome da empresa *"}</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={mode === "contador" ? "Ex: Padaria do João" : "Ex: Alternative Ventures Ltda"} disabled={saving} />
        </div>
        <div>
          <label className="label">CNPJ *</label>
          <input className="input" required value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" disabled={saving} />
        </div>
        <div>
          <label className="label">Tipo de negócio</label>
          <input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Ex: bar, restaurante, salão, loja, clínica, escritório" disabled={saving} />
        </div>
        <div>
          <label className="label">CNAE principal <span className="text-gray-400">(opcional)</span></label>
          <input className="input" value={form.cnaeCode} onChange={(e) => setForm({ ...form, cnaeCode: e.target.value })} placeholder="Se souber, informe. Se não, deixe em branco." disabled={saving} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={saving || loadingCompanies} className="btn-primary">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : mode === "contador" ? "Salvar cliente →" : "Salvar empresa →"}
        </button>
        <button type="button" onClick={onGoDashboard} className="btn-secondary">{mode === "contador" ? "Ver clientes" : "Ir para dashboard"}</button>
      </div>
    </form>
  );
}

function StepReady({ mode, onFinish }: { mode: UserMode; onFinish: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-9 w-9 text-green-600" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">{mode === "contador" ? "Cliente cadastrado!" : "Empresa cadastrada!"}</h2>
      <p className="mt-2 text-gray-600 max-w-xl mx-auto">Agora o próximo passo é cadastrar trabalhadores e enviar a avaliação psicossocial.</p>
      <button onClick={onFinish} className="btn-primary mt-6">{mode === "contador" ? "Ir para clientes →" : "Ir para dashboard →"}</button>
    </div>
  );
}
