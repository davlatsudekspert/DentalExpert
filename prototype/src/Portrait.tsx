import {useId} from 'react';

type Props={person?:0|1|2;large?:boolean};
/* Original local vector illustrations of fictional demo clinicians. */
export default function Portrait({person=0,large=false}:Props){
 const id=useId().replaceAll(':','');
 const woman=person!==1;
 const skin=person===1?'#b98261':person===2?'#d19a78':'#e8ad88';
 const hair=person===1?'#182b39':person===2?'#44302f':'#543930';
 return <span className={'portrait-art '+(large?'portrait-art-large':'')+' portrait-art-'+person} role="img" aria-label="Fictional AI-generated demo clinician portrait">
 <svg viewBox="0 0 160 176" preserveAspectRatio="xMidYMid slice"><defs>
 <linearGradient id={id+'bg'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={person===0?'#e8f6f8':person===1?'#e5edf5':'#f5edf3'}/><stop offset="1" stopColor={person===0?'#c6e5e8':person===1?'#b7d5e4':'#dfd4e7'}/></linearGradient>
 <linearGradient id={id+'skin'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0d7"/><stop offset=".52" stopColor={skin}/><stop offset="1" stopColor={person===1?'#885946':'#b87562'}/></linearGradient>
 <linearGradient id={id+'coat'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#d8ecf3"/></linearGradient>
 </defs>
 <rect width="160" height="176" fill={'url(#'+id+'bg)'}/><circle cx="127" cy="30" r="55" fill="#fff" opacity=".25"/><path d="M-8 134Q42 112 80 135Q120 108 171 138V180H-8Z" fill="#c6e1e8" opacity=".5"/>
 {woman&&<path d="M41 52Q45 11 82 13Q124 10 125 62L132 138Q114 151 89 145L74 137Q48 150 28 138L36 76Z" fill={hair}/>} 
 {!woman&&<path d="M43 61Q35 17 82 15Q125 16 119 62Q110 49 96 43Q70 56 42 51Z" fill={hair}/>}
 <path d="M70 107v19Q60 131 43 135Q59 153 80 158Q101 152 119 134Q99 132 91 124v-17Z" fill={'url(#'+id+'skin)'}/>
 <path d="M22 176Q25 140 44 134L64 128L80 151L97 128L117 134Q138 138 141 176Z" fill={'url(#'+id+'coat)'}/>
 <path d="M66 130L80 153L94 130L100 176H59Z" fill={person===1?'#356a80':'#4f93a7'}/>
 <path d="M43 133L62 128L77 153L65 159L76 176H36Z M116 133L98 128L83 153L95 159L84 176H124Z" fill="#fcffff" stroke="#d5e4eb" strokeWidth="1"/>
 <path d="M43 62Q40 39 62 33Q91 21 112 43Q122 62 113 92Q109 116 81 121Q52 114 46 89Z" fill={'url(#'+id+'skin)'}/>
 {woman&&<path d="M42 83Q35 42 55 31Q65 20 90 22Q117 24 120 60Q103 45 94 39Q79 58 43 61Z" fill={hair}/>}
 {!woman&&<path d="M43 57Q40 31 62 26Q94 17 114 36L116 54Q99 51 88 41Q70 54 43 57Z" fill={hair}/>}
 <path d="M50 78Q60 73 70 77M90 77Q100 73 109 78" fill="none" stroke={hair} strokeWidth="2" strokeLinecap="round"/>
 <path d="M57 83q5-3 10 0M93 83q5-3 10 0" fill="none" stroke="#3b3840" strokeWidth="2" strokeLinecap="round"/>
 <path d="M80 84q-4 13 0 15l4 1" fill="none" stroke="#ab7260" strokeWidth="1.4" strokeLinecap="round"/>
 <path d="M69 106q12 8 25-1" fill="none" stroke="#a35458" strokeWidth="2.4" strokeLinecap="round"/>
 <path d="M51 91q-6-10-9-2q-1 11 9 12M111 91q6-10 9-2q1 11-9 12" fill={skin}/>
 {person===1&&<><path d="M55 102Q80 128 109 101Q107 116 88 122Q62 122 55 102" fill="#26343c" opacity=".55"/><rect x="48" y="78" width="25" height="16" rx="5" fill="none" stroke="#2b3943" strokeWidth="2"/><rect x="88" y="78" width="25" height="16" rx="5" fill="none" stroke="#2b3943" strokeWidth="2"/><path d="M73 84h15" stroke="#2b3943" strokeWidth="2"/></>}
 {woman&&<><circle cx="46" cy="100" r="2.5" fill="#dbbd80"/><circle cx="116" cy="100" r="2.5" fill="#dbbd80"/></>}
 <path d="M50 137l-3 26M110 137l3 26" stroke="#d1e2e9" strokeWidth="1.5"/>
 <path d="M105 148h16M110 146v5" stroke="#189eae" strokeWidth="1.5" strokeLinecap="round"/>
 </svg></span>
}
