export type NexOfficeEntryContext={
  source:'nexoffice';
  workspaceRef:string;
  businessName:string;
  sector:string;
  receivedAt:string;
};

const KEY='nr1check:nexoffice-entry';
const MAX_AGE_MS=24*60*60*1000;

function safe(value:string|null,max:number){return String(value||'').trim().slice(0,max)}

export function storeNexOfficeEntry(search:string):NexOfficeEntryContext|null{
  const params=new URLSearchParams(search);
  if(params.get('source')!=='nexoffice')return null;
  const workspaceRef=safe(params.get('workspaceRef'),100);
  const businessName=safe(params.get('businessName'),180);
  const sector=safe(params.get('sector'),120);
  if(!workspaceRef||!businessName)return null;
  const context:NexOfficeEntryContext={source:'nexoffice',workspaceRef,businessName,sector,receivedAt:new Date().toISOString()};
  window.localStorage.setItem(KEY,JSON.stringify(context));
  return context;
}

export function readNexOfficeEntry():NexOfficeEntryContext|null{
  try{
    const raw=window.localStorage.getItem(KEY);if(!raw)return null;
    const value=JSON.parse(raw) as Partial<NexOfficeEntryContext>;
    const receivedAt=Date.parse(String(value.receivedAt||''));
    if(value.source!=='nexoffice'||!value.workspaceRef||!value.businessName||!receivedAt||Date.now()-receivedAt>MAX_AGE_MS){clearNexOfficeEntry();return null}
    return {source:'nexoffice',workspaceRef:safe(String(value.workspaceRef),100),businessName:safe(String(value.businessName),180),sector:safe(String(value.sector||''),120),receivedAt:new Date(receivedAt).toISOString()};
  }catch{return null}
}

export function clearNexOfficeEntry(){window.localStorage.removeItem(KEY)}
