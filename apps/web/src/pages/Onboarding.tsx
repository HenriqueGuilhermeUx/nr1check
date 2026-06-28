import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Building2, Users, FileCheck, Send, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const STEPS = [
  { id: 1, title: "Cadastre sua empresa", icon: Building2 },
  { id: 2, title: "Adicione funcionários", icon: Users },
  { id: 3, title: "Gere documentos", icon: FileCheck },
  { id: 4, title: "Envie a pesquisa", icon: Send },
  { id: 5, title: "Monitore o painel", icon: Shield },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
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
            Pular para dashboard →
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Vamos configurar sua empresa</h1>
        <p className="text-gray-600 mt-1">Comece em poucos passos. Você pode completar os detalhes depois.</p>

        {/* Stepper */}
        <ol className="mt-8 flex items-center w-full">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "w-full" : ""}`}>
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s.id ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300 text-gray-400"
                }`}
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
          {step === 3 && <Step3Documents onDone={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step4Survey onDone={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <Step5Panel onFinish={() => navigate("/dashboard")} />}
        </div>
      </div>
    </div>
  );
}

function Step1Company({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", cnpj: "", sector: "", cnaeCode: "" });
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
        create.mutate({ ...form, type: "empresa", size: "micro" });
      }}
    >
      <h2 className="text-xl font-bold">Passo 1 — Sua empresa</h2>
      <p className="text-sm text-gray-500 mt-1">
  Informe os dados básicos da empresa. Se não souber o CNAE agora, tudo bem.
</p>
      <div className="mt-6 grid gap-4">
        <div>
          <label className="label">Razão social *</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">CNPJ *</label>
          <input className="input" required value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
        </div>
        <div>
          <label className="label">Setor de atividade</label>
          <input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Comércio varejista" />
        </div>
        <div>
          <label className="label">CNAE principal <span className="text-gray-400">(opcional)</span></label>
<input
  className="input"
  value={form.cnaeCode}
  onChange={(e) => setForm({ ...form, cnaeCode: e.target.value })}
  placeholder="Se souber, informe. Se não, deixe em branco."
/>
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

  return (
    <div>
      <h2 className="text-xl font-bold">Passo 2 — Funcionários</h2>
      <p className="text-sm text-gray-500 mt-1">Eles acessarão pelo CPF + código no WhatsApp (sem senha).</p>
      <div className="mt-6 space-y-3">
        {list.map((emp, i) => (
          <div key={i} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <input className="input" placeholder="Nome" value={emp.name} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input className="input" placeholder="CPF" value={emp.cpf} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, cpf: e.target.value } : x))} />
            <input className="input" placeholder="WhatsApp" value={emp.phone} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
            <input className="input" placeholder="Cargo" value={emp.role} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
          </div>
        ))}
        <button type="button" onClick={() => setList([...list, { name: "", cpf: "", phone: "", role: "" }])} className="btn-secondary text-sm">
          + Adicionar linha
        </button>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Voltar</button>
        <button
          onClick={() => companyId && bulk.mutate(list.filter(e => e.name && e.cpf).map(e => ({ ...e, companyId, cpf: e.cpf, phone: e.phone })))}
          disabled={bulk.isPending}
          className="btn-primary"
        >
          {bulk.isPending ? "Salvando..." : "Continuar →"}
        </button>
      </div>
    </div>
  );
}

function Step3Documents({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const [jobTitle, setJobTitle] = useState("");
  const [activities, setActivities] = useState("");
  const generate = trpc.compliance.serviceOrder.generate.useMutation({
    onSuccess: () => {
      toast.success("Ordem de Serviço gerada!");
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <h2 className="text-xl font-bold">Passo 3 — Documentos iniciais</h2>
      <p className="text-sm text-gray-500 mt-1">Vamos gerar Ordens de Serviço para cada função da sua empresa.</p>
      <div className="mt-6 space-y-3">
        <div>
          <label className="label">Função / cargo</label>
          <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Atendente de loja" />
        </div>
        <div>
          <label className="label">Atividades principais</label>
          <textarea className="input min-h-[100px]" value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="Descreva o que esse profissional faz no dia a dia..." />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Voltar</button>
        <button
          onClick={() => companyId && generate.mutate({ companyId, jobTitle, mainActivities: activities })}
          disabled={!jobTitle || !activities || generate.isPending}
          className="btn-primary"
        >
          {generate.isPending ? "Gerando..." : "Gerar OS + Continuar →"}
        </button>
      </div>
    </div>
  );
}

function Step4Survey({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const [name, setName] = useState("Avaliação inicial");
  const create = trpc.assessment.createCycle.useMutation({
    onSuccess: (r) => {
      toast.success(`Pesquisa criada! ${r.whatsappSent} WhatsApp enviados.`);
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <h2 className="text-xl font-bold">Passo 4 — Pesquisa COPSOQ</h2>
      <p className="text-sm text-gray-500 mt-1">A pesquisa será enviada por WhatsApp para todos os funcionários. Leva 5 minutos para responder.</p>
      <div className="mt-6">
        <label className="label">Nome do ciclo</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Voltar</button>
        <button
          onClick={() => companyId && create.mutate({ companyId, name })}
          disabled={create.isPending}
          className="btn-primary"
        >
          {create.isPending ? "Enviando..." : "Enviar pesquisa + Continuar →"}
        </button>
      </div>
    </div>
  );
}

function Step5Panel({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <Shield className="h-9 w-9 text-green-600" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Tudo configurado!</h2>
      <p className="mt-2 text-gray-600">Sua empresa está pronta. Acesse o Painel de Defesa para acompanhar sua proteção em tempo real.</p>
      <button onClick={onFinish} className="btn-primary mt-6">
        Ver Painel de Defesa →
      </button>
    </div>
  );
}
