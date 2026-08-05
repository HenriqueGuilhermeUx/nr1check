import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Mail, MessageCircle, Shield } from "lucide-react";

const COMPANY_NAME = "Alternative Ventures Ltda";
const COMPANY_CNPJ = "61.920.356/0001-38";
const CONTACT_EMAIL = "henriquecampos66@gmail.com";
const CONTACT_WHATSAPP = "5511947984328";

export default function Support() {
  const mailSubject = encodeURIComponent("Suporte NR1Check");
  const mailBody = encodeURIComponent("Olá, equipe NR1Check. Preciso de suporte sobre:\n\n");
  const whatsappText = encodeURIComponent("Olá, equipe NR1Check. Preciso de suporte.");

  return (
    <LegalShell title="Suporte NR1Check">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <div className="flex gap-3">
          <HelpCircle className="mt-1 h-6 w-6 text-brand-700" />
          <div>
            <h2 className="mt-0 text-brand-950">Canais de atendimento</h2>
            <p className="text-sm text-brand-900">
              Use esta página para contato sobre acesso, pagamento, uso do app, exclusão de dados, dúvidas comerciais e suporte operacional.
            </p>
          </div>
        </div>
      </div>

      <div className="not-prose mt-6 grid gap-3 md:grid-cols-2">
        <a href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          <Mail className="h-4 w-4" />
          Enviar e-mail
        </a>
        <a href={`https://wa.me/${CONTACT_WHATSAPP}?text=${whatsappText}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          <MessageCircle className="h-4 w-4" />
          Falar no WhatsApp
        </a>
      </div>

      <h2>Atendimento</h2>
      <p>
        O suporte é prestado pelos canais acima. Para agilizar o atendimento, informe nome, e-mail cadastrado, empresa, CNPJ, CPF quando for funcionário cadastrado e uma descrição objetiva do problema.
      </p>

      <h2>Links úteis</h2>
      <ul>
        <li><Link to="/privacidade">Política de Privacidade</Link></li>
        <li><Link to="/termos">Termos de Uso</Link></li>
        <li><Link to="/excluir-conta">Exclusão de conta e dados</Link></li>
        <li><Link to="/disclaimer">Disclaimer técnico/jurídico</Link></li>
      </ul>

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
