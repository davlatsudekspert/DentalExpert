import {useMemo,useState} from 'react';
import {type SimProps,type ArchTooth,archLayout,Arches,occPath,occDetail,Stepper,CheckButton,Figure,rint,shuffle,r1} from './shared';

type St='h'|'d'|'f'|'m'|'fd';
const C={d:'#c0392b',f:'#3d6f9e',m:'#8aa1a6'};

const T={
 uz:{
  q:'Tishlarni sanang: K, P va U, so‘ng KPU indeksini kiriting.',
  note:'28 ta doimiy tish; uchinchi molyarlar (18, 28, 38, 48) hisobga olinmaydi.',
  upper:'Yuqori jag‘',lower:'Pastki jag‘',title:'Odontogramma',
  right:'Bemorning o‘ngi',left:'Bemorning chapi',
  lg:{h:'Sog‘lom',d:'K — karies',f:'P — plomba',m:'U — karies sababli olib tashlangan',fd:'Plomba + yangi karies'},
  D:'K',F:'P',M:'U',Dn:'karies',Fn:'plomba',Mn:'olib tashlangan',
  idx:'KPU indeksi',idxPh:'0–28',
  explain:(d:number,f:number,m:number,fd:number)=>`KPU = K + P + U = ${d} + ${f} + ${m} = ${d+f+m}; har bir tish faqat bir marta sanaladi${fd?`, shuning uchun plomba ustida yangi karies bo‘lgan ${fd} ta tish P emas, K deb hisoblandi`:', plomba ustida yangi karies bo‘lsa, u tish K deb hisoblanadi'}.`
 },
 ru:{
  q:'Посчитайте зубы К, П и У, затем введите индекс КПУ.',
  note:'28 постоянных зубов; третьи моляры (18, 28, 38, 48) не учитываются.',
  upper:'Верхняя челюсть',lower:'Нижняя челюсть',title:'Одонтограмма',
  right:'Справа у пациента',left:'Слева у пациента',
  lg:{h:'Интактный',d:'К — кариес',f:'П — пломба',m:'У — удалён по поводу кариеса',fd:'Пломба + новый кариес'},
  D:'К',F:'П',M:'У',Dn:'кариес',Fn:'пломба',Mn:'удалён',
  idx:'Индекс КПУ',idxPh:'0–28',
  explain:(d:number,f:number,m:number,fd:number)=>`КПУ = К + П + У = ${d} + ${f} + ${m} = ${d+f+m}; каждый зуб учитывается только один раз${fd?(fd===1?', поэтому пломбированный зуб с новым кариесом посчитан как К, а не П':`, поэтому ${fd} пломбированных зуба с новым кариесом посчитаны как К, а не П`):', и пломбированный зуб с новым кариесом считается как К'}.`
 },
 en:{
  q:'Count the D, F and M teeth, then enter the DMFT index.',
  note:'28 permanent teeth; third molars (18, 28, 38, 48) are excluded.',
  upper:'Upper jaw',lower:'Lower jaw',title:'Odontogram',
  right:'Patient’s right',left:'Patient’s left',
  lg:{h:'Sound',d:'D — decayed',f:'F — filled',m:'M — missing due to caries',fd:'Filling + new caries'},
  D:'D',F:'F',M:'M',Dn:'decayed',Fn:'filled',Mn:'missing',
  idx:'DMFT index',idxPh:'0–28',
  explain:(d:number,f:number,m:number,fd:number)=>`DMFT = D + M + F = ${d} + ${m} + ${f} = ${d+f+m}; each tooth counts only once${fd?(fd===1?', so the filled tooth with new caries counts as D, not F':`, so the ${fd} filled teeth with new caries count as D, not F`):', and a filled tooth with new caries counts as D'}.`
 }
};

/** One tooth glyph in its status (local occlusal coordinates). */
export function DmftGlyph({kind,w,d,st}:{kind:ArchTooth['kind'];w:number;d:number;st:St}){
 const path=occPath(kind,w,d);
 if(st==='m')return <>
  <path d={path} fill="#f3f7f7" stroke={C.m} strokeWidth={1.3} strokeDasharray="3 2.5"/>
  <path d={`M${r1(-w*0.28)} ${r1(-d*0.28)}L${r1(w*0.28)} ${r1(d*0.28)}M${r1(w*0.28)} ${r1(-d*0.28)}L${r1(-w*0.28)} ${r1(d*0.28)}`} stroke={C.m} strokeWidth={1.8} strokeLinecap="round"/>
 </>;
 const fillPatch=<path d={occPath(kind==='inc'?'inc':'pm',w*0.56,d*0.5)} fill={C.f}/>;
 const lesion=(x:number,y:number,s:number)=><><ellipse cx={x} cy={y} rx={s*1.5} ry={s*1.25} fill="#e8a59a" opacity={0.9}/><ellipse cx={x} cy={y} rx={s} ry={s*0.8} fill="#4a2214"/></>;
 return <>
  <path d={path} fill={st==='h'?'#ffffff':st==='f'?'#eef4fa':'#fdeeed'} stroke={st==='h'?'#9fb6bb':st==='f'?C.f:C.d} strokeWidth={st==='h'?1.2:1.7}/>
  {st!=='f'&&<path d={occDetail(kind,w,d)} fill="none" stroke="#c9d8da" strokeWidth={1.1} strokeLinecap="round"/>}
  {st==='f'&&fillPatch}
  {st==='d'&&lesion(w*0.05,d*0.05,Math.min(w,d)*0.17)}
  {st==='fd'&&<>{fillPatch}{lesion(w*0.3,-d*0.08,Math.min(w,d)*0.14)}</>}
 </>;
}

