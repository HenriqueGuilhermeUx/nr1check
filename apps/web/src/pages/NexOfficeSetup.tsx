import {useState} from 'react';
import {Building2,CheckCircle2,Loader2,ShieldCheck} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {trpc} from '../lib/trpc';
import {clearNexOfficeEntry,readNexOfficeEntry} from '../lib/nexofficeEntry';

function cleanDocument(value:string){return value.replace(/\D/g,'')}

export default function NexOfficeSetup(){
  const navigate=useNavigate();
  const context=readNexOfficeEntry();
  const [form,setForm]=useState(()=>({name:context?.businessName||'',cnpj:'',sector:context?.sector||'',cnaeCode:''}));
  const [saving,setSaving]=useState(false);
  const create=trpc.company.create.useMutation();
  const utils=trpc.useUtils();

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const cnpj=cleanDocument(form.cnpj);
    if(!form.name.trim())return toast.error('Informe o nome da empresa.');
    if(cnpj.length!==14)return toast.error('CNPJ deve ter 14 dígitos.');
    setSaving(true);
    try{
      const saved=await create.mutateAsync({name:form.name.trim(),cnpj,sector:form.sector.trim()||undefined,cnaeCode:form.cnaeCode.trim()||undefined,type:'empresa',size:'micro'});
      await utils.company.my.invalidate();
      window.localStorage.setItem('nr1check:selected-company-id',String(saved.id));
      window.localStorage.setItem('nr1check:user-mode','empresa');
      clearNexOfficeEntry();
      toast.success('Empresa conectada ao seu acesso NR1Check.');
      navigate('/dashboard');
    }catch(error){toast.error(error instanceof Error?error.message:'Não foi possível cadastrar a empresa.')}finally{setSaving(false)}
  }

  if(!context)return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><ShieldCheck className="mx-auto h-10 w-10 text-emerald-600"/><h1 className="mt-4 text-xl font-bold">Contexto do NexOffice expirou</h1><p className="mt-2 text-sm text-slate-500">Volte ao NexOffice e abra o NR1Check novamente. Nenhum dado foi criado automaticamente.</p><button className="btn-secondary mt-5" onClick={()=>navigate('/comecar')}>Continuar pelo onboarding normal</button></div></div>;

  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl md:p-9">
    <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Building2 className="h-6 w-6"/></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">NexOffice → NR1Check</p><h1 className="mt-1 text-2xl font-black text-slate-900">Confirme sua empresa</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">Trouxemos apenas nome e setor para poupar digitação. Confirme os dados e informe o CNPJ real. Nenhum funcionário ou dado psicossocial veio do NexOffice.</p></div></div>
    <form onSubmit={submit} className="mt-7 grid gap-4">
      <div><label className="label">Nome da empresa *</label><input className="input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} disabled={saving}/></div>
      <div><label className="label">CNPJ *</label><input className="input" required value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} placeholder="00.000.000/0000-00" disabled={saving}/></div>
      <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Tipo de negócio</label><input className="input" value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})} disabled={saving}/></div><div><label className="label">CNAE principal <span className="text-slate-400">(opcional)</span></label><input className="input" value={form.cnaeCode} onChange={e=>setForm({...form,cnaeCode:e.target.value})} disabled={saving}/></div></div>
      <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/><p>O CNPJ é validado e armazenado somente no NR1Check. A ponte com o NexOffice mantém apenas a referência da empresa para experiência de acesso.</p></div></div>
      <div className="mt-2 flex flex-wrap gap-3"><button type="submit" className="btn-primary" disabled={saving}>{saving?<><Loader2 className="h-4 w-4 animate-spin"/> Salvando...</>:'Confirmar e continuar →'}</button><button type="button" className="btn-secondary" onClick={()=>navigate('/comecar')} disabled={saving}>Usar onboarding normal</button></div>
    </form>
  </div></div>;
}
