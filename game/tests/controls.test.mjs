import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoatControls} from '../controls.mjs';
class Element extends EventTarget{
 constructor(){super();this.classList={add(){},remove(){},toggle(){}};this.attributes={};}
 setAttribute(k,v){this.attributes[k]=v;}
 setPointerCapture(){throw new Error('Capture unavailable in embedded webview');}
}
function fixture(pointer=true){
 let time=0,playing=true;const host=new Element(),canvas=new Element(),buttons={left:new Element(),right:new Element(),brake:new Element(),paddle:new Element()};
 host.PointerEvent=pointer?function(){}:undefined;
 const controls=createBoatControls({canvas,buttons,host,now:()=>time,active:()=>playing});
 const emit=(target,type,props={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
 return {host,canvas,buttons,controls,emit,advance(ms){time+=ms;},pause(){playing=false;}};
}
test('pointer capture failure still steers; releasing outside ends a hold',()=>{
 const f=fixture();f.emit(f.buttons.left,'pointerdown',{pointerId:1,button:0});assert.equal(f.controls.sample().steer,-1);
 f.advance(500);f.emit(f.host,'pointerup',{pointerId:1});assert.equal(f.controls.sample().steer,0);f.controls.dispose();
});
test('a complete quick tap between frames remains effective briefly, then stops',()=>{
 const f=fixture();f.emit(f.buttons.brake,'pointerdown',{pointerId:1,button:0});f.advance(30);f.emit(f.host,'pointerup',{pointerId:1});
 assert.equal(f.controls.sample().brake,true);f.advance(300);assert.equal(f.controls.sample().brake,false);f.controls.dispose();
});
test('accessibility click without pointer events creates a paddle pulse',()=>{
 const f=fixture();f.emit(f.buttons.paddle,'click');assert.equal(f.controls.sample().paddle,true);f.advance(300);assert.equal(f.controls.sample().paddle,false);f.controls.dispose();
});
test('releasing one finger never releases a second finger on the same control',()=>{
 const f=fixture();for(const pointerId of[1,2])f.emit(f.buttons.left,'pointerdown',{pointerId,button:0});f.advance(500);
 f.emit(f.host,'pointerup',{pointerId:1});assert.equal(f.controls.sample().steer,-1);f.emit(f.host,'pointercancel',{pointerId:2});assert.equal(f.controls.sample().steer,0);f.controls.dispose();
});
test('touch-only steering and paddling work together and cancellation clears only that finger',()=>{
 const f=fixture(false);f.emit(f.buttons.right,'touchstart',{changedTouches:[{identifier:4}]});f.emit(f.buttons.paddle,'touchstart',{changedTouches:[{identifier:5}]});
 assert.deepEqual(f.controls.sample(),{steer:1,brake:false,paddle:true});f.advance(500);f.emit(f.host,'touchcancel',{changedTouches:[{identifier:4}]});
 assert.deepEqual(f.controls.sample(),{steer:0,brake:false,paddle:true});f.emit(f.host,'touchend',{changedTouches:[{identifier:5}]});assert.equal(f.controls.sample().paddle,false);f.controls.dispose();
});
test('drag capture loss and a new-game reset remove stale steering',()=>{
 const f=fixture();f.emit(f.canvas,'pointerdown',{pointerId:7,button:0,clientX:100});f.emit(f.canvas,'pointermove',{pointerId:7,clientX:140});assert(f.controls.sample().steer>.5);
 f.emit(f.canvas,'lostpointercapture',{pointerId:7});assert.equal(f.controls.sample().steer,0);
 f.emit(f.canvas,'pointerdown',{pointerId:8,button:0,clientX:100});f.emit(f.canvas,'pointermove',{pointerId:8,clientX:40});f.controls.reset();assert.equal(f.controls.sample().steer,0);f.controls.dispose();
});
test('older mouse events have a fallback and release beyond the button',()=>{
 const f=fixture(false);f.emit(f.buttons.right,'mousedown',{button:0});assert.equal(f.controls.sample().steer,1);f.advance(600);f.emit(f.host,'mouseup');assert.equal(f.controls.sample().steer,0);f.controls.dispose();
});
test('pause and blur cancel held buttons; menu clicks never move the boat',()=>{
 const f=fixture();f.emit(f.buttons.paddle,'click');f.emit(f.host,'blur');assert.equal(f.controls.sample().paddle,false);
 f.emit(f.buttons.left,'pointerdown',{pointerId:1,button:0});f.pause();assert.deepEqual(f.controls.sample(),{steer:0,brake:false,paddle:false});f.emit(f.buttons.paddle,'click');assert.equal(f.controls.sample().paddle,false);f.controls.dispose();
});
