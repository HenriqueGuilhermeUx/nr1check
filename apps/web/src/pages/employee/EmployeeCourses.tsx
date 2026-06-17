import { useOutletContext, Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Loader2, Play } from "lucide-react";
import { trpc } from "../../lib/trpc";

type Ctx = { employee: { id: number; companyId: number } };

export function EmployeeCourses() {
  const { employee } = useOutletContext<Ctx>();
  const { data: courses, isLoading } = trpc.course.list.useQuery({ companyId: employee.companyId });

  if (isLoading) return <div className="card text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Cursos obrigatórios NR-1</h1>
      <p className="text-sm text-gray-500 mb-6">4 cursos de micro-learning · ~110 min no total</p>

      <div className="space-y-3">
        {courses?.map((c) => (
          <CourseCard key={c.id} course={c} employeeId={employee.id} />
        ))}
        {!courses?.length && (
          <div className="card text-center py-12 text-gray-500">Nenhum curso disponível no momento.</div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, employeeId }: any) {
  const { data: progress } = trpc.course.myProgress.useQuery({
    employeeId,
    courseId: course.id,
  });

  const status = progress?.status ?? "nao_iniciado";
  const statusMap = {
    nao_iniciado: { label: "Não iniciado", class: "badge" },
    em_andamento: { label: "Em andamento", class: "badge badge-yellow" },
    concluido: { label: "Concluído", class: "badge badge-green" },
  };
  const s = statusMap[status as keyof typeof statusMap];

  return (
    <Link
      to={`/portal/cursos/${course.id}`}
      className="card hover:shadow-md transition flex items-start gap-4 group"
    >
      <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
        {status === "concluido" ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <BookOpen className="h-6 w-6 text-brand-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{course.title}</h3>
          <span className={s.class}>{s.label}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          ⏱ {course.estimatedMinutes} min
        </p>
      </div>
      <Play className="h-5 w-5 text-gray-400 group-hover:text-brand-600 transition flex-shrink-0" />
    </Link>
  );
}
