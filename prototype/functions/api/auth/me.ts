import {authEnabled,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {oauthEnabled} from '../../_lib/oauth';
import {isAdminEmail} from '../../_lib/admin';
import {proEnabled,proOf} from '../../_lib/entitlement';
import {ensureOwnerPro} from '../../_lib/grants';

// `enabled` tells the client whether real email-code sign-in is available; otherwise it keeps the labelled demo flow.
// `oauth` says which of Sign in with Google / Apple the server accepts. A session from any of them is resolved.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const enabled=authEnabled(env,request);
 const oauth={google:oauthEnabled(env,'google'),apple:oauthEnabled(env,'apple')};
 let user=null;
 if(enabled||oauth.google||oauth.apple)try{user=await sessionUser(env,request)}catch{user=null}
 if(user&&!user.guest&&proEnabled(env))await ensureOwnerPro(env,user.id,user.email).catch(()=>{});   // the owner always has Pro
 const pro=user?await proOf(env,user).catch(()=>undefined):undefined;
 return json({enabled,oauth,proEnabled:proEnabled(env),user:user?{...user,email:user.guest?'':user.email,isAdmin:!user.guest&&isAdminEmail(env,user.email),...(pro?{pro}:{})}:null},200,'no-store');
};
