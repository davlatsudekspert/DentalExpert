// Guard for the one question index, with the REAL app data (no fixtures): every question of every assignable source —
// all curriculum topics (src/curriculum/index.json → src/curriculum/topics/*.json) and all presentation quizzes
// (public/decks/manifest.<lang>.json) — resolves in the app's index (src/questionIndex.ts) in uz/ru/en, and the server's
// index (functions/_lib/questionIndex.ts) has a key for it that is in range of its options. Also: the general-test
// source list the teacher picks from is exactly the server's ALL_SOURCES, and a general/variant pool over everything
// resolves completely. Run: npx tsx tools/question_index_test.ts
import {readFileSync} from 'node:fs';
import {resolveWith,refsOfDeck,refsOfTopic,deckSource,type DeckData,type Loaders,type TopicData} from '../src/questionIndex';
import {ALL_SOURCES,keyOf,sourceRefs,explainOf} from '../functions/_lib/questionIndex';
import {drawVariant} from '../src/classroomShared';

const root=new URL('../',import.meta.url);
const read=(p:string)=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const LANGS=['uz','ru','en'] as const;
const index=read('src/curriculum/index.json') as {topics:{id:string}[]};
const decks=Object.fromEntries(LANGS.map(l=>[l,read(`public/decks/manifest.${l}.json`) as DeckData[]])) as Record<typeof LANGS[number],DeckData[]>;
const loaders:Loaders={topic:async id=>{try{return read(`src/curriculum/topics/${id}.json`) as TopicData}catch{return null}},decks:async l=>decks[l]};
let n=0,bad:string[]=[];
const check=(name:string,ok:boolean)=>{n++;if(!ok)bad.push(name)};

// The sources a teacher can choose (topics of every subject + every deck quiz), as the app lists them.
const appSources=[...index.topics.map(t=>t.id),...decks.uz.filter(d=>d.quiz?.length).map(d=>deckSource(d.id))];
check('app and server list the same assignable sources',JSON.stringify([...appSources].sort())===JSON.stringify([...ALL_SOURCES].sort()));
const refs:string[]=[];
for(const id of index.topics.map(t=>t.id)){const t=await loaders.topic(id);check(`topic ${id} loads`,!!t);if(t)refs.push(...refsOfTopic(t))}
for(const d of decks.uz)refs.push(...refsOfDeck(d));
check('server refs = app refs for every source',JSON.stringify(ALL_SOURCES.flatMap(s=>sourceRefs(s)!).sort())===JSON.stringify([...refs].sort()));
check('no duplicate refs',new Set(refs).size===refs.length);
for(const lang of LANGS){
 const items=await resolveWith(refs,lang,loaders);
 items.forEach((q,i)=>{
  const ref=refs[i];const k=keyOf(ref);
  if(!q){bad.push(`${lang}: ${ref} not in the index`);return}
  n++;
  if(!q.q||q.options.length<2||q.options.some(o=>!o))bad.push(`${lang}: ${ref} has an empty question or option`);
  if(k===null||k<0||k>=q.options.length)bad.push(`${lang}: ${ref} key ${k} out of range (${q.options.length} options)`);
  if(q.correct!==undefined&&q.correct!==k)bad.push(`${lang}: ${ref} app key ${q.correct} ≠ server key ${k}`);
 });
}
check('explanations exist for every topic question',refs.filter(r=>!r.startsWith('deck.')).every(r=>!!explainOf(r)));
// A pool over everything (what a general test would draw from) resolves, for a fixed set and a variant draw.
const all=ALL_SOURCES.flatMap(s=>sourceRefs(s)!);
for(const who of ['@fixed','student-1']){
 const pick=(await drawVariant('guard',who,all,50,null)).map(i=>all[i]);
 check(`50-question draw (${who}) has no repeats`,new Set(pick).size===50);
 check(`50-question draw (${who}) resolves`,(await resolveWith(pick,'uz',loaders)).every(Boolean));
}
if(bad.length){console.error(`FAIL ${bad.length} problem(s):\n `+bad.slice(0,20).join('\n '));process.exit(1)}
console.log(`question index: ${refs.length} questions × 3 languages, ${ALL_SOURCES.length} sources, ${n} checks passed`);
