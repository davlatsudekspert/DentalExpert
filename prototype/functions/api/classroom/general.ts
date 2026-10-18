import {json,type Env} from '../../_lib/db';
import {body,clean,deadlineOf,groupRole,needUser,newId,noStore,revealOf} from '../../_lib/classroom';
import {isSource,keyOf,sourceRefs} from '../../_lib/questionIndex';
import {GENERAL_MAX,GENERAL_POOL_MAX,drawVariant,variantAllowed} from '../../../src/classroomShared';

// POST {groupId, title?, sources:string[], count, variant?, minutes|null, deadline?, reveal}: a "general test" over
// several topics and presentation quizzes (sources from the one question index). The questions are spread evenly
// over the chosen sources (round robin, no repeats):
//  variant=false  one set of `count` questions for everybody, drawn once when the test is made (each student sees it
//                 in their own order);
//  variant=true   every student draws their own `count` from all questions of the sources (needs ≥ 2 × count).
// At most 50 questions per student, 150 sources and 1500 questions in the pool.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const groupId=clean(b.data.groupId,60);
 if(await groupRole(env,groupId,a.user.id)!=='owner')return json({error:'forbidden'},403,noStore);
 const raw=b.data.sources;
 if(!Array.isArray(raw)||!raw.length||raw.length>150||!raw.every(x=>typeof x==='string'))return json({error:'bad_sources'},400,noStore);
 const sources=[...new Set(raw as string[])];
 if(!sources.every(isSource))return json({error:'unknown_source'},400,noStore);
 const all=sources.flatMap(s=>sourceRefs(s)!);
 if(all.length>GENERAL_POOL_MAX)return json({error:'pool_too_big',max:GENERAL_POOL_MAX},400,noStore);
 const count=Number(b.data.count);
 if(!Number.isInteger(count)||count<1||count>GENERAL_MAX||count>all.length)return json({error:'bad_count',max:Math.min(GENERAL_MAX,all.length)},400,noStore);
 const variant=b.data.variant===true;
 if(variant&&!variantAllowed(all.length,count))return json({error:'variant_pool_small',pool:all.length,max:Math.floor(all.length/2)},400,noStore);
 const minutes=b.data.minutes==null||b.data.minutes===''?null:Number(b.data.minutes);
 if(minutes!==null&&(!Number.isInteger(minutes)||minutes<1||minutes>180))return json({error:'bad_minutes'},400,noStore);
 const deadline=deadlineOf(b.data.deadline);
 if(deadline===false)return json({error:'bad_deadline'},400,noStore);
 const reveal=revealOf(b.data.reveal);
 if(reveal==='deadline'&&!deadline)return json({error:'reveal_needs_deadline'},400,noStore);
 const title=clean(b.data.title,100);
 if(title.length<2)return json({error:'title_required'},400,noStore);
 const id=newId();
 // A fixed test keeps exactly its drawn questions as the pool (so everyone gets all of them); a variant test the whole pool.
 const pool=variant?all:(await drawVariant(id,'@fixed',all,count,null)).map(i=>all[i]);
 const key=pool.map(r=>keyOf(r));
 if(key.some(k=>k===null))return json({error:'unknown_question'},500,noStore);
 const ins=await env.DB.prepare(`INSERT INTO class_assignments (id,group_id,kind,title,answer_key,minutes,reveal,pool,per_student,deadline_at) SELECT ?,?,'quiz',?,?,?,?,?,?,?
   WHERE (SELECT COUNT(*) FROM class_assignments WHERE group_id=? AND topic_id IS NULL)<100`)
  .bind(id,groupId,title,JSON.stringify(key),minutes,reveal,JSON.stringify(pool),count,deadline,groupId).run();
 if(!ins.meta.changes)return json({error:'too_many'},429,noStore);
 return json({ok:true,testId:id,pool:all.length,count},201,noStore);
};
