import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {Layers,RotateCcw,X} from 'lucide-react';
import type {Lang} from './discoveryData';
import fallbackImage from '../assets/tooth3d/premium-reference-cutaway-ivory.webp';

type LayerKey='enamel'|'dentin'|'pulp'|'vessels'|'root';

const T={
 uz:{title:'3D tish atlasi',hint:'Aylantirish uchun suring · qatlamni bosing',explode:'Ajratish',assemble:'Yig‘ish',reset:'Boshlang‘ich',close:'Yopish',
  layers:{enamel:['Emal','Tojni qoplaydigan eng qattiq to‘qima. Tirik hujayralari yo‘q, shuning uchun o‘zi tiklanmaydi.'],
   dentin:['Dentin','Tishning asosiy qismi, emal va sement ostida. Mayda dentin kanalchalari bor.'],
   pulp:['Pulpa','Tish markazidagi yumshoq to‘qima: tishni oziqlantiradi va sezgi beradi.'],
   vessels:['Qon tomirlar va nervlar','Qizil — arteriyalar (qon keltiradi), ko‘k — venalar (qon olib ketadi), sariq — nerv (sezgi).'],
   root:['Ildiz','Ildiz yuzasi sement bilan qoplangan; boylamlar shunga birikib, tishni jag suyagiga ushlaydi.']},
  note:'Ta’limiy tasvir: tomir va nervlar sxematik. Klinik ko‘rsatma emas.',nowebgl:'Bu qurilmada 3D ishlamadi. Rasmli atlas ko‘rsatilmoqda.'},
 ru:{title:'3D-атлас зуба',hint:'Вращайте жестом · нажмите на слой',explode:'Разделить',assemble:'Собрать',reset:'Сброс',close:'Закрыть',
  layers:{enamel:['Эмаль','Самая твёрдая ткань, покрывающая коронку. Не содержит живых клеток и не восстанавливается.'],
   dentin:['Дентин','Основная часть зуба под эмалью и цементом корня. Пронизан мельчайшими канальцами.'],
   pulp:['Пульпа','Мягкая ткань в центре зуба: питает зуб и даёт чувствительность.'],
   vessels:['Сосуды и нервы','Красные — артерии (приносят кровь), синие — вены (отводят кровь), жёлтые — нерв (чувствительность).'],
   root:['Корень','Поверхность корня покрыта цементом; к нему крепятся связки, удерживающие зуб в челюсти.']},
  note:'Учебная иллюстрация: сосуды и нервы схематичны. Не клиническое руководство.',nowebgl:'3D недоступно на этом устройстве. Показан фото-атлас.'},
 en:{title:'3D tooth atlas',hint:'Drag to rotate · tap a layer',explode:'Explode',assemble:'Assemble',reset:'Reset',close:'Close',
  layers:{enamel:['Enamel','The hardest tissue, covering the crown. It has no living cells, so it cannot repair itself.'],
   dentin:['Dentin','The main body of the tooth under the enamel and the root cementum, threaded with tiny tubules.'],
   pulp:['Pulp','Soft tissue in the centre of the tooth: it nourishes the tooth and provides sensation.'],
   vessels:['Vessels & nerves','Red: arteries (bring blood). Blue: veins (carry it away). Yellow: nerve (sensation).'],
   root:['Root','The root surface is covered by cementum; ligaments attach to it and hold the tooth in the jaw.']},
  note:'Educational illustration: vessels and nerves are schematic. Not clinical guidance.',nowebgl:'3D is not available on this device. Showing the photo atlas.'}
};

