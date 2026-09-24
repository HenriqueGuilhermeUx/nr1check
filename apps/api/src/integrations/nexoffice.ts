import type {Express,Request} from 'express';
import {timingSafeEqual} from 'node:crypto';
import {createClerkClient} from '@clerk/backend';
import {z} from 'zod';

const SessionInput=z.object({
  workspaceRef:z.string().uuid(),
  businessName:z.string().trim().min(2).max(180),
  sector:z.string().trim().max(120).default(''),
  userRef:z.string().trim().min(1).max(220),
  userEmail:z.string().email(),
  userName:z.string().trim().min(1).max(160),
}).strict();

function safeEqual(received:string,expected:string){if(!received||!expected)return false;const a=Buffer.from(received),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b)}
function safeBase(value:string){const raw=String(value||'').split(',')[0]?.trim();if(!raw)return null;try{const url=new URL(raw);if(!['https:','http:'].includes(url.protocol))return null;return url.toString().replace(/\/$/,'')}catch{return null}}
function firstLast(name:string){const parts=name.trim().split(/\s+/).filter(Boolean);return{firstName:parts[0]||'Usuário',lastName:parts.slice(1).join(' ')||undefined}}

function authorize(req:Request){
  const expected=String(process.env.NEXOFFICE_BRIDGE_KEY||'').trim();
  if(!expected)return{ok:false,status:503,error:'bridge_not_configured',message:'NEXOFFICE_BRIDGE_KEY não configurada.'} as const;
  const received=String(req.headers['x-nexoffice-key']||'');
  if(!safeEqual(received,expected))return{ok:false,status:401,error:'unauthorized',message:'Credencial NexOffice inválida.'} as const;
  return{ok:true} as const;
}

export function registerNexOfficeIntegration(app:Express){
  app.post('/api/integrations/nexoffice/session',async(req,res)=>{
    const auth=authorize(req);if(!auth.ok)return res.status(auth.status).json({error:auth.error,message:auth.message});
    const parsed=SessionInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'invalid_payload',issues:parsed.error.issues});
    const secretKey=String(process.env.CLERK_SECRET_KEY||'').trim(),webBase=safeBase(String(process.env.APP_BASE_URL||''));
    if(!secretKey||!webBase)return res.status(503).json({error:'federation_not_configured',message:'Clerk/APP_BASE_URL não configurados para handoff federado.'});
    const apiUrl=safeBase(String(process.env.CLERK_API_URL||''))||undefined;
    const clerk=createClerkClient({secretKey,...(apiUrl?{apiUrl}: {})});
    const input=parsed.data,email=input.userEmail.trim().toLowerCase();
    try{
      const existing=await clerk.users.getUserList({emailAddress:[email],limit:1});
      let user=existing.data[0],accountProvisioned=false;
      if(!user){
        const names=firstLast(input.userName);
        user=await clerk.users.createUser({emailAddress:[email],firstName:names.firstName,lastName:names.lastName,skipPasswordRequirement:true,publicMetadata:{source:'nexoffice'}});
        accountProvisioned=true;
      }
      const token=await clerk.signInTokens.createSignInToken({userId:user.id,expiresInSeconds:120});
      const url=new URL('/nexoffice/federated',webBase);
      url.searchParams.set('source','nexoffice');
      url.searchParams.set('ticket',token.token);
      url.searchParams.set('workspaceRef',input.workspaceRef);
      url.searchParams.set('businessName',input.businessName);
      if(input.sector)url.searchParams.set('sector',input.sector);
      return res.status(201).json({url:url.toString(),expiresInSeconds:120,accountProvisioned,privacy:{businessContextOnly:true,employeeDataAccepted:false,healthDataAccepted:false,complaintDataAccepted:false,rawDocumentsAccepted:false}});
    }catch(error){
      console.error('NexOffice federated handoff failed:',error);
      return res.status(502).json({error:'federated_handoff_failed',message:'Não foi possível preparar o acesso federado ao NR1Check.'});
    }
  });
}