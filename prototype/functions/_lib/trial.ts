import {TRIAL_DAYS} from '../../src/proConfig';
import {devEcho,hmac,isLocal,randomToken,sha256} from './auth';
import type {Env} from './db';

// One trial per person. A new account gets the 30-day trial only when none of the person's identifiers has claimed one:
// the normalized e-mail, the phone's device id (native apps), the web cookie; a coarse network address may claim at most
// IP_MAX trials in 30 days. A denied account still signs up and works; it starts on the Free tier.
// Only salted hashes are stored (pepper: TRIAL_PEPPER, else AUTH_SECRET).
export const IP_MAX=5;
export type TrialDenied='email'|'device'|'cookie'|'ip';
export const TRIAL_COOKIE='de_trial';

/** Providers whose "+tag" addresses all reach the same inbox. */
const PLUS_DOMAINS=new Set(['gmail.com','outlook.com','hotmail.com','live.com','icloud.com','me.com','proton.me','protonmail.com','fastmail.com']);
/** lower-case; "+tag" removed on those providers; Gmail ignores dots and googlemail.com is gmail.com. */
export function normalizedEmail(email:string){
 const [l0,d0]=email.trim().toLowerCase().split('@');
 if(!l0||!d0)return email.trim().toLowerCase();
 const domain=d0==='googlemail.com'?'gmail.com':d0;
 let local=PLUS_DOMAINS.has(domain)?l0.split('+')[0]:l0;
 if(domain==='gmail.com')local=local.replace(/\./g,'');
 return local+'@'+domain;
}
const pepper=(env:Env)=>env.TRIAL_PEPPER||env.AUTH_SECRET||'dev';
const h=(env:Env,kind:string,v:string)=>sha256(pepper(env)+':'+kind+':'+v);
const deviceOf=(request:Request)=>{const v=request.headers.get('x-device-id')||'';return /^[0-9a-fA-F-]{36}$/.test(v)?v.toLowerCase():null};
// Local dev servers see every caller as 127.0.0.1, so the network rule only runs there when a test passes x-test-ip (dev echo only).
const coarseIp=(env:Env,request:Request)=>{const ip=devEcho(env,request)?request.headers.get('x-test-ip'):request.headers.get('cf-connecting-ip');if(!ip)return null;return ip.includes(':')?ip.split(':').slice(0,4).join(':'):ip.split('.').slice(0,3).join('.')};
const isNative=(request:Request)=>request.headers.get('x-client')==='native';

async function cookieValue(env:Env,request:Request){
 const m=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(TRIAL_COOKIE+'='));
 const v=m?.slice(TRIAL_COOKIE.length+1)||'';
 const [id,sig]=v.split('.');
 return id&&sig&&sig===(await hmac(env.AUTH_SECRET||'dev','trial:'+id)).slice(0,32)?id:null;
}

/** Other accounts (or deleted ones, via their claim) that are the same person by e-mail. */
async function emailClaimed(env:Env,userId:string,email:string,emailHash:string){
 const c=await env.DB.prepare(`SELECT 1 AS x FROM trial_claims WHERE kind='email' AND hash=? AND (user_id IS NULL OR user_id<>?) LIMIT 1`).bind(emailHash,userId).first();
 if(c)return true;
 const norm=normalizedEmail(email),[local,domain]=norm.split('@');
 // Existing accounts with the same normalized address (aliases): same domain (or gmail/googlemail), local part starting with the base.
 // (Providers outside the "+tag" list keep the tag, so test-style addresses like a+1@example.com stay distinct people.)
 // The local part with dots removed (Gmail) must start with the base name; the exact comparison happens in JS below.
 const dots=domain==='gmail.com'?`replace(substr(email,1,instr(email,'@')-1),'.','')`:`substr(email,1,instr(email,'@')-1)`;
 const doms=domain==='gmail.com'?['gmail.com','googlemail.com']:[domain];
 const {results}=await env.DB.prepare(
  `SELECT email FROM users WHERE id<>? AND guest=0 AND (${doms.map(()=>`email LIKE ? ESCAPE '\\'`).join(' OR ')}) AND ${dots} LIKE ? ESCAPE '\\' LIMIT 200`
 ).bind(userId,...doms.map(d=>'%@'+d),local.replace(/[%_\\]/g,m=>'\\'+m)+'%').all<{email:string}>();
 return results.some(r=>normalizedEmail(r.email)===norm);
}

