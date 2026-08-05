import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Shield } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";
const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

export default function PrivacyPolicy() {
  return (
    <LegalShell title="Política de Privacidade">
      <p>
        Esta Política de Privacidade explica como o aplicativo e a plataforma NR1Check, mantidos por {COMPANY_NAME}, inscrita no CNPJ {COMPANY_CNPJ}, tratam dados pessoais e informações inseridas pelos usuários, empresas contratantes e trabalhadores cadastrados.
      </p>

      <h2>1. Identificação do aplicativo</h2>
      <p>
        Nome do app: <strong>NR1Check</strong>. Nome do pacote Android: <strong>br.com.nr1check.app</strong>. Desenvolvedor/operador: <strong>{COMPANY_NAME}</strong>.
      </p>

      <h2>2. Dados tratados</h2>
      <p>
        Podemos tratar dados cadastrais de usuários, empresas, trabalhadores, contatos, cargos, setores, respostas a avaliações, registros de ocorrências, documentos, evidências, pagamentos e informações necessárias para execução dos serviços contratados.
      </p>
      <ul>
        <li>Dados de conta: nome, e-mail, imagem de perfil quando fornecida pelo provedor de autenticação e identificadores de sessão.</li>
        <li>Dados de empresa: nome, CNPJ, setor, porte, endereço, responsáveis e informações operacionais.</li>
        <li>Dados de trabalhadores: nome, CPF, telefone, cargo, departamento e vínculo com a empresa cadastrante.</li>
        <li>Dados de uso: registros de acesso, status de processos, avaliações respondidas, documentos, pendências e evidências.</li>
        <li>Dados de pagamento: status de plano, cobrança Pix, identificadores de transação e confirmação de pagamento processada por provedor integrado.</li>
      </ul>

      <h2>3. Finalidade</h2>
      <p>
        Os dados são usados para autenticação, cadastro de empresas, controle de acesso, cadastro de trabalhadores, organização de avaliações psicossociais, geração de achados agregados, apoio ao inventário, plano de ação, documentos, evidências, cobrança, suporte, segurança e melhoria do serviço.
      </p>

      <h2>4. Dados sensíveis e respostas psicossociais</h2>
      <p>
        O NR1Check deve ser usado para apoiar a gestão organizacional de riscos psicossociais. A plataforma não realiza diagnóstico médico ou psicológico individual. As respostas e achados devem ser tratados com cautela, preferencialmente de forma agregada, para reduzir exposição indevida de trabalhadores.
      </p>

      <h2>5. Compartilhamento e operadores</h2>
      <p>
        Dados podem ser processados por fornecedores necessários à operação, como autenticação, hospedagem, banco de dados, infraestrutura, pagamentos, comunicação, monitoramento e suporte. Exemplos incluem provedores de autenticação, hospedagem web/API, banco de dados e provedor de pagamentos Pix. O compartilhamento ocorre apenas para viabilizar a operação do serviço, segurança, cobrança, suporte ou obrigação legal aplicável.
      </p>

      <h2>6. Pagamentos</h2>
      <p>
        A cobrança por Pix pode ser processada por provedor de pagamentos integrado, como Woovi. Informações transacionais podem ser tratadas para confirmação de pagamento, liberação de acesso, conciliação, auditoria, prevenção a fraudes e suporte.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais razoáveis para proteger as informações, incluindo HTTPS, autenticação para áreas de patrão/RH/contador e acesso de funcionário por empresa, CPF cadastrado e código/token. Nenhum sistema é totalmente imune a falhas, incidentes ou acessos indevidos.
      </p>

      <h2>8. Responsabilidade do cliente contratante</h2>
      <p>
        A empresa contratante, patrão, RH, contador ou consultor que utiliza a plataforma é responsável por inserir dados verdadeiros, informar titulares quando necessário, definir bases legais aplicáveis, obter autorizações quando cabíveis e usar os dados conforme a legislação e políticas internas.
      </p>

      <h2>9. Direitos dos titulares</h2>
      <p>
        Titulares de dados podem solicitar informações, correção, exclusão, anonimização, revisão ou outras providências previstas na legislação aplicável. Solicitações podem ser feitas pela página pública de exclusão de conta e dados.
      </p>

      <p>
        Página de exclusão de conta e dados: <Link to="/excluir-conta">https://nr1check.netlify.app/excluir-conta</Link>
      </p>

      <h2>10. Retenção</h2>
      <p>
        Os dados podem ser mantidos enquanto necessários para prestação do serviço, cumprimento de obrigações legais, exercício regular de direitos, auditoria, segurança, prevenção a fraudes, histórico contratual e registros financeiros. Quando aplicável, dados podem ser excluídos, anonimizados ou retidos em formato necessário para cumprimento legal.
      </p>

      <h2>11. Crianças e adolescentes</h2>
      <p>
        O NR1Check não é direcionado a crianças. O uso da plataforma é voltado a empresas, patrões, RH, contadores, consultores e trabalhadores vinculados a empresas contratantes. Caso dados de menores sejam inseridos por uma empresa, a responsabilidade pela base legal e autorização aplicável é da empresa contratante.
      </p>

      <h2>12. Contato</h2>
      <p>
        Para privacidade, suporte ou solicitações relacionadas a dados, use os canais abaixo.
      </p>

      <div className="not-prose mt-5 grid gap-3 md:grid-cols-2">
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Privacidade NR1Check")}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          <Mail className="h-4 w-4" />
          Enviar e-mail
        </a>
        <a href={`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent("Olá, equipe NR1Check. Tenho uma solicitação de privacidade/dados.")}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          <MessageCircle className="h-4 w-4" />
          Falar no WhatsApp
        </a>
      </div>

      <p className="text-sm text-gray-500">Última atualização: agosto de 2026.</p>
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
          <p className="text-sm font-semibold text-gray-500">{COMPANY_NAME} · CNPJ {COMPANY_CNPJ}</p>
          <h1>{title}</h1>
          {children}
        </article>
      </main>
    </div>
  );
}
