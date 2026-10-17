import {authEnabled,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

// `enabled` tells the client whether real email-code sign-in is available; otherwise it keeps the labelled demo flow.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const enabled=authEnabled(env,request);
 let user=null;
 if(enabled)try{user=await sessionUser(env,request)}catch{user=null}
 return json({enabled,user},200,'no-store');
};
