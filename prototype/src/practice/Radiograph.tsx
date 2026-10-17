import {useId,useState,type ReactNode} from 'react';
import {type SimProps,Options,Figure,rnd,rint,pick,sample,shuffle,smoothOpen,smoothClosed,r1} from './shared';

type F='prox'|'second'|'pa'|'rct'|'implant'|'impact'|'boneloss'|'calc';
const FINDINGS:F[]=['prox','second','pa','rct','implant','impact','boneloss','calc'];

const T={
 uz:{
  q:'Rentgenogrammadagi asosiy topilma qaysi?',
  badge:'Sxematik tasvir, haqiqiy rentgen emas',
  lower:'Pastki jag‘, chaynov tishlari sohasi',upper:'Yuqori jag‘, chaynov tishlari sohasi',
  title:'Sxematik periapikal rentgenogramma',
  key:'Oq — radioopak (emal, plomba, metall); qora — radiolyusent (pulpa, karies, yallig‘lanish o‘chog‘i).',
  f:{
   prox:'Aproksimal (kontakt yuzasi) kariesi',second:'Plomba ostidagi ikkilamchi karies',pa:'Periapikal radiolyusent o‘choq',rct:'Ildiz kanali plombasi',
   implant:'Dental implant',impact:'Retensiyalangan uchinchi molyar',boneloss:'Gorizontal suyak yo‘qotilishi',calc:'Tish toshi (shpora)'
  },
  e:{
   prox:'Kontakt nuqtasi ostida emaldan dentinga kirib borgan uchburchak shaklidagi qora (radiolyusent) soha aproksimal kariesga xos.',
   second:'Oq (radioopak) plombaning tubi va chetida ko‘rinadigan qora soha plomba ostidagi ikkilamchi (qaytalanuvchi) kariesni bildiradi.',
   pa:'Ildiz cho‘qqisi atrofidagi yumaloq qora o‘choq va lamina duraning uzilishi periapikal radiolyusentlikdir (granulema, kista yoki absess).',
   rct:'Ildiz kanallari bo‘ylab cho‘qqigacha yetgan oq (radioopak) chiziqlar kanal plombasi, ya’ni endodontik davolangan tishni ko‘rsatadi.',
   implant:'Suyak ichidagi rezbali, butunlay oq vint va uning atrofida periodontal yoriq yo‘qligi dental implantga xos.',
   impact:'Ikkinchi molyar tomon qiyshaygan va okklyuzion tekislikdan pastda suyak ichida qolgan tish retensiyalangan (mezioangulyar) uchinchi molyardir.',
   boneloss:'Alveolyar suyak qirrasi barcha tishlarda emal-sement chegarasidan bir tekis va ancha pastda joylashgan — bu gorizontal suyak yo‘qotilishi.',
   calc:'Emal-sement chegarasi ostida ildizning proksimal yuzasidagi kichik oq tikansimon o‘simta tish toshi shporasidir.'
  }
 },
 ru:{
  q:'Какая основная находка на рентгенограмме?',
  badge:'Схематичное изображение, не настоящий снимок',
  lower:'Нижняя челюсть, область жевательных зубов',upper:'Верхняя челюсть, область жевательных зубов',
  title:'Схематичная периапикальная рентгенограмма',
  key:'Белое — рентгеноконтрастное (эмаль, пломба, металл); тёмное — рентгенопрозрачное (пульпа, кариес, очаг воспаления).',
  f:{
   prox:'Кариес контактной (аппроксимальной) поверхности',second:'Вторичный кариес под пломбой',pa:'Периапикальное просветление',rct:'Пломбированный корневой канал',
   implant:'Дентальный имплантат',impact:'Ретинированный третий моляр',boneloss:'Горизонтальная резорбция кости',calc:'Зубной камень («шпора»)'
  },
  e:{
   prox:'Треугольное тёмное (рентгенопрозрачное) пятно под контактным пунктом, проникающее из эмали в дентин, типично для аппроксимального кариеса.',
   second:'Тёмная зона у дна и края белой (рентгеноконтрастной) пломбы указывает на вторичный (рецидивный) кариес.',
   pa:'Округлый тёмный очаг у верхушки корня с прерыванием lamina dura — периапикальное просветление (гранулёма, киста или абсцесс).',
   rct:'Белые рентгеноконтрастные линии по ходу каналов до верхушки — корневая пломба, то есть эндодонтически леченый зуб.',
   implant:'Резьбовой полностью белый винт в кости без периодонтальной щели вокруг характерен для дентального имплантата.',
   impact:'Зуб, наклонённый к второму моляру и находящийся в кости ниже окклюзионной плоскости, — ретинированный (мезиоангулярный) третий моляр.',
   boneloss:'Гребень альвеолярной кости у всех зубов равномерно и значительно ниже эмалево-цементной границы — горизонтальная резорбция кости.',
   calc:'Небольшой белый шиповидный выступ на апроксимальной поверхности корня ниже эмалево-цементной границы — «шпора» зубного камня.'
  }
 },
 en:{
  q:'What is the main finding on this radiograph?',
  badge:'Schematic image, not a real radiograph',
  lower:'Lower jaw, posterior region',upper:'Upper jaw, posterior region',
  title:'Schematic periapical radiograph',
  key:'White = radiopaque (enamel, restorations, metal); dark = radiolucent (pulp, caries, inflammatory lesions).',
  f:{
   prox:'Interproximal caries',second:'Secondary caries under a restoration',pa:'Periapical radiolucency',rct:'Root canal filling',
   implant:'Dental implant',impact:'Impacted third molar',boneloss:'Horizontal bone loss',calc:'Calculus spur'
  },
  e:{
   prox:'A triangular dark (radiolucent) area just below the contact point, spreading from enamel into dentin, is typical of interproximal caries.',
   second:'A dark zone along the floor or margin of a white (radiopaque) restoration indicates secondary (recurrent) caries.',
   pa:'A round dark area around the root apex with a break in the lamina dura is a periapical radiolucency (granuloma, cyst or abscess).',
   rct:'White radiopaque lines filling the canals to the apex are a root canal filling, i.e. an endodontically treated tooth.',
   implant:'A threaded, fully radiopaque screw in bone with no periodontal ligament space around it is a dental implant.',
   impact:'A tooth tilted towards the second molar and trapped in bone below the occlusal plane is an impacted (mesioangular) third molar.',
   boneloss:'The alveolar crest lies evenly and well apical to the cemento-enamel junction on all teeth: horizontal bone loss.',
   calc:'A small white spur-like projection on the proximal root surface just below the cemento-enamel junction is a calculus spur.'
  }
 }
};