/** Decides and records the trial of a NEW account. Never throws to the caller's sign-up: failures leave the default trial. */
export async function startTrial(env:Env,request:Request,user:{id:string;email:string}):Promise<{denied:TrialDenied|null;cookie?:string}>{
 const emailHash=await h(env,'email',normalizedEmail(user.email));
 const dev=deviceOf(request),devHash=dev?await h(env,'device',dev):null;
 const native=isNative(request);
 const ck=native?null:await cookieValue(env,request);
 const ckHash=ck?await h(env,'cookie',ck):null;
 const ip=coarseIp(env,request),ipHash=ip?await h(env,'ip',ip):null;
 const used=async(kind:string,hash:string|null)=>!!hash&&!!await env.DB.prepare(`SELECT 1 AS x FROM trial_claims WHERE kind=? AND hash=? AND (user_id IS NULL OR user_id<>?) LIMIT 1`).bind(kind,hash,user.id).first();
 let denied:TrialDenied|null=null;
 if(await emailClaimed(env,user.id,user.email,emailHash))denied='email';
 else if(await used('device',devHash))denied='device';
 else if(await used('cookie',ckHash))denied='cookie';
 else if(ipHash){
  const n=(await env.DB.prepare(`SELECT COUNT(*) AS n FROM trial_claims WHERE kind='ip' AND hash=? AND claimed_at>datetime('now','-30 days')`).bind(ipHash).first<{n:number}>())?.n||0;
  if(n>=IP_MAX)denied='ip';
 }
 // The cookie (web) is minted once per browser and is itself a claim.
 let cookie:string|undefined,newCk:string|null=null;
 if(!native&&!ck){newCk=randomToken().slice(0,24);cookie=`${TRIAL_COOKIE}=${newCk}.${(await hmac(env.AUTH_SECRET||'dev','trial:'+newCk)).slice(0,32)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${isLocal(request)?'':'; Secure'}`}
 const claims:[string,string][]=[['email',emailHash]];
 if(devHash)claims.push(['device',devHash]);
 if(newCk)claims.push(['cookie',await h(env,'cookie',newCk)]);
 if(ckHash)claims.push(['cookie',ckHash]);
 if(ipHash&&!denied)claims.push(['ip',ipHash]);
 await env.DB.batch([
  env.DB.prepare(`UPDATE users SET trial_ends_at=${denied?`datetime('now')`:`datetime('now','+${TRIAL_DAYS} days')`},trial_denied=? WHERE id=?`).bind(denied?1:0,user.id),
  // Claims by this account are kept once per (kind,hash): a denied repeat does not add rows.
  ...claims.map(([k,v])=>env.DB.prepare(`INSERT INTO trial_claims (kind,hash,user_id) SELECT ?1,?2,?3 WHERE ?4=1 OR NOT EXISTS (SELECT 1 FROM trial_claims WHERE kind=?1 AND hash=?2)`).bind(k,v,user.id,k==='ip'?1:0))
 ]);
 return {denied,cookie};
}

/** Keeps the e-mail claim when an account is deleted, so deleting and signing up again does not bring the trial back. */
export async function keepEmailClaim(env:Env,userId:string,email:string){
 const hash=await h(env,'email',normalizedEmail(email));
 await env.DB.prepare(`INSERT INTO trial_claims (kind,hash,user_id) SELECT 'email',?1,?2 WHERE NOT EXISTS (SELECT 1 FROM trial_claims WHERE kind='email' AND hash=?1)`).bind(hash,userId).run();
 // The claim keeps no link to a person once the account is gone.
}

/** Admin: give an e-mail (and optionally a raw device id) a fresh trial: removes its claims and restarts the user's trial. */
export async function resetTrial(env:Env,email:string,deviceId:string|null){
 const u=await env.DB.prepare(`SELECT id FROM users WHERE email=?`).bind(email).first<{id:string}>();
 const stmts=[env.DB.prepare(`DELETE FROM trial_claims WHERE kind='email' AND hash=?`).bind(await h(env,'email',normalizedEmail(email)))];
 if(deviceId)stmts.push(env.DB.prepare(`DELETE FROM trial_claims WHERE kind='device' AND hash=?`).bind(await h(env,'device',deviceId.toLowerCase())));
 if(u){
  stmts.push(env.DB.prepare(`DELETE FROM trial_claims WHERE user_id=? AND kind IN ('device','cookie','email')`).bind(u.id));
  stmts.push(env.DB.prepare(`UPDATE users SET trial_ends_at=datetime('now','+${TRIAL_DAYS} days'),trial_denied=0 WHERE id=?`).bind(u.id));
 }
 await env.DB.batch(stmts);
 return !!u;
}
