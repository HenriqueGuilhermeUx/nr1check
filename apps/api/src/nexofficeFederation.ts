import type {Express,Request,Response} from 'express';
import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';

const Input=z.object({
  workspaceRef:z.string().uuid(),
  businessName:z.string().trim().min(1).max(180),
  sector:z.string().trim().max(120).default(''),
  userRef:z.string().trim().min(1).max(180),
  userEmail:z.string().email().max(320),
  userName:z.string().trim().min(1).max(180),
}).strict();

const safeEqual=(a:string,b:string)=>{if(!a||!b)return false;const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb)};
const webBase=()=>String(process.env.NR1CHECK_WEB_URL||process.env.NETLIFY_URL||process.env.APP_BASE_URL||'').split(',')[0].trim().replace(/\/$/,'');

async function clerk(path:string,init?:RequestInit){
  const secret=String(process.env.CLERK_SECRET_KEY||'').trim();
  if(!secret)throw new Error('CLERK_SECRET_KEY_NOT_CONFIGURED');
  const response=await fetch(`https://api.clerk.com/v1/${path.replace(/^\//,'')}`,{...init,headers:{accept:'application/json','content-type':'application/json',authorization:`Bearer ${secret}`,...(init?.headers||{})},signal:AbortSignal.timeout(8000)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(`CLERK_${response.status}`),{status:response.status,payload});
  return payload as any;
}

async function findExistingClerkUser(email:string){
  const users=await clerk(`users?query=${encodeURIComponent(email)}&limit=20`);
  const list=Array.isArray(users)?users:Array.isArray(users?.data)?users.data:[];
  const normalized=email.trim().toLowerCase();
  return list.find((user:any)=>Array.isArray(user?.email_addresses)&&user.email_addresses.some((item:any)=>String(item?.email_address||'').toLowerCase()===normalized))||null;
}

export function registerNexOfficeFederation(app:Express){
  app.post('/api/integrations/nexoffice/session',async(req:Request,res:Response)=>{
    const expected=String(process.env.NEXOFFICE_BRIDGE_KEY||'').trim();
    const received=String(req.headers['x-nexoffice-key']||'').trim();
    if(!expected)return res.status(503).json({error:'NEXOFFICE_BRIDGE_NOT_CONFIGURED'});
    if(!safeEqual(received,expected))return res.status(401).json({error:'UNAUTHORIZED'});
    const parsed=Input.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'INVALID_HANDOFF',issues:parsed.error.issues.map(x=>({path:x.path.join('.'),code:x.code}))});
    const base=webBase();if(!base)return res.status(503).json({error:'NR1CHECK_WEB_URL_NOT_CONFIGURED'});
    try{
      const user=await findExistingClerkUser(parsed.data.userEmail);
      if(!user)return res.status(409).json({error:'ACCOUNT_NOT_FOUND',fallback:true,message:'Usuário ainda não possui identidade NR1Check.'});
      const signIn=await clerk('sign_in_tokens',{method:'POST',body:JSON.stringify({user_id:user.id,expires_in_seconds:120})});
      const url=new URL('/nexoffice/federated',base);
      url.searchParams.set('ticket',String(signIn.token));
      url.searchParams.set('source','nexoffice');
      url.searchParams.set('workspaceRef',parsed.data.workspaceRef);
      url.searchParams.set('businessName',parsed.data.businessName);
      if(parsed.data.sector)url.searchParams.set('sector',parsed.data.sector);
      return res.status(201).json({url:url.toString(),expiresInSeconds:120,accountProvisioned:false,identityMode:'existing_user_ticket',sharedBusinessFields:['workspaceRef','businessName','sector'],sensitiveBusinessDataShared:false});
    }catch(error:any){
      console.error('NexOffice federation failed',{code:error?.message,status:error?.status||null});
      return res.status(502).json({error:'FEDERATION_UNAVAILABLE',fallback:true});
    }
  });
}
