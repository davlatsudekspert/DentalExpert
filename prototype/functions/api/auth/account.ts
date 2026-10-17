import {cookieHeader,guardPost,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

// Account deletion (App Store / Google Play requirement): removes the user and, by cascade, their sessions.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'bad_origin'},403,'no-store');
 const user=await sessionUser(env,request);
 if(!user)return json({error:'unauthorized'},401,'no-store');
 await env.DB.batch([
  env.DB.prepare(`DELETE FROM auth_codes WHERE email=?`).bind(user.email),
  env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(user.id)
 ]);
 const res=json({ok:true},200,'no-store');
 res.headers.append('set-cookie',cookieHeader(request,'',0));
 return res;
};
