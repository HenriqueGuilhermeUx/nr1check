import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const SCALE_LABELS = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

function numberParam(name: string) {
  const value = new URLSearchParams(window.location.search).get(name);
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function PublicPsychosocialResponse() {
  const companyId = numberParam("companyId");
  const cycleId = numberParam("cycleId");
  const employeeId = numberParam("employeeId");

  const { data: questions, isLoading } = trpc.assessment.questions.useQuery();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, typeof questions> = {};
    (questions ?? []).forEach((question) => {
      if (!map[question.dimension]) map[question.dimension] = [];
      map[question.dimension]!.push(question);
    });
    return map;
  }, [questions]);

  const dimensions = Object.keys(grouped);
  const currentDimension = dimensions[step];
  const currentQuestions = currentDimension ? grouped[currentDimension] ?? [] : [];
  const progress = dimensions.length ? Math.round(((step + 1) / dimensions.length) * 100) : 0;
  const allAnsweredInStep = currentQuestions.every((question) => answers[question.id] !== undefined);
  const allAnswered = questions?.length ? Object.keys(answers).length >= questions.length : false;

  const submit = trpc.assessment.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Avaliação enviada com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });

  function handleSubmit() {
    if (!companyId || !cycleId || !employeeId) {
      toast.error("Link inválido. Solicite um novo link à sua empresa.");
      return;
    }

    submit.mutate({
      cycleId,
      employeeId,
      departmentId: undefined,
      answers,
    });
  }

  if (!companyId || !cycleId || !employeeId) {
    return (
      <PublicShell>
        <div className="card text-center py-12">
          <h1 className="text-xl font-bold text-gray-900">Link de avaliação inválido</h1>
          <p className="mt-2 text-sm text-gray-500">
            Este link precisa conter empresa, ciclo de avaliação e trabalhador. Solicite o link correto à sua empresa.
          </p>
        </div>
      </PublicShell>
    );
  }

  if (isLoading) {
    return (
      <PublicShell>
        <div className="card text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-600" />
          <p className="mt-3 text-sm text-gray-500">Carregando avaliação...</p>
        </div>
      </PublicShell>
    );
  }

  if (!questions?.length) {
    return (
      <PublicShell>
        <div className="card text-center py-12">
          <h1 className="text-xl font-bold text-gray-900">Questionário ainda não configurado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sua empresa ainda não possui perguntas ativas para esta avaliação.
          </p>
        </div>
      </PublicShell>
    );
  }

  if (submitted) {
    return (
      <PublicShell>
        <div className="card text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Resposta registrada</h1>
          <p className="mt-2 text-gray-500">
            Obrigado. Suas respostas serão usadas de forma agregada para mapear riscos psicossociais e orientar ações de melhoria.
          </p>
          <p className="mt-6 text-xs text-gray-400">
            O NR1Check não apresenta diagnóstico individual ao empregador. O objetivo é apoiar a gestão coletiva dos fatores de risco do trabalho.
          </p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Avaliação psicossocial NR-1
        </span>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Responda com sinceridade</h1>
        <p className="mt-2 text-sm text-gray-500">
          São {questions.length} perguntas. As respostas apoiam a identificação de fatores psicossociais relacionados ao trabalho.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">{currentDimension}</h2>
        <p className="mt-1 text-xs text-gray-500">
          Escolha a alternativa que melhor representa sua experiência recente no trabalho.
        </p>

        <div className="mt-6 space-y-6">
          {currentQuestions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {question.text}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {SCALE_LABELS.map((label, value) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))}
                    className={`rounded-lg border-2 px-2 py-3 text-xs font-medium transition ${
                      answers[question.id] === value
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

        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {step < dimensions.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!allAnsweredInStep}
              className="btn-primary disabled:opacity-50"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submit.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Enviar avaliação
            </button>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">NR1Check</span>
        </div>
        {children}
      </div>
    </div>
  );
}