/* ---------- tooth geometry ---------- */
type Kind='pm'|'m';
type Tooth={cx:number;kind:Kind;w:number;ch:number;cw:number;Y:number;rl:number;curve:number;rot:number};
type Pt=[number,number];
const mv=(pts:Pt[],dx:number):Pt[]=>pts.map(([x,y])=>[x+dx,y]);

function crownPts(kind:Kind,w:number,ch:number,cw:number,Y:number):Pt[]{
 const top=Y-ch,fos=kind==='m'?6.5:5,cusp=kind==='m'?0.25:0.2;
 return [[-cw/2,Y],[-w/2+1.2,Y-ch*0.4],[-w/2+2.6,Y-ch*0.74],[-w*0.4,top+3],[-w*cusp,top],[-w*0.06,top+fos-1],[0,top+fos],[w*0.06,top+fos-1],[w*cusp,top+0.6],[w*0.4,top+3.2],[w/2-2.6,Y-ch*0.74],[w/2-1.2,Y-ch*0.4],[cw/2,Y]];
}
function rootPts(t:Tooth):Pt[]{
 const {cw,Y,rl,curve:c}=t;
 if(t.kind==='pm')return [[cw/2,Y],[cw*0.42,Y+rl*0.4],[cw*0.2+c,Y+rl*0.9],[c,Y+rl],[-cw*0.2+c,Y+rl*0.9],[-cw*0.42,Y+rl*0.4],[-cw/2,Y]];
 return [[cw/2,Y],[cw/2-1.5,Y+rl*0.36],[cw*0.34+c,Y+rl*0.88],[cw*0.25+c,Y+rl*0.98],[cw*0.13+c*0.7,Y+rl*0.88],[cw*0.1,Y+rl*0.45],[0,Y+rl*0.27],[-cw*0.1,Y+rl*0.45],[-cw*0.13+c*0.7,Y+rl*0.92],[-cw*0.25+c,Y+rl*1.02],[-cw*0.36+c,Y+rl*0.92],[-cw/2+1.5,Y+rl*0.36],[-cw/2,Y]];
}
function apices(t:Tooth):Pt[]{
 const {cx,cw,Y,rl,curve:c}=t;
 return t.kind==='pm'?[[cx+c,Y+rl]]:[[cx-cw*0.25+c,Y+rl*1.02],[cx+cw*0.25+c,Y+rl*0.98]];
}
function canals(t:Tooth):string{
 const {cx,cw,Y,rl,curve:c}=t;
 if(t.kind==='pm')return `M${r1(cx)} ${r1(Y+6)}Q${r1(cx+c*0.3)} ${r1(Y+rl*0.55)} ${r1(cx+c)} ${r1(Y+rl-2.5)}`;
 return `M${r1(cx-cw*0.17)} ${r1(Y+4)}Q${r1(cx-cw*0.2+c*0.4)} ${r1(Y+rl*0.55)} ${r1(cx-cw*0.25+c)} ${r1(Y+rl*1.02-2.5)}M${r1(cx+cw*0.17)} ${r1(Y+4)}Q${r1(cx+cw*0.2+c*0.4)} ${r1(Y+rl*0.55)} ${r1(cx+cw*0.25+c)} ${r1(Y+rl*0.98-2.5)}`;
}
function chamber(t:Tooth):string{
 const {cx,cw,Y,ch}=t;
 const p:Pt[]=t.kind==='pm'
  ?[[-cw*0.2,Y+3],[-cw*0.17,Y-ch*0.4],[0,Y-ch*0.28],[cw*0.17,Y-ch*0.4],[cw*0.2,Y+3],[cw*0.07,Y+11],[-cw*0.07,Y+11]]
  :[[-cw*0.27,Y+2],[-cw*0.26,Y-ch*0.4],[-cw*0.12,Y-ch*0.27],[cw*0.12,Y-ch*0.27],[cw*0.26,Y-ch*0.4],[cw*0.27,Y+2],[cw*0.1,Y+7],[-cw*0.1,Y+7]];
 return smoothClosed(mv(p,cx));
}
const enamelPath=(t:Tooth,grow=0)=>smoothOpen(mv(crownPts(t.kind,t.w+grow,t.ch+grow*0.5,t.cw+grow*0.6,t.Y),t.cx))+'Z';
const dentinPath=(t:Tooth)=>smoothOpen(mv([...crownPts(t.kind,t.w-8.5,t.ch-6.5,t.cw,t.Y).slice(0,-1),...rootPts(t)],t.cx))+'Z';
const rootOpen=(t:Tooth)=>smoothOpen(mv(rootPts(t),t.cx));

