import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import referenceMolar from '../assets/tooth3d/reference-molar.glb?url';

type Layer = 'enamel' | 'dentin' | 'pulp' | 'root';
type Props = {cut?: boolean; angle?: number; zoom?: boolean; layer?: Layer; variant?: 'hero' | 'study' | 'card'; onRotate?: (degrees: number) => void};

/* A model built from procedural meshes, not an image or a rotated SVG. Its layers are an
   educational visualisation, not a clinically validated anatomical reconstruction. */
function crownGeometry(scale = 1) {
  const sides = 128;
  // The upper rings form four rounded cusps and an occlusal hollow, rather than
  // ending in the single point of a cone. All vertices remain part of one mesh.
  const profile: Array<[number, number]> = [[-.43,.60],[-.37,.69],[-.29,.75],[-.14,.82],[.06,.91],[.28,.99],[.48,1.015],[.66,.985],[.79,.91],[.87,.78],[.90,.63],[.82,.48],[.75,.30],[.73,.13],[.74,.0]];
  const vertices: number[] = [];
  const indices: number[] = [];
  profile.forEach(([y, radius], row) => {
    for (let i=0;i<sides;i++) {
      const a = i/sides * Math.PI*2;
      const molar = 1 + .033*Math.cos(4*a+.35) + .012*Math.cos(8*a-.4);
      const cusp = row>6 ? Math.sin(Math.min(1,(row-6)/5)*Math.PI/2)*(.105*Math.cos(4*a+.45)+.025*Math.cos(8*a)) : 0;
      const groove = row>9 ? -.027*Math.exp(-Math.pow(Math.sin(2*a+.2)/.14,2)) : 0;
      vertices.push(Math.cos(a)*radius*molar*.96*scale,(y+cusp+groove)*scale,Math.sin(a)*radius*molar*.82*scale);
      if(row>0){const now=row*sides+i,prev=(row-1)*sides+i,next=row*sides+(i+1)%sides,pnext=(row-1)*sides+(i+1)%sides;indices.push(prev,now,pnext,pnext,now,next)}
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function rootGeometry(side:number,scale = 1){
  const sides=64,steps=42,vertices:number[]=[],indices:number[]=[];
  for(let j=0;j<=steps;j++){
    const t=j/steps;
    const y=-.32-t*1.51;
    const bend=side*(.34+.23*t+.07*Math.sin(t*Math.PI));
    const rx=(.345*Math.pow(1-t,.72)+.013)*scale;
    const rz=(.315*Math.pow(1-t,.77)+.012)*scale;
    for(let i=0;i<sides;i++){
      const a=i/sides*Math.PI*2;
      const ridge=1+.025*Math.cos(3*a+side*.8)*Math.sin(t*Math.PI);
      vertices.push((bend+Math.cos(a)*rx*ridge)*scale,y*scale,(Math.sin(a)*rz*ridge+.03*Math.sin(t*Math.PI))*scale);
      if(j>0){const now=j*sides+i,prev=(j-1)*sides+i,next=j*sides+(i+1)%sides,pnext=(j-1)*sides+(i+1)%sides;indices.push(prev,now,pnext,pnext,now,next)}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function sectionShape(width:number,top:number,bottom:number){
  const s=new THREE.Shape();
  s.moveTo(-width*.67,bottom);s.bezierCurveTo(-width*.92,-.06,-width,top*.51,-width*.84,top*.75);
  s.bezierCurveTo(-width*.73,top*.98,-width*.43,top*1.04,-width*.22,top*.95);
  s.quadraticCurveTo(0,top*.81,width*.22,top*.95);
  s.bezierCurveTo(width*.55,top*1.07,width*.79,top*.92,width*.9,top*.68);
  s.bezierCurveTo(width*1.08,top*.30,width*.89,-.16,width*.68,bottom);
  s.quadraticCurveTo(0,bottom+.11,-width*.67,bottom);return s;
}
function capGeometry(shape:THREE.Shape,z:number){const geo=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.012,bevelThickness:.009,curveSegments:48});geo.translate(0,0,z);return geo}
function strand(points:Array<[number,number]>,color:number,radius:number,z=.065){
 const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,z)));
 return new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),new THREE.MeshPhysicalMaterial({color,roughness:.27,clearcoat:.55}));
}
function makeModel(study:boolean){
 const group=new THREE.Group(); const clip=new THREE.Plane(new THREE.Vector3(0,0,-1),.02);
 const shell=new THREE.MeshPhysicalMaterial({color:0xfff9ef,roughness:.18,metalness:0,clearcoat:1,clearcoatRoughness:.08,ior:1.48,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const rootMat=new THREE.MeshPhysicalMaterial({color:0xf3e9da,roughness:.28,clearcoat:.55,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const outer=new THREE.Mesh(crownGeometry(),shell);outer.name='enamel';group.add(outer);
 [-1,1].forEach(side=>{const root=new THREE.Mesh(rootGeometry(side),rootMat);root.name='root';group.add(root)});
 if(study){
   // Nested beveled volumes give the section a visible enamel rim and depth.
   group.add(new THREE.Mesh(capGeometry(sectionShape(.82,.94,-.41),.022),new THREE.MeshPhysicalMaterial({color:0xfffaf0,roughness:.23,clearcoat:.8,side:THREE.DoubleSide})));
   const dentin=new THREE.Mesh(capGeometry(sectionShape(.68,.79,-.37),.028),new THREE.MeshPhysicalMaterial({color:0xe9c796,roughness:.48,side:THREE.DoubleSide}));dentin.name='dentin';group.add(dentin);
   const pulp=new THREE.Mesh(capGeometry(sectionShape(.34,.58,-.28),.034),new THREE.MeshPhysicalMaterial({color:0xc96763,roughness:.34,clearcoat:.35,side:THREE.DoubleSide}));pulp.name='pulp';group.add(pulp);
   [-1,1].forEach(side=>{
     const section=new THREE.Shape();
     const x=side*.38;section.moveTo(x-.19,-.28);section.quadraticCurveTo(x-.27,-.69,x+side*.05,-1.63);section.quadraticCurveTo(x+side*.05,-1.74,x+.09,-1.57);section.quadraticCurveTo(x+.10,-.95,x+.17,-.28);section.closePath();
     const rootFace=new THREE.Mesh(capGeometry(section,.034),new THREE.MeshStandardMaterial({color:0xdcb887,roughness:.5,side:THREE.DoubleSide}));rootFace.name='root';group.add(rootFace);
     const canalMesh=strand([[x,-.25],[x+side*.02,-.62],[x+side*.07,-1.1],[x+side*.12,-1.58]],0xa73949,.029,.078);canalMesh.name='pulp';group.add(canalMesh);
     group.add(strand([[x+side*.045,-.44],[x+side*.075,-.88],[x+side*.13,-1.38]],0x277ba4,.013,.088));
   });
   const nerveMesh=strand([[0,-.38],[.025,-.1],[-.015,.2],[-.09,.47]],0x8e3b53,.031,.09);nerveMesh.name='pulp';group.add(nerveMesh);
   group.add(strand([[.03,-.34],[.07,-.01],[.17,.24],[.25,.41]],0x246f9b,.014,.099));
   group.add(strand([[-.02,-.26],[-.13,.01],[-.23,.2]],0xbd394d,.013,.1));
 } else {
   // The geometry and studio environment generate the sheen; no painted-on highlight.
 }
 return group;
}
export default function Tooth3D({cut=false,angle=0,zoom=false,layer='enamel',variant='hero',onRotate}:Props){
 const mount=useRef<HTMLDivElement>(null);
 const runtime=useRef<{model:THREE.Group;camera:THREE.PerspectiveCamera;renderer:THREE.WebGLRenderer;scene:THREE.Scene;frame:number;rotation:number;dispose:()=>void}|null>(null);
 const drag=useRef<{x:number;rotation:number}|null>(null);
 useEffect(()=>{
   const host=mount.current;if(!host)return;
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,.18,variant==='card'?7.4:6.4);camera.lookAt(0,-.23,0);
   let renderer:THREE.WebGLRenderer;
   try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}
   catch {host.classList.add('webgl-unavailable');return;}
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=cut?1.25:.76;renderer.localClippingEnabled=true;
   host.appendChild(renderer.domElement);
   const environment=new THREE.PMREMGenerator(renderer);const environmentScene=new RoomEnvironment();scene.environment=environment.fromScene(environmentScene).texture;environmentScene.dispose();
   scene.add(new THREE.AmbientLight(0xf5fdff,cut?1.25:.6));
   const key=new THREE.DirectionalLight(0xffffff,cut?3.2:1.6);key.position.set(-3,5,5);scene.add(key);
   const rim=new THREE.DirectionalLight(0x6bd7e5,cut?2.4:1.4);rim.position.set(3,1,-4);scene.add(rim);
   const fill=new THREE.DirectionalLight(0xfff0de,cut?1.2:.7);fill.position.set(4,-2,3);scene.add(fill);
   const useReferenceMesh=variant==='study'&&!cut;
   const model=useReferenceMesh?new THREE.Group():makeModel(cut);scene.add(model);
   if(useReferenceMesh){
     host.dataset.model='loading-glb';
     new GLTFLoader().load(referenceMolar,gltf=>{
       if(!host.isConnected){gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose()});return}
       gltf.scene.rotation.y=.38;
       gltf.scene.traverse(object=>{
         if(!(object instanceof THREE.Mesh))return;
         const materials=Array.isArray(object.material)?object.material:[object.material];
         materials.forEach(material=>{
           if(!(material instanceof THREE.MeshStandardMaterial))return;
           material.color.set(material.name.includes('enamel')?'#e8dbca':'#c7b69d');
           material.roughness=material.name.includes('enamel')?.28:.46;
         });
       });
       model.add(gltf.scene);host.dataset.model='reference-glb';
     },undefined,()=>{model.add(makeModel(false));host.dataset.model='procedural-fallback'});
   }else host.dataset.model=cut?'procedural-cut':'procedural-outer';
   if(variant==='hero'){
     const orbital=new THREE.Mesh(new THREE.TorusGeometry(1.23,.024,12,150),new THREE.MeshBasicMaterial({color:0x47d6e2,transparent:true,opacity:.72}));orbital.rotation.set(.63,.31,.17);orbital.position.y=-.25;model.add(orbital);
     const orbital2=new THREE.Mesh(new THREE.TorusGeometry(1.38,.009,8,150),new THREE.MeshBasicMaterial({color:0xb7fbff,transparent:true,opacity:.72}));orbital2.rotation.set(1.12,-.31,-.2);orbital2.position.y=-.28;model.add(orbital2);
   }
   const resize=()=>{const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera)};
   const observer=new ResizeObserver(resize);observer.observe(host);resize();
   const state={model,camera,renderer,scene,frame:0,rotation:angle*Math.PI/180,dispose:()=>{}};
   const render=()=>{state.frame=requestAnimationFrame(render);model.rotation.y=state.rotation;renderer.render(scene,camera)};
   render();
   state.dispose=()=>{cancelAnimationFrame(state.frame);observer.disconnect();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>m.dispose())}});scene.environment?.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove()};
   runtime.current=state;
   return()=>{state.dispose();runtime.current=null};
 },[cut,variant]);
 useEffect(()=>{const state=runtime.current;if(state)state.rotation=angle*Math.PI/180},[angle,cut,variant]);
 useEffect(()=>{const state=runtime.current;if(state)state.camera.position.z=(variant==='card'?7.4:6.4)*(zoom?.80:1)},[zoom,variant,cut]);
 useEffect(()=>{const state=runtime.current;if(!state||!cut)return;state.model.traverse(object=>{if(!(object instanceof THREE.Mesh)||!object.name)return;const material=object.material;if(!(material instanceof THREE.MeshStandardMaterial))return;material.emissive.setHex(({enamel:0x6fd6e3,dentin:0xffc976,pulp:0xff6978,root:0x71cfaa} as const)[layer]);material.emissiveIntensity=object.name===layer?.28:0})},[layer,cut]);
 return <div ref={mount} className={'tooth-3d tooth-3d-'+variant} role="img" aria-label={cut?'Interactive 3D study tooth with schematic layers':'Interactive original 3D tooth'} data-rotation={angle} data-zoom={zoom} data-layer={layer} onPointerDown={e=>{drag.current={x:e.clientX,rotation:runtime.current?.rotation||0};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current||!runtime.current)return;runtime.current.rotation=drag.current.rotation+(e.clientX-drag.current.x)*.012}} onPointerUp={e=>{if(!drag.current||!runtime.current)return;const degrees=Math.round(runtime.current.rotation*180/Math.PI);drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);onRotate?.(degrees)}} onPointerCancel={()=>{drag.current=null}}/>;
}
