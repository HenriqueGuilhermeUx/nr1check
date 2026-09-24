import {createHmac,randomBytes} from 'node:crypto';

const base=process.env.SMOKE_API_URL||'http://127.0.0.1:3000';
const secret=process.env.NEXOFFICE_COMPLIANCE_BRIDGE_SECRET;if(!secret)throw new Error('NEXOFFICE_COMPLIANCE_BRIDGE_SECRET required');
const workspaceRef=process.env.SMOKE_NEXOFFICE_WORKSPACE||'11111111-1111-4111-8111-111111111111';
const assert=(value,message)=>{if(!value)throw new Error(`ASSERT: ${message}`)};

function tokenFor(payload){const encoded=Buffer.from(JSON.stringify(payload)).toString('base64url');const sig=createHmac('sha256',secret).update(encoded).digest('base64url');return `${encoded}.${sig}`}
async function call(path,{method='GET',body,key,expect}={}){const headers={'content-type':'application/json'};if(key)headers['x-nexoffice-compliance-key']=key;const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(expect!==undefined){assert(response.status===expect,`${method} ${path}: expected ${expect}, got ${response.status} ${JSON.stringify(payload)}`);return{status:response.status,payload}}if(!response.ok)throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(payload)}`);return payload}

const handoffPayload={v:1,workspaceRef,businessName:'Empresa Bridge Teste',sector:'professional_services',exp:Math.floor(Date.now()/1000)+600,nonce:randomBytes(12).toString('base64url')};
const validToken=tokenFor(handoffPayload);
const verified=await call('/api/nexoffice/handoff/verify',{method:'POST',body:{token:validToken}});
assert(verified.source==='nexoffice','signed handoff source is NexOffice');assert(verified.workspaceRef===workspaceRef,'handoff is bound to workspace');assert(verified.businessName==='Empresa Bridge Teste','business context survives verification');assert(verified.privacy==='business_context_only','handoff exposes business context only');assert(!('email' in verified)&&!('cpf' in verified)&&!('employee' in verified),'handoff exposes no identity or employee data');

const tampered=validToken.slice(0,-1)+(validToken.endsWith('A')?'B':'A');
await call('/api/nexoffice/handoff/verify',{method:'POST',body:{token:tampered},expect:401});
const expired=tokenFor({...handoffPayload,exp:Math.floor(Date.now()/1000)-10,nonce:randomBytes(12).toString('base64url')});
await call('/api/nexoffice/handoff/verify',{method:'POST',body:{token:expired},expect:401});

await call(`/api/internal/nexoffice/compliance-summary?workspaceRef=${workspaceRef}`,{key:'wrong-key',expect:401});
const summary=await call(`/api/internal/nexoffice/compliance-summary?workspaceRef=${workspaceRef}`,{key:secret});
assert(summary.workspaceRef===workspaceRef,'summary stays bound to linked workspace');assert(summary.sourceProduct==='nr1check','summary source is NR1Check');assert(summary.diagnosticStatus==='in_progress','active assessment is summarized without answers');assert(summary.programStatus==='attention','overdue action creates aggregate attention state');assert(summary.openActions===2,'open action count is aggregated');assert(summary.overdueActions===1,'overdue action count is aggregated');assert(summary.completionPct===33,'completion percentage derives from action status only');assert(summary.privacy?.mode==='aggregate_only','summary privacy contract is aggregate-only');
const serialized=JSON.stringify(summary);
for(const forbidden of ['52998224725','SECRET-PSYCHOSOCIAL-ANSWER','SECRET-COMPLAINT-CONTENT','SECRET-EVIDENCE','employeeName','psychosocialAnswers','complaintContent'])assert(!serialized.includes(forbidden),`summary must not leak ${forbidden}`);

const health=await call('/api/internal/nexoffice/health',{key:secret});assert(health.status==='ok'&&health.handoff==='signed'&&health.summary==='aggregate_only','bridge health declares safe contract');assert(health.rawEmployeeData===false&&health.rawPsychosocialAnswers===false&&health.complaintContent===false&&health.rawDocuments===false,'bridge health explicitly denies raw sensitive classes');
console.log(JSON.stringify({ok:true,workspaceRef,handoff:'signed',summary:{diagnosticStatus:summary.diagnosticStatus,programStatus:summary.programStatus,openActions:summary.openActions,overdueActions:summary.overdueActions,completionPct:summary.completionPct},privacy:summary.privacy},null,2));
