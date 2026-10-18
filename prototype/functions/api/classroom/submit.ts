import {json,type Env} from '../../_lib/db';
import {GRACE_MIN,STATE_SQL,body,clean,groupRole,limited,needUser,noStore,revealOpen,tooMany} from '../../_lib/classroom';
import {explainFor,keyFor,refsOf} from '../../_lib/classTest';

type A={group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null;topic_id:string|null;questions:string|null;minutes:number|null;reveal:string|null;
 pool:string|null;deck_id:string|null;since_close:number|null;since_deadline:number|null;elapsed:number|null;mine:string|null};
// A member answers a task (text, editable while open) or a quiz (one attempt). Quiz scoring happens here against the
// key, which is never sent to students before the reveal the teacher chose.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 if(await limited(env,'submit',user.id))return tooMany();
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date,topic_id,questions,minutes,reveal,pool,deck_id,${STATE_SQL()},
   (SELECT (julianday('now')-julianday(started_at))*1440 FROM class_submissions WHERE assignment_id=class_assignments.id AND user_id=?) AS elapsed,
   (SELECT questions FROM class_submissions WHERE assignment_id=class_assignments.id AND user_id=?) AS mine
  FROM class_assignments WHERE id=?`).bind(user.id,user.id,id).first<A>();
 if(!as||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 // A finished quiz still accepts answers from students who had started, for a 2-minute grace; so does a deadline.
 const grace=as.kind==='quiz'&&as.elapsed!==null&&as.since_close!==null&&as.since_close<=GRACE_MIN;
 if(as.status!=='open'&&!grace)return json({error:'closed'},409,noStore);
 if(as.kind==='quiz'&&as.minutes&&as.elapsed!==null&&as.elapsed>as.minutes+GRACE_MIN)return json({error:'time_up'},409,noStore);
 if(as.since_deadline!==null&&as.since_deadline>(as.kind==='quiz'&&as.elapsed!==null?GRACE_MIN:0))return json({error:'past_due'},409,noStore);
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
 if(as.elapsed===null&&as.pool)return json({error:'already_submitted_or_not_started'},409,noStore);
 const refs=refsOf(as,as.mine);
 const key=keyFor(as,refs);
 const given=b.data.answers;
 if(!Array.isArray(given)||given.length!==key.length||!given.every(x=>Number.isInteger(x)&&x>=-1&&x<=9))return json({error:'bad_answers'},400,noStore);
 const score=key.filter((k,i)=>k===given[i]).length;
 // The attempt starts with /classroom/start (which records a 0 score); finishing it fills in the real score exactly once.
 const r=await env.DB.prepare(`UPDATE class_submissions SET score=?,answer='done',answers=?,submitted_at=datetime('now') WHERE assignment_id=? AND user_id=? AND answer='started'`).bind(score,JSON.stringify(given),id,user.id).run();
 if(!r.meta.changes)return json({error:'already_submitted_or_not_started'},409,noStore);
 // Right answers straight away only when the teacher chose that (otherwise: after the test is finished / its deadline).
 const review=revealOpen(as)?{answers:given,correct:key,explain:explainFor(refs),questions:as.pool?refs:undefined}:undefined;
 return json({ok:true,score,total:key.length,review},200,noStore);
};
