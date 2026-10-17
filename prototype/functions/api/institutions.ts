import {json,type Env} from '../_lib/db';

export const onRequestGet:PagesFunction<Env>=async({env})=>{
 const {results}=await env.DB.prepare(
  `SELECT id,name,city_id,website,schedule_url,schedule_label,attribution_required,checked_on,verification FROM institutions ORDER BY name`
 ).all<Record<string,unknown>>();
 return json({institutions:results.map(r=>({
  id:r.id,name:r.name,cityId:r.city_id,website:r.website,scheduleUrl:r.schedule_url,scheduleLabel:r.schedule_label,
  attributionRequired:!!r.attribution_required,checkedOn:r.checked_on,verification:r.verification
 }))},200,'public, max-age=3600');
};
