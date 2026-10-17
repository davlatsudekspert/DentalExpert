import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,needUser,noStore} from '../../_lib/classroom';

// A member starts a quiz. The attempt is recorded immediately with a 0 score, so closing the sheet or peeking at the
// questions does not give a second try; finishing it (submit) replaces the 0 with the real score.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date FROM class_assignments WHERE id=?`).bind(id).first<{group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null}>();
 if(!as||as.kind!=='quiz'||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 if(as.status!=='open')return json({error:'closed'},409,noStore);
 if(as.due_date&&as.due_date<new Date().toISOString().slice(0,10))return json({error:'past_due'},409,noStore);
 const total=(JSON.parse(as.answer_key||'[]') as number[]).length;
 const r=await env.DB.prepare(`INSERT OR IGNORE INTO class_submissions (assignment_id,user_id,answer,score,total) VALUES (?,?,'started',0,?)`).bind(id,user.id,total).run();
 if(!r.meta.changes)return json({error:'already_started'},409,noStore);
 return json({ok:true,total},200,noStore);
};
