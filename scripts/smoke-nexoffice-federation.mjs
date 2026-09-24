const {createNexOfficeFederatedSession}=await import('../apps/api/dist/integrations/nexofficeFederation.js');
const assert=(value,message)=>{if(!value)throw new Error(`ASSERT: ${message}`)};

function fakeClerk(existing=true){
  const calls={list:[],create:[],token:[]};
  const client={
    users:{
      async getUserList(params){calls.list.push(params);return{data:existing?[{id:'user_existing'}]:[]}},
      async createUser(params){calls.create.push(params);return{id:'user_created'}},
    },
    signInTokens:{async createSignInToken(params){calls.token.push(params);return{token:'ticket_single_use_test'}}},
  };
  return{client,calls};
}

const input={workspaceRef:'11111111-1111-4111-8111-111111111111',businessName:'Empresa Federada',sector:'professional_services',userRef:'nexa-user-123',userEmail:'OWNER@EXAMPLE.COM',userName:'Maria Empresária'};

const existing=fakeClerk(true);const first=await createNexOfficeFederatedSession(input,existing.client,'https://nr1check.example.com');
assert(first.accountProvisioned===false,'existing Clerk account is reused');
assert(existing.calls.create.length===0,'existing user is never duplicated');
assert(existing.calls.token[0]?.expiresInSeconds===120,'ticket is short-lived');
let url=new URL(first.url);
assert(url.origin==='https://nr1check.example.com','redirect stays on configured NR1Check origin');
assert(url.pathname==='/nexoffice/federated','redirect uses dedicated federated consumer');
assert(url.searchParams.get('ticket')==='ticket_single_use_test','one-time ticket is returned to browser consumer');
assert(url.searchParams.get('workspaceRef')===input.workspaceRef,'safe workspace ref is preserved');
assert(url.searchParams.get('businessName')===input.businessName,'safe business name is preserved');
assert(!url.searchParams.has('userEmail')&&!url.searchParams.has('userName')&&!url.searchParams.has('userRef'),'identity never appears in browser URL');
assert(first.companyCreated===false,'federation never creates company/CNPJ records');

const fresh=fakeClerk(false);const second=await createNexOfficeFederatedSession(input,fresh.client,'https://nr1check.example.com');
assert(second.accountProvisioned===true,'missing auth account is provisioned');
assert(fresh.calls.create.length===1,'only one auth user is provisioned');
assert(fresh.calls.create[0].emailAddress[0]==='owner@example.com','email is normalized server-side');
assert(fresh.calls.create[0].skipPasswordRequirement===true,'no duplicate password is requested');
assert(fresh.calls.create[0].firstName==='Maria'&&fresh.calls.create[0].lastName==='Empresária','safe display name is preserved server-side');
assert(fresh.calls.token[0].userId==='user_created','ticket is bound to provisioned Clerk account');

console.log(JSON.stringify({ok:true,existingAccount:first.accountProvisioned,newAccount:second.accountProvisioned,ticketTtlSeconds:120,companyCreated:false,identityInBrowserUrl:false,sharedBusinessFields:first.sharedBusinessFields},null,2));
