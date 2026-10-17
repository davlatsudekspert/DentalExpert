import index from './curriculum/index.json';
import type {Lang} from './discoveryData';

/** Curriculum built by tools/curriculum.py from curriculum/src (test answers are server-only). */
export type L={en:string;ru:string;uz:string};
export const tx=(v:L|undefined,lang:Lang)=>v?v[lang]||v.uz:'';

export type Subject={id:string;course:number;semester:number;title:L};
export type TopicMeta={id:string;subject:string;n:number;week:number;type:'lecture'|'practical';hours:number;title:L;tests:number};
export type Anchor='crown'|'enamel'|'dentin'|'pulp'|'canal'|'root'|'cej'|'apex'|'cusp'|'furcation'|'fissure'|'fossa'|'ridge';
export type Slide={layout:'title'|'bullets'|'key'|'flow'|'cycle'|'tree'|'compare'|'table'|'timeline'|'figure'|'summary';title:L;note?:L;subtitle?:L;bullets?:L[];
 term?:L;definition?:L;steps?:{label:L;detail?:L}[];center?:L;root?:L;children?:{label:L;items?:L[]}[];columns?:{head:L;items:L[]}[];head?:L[];rows?:L[][];
 events?:{when:L;label:L}[];image?:'cutaway'|'front'|'occlusal';callouts?:{at:Anchor;label:L}[]};
export type Topic=TopicMeta&{goals:L[];links:string[];sources:string[];slides:Slide[];oral:{q:L;plan:L[]}[];test:{q:L;options:L[]}[]};

export const SUBJECTS=index.subjects as Subject[];
export const TOPICS=index.topics as TopicMeta[];
export const topicsOf=(subject:string)=>TOPICS.filter(t=>t.subject===subject);
export const topicMeta=(id:string)=>TOPICS.find(t=>t.id===id);

const files=import.meta.glob<{default:Topic}>('./curriculum/topics/*.json');
const cache=new Map<string,Promise<Topic|null>>();
export function loadTopic(id:string):Promise<Topic|null>{
 if(!cache.has(id)){
  const f=files[`./curriculum/topics/${id}.json`];
  cache.set(id,f?f().then(m=>m.default).catch(()=>null):Promise.resolve(null));
 }
 return cache.get(id)!;
}

export const typeWord:Record<Lang,Record<TopicMeta['type'],string>>={
 uz:{lecture:'Ma’ruza',practical:'Amaliy mashg‘ulot'},ru:{lecture:'Лекция',practical:'Практическое занятие'},en:{lecture:'Lecture',practical:'Practical class'}
};
export const metaLine=(m:TopicMeta,lang:Lang)=>lang==='uz'?`${m.n}-mavzu · ${m.week}-hafta · ${typeWord.uz[m.type]} · ${m.hours} soat`
 :lang==='ru'?`Тема ${m.n} · ${m.week}-я неделя · ${typeWord.ru[m.type]} · ${m.hours} ч`:`Topic ${m.n} · Week ${m.week} · ${typeWord.en[m.type]} · ${m.hours} h`;
export const courseWord=(c:number,lang:Lang)=>lang==='uz'?`${c}-kurs`:lang==='ru'?`${c} курс`:`Year ${c}`;
