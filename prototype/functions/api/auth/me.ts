import {authEnabled,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {oauthEnabled} from '../../_lib/oauth';
import {isAdminEmail} from '../../_lib/admin';

// `enabled` tells the client whether real email-code sign-in is available; otherwise it keeps the labelled demo flow.
// `oauth` says which of Sign in with Google / Apple the server accepts. A session from any of them is resolved.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const enabled=authEnabled(env,request);
 const oauth={google:oauthEnabled(env,'google'),apple:oauthEnabled(env,'apple')};
 let user=null;
 if(enabled||oauth.google||oauth.apple)try{user=await sessionUser(env,request)}catch{user=null}
 return json({enabled,oauth,user:user?{...user,isAdmin:isAdminEmail(env,user.email)}:null},200,'no-store');
};
