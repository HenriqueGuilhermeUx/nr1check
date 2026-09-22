import {useEffect,useState} from 'react';
import {useSignIn} from '@clerk/clerk-react';
import {useNavigate} from 'react-router-dom';
import {storeNexOfficeEntry} from '../lib/nexofficeEntry';

export default function NexOfficeFederatedEntry(){
  const {isLoaded,signIn,setActive}=useSignIn();
  const navigate=useNavigate();
  const [message,setMessage]=useState('Conectando seu NexOffice ao NR1Check…');

  useEffect(()=>{
    if(!isLoaded||!signIn||!setActive)return;
    const params=new URLSearchParams(window.location.search),ticket=params.get('ticket');
    if(!ticket){setMessage('Este acesso expirou ou está incompleto. Volte ao NexOffice e tente novamente.');return}
    storeNexOfficeEntry(window.location.search);
    let cancelled=false;
    (async()=>{
      try{
        const attempt=await signIn.create({strategy:'ticket',ticket});
        if(cancelled)return;
        window.history.replaceState({},'', '/nexoffice/federated');
        if(attempt.status==='complete'&&attempt.createdSessionId){
          await setActive({session:attempt.createdSessionId});
          if(!cancelled)navigate('/nexoffice/setup',{replace:true});
          return;
        }
        setMessage('Sua conta precisa de uma etapa adicional de segurança. Volte ao NexOffice e use o acesso normal do NR1Check.');
      }catch{
        window.history.replaceState({},'', '/nexoffice/federated');
        if(!cancelled)setMessage('Não foi possível concluir o acesso automático. Volte ao NexOffice e tente novamente.');
      }
    })();
    return()=>{cancelled=true};
  },[isLoaded,signIn,setActive,navigate]);

  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold">N</div><h1 className="text-xl font-semibold text-slate-900">Acesso integrado</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><p className="mt-5 text-xs text-slate-400">Nenhum dado de empregado, saúde, resposta psicossocial, denúncia ou documento é transferido pelo NexOffice.</p></section></main>;
}
