import {useId,useMemo,useState,type ReactNode} from 'react';
import {ChevronDown,Search,X} from 'lucide-react';
import {Seg,Sources,type L,type Lang,type ToolProps} from './shared';

/* ------------------------------------------------------------------ types */
type Fact={k:L;v:L};
type Row={code:string;title:L;text?:L;facts?:Fact[];tone?:'brand'|'amber'|'red'|'deep'|'soft';fig?:ReactNode};
type Group={head?:L;rows:Row[]};
type Card={id:string;badge:string;title:L;sub:L;fig?:(lang:Lang)=>ReactNode;extra?:(lang:Lang)=>ReactNode;groups:Group[];foot?:L;src:string[]};

const l=(uz:string,ru:string,en:string):L=>({uz,ru,en});

/* ------------------------------------------------------------------ schematic figures */
const INK='#183e50',BRAND='#168d8b',SOFT='#e3f1f1',LINE='#9db8bf',HI='#d8892b';

/** Black classes: occlusal molar outline (I, II) and facial incisor outline (III–VI). */
function BlackFig({cls}:{cls:number}){
 const id=`tl-bk-${cls}`;
 const molar=cls<=2;
 const outline=molar
  ?<rect x="8" y="10" width="48" height="44" rx="14"/>
  :<path d="M20 6 Q32 3 44 6 L50 50 Q50 56 44 56 L20 56 Q14 56 14 50 Z"/>;
 const hi:Record<number,ReactNode>={
  1:<path d="M17 33 L26 30 L32 34 L39 29 L47 32 M26 30 L23 22 M39 29 L42 21 M32 34 L31 44" fill="none" stroke={HI} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>,
  2:<><rect x="6" y="20" width="15" height="24" rx="4" fill={HI}/><path d="M21 33 L32 34 L47 32" fill="none" stroke={HI} strokeWidth="3.5" strokeLinecap="round"/></>,
  3:<ellipse cx="48" cy="30" rx="6" ry="9" fill={HI}/>,
  4:<path d="M40 28 L56 26 L56 60 L34 60 Z" fill={HI}/>,
  5:<ellipse cx="32" cy="7" rx="16" ry="7" fill={HI}/>,
  6:<rect x="10" y="51" width="44" height="8" fill={HI}/>,
 };
 return <svg className="tl-mini" viewBox="0 0 64 64" aria-hidden="true">
  <defs><clipPath id={id}>{outline}</clipPath></defs>
  <g fill="#fff" stroke={LINE} strokeWidth="2">{outline}</g>
  {molar&&<path d="M17 33 L26 30 L32 34 L39 29 L47 32" fill="none" stroke="#cfdfe1" strokeWidth="1.5"/>}
  <g clipPath={`url(#${id})`}>{hi[cls]}</g>
  <g fill="none" stroke={INK} strokeWidth="2" opacity=".55">{outline}</g>
 </svg>;
}

/** Kennedy classes on a schematic arch (third molars excluded). Missing teeth are dashed. */
function KennedyFig({missing}:{missing:string[]}){
 const teeth:{k:string;x:number;y:number;r:number}[]=[];
 const seq=[...[7,6,5,4,3,2,1].map(n=>'R'+n),...[1,2,3,4,5,6,7].map(n=>'L'+n)];
 seq.forEach((k,i)=>{
  const th=Math.PI*(1-(i+0.5)/14),n=Number(k.slice(1));
  teeth.push({k,x:60+46*Math.cos(th),y:66-52*Math.sin(th),r:n>=6?6.4:n>=4?5.4:4.6});
 });
 return <svg className="tl-mini tl-mini-wide" viewBox="0 0 120 76" aria-hidden="true">
  <path d="M8 72 Q8 4 60 4 Q112 4 112 72" fill="none" stroke={SOFT} strokeWidth="16" strokeLinecap="round"/>
  {teeth.map(t=>missing.includes(t.k)
   ?<circle key={t.k} cx={t.x} cy={t.y} r={t.r} fill="#fff1db" stroke={HI} strokeWidth="1.6" strokeDasharray="2.2 2"/>
   :<circle key={t.k} cx={t.x} cy={t.y} r={t.r} fill="#fff" stroke={BRAND} strokeWidth="1.6"/>)}
 </svg>;
}

/** Angle molar relationship, buccal view, mesial to the left. off = position of the upper MB cusp relative to the lower buccal groove. */
function AngleFig({off}:{off:number}){
 const g=46,ux=g-14+off;
 return <svg className="tl-mini tl-mini-wide" viewBox="0 0 100 64" aria-hidden="true">
  <path d={`M${ux-6} 6 h56 v14 q-4 9 -9 9 q-5 0 -8 -7 q-3 7 -9 7 q-6 0 -9 -7 q-3 7 -9 7 q-5 0 -8 -7 q-4 7 -9 7 q-4 0 -5 -9 z`} fill="#fff" stroke={LINE} strokeWidth="2"/>
  <circle cx={g+off} cy="27" r="3.4" fill={HI}/>
  <path d="M14 58 h64 v-14 q-3 -9 -8 -9 q-5 0 -8 7 q-3 -7 -9 -7 q-6 0 -9 7 q-3 -7 -9 -7 q-5 0 -8 7 q-4 -7 -9 -7 q-4 0 -4 9 z" fill="#fff" stroke={LINE} strokeWidth="2"/>
  <line x1={g} x2={g} y1="31" y2="58" stroke={BRAND} strokeWidth="2" strokeDasharray="3 2.5"/>
  <path d="M6 33 l6 -3 v6 z" fill={INK} opacity=".5"/>
 </svg>;
}

/** FDI quadrant cross with Universal ranges. */
function NumberingFig({lang}:{lang:Lang}){
 const R=lang==='uz'?'O‘ng':lang==='ru'?'Прав.':'Right',Lf=lang==='uz'?'Chap':lang==='ru'?'Лев.':'Left';
 return <svg className="tl-fig" viewBox="0 0 300 132" role="img" aria-label="FDI 1–4, Universal 1–32">
  <line x1="150" x2="150" y1="10" y2="112" stroke={INK} strokeWidth="2"/>
  <line x1="20" x2="280" y1="66" y2="66" stroke={INK} strokeWidth="2"/>
  {[{x:85,y:40,q:'1',u:'1–8',p:'A–E · 5'},{x:215,y:40,q:'2',u:'9–16',p:'F–J · 6'},{x:85,y:96,q:'4',u:'25–32',p:'P–T · 8'},{x:215,y:96,q:'3',u:'17–24',p:'K–O · 7'}].map(c=><g key={c.q}>
   <circle cx={c.x-38} cy={c.y-4} r="15" fill={SOFT}/>
   <text x={c.x-38} y={c.y+2} textAnchor="middle" className="tl-fig-q">{c.q}</text>
   <text x={c.x-14} y={c.y-6} className="tl-fig-u">{c.u}</text>
   <text x={c.x-14} y={c.y+10} className="tl-fig-s">{c.p}</text>
  </g>)}
  <text x="20" y="128" className="tl-fig-s">{R}</text>
  <text x="150" y="128" textAnchor="middle" className="tl-fig-s">{lang==='uz'?'FDI · Universal · sut tishlari':lang==='ru'?'FDI · Universal · временные':'FDI · Universal · primary'}</text>
  <text x="280" y="128" textAnchor="end" className="tl-fig-s">{Lf}</text>
 </svg>;
}

