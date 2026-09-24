import {SignedIn,SignedOut} from '@clerk/clerk-react';
import {ArrowRight,Building2,Loader2,LockKeyhole,ShieldCheck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {verifyAndStoreNexOfficeEntry,type NexOfficeEntryContext} from '../lib/nexofficeEntry';

export default function NexOfficeEntry(){
  const [context,setContext]=useState<NexOfficeEntryContext|null>(null);const [loading,setLoading]=useState(true);
  const setup='/nexoffice/setup';
  useEffect(()=>{let active=true;void verifyAndStoreNexOfficeEntry(window.location.search).then(value=>{if(active)setContext(value)}).catch(()=>{if(active)setContext(null)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
    <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 p-7 md:p-10">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white"><ShieldCheck className="h-6 w-6"/></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Ecossistema NexOffice</p><h1 className="text-2xl font-black text-slate-900">NR1Check <span className="text-sm font-semibold text-slate-500">by MindCompliance</span></h1></div></div>
        <h2 className="mt-7 max-w-2xl text-3xl font-black leading-tight text-slate-900">Sua gestão continua aqui com uma camada dedicada à NR-1 e compliance.</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">O NexOffice compartilha somente o contexto básico da empresa para evitar retrabalho. Dados de funcionários, CPF, saúde, denúncias, respostas psicossociais e documentos brutos não atravessam esta ponte.</p>
      </div>
      <div className="grid gap-5 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          {loading?<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600"><Loader2 className="h-5 w-5 animate-spin"/> Validando acesso seguro do NexOffice…</div>:context?<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex gap-3"><Building2 className="mt-0.5 h-5 w-5 text-cyan-700"/><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Empresa trazida do NexOffice</p><p className="mt-1 text-lg font-bold text-slate-900">{context.businessName}</p>{context.sector&&<p className="text-sm text-slate-500">Setor: {context.sector}</p>}<p className="mt-2 text-xs font-semibold text-emerald-700">Handoff verificado e temporário.</p></div></div></div>:<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">Este acesso do NexOffice é inválido ou expirou. Volte ao NexOffice e abra Compliance novamente. Nenhuma empresa foi vinculada.</div>}
          <div className="mt-4 flex items-start gap-3 text-sm text-slate-500"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0"/><p>O NR1Check mantém autenticação e base próprias. No primeiro acesso você confirma o CNPJ real; o vínculo técnico usa somente a referência segura do workspace.</p></div>
        </div>
        <div className="grid gap-3 md:min-w-56">
          {!loading&&context&&<><SignedOut><Link to={`/cadastro?redirect=${encodeURIComponent(setup)}`} className="btn-primary justify-center">Continuar <ArrowRight className="h-4 w-4"/></Link><Link to={`/login?redirect=${encodeURIComponent(setup)}`} className="btn-secondary justify-center">Já tenho acesso</Link></SignedOut><SignedIn><Link to={setup} className="btn-primary justify-center">Continuar <ArrowRight className="h-4 w-4"/></Link><Link to="/dashboard" className="btn-secondary justify-center">Ir para dashboard</Link></SignedIn></>}
          {!loading&&!context&&<Link to="/" className="btn-secondary justify-center">Abrir NR1Check normalmente</Link>}
        </div>
      </div>
    </div>
  </div>;
}