import type {Env} from './db';

/** Fixed-window counter in D1; returns false once `limit` is exceeded inside the window. */
export async function underLimit(env:Env,bucket:string,limit:number,windowSec:number){
 const now=Date.now(),win=windowSec*1000;
 const r=await env.DB.prepare(
  `INSERT INTO rate_limits (bucket,window_start,count) VALUES (?1,?2,1)
   ON CONFLICT (bucket) DO UPDATE SET
    count=CASE WHEN rate_limits.window_start<=?3 THEN 1 ELSE rate_limits.count+1 END,
    window_start=CASE WHEN rate_limits.window_start<=?3 THEN ?2 ELSE rate_limits.window_start END
   RETURNING count`
 ).bind(bucket,now,now-win).first<{count:number}>();
 return (r?.count||0)<=limit;
}