/* ------------------------------------------------------------------ numbering converter */
type Dent='perm'|'prim';
const QN:Record<Dent,number[]>={perm:[1,2,3,4],prim:[5,6,7,8]};
function universal(q:number,n:number){
 if(q<=4)return String(q===1?9-n:q===2?8+n:q===3?25-n:24+n);
 const i=q===5?5-n:q===6?4+n:q===7?15-n:14+n;
 return String.fromCharCode(65+i);
}
const QL:Record<number,L>={
 1:l('Yuqori o‘ng','Верхний правый','Upper right'),2:l('Yuqori chap','Верхний левый','Upper left'),
 3:l('Pastki chap','Нижний левый','Lower left'),4:l('Pastki o‘ng','Нижний правый','Lower right'),
};
const CT={
 uz:{dent:'Tishlar to‘plami',perm:'Doimiy',prim:'Sut',quad:'Kvadrant',tooth:'Tish',conv:'Raqamlash konvertori'},
 ru:{dent:'Прикус',perm:'Постоянные',prim:'Временные',quad:'Квадрант',tooth:'Зуб',conv:'Конвертер нумерации'},
 en:{dent:'Dentition',perm:'Permanent',prim:'Primary',quad:'Quadrant',tooth:'Tooth',conv:'Numbering converter'},
};
function Converter({lang}:{lang:Lang}){
 const t=CT[lang];
 const [dent,setDent]=useState<Dent>('perm');
 const [qi,setQi]=useState(0);
 const [n,setN]=useState(6);
 const max=dent==='perm'?8:5,nn=Math.min(n,max),q=QN[dent][qi];
 const palmer=dent==='perm'?String(nn):String.fromCharCode(64+nn);
 const cls=['ur','ul','ll','lr'][qi];
 return <div className="tl-conv">
  <h4 className="tl-h4">{t.conv}</h4>
  <Seg label={t.dent} value={dent} options={[{id:'perm',label:t.perm},{id:'prim',label:t.prim}]} onChange={d=>{setDent(d);if(d==='prim'&&n>5)setN(5)}}/>
  <div className="tl-chipgrid tl-chipgrid-2" role="radiogroup" aria-label={t.quad}>
   {[0,1,2,3].map(i=><button key={i} type="button" role="radio" aria-checked={qi===i} className={'tl-chip'+(qi===i?' tl-chip-on':'')} onClick={()=>setQi(i)}>{QL[i+1][lang]}</button>)}
  </div>
  <div className="tl-chipgrid" role="radiogroup" aria-label={t.tooth}>
   {Array.from({length:max},(_,i)=>i+1).map(k=><button key={k} type="button" role="radio" aria-checked={nn===k} className={'tl-chip tl-chip-n'+(nn===k?' tl-chip-on':'')} onClick={()=>setN(k)}>{dent==='perm'?k:String.fromCharCode(64+k)}</button>)}
  </div>
  <div className="tl-conv-out" aria-live="polite">
   <div><small>FDI</small><b>{q}{nn}</b></div>
   <div><small>Universal</small><b>{universal(q,nn)}</b></div>
   <div><small>Palmer</small><b><span className={'tl-palmer tl-palmer-'+cls}>{palmer}</span></b></div>
  </div>
 </div>;
}

/* ------------------------------------------------------------------ content */
const CAL=l('Interdental CAL','Межзубная CAL','Interdental CAL');
const RBL=l('Suyak yo‘qotilishi (rentgen)','Потеря кости (рентген)','Radiographic bone loss');
const TL=l('Parodontit tufayli tish yo‘qotilishi','Потеря зубов из-за пародонтита','Tooth loss due to periodontitis');
const CX=l('Murakkablik','Сложность','Complexity');
const DIR=l('Bevosita dalil: 5 yilda CAL yoki suyak yo‘qotilishi','Прямые данные: потеря CAL или кости за 5 лет','Direct evidence: CAL or bone loss over 5 years');
const IND=l('Bilvosita: suyak yo‘qotilishi % / yosh','Косвенно: % потери кости / возраст','Indirect: % bone loss / age');
const PH=l('Klinik fenotip','Фенотип случая','Case phenotype');
const SM=l('Chekish','Курение','Smoking');
const DM=l('Qandli diabet','Сахарный диабет','Diabetes');
const RBL_M=l('ildizning o‘rta uchdan biri va undan pastga','средняя треть корня и далее','middle third of root and beyond');

