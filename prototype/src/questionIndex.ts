import {qref,refIndex,refTopic} from './classroomShared';

/** The one question index of the app. Every assignable question has a ref "<source>:<index>": a curriculum topic
 * test question ("card-01:3") or a presentation (deck) quiz question ("deck.caries-basics:2"). The teacher screen,
 * the student preview, the student's test, the big screen and the results all turn refs into questions here, so a
 * question that can be assigned can always be shown. The server's copy (functions/_lib/questionIndex.ts) holds the
 * keys; tools/question_index_test.ts checks with the real app data that both cover every question of every source.
 * This file is pure (no Vite or DOM imports) so the guard test runs it with the same loaders' data from disk. */
type L={en:string;ru:string;uz:string};
type Lang='uz'|'ru'|'en';
export type TopicData={id:string;test:{q:L;options:L[]}[]};
export type DeckData={id:string;title:string;quiz:{q:string;options:string[];correct:number;explanation?:string}[]};
export type Loaders={topic:(id:string)=>Promise<TopicData|null>;decks:(lang:Lang)=>Promise<DeckData[]>};
export type QItem={q:string;options:string[];explanation?:string;correct?:number};
export const DECK='deck.';
export const deckSource=(deckId:string)=>DECK+deckId;
export const isDeckSource=(s:string)=>s.startsWith(DECK);
const pick=(v:L|undefined,lang:Lang)=>v?v[lang]||v.en||'':'';

/** Questions for refs in that order; null for a ref the index cannot resolve (never expected — the guard test checks). */
export async function resolveWith(refs:readonly string[],lang:Lang,load:Loaders):Promise<(QItem|null)[]>{
 const topics=new Map<string,Promise<TopicData|null>>();
 let decks:Promise<Map<string,DeckData>>|null=null;
 return Promise.all(refs.map(async ref=>{
  const src=refTopic(ref),i=refIndex(ref);
  if(!Number.isInteger(i)||i<0)return null;
  if(isDeckSource(src)){
   decks??=load.decks(lang).then(ds=>new Map(ds.map(d=>[d.id,d])));
   const q=(await decks).get(src.slice(DECK.length))?.quiz[i];
   return q?{q:q.q,options:q.options,explanation:q.explanation,correct:q.correct}:null;
  }
  if(!topics.has(src))topics.set(src,load.topic(src));
  const q=(await topics.get(src))?.test[i];
  return q?{q:pick(q.q,lang),options:q.options.map(o=>pick(o,lang))}:null;
 }));
}
/** Every ref of a source. */
export const refsOfTopic=(t:TopicData)=>t.test.map((_,i)=>qref(t.id,i));
export const refsOfDeck=(d:DeckData)=>d.quiz.map((_,i)=>qref(deckSource(d.id),i));