const COLORS:Record<LayerKey,string>={enamel:'#bfe9ff',dentin:'#f0c987',pulp:'#ff6a6a',vessels:'#ffd84d',root:'#e6d5b0'};
const ORDER:LayerKey[]=['enamel','dentin','pulp','vessels','root'];
const PLATES=['interior','exterior','dentin','enamel','pulp','vessels','nerves'] as const;
type Plate=typeof PLATES[number];
const S=10;
const Z0:Record<Plate,number>={interior:-0.05,exterior:0,dentin:0.04,enamel:0.08,pulp:0.12,vessels:0.16,nerves:0.2};
// exploded positions [x,y,z]
const EXPLODED:Record<Plate,[number,number,number]>={interior:[0,0,-2.4],exterior:[-0.7,0,-1.0],dentin:[0.1,0,1.0],enamel:[0.7,0.8,2.6],pulp:[0.1,0,4.2],vessels:[0.1,0,5.0],nerves:[0.1,0,5.8]};
const LAYER_PLATES:Record<LayerKey,Plate[]>={enamel:['enamel'],dentin:['dentin'],pulp:['pulp'],vessels:['vessels','nerves'],root:['exterior']};
const GLOW:Partial<Record<LayerKey,string>>={enamel:'glow_enamel',dentin:'glow_dentin',pulp:'glow_pulp'};
const GLOW_COLOR:Partial<Record<LayerKey,number>>={enamel:0x9fdcff,dentin:0xffd27a,pulp:0xff5a5a};

const asset=(n:string)=>`/atlas3d/${n}.webp`;

function webglOk(){try{const c=document.createElement('canvas');const gl=(c.getContext('webgl2')||c.getContext('webgl')) as WebGLRenderingContext|null;gl?.getExtension('WEBGL_lose_context')?.loseContext();return !!gl}catch{return false}}

