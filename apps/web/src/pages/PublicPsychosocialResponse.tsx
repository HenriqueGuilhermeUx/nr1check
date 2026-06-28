import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

const SCALE_LABELS = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

function getNumberParam(name: string) {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function PublicPsychosocialResponse() {
  const companyId = getNumberParam("companyId");
  const cycleId = getNumberParam("cycleId");
  const employeeId = getNumberParam("employeeId");

  const { data: questions, isLoading } = trpc.assessment.questions.useQuery();

  const submit = trpc.assessment.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Avaliação enviada. Obrigado por contribuir.");
    },
    onError: (error) => toast.error(error.message),
  });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const questionList = questions ?? [];

  const grouped = useMemo(() => {
    const map: Record<string, typeof questionList> = {};
    for (const question of questionList) {
      const dimension = question.dimension || "Perguntas";
      if (!map[dimension]) map[dimension] = [];
      map[dimension].push(question);
    }
    return map;
  }, [questionList]);

  const dimensions = Object.keys(grouped);
  const currentDimension = dimensions[step];
  const currentQuestions = grouped[currentDimension] ?? [];
  const progress = dimensions.length ? Math.round(((step + 1) / dimensions.length) * 100) : 0;
  const allAnsweredInStep = currentQuestions.every((question) => answers[String(question.id)] !== undefined);
  const allAnswered = questionList.length > 0 && Object.keys(answers).length >= questionList.length;

  function handleSubmit() {
    if (!companyId || !cycleId || !employeeId) {
      toast.error("Link incompleto. Solicite um novo link à empresa.");
      return;
    }

    if (!allAnswered) {
      toast.error("Responda todas as perguntas antes de enviar.");
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
        <div className="card max-w-xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Link incompleto</h1>
          <p className="mt-2 text-gray-500">
            Este link precisa conter empresa, ciclo e trabalhador. Solicite um novo link ao RH ou responsável pela avaliação.
          </p>
        </div>
      </PublicShell>
    );
  }

  if (submitted) {
    return (
      <PublicShell>
        <div className="card max-w-xl mx-auto text-center py-12">
          <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Avaliação enviada</h1>
          <p className="mt-2 text-gray-500">
            Obrigado por contribuir. A empresa deve usar os resultados de forma agregada para identificar fatores psicossociais e criar ações de melhoria.
          </p>
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
            <div className="flex gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-brand-700" />
              <p className="text-sm text-brand-800">
                Suas respostas ajudam a compor a análise coletiva. O foco é entender fatores de trabalho,
                não expor pessoas individualmente.
              </p>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (isLoading) {
    return (
      <PublicShell>
        <div className="card max-w-xl mx-auto text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
          <p className="mt-3 text-gray-500">Carregando avaliação...</p>
        </div>
      </PublicShell>
    );
  }

  if (!questionList.length) {
    return (
      <PublicShell>
        <div className="card max-w-xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Nenhuma pergunta disponível</h1>
          <p className="mt-2 text-gray-500">
            A empresa ainda não ativou as perguntas da avaliação psicossocial.
          </p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-brand-700" />
            <div>
              <p className="font-semibold text-brand-900">Avaliação psicossocial NR-1</p>
              <p className="mt-1 text-sm text-brand-800">
                Responda com sinceridade. A finalidade é identificar fatores psicossociais do trabalho e orientar ações de melhoria.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avaliação Psicossocial Base</h1>
              <p className="mt-1 text-sm text-gray-500">
                {questionList.length} perguntas · {dimensions.length} dimensões · resposta individual protegida
              </p>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
              {progress}% concluído
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>{currentDimension}</span>
              <span>{step + 1} de {dimensions.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">{currentDimension}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Escolha a alternativa que mais representa sua experiência no trabalho.
            </p>

            <div className="mt-6 space-y-6">
              {currentQuestions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {index + 1}. {question.text}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {SCALE_LABELS.map((label, value) => (
                      <button
                        key={label}
                        onClick={() => setAnswers((current) => ({ ...current, [String(question.id)]: value }))}
                        className={`rounded-lg border-2 px-3 py-3 text-xs font-semibold transition ${
                          answers[String(question.id)] === value
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="btn-secondary disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              {step < dimensions.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!allAnsweredInStep}
                  className="btn-primary disabled:opacity-50"
                >
                  Próxima dimensão
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
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
        </div>
      </div>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">NR1Check</p>
            <p className="text-xs text-gray-500">Avaliação psicossocial</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
