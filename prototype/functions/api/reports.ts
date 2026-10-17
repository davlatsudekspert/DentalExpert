import {sessionUser} from '../_lib/auth';
import {body,clean,newId,underLimit} from '../_lib/classroom';
import {json,type Env} from '../_lib/db';

const CATEGORIES=['complaint','content','bug','advertising','other'];

// Anyone can send a complaint or request (signed in or not). Limited per account, or per IP when anonymous.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const user=await sessionUser(env,request).catch(()=>null);
 const who=user?.id||request.headers.get('cf-connecting-ip')||'anon';
 if(!await underLimit(env,'report:'+who,5,3600))return json({error:'rate_limited'},429,'no-store');
 const b=await body(request);if('res' in b)return b.res;
 const category=CATEGORIES.includes(String(b.data.category))?String(b.data.category):'other';
 const text=clean(b.data.body,2000);
 if(text.length<5)return json({error:'text_required'},400,'no-store');
 const lang=['uz','ru','en'].includes(String(b.data.lang))?String(b.data.lang):null;
 await env.DB.prepare(`INSERT INTO reports (id,reporter_id,category,subject,body,contact,lang) VALUES (?,?,?,?,?,?,?)`)
  .bind(newId(),user?.id||null,category,clean(b.data.subject,120)||null,text,clean(b.data.contact,120)||null,lang).run();
 return json({ok:true},201,'no-store');
};
