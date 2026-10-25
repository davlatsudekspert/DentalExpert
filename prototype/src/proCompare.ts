import {FREE,type PlanRole} from './proConfig';
import type {Lang} from './discoveryData';

/** One row of the Free vs Pro table on the paywall. `free` / `pro` are short phrases; '' means "no" / "yes". All numbers come from proConfig. */
export type CompareRow={id:string;roles:readonly PlanRole[];label:string;free:string;pro:string};
const ALL:readonly PlanRole[]=['student','teacher','dentist'],PRO_ROLES:readonly PlanRole[]=['teacher','dentist'];
const N=FREE;

const T:Record<Lang,{title:string;free:string;pro:string;no:string;yes:string;always:string;rows:Record<string,[string,string,string]>}>={
 uz:{title:'Nima bepul, nima Pro',free:'Bepul',pro:'Pro',no:'yo‘q',yes:'bor',always:'Doim bepul: hisob va profil, guruhga qo‘shilish, ustoz bergan testlarda qatnashish, natijalaringiz.',rows:{
  topics:['O‘quv reja',`har fandan ${N.topicsPerSubject} ta mavzu`,'barcha mavzular va testlar'],
  practice:['Rasmli amaliyot',`kuniga ${N.practicePerDay} ta savol`,'cheksiz'],
  attestation:['Bilim va malakani baholash',`kuniga ${N.attestationPerDay} ta savol`,'cheksiz'],
  exam:['Imtihon rejimi','',''],review:['Takrorlash','',''],
  atlas3d:['3D atlas','tish, emal, dentin','barcha qatlamlar'],
  groups:['Guruhlar',`${N.groups} ta`,'20 tagacha'],generalTests:['Umumiy testlar','',''],present:['Taqdimot rejimi (katta ekran)','',''],
  listing:['Ommaviy stomatologlar ro‘yxati','','']}},
 ru:{title:'Что бесплатно, что в Pro',free:'Бесплатно',pro:'Pro',no:'нет',yes:'есть',always:'Всегда бесплатно: аккаунт и профиль, вступление в группу, тесты, которые задал учитель, ваши результаты.',rows:{
  topics:['Учебный план',`${N.topicsPerSubject} темы в каждом предмете`,'все темы и тесты'],
  practice:['Практика по картинкам',`${N.practicePerDay} вопросов в день`,'без лимита'],
  attestation:['Проверка знаний и компетенций',`${N.attestationPerDay} вопросов в день`,'без лимита'],
  exam:['Режим экзамена','',''],review:['Повторение','',''],
  atlas3d:['3D-атлас','зуб, эмаль, дентин','все слои'],
  groups:['Группы',`${N.groups}`,'до 20'],generalTests:['Общие тесты','',''],present:['Режим презентации (большой экран)','',''],
  listing:['Публичный список стоматологов','','']}},
 en:{title:'What is free and what is Pro',free:'Free',pro:'Pro',no:'no',yes:'yes',always:'Always free: account and profile, joining a group, tests your teacher assigns, your results.',rows:{
  topics:['Curriculum',`${N.topicsPerSubject} topics per subject`,'every topic and quiz'],
  practice:['Picture practice',`${N.practicePerDay} questions a day`,'unlimited'],
  attestation:['Knowledge & Skills Assessment',`${N.attestationPerDay} questions a day`,'unlimited'],
  exam:['Exam mode','',''],review:['Spaced-repetition review','',''],
  atlas3d:['3D atlas','tooth, enamel, dentin','all layers'],
  groups:['Groups',`${N.groups}`,'up to 20'],generalTests:['General tests','',''],present:['Presentation mode (big screen)','',''],
  listing:['Public dentist listing','','']}}
};
const ORDER=['topics','practice','attestation','exam','review','atlas3d','groups','generalTests','present','listing'];
const ROLES:Record<string,readonly PlanRole[]>={groups:PRO_ROLES,generalTests:PRO_ROLES,present:PRO_ROLES,listing:['dentist']};

export function compareTable(lang:Lang,role:string,opts:{attestation:boolean;listing:boolean}){
 const t=T[lang];
 const rows=ORDER.filter(id=>(id!=='attestation'||opts.attestation)&&(id!=='listing'||opts.listing)&&(ROLES[id]||ALL).includes(role as PlanRole)).map(id=>{const [label,free,pro]=t.rows[id];return {id,label,free:free||t.no,pro:pro||t.yes,locked:!free}});
 return {title:t.title,free:t.free,pro:t.pro,always:t.always,rows};
}
