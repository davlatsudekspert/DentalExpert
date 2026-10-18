import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,needUser,noStore} from '../../_lib/classroom';

// A member starts a quiz. The attempt is recorded immediately with a 0 score, so closing the sheet or peeking at the
// questions does not give a second try; finishing it (submit) replaces the 0 with the real score.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date,minutes FROM class_assignments WHERE id=?`).bind(id).first<{group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null;minutes:number|null}>();
 if(!as||as.kind!=='quiz'||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 if(as.status!=='open')return json({error:'closed'},409,noStore);
 if(as.due_date&&as.due_date<new Date().toISOString().slice(0,10))return json({error:'past_due'},409,noStore);
 const total=(JSON.parse(as.answer_key||'[]') as number[]).length;
 const r=await env.DB.prepare(`INSERT OR IGNORE INTO class_submissions (assignment_id,user_id,answer,score,total,started_at) VALUES (?,?,'started',0,?,datetime('now'))`).bind(id,user.id,total).run();
 if(!r.meta.changes){
  // The same student coming back (app closed, phone locked) continues the attempt they started: same clock, the answers
  // saved so far. A finished attempt or one whose time ran out cannot be reopened.
  const s=await env.DB.prepare(`SELECT answer,progress,started_at,(julianday('now')-julianday(started_at))*1440 AS elapsed FROM class_submissions WHERE assignment_id=? AND user_id=?`).bind(id,user.id).first<{answer:string;progress:string|null;started_at:string;elapsed:number}>();
  if(!s||s.answer!=='started')return json({error:'already_submitted'},409,noStore);
  if(as.minutes&&s.elapsed>as.minutes)return json({error:'time_up'},409,noStore);
  return json({ok:true,resumed:true,total,minutes:as.minutes,startedAt:s.started_at,progress:s.progress?JSON.parse(s.progress):null},200,noStore);
 }
 return json({ok:true,total,minutes:as.minutes},200,noStore);
};
