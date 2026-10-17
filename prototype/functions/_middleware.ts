import type {Env} from './_lib/db';

// Native app WebViews call the hosted API cross-origin. Only these origins, and only read-only endpoints (no credentials).
const NATIVE_ORIGINS=new Set(['https://localhost','capacitor://localhost','http://localhost']);
const PUBLIC_READ=/^\/api\/(doctors|sponsors|institutions|decks)(\/|$)/;

export const onRequest:PagesFunction<Env>=async({request,next})=>{
 const url=new URL(request.url);
 const origin=request.headers.get('origin');
 const cors=!!origin&&NATIVE_ORIGINS.has(origin)&&PUBLIC_READ.test(url.pathname);
 if(request.method==='OPTIONS'&&cors)
  return new Response(null,{status:204,headers:{'access-control-allow-origin':origin!,'access-control-allow-methods':'GET','access-control-allow-headers':'accept','access-control-max-age':'86400',vary:'origin'}});
 const res=await next();
 if(!cors)return res;
 const out=new Response(res.body,res);
 out.headers.set('access-control-allow-origin',origin!);
 out.headers.append('vary','origin');
 return out;
};
