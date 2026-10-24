import {normalizeEmail} from '../../_lib/auth';
import {needAdmin} from '../../_lib/admin';
import {body,noStore,underLimit} from '../../_lib/classroom';
import {json,type Env} from '../../_lib/db';
import {resetTrial} from '../../_lib/trial';

// POST {email, deviceId?}: gives that e-mail (and the raw device id, if the admin has it) a fresh 30-day trial by
// removing their trial claims. Audit-logged. Works with the flag off (the effect shows once PRO_ENABLED=1).
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 if(!await underLimit(env,'trialreset:'+a.user.id,30,60))return json({error:'rate_limited'},429,noStore);
 const b=await body(request);if('res' in b)return b.res;
 const email=normalizeEmail(b.data.email);
 if(!email)return json({error:'bad_email'},400,noStore);
 const dev=b.data.deviceId==null||b.data.deviceId===''?null:b.data.deviceId;
 if(dev!==null&&(typeof dev!=='string'||!/^[0-9a-fA-F-]{36}$/.test(dev)))return json({error:'bad_device'},400,noStore);
 const found=await resetTrial(env,email,dev);
 await env.DB.prepare(`INSERT INTO admin_audit (admin_email,action,target,detail) VALUES (?,?,?,?)`).bind(a.user.email,'reset_trial',email,dev?'with device':null).run();
 return json({ok:true,account:found},200,noStore);
};
