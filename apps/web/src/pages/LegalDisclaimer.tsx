import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";

export default function LegalDisclaimer() {
  return (
    <LegalShell title="Disclaimer técnico e jurídico">
      <p>
        O NR1Check é uma plataforma digital de apoio à organização da gestão de riscos psicossociais no contexto da NR-1, mantida por {COMPANY_NAME}, CNPJ {COMPANY_CNPJ}.
      </p>

      <h2>1. Não substituição profissional</h2>
      <p>
        O NR1Check não substitui profissional legalmente habilitado, médico, psicólogo, engenheiro de segurança, técnico de segurança do trabalho, advogado, consultor especializado ou responsável técnico da empresa.
      </p>

      <h2>2. Sem diagnóstico individual</h2>
      <p>
        A plataforma não realiza diagnóstico médico, psicológico, psiquiátrico ou clínico individual. As funcionalidades de avaliação e achados têm finalidade organizacional, agregada e preventiva.
      </p>

      <h2>3. Sem garantia automática de conformidade</h2>
      <p>
        O uso da plataforma não garante, por si só, conformidade integral com normas trabalhistas, previdenciárias, sanitárias, regulatórias ou legais. A adequação final depende da realidade de cada empresa, dos documentos mantidos, das medidas adotadas e da validação por profissionais competentes.
      </p>

      <h2>4. Apoio documental</h2>
      <p>
        Modelos, relatórios, planos e documentos gerados pelo sistema são materiais de apoio e devem ser revisados, adaptados e validados conforme o contexto específico da organização.
      </p>

      <h2>5. Responsabilidade da empresa</h2>
      <p>
        A empresa contratante permanece responsável por suas decisões, medidas preventivas, gestão de trabalhadores, comunicação interna, cumprimento de obrigações legais e contratação de profissionais habilitados quando necessário.
      </p>

      <h2>6. Uso por contadores e consultores</h2>
      <p>
        Contadores e consultores que utilizem o NR1Check para clientes devem respeitar os limites de sua atuação profissional, esclarecer o escopo do serviço e, quando necessário, envolver especialistas em saúde e segurança do trabalho, jurídico ou saúde mental.
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
