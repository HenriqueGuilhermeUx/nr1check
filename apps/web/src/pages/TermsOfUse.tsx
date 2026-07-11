import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";

export default function TermsOfUse() {
  return (
    <LegalShell title="Termos de Uso">
      <p>
        Estes Termos de Uso regulam o acesso e uso da plataforma NR1Check, mantida por {COMPANY_NAME}, inscrita no CNPJ {COMPANY_CNPJ}.
      </p>

      <h2>1. Objeto</h2>
      <p>
        O NR1Check é uma plataforma digital de apoio à organização de processos relacionados à gestão de riscos psicossociais no contexto da NR-1, incluindo cadastro de empresas, trabalhadores, avaliações, achados agregados, inventário, plano de ação, evidências e documentos de apoio.
      </p>

      <h2>2. Natureza da plataforma</h2>
      <p>
        A plataforma é uma ferramenta de organização, gestão e documentação. O NR1Check não substitui profissional legalmente habilitado, médico, psicólogo, engenheiro de segurança, técnico de segurança, advogado, consultor especializado ou responsável técnico da empresa.
      </p>

      <h2>3. Responsabilidade do usuário</h2>
      <p>
        O usuário é responsável pela veracidade das informações inseridas, pelo uso adequado da plataforma, pela obtenção de consentimentos necessários, pela guarda de documentos externos e pela validação técnica, jurídica e operacional das medidas adotadas.
      </p>

      <h2>4. Planos e pagamentos</h2>
      <p>
        Os planos disponíveis podem incluir Empresa Solo, PME Pro e Contador/Consultor. A cobrança é realizada por Pix via Woovi. O acesso a áreas pagas poderá depender da confirmação automática do pagamento.
      </p>

      <h2>5. Cancelamento e suporte</h2>
      <p>
        Solicitações comerciais, suporte, cancelamento ou dúvidas operacionais devem ser encaminhadas pelos canais de contato disponibilizados na plataforma. Condições promocionais ou comerciais específicas poderão ser tratadas individualmente.
      </p>

      <h2>6. Uso aceitável</h2>
      <p>
        É proibido usar a plataforma para inserir dados falsos, violar direitos de terceiros, tentar acessar dados de outras empresas, contornar mecanismos de segurança, praticar engenharia reversa ou utilizar o serviço de forma ilícita.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        O NR1Check fornece recursos digitais de apoio e organização. A adoção de medidas trabalhistas, jurídicas, médicas, psicológicas ou de saúde e segurança do trabalho permanece sob responsabilidade da empresa contratante e dos profissionais por ela designados.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Estes termos podem ser atualizados periodicamente para refletir melhorias do produto, mudanças comerciais, regulatórias ou operacionais.
      </p>

      <p className="text-sm text-gray-500">Última atualização: julho de 2026.</p>
    </LegalShell>
  );
}

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NR1Check</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900">← Voltar</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <article className="card prose prose-gray max-w-none">
          <h1>{title}</h1>
          {children}
        </article>
      </main>
    </div>
  );
}
