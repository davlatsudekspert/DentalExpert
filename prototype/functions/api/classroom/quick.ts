import {json,type Env} from '../../_lib/db';
import {STATE_SQL,addMember,body,clean,codeGuess,ended,joinCode,limited,needUser,nickError,nickname,noStore,tooMany} from '../../_lib/classroom';

type Test={id:string;title:string;status:string;since_close:number|null;since_deadline:number|null;reveal:string};
// QR join: POST {code, assignmentId?, nickname?}. Registered accounts only (a signed-out device gets 401 and the app
// sends the student through sign-in first, keeping the invite). The reply says who the caller is in that group:
//  role 'owner'  — the group's own teacher (the app shows "you teach this group" and a student preview; nothing is joined)
//  role 'member' — already in the group, or just joined with the nickname given (joined:true)
//  role 'none'   — not in the group yet and no nickname given: the app asks for one (needNickname) and calls again.
// Wrong codes count against the per-IP guessing limit shared with /classroom/join.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 if(await limited(env,'quick',user.id))return tooMany();
 const b=await body(request);if('res' in b)return b.res;
 const c=joinCode(b.data.code);
 if('error' in c)return json({error:c.error},400,noStore);
 const nickRaw=b.data.nickname;
 const nick=nickname(nickRaw);
 if(nick===false)return json({error:nickError(nickRaw)},400,noStore);
 const guess=await codeGuess(env,request);
 if(!guess.ok)return tooMany();
 const g=await env.DB.prepare(`SELECT g.id,g.name,g.teacher_id,(SELECT nickname FROM class_members m WHERE m.group_id=g.id AND m.user_id=?) AS nick,
   (SELECT 1 FROM class_members m WHERE m.group_id=g.id AND m.user_id=?) AS member FROM class_groups g WHERE g.code=?`)
  .bind(user.id,user.id,c.code).first<{id:string;name:string;teacher_id:string;nick:string|null;member:number|null}>();
 if(!g)return json({error:'not_found'},404,noStore);
 await guess.hit();
 const owner=g.teacher_id===user.id;
 // The test must be a quiz of this group; students only see a topic test while its topic is open.
 const aid=clean(b.data.assignmentId,60);
 let test:Test|null=null;
 if(aid){
  test=await env.DB.prepare(`SELECT a.id,a.title,a.status,a.reveal,${STATE_SQL('a.')} FROM class_assignments a WHERE a.id=? AND a.group_id=? AND a.kind='quiz'
    AND (?3 OR a.topic_id IS NULL OR EXISTS (SELECT 1 FROM class_topics t WHERE t.group_id=a.group_id AND t.topic_id=a.topic_id AND t.closed_at IS NULL))`).bind(aid,g.id,owner?1:0).first<Test>();
  if(!test)return json({error:'test_not_found'},404,noStore);
 }
 const out=(role:'owner'|'member'|'none',extra:Record<string,unknown>={})=>json({role,group:{id:role==='none'?undefined:g.id,name:g.name},
  test:test&&{id:test.id,title:test.title,status:test.status,ended:ended(test)},...extra},200,noStore);
 if(owner)return out('owner');
 if(g.member)return out('member',{nickname:g.nick,joined:false});
 if(user.role==='teacher'||user.role==='dentist')return json({error:'teacher_cannot_join'},400,noStore);
 if(!nick)return out('none',{needNickname:true});
 const r=await addMember(env,g.id,user.id,nick);
 if(r!=='ok')return json({error:r},409,noStore);
 return out('member',{nickname:nick,joined:true});
};
