import {riverHeight} from './surf.mjs';
import * as T from 'three';
import {seasonWeights} from './season-flow.mjs';
import {center,random} from './core.mjs';
import {createSeasonBotanicals} from './season-botanicals.js';
import {createSeasonLandmarks} from './season-landmarks.js';

export const seasonalPlants=createSeasonBotanicals();
const P=seasonalPlants,TAU=Math.PI*2;
const autumnColors=[0xe8bd47,0xca5934,0xdc8737,0xf1c951,0xa93626];
const ground=(off,z)=>.35+Math.max(0,off-6)*.15+Math.sin(z*.16+off)*.2;
function at(o,z,x,y=0,angle=0){o.position.set(center(z)+x,y,-z);o.rotation.y=angle;return o;}
function rod(points,r,material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,28,r,8,false),material);m.castShadow=m.receiveShadow=true;return m;}
function snowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,30);g.addColorStop(0,'#fff');g.addColorStop(.3,'#ffffffef');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);}

export class SeasonScenery{
 constructor(scene,bake){this.scene=scene;this.bake=bake;this.landmarks=createSeasonLandmarks();this.dragonflies=[];this.watches=[];this.streams=[];this.lamps=[];this.floating=[];this.dummy=new T.Object3D();this.makeWeather();}
 buildChunk(a,b,season){const root=new T.Group(),staticGroup=new T.Group(),rng=random(a+6901);
  if(season===1){
   for(const side of[-1,1]){
    for(let i=0;i<10;i++){const z=a+3+i*5.9,off=7.8+rng()*5.5,s=.8+rng()*1.05;if(side<0&&[327,507].some(c=>Math.abs(c-z)<7))continue;const flower=P.lotus(s);flower.rotation.z=side*.24;staticGroup.add(at(flower,z,side*off,ground(off,z)-.3,rng()*TAU));}
    for(let i=0;i<12;i++){const z=a+rng()*60,off=5.8+rng()*5,leaf=P.lotusLeaf(.9+rng()*.7);leaf.rotation.z=side*.06;staticGroup.add(at(leaf,z,side*off,.03+rng()*.2,rng()*TAU));}
    for(let i=0;i<5;i++){const z=a+8+i*11,off=8+rng()*5,height=5+rng()*4,x=center(z)+side*off;staticGroup.add(rod([[x,0,-z],[x-side*.4,height*.5,-z],[x-side*1.6,height,-z]],.09,P.materials.stem));const leaf=P.lotusLeaf(2.2+rng()*.8);leaf.rotation.z=-side*.22;staticGroup.add(at(leaf,z,side*(off-1.6),height,rng()*TAU));}
   }
   for(let i=0;i<4;i++){const z=a+9+i*14,o=P.dragonfly(.65+rng()*.4),x=(i%2?1:-1)*(2+rng()*4),y=1.5+rng()*3;root.add(at(o,z,x,y));this.dragonflies.push({o,z,x,y,phase:rng()*TAU});}
   if(a===300||a===480){const z=a+27,can=at(this.landmarks.wateringCan(),z,-13,.7,.08);can.userData.landmark=true;root.add(can);this.addSprinkler(root,can,z);}
   if(a===360||a===540)staticGroup.add(at(this.landmarks.woodBridge(),a+38,0,0));
  }
  if(season===2){
   for(const side of[-1,1])for(let i=0;i<32;i++){const z=a+rng()*60,x=side*(5+rng()*13),y=10+rng()*7,leaf=i%3?P.mapleLeaf(1.5+rng()*1.8,autumnColors[i%5]):P.ginkgoLeaf(2+rng(),0xefc55a);leaf.rotation.x=(rng()-.5)*.8;leaf.rotation.z=side*.3;staticGroup.add(at(leaf,z,x,y,rng()*TAU));}
   for(let i=0;i<225;i++){const z=a+rng()*60,side=i%2?1:-1,off=6+rng()*13,leaf=i%3?P.mapleLeaf(.3+rng()*.55,autumnColors[i%5]):P.ginkgoLeaf(.45+rng()*.6,0xe8bc45);leaf.rotation.x=(rng()-.5)*.45;leaf.rotation.z=(rng()-.5)*.3;staticGroup.add(at(leaf,z,side*off,ground(off,z)+.13,rng()*TAU));}
   for(let i=0;i<24;i++){const z=a+i*2.45+1,x=(rng()-.5)*9,o=i%2?P.mapleLeaf(.35+rng()*.5,autumnColors[i%5]):P.ginkgoLeaf(.4+rng()*.45,0xf0c75b);root.add(at(o,z,x,.11,rng()*TAU));this.floating.push({o,z,x,phase:rng()*TAU,angle:o.rotation.y});}
   if(a===600||a===780){const z=a+28,watch=at(this.landmarks.pocketWatch(),z,10.7,.7,-.4);watch.rotation.z=-.14;watch.userData.landmark=true;root.add(watch);this.watches.push(watch);}
   if(a===600||a===720||a===840)staticGroup.add(at(this.landmarks.rootArch(),a+46,0,0,-.04));
  }
  if(season===3){
   // Frosted seed heads and finer icicle curtains bridge the foreground and banks.
   for(const side of[-1,1])for(let i=0;i<24;i++){const z=a+i*2.5,off=6.2+rng()*2.5,x=center(z)+side*off,h=.7+rng()*1.2;const twigMat=P.materials.snow;staticGroup.add(rod([[x,ground(off,z),-z],[x+side*.12,h,-z],[x+side*.2,h+.4,-z]],.022,twigMat));for(let k=0;k<3;k++){const a=k*2.4;staticGroup.add(rod([[x,h*.7,-z],[x+Math.sin(a)*.34,h+.22,-z+Math.cos(a)*.34]],.015,twigMat));}if(i%2===0)for(let q=0;q<5;q++){const ic=P.icicle(.2+rng()*.38);staticGroup.add(at(ic,z+q*.17,side*(5.5+rng()*.2),.38));}}

   for(let i=0;i<45;i++){const z=a+rng()*60,side=i%2?1:-1,off=6.4+rng()*9,cap=P.snowCap(1.1+rng()*2);cap.scale.y*=1.4;staticGroup.add(at(cap,z,side*off,ground(off,z)-.1,rng()*TAU));}
   for(const side of[-1,1])for(let i=0;i<16;i++){const z=a+i*3.75,off=5.85+Math.sin(z*.3)*.5;const shelf=P.snowCap(1.1);shelf.scale.set(1.15,.26,1.8);staticGroup.add(at(shelf,z,side*off,.09));if(i%2===0){const icicle=P.icicle(.6+rng()*.4);staticGroup.add(at(icicle,z,side*(off-.45),.3));}}
   for(let i=0;i<14;i++){const z=a+rng()*60,side=i%2?1:-1,height=1.5+rng()*3;const ice=new T.Mesh(new T.CylinderGeometry(.06,.55,height,6),P.materials.ice);ice.rotation.z=side*(.1+rng()*.15);staticGroup.add(at(ice,z,side*(8+rng()*9),height*.5+.5,rng()*TAU));}
   if(a===900||a===1080){const z=a+24,lamp=at(this.landmarks.lantern(),z,-10,.9,.24);lamp.userData.landmark=true;root.add(lamp);this.lamps.push({o:lamp,z,light:lamp.userData.light});}
   if(a===900||a===1020||a===1080||a===1140)staticGroup.add(at(this.landmarks.rootArch({snow:true}),a+48,0,0));
  }
  // Stochastic spatial blending retains full-opacity petals and avoids ghosted models.
  for(const parent of[staticGroup,root])for(const o of[...parent.children]){if(o.userData.landmark)continue;const box=new T.Box3().setFromObject(o),v=box.getCenter(new T.Vector3()),z=-v.z,weight=seasonWeights(z)[season],h=Math.sin(z*73.31+v.x*17.17+season*53.7)*43758.5453;if(h-Math.floor(h)>weight)parent.remove(o);}
  for(const o of root.children)o.position.y+=riverHeight(-o.position.z);root.add(this.bake(staticGroup));return root;
 }
 addSprinkler(root,can,z){can.updateMatrixWorld(true);const points=can.userData.spouts||[],startPoints=points.filter((_,i)=>i%2===0),waterMat=new T.MeshPhysicalMaterial({color:0xc6eef0,roughness:.12,metalness:.12,clearcoat:1,transparent:true,opacity:.76,depthWrite:false});const streams=new T.Group();const ends=[];
  for(let i=0;i<startPoints.length;i++){const start=startPoints[i].clone().applyMatrix4(can.matrixWorld),end=new T.Vector3(center(z)-3.6+Math.sin(i*5)*.45,.08,start.z+(i/startPoints.length-.5)*2);const mid=start.clone().lerp(end,.5);mid.y=start.y*.76;const stream=rod([start,mid,end],.025+(i%3)*.008,waterMat);stream.castShadow=false;streams.add(stream);ends.push({start,end});}
  root.add(this.bake(streams));const positions=new Float32Array(Math.max(1,ends.length)*12*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));const spray=new T.Points(geometry,new T.PointsMaterial({color:0xe7ffff,size:.055,transparent:true,opacity:.85,depthWrite:false,map:snowTexture()}));spray.geometry.userData.chunkOwned=true;spray.userData.ownedMaterials=[spray.material];spray.frustumCulled=false;root.add(spray);this.streams.push({z,spray,ends});
 }
 makeWeather(){const rng=random(3149);this.flakes=Array.from({length:720},()=>({x:(rng()-.5)*36,y:rng()*23,z:12-rng()*105,speed:.7+rng()*1.1,phase:rng()*TAU}));this.snow=new T.InstancedMesh(new T.PlaneGeometry(.19,.19),new T.MeshBasicMaterial({color:0xffffff,map:snowTexture(),transparent:true,opacity:.86,depthWrite:false,side:T.DoubleSide}),this.flakes.length);this.snow.instanceMatrix.setUsage(T.DynamicDrawUsage);this.snow.frustumCulled=false;this.snow.visible=false;this.scene.add(this.snow);
  this.leaves=[];for(let kind=0;kind<3;kind++){const count=56,prototype=kind===2?P.ginkgoLeaf(1,0xe9c34f):P.mapleLeaf(1,kind===0?0xdf9e3c:0xc74c30),source=prototype.children[0],inst=new T.InstancedMesh(source.geometry,source.material,count);inst.instanceMatrix.setUsage(T.DynamicDrawUsage);inst.castShadow=false;inst.frustumCulled=false;inst.visible=false;this.scene.add(inst);this.leaves.push({inst,items:Array.from({length:count},()=>({x:(rng()-.5)*29,y:rng()*18,z:8-rng()*90,s:.25+rng()*.65,phase:rng()*TAU,speed:.5+rng()*.6}))});}
 }
 releaseChunk(root){const descendants=new Set();root.traverse(o=>descendants.add(o));for(const key of ['dragonflies','floating','lamps'])this[key]=this[key].filter(v=>!descendants.has(v.o));this.watches=this.watches.filter(o=>!descendants.has(o));this.streams=this.streams.filter(v=>!descendants.has(v.spray));}
 update(z,time,season){
  for(const d of this.dragonflies){if(Math.abs(d.z-z)>100)continue;d.o.position.set(center(d.z)+d.x+Math.sin(time*.7+d.phase)*1.3,riverHeight(d.z)+d.y+Math.sin(time*1.9+d.phase)*.25,-d.z+Math.cos(time*.45+d.phase)*1.6);d.o.rotation.y=Math.sin(time*.6+d.phase)*.5;for(const wing of d.o.userData.wings)wing.rotation.z=wing.userData.side*Math.sin(time*43+d.phase)*.24;}
  for(const f of this.floating){if(Math.abs(f.z-z)>100)continue;f.o.position.set(center(f.z)+f.x+Math.sin(time*.25+f.phase)*.24,riverHeight(f.z)+.105+Math.sin(time*1.4+f.phase)*.025,-f.z+Math.sin(time*.18+f.phase)*.65);f.o.rotation.y=f.angle+Math.sin(time*.23+f.phase)*.24;f.o.rotation.x=Math.sin(time*.8+f.phase)*.035;f.o.rotation.z=Math.sin(time+f.phase)*.04;}
  for(const watch of this.watches){const hands=watch.userData.hands;if(hands?.minute)hands.minute.rotation.z=-time*.04;if(hands?.hour)hands.hour.rotation.z=-time*.004;}
  for(const lamp of this.lamps)if(lamp.light)lamp.light.visible=Math.abs(lamp.z-z)<75;
  for(const flow of this.streams){if(Math.abs(flow.z-z)>110||!flow.ends.length)continue;const p=flow.spray.geometry.attributes.position;for(let i=0;i<p.count;i++){const f=flow.ends[Math.floor(i/12)%flow.ends.length],t=(time*1.7+(i%12)/12)%1;const x=f.end.x+Math.sin(i*5.3)*t*.8,y=riverHeight(flow.z)+.08+Math.sin(t*Math.PI)*.48,zz=f.end.z+Math.cos(i*3.7)*t*.8;p.setXYZ(i,x,y,zz);}p.needsUpdate=true;}
  this.snow.visible=seasonWeights(z+105)[3]>.001;if(this.snow.visible){this.snow.position.set(center(z),0,-z);this.flakes.forEach((f,i)=>{this.dummy.position.set(f.x+Math.sin(time*.4+f.phase)*1.1,riverHeight(z-f.z)+((f.y-time*f.speed)%23+23)%23,f.z);this.dummy.rotation.set(0,0,f.phase+time*.1);const weight=seasonWeights(z-f.z)[3];this.dummy.scale.setScalar((.7+(i%5)*.3)*Math.min(1,Math.max(0,(weight-i/this.flakes.length)*12)));this.dummy.updateMatrix();this.snow.setMatrixAt(i,this.dummy.matrix);});this.snow.instanceMatrix.needsUpdate=true;}
  for(const {inst,items}of this.leaves){inst.visible=Math.max(seasonWeights(z)[2],seasonWeights(z+90)[2])>.001;if(!inst.visible)continue;inst.position.set(center(z),0,-z);items.forEach((f,i)=>{this.dummy.position.set(f.x+Math.sin(time*.55+f.phase)*1.8,riverHeight(z-f.z)+Math.max(.1,((f.y-time*f.speed)%22+22)%22-4),f.z+Math.sin(time*.3+f.phase));this.dummy.rotation.set(Math.sin(time*1.4+f.phase)*1.15,time*.55+f.phase,Math.cos(time*1.8+f.phase)*.7);const weight=seasonWeights(z-f.z)[2];this.dummy.scale.setScalar(f.s*Math.min(1,Math.max(0,(weight-i/items.length)*10)));this.dummy.updateMatrix();inst.setMatrixAt(i,this.dummy.matrix);});inst.instanceMatrix.needsUpdate=true;}
 }
}
