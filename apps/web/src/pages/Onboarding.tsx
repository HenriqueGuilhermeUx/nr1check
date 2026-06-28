import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, FileCheck, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Funcionários", icon: Users },
  { id: 3, title: "Painel", icon: FileCheck },
];

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
          {step === 1 && <Step1Company onDone={() => setStep(2)} />}
          {step === 2 && <Step2Employees onDone={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3Ready onFinish={() => navigate("/dashboard")} />}
        </div>
      </div>
    </div>
  );
}

function Step1Company({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    sector: "",
    cnaeCode: "",
  });

  const create = trpc.company.create.useMutation({
    onSuccess: () => {
      toast.success("Empresa cadastrada!");
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({
          name: form.name,
          cnpj: form.cnpj,
          sector: form.sector || undefined,
          cnaeCode: form.cnaeCode || undefined,
          type: "empresa",
          size: "micro",
        });
      }}
    >
      <h2 className="text-xl font-bold">Passo 1 — Dados básicos da empresa</h2>
      <p className="text-sm text-gray-500 mt-1">
        Informe o mínimo para criar o painel. CNAE e dados complementares podem ser preenchidos depois.
      </p>

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

      <button type="submit" disabled={create.isPending} className="btn-primary mt-6">
        {create.isPending ? "Salvando..." : "Continuar →"}
      </button>
    </form>
  );
}

function Step2Employees({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { data: companies } = trpc.company.my.useQuery();
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

            if (!companyId) {
              toast.error("Cadastre a empresa antes de adicionar funcionários.");
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
        Agora você pode completar o inventário de riscos, enviar a avaliação psicossocial, registrar evidências
        e gerar documentos da NR-1 dentro do dashboard.
      </p>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">Inventário</p>
          <p className="mt-1 text-sm text-gray-500">Mapeie riscos por setor e função.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">Avaliação</p>
          <p className="mt-1 text-sm text-gray-500">Colete respostas dos trabalhadores.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900">PGR</p>
          <p className="mt-1 text-sm text-gray-500">Gere documentos e plano de ação.</p>
        </div>
      </div>

      <button onClick={onFinish} className="btn-primary mt-6">
        Ir para dashboard →
      </button>
    </div>
  );
}
