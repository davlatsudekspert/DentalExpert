import {NATIVE_ORIGINS,cookieHeader,sessionUser} from '../../_lib/auth';
import {keepEmailClaim} from '../../_lib/trial';
import {json,type Env} from '../../_lib/db';

// Account deletion (App Store / Google Play requirement): removes the user and, by cascade, their sessions,
// Google/Apple sign-in identities (oauth_identities) and classroom data. The profile photo lives in the users row and goes with it.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin&&!NATIVE_ORIGINS.has(origin))return json({error:'bad_origin'},403,'no-store');
 const user=await sessionUser(env,request);
 if(!user)return json({error:'unauthorized'},401,'no-store');
 await keepEmailClaim(env,user.id,user.email).catch(()=>{});
 await env.DB.batch([
  env.DB.prepare(`DELETE FROM auth_codes WHERE email=?`).bind(user.email),
  env.DB.prepare(`DELETE FROM rate_limits WHERE bucket IN (?,?,?)`).bind('join:'+user.id,'report:'+user.id,'photo:'+user.id),
  env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(user.id)
 ]);
 const res=json({ok:true},200,'no-store');
 res.headers.append('set-cookie',cookieHeader(request,'',0));
 return res;
};
