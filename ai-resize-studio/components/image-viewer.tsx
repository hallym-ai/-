"use client";
import {useCallback,useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from "react";

type Transform={zoom:number;x:number;y:number};
const initial:Transform={zoom:1,x:0,y:0};
const minZoom=1,maxZoom=4,step=0.25;

/** Zooming and panning affect only the preview, never the saved image. */
export default function ImageViewer({src,alt}:{src:string;alt:string}){
 const [view,setView]=useState<Transform>(initial),[dragging,setDragging]=useState(false);
 const viewport=useRef<HTMLDivElement>(null),image=useRef<HTMLImageElement>(null);
 const drag=useRef<{id:number;clientX:number;clientY:number;x:number;y:number}|null>(null);

 const clamp=useCallback((zoom:number,x:number,y:number):Transform=>{
  const pane=viewport.current,img=image.current;
  if(!pane||!img||zoom===1)return {zoom,x:0,y:0};
  const maxX=Math.max(0,(img.offsetWidth*zoom-pane.clientWidth)/2);
  const maxY=Math.max(0,(img.offsetHeight*zoom-pane.clientHeight)/2);
  return {zoom,x:Math.max(-maxX,Math.min(maxX,x)),y:Math.max(-maxY,Math.min(maxY,y))};
 },[]);
 const zoomBy=useCallback((delta:number,point?:{x:number;y:number})=>{
  setView(prev=>{
   const zoom=Math.max(minZoom,Math.min(maxZoom,Math.round((prev.zoom+delta)*100)/100));
   const ratio=zoom/prev.zoom;
   return clamp(zoom,point?point.x-(point.x-prev.x)*ratio:prev.x,point?point.y-(point.y-prev.y)*ratio:prev.y);
  });
 },[clamp]);
 useEffect(()=>{setView(initial);drag.current=null;setDragging(false);},[src]);
 useEffect(()=>{
  const pane=viewport.current;if(!pane)return;
  const wheel=(event:WheelEvent)=>{
   event.preventDefault();
   const r=pane.getBoundingClientRect();
   zoomBy(event.deltaY<0?step:-step,{x:event.clientX-r.left-r.width/2,y:event.clientY-r.top-r.height/2});
  };
  pane.addEventListener("wheel",wheel,{passive:false});
  return ()=>pane.removeEventListener("wheel",wheel);
 },[zoomBy]);
 useEffect(()=>{
  const update=()=>setView(prev=>clamp(prev.zoom,prev.x,prev.y));
  window.addEventListener("resize",update);return ()=>window.removeEventListener("resize",update);
 },[clamp]);
 function pointerDown(e:PointerEvent<HTMLDivElement>){
  if(view.zoom<=1||!e.isPrimary||(e.pointerType==="mouse"&&e.button!==0))return;
  drag.current={id:e.pointerId,clientX:e.clientX,clientY:e.clientY,x:view.x,y:view.y};
  e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);
 }
 function pointerMove(e:PointerEvent<HTMLDivElement>){
  const start=drag.current;if(!start||start.id!==e.pointerId)return;
  setView(prev=>clamp(prev.zoom,start.x+e.clientX-start.clientX,start.y+e.clientY-start.clientY));
 }
 function pointerEnd(e:PointerEvent<HTMLDivElement>){
  if(drag.current?.id!==e.pointerId)return;
  drag.current=null;setDragging(false);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 function keyDown(e:KeyboardEvent<HTMLDivElement>){
  if(view.zoom<=1)return;
  const delta:{[key:string]:[number,number]}={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
  const d=delta[e.key];if(!d)return;e.preventDefault();setView(prev=>clamp(prev.zoom,prev.x+d[0],prev.y+d[1]));
 }
 return <>
  <div ref={viewport} className={`image-dialog-view ${view.zoom>1?"zoomed":""} ${dragging?"dragging":""}`} tabIndex={0} aria-label="확대 이미지: 휠 또는 확대 축소 버튼으로 크기 조절, 확대 후 드래그 또는 방향키로 이동" onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={()=>{drag.current=null;setDragging(false);}}>
   <img ref={image} src={src} alt={alt} draggable={false} onLoad={()=>setView(prev=>clamp(prev.zoom,prev.x,prev.y))} style={{transform:`translate(${view.x}px, ${view.y}px) scale(${view.zoom})`}}/>
  </div>
  <div className="image-zoom-toolbar" role="group" aria-label="이미지 확대 축소">
   <span>확대/축소 <small>(화면 맞춤 100%)</small></span>
   <div className="image-zoom-steps"><button type="button" aria-label="축소" disabled={view.zoom<=minZoom} onClick={()=>zoomBy(-step)}>−</button><output aria-live="polite">{Math.round(view.zoom*100)}%</output><button type="button" aria-label="확대" disabled={view.zoom>=maxZoom} onClick={()=>zoomBy(step)}>＋</button></div>
   <button type="button" className="image-zoom-reset" aria-label="확대 및 위치 초기화" onClick={()=>setView(initial)} disabled={view.zoom===1&&view.x===0&&view.y===0}>초기화</button>
  </div>
 </>;
}
