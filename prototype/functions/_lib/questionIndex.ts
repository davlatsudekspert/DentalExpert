import {CURRICULUM_KEYS} from './curriculumKeys';
import {DECK_KEYS} from './deckKeys';
import {qref,refIndex,refTopic} from '../../src/classroomShared';

/** The one server-side question index. Every assignable question has a ref "<source>:<index>":
 *  a curriculum topic test question ("card-01:3") or a presentation quiz question ("deck.caries-basics:2").
 *  Scoring, the variant pools, reviews and stats all resolve refs here; the app resolves the same refs with
 *  src/questionIndex.ts, and tools/question_index_test.ts checks that both cover every question with an in-range key. */
type L={en:string;ru:string;uz:string};
const DECK='deck.';
const bank=(source:string):{c:number[];e:L[]}|null=>
 source.startsWith(DECK)?(Object.hasOwn(DECK_KEYS,source.slice(DECK.length))?DECK_KEYS[source.slice(DECK.length)]:null)
 :Object.hasOwn(CURRICULUM_KEYS,source)?CURRICULUM_KEYS[source]:null;
export const isSource=(source:string)=>!!bank(source);
export const deckSource=(deckId:string)=>DECK+deckId;
export const ALL_SOURCES=[...Object.keys(CURRICULUM_KEYS),...Object.keys(DECK_KEYS).map(deckSource)];
export const sourceRefs=(source:string)=>{const b=bank(source);return b?b.c.map((_,i)=>qref(source,i)):null};
export const keyOf=(ref:string)=>{const b=bank(refTopic(ref));const v=b?.c[refIndex(ref)];return typeof v==='number'?v:null};
export const explainOf=(ref:string)=>bank(refTopic(ref))?.e[refIndex(ref)]??null;
