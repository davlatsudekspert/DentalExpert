import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,limited,needUser,noStore,tooMany} from '../../_lib/classroom';

// POST {assignmentId, answers:(number|null)[]}: saves the answers of a quiz in progress so the student can continue after
// closing the app. Only the student's own running attempt is updated; it never affects the score (submit does that).
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 if(await limited(env,'progress',a.user.id))return tooMany();
 const id=clean(b.data.assignmentId,60);
 const ans=b.data.answers;
 if(!Array.isArray(ans)||ans.length>50||!ans.every(x=>x===null||(Number.isInteger(x)&&x>=0&&x<=9)))return json({error:'bad_answers'},400,noStore);
 const as=await env.DB.prepare(`SELECT group_id,status FROM class_assignments WHERE id=? AND kind='quiz'`).bind(id).first<{group_id:string;status:string}>();
 if(!as||await groupRole(env,as.group_id,a.user.id)!=='member')return json({error:'forbidden'},403,noStore);
 if(as.status!=='open')return json({error:'closed'},409,noStore);
 const r=await env.DB.prepare(`UPDATE class_submissions SET progress=? WHERE assignment_id=? AND user_id=? AND answer='started'`).bind(JSON.stringify(ans),id,a.user.id).run();
 return r.meta.changes?json({ok:true},200,noStore):json({error:'not_started'},409,noStore);
};
