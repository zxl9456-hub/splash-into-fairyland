// Each finger owns its input. Releasing one finger must not cancel another.
export function createBoatControls({canvas,buttons,active,host=window,now=()=>performance.now()}){
 const held=new Map(),pulses=new Map(),listeners=[];let drag=null,lastGesture=-Infinity,lastTouch=-Infinity;
 const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 const prevent=e=>{if(e.cancelable)e.preventDefault();};
 const capture=(el,id)=>{try{if(typeof el.setPointerCapture==='function')el.setPointerCapture(id);}catch(e){/* Window release handlers provide the fallback. */}};
 const pulse=(action,ms=260)=>pulses.set(action,Math.max(pulses.get(action)||0,now()+ms));
 function press(key,action,e){if(!active())return;prevent(e);held.set(key,{action,at:now()});lastGesture=now();}
 function release(key,cancel=false){const v=held.get(key);if(v){held.delete(key);if(!cancel&&active()&&now()-v.at<180)pulse(v.action);lastGesture=now();}if(drag&&drag.key===key)drag=null;}
 function startDrag(key,x,e){if(!active()||drag)return;prevent(e);drag={key,start:x,value:0};}
 function moveDrag(key,x,e){if(drag&&drag.key===key){prevent(e);drag.value=Math.max(-1,Math.min(1,(x-drag.start)/65));}}
 for(const [action,element]of Object.entries(buttons)){
  on(element,'pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;press('p'+e.pointerId,action,e);capture(element,e.pointerId);});
  on(element,'lostpointercapture',e=>release('p'+e.pointerId,true));
  on(element,'touchstart',e=>{lastTouch=now();for(const t of Array.from(e.changedTouches||[]))press('t'+t.identifier,action,e);},{passive:false});
  on(element,'mousedown',e=>{if(!host.PointerEvent&&now()-lastTouch>700&&e.button===0)press('mouse',action,e);});
  // Accessibility/bridge-generated clicks may have no pointer/touch sequence.
  on(element,'click',e=>{if(!active())return;prevent(e);if(now()-lastGesture>500)pulse(action);});
 }
 on(canvas,'pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;startDrag('p'+e.pointerId,e.clientX,e);capture(canvas,e.pointerId);});
 on(canvas,'pointermove',e=>moveDrag('p'+e.pointerId,e.clientX,e));
 on(canvas,'lostpointercapture',e=>release('p'+e.pointerId,true));
 on(canvas,'touchstart',e=>{lastTouch=now();for(const t of Array.from(e.changedTouches||[]))startDrag('t'+t.identifier,t.clientX,e);},{passive:false});
 on(canvas,'touchmove',e=>{for(const t of Array.from(e.changedTouches||[]))moveDrag('t'+t.identifier,t.clientX,e);},{passive:false});
 on(canvas,'mousedown',e=>{if(!host.PointerEvent&&now()-lastTouch>700&&e.button===0)startDrag('mouse',e.clientX,e);});
 on(host,'mousemove',e=>moveDrag('mouse',e.clientX,e));
 on(host,'pointerup',e=>release('p'+e.pointerId));on(host,'pointercancel',e=>release('p'+e.pointerId,true));
 on(host,'mouseup',()=>release('mouse'));
 on(host,'touchend',e=>{for(const t of Array.from(e.changedTouches||[]))release('t'+t.identifier);});
 on(host,'touchcancel',e=>{for(const t of Array.from(e.changedTouches||[]))release('t'+t.identifier,true);});
 function reset(){held.clear();pulses.clear();drag=null;for(const b of Object.values(buttons)){b.classList.remove('held');b.setAttribute('aria-pressed','false');}}
 on(host,'blur',reset);
 function sample(){
  if(!active()){reset();return{steer:0,brake:false,paddle:false};}
  const down=new Set();for(const v of held.values())down.add(v.action);
  for(const [action,until]of pulses)if(until>now())down.add(action);else pulses.delete(action);
  for(const [action,b]of Object.entries(buttons)){const v=down.has(action);b.classList.toggle('held',v);b.setAttribute('aria-pressed',String(v));}
  const steer=down.has('left')||down.has('right')?Number(down.has('right'))-Number(down.has('left')):drag?drag.value:0;
  return{steer,brake:down.has('brake'),paddle:down.has('paddle')};
 }
 return{sample,reset,dispose(){reset();for(const off of listeners)off();}};
}
