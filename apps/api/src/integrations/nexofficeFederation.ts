import type {Express,Request} from 'express';
import {createClerkClient} from '@clerk/backend';
import {z} from 'zod';
import {verifyNexOfficeHandoffToken} from './nexoffice';

const SessionInput=z.object({
  handoffToken:z.string().min(20).max(5000),
  userRef:z.string().trim().min(1).max(160),
  userEmail:z.string().trim().email().max(320),
  userName:z.string().trim().min(1).max(160),
}).strict();
type SessionInputType=z.infer<typeof SessionInput>;

type ClerkLike={
  users:{
    getUserList:(params:{emailAddress:string[];limit:number})=>Promise<{data:Array<{id:string}>}>;
    createUser:(params:{emailAddress:string[];firstName?:string;lastName?:string;skipPasswordRequirement:true;publicMetadata:Record<string,unknown>})=>Promise<{id:string}>;
  };
  signInTokens:{createSignInToken:(params:{userId:string;expiresInSeconds:number})=>Promise<{token:string}>};
};

function bridgeSecret(){return String(process.env.NEXOFFICE_COMPLIANCE_BRIDGE_SECRET||'').trim()}
function safeEqual(received:string,expected:string){if(!received||!expected)return false;const a=Buffer.from(received),b=Buffer.from(expected);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function firstAppBaseUrl(){for(const raw of String(process.env.APP_BASE_URL||'').split(',')){const value=raw.trim();if(!value)continue;try{const url=new URL(value);if(['https:','http:'].includes(url.protocol))return url.toString().replace(/\/$/,'')}catch{}}return null}
function nameParts(value:string){const parts=value.trim().split(/\s+/).filter(Boolean);return{firstName:parts.shift()||undefined,lastName:parts.length?parts.join(' '):undefined}}

export async function createNexOfficeFederatedSession(input:SessionInputType,clerk:ClerkLike,webBase:string){
  const normalized=SessionInput.parse(input),handoff=verifyNexOfficeHandoffToken(normalized.handoffToken),email=normalized.userEmail.toLowerCase();
  const existing=await clerk.users.getUserList({emailAddress:[email],limit:1});let user=existing.data[0]||null,accountProvisioned=false;
  if(!user){const names=nameParts(normalized.userName);user=await clerk.users.createUser({emailAddress:[email],firstName:names.firstName,lastName:names.lastName,skipPasswordRequirement:true,publicMetadata:{source:'nexoffice',nexofficeUserRef:normalized.userRef}});accountProvisioned=true}
  const signIn=await clerk.signInTokens.createSignInToken({userId:user.id,expiresInSeconds:120});
  const url=new URL('/nexoffice/federated',webBase);url.searchParams.set('ticket',signIn.token);url.searchParams.set('handoff',normalized.handoffToken);
  return{url:url.toString(),expiresInSeconds:120,accountProvisioned,companyCreated:false,identityInBrowserUrl:false,businessContextOpaque:true,workspaceRef:handoff.workspaceRef};
}

export function registerNexOfficeFederation(app:Express){
  app.post('/api/integrations/nexoffice/session',async(req:Request,res)=>{
    const expected=bridgeSecret(),received=String(req.headers['x-nexoffice-compliance-key']||'').trim();if(!expected)return res.status(503).json({error:'nexoffice_compliance_bridge_not_configured'});if(!safeEqual(received,expected))return res.status(401).json({error:'unauthorized'});
    const secretKey=String(process.env.CLERK_SECRET_KEY||'').trim(),webBase=firstAppBaseUrl();if(!secretKey||!webBase)return res.status(503).json({error:'federation_not_configured'});
    const parsed=SessionInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'invalid_request',issues:parsed.error.issues});
    try{const clerk=createClerkClient({secretKey}) as unknown as ClerkLike;const result=await createNexOfficeFederatedSession(parsed.data,clerk,webBase);return res.status(201).json(result)}catch(error){console.error('NexOffice federation failed',error instanceof Error?error.message:String(error));return res.status(502).json({error:'federation_failed'})}
  });
}
