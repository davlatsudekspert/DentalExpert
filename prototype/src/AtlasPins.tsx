import type {Lang} from './discoveryData';

/** Numbered hotspots for the anatomy stage: each view marks the parts that are really visible in it. */
export type AtlasView='cut'|'outer'|'top';
type Part={k:string;at:[number,number]};
type Text={name:string;about:string};

const PARTS:Record<AtlasView,Part[]>={
 cut:[{k:'enamel',at:[62,19]},{k:'dentin',at:[72,32]},{k:'pulp',at:[62,41]},{k:'root',at:[30,72]}],
 outer:[{k:'crown',at:[50,24]},{k:'cej',at:[51,47]},{k:'root',at:[37,68]},{k:'apex',at:[51,93]}],
 top:[{k:'cusp',at:[25,25]},{k:'fissure',at:[38,51]},{k:'fossa',at:[53,51]},{k:'ridge',at:[50,88]}]
};

export const PART_TEXT:Record<Lang,Record<string,Text>>={
 uz:{
  enamel:{name:'Emal',about:'Tish tojini qoplagan, organizmdagi eng qattiq to‘qima: taxminan 96% mineral, nerv va tomirlari yo‘q.'},
  dentin:{name:'Dentin',about:'Tishning asosiy massasi. Dentin naychalari ta’sirni pulpaga o‘tkazadi, shuning uchun ochilgan dentin sezgir bo‘ladi.'},
  pulp:{name:'Pulpa',about:'Tish markazidagi yumshoq to‘qima: tomirlar, nervlar va odontoblastlar. Uning yallig‘lanishi — pulpit.'},
  root:{name:'Ildiz',about:'Tishni jag‘ suyagida tutib turadi. Sement bilan qoplangan va parodont tolalari orqali alveolaga birikadi.'},
  crown:{name:'Toj',about:'Og‘iz bo‘shlig‘ida ko‘rinib turadigan qism, emal bilan qoplangan.'},
  cej:{name:'Tish bo‘yni',about:'Emal va sement tutashadigan chegara (emal-sement birikmasi). Milk chekkasi shu chiziqqa yaqin joylashadi.'},
  apex:{name:'Ildiz uchi',about:'Apikal teshik shu yerda: u orqali tomir va nervlar pulpaga kiradi.'},
  cusp:{name:'Do‘mboq',about:'Chaynov yuzasidagi do‘mboqlar ovqatni maydalaydi; pastki birinchi molyarda odatda 5 ta.'},
  fissure:{name:'Fissura',about:'Do‘mboqlar orasidagi tor egatcha. Karies ko‘pincha shu yerdan boshlanadi, germetik bilan himoyalanadi.'},
  fossa:{name:'Chuqurcha',about:'Chaynov yuzasidagi chuqurcha: qarama-qarshi tishning do‘mboqi aynan shu yerga tushadi.'},
  ridge:{name:'Chekka qirra',about:'Chaynov yuzasini kontakt (yon) yuzadan ajratib turadigan qirra.'}
 },
 ru:{
  enamel:{name:'Эмаль',about:'Покрывает коронку; самая твёрдая ткань организма: около 96% минералов, нет нервов и сосудов.'},
  dentin:{name:'Дентин',about:'Основная масса зуба. Дентинные трубочки передают раздражение к пульпе, поэтому открытый дентин чувствителен.'},
  pulp:{name:'Пульпа',about:'Мягкая ткань в центре зуба: сосуды, нервы и одонтобласты. Её воспаление — пульпит.'},
  root:{name:'Корень',about:'Удерживает зуб в челюсти. Покрыт цементом и прикрепляется к альвеоле волокнами периодонта.'},
  crown:{name:'Коронка',about:'Часть зуба, видимая в полости рта; покрыта эмалью.'},
  cej:{name:'Шейка зуба',about:'Граница эмали и цемента (эмалево-цементное соединение). Рядом с ней проходит край десны.'},
  apex:{name:'Верхушка корня',about:'Здесь находится апикальное отверстие: через него сосуды и нервы входят в пульпу.'},
  cusp:{name:'Бугор',about:'Бугры жевательной поверхности измельчают пищу; у нижнего первого моляра их обычно 5.'},
  fissure:{name:'Фиссура',about:'Узкая борозда между буграми. Кариес часто начинается здесь; её защищают герметиком.'},
  fossa:{name:'Ямка',about:'Углубление жевательной поверхности: сюда входит бугор зуба-антагониста.'},
  ridge:{name:'Краевой гребень',about:'Гребень, отделяющий жевательную поверхность от контактной.'}
 },
 en:{
  enamel:{name:'Enamel',about:'Covers the crown; the hardest tissue in the body: about 96% mineral, with no nerves or vessels.'},
  dentin:{name:'Dentin',about:'The bulk of the tooth. Dentinal tubules pass stimuli to the pulp, which is why exposed dentin is sensitive.'},
  pulp:{name:'Pulp',about:'Soft tissue in the centre of the tooth: vessels, nerves and odontoblasts. Its inflammation is pulpitis.'},
  root:{name:'Root',about:'Anchors the tooth in the jaw. It is covered by cementum and attached to the socket by periodontal fibres.'},
  crown:{name:'Crown',about:'The part you see in the mouth, covered by enamel.'},
  cej:{name:'Neck (CEJ)',about:'Where enamel meets cementum (cemento-enamel junction). The gum margin sits close to this line.'},
  apex:{name:'Root apex',about:'The apical foramen is here: vessels and nerves enter the pulp through it.'},
  cusp:{name:'Cusp',about:'Cusps on the chewing surface grind food; a lower first molar usually has 5.'},
  fissure:{name:'Fissure',about:'A narrow groove between cusps. Caries often starts here; sealants protect it.'},
  fossa:{name:'Fossa',about:'A hollow on the chewing surface where the opposing tooth’s cusp fits.'},
  ridge:{name:'Marginal ridge',about:'The ridge that separates the chewing surface from the contact surface.'}
 }
};

