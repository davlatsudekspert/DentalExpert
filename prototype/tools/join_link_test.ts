// QR / invite parsing unit test: npx tsx tools/join_link_test.ts
import {joinLink,parseJoin} from '../src/joinLink.ts';
const id='1b2c3d4e-aaaa-bbbb-cccc-111122223333';
const cases:[string,ReturnType<typeof parseJoin>][]=[
 [joinLink('G5RMBA',id),{code:'G5RMBA',testId:id}],
 [joinLink('G5RMBA'),{code:'G5RMBA'}],
 ['dentalexpert://j?c=g5rmba&a='+id,{code:'G5RMBA',testId:id}],
 ['G5R MBA',{code:'G5RMBA'}],['g5r-mba',{code:'G5RMBA'}],[' LK63BD ',{code:'LK63BD'}],
 ['Guruhga qo‘shiling! Kodi: G5R MBA',{code:'G5RMBA'}],
 ['Dental Expert: Terapiya guruhiga qo‘shilish kodi LK63BD. Havola: https://dental-expert.pages.dev/j/?c=LK63BD',{code:'LK63BD',testId:undefined}],
 ['hello world',null],['KODINI kiriting',null],['',null],['https://example.com/?c=TOOLONG1',null]
];
let fail=0;
for(const [inp,want] of cases){const got=parseJoin(inp);if(JSON.stringify(got)!==JSON.stringify(want)){console.log('FAIL',JSON.stringify(inp),'→',JSON.stringify(got),'want',JSON.stringify(want));fail++}}
console.log(fail?`FAIL ${fail}`:`OK ${cases.length} cases`);if(fail)process.exit(1);
