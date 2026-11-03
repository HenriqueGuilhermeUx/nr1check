import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  Copy,
  Instagram,
  Link2,
  Megaphone,
  MessageCircle,
  Shield,
  Sparkles,
  WalletCards,
  Youtube,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "../lib/trpc";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function statusLabel(status?: string) {
  if (status === "active") return "Ativo";
  if (status === "pending") return "Em análise";
  if (status === "paused") return "Pausado";
  if (status === "rejected") return "Não aprovado";
  return status || "—";
}

export default function Partners() {
  const { isSignedIn } = useUser();
  const utils = trpc.useUtils();
  const [partnerType, setPartnerType] = useState<"contador" | "influencer" | "consultor">("contador");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { data: access } = trpc.partner.access.useQuery(undefined, { enabled: Boolean(isSignedIn), retry: false });
  const { data: me, isLoading: loadingMe } = trpc.partner.me.useQuery(undefined, { enabled: Boolean(isSignedIn), retry: false });
  const { data: dashboard } = trpc.partner.dashboard.useQuery(undefined, {
    enabled: Boolean(isSignedIn && me),
    retry: false,
  });
  const { data: adminPartners } = trpc.partner.admin.list.useQuery(undefined, {
    enabled: Boolean(isSignedIn && access?.isAdmin),
    retry: false,
  });
  const { data: adminCommissions } = trpc.partner.admin.commissions.useQuery(undefined, {
    enabled: Boolean(isSignedIn && access?.isAdmin),
    retry: false,
  });

  const apply = trpc.partner.join.useMutation({
    onSuccess: async () => {
      await utils.partner.me.invalidate();
      toast.success("Solicitação enviada. Vamos liberar seu código após a aprovação.");
    },
    onError: (error) => toast.error(error.message),
  });
  const payout = trpc.partner.updatePayout.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.partner.me.invalidate(), utils.partner.dashboard.invalidate()]);
      toast.success("Chave Pix atualizada.");
    },
    onError: (error) => toast.error(error.message),
  });
  const approve = trpc.partner.admin.approve.useMutation({
    onSuccess: async (data) => {
      await Promise.all([utils.partner.admin.list.invalidate(), utils.partner.admin.commissions.invalidate()]);
      toast.success(`Parceiro aprovado. Código: ${data.code}`);
    },
    onError: (error) => toast.error(error.message),
  });
  const pause = trpc.partner.admin.pause.useMutation({
    onSuccess: async () => {
      await utils.partner.admin.list.invalidate();
      toast.success("Parceiro pausado.");
    },
    onError: (error) => toast.error(error.message),
  });
  const markPaid = trpc.partner.admin.markPaid.useMutation({
    onSuccess: async () => {
      await utils.partner.admin.commissions.invalidate();
      toast.success("Pagamento de comissão registrado.");
    },
    onError: (error) => toast.error(error.message),
  });

  const shareUrl = useMemo(() => {
    if (!me?.code) return "";
    return `${window.location.origin}/?ref=${encodeURIComponent(me.code)}`;
  }, [me?.code]);

  const copy = async (value: string, label = "Conteúdo") => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  };

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    apply.mutate({
      partnerType,
      displayName: String(fd.get("displayName") || ""),
      socialHandle: String(fd.get("socialHandle") || "") || null,
      socialUrl: String(fd.get("socialUrl") || "") || null,
      audienceSize: fd.get("audienceSize") ? Number(fd.get("audienceSize")) : null,
      acceptedTerms: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600"><Shield className="h-5 w-5 text-white" /></span>
            <span className="text-xl font-bold">NR1Check</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Conhecer a plataforma</Link>
            {!isSignedIn && <Link to="/cadastro" className="btn-primary">Criar conta</Link>}
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-gradient-to-b from-brand-50 via-white to-gray-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Programa de Parceiros NR1Check
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight lg:text-6xl">
              Ajude empresas a organizar a <span className="text-brand-600">adequação à NR-1</span> e ganhe com isso.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600">
              Contadores, consultores e criadores de conteúdo podem indicar o NR1Check para sua carteira ou audiência e receber 30% de comissão sobre os pagamentos dos clientes indicados, por até 12 meses.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["30%", "de comissão", "por pagamento elegível"],
                ["12 meses", "de participação", "por cliente indicado"],
                ["R$ 49,90", "oferta exclusiva", "Solo por 12 meses"],
              ].map(([value, title, detail]) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-extrabold text-brand-700">{value}</p>
                  <p className="mt-1 text-sm font-semibold">{title}</p>
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Building2 className="h-6 w-6" /></span>
              <div><p className="text-sm font-semibold text-brand-700">Parceiros 100</p><h2 className="text-2xl font-bold">Oferta para vender</h2></div>
            </div>
            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">NR1Check Empresa Solo</p>
              <div className="mt-1 flex items-end gap-2"><span className="text-lg text-gray-400 line-through">R$ 79</span><span className="text-4xl font-extrabold">R$ 49,90</span><span className="pb-1 text-sm text-gray-500">/mês</span></div>
              <p className="mt-2 text-sm text-gray-600">Durante 12 meses para os primeiros 100 clientes elegíveis originados por parceiros.</p>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-700">
              {["Link e código próprios", "Tracking sem expor dados do cliente", "Painel de cliques, clientes e comissões", "Pagamento da comissão via Pix", "Kit de divulgação pronto para compartilhar"].map((item) => (
                <p key={item} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-brand-600" />{item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dois canais, uma mesma operação.</h2>
          <p className="mt-2 max-w-3xl text-gray-600">O contador pode usar o plano multiempresas no próprio escritório e, separadamente, indicar o NR1Check para clientes que prefiram contratar diretamente.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card">
            <Building2 className="h-7 w-7 text-brand-600" />
            <h3 className="mt-4 text-xl font-bold">Contadores e consultores</h3>
            <p className="mt-2 text-gray-600">Use o NR1Check como nova linha de serviço para sua carteira ou indique o software para cada empresa contratar diretamente. Nas indicações elegíveis, o escritório recebe comissão.</p>
          </div>
          <div className="card">
            <Megaphone className="h-7 w-7 text-brand-600" />
            <h3 className="mt-4 text-xl font-bold">Influencers e criadores</h3>
            <p className="mt-2 text-gray-600">Compartilhe conteúdo sobre NR-1, SST, RH, contabilidade ou gestão empresarial usando seu link rastreável e acompanhe o resultado no painel.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {!isSignedIn ? (
            <div className="rounded-3xl bg-gray-900 p-8 text-white lg:flex lg:items-center lg:justify-between">
              <div><h2 className="text-3xl font-bold">Quero ser parceiro</h2><p className="mt-2 max-w-2xl text-gray-300">Crie uma conta gratuita para enviar sua solicitação. Você só precisa assinar um plano se também quiser usar o NR1Check na sua própria operação.</p></div>
              <Link to="/cadastro" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 lg:mt-0">Criar conta de parceiro <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : loadingMe ? (
            <div className="py-12 text-center text-gray-500">Carregando seu perfil de parceiro…</div>
          ) : !me ? (
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold">Solicitar participação</h2>
              <p className="mt-2 text-gray-600">A aprovação protege a qualidade do canal. Não há custo para participar como parceiro.</p>
              <form onSubmit={handleApply} className="mt-7 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <div>
                  <label className="text-sm font-medium">Perfil</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      ["contador", "Contador"],
                      ["influencer", "Influencer"],
                      ["consultor", "Consultor"],
                    ].map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setPartnerType(value as any)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${partnerType === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white"}`}>{label}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-sm font-medium">Nome / marca *</label><input name="displayName" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Seu nome ou nome do escritório" /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="text-sm font-medium">@ / perfil</label><input name="socialHandle" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="@seuperfil" /></div>
                  <div><label className="text-sm font-medium">Audiência aproximada</label><input name="audienceSize" type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="0" /></div>
                </div>
                <div><label className="text-sm font-medium">Site ou rede social</label><input name="socialUrl" type="url" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="https://..." /></div>
                <label className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1" /><span>Li e aceito os <Link className="font-semibold text-brand-700 underline" to="/parceiros/termos">Termos do Programa de Parceiros</Link>.</span></label>
                <button disabled={!acceptedTerms || apply.isPending} className="btn-primary w-full justify-center">{apply.isPending ? "Enviando…" : "Enviar para aprovação"}</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><p className="text-sm font-semibold text-brand-700">Seu programa de parceiros</p><h2 className="text-3xl font-bold">{me.display_name}</h2><p className="mt-1 text-sm text-gray-500">Status: <strong>{statusLabel(me.status)}</strong> · {Number(me.commission_percent)}% por até {Number(me.commission_months)} meses.</p></div>
                {me.status === "active" && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800"><BadgeCheck className="h-4 w-4" />Parceiro ativo</span>}
              </div>

              {me.status === "active" && dashboard ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      ["Cliques", dashboard.metrics.clicks],
                      ["Indicações", dashboard.metrics.referrals],
                      ["Clientes pagos", dashboard.metrics.paidCustomers],
                      ["A receber", money(dashboard.metrics.pendingCents)],
                      ["Já pago", money(dashboard.metrics.paidCents)],
                    ].map(([label, value]) => <div key={label} className="rounded-2xl border bg-gray-50 p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="card">
                      <h3 className="flex items-center gap-2 text-lg font-bold"><Link2 className="h-5 w-5 text-brand-600" />Seu link</h3>
                      <div className="mt-4 flex gap-2"><input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" /><button onClick={() => copy(shareUrl, "Link")} className="btn-secondary"><Copy className="h-4 w-4" /></button></div>
                      <p className="mt-2 text-xs text-gray-500">Código: <strong>{me.code}</strong></p>
                      <div className="mt-5">
                        <label className="text-sm font-medium">Chave Pix para receber comissões</label>
                        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); payout.mutate({ payoutPixKey: String(fd.get("pix") || "") }); }}>
                          <input name="pix" defaultValue={me.payout_pix_key || ""} required className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
                          <button className="btn-primary"><WalletCards className="h-4 w-4" />Salvar</button>
                        </form>
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="flex items-center gap-2 text-lg font-bold"><Megaphone className="h-5 w-5 text-brand-600" />Kit de divulgação</h3>
                      <p className="mt-1 text-sm text-gray-500">Textos prontos para adaptar antes de publicar.</p>
                      <div className="mt-4 grid gap-2">
                        <button className="btn-secondary justify-start" onClick={() => copy(`Empresas precisam tratar os riscos psicossociais dentro da gestão de riscos ocupacionais da NR-1. Conheça o NR1Check: avaliação, inventário, plano de ação e evidências em um só lugar. Pelo meu link, o plano Solo sai de R$ 79 por R$ 49,90/mês durante 12 meses para os primeiros clientes da campanha: ${shareUrl}`, "Texto WhatsApp")}><MessageCircle className="h-4 w-4" />Copiar WhatsApp</button>
                        <button className="btn-secondary justify-start" onClick={() => copy(`NR-1 sem planilha solta: organize avaliação psicossocial, riscos, plano de ação e evidências no NR1Check. Oferta exclusiva: Solo de R$ 79 por R$ 49,90/mês durante 12 meses. ${shareUrl}`, "Legenda Instagram")}><Instagram className="h-4 w-4" />Copiar Instagram</button>
                        <button className="btn-secondary justify-start" onClick={() => copy(`NR1Check — plataforma para apoiar empresas na organização da NR-1: avaliação psicossocial, inventário, plano de ação, evidências e documentos. Saiba mais: ${shareUrl}`, "Descrição de vídeo")}><Youtube className="h-4 w-4" />Copiar descrição</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">Sua solicitação está <strong>{statusLabel(me.status).toLowerCase()}</strong>. O link e o painel comercial aparecem assim que o perfil for ativado.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {access?.isAdmin && (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-bold">Administração de parceiros</h2>
          <p className="mt-1 text-sm text-gray-500">Aprovação, pausa e baixa manual das comissões pagas via Pix.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="card">
              <h3 className="font-bold">Parceiros</h3>
              <div className="mt-4 space-y-3">
                {!adminPartners?.length ? <p className="text-sm text-gray-500">Nenhum parceiro cadastrado.</p> : adminPartners.map((p: any) => (
                  <div key={p.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{p.display_name}</p><p className="text-xs text-gray-500">{p.partner_type} · {p.email} · {statusLabel(p.status)}</p></div><div className="flex gap-2">{p.status === "pending" && <button className="btn-primary text-xs" onClick={() => approve.mutate({ partnerId: Number(p.id) })}>Aprovar</button>}{p.status === "active" && <button className="btn-secondary text-xs" onClick={() => pause.mutate({ partnerId: Number(p.id) })}>Pausar</button>}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold">Comissões a pagar</h3>
              <div className="mt-4 space-y-3">
                {!adminCommissions?.length ? <p className="text-sm text-gray-500">Nenhuma comissão pendente.</p> : adminCommissions.map((item: any) => {
                  const eligible = new Date(item.eligible_at).getTime() <= Date.now();
                  return <div key={item.id} className="rounded-xl border border-gray-200 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.partner_name}</p><p className="text-xs text-gray-500">{money(Number(item.commission_value_cents))} · Pix: {item.payout_pix_key || "não cadastrado"}</p><p className="mt-1 text-xs text-gray-400">Elegível em {new Date(item.eligible_at).toLocaleDateString("pt-BR")}</p></div><button disabled={!eligible || !item.payout_pix_key} className="btn-primary text-xs disabled:opacity-40" onClick={() => markPaid.mutate({ commissionId: Number(item.id) })}>Marcar pago</button></div></div>;
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>NR1Check · Alternative Ventures Ltda.</p>
          <div className="flex gap-4"><Link to="/parceiros/termos">Termos de Parceiros</Link><Link to="/privacidade">Privacidade</Link></div>
        </div>
      </footer>
    </div>
  );
}
