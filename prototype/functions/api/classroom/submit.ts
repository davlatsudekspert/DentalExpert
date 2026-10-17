import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,needUser,noStore} from '../../_lib/classroom';

// A member answers a task (text, editable while open) or a quiz (one attempt). Quiz scoring happens here against the
// teacher's key, which is never sent to students.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date FROM class_assignments WHERE id=?`).bind(id).first<{group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null}>();
 if(!as||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 if(as.status!=='open')return json({error:'closed'},409,noStore);
 if(as.due_date&&as.due_date<new Date().toISOString().slice(0,10))return json({error:'past_due'},409,noStore);
 if(as.kind==='task'){
  const answer=clean(b.data.answer,2000);
  if(!answer)return json({error:'answer_required'},400,noStore);
  await env.DB.prepare(
   `INSERT INTO class_submissions (assignment_id,user_id,answer) VALUES (?,?,?)
    ON CONFLICT(assignment_id,user_id) DO UPDATE SET answer=excluded.answer,submitted_at=datetime('now')`
  ).bind(id,user.id,answer).run();
  return json({ok:true},200,noStore);
 }
 const key=JSON.parse(as.answer_key||'[]') as number[];
 const given=b.data.answers;
 if(!Array.isArray(given)||given.length!==key.length||!given.every(x=>Number.isInteger(x)))return json({error:'bad_answers'},400,noStore);
 const score=key.filter((k,i)=>k===given[i]).length;
 // The attempt starts with /classroom/start (which records a 0 score); finishing it fills in the real score exactly once.
 const r=await env.DB.prepare(`UPDATE class_submissions SET score=?,answer='done',submitted_at=datetime('now') WHERE assignment_id=? AND user_id=? AND answer='started'`).bind(score,id,user.id).run();
 if(!r.meta.changes)return json({error:'already_submitted_or_not_started'},409,noStore);
 return json({ok:true,score,total:key.length},200,noStore);
};
