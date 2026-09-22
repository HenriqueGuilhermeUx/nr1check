import {useEffect,useRef,useState} from 'react';
import {useSignIn,useUser} from '@clerk/clerk-react';
import {storeNexOfficeEntry} from '../lib/nexofficeEntry';

function fallbackUrl(){
  const src=new URLSearchParams(window.location.search),out=new URLSearchParams();out.set('source','nexoffice');
  for(const key of ['workspaceRef','businessName','sector']){const value=src.get(key);if(value)out.set(key,value)}
  return `/nexoffice?${out.toString()}`;
}

export default function NexOfficeAccess(){
  const {isLoaded:isUserLoaded,isSignedIn}=useUser();
  const {isLoaded:isSignInLoaded,signIn,setActive}=useSignIn();
  const started=useRef(false);const [message,setMessage]=useState('Conectando seu NexOffice ao NR1Check…');

  useEffect(()=>{
    if(!isUserLoaded||!isSignInLoaded||started.current)return;
    const params=new URLSearchParams(window.location.search),token=params.get('token');
    if(isSignedIn){started.current=true;storeNexOfficeEntry(window.location.search);window.location.replace('/nexoffice/setup');return}
    if(!token||!signIn||!setActive){started.current=true;window.location.replace(fallbackUrl());return}
    started.current=true;
    void(async()=>{
      try{
        const attempt=await signIn.create({strategy:'ticket',ticket:token});
        if(attempt.status!=='complete'||!attempt.createdSessionId)throw new Error(`ticket_status_${attempt.status}`);
        await setActive({session:attempt.createdSessionId});
        storeNexOfficeEntry(window.location.search);
        window.history.replaceState({},'',window.location.pathname);
        window.location.replace('/nexoffice/setup');
      }catch(error){
        console.warn('NexOffice federated entry fallback',error instanceof Error?error.message:String(error));
        setMessage('Vamos continuar pelo acesso seguro do NR1Check…');
        window.setTimeout(()=>window.location.replace(fallbackUrl()),500);
      }
    })();
  },[isUserLoaded,isSignInLoaded,isSignedIn,signIn,setActive]);

  return <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6"><section className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center"><div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold text-xl">N</div><p className="mt-5 text-xs font-semibold tracking-[.18em] text-emerald-700">NEXOFFICE + NR1CHECK</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Entrada segura, sem repetir sua empresa</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><p className="mt-5 text-xs leading-5 text-slate-500">Somente identidade de acesso e contexto básico da empresa são usados neste handoff. Dados de empregados, saúde, respostas psicossociais, denúncias e documentos não são transferidos.</p></section></main>;
}