export default function Dmft({lang,locked,onAnswer}:SimProps){
 const t=T[lang];
 const layout=useMemo(()=>archLayout(false,false),[]);
 const [c]=useState(()=>{
  const st:Record<number,St>={};
  for(const tt of layout.teeth)st[tt.num]='h';
  let nd=rint(0,5),nf=rint(0,5);const nm=rint(0,3),nfd=Math.random()<0.55?rint(1,2):0;
  if(nd+nf+nm+nfd===0)nd=2;
  if(nd+nf+nm+nfd<3)nf+=rint(1,3);
  // extractions mostly hit molars/premolars; caries and fillings anywhere, posterior more often
  const post=shuffle(layout.teeth.filter(x=>x.p>=4).map(x=>x.num));
  const placed=new Set<number>();
  for(const n of post.slice(0,nm)){st[n]='m';placed.add(n)}
  const weighted=shuffle(layout.teeth.flatMap(x=>x.p>=4?[x.num,x.num,x.num]:[x.num]));
  const take=(k:number,s:St)=>{let i=0;for(const n of weighted){if(i>=k)break;if(placed.has(n))continue;st[n]=s;placed.add(n);i++}};
  take(nfd,'fd');take(nd,'d');take(nf,'f');
  const D=nd+nfd,F=nf,M=nm;
  return {st,D,F,M,fd:nfd};
 });
 const [v,setV]=useState({D:0,F:0,M:0});
 const [idx,setIdx]=useState('');
 const [checked,setChecked]=useState(false);
 const idxNum=idx===''?NaN:Number(idx);
 const ok={D:v.D===c.D,F:v.F===c.F,M:v.M===c.M,I:idxNum===c.D+c.F+c.M};
 const check=()=>{if(locked)return;setChecked(true);onAnswer(ok.D&&ok.F&&ok.M&&ok.I,t.explain(c.D,c.F,c.M,c.fd))};
 const s=(k:'D'|'F'|'M')=>checked?(ok[k]?'ok':'bad'):undefined;

 return <div className="pr-case">
  <p className="pr-q">{t.q}</p>
  <Figure caption={t.note}>
   <div className="pr-sides" aria-hidden="true"><span>← {t.right}</span><span>{t.left} →</span></div>
   <Arches layout={layout} title={t.title} upperLabel={t.upper} lowerLabel={t.lower}
    render={tt=><DmftGlyph kind={tt.kind} w={tt.w} d={tt.d} st={c.st[tt.num]}/>}/>
  </Figure>
  <ul className="pr-legend" aria-label="Legend">
   {(['h','d','f','m','fd'] as St[]).map(k=><li key={k}>
    <svg viewBox="-14 -12 28 24" width={28} height={24} aria-hidden="true"><DmftGlyph kind="mol" w={22} d={19} st={k}/></svg>
    <span>{t.lg[k]}{k==='fd'&&<b className="pr-legend-arrow"> → {t.D}</b>}</span>
   </li>)}
  </ul>
  <div className="pr-steppers">
   <Stepper lang={lang} label={t.D} sub={t.Dn} tone={C.d} value={v.D} onChange={x=>setV({...v,D:x})} locked={locked} state={s('D')} solution={c.D}/>
   <Stepper lang={lang} label={t.F} sub={t.Fn} tone={C.f} value={v.F} onChange={x=>setV({...v,F:x})} locked={locked} state={s('F')} solution={c.F}/>
   <Stepper lang={lang} label={t.M} sub={t.Mn} tone="#5d7479" value={v.M} onChange={x=>setV({...v,M:x})} locked={locked} state={s('M')} solution={c.M}/>
  </div>
  <label className={'pr-field'+(checked?(ok.I?' pr-field-ok':' pr-field-bad'):'')}>
   <span>{t.idx}</span>
   <input type="number" inputMode="numeric" min={0} max={28} placeholder={t.idxPh} value={idx} disabled={locked}
    onChange={e=>setIdx(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} onKeyDown={e=>{if(e.key==='Enter'&&idx!=='')check()}}/>
   {checked&&!ok.I&&<b className="pr-field-sol">→ {c.D+c.F+c.M}</b>}
  </label>
  {!locked&&<CheckButton lang={lang} onClick={check} disabled={idx===''}/>}
 </div>;
}
