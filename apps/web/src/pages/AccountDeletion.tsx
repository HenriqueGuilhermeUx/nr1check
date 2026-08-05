import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Shield, Trash2 } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";
const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

const mailSubject = encodeURIComponent("Solicitação de exclusão de conta e dados — NR1Check");
const mailBody = encodeURIComponent(
  "Olá, equipe NR1Check.\n\nSolicito a exclusão da minha conta e/ou dos meus dados pessoais associados ao NR1Check.\n\nDados para localização da conta:\n- Nome:\n- E-mail cadastrado:\n- CPF, se funcionário:\n- Empresa, se aplicável:\n- CNPJ da empresa, se aplicável:\n\nDeclaro que compreendo que alguns registros poderão ser mantidos pelo prazo necessário para cumprimento de obrigações legais, segurança, auditoria, prevenção a fraudes, defesa de direitos ou registro contratual.\n\nObrigado."
);

export default function AccountDeletion() {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;
  const whatsappText = encodeURIComponent(
    "Olá, equipe NR1Check. Quero solicitar exclusão de conta e/ou dados pessoais do NR1Check."
  );
  const whatsappLink = `https://wa.me/${CONTACT_WHATSAPP}?text=${whatsappText}`;

  return (
    <LegalShell title="Exclusão de conta e dados">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex gap-3">
          <Trash2 className="mt-1 h-6 w-6 text-red-700" />
          <div>
            <h2 className="mt-0 text-red-950">Solicitar exclusão</h2>
            <p className="text-sm text-red-900">
              Esta página é o canal público do NR1Check para solicitação de exclusão de conta e/ou dados associados ao aplicativo.
            </p>
          </div>
        </div>
      </div>

      <h2>1. Quem pode solicitar</h2>
      <p>
        Usuários cadastrados, representantes de empresas contratantes e trabalhadores cadastrados por uma empresa podem solicitar análise de exclusão, correção ou remoção de dados pessoais relacionados ao NR1Check.
      </p>

      <h2>2. Como solicitar</h2>
      <p>
        Para solicitar a exclusão, envie a solicitação por e-mail ou WhatsApp usando os botões abaixo. A mensagem deve informar dados suficientes para localização da conta, como nome, e-mail cadastrado, empresa, CNPJ da empresa ou CPF quando o solicitante for trabalhador cadastrado.
      </p>

      <div className="not-prose mt-6 grid gap-3 md:grid-cols-2">
        <a href={mailto} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">
          <Mail className="h-4 w-4" />
          Solicitar por e-mail
        </a>
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          <MessageCircle className="h-4 w-4" />
          Solicitar por WhatsApp
        </a>
      </div>

      <h2>3. O que pode ser excluído</h2>
      <p>
        Podem ser excluídos ou anonimizados dados pessoais e dados de conta quando a exclusão for aplicável. Em alguns casos, dados vinculados a obrigações legais, histórico contratual, auditoria, segurança, prevenção a fraudes, registros financeiros ou defesa de direitos podem ser mantidos pelo prazo necessário.
      </p>

      <h2>4. Funcionários cadastrados por empresa</h2>
      <p>
        Quando o trabalhador foi cadastrado por uma empresa contratante, a solicitação poderá exigir validação com a própria empresa, pois ela pode atuar como controladora dos dados inseridos. O NR1Check analisará a solicitação conforme o papel da plataforma e a legislação aplicável.
      </p>

      <h2>5. Prazo de atendimento</h2>
      <p>
        As solicitações serão analisadas e respondidas em prazo razoável, conforme complexidade, necessidade de verificação de identidade, obrigação legal aplicável e responsabilidade da empresa contratante.
      </p>

      <h2>6. Revogação de acesso</h2>
      <p>
        Após a exclusão ou desativação, o acesso à conta e aos recursos do app pode ser encerrado. A exclusão não gera automaticamente reembolso de valores já pagos, salvo quando previsto em condição comercial específica ou obrigação legal aplicável.
      </p>

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
