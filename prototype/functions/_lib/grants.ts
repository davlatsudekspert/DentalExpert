import type {Env} from './db';

export const MONTHS=[1,3,6,12] as const;
export const monthsOk=(v:unknown):v is typeof MONTHS[number]|null=>v===null||MONTHS.includes(v as 1);
const expr=(m:number|null)=>m===null?'NULL':`datetime('now','+${m} months')`;   // m is validated against MONTHS before it gets here

const audit=(env:Env,by:string,action:string,target:string,detail:string|null)=>
 env.DB.prepare(`INSERT INTO admin_audit (admin_email,action,target,detail) VALUES (?,?,?,?)`).bind(by,action,target,detail);
const subUpsert=(env:Env,userId:string,m:number|null)=>
 env.DB.prepare(`INSERT INTO subscriptions (user_id,product_id,source,status,expires_at,original_txn) VALUES (?1,'admin_grant','admin','active',${expr(m)},?2)
  ON CONFLICT (original_txn) DO UPDATE SET status='active',expires_at=excluded.expires_at,updated_at=datetime('now')`).bind(userId,'admin:'+userId);

/** Grants Pro to an e-mail: now if the account exists, otherwise when it signs up / in. Re-granting replaces the earlier grant. */
export async function grantPro(env:Env,email:string,months:number|null,by:string):Promise<{applied:boolean}|{error:'patient_is_free'}>{
 const u=await env.DB.prepare(`SELECT id,role FROM users WHERE email=? AND guest=0`).bind(email).first<{id:string;role:string}>();
 if(u?.role==='patient')return {error:'patient_is_free'};
 const stmts=[
  env.DB.prepare(`INSERT INTO pro_grants (email,months,granted_by,granted_at,user_id,expires_at,revoked_at) VALUES (?1,?2,?3,datetime('now'),?4,${u?expr(months):'NULL'},NULL)
   ON CONFLICT (email) DO UPDATE SET months=excluded.months,granted_by=excluded.granted_by,granted_at=excluded.granted_at,user_id=excluded.user_id,expires_at=excluded.expires_at,revoked_at=NULL`).bind(email,months,by,u?.id??null),
  audit(env,by,'grant_pro',email,(months===null?'unlimited':months+' months')+(u?'':' (pending signup)'))
 ];
 if(u)stmts.push(subUpsert(env,u.id,months));
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
 const g=await env.DB.prepare(`SELECT months FROM pro_grants WHERE email=? AND user_id IS NULL AND revoked_at IS NULL`).bind(email).first<{months:number|null}>();
 if(!g)return;
 await env.DB.batch([
  env.DB.prepare(`UPDATE pro_grants SET user_id=?2,expires_at=${expr(g.months)} WHERE email=?1 AND user_id IS NULL AND revoked_at IS NULL`).bind(email,userId),
  subUpsert(env,userId,g.months),
  audit(env,'system','apply_pending_grant',email,null)
 ]);
}
