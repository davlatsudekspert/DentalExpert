import {COOKIE,cookieHeader,guardPost,readCookie,sha256} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const bad=guardPost(request);if(bad)return bad;
 const token=readCookie(request,COOKIE);
 if(token)await env.DB.prepare(`DELETE FROM sessions WHERE token_hash=?`).bind(await sha256(token)).run();
 const res=json({ok:true},200,'no-store');
 res.headers.append('set-cookie',cookieHeader(request,'',0));
 return res;
};
