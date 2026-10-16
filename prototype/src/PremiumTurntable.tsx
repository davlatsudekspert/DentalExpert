import {useRef} from 'react';
import front from '../assets/tooth3d/turntable-front.webp?inline';
import right from '../assets/tooth3d/turntable-right.webp?inline';
import back from '../assets/tooth3d/turntable-back.webp?inline';

type Props={angle:number;zoom:boolean;onRotate:(angle:number)=>void;label:string};
const views=[front,right,back,right] as const;
const wrap=(angle:number)=>((angle%360)+360)%360;

/** Four source-derived views cover a full orbit; this is a visual preview, not a mesh. */
export default function PremiumTurntable({angle,zoom,onRotate,label}:Props){
  const drag=useRef<{x:number;angle:number}|null>(null);
  const current=wrap(angle);
  const frame=Math.round(current/90)%4;
  const rotate=(delta:number)=>onRotate(wrap(Math.round(angle/90)*90+delta));
  return <div className="premium-turntable" role="slider" tabIndex={0} aria-label={label}
    aria-valuemin={0} aria-valuemax={360} aria-valuenow={current}
    data-view-angle={frame*90} data-zoom={zoom}
    onPointerDown={e=>{drag.current={x:e.clientX,angle};e.currentTarget.setPointerCapture(e.pointerId)}}
    onPointerMove={e=>{if(drag.current)onRotate(wrap(drag.current.angle+(drag.current.x-e.clientX)*1.1))}}
    onPointerUp={e=>{if(!drag.current)return;const released=wrap(drag.current.angle+(drag.current.x-e.clientX)*1.1);drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);onRotate((Math.round(released/90)%4)*90)}}
    onPointerCancel={()=>{drag.current=null}}
    onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();rotate(90)}else if(e.key==='ArrowLeft'){e.preventDefault();rotate(-90)}}}>
    <img src={views[frame]} style={{transform:`scale(${zoom?1.17:1}) scaleX(${frame===3?-1:1})`}} alt="" draggable={false}/>
    <span className="turntable-angle">{frame*90}° / 360°</span>
  </div>;
}
