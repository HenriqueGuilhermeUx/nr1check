import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Lock, CheckCircle2, Copy, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../../lib/trpc";

type Ctx = { employee: { companyId: number } };

const CATEGORIES = [
  { value: "assedio_moral", label: "Assédio moral" },
  { value: "assedio_sexual", label: "Assédio sexual" },
  { value: "discriminacao", label: "Discriminação" },
  { value: "violencia", label: "Violência" },
  { value: "burnout", label: "Burnout / esgotamento" },
  { value: "outros", label: "Outro" },
];

export function EmployeeComplaint() {
  const { employee } = useOutletContext<Ctx>();
  const [step, setStep] = useState<"form" | "tracking" | "submitted">("form");
  const [form, setForm] = useState({
    category: "",
    description: "",
    involvedDepartment: "",
  });
  const [protocol, setProtocol] = useState<{ number: string; tracking: string } | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [statusResult, setStatusResult] = useState<any>(null);

  const create = trpc.complaint.create.useMutation({
    onSuccess: (r) => {
      setProtocol({ number: r.protocolNumber, tracking: r.trackingCode });
      setStep("submitted");
    },
    onError: (err) => toast.error(err.message),
  });

  const status = trpc.complaint.status.useQuery(
    { protocolNumber: trackingInput },
    { enabled: false },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.description.length < 20) {
      toast.error("Descreva o caso com pelo menos 20 caracteres");
      return;
    }
    create.mutate({
      companyId: employee.companyId,
      category: form.category as any,
      description: form.description,
      involvedDepartment: form.involvedDepartment || undefined,
      attachmentUrls: [],
    });
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    status.refetch().then((r) => {
      if (r.data) setStatusResult(r.data);
      else toast.error("Protocolo não encontrado");
    });
  };

  if (step === "submitted" && protocol) {
    return <SubmittedView protocol={protocol} onTrackClick={() => setStep("tracking")} />;
  }

  if (step === "tracking") {
    return (
      <div>
        <Link to="/portal/denuncia" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          ← Voltar
        </Link>
        <div className="card">
          <h2 className="text-lg font-bold mb-2">Acompanhar denúncia</h2>
          <p className="text-sm text-gray-500 mb-4">Digite o número do protocolo (formato: NR1-2026-XXXXXXXX)</p>
          <form onSubmit={handleTrack} className="space-y-3">
            <input
              className="input"
              placeholder="NR1-2026-XXXXXXXX"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              required
            />
            <button type="submit" disabled={status.isFetching} className="btn-primary w-full">
              {status.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
            </button>
          </form>
          {statusResult && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50">
              <p className="text-sm">Status: <span className="font-semibold">{statusResult.status}</span></p>
              <p className="text-xs text-gray-500 mt-1">
                Criada em {new Date(statusResult.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-brand-600" />
          <h1 className="text-2xl font-bold">Denúncia anônima</h1>
        </div>
        <p className="text-sm text-gray-500">
          Sua identidade é 100% protegida. Você receberá um protocolo com código hash para acompanhar o status.
        </p>
      </div>

      <div className="card bg-brand-50 border-brand-200 mb-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-brand-800">
          <p className="font-semibold">Importante</p>
          <p className="mt-1">Sua empresa é obrigada por lei (Lei 15.377/2026) a manter este canal ativo e tratar as denúncias com sigilo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Categoria *</label>
          <select
            className="input"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Selecione...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Departamento envolvido (opcional)</label>
          <input
            className="input"
            placeholder="Ex: Vendas, TI, Operacional..."
            value={form.involvedDepartment}
            onChange={(e) => setForm({ ...form, involvedDepartment: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Descrição do caso *</label>
          <textarea
            className="input min-h-[160px]"
            required
            minLength={20}
            placeholder="Descreva o que aconteceu com o máximo de detalhes possível. Não inclua seu nome ou dados pessoais — a denúncia é anônima."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            {form.description.length} caracteres (mínimo 20)
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep("tracking")} className="btn-secondary">
            Já tem um protocolo? Acompanhar
          </button>
          <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar denúncia"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SubmittedView({ protocol, onTrackClick }: { protocol: { number: string; tracking: string }; onTrackClick: () => void }) {
  const copy = () => {
    navigator.clipboard.writeText(protocol.number);
    toast.success("Protocolo copiado!");
  };

  return (
    <div className="card text-center py-12">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-9 w-9 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold mt-4">Denúncia registrada</h1>
      <p className="text-gray-500 mt-2 max-w-md mx-auto">
        Sua denúncia foi registrada de forma anônima. Guarde o protocolo abaixo para acompanhar o andamento.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-brand-200 bg-brand-50 px-4 py-3">
        <code className="text-lg font-mono font-bold text-brand-700">{protocol.number}</code>
        <button onClick={copy} className="text-brand-600 hover:text-brand-700" title="Copiar">
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <button onClick={onTrackClick} className="btn-secondary">Acompanhar status</button>
        <Link to="/portal" className="btn-primary">Voltar ao portal</Link>
      </div>

      <p className="mt-6 text-xs text-gray-400 max-w-md mx-auto">
        A empresa tem prazo legal para apurar e responder. Você pode voltar a esta página a qualquer momento para checar o status usando o protocolo.
      </p>
    </div>
  );
}