const CARDS:Card[]=[
 {id:'num',badge:'FDI',
  title:l('Tish raqamlash tizimlari','Системы нумерации зубов','Tooth numbering systems'),
  sub:l('FDI, Universal (ADA) va Palmer','FDI, Universal (ADA) и Палмер','FDI vs Universal (ADA) vs Palmer'),
  fig:lang=><NumberingFig lang={lang}/>,
  extra:lang=><Converter lang={lang}/>,
  groups:[{rows:[
   {code:'FDI',title:l('FDI / ISO 3950 (ikki raqamli)','FDI / ISO 3950 (двузначная)','FDI / ISO 3950 (two-digit)'),
    text:l('Birinchi raqam — kvadrant: 1 yuqori o‘ng, 2 yuqori chap, 3 pastki chap, 4 pastki o‘ng; sut tishlarida 5–8. Ikkinchi raqam — o‘rta chiziqdan boshlab tish: doimiylarda 1–8, sut tishlarida 1–5. Masalan, 16 — yuqori o‘ng birinchi katta oziq tish.',
     'Первая цифра — квадрант: 1 верхний правый, 2 верхний левый, 3 нижний левый, 4 нижний правый; для временных зубов 5–8. Вторая цифра — зуб от средней линии: 1–8 для постоянных, 1–5 для временных. Например, 16 — верхний правый первый моляр.',
     'First digit is the quadrant: 1 upper right, 2 upper left, 3 lower left, 4 lower right; 5–8 for primary teeth. Second digit is the tooth from the midline: 1–8 permanent, 1–5 primary. Example: 16 is the upper right first molar.')},
   {code:'ADA',title:l('Universal (ADA)','Универсальная (ADA)','Universal (ADA)'),
    text:l('Doimiy tishlar 1–32: yuqori o‘ng uchinchi katta oziq tishdan (1) yuqori chap uchinchisigacha (16), so‘ng pastki chap uchinchidan (17) pastki o‘ng uchinchisigacha (32). Sut tishlari A–T xuddi shu tartibda: A — yuqori o‘ng ikkinchi oziq tish.',
     'Постоянные зубы 1–32: от верхнего правого третьего моляра (1) до верхнего левого третьего моляра (16), затем от нижнего левого третьего моляра (17) до нижнего правого (32). Временные A–T в том же порядке: A — верхний правый второй моляр.',
     'Permanent teeth 1–32: from the upper right third molar (1) to the upper left third molar (16), then the lower left third molar (17) to the lower right third molar (32). Primary teeth A–T in the same order: A is the upper right second molar.')},
   {code:'Palmer',title:l('Palmer (Zsigmondy–Palmer)','Палмер (Зигмонди–Палмер)','Palmer (Zsigmondy–Palmer)'),
    text:l('Kvadrant burchak belgisi bilan ko‘rsatiladi, tish esa o‘rta chiziqdan raqam bilan: doimiylarda 1–8, sut tishlarida A–E. Masalan, 6┘ — yuqori o‘ng birinchi katta oziq tish.',
     'Квадрант обозначается угловым знаком, зуб — номером от средней линии: 1–8 для постоянных, A–E для временных. Например, 6┘ — верхний правый первый моляр.',
     'The quadrant is shown by an angle symbol and the tooth by its number from the midline: 1–8 permanent, A–E primary. Example: 6┘ is the upper right first molar.')},
  ]}],
  src:['ISO 3950:2016. Dentistry — Designation system for teeth and areas of the oral cavity.','American Dental Association. Universal numbering system.']},

 {id:'black',badge:'I–VI',
  title:l('Black bo‘yicha kovak klasslari','Классы полостей по Блэку','Black’s cavity classes'),
  sub:l('Karies joylashuvi bo‘yicha I–VI klass','Классы I–VI по локализации кариеса','Classes I–VI by lesion location'),
  groups:[{rows:[
   {code:'I',fig:<BlackFig cls={1}/>,title:l('Chuqurcha va fissuralar','Ямки и фиссуры','Pits and fissures'),
    text:l('Kichik va katta oziq tishlarning chaynov yuzasi, katta oziq tishlarning lunj va til yuzalaridagi chuqurchalar, yuqori kurak tishlarning tanglay chuqurchalari.',
     'Жевательные поверхности премоляров и моляров, ямки щёчной и язычной поверхностей моляров, нёбные ямки верхних резцов.',
     'Occlusal surfaces of premolars and molars, buccal and lingual pits of molars, and lingual pits of maxillary incisors.')},
   {code:'II',fig:<BlackFig cls={2}/>,title:l('Kichik va katta oziq tishlarning kontakt yuzalari','Контактные поверхности премоляров и моляров','Proximal surfaces of premolars and molars'),
    text:l('Mezial yoki distal yuza, ko‘pincha chaynov yuzasiga o‘tadi (MO, DO, MOD).','Медиальная или дистальная поверхность, часто с переходом на жевательную (MO, DO, MOD).','Mesial or distal surface, often extending occlusally (MO, DO, MOD).')},
   {code:'III',fig:<BlackFig cls={3}/>,title:l('Old tishlarning kontakt yuzalari, burchaksiz','Контактные поверхности передних зубов без угла','Proximal surfaces of anterior teeth, angle intact'),
    text:l('Kurak va qoziq tishlarning kontakt yuzalari; kesuvchi burchak zararlanmagan.','Контактные поверхности резцов и клыков без вовлечения режущего угла.','Proximal surfaces of incisors and canines not involving the incisal angle.')},
   {code:'IV',fig:<BlackFig cls={4}/>,title:l('Old tishlarning kontakt yuzalari, burchak bilan','Контактные поверхности передних зубов с углом','Proximal surfaces of anterior teeth with the angle'),
    text:l('Kurak va qoziq tishlarning kontakt yuzalari, kesuvchi burchak ham zararlangan.','Контактные поверхности резцов и клыков с вовлечением режущего угла.','Proximal surfaces of incisors and canines involving the incisal angle.')},
   {code:'V',fig:<BlackFig cls={5}/>,title:l('Bo‘yin sohasi','Пришеечная область','Cervical (gingival third)'),
    text:l('Barcha tishlarning vestibulyar yoki oral yuzasining milk oldi uchdan bir qismi.','Пришеечная треть вестибулярной или оральной поверхности любых зубов.','Gingival third of the facial or lingual surface of any tooth.')},
   {code:'VI',fig:<BlackFig cls={6}/>,title:l('Kesuvchi qirra va do‘mboq uchlari','Режущий край и бугры','Incisal edges and cusp tips'),
    text:l('Old tishlarning kesuvchi qirrasi va orqa tishlar do‘mboqlarining uchi. Bu klassni keyinchalik Simon qo‘shgan.','Режущий край передних зубов и вершины бугров боковых зубов. Класс добавлен позднее (Simon).','Incisal edges of anterior teeth and cusp tips of posterior teeth. Added later by Simon.')},
  ]}],
  src:['Black GV. A Work on Operative Dentistry. Chicago: Medico-Dental Publishing; 1908.','Ritter AV, ed. Sturdevant’s Art and Science of Operative Dentistry. 7th ed. Elsevier; 2019.']},

 {id:'icdas',badge:'0–6',
  title:l('ICDAS kodlari','Коды ICDAS','ICDAS codes'),
  sub:l('Kariesni vizual aniqlash va baholash, 0–6','Визуальная диагностика кариеса, 0–6','Visual caries detection and assessment, 0–6'),
  groups:[{rows:[
   {code:'0',tone:'soft',title:l('Sog‘lom yuza','Здоровая поверхность','Sound surface'),text:l('Uzoq (≈5 s) havo bilan quritilgandan keyin ham karies belgisi yo‘q.','Нет признаков кариеса после длительного (≈5 с) высушивания воздухом.','No evidence of caries after prolonged (≈5 s) air drying.')},
   {code:'1',tone:'brand',title:l('Emaldagi ilk ko‘rinadigan o‘zgarish','Первое видимое изменение эмали','First visual change in enamel'),text:l('Faqat uzoq quritilgandan keyin ko‘rinadi yoki chuqurcha/fissura chegarasida.','Видно только после длительного высушивания или ограничено ямкой/фиссурой.','Seen only after prolonged air drying, or confined to a pit or fissure.')},
   {code:'2',tone:'brand',title:l('Emaldagi aniq ko‘rinadigan o‘zgarish','Выраженное видимое изменение эмали','Distinct visual change in enamel'),text:l('Ho‘l yuzada ham ko‘rinadi.','Видно и на влажной поверхности.','Visible when the surface is wet.')},
   {code:'3',tone:'amber',title:l('Emalning lokal yemirilishi','Локальное разрушение эмали','Localised enamel breakdown'),text:l('Dentin ko‘rinmaydi va ostida soya yo‘q.','Без видимого дентина и подлежащей тени.','No visible dentine or underlying shadow.')},
   {code:'4',tone:'amber',title:l('Dentindan ko‘rinadigan qoramtir soya','Тёмная тень дентина','Underlying dark shadow from dentine'),text:l('Emal yemirilishi bo‘lishi yoki bo‘lmasligi mumkin.','С локальным разрушением эмали или без него.','With or without localised enamel breakdown.')},
   {code:'5',tone:'red',title:l('Dentin ko‘rinadigan aniq kovak','Выраженная полость с видимым дентином','Distinct cavity with visible dentine'),text:l('Kovak yuzaning yarmidan kam qismini egallaydi.','Полость занимает менее половины поверхности.','Involves less than half of the surface.')},
   {code:'6',tone:'red',title:l('Dentin ko‘rinadigan keng kovak','Обширная полость с видимым дентином','Extensive distinct cavity with visible dentine'),text:l('Kovak yuzaning yarmidan ko‘pini egallaydi.','Полость занимает более половины поверхности.','Involves more than half of the surface.')},
  ]}],
  foot:l('ICCMS guruhlari: 1–2 boshlang‘ich, 3–4 o‘rtacha, 5–6 keng karies.','Группы ICCMS: 1–2 начальный, 3–4 средний, 5–6 обширный кариес.','ICCMS groups: 1–2 initial, 3–4 moderate, 5–6 extensive caries.'),
  src:['Ismail AI, et al. The International Caries Detection and Assessment System (ICDAS): an integrated system for measuring dental caries. Community Dent Oral Epidemiol. 2007;35:170–178.','Pitts NB, Ismail AI, et al. ICCMS Guide for Practitioners and Educators. 2014.']},

 {id:'kennedy',badge:'I–IV',
  title:l('Kennedy tasnifi','Классификация Кеннеди','Kennedy classification'),
  sub:l('Qisman tishsiz jag‘ yoylari','Частично беззубые зубные дуги','Partially edentulous arches'),
  groups:[{rows:[
   {code:'I',fig:<KennedyFig missing={['R6','R7','L6','L7']}/>,title:l('Ikki tomonlama distal nuqson','Двусторонний концевой дефект','Bilateral distal extension'),text:l('Qolgan tishlardan orqada joylashgan ikki tomonlama tishsiz sohalar.','Двусторонние беззубые участки позади оставшихся зубов.','Bilateral edentulous areas posterior to the remaining teeth.')},
   {code:'II',fig:<KennedyFig missing={['L6','L7']}/>,title:l('Bir tomonlama distal nuqson','Односторонний концевой дефект','Unilateral distal extension'),text:l('Qolgan tishlardan orqada joylashgan bir tomonlama tishsiz soha.','Односторонний беззубый участок позади оставшихся зубов.','A unilateral edentulous area posterior to the remaining teeth.')},
   {code:'III',fig:<KennedyFig missing={['L4','L5','L6']}/>,title:l('Bir tomonlama chegaralangan nuqson','Односторонний включённый дефект','Unilateral bounded saddle'),text:l('Bir tomonlama tishsiz soha, oldida ham, orqasida ham tabiiy tishlar bor.','Односторонний беззубый участок с естественными зубами спереди и сзади.','A unilateral edentulous area with natural teeth both anterior and posterior to it.')},
   {code:'IV',fig:<KennedyFig missing={['R1','R2','L1','L2']}/>,title:l('Old nuqson, o‘rta chiziqni kesib o‘tadi','Передний дефект через среднюю линию','Anterior, crossing the midline'),text:l('Qolgan tishlardan oldinda joylashgan, o‘rta chiziqni kesib o‘tuvchi yagona tishsiz soha.','Единый беззубый участок впереди оставшихся зубов, пересекающий среднюю линию.','A single edentulous area anterior to the remaining teeth that crosses the midline.')},
  ]}],
  foot:l('Applegate qoidalari: eng orqadagi tishsiz soha klassni belgilaydi; qo‘shimcha sohalar modifikatsiya deb sanaladi; IV klassda modifikatsiya bo‘lmaydi; o‘rnini tiklash rejalashtirilmagan uchinchi katta oziq tishlar hisobga olinmaydi.',
   'Правила Эпплгейта: класс определяет самый дистальный беззубый участок; дополнительные участки — модификации; у IV класса модификаций нет; отсутствующие третьи моляры, которые не будут замещены, не учитываются.',
   'Applegate’s rules: the most posterior edentulous area determines the class; additional areas are modification spaces; Class IV has no modifications; missing third molars that will not be replaced are not considered.'),
  src:['Carr AB, Brown DT. McCracken’s Removable Partial Prosthodontics. 13th ed. Elsevier; 2016. Kennedy classification and Applegate’s rules.']},

 {id:'angle',badge:'I–III',
  title:l('Angle klasslari','Классы Энгля','Angle classes'),
  sub:l('Birinchi katta oziq tishlar munosabati','Соотношение первых моляров','First molar relationship'),
  groups:[{rows:[
   {code:'I',fig:<AngleFig off={0}/>,title:l('Neytral okklyuziya','Нейтроокклюзия','Neutrocclusion'),text:l('Yuqori birinchi katta oziq tishning mezio-lunj do‘mbog‘i pastki birinchi katta oziq tishning lunj egatiga tushadi. Boshqa anomaliyalar (tiqilinch, burilish) bo‘lishi mumkin.','Медиально-щёчный бугор верхнего первого моляра располагается в щёчной борозде нижнего первого моляра. Возможны другие аномалии (скученность, повороты).','The mesiobuccal cusp of the upper first molar occludes in the buccal groove of the lower first molar. Other irregularities (crowding, rotations) may be present.')},
   {code:'II',fig:<AngleFig off={-10}/>,title:l('Distal okklyuziya','Дистоокклюзия','Distocclusion'),text:l('Mezio-lunj do‘mboq lunj egatidan mezialroqda: pastki tish distal joylashgan. 1-bo‘lim: yuqori kurak tishlar oldinga qiyshaygan, overjet kattalashgan. 2-bo‘lim: yuqori markaziy kurak tishlar orqaga qiyshaygan, ko‘pincha chuqur tishlam.','Медиально-щёчный бугор мезиальнее щёчной борозды: нижний моляр смещён дистально. Подкласс 1: протрузия верхних резцов, увеличенная сагиттальная щель. Подкласс 2: ретрузия верхних центральных резцов, часто глубокий прикус.','The mesiobuccal cusp lies mesial to the buccal groove: the lower molar is distal. Division 1: proclined upper incisors with increased overjet. Division 2: retroclined upper central incisors, often with a deep bite.')},
   {code:'III',fig:<AngleFig off={10}/>,title:l('Mezial okklyuziya','Мезиоокклюзия','Mesiocclusion'),text:l('Mezio-lunj do‘mboq lunj egatidan distalroqda: pastki tish mezial joylashgan.','Медиально-щёчный бугор дистальнее щёчной борозды: нижний моляр смещён мезиально.','The mesiobuccal cusp lies distal to the buccal groove: the lower molar is mesial.')},
  ]}],
  foot:l('Rasm: lunj tomondan ko‘rinish, mezial tomon chapda. To‘q sariq nuqta — yuqori tishning mezio-lunj do‘mbog‘i, uzuq chiziq — pastki tishning lunj egati.','Схема: вид со щёчной стороны, мезиальная сторона слева. Оранжевая точка — медиально-щёчный бугор верхнего моляра, пунктир — щёчная борозда нижнего.','Diagram: buccal view, mesial to the left. Orange dot is the upper mesiobuccal cusp; the dashed line is the lower buccal groove.'),
  src:['Angle EH. Classification of malocclusion. Dental Cosmos. 1899;41:248–264.','Proffit WR, Fields HW, Larson BE, Sarver DM. Contemporary Orthodontics. 6th ed. Elsevier; 2019.']},

 {id:'perio',badge:'AAP/EFP',
  title:l('Parodontit: bosqich va daraja','Пародонтит: стадия и степень','Periodontitis: stage and grade'),
  sub:l('AAP/EFP 2017 tasnifi','Классификация AAP/EFP 2017','AAP/EFP 2017 classification'),
  groups:[
   {head:l('Bosqich (og‘irlik va murakkablik)','Стадия (тяжесть и сложность)','Stage (severity and complexity)'),rows:[
    {code:'I',tone:'brand',title:l('Boshlang‘ich','Начальная','Initial'),facts:[{k:CAL,v:l('1–2 mm','1–2 мм','1–2 mm')},{k:RBL,v:l('koronal uchdan bir qism (<15%)','коронковая треть (<15%)','coronal third (<15%)')},{k:TL,v:l('yo‘q','нет','none')},{k:CX,v:l('maks. zond chuqurligi ≤4 mm; asosan gorizontal suyak yo‘qotilishi','макс. глубина зондирования ≤4 мм; преимущественно горизонтальная потеря кости','max probing depth ≤4 mm; mostly horizontal bone loss')}]},
    {code:'II',tone:'brand',title:l('O‘rtacha','Умеренная','Moderate'),facts:[{k:CAL,v:l('3–4 mm','3–4 мм','3–4 mm')},{k:RBL,v:l('koronal uchdan bir qism (15–33%)','коронковая треть (15–33%)','coronal third (15–33%)')},{k:TL,v:l('yo‘q','нет','none')},{k:CX,v:l('maks. zond chuqurligi ≤5 mm; asosan gorizontal suyak yo‘qotilishi','макс. глубина зондирования ≤5 мм; преимущественно горизонтальная потеря кости','max probing depth ≤5 mm; mostly horizontal bone loss')}]},
    {code:'III',tone:'amber',title:l('Og‘ir, tish yo‘qotish xavfi bilan','Тяжёлая, с риском потери зубов','Severe, with potential for tooth loss'),facts:[{k:CAL,v:l('≥5 mm','≥5 мм','≥5 mm')},{k:RBL,v:RBL_M},{k:TL,v:l('≤4 ta tish','≤4 зубов','≤4 teeth')},{k:CX,v:l('II bosqichdagidan tashqari: zond chuqurligi ≥6 mm; vertikal suyak yo‘qotilishi ≥3 mm; II–III daraja furkatsiya zararlanishi; o‘rtacha alveolyar qirra nuqsoni','помимо признаков II стадии: глубина зондирования ≥6 мм; вертикальная потеря кости ≥3 мм; поражение фуркации II–III класса; умеренный дефект гребня','in addition to stage II: probing depth ≥6 mm; vertical bone loss ≥3 mm; class II or III furcation involvement; moderate ridge defect')}]},
    {code:'IV',tone:'red',title:l('Og‘ir, tishlar to‘plamini yo‘qotish xavfi bilan','Тяжёлая, с риском потери зубного ряда','Severe, with potential for loss of the dentition'),facts:[{k:CAL,v:l('≥5 mm','≥5 мм','≥5 mm')},{k:RBL,v:RBL_M},{k:TL,v:l('≥5 ta tish','≥5 зубов','≥5 teeth')},{k:CX,v:l('III bosqichdagidan tashqari: murakkab reabilitatsiya zarur — chaynash disfunksiyasi, ikkilamchi okklyuzion travma (qimirlash ≥2 daraja), og‘ir qirra nuqsoni, tishlam pasayishi, tishlar siljishi va yelpig‘ichsimon ajralishi, 20 tadan kam tish (10 juft antagonist)','помимо признаков III стадии: необходима комплексная реабилитация — жевательная дисфункция, вторичная окклюзионная травма (подвижность ≥2 степени), тяжёлый дефект гребня, снижение прикуса, миграция и веерообразное расхождение зубов, менее 20 зубов (10 пар антагонистов)','in addition to stage III: need for complex rehabilitation — masticatory dysfunction, secondary occlusal trauma (mobility degree ≥2), severe ridge defect, bite collapse, drifting, flaring, fewer than 20 remaining teeth (10 opposing pairs)')}]},
   ]},
   {head:l('Daraja (progressiya tezligi)','Степень (скорость прогрессирования)','Grade (rate of progression)'),rows:[
    {code:'A',tone:'brand',title:l('Sekin','Медленная','Slow'),facts:[{k:DIR,v:l('yo‘qotilish yo‘q','нет потери','no loss')},{k:IND,v:l('<0,25','<0,25','<0.25')},{k:PH,v:l('ko‘p biofilm, destruksiya kam','обильный биофильм при небольшой деструкции','heavy biofilm with low levels of destruction')},{k:SM,v:l('chekmaydi','некурящий','non-smoker')},{k:DM,v:l('normoglikemiya / diabet yo‘q','нормогликемия / нет диабета','normoglycaemic / no diabetes')}]},
    {code:'B',tone:'amber',title:l('O‘rtacha','Умеренная','Moderate'),facts:[{k:DIR,v:l('<2 mm','<2 мм','<2 mm')},{k:IND,v:l('0,25–1,0','0,25–1,0','0.25–1.0')},{k:PH,v:l('destruksiya biofilm miqdoriga mos','деструкция соответствует количеству биофильма','destruction commensurate with biofilm deposits')},{k:SM,v:l('kuniga <10 sigaret','<10 сигарет в день','<10 cigarettes/day')},{k:DM,v:l('diabetda HbA1c <7,0%','HbA1c <7,0% при диабете','HbA1c <7.0% in diabetes')}]},
    {code:'C',tone:'red',title:l('Tez','Быстрая','Rapid'),facts:[{k:DIR,v:l('≥2 mm','≥2 мм','≥2 mm')},{k:IND,v:l('>1,0','>1,0','>1.0')},{k:PH,v:l('destruksiya biofilm miqdoridan ortiq; tez progressiya yoki erta boshlanish belgilari (masalan, molyar-kesuvchi tish shakli, standart davoga kutilgan javob yo‘qligi)','деструкция превышает ожидаемую по количеству биофильма; признаки быстрого прогрессирования или раннего начала (например, молярно-резцовый тип, отсутствие ожидаемого ответа на стандартную терапию)','destruction exceeds expectations given biofilm deposits; patterns suggesting rapid progression or early onset (e.g. molar/incisor pattern, lack of expected response to standard therapy)')},{k:SM,v:l('kuniga ≥10 sigaret','≥10 сигарет в день','≥10 cigarettes/day')},{k:DM,v:l('diabetda HbA1c ≥7,0%','HbA1c ≥7,0% при диабете','HbA1c ≥7.0% in diabetes')}]},
   ]},
  ],
  foot:l('Bosqich eng ko‘p zararlangan joydagi interdental CAL bo‘yicha aniqlanadi; CAL bo‘lmasa — rentgendagi suyak yo‘qotilishi bo‘yicha. Tarqalishi: lokal (<30% tishlar), generalizatsiyalangan yoki molyar-kesuvchi tish shakli. Dalil bo‘lmasa, B daraja qabul qilinadi va xavf omillariga qarab o‘zgartiriladi.',
   'Стадию определяют по межзубной CAL в участке наибольшей потери; при её отсутствии — по рентгенологической потере кости. Распространённость: локализованная (<30% зубов), генерализованная или молярно-резцовый тип. При отсутствии данных принимают степень B и корректируют её по факторам риска.',
   'Stage is set by interdental CAL at the site of greatest loss, or by radiographic bone loss if CAL is unavailable. Extent: localised (<30% of teeth), generalised, or molar/incisor pattern. Without evidence, assume grade B and modify it by risk factors.'),
  src:['Tonetti MS, Greenwell H, Kornman KS. Staging and grading of periodontitis: framework and proposal of a new classification and case definition. J Periodontol. 2018;89(Suppl 1):S159–S172.','Papapanou PN, Sanz M, et al. Periodontitis: Consensus report of workgroup 2 of the 2017 World Workshop. J Clin Periodontol. 2018;45(Suppl 20):S162–S170.']},

 {id:'aae',badge:'AAE',
  title:l('AAE endodontik tashxislari','Эндодонтические диагнозы AAE','AAE endodontic diagnoses'),
  sub:l('Pulpa va periapikal to‘qimalar holati','Состояние пульпы и периапикальных тканей','Pulpal and periapical diagnoses'),
  groups:[
   {head:l('Pulpa tashxislari','Диагнозы пульпы','Pulpal'),rows:[
    {code:'P1',tone:'soft',title:l('Normal pulpa','Нормальная пульпа','Normal pulp'),text:l('Simptom yo‘q, pulpa testlariga normal javob beradi.','Бессимптомна, нормально реагирует на тесты пульпы.','Symptom-free and normally responsive to pulp testing.')},
    {code:'P2',tone:'brand',title:l('Qaytar pulpit','Обратимый пульпит','Reversible pulpitis'),text:l('Yallig‘lanish bartaraf bo‘lishi kutiladi; sovuq yoki shirinlikdan og‘riq qo‘zg‘atuvchi olingach bir necha soniyada o‘tadi.','Воспаление должно разрешиться; боль от холодного или сладкого проходит через несколько секунд после устранения раздражителя.','Inflammation should resolve; discomfort to cold or sweets subsides within a few seconds of removing the stimulus.')},
    {code:'P3',tone:'red',title:l('Simptomli qaytmas pulpit','Симптоматический необратимый пульпит','Symptomatic irreversible pulpitis'),text:l('Vital, lekin tiklana olmaydigan pulpa: haroratdan uzoq davom etuvchi og‘riq, o‘z-o‘zidan va irradiatsiyalanuvchi og‘riq.','Витальная пульпа, неспособная к восстановлению: затяжная боль от температурных раздражителей, спонтанная и иррадиирующая боль.','Vital pulp incapable of healing: lingering thermal pain, spontaneous pain, referred pain.')},
    {code:'P4',tone:'amber',title:l('Simptomsiz qaytmas pulpit','Бессимптомный необратимый пульпит','Asymptomatic irreversible pulpitis'),text:l('Vital, tiklana olmaydigan pulpa, klinik simptomlarsiz; masalan, chuqur karies ochilishga olib kelishi kutilganda.','Витальная пульпа, неспособная к восстановлению, без клинических симптомов; например, глубокий кариес с ожидаемым вскрытием пульпы.','Vital pulp incapable of healing, without clinical symptoms; e.g. deep caries expected to cause exposure.')},
    {code:'P5',tone:'red',title:l('Pulpa nekrozi','Некроз пульпы','Pulp necrosis'),text:l('Pulpa nobud bo‘lgan; odatda pulpa testlariga javob bermaydi.','Гибель пульпы; обычно не реагирует на тесты.','Death of the pulp; usually non-responsive to pulp testing.')},
    {code:'P6',tone:'deep',title:l('Avval davolangan tish','Ранее леченный зуб','Previously treated'),text:l('Kanallar ilgari to‘ldirilgan (davolash materiali bilan obturatsiya).','Каналы ранее обтурированы.','Canals previously obturated.')},
    {code:'P7',tone:'deep',title:l('Avval boshlangan davolash','Ранее начатое лечение','Previously initiated therapy'),text:l('Qisman endodontik davolash (masalan, pulpotomiya yoki pulpektomiya) o‘tkazilgan.','Проведено частичное эндодонтическое лечение (например, пульпотомия или пульпэктомия).','Partial endodontic treatment performed (e.g. pulpotomy or pulpectomy).')},
   ]},
   {head:l('Periapikal tashxislar','Периапикальные диагнозы','Apical'),rows:[
    {code:'A1',tone:'soft',title:l('Normal apikal to‘qimalar','Нормальные апикальные ткани','Normal apical tissues'),text:l('Perkussiya va palpatsiyaga sezgir emas; lamina dura butun, periodontal yoriq bir xil.','Нет чувствительности к перкуссии и пальпации; кортикальная пластинка цела, периодонтальная щель равномерна.','Not sensitive to percussion or palpation; intact lamina dura and uniform PDL space.')},
    {code:'A2',tone:'amber',title:l('Simptomli apikal periodontit','Симптоматический апикальный периодонтит','Symptomatic apical periodontitis'),text:l('Tishlaganda, perkussiya yoki palpatsiyada og‘riq; rentgen o‘zgarishlari bo‘lishi ham, bo‘lmasligi ham mumkin.','Боль при накусывании, перкуссии или пальпации; рентгенологические изменения могут отсутствовать.','Pain on biting, percussion or palpation; radiographic changes may or may not be present.')},
    {code:'A3',tone:'amber',title:l('Simptomsiz apikal periodontit','Бессимптомный апикальный периодонтит','Asymptomatic apical periodontitis'),text:l('Pulpa sababli apikal destruksiya; rentgenda radiolyusentlik, klinik simptomlar yo‘q.','Деструкция апикального периодонта пульпарного происхождения; апикальное просветление без клинических симптомов.','Destruction of the apical periodontium of pulpal origin; apical radiolucency without clinical symptoms.')},
    {code:'A4',tone:'red',title:l('O‘tkir apikal absess','Острый апикальный абсцесс','Acute apical abscess'),text:l('Tez boshlanish, o‘z-o‘zidan og‘riq, bosganda sezgirlik, yiring va shish.','Быстрое начало, спонтанная боль, болезненность при надавливании, образование гноя и отёк.','Rapid onset, spontaneous pain, tenderness to pressure, pus formation and swelling.')},
    {code:'A5',tone:'amber',title:l('Surunkali apikal absess','Хронический апикальный абсцесс','Chronic apical abscess'),text:l('Asta boshlanish, noqulaylik kam yoki yo‘q, oqma yo‘l orqali vaqti-vaqti bilan yiring ajraladi.','Постепенное начало, минимальный дискомфорт или его отсутствие, периодическое отделение гноя через свищевой ход.','Gradual onset, little or no discomfort, intermittent discharge of pus through a sinus tract.')},
    {code:'A6',tone:'deep',title:l('Kondensatsiyalovchi osteit','Конденсирующий остеит','Condensing osteitis'),text:l('Past intensivli yallig‘lanishga suyakning javobi: odatda ildiz uchida diffuz radioopak o‘choq.','Реакция кости на слабый воспалительный стимул: диффузный рентгеноконтрастный очаг, обычно у верхушки.','Bony reaction to a low-grade inflammatory stimulus: a diffuse radiopaque lesion, usually at the apex.')},
   ]},
  ],
  src:['AAE Consensus Conference Recommended Diagnostic Terminology. J Endod. 2009;35(12):1634.','American Association of Endodontists. Glossary of Endodontic Terms. 10th ed. 2020.']},

 {id:'asa',badge:'ASA',
  title:l('ASA jismoniy holat tasnifi','Классификация физического статуса ASA','ASA physical status'),
  sub:l('Bemor umumiy holati, I–VI','Общее состояние пациента, I–VI','Patient physical status, I–VI'),
  groups:[{rows:[
   {code:'I',tone:'soft',title:l('Sog‘lom bemor','Здоровый пациент','Normal healthy patient'),text:l('Sog‘lom, chekmaydi, alkogolni iste’mol qilmaydi yoki juda kam.','Здоров, не курит, алкоголь не употребляет или минимально.','Healthy, non-smoking, no or minimal alcohol use.')},
   {code:'II',tone:'brand',title:l('Yengil tizimli kasallik','Лёгкое системное заболевание','Mild systemic disease'),text:l('Masalan: chekuvchi, homiladorlik, semizlik (30<TVI<40), yaxshi nazoratdagi qandli diabet yoki gipertoniya, yengil o‘pka kasalligi.','Например: курение, беременность, ожирение (30<ИМТ<40), контролируемые сахарный диабет или артериальная гипертензия, лёгкое заболевание лёгких.','E.g. current smoker, pregnancy, obesity (30<BMI<40), well-controlled diabetes or hypertension, mild lung disease.')},
   {code:'III',tone:'amber',title:l('Og‘ir tizimli kasallik','Тяжёлое системное заболевание','Severe systemic disease'),text:l('Masalan: yomon nazoratdagi diabet yoki gipertoniya, o‘pkaning surunkali obstruktiv kasalligi, TVI ≥40, faol gepatit, kardiostimulyator, muntazam dializ, 3 oydan oldin o‘tkazilgan miokard infarkti, insult, TIA yoki stentlash.','Например: неконтролируемые диабет или гипертензия, ХОБЛ, ИМТ ≥40, активный гепатит, кардиостимулятор, регулярный диализ, инфаркт миокарда, инсульт, ТИА или стентирование более 3 месяцев назад.','E.g. poorly controlled diabetes or hypertension, COPD, BMI ≥40, active hepatitis, pacemaker, regular dialysis, history (>3 months) of MI, stroke, TIA or coronary stents.')},
   {code:'IV',tone:'red',title:l('Hayot uchun doimiy xavfli og‘ir kasallik','Тяжёлое заболевание с постоянной угрозой жизни','Severe systemic disease that is a constant threat to life'),text:l('Masalan: oxirgi 3 oy ichidagi miokard infarkti, insult, TIA yoki stentlash; davom etayotgan ishemiya yoki og‘ir klapan disfunksiyasi; sepsis.','Например: инфаркт миокарда, инсульт, ТИА или стентирование менее 3 месяцев назад; продолжающаяся ишемия или тяжёлая клапанная дисфункция; сепсис.','E.g. recent (<3 months) MI, stroke, TIA or coronary stents; ongoing cardiac ischaemia or severe valve dysfunction; sepsis.')},
   {code:'V',tone:'red',title:l('O‘lim xavfi yuqori bemor','Умирающий пациент','Moribund patient'),text:l('Operatsiyasiz omon qolishi kutilmaydi (masalan, aorta anevrizmasi yorilishi, og‘ir politravma).','Не ожидается выживание без операции (например, разрыв аневризмы аорты, тяжёлая политравма).','Not expected to survive without the operation (e.g. ruptured aortic aneurysm, massive trauma).')},
   {code:'VI',tone:'deep',title:l('Miya o‘limi qayd etilgan donor','Донор с констатированной смертью мозга','Brain-dead organ donor'),text:l('Organlari donorlik uchun olinayotgan, miya o‘limi qayd etilgan bemor.','Пациент с констатированной смертью мозга, у которого изымают органы для донорства.','Declared brain-dead patient whose organs are being removed for donation.')},
  ]}],
  foot:l('Shoshilinch operatsiyada klassga “E” qo‘shiladi (masalan, III E). Stomatologik ma’nosi (Malamed): I–II — odatdagi davolash, II–III da stressni kamaytirish va zarur o‘zgartirishlar; IV — rejali davolash holat yaxshilanguncha qoldiriladi.',
   'При экстренном вмешательстве добавляется «E» (например, III E). Значение для стоматологии (Malamed): I–II — обычное лечение, при II–III — протокол снижения стресса и необходимые модификации; IV — плановое лечение откладывают до улучшения состояния.',
   'Add “E” for emergency surgery (e.g. III E). Dental relevance (Malamed): I–II routine care; II–III consider stress reduction and modifications; IV postpone elective care until the condition improves.'),
  src:['American Society of Anesthesiologists. ASA Physical Status Classification System. Last amended 13 Dec 2020.','Malamed SF. Medical Emergencies in the Dental Office. 7th ed. Elsevier; 2015.']},
];

