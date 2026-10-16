import {useEffect, useRef} from 'react';
import * as THREE from 'three';

type Layer = 'enamel' | 'dentin' | 'pulp' | 'root';
type Props = {cut?: boolean; angle?: number; zoom?: boolean; layer?: Layer; variant?: 'hero' | 'study' | 'card'; onRotate?: (degrees: number) => void};

/* A model built from procedural meshes, not an image or a rotated SVG. Its layers are an
   educational visualisation, not a clinically validated anatomical reconstruction. */
function crownGeometry(scale = 1) {
  const sides = 80;
  const profile: Array<[number, number]> = [[-.38,.65],[-.23,.77],[.04,.91],[.35,.99],[.62,1],[.82,.91],[.94,.72],[1.035,.38],[1.055,.0]];
  const vertices: number[] = [];
  const indices: number[] = [];
  profile.forEach(([y, radius], row) => {
    for (let i=0;i<sides;i++) {
      const a = i/sides * Math.PI*2;
      const molar = 1 + .045*Math.cos(4*a) + .018*Math.cos(8*a+.8);
      const cusp = row>4 ? .045*Math.cos(4*a+.4) * (row-4)/4 : 0;
      vertices.push(Math.cos(a)*radius*molar*.93*scale,(y+cusp)*scale,Math.sin(a)*radius*molar*.76*scale);
      if(row>0){const now=row*sides+i,prev=(row-1)*sides+i,next=row*sides+(i+1)%sides,pnext=(row-1)*sides+(i+1)%sides;indices.push(prev,now,pnext,pnext,now,next)}
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function rootGeometry(side:number,scale = 1){
  const sides=36,steps=22,vertices:number[]=[],indices:number[]=[];
  for(let j=0;j<=steps;j++){
    const t=j/steps;
    const y=-.28-t*1.50;
    const bend=side*(.35+.25*t+.10*Math.sin(t*Math.PI));
    const rx=(.34*(1-t)**.82+.018)*scale;
    const rz=(.30*(1-t)**.8+.016)*scale;
    for(let i=0;i<sides;i++){
      const a=i/sides*Math.PI*2;
      vertices.push((bend+Math.cos(a)*rx)*scale,y*scale,Math.sin(a)*rz);
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
function capGeometry(shape:THREE.Shape,z:number){const geo=new THREE.ShapeGeometry(shape,40);geo.translate(0,0,z);return geo}
function makeModel(study:boolean){
 const group=new THREE.Group(); const clip=new THREE.Plane(new THREE.Vector3(0,0,-1),.02);
 const shell=new THREE.MeshPhysicalMaterial({color:0xf9feff,roughness:.14,metalness:.01,clearcoat:1,clearcoatRoughness:.1,transmission:.08,thickness:.8,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const rootMat=new THREE.MeshPhysicalMaterial({color:0xe6f5f9,roughness:.22,clearcoat:.7,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const dentinMat=new THREE.MeshPhysicalMaterial({color:0xf3d4a0,roughness:.42,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const pulpMat=new THREE.MeshPhysicalMaterial({color:0xc96669,roughness:.32,side:THREE.DoubleSide,clippingPlanes:study?[clip]:[]});
 const outer=new THREE.Mesh(crownGeometry(),shell);outer.name='enamel';group.add(outer);
 [-1,1].forEach(side=>{const root=new THREE.Mesh(rootGeometry(side),rootMat);root.name='root';group.add(root)});
 if(study){
   // The cut face is assembled as nested planar meshes behind the clipped enamel shell.
   group.add(new THREE.Mesh(capGeometry(sectionShape(.79,1.0,-.40),.022),new THREE.MeshStandardMaterial({color:0xfffcf4,roughness:.34,side:THREE.DoubleSide})));
   const dentin=new THREE.Mesh(capGeometry(sectionShape(.65,.86,-.34),.026),new THREE.MeshStandardMaterial({color:0xeecb94,roughness:.49,side:THREE.DoubleSide}));dentin.name='dentin';group.add(dentin);
   const pulp=new THREE.Mesh(capGeometry(sectionShape(.34,.61,-.28),.030),new THREE.MeshStandardMaterial({color:0xc97572,roughness:.4,side:THREE.DoubleSide}));pulp.name='pulp';group.add(pulp);
   [-1,1].forEach(side=>{
     const section=new THREE.Shape();
     const x=side*.38;section.moveTo(x-.19,-.28);section.quadraticCurveTo(x-.27,-.69,x+side*.05,-1.63);section.quadraticCurveTo(x+side*.05,-1.74,x+.09,-1.57);section.quadraticCurveTo(x+.10,-.95,x+.17,-.28);section.closePath();
     const rootFace=new THREE.Mesh(capGeometry(section,.024),new THREE.MeshStandardMaterial({color:0xe9c693,side:THREE.DoubleSide}));rootFace.name='root';group.add(rootFace);
     const canal=new THREE.CatmullRomCurve3([new THREE.Vector3(x,-.27,.034),new THREE.Vector3(x+side*.03,-.66,.034),new THREE.Vector3(x+side*.1,-1.14,.034),new THREE.Vector3(x+side*.15,-1.60,.034)]);
     const canalMesh=new THREE.Mesh(new THREE.TubeGeometry(canal,32,.028,8,false),new THREE.MeshStandardMaterial({color:0xb74e59,roughness:.35}));canalMesh.name='pulp';group.add(canalMesh);
   });
   const nerve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.43,.04),new THREE.Vector3(.02,.02,.04),new THREE.Vector3(-.03,.42,.04)]);
   const nerveMesh=new THREE.Mesh(new THREE.TubeGeometry(nerve,20,.032,8,false),new THREE.MeshStandardMaterial({color:0x8e485b}));nerveMesh.name='pulp';group.add(nerveMesh);
 } else {
   // A restrained occlusal highlight gives the full tooth a polished ceramic appearance.
   const highlight=new THREE.Mesh(new THREE.TorusGeometry(.47,.016,8,80,Math.PI*.7),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5}));highlight.rotation.x=Math.PI/2;highlight.position.set(-.1,.94,.02);group.add(highlight);
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
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.47;renderer.localClippingEnabled=true;
   host.appendChild(renderer.domElement);
   scene.add(new THREE.AmbientLight(0xf5fdff,2.1));
   const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,5,5);scene.add(key);
   const rim=new THREE.DirectionalLight(0x68d5e6,3.1);rim.position.set(3,1,-4);scene.add(rim);
   const fill=new THREE.DirectionalLight(0xffffff,1.2);fill.position.set(4,-2,3);scene.add(fill);
   const model=makeModel(cut);scene.add(model);
   if(variant==='hero'){
     const orbital=new THREE.Mesh(new THREE.TorusGeometry(1.23,.024,12,150),new THREE.MeshBasicMaterial({color:0x47d6e2,transparent:true,opacity:.72}));orbital.rotation.set(.63,.31,.17);orbital.position.y=-.25;model.add(orbital);
     const orbital2=new THREE.Mesh(new THREE.TorusGeometry(1.38,.009,8,150),new THREE.MeshBasicMaterial({color:0xb7fbff,transparent:true,opacity:.72}));orbital2.rotation.set(1.12,-.31,-.2);orbital2.position.y=-.28;model.add(orbital2);
   }
   const resize=()=>{const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera)};
   const observer=new ResizeObserver(resize);observer.observe(host);resize();
   const state={model,camera,renderer,scene,frame:0,rotation:angle*Math.PI/180,dispose:()=>{}};
   const render=()=>{state.frame=requestAnimationFrame(render);model.rotation.y=state.rotation;renderer.render(scene,camera)};
   render();
   state.dispose=()=>{cancelAnimationFrame(state.frame);observer.disconnect();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>m.dispose())}});renderer.dispose();renderer.domElement.remove()};
   runtime.current=state;
   return()=>{state.dispose();runtime.current=null};
 },[cut,variant]);
 useEffect(()=>{const state=runtime.current;if(state)state.rotation=angle*Math.PI/180},[angle,cut,variant]);
 useEffect(()=>{const state=runtime.current;if(state)state.camera.position.z=(variant==='card'?7.4:6.4)*(zoom?.80:1)},[zoom,variant,cut]);
 useEffect(()=>{const state=runtime.current;if(!state||!cut)return;state.model.traverse(object=>{if(!(object instanceof THREE.Mesh)||!object.name)return;const material=object.material;if(!(material instanceof THREE.MeshStandardMaterial))return;material.emissive.setHex(({enamel:0x6fd6e3,dentin:0xffc976,pulp:0xff6978,root:0x71cfaa} as const)[layer]);material.emissiveIntensity=object.name===layer?.28:0})},[layer,cut]);
 return <div ref={mount} className={'tooth-3d tooth-3d-'+variant} role="img" aria-label={cut?'Interactive 3D study tooth with schematic layers':'Interactive original 3D tooth'} data-rotation={angle} data-zoom={zoom} data-layer={layer} onPointerDown={e=>{drag.current={x:e.clientX,rotation:runtime.current?.rotation||0};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current||!runtime.current)return;runtime.current.rotation=drag.current.rotation+(e.clientX-drag.current.x)*.012}} onPointerUp={e=>{if(!drag.current||!runtime.current)return;const degrees=Math.round(runtime.current.rotation*180/Math.PI);drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);onRotate?.(degrees)}} onPointerCancel={()=>{drag.current=null}}/>;
}