export default function Atlas3D({lang,onClose}:{lang:Lang;onClose:()=>void}){
 const t=T[lang];
 const mount=useRef<HTMLDivElement>(null);
 const svg=useRef<SVGLineElement>(null);
 const dot=useRef<SVGCircleElement>(null);
 const cardRef=useRef<HTMLDivElement>(null);
 const [selected,setSelected]=useState<LayerKey|null>(null);
 const [exploded,setExploded]=useState(false);
 const [ok,setOk]=useState(true);
 const [loading,setLoading]=useState(true);
 const api=useRef<{select:(k:LayerKey|null)=>void;explode:(v:boolean)=>void;reset:()=>void}|null>(null);

 useEffect(()=>{
  if(!webglOk()){setOk(false);return}
  const host=mount.current!;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block';
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,1,100);
  let dist=27;
  const tooth=new THREE.Group();scene.add(tooth);

  const loader=new THREE.TextureLoader();
  const maxAniso=renderer.capabilities.getMaxAnisotropy();
  const tex=(n:string)=>new Promise<THREE.Texture>((res,rej)=>loader.load(asset(n),x=>{x.colorSpace=THREE.SRGBColorSpace;x.anisotropy=maxAniso;res(x)},undefined,rej));
  const alphaMaps:Record<string,{d:Uint8ClampedArray;w:number}>={};
  const meshes=new Map<string,THREE.Mesh>();
  const shadows=new Map<string,THREE.Mesh>();
  const glows=new Map<LayerKey,THREE.Mesh>();
  const state={target:new Map<string,[number,number,number]>(),cur:new Map<string,[number,number,number]>(),op:new Map<string,number>(),opT:new Map<string,number>(),lift:new Map<string,number>(),liftT:new Map<string,number>()};
  let selectedKey:LayerKey|null=null,isExploded=false,disposed=false;
  const flow={value:0};

  const mkAlpha=(name:string,img:HTMLImageElement)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(img,0,0,256,256);alphaMaps[name]={d:x.getImageData(0,0,256,256).data,w:256}};

  const flowMat=(map:THREE.Texture)=>new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,toneMapped:false,
   uniforms:{map:{value:map},time:{value:0},boost:{value:0.35},dim:{value:1}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'uniform sampler2D map;uniform float time;uniform float boost;uniform float dim;varying vec2 vUv;void main(){vec4 t=texture2D(map,vUv);float f=0.5+0.5*sin(time*2.6-vUv.y*34.0+vUv.x*7.0);gl_FragColor=vec4(t.rgb*(1.0+0.9*f*boost),t.a*dim);\n#include <colorspace_fragment>\n}'
  });

  (async()=>{
   try{
    const names=[...PLATES,'shadow_exterior','shadow_dentin','shadow_enamel','shadow_pulp','glow_enamel','glow_dentin','glow_pulp'];
    const loaded=await Promise.all(names.map(n=>tex(n)));
    if(disposed)return;
    const T_=Object.fromEntries(names.map((n,i)=>[n,loaded[i]]));
    names.forEach((n,i)=>mkAlpha(n,loaded[i].image as HTMLImageElement));
    const geo=new THREE.PlaneGeometry(S,S);
    // soft shadows first (behind), then the plates, then glow
    (['exterior','dentin','enamel','pulp'] as Plate[]).forEach(p=>{
     const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:T_['shadow_'+p],color:0x000000,transparent:true,opacity:0.32,depthWrite:false,toneMapped:false}));
     m.renderOrder=0;tooth.add(m);shadows.set(p,m);
    });
    PLATES.forEach((p,i)=>{
     const mat=(p==='vessels'||p==='nerves')?flowMat(T_[p]):new THREE.MeshBasicMaterial({map:T_[p],transparent:true,depthWrite:false,toneMapped:false});
     const m=new THREE.Mesh(geo,mat);m.renderOrder=10+i;tooth.add(m);meshes.set(p,m);
     state.cur.set(p,[0,0,Z0[p]]);state.target.set(p,[0,0,Z0[p]]);state.op.set(p,1);state.opT.set(p,1);state.lift.set(p,0);state.liftT.set(p,0);
    });
    (Object.keys(GLOW) as LayerKey[]).forEach(k=>{
     const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:T_[GLOW[k]!],color:GLOW_COLOR[k],transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
     m.renderOrder=40;tooth.add(m);glows.set(k,m);
    });
    // intro: start exploded, then assemble
    PLATES.forEach(p=>{const e=EXPLODED[p];state.cur.set(p,[e[0],e[1],e[2]*1.6])});
    setLoading(false);
   }catch{setOk(false)}
  })();

  // ---- interaction state
  let yaw=0,pitch=0,yawT=-0.38,pitchT=0.08,lastInput=performance.now(),dragging=false,moved=0,sx=0,sy=0,lx=0,ly=0;
  const pointers=new Map<number,{x:number;y:number}>();let pinch0=0,dist0=dist;
  const el=renderer.domElement;
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();

  const pick=(cx:number,cy:number):LayerKey|null=>{
   const r=el.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
   const order:Plate[]=['nerves','vessels','pulp','enamel','dentin','exterior'];
   for(const p of order){
    const m=meshes.get(p);if(!m)continue;const hit=ray.intersectObject(m)[0];if(!hit||!hit.uv)continue;
    const am=alphaMaps[p];const u=Math.floor(hit.uv.x*(am.w-1)),v=Math.floor((1-hit.uv.y)*(am.w-1));
    let a=0;const rad=(p==='nerves'||p==='vessels')?3:0;
    for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const xx=Math.min(am.w-1,Math.max(0,u+dx)),yy=Math.min(am.w-1,Math.max(0,v+dy));a=Math.max(a,am.d[(yy*am.w+xx)*4+3])}
    if(a>110){return p==='nerves'||p==='vessels'?'vessels':p==='exterior'?'root':p as LayerKey}
   }
   return null;
  };

  const setSel=(k:LayerKey|null)=>{
   selectedKey=k;setSelected(k);
   PLATES.forEach(p=>{
    const inSel=!!k&&LAYER_PLATES[k].includes(p);
    state.opT.set(p,!k||inSel?1:p==='interior'?0.55:0.3);
    state.liftT.set(p,inSel?(isExploded?1.0:2.0):0);
   });
  };
  const setExp=(v:boolean)=>{isExploded=v;if(v){yawT=-0.62;pitchT=0.16}else if(yawT<-0.5){yawT=-0.38;pitchT=0.08};setExploded(v);PLATES.forEach(p=>{const e=EXPLODED[p];state.target.set(p,v?[e[0],e[1],e[2]]:[0,0,Z0[p]])});setSel(selectedKey)};
  api.current={select:k=>setSel(k===selectedKey?null:k),explode:setExp,reset:()=>{yawT=-0.38;pitchT=0.08;dist=27;setSel(null);setExp(false)}};

  const down=(e:PointerEvent)=>{el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=true;moved=0;sx=lx=e.clientX;sy=ly=e.clientY;lastInput=performance.now();
   if(pointers.size===2){const [a,b]=[...pointers.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=dist}};
  const move=(e:PointerEvent)=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastInput=performance.now();
   if(pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);dist=Math.min(40,Math.max(16,dist0*(pinch0/(d||1))));moved+=10;return}
   const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
   yawT=Math.max(-0.95,Math.min(0.95,yawT+dx*0.006));pitchT=Math.max(-0.45,Math.min(0.45,pitchT+dy*0.004))};
  const up=(e:PointerEvent)=>{const wasTap=moved<8&&pointers.size===1;pointers.delete(e.pointerId);dragging=pointers.size>0;
   if(wasTap){const k=pick(e.clientX,e.clientY);setSel(k&&k!==selectedKey?k:null)}};
  const wheel=(e:WheelEvent)=>{e.preventDefault();dist=Math.min(40,Math.max(16,dist+e.deltaY*0.02))};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});

  const resize=()=>{const w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  resize();const ro=new ResizeObserver(resize);ro.observe(host);

  const v3=new THREE.Vector3();
  let raf=0;const t0=performance.now();let prev=t0;
  const loop=()=>{
   raf=requestAnimationFrame(loop);
   const now=performance.now(),dt=Math.min(0.05,(now-prev)/1000);prev=now;const time=(now-t0)/1000;
   const idle=now-lastInput>2500&&!dragging;
   const sway=idle?Math.sin(time*0.7)*0.16:0;
   yaw+=((yawT+sway)-yaw)*Math.min(1,dt*6);pitch+=(pitchT-pitch)*Math.min(1,dt*6);
   tooth.rotation.set(pitch,yaw,0);
   camera.position.set(0,0,dist);camera.lookAt(0,-0.2,0);
   const k=1-Math.exp(-dt*5.5);
   PLATES.forEach(p=>{
    const m=meshes.get(p);if(!m)return;
    const c=state.cur.get(p)!,tg=state.target.get(p)!;
    const lf=state.lift.get(p)!+((state.liftT.get(p)!-state.lift.get(p)!)*k);state.lift.set(p,lf);
    c[0]+=(tg[0]-c[0])*k;c[1]+=(tg[1]-c[1])*k;c[2]+=(tg[2]-c[2])*k;
    m.position.set(c[0],c[1],c[2]+lf);
    const o=state.op.get(p)!+((state.opT.get(p)!-state.op.get(p)!)*k);state.op.set(p,o);
    const mat=m.material as THREE.Material&{opacity?:number;uniforms?:any};
    if(mat.uniforms){mat.uniforms.time.value=time;mat.uniforms.dim.value=o;mat.uniforms.boost.value=selectedKey==='vessels'?1.0:0.35}else{mat.opacity=o}
    const sh=shadows.get(p);if(sh){sh.position.set(c[0]+0.18,c[1]-0.22,c[2]+lf-0.03);(sh.material as THREE.MeshBasicMaterial).opacity=0.34*o*(isExploded||lf>0.2?1:0.35)}
   });
   glows.forEach((g,key)=>{const pl=LAYER_PLATES[key][0];const m=meshes.get(pl)!;g.position.copy(m.position);g.position.z-=0.005;(g.material as THREE.MeshBasicMaterial).opacity+=(((selectedKey===key)?0.22+0.08*Math.sin(time*3):0)-(g.material as THREE.MeshBasicMaterial).opacity)*k});
   // leader line from the selected layer to the info card
   if(selectedKey&&svg.current&&dot.current&&cardRef.current){
    const anchors:Record<LayerKey,[number,number]>={enamel:[690,230],dentin:[700,520],pulp:[640,590],vessels:[655,430],root:[300,860]};
    const [ax,ay]=anchors[selectedKey];const pl=LAYER_PLATES[selectedKey][0];const m=meshes.get(pl)!;
    v3.set((ax/1024-0.5)*S,-(ay/1024-0.5)*S,0);m.localToWorld(v3);v3.project(camera);
    const r=host.getBoundingClientRect();const x=(v3.x*0.5+0.5)*r.width,y=(-v3.y*0.5+0.5)*r.height;
    const cr=cardRef.current.getBoundingClientRect();const cx=cr.left-r.left+cr.width/2,cy=cr.top-r.top;
    svg.current.setAttribute('x1',String(x));svg.current.setAttribute('y1',String(y));svg.current.setAttribute('x2',String(cx));svg.current.setAttribute('y2',String(cy));
    dot.current.setAttribute('cx',String(x));dot.current.setAttribute('cy',String(y));
   }
   renderer.render(scene,camera);
  };
  loop();
  // assemble after the intro
  const introTimer=window.setTimeout(()=>{PLATES.forEach(p=>state.cur.get(p)&&state.target.set(p,[0,0,Z0[p]]))},700);

  return()=>{disposed=true;cancelAnimationFrame(raf);window.clearTimeout(introTimer);ro.disconnect();
   el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);
   scene.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();const mt=m.material as THREE.Material&{map?:THREE.Texture;uniforms?:Record<string,{value:unknown}>};mt.map?.dispose();if(mt.uniforms)Object.values(mt.uniforms).forEach(u=>{const v=u.value as THREE.Texture|undefined;if(v&&(v as THREE.Texture).isTexture)v.dispose()});mt.dispose()}});
   renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
 },[]);

 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',k);const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',k);document.body.style.overflow=o}},[onClose]);

 const info=selected?t.layers[selected]:null;
 return <div className="atlas3d" role="dialog" aria-label={t.title}>
  <div className="atlas3d-top">
   <div><strong>{t.title}</strong><small>{t.hint}</small></div>
   <button onClick={()=>api.current?.reset()} aria-label={t.reset}><RotateCcw size={18}/></button>
   <button onClick={onClose} aria-label={t.close}><X size={20}/></button>
  </div>
  {ok?<div className="atlas3d-stage" ref={mount}>
    {loading&&<div className="atlas3d-loading"><i/></div>}
    <svg className="atlas3d-lines" aria-hidden="true"><line ref={svg} stroke="#fff" strokeOpacity={selected?0.85:0} strokeWidth="1.5" strokeDasharray="4 4"/><circle ref={dot} r="5" fill={selected?COLORS[selected]:'#fff'} fillOpacity={selected?1:0} stroke="#fff" strokeWidth="2"/></svg>
  </div>:<div className="atlas3d-stage fallback"><img src={fallbackImage} alt={t.title} draggable={false}/><p>{t.nowebgl}</p></div>}
  <div className="atlas3d-bottom">
   {info&&<div className="atlas3d-card" ref={cardRef} style={{borderColor:COLORS[selected!]}}><i style={{background:COLORS[selected!]}}/><div><strong>{info[0]}</strong><p>{info[1]}</p></div></div>}
   <div className="atlas3d-chips">
    <button className={'explode'+(exploded?' on':'')} onClick={()=>api.current?.explode(!exploded)}><Layers size={16}/>{exploded?t.assemble:t.explode}</button>
    {ORDER.map(k=><button key={k} className={selected===k?'on':''} onClick={()=>api.current?.select(k)} style={{['--c' as string]:COLORS[k]}}><i/>{t.layers[k][0]}</button>)}
   </div>
   <small className="atlas3d-note">{t.note}</small>
  </div>
 </div>;
}
