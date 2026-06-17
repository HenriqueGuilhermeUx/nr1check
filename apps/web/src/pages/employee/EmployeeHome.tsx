import { useOutletContext, Link } from "react-router-dom";
import { ClipboardList, BookOpen, MessageSquare, FileText, ChevronRight, Shield } from "lucide-react";
import { trpc } from "../../lib/trpc";

type Ctx = {
  employee: {
    id: number;
    name: string;
    companyId: number;
  };
};

export function EmployeeHome() {
  const { employee } = useOutletContext<Ctx>();
  const { data: cycles } = trpc.assessment.cycles.useQuery(
    { companyId: employee.companyId },
    { enabled: false }, // não autenticado, vamos pegar de outra forma
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Seu portal</h1>
        <p className="text-gray-500 text-sm mt-1">Pesquisa, cursos e canais disponíveis para você.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PortalCard
          to="/portal/avaliacao"
          icon={ClipboardList}
          title="Pesquisa COPSOQ"
          description="Responda a avaliação de riscos psicossociais. Leva 5 minutos e suas respostas são confidenciais."
          cta="Responder"
        />
        <PortalCard
          to="/portal/cursos"
          icon={BookOpen}
          title="Cursos obrigatórios"
          description="4 cursos de micro-learning sobre saúde mental, assédio, estresse e liderança."
          cta="Ver cursos"
        />
        <PortalCard
          to="/portal/denuncia"
          icon={MessageSquare}
          title="Canal de Denúncias"
          description="Faça uma denúncia anônima. Você recebe um protocolo com código para acompanhar o status."
          cta="Denunciar"
        />
        <PortalCard
          to="/portal/documentos"
          icon={FileText}
          title="Meus documentos"
          description="Ordens de Serviço, fichas de EPI e termos que você assinou eletronicamente."
          cta="Ver"
        />
      </div>

      <div className="mt-8 card bg-brand-50 border-brand-200">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-900">Suas respostas são protegidas pela LGPD</p>
            <p className="text-xs text-brand-700 mt-1">
              Dados individuais nunca são compartilhados. Apenas o gestor vê relatórios agregados por setor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalCard({ to, icon: Icon, title, description, cta }: any) {
  return (
    <Link to={to} className="card hover:shadow-md transition flex flex-col group">
      <Icon className="h-6 w-6 text-brand-600" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 flex-1">{description}</p>
      <p className="mt-3 text-sm font-medium text-brand-600 flex items-center gap-1 group-hover:gap-2 transition-all">
        {cta} <ChevronRight className="h-4 w-4" />
      </p>
    </Link>
  );
}
