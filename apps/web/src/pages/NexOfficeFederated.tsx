import {useEffect,useRef,useState} from 'react';
import {useSignIn} from '@clerk/clerk-react';
import {Loader2,ShieldCheck} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {storeNexOfficeEntryContext} from '../lib/nexofficeEntry';

export default function NexOfficeFederated(){
  const navigate=useNavigate();const {isLoaded,signIn,setActive}=useSignIn();const started=useRef(false);const [error,setError]=useState('');
  const initial=useRef((()=>{const params=new URLSearchParams(window.location.search);return{ticket:String(params.get('ticket')||''),workspaceRef:String(params.get('workspaceRef')||''),businessName:String(params.get('businessName')||''),sector:String(params.get('sector')||'')}})()).current;

  useEffect(()=>{
    if(!initial.ticket||!initial.workspaceRef||!initial.businessName){setError('Este acesso temporário está incompleto. Volte ao NexOffice e abra o Compliance novamente.');return}
    window.history.replaceState({},'',window.location.pathname);
  },[initial]);

  useEffect(()=>{
    if(!isLoaded||!signIn||!setActive||started.current||error)return;started.current=true;
    void (async()=>{
      try{
        const attempt=await signIn.create({strategy:'ticket',ticket:initial.ticket});
        if(attempt.status!=='complete'||!attempt.createdSessionId)throw new Error('A sessão federada não foi concluída.');
        await setActive({session:attempt.createdSessionId});
        const stored=storeNexOfficeEntryContext({workspaceRef:initial.workspaceRef,businessName:initial.businessName,sector:initial.sector});
        if(!stored)throw new Error('O contexto seguro da empresa não pôde ser preparado.');
        navigate('/nexoffice/setup',{replace:true});
      }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir o acesso pelo NexOffice.');}
    })();
  },[error,initial,isLoaded,navigate,setActive,signIn]);

  if(error)return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><ShieldCheck className="mx-auto h-11 w-11 text-emerald-600"/><h1 className="mt-4 text-xl font-black text-slate-900">Não foi possível concluir o acesso</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">{error}</p><button className="btn-secondary mt-6" onClick={()=>navigate('/nexoffice',{replace:true})}>Continuar pelo acesso normal</button></div></div>;

  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600"/><h1 className="mt-4 text-xl font-black text-slate-900">Abrindo sua área de Compliance</h1><p className="mt-2 text-sm text-slate-500">Estamos usando seu acesso do NexOffice. Você não precisa criar outra senha.</p></div></div>;
}
