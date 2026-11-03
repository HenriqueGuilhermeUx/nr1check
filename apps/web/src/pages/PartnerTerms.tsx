import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function PartnerTerms() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600"><Shield className="h-5 w-5 text-white" /></span><span className="text-xl font-bold">NR1Check</span></Link>
          <Link to="/parceiros" className="text-sm font-semibold text-brand-700">← Programa de Parceiros</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm md:p-10">
          <h1 className="text-3xl font-bold">Termos do Programa de Parceiros NR1Check</h1>
          <p className="mt-2 text-sm text-gray-500">Versão 1.0 · Programa comercial da Alternative Ventures Ltda.</p>
          <div className="mt-8 space-y-7 text-sm leading-7 text-gray-700">
            <section><h2 className="text-lg font-bold text-gray-900">1. Participação</h2><p className="mt-2">O programa é destinado a contadores, escritórios contábeis, consultores, influenciadores e outros parceiros aprovados pelo NR1Check. O cadastro não garante aprovação. O parceiro deve manter informações verdadeiras e cumprir a legislação aplicável às suas atividades.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">2. Indicações e atribuição</h2><p className="mt-2">Cada parceiro aprovado recebe código e link próprios. A primeira atribuição válida de um cliente é preservada e não pode ser substituída por outro parceiro. Autoindicação não é permitida. O painel do parceiro apresenta métricas comerciais sem expor dados pessoais desnecessários dos clientes indicados.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">3. Comissão</h2><p className="mt-2">A regra padrão é de 30% sobre os pagamentos elegíveis e efetivamente confirmados dos clientes atribuídos ao parceiro, por até 12 meses contados do primeiro pagamento do cliente. Estornos, chargebacks, fraudes, pagamentos cancelados ou valores não confirmados não geram comissão e podem resultar em reversão de comissão já lançada.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">4. Pagamento ao parceiro</h2><p className="mt-2">As comissões ficam sujeitas a prazo de elegibilidade e conferência antes do pagamento. O parceiro deve informar uma chave Pix válida e é responsável por seus dados fiscais, cadastrais e obrigações tributárias. O registro de pagamento no painel ocorre após a confirmação operacional do repasse.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">5. Oferta Parceiros 100</h2><p className="mt-2">Enquanto a campanha estiver ativa, os primeiros 100 clientes elegíveis originados por parceiros podem contratar o plano NR1Check Empresa Solo por R$ 49,90 por mês durante 12 meses, em vez do valor regular de R$ 79,00 por mês. A reserva está sujeita à disponibilidade da campanha no momento da cobrança. A condição é pessoal ao cliente indicado, não é transferível e não se aplica a autoindicação.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">6. Comunicação responsável</h2><p className="mt-2">O parceiro não pode afirmar que o NR1Check garante conformidade legal automática, substitui profissional legalmente habilitado, elimina fiscalização ou assegura ausência de autuações. A comunicação deve apresentar a plataforma como ferramenta de organização, gestão, documentação e apoio à adequação e ao gerenciamento de riscos ocupacionais.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">7. Uso de marca e conteúdo</h2><p className="mt-2">Materiais disponibilizados no kit de divulgação podem ser adaptados desde que não criem promessas enganosas ou alterem as condições comerciais. O parceiro não adquire qualquer direito sobre a marca NR1Check ou Alternative Ventures além do uso promocional autorizado durante sua participação.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">8. Pausa e encerramento</h2><p className="mt-2">O NR1Check pode pausar ou encerrar a participação em casos de fraude, abuso, comunicação enganosa, violação destes termos ou risco reputacional/regulatório. Comissões legítimas já elegíveis permanecem sujeitas à conferência operacional.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">9. Alterações</h2><p className="mt-2">Condições futuras do programa podem ser atualizadas mediante publicação de nova versão. Mudanças não alteram retroativamente comissões já constituídas sobre pagamentos anteriormente confirmados, salvo correção de fraude, duplicidade ou erro material.</p></section>
            <section><h2 className="text-lg font-bold text-gray-900">10. Contato</h2><p className="mt-2">Dúvidas sobre o programa podem ser encaminhadas pelos canais oficiais indicados em mindcompliance.org.</p></section>
          </div>
        </div>
      </main>
    </div>
  );
}
