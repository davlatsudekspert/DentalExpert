import {NATIVE_ORIGINS} from './_lib/auth';
import type {Env} from './_lib/db';
import {tooOld} from './_lib/appver';

// Native app WebViews call the hosted API cross-origin. Only these origins are allowed; no credentials/cookies are involved
// (the app sends a bearer token), so wildcard-style CORS risks do not apply.
const PUBLIC_READ=/^\/api\/(doctors|sponsors|institutions|decks|photo|curriculum|attestation|app)(\/|$)/;
const AUTH=/^\/api\/(auth|classroom|admin|reports|billing)(\/|$)/;

export const onRequest:PagesFunction<Env>=async({request,next,env})=>{
 const url=new URL(request.url);
 const origin=request.headers.get('origin');
 const cors=!!origin&&NATIVE_ORIGINS.has(origin)&&(PUBLIC_READ.test(url.pathname)||AUTH.test(url.pathname));
 if(request.method==='OPTIONS'&&cors)
  return new Response(null,{status:204,headers:{'access-control-allow-origin':origin!,'access-control-allow-methods':'GET, POST, PUT, DELETE','access-control-allow-headers':'accept, content-type, authorization, x-client, x-device-id','access-control-max-age':'86400',vary:'origin'}});
 // An old app build the owner switched off gets 426 on the account/class/admin/billing APIs (never on public reads or the config).
 const res=AUTH.test(url.pathname)&&tooOld(request,env)?new Response(JSON.stringify({error:'update_required'}),{status:426,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}}):await next();
 if(!cors)return res;
 const out=new Response(res.body,res);
 out.headers.set('access-control-allow-origin',origin!);
 out.headers.append('vary','origin');
 return out;
};