/** Restoration shapes (absolute coords). */
function restoPath(t:Tooth,type:'O'|'MO'|'DO'|'deep'):string{
 const {cx,w,ch,Y}=t,top=Y-ch;
 if(type==='O')return smoothClosed(mv([[-w*0.22,top+1.8],[-w*0.18,Y-ch*0.55],[0,Y-ch*0.5],[w*0.18,Y-ch*0.55],[w*0.22,top+1.8],[0,top+5]],cx));
 if(type==='deep')return smoothClosed(mv([[-w*0.26,top+2],[-w*0.22,Y-ch*0.3],[0,Y-ch*0.2],[w*0.22,Y-ch*0.3],[w*0.26,top+2],[0,top+5]],cx));
 const s=type==='DO'?1:-1;
 const p:Pt[]=[[-w*0.2,top+2.5],[-w*0.15,Y-ch*0.52],[w*0.12,Y-ch*0.56],[w*0.22,Y-ch*0.26],[w*0.5-1.4,Y-ch*0.24],[w*0.5-1.6,Y-ch*0.68],[w*0.3,top+2.2],[0,top+5]];
 return smoothClosed(p.map(([x,y])=>[cx+s*x,y]));
}

type Scene={teeth:Tooth[];finding:F;crestOff:number;maxilla:boolean;resto:{i:number;type:'O'|'MO'|'DO'|'deep'}[];
 prox?:{i:number;side:number};second?:{i:number;side:number};pa?:{i:number;r:number;which:number[]};rct?:{i:number;crown:boolean};
 implant?:{i:number;len:number};impact?:{i:number;rot:number};calc?:{i:number;side:number}[]};

