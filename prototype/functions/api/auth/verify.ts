import {authEnabled,guardPost,hmac,normalizeEmail,sha256,signedIn,timingSafeEqual,USER_COLUMNS,type Role} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {underLimit} from '../../_lib/ratelimit';
import {reviewRole} from '../../_lib/review';

const MAX_ATTEMPTS=5,MAX_FAILS_DAY=15;
const failures=async(env:Env,email:string)=>(await env.DB.prepare(`SELECT count FROM rate_limits WHERE bucket=? AND window_start>?`).bind('vfail:'+email,Date.now()-86400000).first<{count:number}>())?.count||0;

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const bad=guardPost(request);if(bad)return bad;
 if(!authEnabled(env,request))return json({error:'auth_not_configured'},503,'no-store');
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const email=normalizeEmail(body?.email);
 const code=typeof body?.code==='string'?body.code.trim():'';
 if(!email||!/^\d{6}$/.test(code))return json({error:'invalid_code'},400,'no-store');

 // Long-window limits stop slow brute-forcing: per IP (any email) and per email (failed guesses over a day, which outlives code resets).
 const ip=request.headers.get('cf-connecting-ip')||'local';
 if(!await underLimit(env,'verify-ip:'+await sha256(ip.includes(':')?ip.split(':').slice(0,4).join(':'):ip),60,600))return json({error:'too_many_requests'},429,'no-store');
 if(await failures(env,email)>=MAX_FAILS_DAY)return json({error:'too_many_attempts'},429,'no-store');
 const rr=reviewRole(env,email);
 if(rr){
  if(!timingSafeEqual(await hmac(env.AUTH_SECRET!,'review:'+code),await hmac(env.AUTH_SECRET!,'review:'+env.REVIEW_CODE))){await underLimit(env,'vfail:'+email,1e9,86400);return json({error:'invalid_code'},400,'no-store')}
  let ru=await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email=?`).bind(email).first<Record<string,string|number|null>>();
  if(!ru){const id=crypto.randomUUID();await env.DB.prepare(`INSERT INTO users (id,email,name,role,email_verified_at) VALUES (?,?,?,?,datetime('now'))`).bind(id,email,'Store Reviewer ('+rr+')',rr).run();ru=await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id=?`).bind(id).first<Record<string,string|number|null>>()}
  return signedIn(env,request,ru!);
 }
 const row=await env.DB.prepare(
  `SELECT id,code_hash,pending_profile FROM auth_codes
   WHERE email=? AND consumed_at IS NULL AND expires_at>datetime('now') ORDER BY id DESC LIMIT 1`
 ).bind(email).first<{id:number;code_hash:string;pending_profile:string|null}>();
 if(!row)return json({error:'invalid_code'},400,'no-store');

 // Count the attempt first and atomically, so parallel guesses cannot exceed the limit.
 const attempt=await env.DB.prepare(
  `UPDATE auth_codes SET attempts=attempts+1 WHERE id=? AND consumed_at IS NULL AND attempts<? RETURNING attempts`
 ).bind(row.id,MAX_ATTEMPTS).first<{attempts:number}>();
 if(!attempt)return json({error:'too_many_attempts'},429,'no-store');

 const expected=await hmac(env.AUTH_SECRET!,email+':'+code);
 if(!timingSafeEqual(expected,row.code_hash)){await underLimit(env,'vfail:'+email,1e9,86400);return json({error:'invalid_code',attemptsLeft:MAX_ATTEMPTS-attempt.attempts},400,'no-store')}

 const consumed=await env.DB.prepare(`UPDATE auth_codes SET consumed_at=datetime('now') WHERE id=? AND consumed_at IS NULL`).bind(row.id).run();
 if(consumed.meta.changes!==1)return json({error:'invalid_code'},400,'no-store');

 const p=row.pending_profile?JSON.parse(row.pending_profile) as {name:string|null;role:Role;cityId:string|null;countryCode:string|null}:{name:null,role:'patient' as Role,cityId:null,countryCode:null};
 // An existing account keeps its stored profile; only a new account takes the sign-up fields.
 let user=await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email=?`).bind(email).first<Record<string,string|number|null>>();
 if(!user){
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO users (id,email,name,role,country_code,city_id,email_verified_at) VALUES (?,?,?,?,?,?,datetime('now'))`)
   .bind(id,email,p.name,p.role,p.countryCode,p.cityId).run();
  user={id,email,name:p.name,role:p.role,country_code:p.countryCode,city_id:p.cityId,phone:null,workplace:null,bio:null};
 }else await env.DB.prepare(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,datetime('now')) WHERE id=?`).bind(user.id).run();

 return signedIn(env,request,user);
};
