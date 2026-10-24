export interface Env {DB:D1Database;MEDIA:R2Bucket;AUTH_SECRET?:string;RESEND_API_KEY?:string;AUTH_FROM?:string;AUTH_DEV_ECHO?:string;ADMIN_EMAILS?:string;
 /** Pro/Free system: "1" turns it on (default off). REVENUECAT_WEBHOOK_AUTH is the shared secret RevenueCat sends in the Authorization header. */
 PRO_ENABLED?:string;TRIAL_PEPPER?:string;REVENUECAT_WEBHOOK_AUTH?:string;REVIEW_ACCOUNTS?:string;REVIEW_CODE?:string;
 /** Comma-separated OAuth client IDs accepted as the id_token `aud` (Sign in with Google / Apple). */
 GOOGLE_CLIENT_IDS?:string;APPLE_CLIENT_IDS?:string;
 /** Local tests only: a JWKS JSON trusted instead of the provider's, honoured only with AUTH_DEV_ECHO=1 on localhost. */
 OAUTH_TEST_JWKS?:string}

type Row=Record<string,unknown>;
const parse=(v:unknown)=>typeof v==='string'?JSON.parse(v):v;

export const json=(body:unknown,status=200,cache='public, max-age=60')=>
 new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':cache}});

export const cityIdOk=(v:string|null)=>!!v&&/^[A-Z]{2}-[A-Z0-9]{1,8}$/.test(v);

/** Doctors visible to the public: verified, or fictional demo rows. Contacts only when verified and not demo. */
export async function doctorsInCity(db:D1Database,cityId:string,ids?:string[]){
 const filter=ids?.length?` AND k.id IN (${ids.map(()=>'?').join(',')})`:'';
 const {results}=await db.prepare(
  `SELECT k.*, c.id AS clinic_id, c.name AS clinic_name, c.logo_url, c.address, c.city_id
   FROM clinicians k
   JOIN clinician_clinics kc ON kc.clinician_id=k.id
   JOIN clinics c ON c.id=kc.clinic_id
   WHERE c.city_id=? AND (k.license_status='verified' OR k.is_demo=1)${filter}
   ORDER BY k.rowid`
 ).bind(cityId,...(ids||[])).all<Row>();
 const byId=new Map<string,Row>();
 for(const r of results){
  const id=r.id as string;
  if(!byId.has(id))byId.set(id,{
   id,fullName:r.full_name,initials:r.initials,specialty:parse(r.specialty),bio:parse(r.bio),
   languages:parse(r.languages),services:parse(r.services),years:r.years,rating:r.rating??null,photoUrl:r.photo_url,
   licenseStatus:r.license_status,isDemo:!!r.is_demo,clinics:[],contacts:[]
  });
  (byId.get(id)!.clinics as Row[]).push({id:r.clinic_id,name:r.clinic_name,logoUrl:r.logo_url,cityId:r.city_id,address:parse(r.address)});
 }
 const real=[...byId.values()].filter(d=>!d.isDemo).map(d=>d.id as string);
 if(real.length){
  const {results:contacts}=await db.prepare(
   `SELECT clinician_id,kind,value FROM contact_channels WHERE verified_at IS NOT NULL AND clinician_id IN (${real.map(()=>'?').join(',')})`
  ).bind(...real).all<Row>();
  for(const c of contacts)(byId.get(c.clinician_id as string)!.contacts as Row[]).push({kind:c.kind,value:c.value,verified:true});
 }
 return [...byId.values()];
}

/** Paid, in-window campaigns of verified, non-demo clinicians who have a clinic in the campaign city. */
export async function activeSponsorIds(db:D1Database,cityId:string){
 const {results}=await db.prepare(
  `SELECT DISTINCT c.clinician_id, c.starts_at FROM ad_campaigns c
   JOIN clinicians k ON k.id=c.clinician_id
   JOIN clinician_clinics kc ON kc.clinician_id=k.id
   JOIN clinics cl ON cl.id=kc.clinic_id AND cl.city_id=c.city_id
   WHERE c.city_id=? AND c.payment_state='paid' AND datetime('now') BETWEEN c.starts_at AND c.ends_at
     AND k.license_status='verified' AND k.is_demo=0
   ORDER BY c.starts_at, c.clinician_id`
 ).bind(cityId).all<Row>();
 return results.map(r=>r.clinician_id as string);
}
