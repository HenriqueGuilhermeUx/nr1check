import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../../lib/trpc";

type Ctx = {
  employee: { id: number; name: string; companyId: number };
};

const SCALE_LABELS = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

export function EmployeeAssessment() {
  const { employee } = useOutletContext<Ctx>();
  const { data: questions, isLoading } = trpc.assessment.questions.useQuery();
  const submit = trpc.assessment.submitResponse.useMutation({
    onSuccess: (r) => {
      toast.success("Pesquisa enviada! Obrigado por contribuir com a saúde no trabalho.");
      setSubmitted(r.riskLevel);
    },
    onError: (err) => toast.error(err.message),
  });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<string | null>(null);

  // Pega ciclo ativo automaticamente; URL param sobrescreve
  const { data: activeCycle } = trpc.assessment.activeCycle.useQuery(
    { companyId: employee.companyId },
    { enabled: !!employee.companyId },
  );
  const [cycleIdOverride, setCycleIdOverride] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("cycleId");
    return cid ? Number(cid) : null;
  });
  const cycleId = cycleIdOverride ?? activeCycle?.id ?? null;

  if (isLoading) {
    return <div className="card text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-600" /></div>;
  }

  if (submitted) {
    return <SubmittedView riskLevel={submitted} />;
  }

  if (!questions?.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Nenhuma pesquisa disponível no momento.</p>
      </div>
    );
  }

  if (!cycleId) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-lg font-semibold mb-2">Nenhum ciclo ativo</h2>
        <p className="text-sm text-gray-500">
          Sua empresa ainda não abriu um ciclo de avaliação. Volte mais tarde ou avise o RH.
        </p>
      </div>
    );
  }

  // Agrupa por dimensão
  const grouped = useMemo(() => {
    const map: Record<string, typeof questions> = {};
    questions.forEach((q) => {
      if (!map[q.dimension]) map[q.dimension] = [];
      map[q.dimension].push(q);
    });
    return map;
  }, [questions]);

  const dimensions = Object.keys(grouped);
  const currentDimension = dimensions[step];
  const currentQuestions = grouped[currentDimension] || [];
  const progress = ((step + 1) / dimensions.length) * 100;
  const allAnsweredInStep = currentQuestions.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = () => {
    if (!cycleId) {
      toast.error("Pesquisa sem ciclo definido. Acesse pelo link enviado pela sua empresa.");
      return;
    }
    submit.mutate({
      cycleId,
      employeeId: employee.id,
      departmentId: undefined,
      answers,
    });
  };
  // cycleIdOverride é apenas para uso futuro (ex: gestor envia link direto)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pesquisa COPSOQ II-Br</h1>
      <p className="text-sm text-gray-500 mb-6">
        {questions.length} questões · 8 dimensões · ~5 min · 100% confidencial
      </p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-1">{currentDimension}</h2>
        <p className="text-xs text-gray-500 mb-4">
          Questão {currentQuestions.findIndex(q => answers[q.id] === undefined) + 1} de {currentQuestions.length}
        </p>

        <div className="space-y-6">
          {currentQuestions.map((q, i) => (
            <div key={q.id} className="border-b last:border-0 pb-6 last:pb-0">
              <p className="text-sm font-medium text-gray-900 mb-3">
                {i + 1}. {q.text}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SCALE_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(q.id, idx)}
                    className={`px-2 py-3 rounded-lg border-2 text-xs font-medium transition ${
                      answers[q.id] === idx
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          {step < dimensions.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!allAnsweredInStep}
              className="btn-primary disabled:opacity-50"
            >
              Próxima dimensão <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnsweredInStep || Object.keys(answers).length < questions.length || submit.isPending}
              className="btn-primary"
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Enviar pesquisa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmittedView({ riskLevel }: { riskLevel: string }) {
  const colorMap: Record<string, { bg: string; text: string; label: string; description: string }> = {
    baixo: { bg: "bg-green-50", text: "text-green-700", label: "Baixo risco", description: "Os indicadores de risco psicossocial estão em níveis saudáveis." },
    medio: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Risco moderado", description: "Há alguns pontos de atenção. Sua empresa está trabalhando para melhorá-los." },
    alto: { bg: "bg-orange-50", text: "text-orange-700", label: "Risco elevado", description: "A empresa está tomando ações para reduzir esses riscos." },
    critico: { bg: "bg-red-50", text: "text-red-700", label: "Risco crítico", description: "A empresa está ciente e priorizando ações imediatas." },
  };
  const c = colorMap[riskLevel] ?? colorMap.medio;
  return (
    <div className="card text-center py-12">
      <CheckCircle2 className="h-12 w-12 text-brand-600 mx-auto" />
      <h1 className="text-2xl font-bold mt-4">Pesquisa enviada com sucesso!</h1>
      <p className="text-gray-500 mt-2">Suas respostas foram registradas de forma anônima.</p>
      <div className={`mt-6 inline-block rounded-xl px-6 py-4 ${c.bg}`}>
        <p className={`text-sm font-semibold ${c.text}`}>Sua avaliação: {c.label}</p>
        <p className="text-xs text-gray-600 mt-1 max-w-xs">{c.description}</p>
      </div>
      <p className="mt-6 text-xs text-gray-400">
        Você pode fechar esta página. O resultado individual é confidencial e protegido pela LGPD.
      </p>
    </div>
  );
}
