import {needAdmin} from '../../_lib/admin';
import {body,clean} from '../../_lib/classroom';
import {json,type Env} from '../../_lib/db';

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const status=new URL(request.url).searchParams.get('status')==='resolved'?'resolved':'open';
 const {results}=await env.DB.prepare(
  `SELECT r.id,r.category,r.subject,r.body,r.contact,r.lang,r.status,r.admin_note,r.created_at,r.resolved_at,u.email AS reporter_email
   FROM reports r LEFT JOIN users u ON u.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at DESC LIMIT 100`
 ).bind(status).all<Record<string,unknown>>();
 return json({reports:results.map(r=>({id:r.id,category:r.category,subject:r.subject,body:r.body,contact:r.contact,lang:r.lang,status:r.status,note:r.admin_note,createdAt:r.created_at,resolvedAt:r.resolved_at,reporter:r.reporter_email||null}))},200,'no-store');
};

// PUT {id, status, note?}
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const status=b.data.status==='resolved'?'resolved':b.data.status==='open'?'open':null;
 if(!status)return json({error:'bad_status'},400,'no-store');
 const note=clean(b.data.note,1000)||null;
 const r=await env.DB.prepare(`UPDATE reports SET status=?,admin_note=COALESCE(?,admin_note),resolved_at=${status==='resolved'?`datetime('now')`:'NULL'} WHERE id=?`).bind(status,note,clean(b.data.id,60)).run();
 return r.meta.changes?json({ok:true},200,'no-store'):json({error:'not_found'},404,'no-store');
};
