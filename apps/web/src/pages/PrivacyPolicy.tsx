import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";

export default function PrivacyPolicy() {
  return (
    <LegalShell title="Política de Privacidade">
      <p>
        Esta Política de Privacidade explica como o NR1Check, mantido por {COMPANY_NAME}, CNPJ {COMPANY_CNPJ}, trata informações inseridas na plataforma.
      </p>

      <h2>1. Dados tratados</h2>
      <p>
        Podemos tratar dados cadastrais de usuários, empresas, trabalhadores, contatos, cargos, setores, respostas a avaliações, registros de ocorrências, documentos, evidências e informações necessárias para execução dos serviços contratados.
      </p>

      <h2>2. Finalidade</h2>
      <p>
        Os dados são usados para cadastrar empresas, organizar avaliações psicossociais, gerar achados agregados, apoiar inventário, plano de ação, documentos, evidências, cobrança, suporte e segurança da plataforma.
      </p>

      <h2>3. Dados sensíveis</h2>
      <p>
        A plataforma deve ser usada com cautela para evitar exposição indevida de dados pessoais sensíveis. O objetivo do NR1Check é trabalhar com informações organizacionais e achados agregados, sem diagnóstico individual médico ou psicológico.
      </p>

      <h2>4. Compartilhamento</h2>
      <p>
        Dados podem ser processados por fornecedores de infraestrutura, autenticação, banco de dados, hospedagem, pagamentos e comunicação, sempre para viabilizar a operação do serviço.
      </p>

      <h2>5. Pagamentos</h2>
      <p>
        A cobrança por Pix é processada por provedor de pagamentos integrado, como Woovi. Informações transacionais podem ser tratadas para confirmação, liberação de acesso, conciliação e suporte.
      </p>

      <h2>6. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais razoáveis para proteger as informações. Nenhum sistema, entretanto, é totalmente imune a falhas, incidentes ou acessos indevidos.
      </p>

      <h2>7. Responsabilidade do cliente</h2>
      <p>
        A empresa contratante ou contador/consultor que utiliza a plataforma é responsável por informar os titulares quando necessário, coletar autorizações aplicáveis, definir bases legais e usar os dados de forma adequada.
      </p>

      <h2>8. Direitos dos titulares</h2>
      <p>
        Titulares de dados podem solicitar informações, correção, exclusão ou outras providências previstas na legislação aplicável, conforme o caso e a responsabilidade de cada controlador.
      </p>

      <h2>9. Retenção</h2>
      <p>
        Os dados podem ser mantidos enquanto necessários para prestação do serviço, cumprimento de obrigações legais, defesa de direitos, auditoria, segurança e histórico contratual.
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
