import {needAdmin} from '../../_lib/admin';
import {json,type Env} from '../../_lib/db';

const one=async(env:Env,sql:string)=>(await env.DB.prepare(sql).first<{n:number}>())?.n||0;

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const {results:roles}=await env.DB.prepare(`SELECT role,COUNT(*) AS n FROM users GROUP BY role`).all<{role:string;n:number}>();
 const {results:daily}=await env.DB.prepare(
  `SELECT date(created_at) AS day,COUNT(*) AS n FROM users WHERE created_at>=datetime('now','-13 days') GROUP BY day ORDER BY day`
 ).all<{day:string;n:number}>();
 return json({
  users:{total:await one(env,`SELECT COUNT(*) AS n FROM users`),byRole:Object.fromEntries(roles.map(r=>[r.role,r.n])),
   last7:await one(env,`SELECT COUNT(*) AS n FROM users WHERE created_at>=datetime('now','-7 days')`),
   last30:await one(env,`SELECT COUNT(*) AS n FROM users WHERE created_at>=datetime('now','-30 days')`),
   activeSessions:await one(env,`SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE expires_at>datetime('now')`),
   suspended:await one(env,`SELECT COUNT(*) AS n FROM users WHERE suspended_at IS NOT NULL`),daily},
  classroom:{groups:await one(env,`SELECT COUNT(*) AS n FROM class_groups`),members:await one(env,`SELECT COUNT(*) AS n FROM class_members`),
   assignments:await one(env,`SELECT COUNT(*) AS n FROM class_assignments`),submissions:await one(env,`SELECT COUNT(*) AS n FROM class_submissions`)},
  doctors:{verified:await one(env,`SELECT COUNT(*) AS n FROM clinicians WHERE license_status='verified' AND is_demo=0`),demo:await one(env,`SELECT COUNT(*) AS n FROM clinicians WHERE is_demo=1`)},
  reports:{open:await one(env,`SELECT COUNT(*) AS n FROM reports WHERE status='open'`),total:await one(env,`SELECT COUNT(*) AS n FROM reports`)},
  // Store downloads and purchases are not visible to our server; they live in App Store Connect / Google Play Console.
  downloads:null,purchases:null
 },200,'no-store');
};
