/** The one place that defines Pro: prices, product ids, trial length and Free-tier limits.
 * Imported by the app (src/billing.ts, the paywall) and by the server (functions/_lib/entitlement.ts and the gates),
 * so a number is never changed in only one of them. Pure data and pure functions: no imports, no browser or Worker APIs. */

export type PlanRole='student'|'teacher'|'dentist';
export type Period='monthly'|'yearly';

/** Days of everything-included use that every account gets without a card. */
export const TRIAL_DAYS=30;

/** USD list prices, chosen to sit on App Store / Google Play price tiers. The stores show local currencies. */
export const PLANS:Record<PlanRole,{id:'student'|'teacher'|'specialist';monthly:{product:string;usd:number};yearly:{product:string;usd:number}}>={
 student:{id:'student',monthly:{product:'de_student_monthly',usd:1.49},yearly:{product:'de_student_yearly',usd:9.99}},
 teacher:{id:'teacher',monthly:{product:'de_teacher_monthly',usd:2.49},yearly:{product:'de_teacher_yearly',usd:24.99}},
 dentist:{id:'specialist',monthly:{product:'de_specialist_monthly',usd:3.49},yearly:{product:'de_specialist_yearly',usd:34.99}}
};
export const PRODUCT_IDS=Object.values(PLANS).flatMap(p=>[p.monthly.product,p.yearly.product]);
/** The plan a role may buy; patients never pay. */
export const planForRole=(role:string):typeof PLANS[PlanRole]|null=>role==='student'||role==='teacher'||role==='dentist'?PLANS[role]:null;
/** Which role a product belongs to (the server refuses a purchase that does not match the account's role). */
export const roleOfProduct=(product:string):PlanRole|null=>(Object.keys(PLANS) as PlanRole[]).find(r=>PLANS[r].monthly.product===product||PLANS[r].yearly.product===product)||null;

/** Free tier, after the trial. Everything not listed here stays free for everybody. */
export const FREE={
 /** Topics per curriculum subject that stay open (topic ids end with -01, -02 …). */
 topicsPerSubject:3,
 /** Practice questions per calendar day (UTC). */
 practicePerDay:20,
 /** Groups a teacher may run. */
 groups:1
} as const;

/** What only Pro unlocks. The server enforces the data-bearing ones; the rest are screens the client hides. */
export type ProFeature='topics'|'practice'|'exam'|'review'|'atlas3d'|'groups'|'generalTests'|'present'|'listing';
export const PRO_FEATURES:readonly ProFeature[]=['topics','practice','exam','review','atlas3d','groups','generalTests','present','listing'];
/** Roles each Pro feature is relevant to (for the paywall's feature list). */
export const FEATURE_ROLES:Record<ProFeature,readonly PlanRole[]>={
 topics:['student','teacher','dentist'],practice:['student','teacher','dentist'],exam:['student','teacher','dentist'],review:['student','teacher','dentist'],
 atlas3d:['student','teacher','dentist'],groups:['teacher','dentist'],generalTests:['teacher','dentist'],present:['teacher','dentist'],listing:['dentist']
};

/** Topic ids look like "perio-03". A topic is free when its number is within the free count. */
export const topicNumber=(id:string)=>{const m=/-(\d{2})$/.exec(id);return m?Number(m[1]):NaN};
export const topicIsFree=(id:string)=>topicNumber(id)<=FREE.topicsPerSubject;

export type ProReason='trial'|'paid'|'admin-grant'|'free';
/** `trialUsed`: this account got no trial because the person/device already used one. `heldRole`: the account holds a paid plan of ANOTHER role
 * than its current one (Pro is bound to the plan's role, so that plan unlocks nothing here). */
export type ProState={active:boolean;reason:ProReason;trialEndsAt:string|null;expiresAt:string|null;plan:string|null;trialUsed?:boolean;heldRole?:PlanRole|null};
export const daysLeft=(iso:string|null|undefined,now=Date.now())=>{const t=iso?Date.parse(iso.includes('T')?iso:iso.replace(' ','T')+'Z'):NaN;return Number.isFinite(t)?Math.max(0,Math.ceil((t-now)/86400000)):0};
