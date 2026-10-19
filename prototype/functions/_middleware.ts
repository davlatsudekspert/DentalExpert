import {NATIVE_ORIGINS} from './_lib/auth';
import type {Env} from './_lib/db';

// Native app WebViews call the hosted API cross-origin. Only these origins are allowed; no credentials/cookies are involved
// (the app sends a bearer token), so wildcard-style CORS risks do not apply.
const PUBLIC_READ=/^\/api\/(doctors|sponsors|institutions|decks|photo)(\/|$)/;
const AUTH=/^\/api\/(auth|classroom|admin|reports)(\/|$)/;

export const onRequest:PagesFunction<Env>=async({request,next})=>{
 const url=new URL(request.url);
 const origin=request.headers.get('origin');
 const cors=!!origin&&NATIVE_ORIGINS.has(origin)&&(PUBLIC_READ.test(url.pathname)||AUTH.test(url.pathname));
 if(request.method==='OPTIONS'&&cors)
  return new Response(null,{status:204,headers:{'access-control-allow-origin':origin!,'access-control-allow-methods':'GET, POST, PUT, DELETE','access-control-allow-headers':'accept, content-type, authorization, x-client','access-control-max-age':'86400',vary:'origin'}});
 const res=await next();
 if(!cors)return res;
 const out=new Response(res.body,res);
 out.headers.set('access-control-allow-origin',origin!);
 out.headers.append('vary','origin');
 return out;
};
