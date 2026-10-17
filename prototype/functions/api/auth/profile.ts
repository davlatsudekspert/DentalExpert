import {guardPost,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

const field=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max)||null:null;

// The signed-in user edits their own profile. Only these fields can change; role and email never do.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const g=guardPost(request);if(g)return g;
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user)return json({error:'unauthorized'},401,'no-store');
 let b:Record<string,unknown>;
 try{b=await request.json() as Record<string,unknown>}catch{return json({error:'bad_json'},400,'no-store')}
 const name=field(b.name,80);
 if(!name||name.length<2)return json({error:'name_required'},400,'no-store');
 const phone=field(b.phone,30);
 if(phone&&!/^[+0-9 ()-]{5,30}$/.test(phone))return json({error:'bad_phone'},400,'no-store');
 const workplace=field(b.workplace,100),bio=field(b.bio,600);
 await env.DB.prepare(`UPDATE users SET name=?,phone=?,workplace=?,bio=? WHERE id=?`).bind(name,phone,workplace,bio,user.id).run();
 return json({user:{...user,name,phone,workplace,bio}},200,'no-store');
};