/* ------------------------------------------------------------------ search */
const norm=(s:string)=>s.toLowerCase().replace(/[‘’'ʻʼ`´]/g,'').replace(/ё/g,'е');
const rowText=(r:Row,lang:Lang)=>norm([r.code,r.title[lang],r.text?.[lang]??'',...(r.facts??[]).flatMap(f=>[f.k[lang],f.v[lang]])].join(' '));

const T={
 uz:{search:'Qidirish: masalan, Kennedy, pulpit, ASA',clear:'Tozalash',none:'Hech narsa topilmadi.',found:(n:number)=>`${n} ta bo‘lim topildi`,src:'Manbalar',edu:'Klassik darslik ma’lumotlari; o‘quv maqsadida.'},
 ru:{search:'Поиск: например, Кеннеди, пульпит, ASA',clear:'Очистить',none:'Ничего не найдено.',found:(n:number)=>`Найдено разделов: ${n}`,src:'Источники',edu:'Стандартные учебные данные; для обучения.'},
 en:{search:'Search: e.g. Kennedy, pulpitis, ASA',clear:'Clear',none:'Nothing found.',found:(n:number)=>`${n} section${n===1?'':'s'} found`,src:'Sources',edu:'Standard textbook material, for education.'},
};

function RowView({r,lang}:{r:Row;lang:Lang}){
 return <li className={'tl-row'+(r.tone?' tl-row-'+r.tone:'')}>
  {r.fig?<span className="tl-row-fig">{r.fig}<span className="tl-code tl-code-sm">{r.code}</span></span>:<span className="tl-code">{r.code}</span>}
  <div className="tl-row-body">
   <strong>{r.title[lang]}</strong>
   {r.text&&<p>{r.text[lang]}</p>}
   {r.facts&&<dl className="tl-kv tl-kv-tight">{r.facts.map(f=><div key={f.k.en}><dt>{f.k[lang]}</dt><dd>{f.v[lang]}</dd></div>)}</dl>}
  </div>
 </li>;
}

export default function Reference({lang}:ToolProps){
 const t=T[lang];
 const sid=useId();
 const [q,setQ]=useState('');
 const [open,setOpen]=useState<string|null>(null);
 const nq=norm(q.trim());
 const view=useMemo(()=>CARDS.map(c=>{
  if(!nq)return {c,groups:c.groups,hit:false};
  const head=norm([c.badge,c.title[lang],c.sub[lang],c.title.en].join(' ')).includes(nq);
  if(head)return {c,groups:c.groups,hit:true};
  const groups=c.groups.map(g=>({...g,rows:g.rows.filter(r=>rowText(r,lang).includes(nq))})).filter(g=>g.rows.length);
  return groups.length?{c,groups,hit:true}:null;
 }).filter((x):x is {c:Card;groups:Group[];hit:boolean}=>x!==null),[nq,lang]);

 return <div className="tl-stack">
  <div className="tl-search">
   <Search size={18} aria-hidden="true"/>
   <input id={sid} type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} aria-label={t.search} autoComplete="off" enterKeyHint="search"/>
   {q&&<button type="button" className="tl-search-x" onClick={()=>setQ('')} aria-label={t.clear}><X size={18}/></button>}
  </div>
  {nq&&<p className="tl-muted tl-small" aria-live="polite">{view.length?t.found(view.length):t.none}</p>}
  <p className="tl-muted tl-small">{t.edu}</p>

  <div className="tl-refs">
   {view.map(({c,groups,hit})=>{
    const isOpen=hit||open===c.id,pid=`${sid}-${c.id}`;
    return <section key={c.id} className={'tl-ref'+(isOpen?' tl-ref-open':'')}>
     <button type="button" className="tl-ref-head" aria-expanded={isOpen} aria-controls={pid} onClick={()=>{if(hit)return;setOpen(isOpen?null:c.id)}}>
      <span className="tl-ref-badge">{c.badge}</span>
      <span className="tl-ref-text"><strong>{c.title[lang]}</strong><small>{c.sub[lang]}</small></span>
      {!hit&&<ChevronDown size={18} className="tl-ref-chev" aria-hidden="true"/>}
     </button>
     {isOpen&&<div className="tl-ref-body" id={pid}>
      {c.fig&&!nq&&c.fig(lang)}
      {groups.map((g,i)=><div key={i} className="tl-group">
       {g.head&&<h4 className="tl-h4">{g.head[lang]}</h4>}
       <ul className="tl-rows">{g.rows.map(r=><RowView key={r.code} r={r} lang={lang}/>)}</ul>
      </div>)}
      {c.extra&&!nq&&c.extra(lang)}
      {c.foot&&<p className="tl-foot-note">{c.foot[lang]}</p>}
      <Sources label={t.src} items={c.src}/>
     </div>}
    </section>;
   })}
  </div>
 </div>;
}
