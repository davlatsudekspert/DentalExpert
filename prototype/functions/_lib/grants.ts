import {isAdminEmail} from './admin';
import type {Env} from './db';

/** How long a grant lasts: N days, N months, or neither = until revoked. */
export type Dur={months:number|null;days:number|null};
const int=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
/** Reads {days} or {months} (months:null or nothing = until revoked) from a request body; null when invalid. */
export function parseDur(b:Record<string,unknown>):Dur|null{
 if(b.days!==undefined&&b.days!==null)return int(b.days,1,3650)?{months:null,days:b.days as number}:null;
 const m=b.months===undefined?null:b.months;
 if(m===null)return {months:null,days:null};
 return int(m,1,60)?{months:m as number,days:null}:null;
}
const expr=(d:Dur)=>d.days?`datetime('now','+${d.days} days')`:d.months?`datetime('now','+${d.months} months')`:'NULL';   // d comes from parseDur: integers in range only
const label=(d:Dur)=>d.days?d.days+' days':d.months?d.months+' months':'unlimited';

const audit=(env:Env,by:string,action:string,target:string,detail:string|null)=>
 env.DB.prepare(`INSERT INTO admin_audit (admin_email,action,target,detail) VALUES (?,?,?,?)`).bind(by,action,target,detail);
const subUpsert=(env:Env,userId:string,m:Dur)=>
 env.DB.prepare(`INSERT INTO subscriptions (user_id,product_id,source,status,expires_at,original_txn) VALUES (?1,'admin_grant','admin','active',${expr(m)},?2)
  ON CONFLICT (original_txn) DO UPDATE SET status='active',expires_at=excluded.expires_at,updated_at=datetime('now')`).bind(userId,'admin:'+userId);

/** Grants Pro to an e-mail: now if the account exists, otherwise when it signs up / in. Re-granting replaces the earlier grant. */
export async function grantPro(env:Env,email:string,dur:Dur,by:string):Promise<{applied:boolean}|{error:'patient_is_free'}>{
 const u=await env.DB.prepare(`SELECT id,role FROM users WHERE email=? AND guest=0`).bind(email).first<{id:string;role:string}>();
 if(u?.role==='patient')return {error:'patient_is_free'};
 const stmts=[
  env.DB.prepare(`INSERT INTO pro_grants (email,months,days,granted_by,granted_at,user_id,expires_at,revoked_at) VALUES (?1,?2,?5,?3,datetime('now'),?4,${u?expr(dur):'NULL'},NULL)
   ON CONFLICT (email) DO UPDATE SET months=excluded.months,days=excluded.days,granted_by=excluded.granted_by,granted_at=excluded.granted_at,user_id=excluded.user_id,expires_at=excluded.expires_at,revoked_at=NULL`).bind(email,dur.months,by,u?.id??null,dur.days),
  audit(env,by,'grant_pro',email,label(dur)+(u?'':' (pending signup)'))
 ];
 if(u)stmts.push(subUpsert(env,u.id,dur));
 await env.DB.batch(stmts);
 return {applied:!!u};
}

export async function revokePro(env:Env,email:string,by:string){
 const g=await env.DB.prepare(`SELECT user_id FROM pro_grants WHERE email=? AND revoked_at IS NULL`).bind(email).first<{user_id:string|null}>();
 const u=await env.DB.prepare(`SELECT id FROM users WHERE email=?`).bind(email).first<{id:string}>();
 const id=u?.id||g?.user_id;
 await env.DB.batch([
  env.DB.prepare(`UPDATE pro_grants SET revoked_at=datetime('now') WHERE email=? AND revoked_at IS NULL`).bind(email),
  ...(id?[env.DB.prepare(`UPDATE subscriptions SET status='revoked',updated_at=datetime('now') WHERE original_txn=?`).bind('admin:'+id)]:[]),
  audit(env,by,'revoke_pro',email,null)
 ]);
 return !!(g||id);
}

/** Called on every sign-in: a waiting grant for this e-mail becomes a real one. Failures never block sign-in. */
export async function applyPendingGrant(env:Env,userId:string,email:string,role:string){
 if(role==='patient')return;
 const g=await env.DB.prepare(`SELECT months,days FROM pro_grants WHERE email=? AND user_id IS NULL AND revoked_at IS NULL`).bind(email).first<Dur>();
 if(!g)return;
 await env.DB.batch([
  env.DB.prepare(`UPDATE pro_grants SET user_id=?2,expires_at=${expr(g)} WHERE email=?1 AND user_id IS NULL AND revoked_at IS NULL`).bind(email,userId),
  subUpsert(env,userId,g),
  audit(env,'system','apply_pending_grant',email,null)
 ]);
}

/** The owner (an admin e-mail) always has Pro, for every role, with no end date. Idempotent; call only while the Pro flag is on. */
export async function ensureOwnerPro(env:Env,userId:string,email:string){
 if(!isAdminEmail(env,email))return;
 await subUpsert(env,userId,{months:null,days:null}).run();
}
