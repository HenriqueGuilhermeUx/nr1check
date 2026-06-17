import { useState, useMemo } from "react";
import { useOutletContext, useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle2, Award, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../../lib/trpc";

type Ctx = { employee: { id: number; companyId: number } };

type Module = {
  id: number;
  courseId: number;
  order: number;
  type: "text" | "quiz";
  title: string | null;
  content: string;
};

export function EmployeeCoursePlayer() {
  const { id } = useParams();
  const courseId = Number(id);
  const navigate = useNavigate();
  const { employee } = useOutletContext<Ctx>();
  const { data: course, isLoading } = trpc.course.byId.useQuery({ id: courseId });
  const { data: progress } = trpc.course.myProgress.useQuery({
    employeeId: employee.id,
    courseId,
  });
  const updateProgress = trpc.course.updateProgress.useMutation({
    onSuccess: () => toast.success("Progresso salvo!"),
    onError: (err) => toast.error(err.message),
  });

  const [moduleIdx, setModuleIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const modules: Module[] = useMemo(() => course?.modules ?? [], [course]);
  const currentModule = modules[moduleIdx];
  const completedSet = new Set(progress?.completedModules ?? []);
  const isLast = moduleIdx === modules.length - 1;

  if (isLoading) return <div className="card text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-600" /></div>;
  if (!course || !currentModule) return <div className="card text-center py-12 text-gray-500">Curso não encontrado.</div>;

  const handleAdvance = (quizScore?: number) => {
    updateProgress.mutate({
      employeeId: employee.id,
      courseId,
      companyId: employee.companyId,
      moduleId: currentModule.id,
      quizScore,
    });
    if (isLast) {
      toast.success("🎉 Curso concluído!");
      navigate("/portal/cursos");
    } else {
      setModuleIdx(moduleIdx + 1);
      setQuizAnswer(null);
      setShowResult(false);
    }
  };

  const renderContent = () => {
    if (currentModule.type === "text") {
      // Markdown simples (renderizado por quebras de parágrafo)
      return (
        <div className="prose prose-sm max-w-none">
          {currentModule.content.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h2>;
            if (line.startsWith("## ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h3>;
            if (line.startsWith("- ")) return <li key={i} className="ml-4">{line.slice(2)}</li>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="my-2 text-gray-700 leading-relaxed">{line}</p>;
          })}
        </div>
      );
    }
    // Quiz
    let quiz: { question: string; options: string[]; answer: number };
    try {
      quiz = JSON.parse(currentModule.content);
    } catch {
      return <p>Quiz inválido.</p>;
    }
    const isCorrect = quizAnswer === quiz.answer;
    return (
      <div>
        <p className="text-lg font-medium mb-6">{quiz.question}</p>
        <div className="space-y-3">
          {quiz.options.map((opt, i) => {
            let cls = "border-gray-200 hover:border-gray-300";
            if (showResult) {
              if (i === quiz.answer) cls = "border-green-500 bg-green-50";
              else if (i === quizAnswer) cls = "border-red-500 bg-red-50";
            } else if (quizAnswer === i) {
              cls = "border-brand-600 bg-brand-50";
            }
            return (
              <button
                key={i}
                onClick={() => !showResult && setQuizAnswer(i)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${cls} disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    showResult && i === quiz.answer ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                    {showResult && i === quiz.answer && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-sm">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {showResult && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <p className="text-sm font-semibold">{isCorrect ? "✓ Resposta correta!" : "✗ Resposta incorreta"}</p>
            <p className="text-xs mt-1">{isCorrect ? "Você pode prosseguir." : "A resposta correta está destacada em verde."}</p>
          </div>
        )}
      </div>
    );
  };

  const handleQuizSubmit = () => {
    if (quizAnswer === null) {
      toast.error("Selecione uma alternativa");
      return;
    }
    setShowResult(true);
    const quiz = JSON.parse(currentModule.content);
    const score = quizAnswer === quiz.answer ? 100 : 0;
    // Avança após 1.5s
    setTimeout(() => handleAdvance(score), 1500);
  };

  return (
    <div>
      <Link to="/portal/cursos" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
        <ChevronLeft className="h-4 w-4" /> Voltar aos cursos
      </Link>

      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500">{course.title} · Módulo {moduleIdx + 1}/{modules.length}</p>
          {completedSet.has(currentModule.id) && (
            <span className="badge badge-green"><CheckCircle2 className="h-3 w-3" /> Concluído</span>
          )}
        </div>
        <h1 className="text-xl font-bold mb-4">{currentModule.title}</h1>

        {renderContent()}

        <div className="mt-6 pt-6 border-t flex justify-between">
          <button
            onClick={() => setModuleIdx(Math.max(0, moduleIdx - 1))}
            disabled={moduleIdx === 0}
            className="btn-secondary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          {currentModule.type === "text" ? (
            <button onClick={() => handleAdvance()} className="btn-primary">
              {isLast ? "Finalizar curso" : "Próximo"} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleQuizSubmit} disabled={showResult} className="btn-primary disabled:opacity-50">
              {showResult ? "Avançando..." : "Confirmar resposta"}
            </button>
          )}
        </div>
      </div>

      {isLast && completedSet.has(currentModule.id) && (
        <div className="card mt-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Curso concluído!</p>
              <p className="text-xs text-green-700">Seu certificado foi gerado e está disponível no Painel do Gestor.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
