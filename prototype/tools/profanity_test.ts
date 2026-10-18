// Nickname filter unit test: npx tsx tools/profanity_test.ts
import {isProfane} from '../functions/_lib/profanity.ts';
const bad=['Fuck','f u c k','sh1t','Сука','хуй','Пиздец','blyat','Dalbayob','qotoq','siktir','J4lab','ёбаный','Bitch99','xuy','мудак'];
const ok=['Lola','Sikandar','Aziz','Klassik','Dilnoza','G‘ayrat','Shahzod','Hulkar','Дмитрий','Suxrob','Nodir','Dickson','Gaybulla','Ebru','Malika','Sukhrob','Нахимов'];
let fail=0;for(const w of bad)if(!isProfane(w)){console.log('MISS',w);fail++}
for(const w of ok)if(isProfane(w)){console.log('FALSE',w);fail++}
console.log(fail?'FAIL '+fail:'OK');if(fail)process.exit(1);
