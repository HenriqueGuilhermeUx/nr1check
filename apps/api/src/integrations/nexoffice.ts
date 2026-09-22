import type {Express,Request} from 'express';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {createClerkClient} from '@clerk/backend';
import {z} from 'zod';

const Input=z.object({
  workspaceRef:z.string().uuid(),
  businessName:z.string().trim().min(1).max(180),
  sector:z.string().trim().max(120).default(''),
  userRef:z.string().uuid(),
  userEmail:z.string().email().max(320),
  userName:z.string().trim().min(1).max(160),
}).strict();

function same(received:string,expected:string){if(!received||!expected)return false;const a=Buffer.from(received),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b)}
function webBase(){const raw=String(process.env.APP_BASE_URL||'').split(',').map(x=>x.trim()).find(Boolean);if(!raw)return null;try{const url=new URL(raw);return url.origin}catch{return null}}
function splitName(name:string){const parts=name.trim().split(/\s+/).filter(Boolean);return{firstName:parts[0]||'NexOffice',lastName:parts.slice(1).join(' ')||undefined}}

async function ensureClerkUser(input:z.infer<typeof Input>){
  const secretKey=String(process.env.CLERK_SECRET_KEY||'').trim();if(!secretKey)throw new Error('CLERK_SECRET_KEY not configured');
  const clerk=createClerkClient({secretKey}),externalId=`nexoffice:${input.userRef}`;
  const byExternal=await clerk.users.getUserList({externalId:[externalId],limit:1});
  if(byExternal.data[0])return{clerk,user:byExternal.data[0],created:false};
  const byEmail=await clerk.users.getUserList({emailAddress:[input.userEmail],limit:1});
  if(byEmail.data[0])return{clerk,user:byEmail.data[0],created:false};
  const names=splitName(input.userName);
  try{
    const user=await clerk.users.createUser({emailAddress:[input.userEmail],emailAddressIdentificationStatus:['reserved'],externalId,firstName:names.firstName,lastName:names.lastName,skipPasswordRequirement:true,privateMetadata:{origin:'nexoffice'}});
    return{clerk,user,created:true};
  }catch(error){
    const password=`Nx!${randomBytes(30).toString('base64url')}a9`;
    const user=await clerk.users.createUser({emailAddress:[input.userEmail],emailAddressIdentificationStatus:['reserved'],externalId,firstName:names.firstName,lastName:names.lastName,password,privateMetadata:{origin:'nexoffice'}});
    return{clerk,user,created:true};
  }
}

export function registerNexOfficeFederatedEntry(app:Express){
  app.post('/api/integrations/nexoffice/session',async(req,res)=>{
    const expected=String(process.env.NEXOFFICE_BRIDGE_KEY||'').trim(),received=String(req.headers['x-nexoffice-key']||'');
    if(!expected)return res.status(503).json({error:'nexoffice_bridge_not_configured'});
    if(!same(received,expected))return res.status(401).json({error:'unauthorized'});
    const parsed=Input.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'invalid_payload',issues:parsed.error.issues.map(x=>({path:x.path.join('.'),code:x.code}))});
    const base=webBase();if(!base)return res.status(503).json({error:'app_base_url_not_configured'});
    try{
      const {clerk,user,created}=await ensureClerkUser(parsed.data);
      const signInToken=await clerk.signInTokens.createSignInToken({userId:user.id,expiresInSeconds:120});
      const url=new URL('/nexoffice/access',base);url.searchParams.set('token',signInToken.token);url.searchParams.set('source','nexoffice');url.searchParams.set('workspaceRef',parsed.data.workspaceRef);url.searchParams.set('businessName',parsed.data.businessName);if(parsed.data.sector)url.searchParams.set('sector',parsed.data.sector);
      console.info(JSON.stringify({integration:'nexoffice',event:'federated_session_created',workspaceRef:parsed.data.workspaceRef,userCreated:created,sensitiveBusinessDataShared:false}));
      return res.json({url:url.toString(),expiresInSeconds:120,accountProvisioned:created,sharedBusinessFields:['workspaceRef','businessName','sector'],userIdentityTransferredServerSide:true,sensitiveBusinessDataShared:false});
    }catch(error){console.error('NexOffice federated entry failed',error instanceof Error?error.message:String(error));return res.status(502).json({error:'federated_entry_failed'});}
  });
}
