import {normalizeEmail} from '../../_lib/auth';
import {needAdmin} from '../../_lib/admin';
import {body,noStore,underLimit} from '../../_lib/classroom';
import {json,type Env} from '../../_lib/db';
import {grantPro,monthsOk,revokePro} from '../../_lib/grants';

// Admin → Pro. GET: current grants (email, until, who granted, whether the account exists yet).
// POST {email, months: 1|3|6|12|null}: grant Pro to any e-mail (null = until revoked). DELETE {email}: revoke.
// Stored even while PRO_ENABLED is off; it only has an effect once the flag is on. Every change is written to admin_audit.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const {results}=await env.DB.prepare(
  `SELECT email,months,granted_by,granted_at,user_id,expires_at FROM pro_grants WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at>datetime('now')) ORDER BY granted_at DESC LIMIT 200`).all<Record<string,unknown>>().catch(()=>({results:[] as Record<string,unknown>[]}));
 return json({grants:results.map(r=>({email:r.email,months:r.months,grantedBy:r.granted_by,grantedAt:r.granted_at,until:r.expires_at,registered:!!r.user_id,pending:!r.user_id}))},200,noStore);
};

async function parse(request:Request,env:Env,needMonths:boolean){
 const a=await needAdmin(env,request);if('res' in a)return a;
 if(!await underLimit(env,'pgrant:'+a.user.id,60,60))return {res:json({error:'rate_limited'},429,noStore)};
 const b=await body(request);if('res' in b)return b;
 const email=normalizeEmail(b.data.email);
 if(!email)return {res:json({error:'bad_email'},400,noStore)};
 const months=b.data.months===undefined?null:b.data.months;
 if(needMonths&&!monthsOk(months))return {res:json({error:'bad_months'},400,noStore)};
 return {admin:a.user.email,email,months:months as number|null};
}
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const p=await parse(request,env,true);if('res' in p)return p.res;
 const r=await grantPro(env,p.email,p.months,p.admin);
 return 'error' in r?json({error:r.error},400,noStore):json({ok:true,applied:r.applied,pending:!r.applied},200,noStore);
};
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const p=await parse(request,env,false);if('res' in p)return p.res;
 return (await revokePro(env,p.email,p.admin))?json({ok:true},200,noStore):json({error:'not_found'},404,noStore);
};
