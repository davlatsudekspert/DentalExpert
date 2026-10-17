import {authEnabled,devEcho,guardPost,hmac,normalizeEmail,randomCode,ROLES,sendCodeEmail,sha256} from '../../_lib/auth';
import {cityIdOk,json,type Env} from '../../_lib/db';

import {underLimit} from '../../_lib/ratelimit';
const MAX_EMAILS_DAY=1500;
const CODE_TTL_MIN=10, RESEND_COOLDOWN_S=60, MAX_PER_EMAIL_HOUR=5, MAX_PER_IP_HOUR=20;

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const bad=guardPost(request);if(bad)return bad;
 if(!authEnabled(env,request))return json({error:'auth_not_configured'},503,'no-store');
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const email=normalizeEmail(body?.email);
 if(!email)return json({error:'invalid_email'},400,'no-store');

 // Retention: spent or stale one-time codes and expired sessions are purged on every request (see the privacy policy).
 await env.DB.batch([
  env.DB.prepare(`DELETE FROM auth_codes WHERE created_at<datetime('now','-1 day')`),
  env.DB.prepare(`DELETE FROM sessions WHERE expires_at<datetime('now')`)
 ]);

 const rawIp=request.headers.get('cf-connecting-ip')||'local';
 const ip=rawIp.includes(':')?rawIp.split(':').slice(0,4).join(':'):rawIp; // IPv6 is bucketed by /64 so rotating addresses inside one prefix does not bypass the limit
 const ipHash=await sha256(ip+env.AUTH_SECRET);
 if(!await underLimit(env,'mail-global',MAX_EMAILS_DAY,86400))return json({error:'too_many_requests'},429,'no-store');
 const {results:[stats]}=await env.DB.prepare(
  `SELECT
    (SELECT COUNT(*) FROM auth_codes WHERE email=? AND created_at>datetime('now','-1 hour')) AS per_email,
    (SELECT COUNT(*) FROM auth_codes WHERE ip_hash=? AND created_at>datetime('now','-1 hour')) AS per_ip,
    (SELECT CAST(strftime('%s','now') AS INTEGER)-CAST(strftime('%s',MAX(created_at)) AS INTEGER) FROM auth_codes WHERE email=?) AS since_last`
 ).bind(email,ipHash,email).all<{per_email:number;per_ip:number;since_last:number|null}>();
 if(stats.per_email>=MAX_PER_EMAIL_HOUR||stats.per_ip>=MAX_PER_IP_HOUR)return json({error:'too_many_requests'},429,'no-store');
 if(stats.since_last!==null&&stats.since_last<RESEND_COOLDOWN_S)
  return json({error:'resend_too_soon',retryAfterSec:RESEND_COOLDOWN_S-stats.since_last},429,'no-store');

 const role=ROLES.includes(body?.role as never)?body!.role:'patient';
 const name=typeof body?.name==='string'?body.name.trim().slice(0,80)||null:null;
 const cityId=typeof body?.cityId==='string'&&cityIdOk(body.cityId)?body.cityId:null;
 const countryCode=typeof body?.countryCode==='string'&&/^[A-Z]{2}$/.test(body.countryCode)?body.countryCode:null;
 const lang=typeof body?.lang==='string'?body.lang:'en';

 const code=randomCode();
 await env.DB.batch([
  env.DB.prepare(`UPDATE auth_codes SET consumed_at=datetime('now') WHERE email=? AND consumed_at IS NULL`).bind(email),
  env.DB.prepare(`INSERT INTO auth_codes (email,code_hash,ip_hash,pending_profile,expires_at) VALUES (?,?,?,?,datetime('now','+${CODE_TTL_MIN} minutes'))`)
   .bind(email,await hmac(env.AUTH_SECRET!,email+':'+code),ipHash,JSON.stringify({name,role,cityId,countryCode}))
 ]);

 if(devEcho(env,request))return json({ok:true,expiresInSec:CODE_TTL_MIN*60,resendAfterSec:RESEND_COOLDOWN_S,devCode:code},200,'no-store');
 if(!await sendCodeEmail(env,email,code,lang)){
  await env.DB.prepare(`UPDATE auth_codes SET consumed_at=datetime('now') WHERE email=? AND consumed_at IS NULL`).bind(email).run();
  return json({error:'email_send_failed'},502,'no-store');
 }
 return json({ok:true,expiresInSec:CODE_TTL_MIN*60,resendAfterSec:RESEND_COOLDOWN_S},200,'no-store');
};