export const firstPart=(view:AtlasView)=>PARTS[view][0].k;
export const hasPart=(view:AtlasView,k:string)=>PARTS[view].some(p=>p.k===k);

/** Pins over a square, centred picture (object-fit: contain), scaled like the picture; `mirror` follows a flipped view. */
export function AtlasPins({view,lang,selected,onSelect,scale=1,mirror=false}:{view:AtlasView;lang:Lang;selected:string;onSelect:(k:string)=>void;scale?:number;mirror?:boolean}){
 const pins=PARTS[view].map((p,i)=>{
  const on=p.k===selected;
  const x=mirror?100-p.at[0]:p.at[0];
  const name=PART_TEXT[lang][p.k].name;
  const label=on?<b className={x<=60?'':'left'}>{name}</b>:null;
  return <button key={p.k} className={on?'atlas-pin on':'atlas-pin'} style={{left:`${x}%`,top:`${p.at[1]}%`}} aria-pressed={on} aria-label={name}
   onPointerDown={e=>e.stopPropagation()} onClick={()=>onSelect(p.k)}><span>{i+1}</span>{label}</button>;
 });
 return <div className="atlas-pins" style={{['--s' as string]:scale}}>{pins}</div>;
}

export function AtlasInfo({view,lang,selected,onSelect}:{view:AtlasView;lang:Lang;selected:string;onSelect:(k:string)=>void}){
 const tx=PART_TEXT[lang][selected];
 return <div className="atlas-info">
  <div className="atlas-chips">{PARTS[view].map((p,i)=><button key={p.k} className={p.k===selected?'on':''} aria-pressed={p.k===selected} onClick={()=>onSelect(p.k)}><span>{i+1}</span>{PART_TEXT[lang][p.k].name}</button>)}</div>
  {tx&&<div className="atlas-about" role="status"><b>{tx.name}</b><p>{tx.about}</p></div>}
 </div>;
}
