import {useEffect,useMemo,useRef,useState} from 'react';
import {useSignIn} from '@clerk/clerk-react';
import {ArrowRight,Loader2,ShieldCheck,TriangleAlert} from 'lucide-react';
import {Link,useNavigate} from 'react-router-dom';
import {storeNexOfficeEntry} from '../lib/nexofficeEntry';

export default function NexOfficeFederated(){
  const navigate=useNavigate();
  const {isLoaded,signIn,setActive}=useSignIn();
  const started=useRef(false);
  const [error,setError]=useState('');
  const handoff=useMemo(()=>{
    const search=window.location.search;
    const params=new URLSearchParams(search);
    const ticket=String(params.get('ticket')||'').trim();
    const context=storeNexOfficeEntry(search);
    window.history.replaceState({},'',window.location.pathname);
    return{ticket,context};
  },[]);

  useEffect(()=>{
    if(!isLoaded||!signIn||!setActive||started.current)return;
    started.current=true;
    if(!handoff.ticket||!handoff.context){setError('Este acesso do NexOffice é inválido ou expirou.');return}
    void (async()=>{
      try{
        const attempt=await signIn.create({strategy:'ticket',ticket:handoff.ticket});
        if(attempt.status!=='complete'||!attempt.createdSessionId)throw new Error('O acesso temporário não pôde ser concluído.');
        await setActive({session:attempt.createdSessionId});
        navigate('/nexoffice/setup',{replace:true});
      }catch(err){
        setError(err instanceof Error?err.message:'Não foi possível concluir o acesso pelo NexOffice.');
      }
    })();
  },[isLoaded,signIn,setActive,handoff,navigate]);

  if(error)return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><TriangleAlert className="h-6 w-6"/></div><h1 className="mt-5 text-2xl font-black text-slate-900">Vamos continuar com segurança</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">{error} Você pode entrar normalmente e o contexto básico da empresa continua disponível por tempo limitado.</p><div className="mt-6 grid gap-3"><Link className="btn-primary justify-center" to="/login?redirect=%2Fnexoffice%2Fsetup">Entrar no NR1Check <ArrowRight className="h-4 w-4"/></Link><Link className="btn-secondary justify-center" to="/nexoffice">Voltar à entrada do NexOffice</Link></div></div></div>;

  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-6 w-6"/></div><h1 className="mt-5 text-2xl font-black text-slate-900">Abrindo Compliance</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">Estamos conectando seu acesso do NexOffice ao NR1Check sem pedir outro login. Nenhum dado de funcionário, saúde, denúncia ou resposta psicossocial é transferido.</p><Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-emerald-600"/></div></div>;
}
