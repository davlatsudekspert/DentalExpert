import {guardPost,ROLES,sha256,signedIn,USER_COLUMNS} from '../../_lib/auth';
import {cityIdOk,json,type Env} from '../../_lib/db';
import {oauthEnabled,PROVIDERS,verifyIdToken,type Provider} from '../../_lib/oauth';
import {underLimit} from '../../_lib/ratelimit';

const MAX_PER_IP=60, WINDOW_S=600;
type Row=Record<string,string|number|null>;

// Sign in with Google / Apple. Body: {provider, idToken, nonce?, name?, role?, countryCode?, cityId?}.
// Returns the same shape as /api/auth/verify. Linking: provider subject first, then the same verified email, else a new user.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const g=guardPost(request);if(g)return g;
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 if(!body||typeof body!=='object')return json({error:'bad_token'},400,'no-store');
 const provider=body.provider as Provider;
 if(!PROVIDERS.includes(provider))return json({error:'invalid_provider'},400,'no-store');
 if(!oauthEnabled(env,provider))return json({error:'oauth_disabled'},503,'no-store');

 const ip=request.headers.get('cf-connecting-ip')||'local';
 if(!await underLimit(env,'oauth:'+await sha256(ip+(env.AUTH_SECRET||'')),MAX_PER_IP,WINDOW_S))
  return json({error:'too_many_requests'},429,'no-store');

 const idToken=body.idToken;
 if(typeof idToken!=='string'||!idToken)return json({error:'bad_token'},400,'no-store');
 if(body.nonce!=null&&(typeof body.nonce!=='string'||!body.nonce||body.nonce.length>512))return json({error:'bad_token'},400,'no-store');
 const v=await verifyIdToken(env,request,provider,idToken,body.nonce as string|undefined);
 if(!v.ok)return json({error:v.error},v.status,'no-store');

 const byId=(id:string)=>env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id=?`).bind(id).first<Row>();
 const ident=await env.DB.prepare(`SELECT user_id FROM oauth_identities WHERE provider=? AND subject=?`).bind(provider,v.sub).first<{user_id:string}>();
 let user=ident?await byId(ident.user_id):null;
 if(!user){
  // An existing account with this verified email keeps its stored profile; only a new account takes the sign-up fields.
  user=await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email=?`).bind(v.email).first<Row>();
  if(!user){
   const role=ROLES.includes(body.role as never)?body.role as string:'patient';
   // Apple sends the name only to the app, on the first authorisation, so the body's name wins over the token's.
   const name=(typeof body.name==='string'?body.name.trim().slice(0,80):'')||v.name;
   const cityId=typeof body.cityId==='string'&&cityIdOk(body.cityId)?body.cityId:null;
   const countryCode=typeof body.countryCode==='string'&&/^[A-Z]{2}$/.test(body.countryCode)?body.countryCode:null;
   // ON CONFLICT keeps two simultaneous first sign-ins from failing; the row that won is read back.
   await env.DB.prepare(`INSERT INTO users (id,email,name,role,country_code,city_id,email_verified_at) VALUES (?,?,?,?,?,?,datetime('now')) ON CONFLICT (email) DO NOTHING`)
    .bind(crypto.randomUUID(),v.email,name,role,countryCode,cityId).run();
   user=await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email=?`).bind(v.email).first<Row>();
   if(!user)return json({error:'server_error'},500,'no-store');
  }else await env.DB.prepare(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,datetime('now')) WHERE id=?`).bind(user.id).run();
  await env.DB.prepare(`INSERT INTO oauth_identities (provider,subject,user_id) VALUES (?,?,?) ON CONFLICT (provider,subject) DO UPDATE SET user_id=excluded.user_id`)
   .bind(provider,v.sub,user.id).run();
 }
 return signedIn(env,request,user);
};