function makeTooth(kind:Kind,cx:number,top:number):Tooth{
 const w=kind==='m'?rnd(57,63):rnd(39,43),ch=kind==='m'?rnd(35,39):rnd(36,40);
 return {cx,kind,w,ch,cw:w*(kind==='m'?0.8:0.7),Y:top+ch,rl:kind==='m'?rnd(90,100):rnd(98,108),curve:rnd(-1.5,4),rot:rnd(-2.5,2.5)};
}
function buildScene():Scene{
 const finding=pick(FINDINGS);
 const kinds:Kind[]=finding==='impact'?['pm','m','m']:['pm','pm','m','m'];
 const top=rnd(30,36);
 const teeth:Tooth[]=[];
 let x=finding==='impact'?rnd(22,30):rnd(44,62);
 for(const k of kinds){const t=makeTooth(k,0,top);t.cx=x+t.w/2;x+=t.w+0.6;teeth.push(t)}
 const s:Scene={teeth,finding,crestOff:rnd(4,6.5),maxilla:Math.random()<0.3,resto:[]};
 const n=teeth.length;
 const other=(ex:number[])=>pick(teeth.map((_,i)=>i).filter(i=>!ex.includes(i)));
 if(finding==='prox'){const i=rint(1,n-2);s.prox={i,side:pick([-1,1])}}
 if(finding==='second'){const i=rint(1,n-1);const side=pick([-1,1]);s.second={i,side};s.resto.push({i,type:side>0?'DO':'MO'})}
 if(finding==='pa'){const i=rint(1,n-1);s.pa={i,r:rnd(11,15),which:teeth[i].kind==='m'?pick([[0],[1],[0,1]]):[0]};s.resto.push({i,type:'deep'})}
 if(finding==='rct'){const i=rint(1,n-1);s.rct={i,crown:Math.random()<0.6};if(!s.rct.crown)s.resto.push({i,type:'deep'})}
 if(finding==='implant'){s.implant={i:2,len:rnd(66,76)}}
 if(finding==='impact'){
  const m2=teeth[n-1],m3=makeTooth('m',0,top);m3.rl*=0.5;m3.curve=rnd(2,5);
  const rot=-rnd(36,48);
  m3.cx=m2.cx+m2.w/2+m3.w*0.5+2;m3.Y=m2.Y+30+m3.ch/2;
  teeth.push(m3);s.impact={i:n,rot};
 }
 if(finding==='boneloss')s.crestOff=rnd(0.36,0.46)*teeth[0].rl;
 if(finding==='calc'){const i=rint(0,n-1);s.calc=[{i,side:pick([-1,1])}];if(Math.random()<0.5){const j=other([i]);s.calc.push({i:j,side:pick([-1,1])})};s.crestOff=rnd(9,12)}
 // unrelated noise: a sound occlusal filling elsewhere
 const busy=[s.prox?.i,s.second?.i,s.pa?.i,s.rct?.i,s.implant?.i,s.impact?.i].filter((v):v is number=>v!==undefined);
 if(finding!=='second'&&Math.random()<0.45){const i=other(busy);if(finding!=='implant'||i!==2)s.resto.push({i,type:pick(['O','MO','DO'] as const)})}
 return s;
}

function implantPath(cx:number,top:number,len:number):string{
 const hw=12,pitch=5.2,dep=2.4;const L:Pt[]=[],R:Pt[]=[];
 const steps=Math.floor((len-10)/pitch);
 for(let k=0;k<=steps;k++){const y=top+4+k*pitch,taper=hw-(k/steps)*3.5;L.push([cx-taper,y],[cx-taper-dep,y+pitch/2]);R.push([cx+taper,y],[cx+taper+dep,y+pitch/2])}
 const by=top+len;
 let d=`M${r1(cx-hw)} ${r1(top)}`;for(const [x,y] of L)d+=`L${r1(x)} ${r1(y)}`;
 d+=`L${r1(cx-hw+3.5)} ${r1(by-5)}Q${r1(cx)} ${r1(by+3)} ${r1(cx+hw-3.5)} ${r1(by-5)}`;
 for(const [x,y] of [...R].reverse())d+=`L${r1(x)} ${r1(y)}`;
 return d+`L${r1(cx+hw)} ${r1(top)}Z`;
}

