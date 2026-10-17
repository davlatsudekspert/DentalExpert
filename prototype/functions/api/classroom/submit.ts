import {json,type Env} from '../../_lib/db';
import {GRACE_MIN,body,clean,groupRole,needUser,noStore} from '../../_lib/classroom';

// A member answers a task (text, editable while open) or a quiz (one attempt). Quiz scoring happens here against the
// teacher's key, which is never sent to students.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date,topic_id,questions,minutes,
   (julianday('now')-julianday(closed_at))*1440 AS since_close,
   (SELECT (julianday('now')-julianday(started_at))*1440 FROM class_submissions WHERE assignment_id=class_assignments.id AND user_id=?) AS elapsed
  FROM class_assignments WHERE id=?`).bind(user.id,id).first<{group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null;
   topic_id:string|null;questions:string|null;minutes:number|null;since_close:number|null;elapsed:number|null}>();
 if(!as||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 // A finished topic test still accepts answers from students who had started, for a 2-minute grace.
 const grace=as.kind==='quiz'&&as.elapsed!==null&&as.since_close!==null&&as.since_close<=GRACE_MIN;
 if(as.status!=='open'&&!grace)return json({error:'closed'},409,noStore);
 if(as.kind==='quiz'&&as.minutes&&as.elapsed!==null&&as.elapsed>as.minutes+GRACE_MIN)return json({error:'time_up'},409,noStore);
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
 const r=await env.DB.prepare(`UPDATE class_submissions SET score=?,answer='done',answers=?,submitted_at=datetime('now') WHERE assignment_id=? AND user_id=? AND answer='started'`).bind(score,JSON.stringify(given),id,user.id).run();
 if(!r.meta.changes)return json({error:'already_submitted_or_not_started'},409,noStore);
 return json({ok:true,score,total:key.length},200,noStore);
};
