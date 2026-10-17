import {authEnabled,createSession,guardPost,hmac,isNativeClient,normalizeEmail,timingSafeEqual,type Role} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

const MAX_ATTEMPTS=5;

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const bad=guardPost(request);if(bad)return bad;
 if(!authEnabled(env,request))return json({error:'auth_not_configured'},503,'no-store');
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const email=normalizeEmail(body?.email);
 const code=typeof body?.code==='string'?body.code.trim():'';
 if(!email||!/^\d{6}$/.test(code))return json({error:'invalid_code'},400,'no-store');

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
 if(!timingSafeEqual(expected,row.code_hash))return json({error:'invalid_code',attemptsLeft:MAX_ATTEMPTS-attempt.attempts},400,'no-store');

 const consumed=await env.DB.prepare(`UPDATE auth_codes SET consumed_at=datetime('now') WHERE id=? AND consumed_at IS NULL`).bind(row.id).run();
 if(consumed.meta.changes!==1)return json({error:'invalid_code'},400,'no-store');

 const p=row.pending_profile?JSON.parse(row.pending_profile) as {name:string|null;role:Role;cityId:string|null;countryCode:string|null}:{name:null,role:'patient' as Role,cityId:null,countryCode:null};
 // An existing account keeps its stored profile; only a new account takes the sign-up fields.
 let user=await env.DB.prepare(`SELECT id,email,name,role,country_code,city_id FROM users WHERE email=?`).bind(email).first<Record<string,string|null>>();
 if(!user){
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO users (id,email,name,role,country_code,city_id,email_verified_at) VALUES (?,?,?,?,?,?,datetime('now'))`)
   .bind(id,email,p.name,p.role,p.countryCode,p.cityId).run();
  user={id,email,name:p.name,role:p.role,country_code:p.countryCode,city_id:p.cityId};
 }else await env.DB.prepare(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,datetime('now')) WHERE id=?`).bind(user.id).run();

 const session=await createSession(env,request,user.id!);
 const profile={id:user.id,email:user.email,name:user.name,role:user.role,countryCode:user.country_code,cityId:user.city_id};
 // Native clients get the token in the body (stored on the device); browsers get an HttpOnly cookie.
 if(isNativeClient(request))return json({user:profile,token:session.token},200,'no-store');
 const res=json({user:profile},200,'no-store');
 res.headers.append('set-cookie',session.cookie);
 return res;
};
