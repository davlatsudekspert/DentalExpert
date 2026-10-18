import {json,type Env} from '../../_lib/db';
import {groupRole,needUser,noStore} from '../../_lib/classroom';

type Row=Record<string,unknown>;

// GET ?groupId=… : the teacher's gradebook — every quiz of the group × every student (by number/nickname), scores only.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const groupId=new URL(request.url).searchParams.get('groupId')||'';
 if(await groupRole(env,groupId,a.user.id)!=='owner')return json({error:'forbidden'},403,noStore);
 const [qs,ms,ss]=await env.DB.batch([
  env.DB.prepare(`SELECT id,title,topic_id,answer_key,per_student,created_at FROM class_assignments WHERE group_id=? AND kind='quiz' ORDER BY created_at`).bind(groupId),
  env.DB.prepare(`SELECT user_id,member_no,nickname FROM class_members WHERE group_id=? ORDER BY member_no`).bind(groupId),
  env.DB.prepare(`SELECT s.assignment_id,s.user_id,s.score,s.answer FROM class_submissions s JOIN class_assignments a ON a.id=s.assignment_id WHERE a.group_id=? AND a.kind='quiz'`).bind(groupId)
 ]);
 const scores=new Map<string,Record<string,number|null>>();
 for(const s of ss.results as Row[]){
  const m=scores.get(s.user_id as string)||{};
  // A started but unfinished attempt counts as 0 only once the student cannot finish it any more; show it as "started".
  m[s.assignment_id as string]=s.answer==='done'?s.score as number:null;
  scores.set(s.user_id as string,m);
 }
 return json({
  quizzes:(qs.results as Row[]).map(r=>({id:r.id,title:r.title,topicId:r.topic_id,total:r.per_student??(r.answer_key?(JSON.parse(r.answer_key as string) as number[]).length:0),createdAt:r.created_at})),
  members:(ms.results as Row[]).map(r=>({no:r.member_no,nickname:r.nickname,scores:scores.get(r.user_id as string)||{}}))
 },200,noStore);
};