function Xray({s,title}:{s:Scene;title:string}){
 const id=useId().replace(/:/g,'');
 const W=320,H=230;
 const {teeth}=s;
 const Y=teeth[0].Y,crest=Y+s.crestOff;
 // bone outline: crest dips slightly over each root, peaks between teeth
 const bonePts:Pt[]=[[-10,crest+2]];
 teeth.slice(0,s.impact?teeth.length-1:teeth.length).forEach((t,i,arr)=>{bonePts.push([t.cx,crest+3.5]);const nx=arr[i+1];bonePts.push([nx?(t.cx+t.w/2+0.3):t.cx+t.w/2+14,crest-(nx?1:-1)])});
 if(s.impact)bonePts.push([teeth[teeth.length-1].cx,Y-6]);
 bonePts.push([W+10,s.impact?Y-12:crest+2]);
 const bone=smoothOpen(bonePts)+`L${W+10} ${H+10}L-10 ${H+10}Z`;
 const draw=(t:Tooth,i:number):ReactNode=>{
  if(s.implant?.i===i){
   const top=crest-1.5,abY=t.Y-t.ch*0.25;
   return <g key={i}>
    <rect x={t.cx-7} y={abY} width={14} height={top-abY+2} fill="#e9eef0"/>
    <path d={implantPath(t.cx,top,s.implant.len)} fill="#f7fafb"/>
    <path d={enamelPath(t,0.5)} fill="#f2f6f7"/>
    <path d={enamelPath({...t,w:t.w-6,ch:t.ch-6,cw:t.cw-4})} fill="#ffffff"/>
   </g>;
  }
  const rot=s.impact?.i===i?s.impact.rot:t.rot;
  const pivot=`${r1(t.cx)} ${r1(t.Y-t.ch/2)}`;
  const isRct=s.rct?.i===i;
  return <g key={i} transform={`rotate(${r1(rot)} ${pivot})`}>
   {s.impact?.i===i&&<path d={enamelPath(t,7)} fill="#20272b"/>}
   <g clipPath={`url(#${id}bone)`}>
    <path d={rootOpen(t)} fill="none" stroke="#c5ccd0" strokeWidth={7.5} opacity={0.85}/>
    <path d={rootOpen(t)} fill="none" stroke="#262d31" strokeWidth={4.4}/>
   </g>
   {s.pa?.i===i&&s.pa.which.map(k=>{const [ax,ay]=apices(t)[k]??apices(t)[0];return <ellipse key={k} cx={ax} cy={ay+2} rx={s.pa!.r} ry={s.pa!.r*0.85} fill="#171d21" filter={`url(#${id}soft)`}/>})}
   <path d={enamelPath(t)} fill="#e9eef0"/>
   <path d={dentinPath(t)} fill="#a3acb2"/>
   <path d={chamber(t)} fill={isRct?'#f4f7f8':'#2a3236'}/>
   <path d={canals(t)} fill="none" stroke={isRct?'#f6f9fa':'#2a3236'} strokeWidth={isRct?3.4:2.6} strokeLinecap="round"/>
   {s.resto.filter(r=>r.i===i).map((r,k)=><path key={k} d={restoPath(t,r.type)} fill="#fbfdfe"/>)}
   {isRct&&s.rct!.crown&&<path d={enamelPath(t,1.2)} fill="#f8fbfc"/>}
   {s.second?.i===i&&(()=>{const {cx,w,ch,Y:yy}=t,sd=s.second.side;
    const p:Pt[]=[[sd*w*0.14,yy-ch*0.58],[sd*w*0.24,yy-ch*0.3],[sd*(w*0.5-3),yy-ch*0.2],[sd*(w*0.5-4),yy-ch*0.1],[sd*w*0.2,yy-ch*0.14],[sd*w*0.06,yy-ch*0.44]];
    return <path d={smoothClosed(p.map(([x,y])=>[cx+x,y]))} fill="#1c2226" opacity={0.93} filter={`url(#${id}soft2)`}/>})()}
   {s.prox?.i===i&&(()=>{const {cx,w,ch,Y:yy}=t,sd=s.prox.side,sx=cx+sd*(w/2-1.6),cy=yy-ch*0.6;
    const p:Pt[]=[[sx+sd*1.5,cy-7],[sx-sd*7,cy-2],[sx-sd*13.5,cy+1.5],[sx-sd*6.5,cy+4.5],[sx+sd*1.5,cy+8]];
    return <path d={smoothClosed(p)} fill="#1a2024" opacity={0.95} filter={`url(#${id}soft2)`}/>})()}
   {s.calc?.filter(c=>c.i===i).map((c,k)=>{const sx=t.cx+c.side*(t.cw/2-0.4),y0=t.Y+1.5;
    return <path key={k} d={`M${r1(sx)} ${r1(y0)}L${r1(sx+c.side*5)} ${r1(y0+3.5)}L${r1(sx+c.side*2.2)} ${r1(y0+5)}L${r1(sx+c.side*4.4)} ${r1(y0+7.5)}L${r1(sx)} ${r1(y0+10)}Z`} fill="#eef3f5"/>})}
  </g>;
 };
 return <svg className="pr-svg pr-xray" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
  <defs>
   <filter id={`${id}tex`} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.075 0.11" numOctaves={3} seed={rint(1,99)}/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.07  0 0 0 0 0.08  -3 0 0 0 1.75"/>
    <feComposite in2="SourceGraphic" operator="in"/>
   </filter>
   <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={7}/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.5 0 0 0 -0.18"/>
    <feComposite in2="SourceGraphic" operator="in"/>
   </filter>
   <filter id={`${id}soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3}/></filter>
   <filter id={`${id}soft2`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={0.9}/></filter>
   <filter id={`${id}xr`}><feGaussianBlur stdDeviation={0.45}/></filter>
   <linearGradient id={`${id}soft3`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2226" stopOpacity={0}/><stop offset="0.12" stopColor="#1b2226" stopOpacity={1}/></linearGradient>
   <clipPath id={`${id}bone`}><path d={bone}/></clipPath>
   <radialGradient id={`${id}vig`} cx="50%" cy="50%" r="70%"><stop offset="60%" stopColor="#000" stopOpacity={0}/><stop offset="100%" stopColor="#000" stopOpacity={0.55}/></radialGradient>
  </defs>
  <rect width={W} height={H} rx={14} fill="#0b0f12"/>
  <g filter={`url(#${id}xr)`} transform={s.maxilla?`translate(0 ${H}) scale(1 -1)`:undefined}>
   <rect x={0} y={Y-34} width={W} height={H} fill={`url(#${id}soft3)`}/>
   <path d={bone} fill="#69737a"/>
   <path d={bone} fill="#000" filter={`url(#${id}tex)`}/>
   {!s.maxilla&&<g opacity={0.9}><path d={`M-10 ${H-14}Q${W/2} ${H-24} ${W+10} ${H-12}`} stroke="#2a3236" strokeWidth={13} fill="none"/><path d={`M-10 ${H-21}Q${W/2} ${H-31} ${W+10} ${H-19}`} stroke="#8d969c" strokeWidth={1.3} fill="none"/><path d={`M-10 ${H-7}Q${W/2} ${H-17} ${W+10} ${H-5}`} stroke="#8d969c" strokeWidth={1.3} fill="none"/></g>}
   {teeth.map(draw)}
  </g>
  <rect width={W} height={H} fill="#fff" filter={`url(#${id}grain)`} opacity={0.6}/>
  <rect width={W} height={H} rx={14} fill={`url(#${id}vig)`}/>
  <circle cx={16} cy={16} r={4.5} fill="none" stroke="#9aa5ab" strokeWidth={1.4} opacity={0.7}/>
 </svg>;
}

export default function Radiograph({lang,locked,onAnswer}:SimProps){
 const t=T[lang];
 const [c]=useState(()=>{const s=buildScene();return {s,opts:shuffle([s.finding,...sample(FINDINGS,3,[s.finding])])}});
 const [picked,setPicked]=useState<string|null>(null);
 const answer=(id:string)=>{if(locked)return;setPicked(id);onAnswer(id===c.s.finding,t.e[c.s.finding])};
 return <div className="pr-case">
  <p className="pr-q">{t.q}</p>
  <Figure dark badge={t.badge} caption={<>{c.s.maxilla?t.upper:t.lower}<br/><span className="pr-fig-key">{t.key}</span></>}>
   <Xray s={c.s} title={t.title}/>
  </Figure>
  <Options cols={1} options={c.opts.map(f=>({id:f,label:t.f[f]}))} correct={c.s.finding} picked={picked} locked={locked} onPick={answer}/>
 </div>;
}
