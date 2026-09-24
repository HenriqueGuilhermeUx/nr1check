export type NexOfficeEntryContext={
  source:'nexoffice';
  workspaceRef:string;
  businessName:string;
  sector:string;
  expiresAt:string;
  handoffToken:string;
  receivedAt:string;
};

const KEY='nr1check:nexoffice-entry';
const API_BASE_URL=import.meta.env.VITE_API_BASE_URL??'http://localhost:3000';

function safe(value:string|null,max:number){return String(value||'').trim().slice(0,max)}

export async function verifyAndStoreNexOfficeEntry(search:string):Promise<NexOfficeEntryContext|null>{
  const params=new URLSearchParams(search);
  const handoffToken=safe(params.get('handoff'),5000);
  if(!handoffToken)return null;
  const response=await fetch(`${API_BASE_URL}/api/nexoffice/handoff/verify`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:handoffToken})});
  if(!response.ok)return null;
  const payload=await response.json() as any;
  const workspaceRef=safe(payload?.workspaceRef,100),businessName=safe(payload?.businessName,180),sector=safe(payload?.sector,120),expiresAt=String(payload?.expiresAt||'');
  if(payload?.source!=='nexoffice'||!workspaceRef||!businessName||!expiresAt)return null;
  const context:NexOfficeEntryContext={source:'nexoffice',workspaceRef,businessName,sector,expiresAt,handoffToken,receivedAt:new Date().toISOString()};
  window.localStorage.setItem(KEY,JSON.stringify(context));
  return context;
}

export function readNexOfficeEntry():NexOfficeEntryContext|null{
  try{
    const raw=window.localStorage.getItem(KEY);if(!raw)return null;
    const value=JSON.parse(raw) as Partial<NexOfficeEntryContext>;
    const expiresAt=Date.parse(String(value.expiresAt||''));
    if(value.source!=='nexoffice'||!value.workspaceRef||!value.businessName||!value.handoffToken||!expiresAt||expiresAt<=Date.now()){clearNexOfficeEntry();return null}
    return {source:'nexoffice',workspaceRef:safe(String(value.workspaceRef),100),businessName:safe(String(value.businessName),180),sector:safe(String(value.sector||''),120),expiresAt:new Date(expiresAt).toISOString(),handoffToken:safe(String(value.handoffToken),5000),receivedAt:String(value.receivedAt||new Date().toISOString())};
  }catch{clearNexOfficeEntry();return null}
}

export function clearNexOfficeEntry(){window.localStorage.removeItem(KEY)}