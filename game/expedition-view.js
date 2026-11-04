import {snowCoat} from './world-v2.js';
import {riverHeight} from './surf.mjs';
import * as T from 'three';
import {center,navigationHalfWidth,random} from './core.mjs';
import {passageAt} from './expedition.mjs';
import {seasonalPlants as P} from './season-scenery.js';
const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.48,...extra});
const glow=color=>new T.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});
function mesh(g,m,p=[0,0,0],s=[1,1,1]){const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=o.receiveShadow=true;return o;}
function cylinderBetween(a,b,r,m){const d=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r,r,d.length(),8),m);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}

export class ExpeditionView{
 constructor(scene,boat,game,A){
  this.scene=scene;this.boat=boat;this.A=A;this.gear=new T.Group;boat.add(this.gear);this.boatId=null;this.gates=[];this.passages=[];this.bosses=[];this.projectileMeshes=[];
  const gold=mat(0xcda461,{metalness:.65,roughness:.3});
  for(const gate of game.course.gates||[]){const g=new T.Group;g.position.set(center(gate.z)+gate.x,riverHeight(gate.z),-gate.z);const light=glow(gate.kind==='rush'?0x9df4e0:0xffdb89);const arc=mesh(new T.TorusGeometry(gate.radius+.2,.035,6,36,Math.PI),light,[0,.35,0]);g.add(arc);
   for(const side of[-1,1]){g.add(mesh(new T.CylinderGeometry(.065,.1,1.7,8),gold,[side*(gate.radius+.2),.75,0]));g.add(mesh(new T.SphereGeometry(.14,10,8),light,[side*(gate.radius+.2),1.65,0]));}
   scene.add(g);this.gates.push({gate,g,light});
  }
  for(const n of game.course.narrows||[]){const group=new T.Group,rng=random(n.from);for(let z=n.from;z<=n.to;z+=2.1){const p=passageAt(z,navigationHalfWidth(z),[n]);for(const side of[-1,1]){const x=(side<0?p.left:p.right)+side*.95,rock=A.rock(.9+rng()*.55);rock.position.set(center(z)+x,riverHeight(z)-.38,-z);rock.scale.y=1.3+rng();group.add(rock);if(n.from>900){const cap=snowCoat(rock);group.add(cap);for(let j=0;j<3;j++){const ice=P.icicle(.3+rng()*.5);ice.position.set(rock.position.x-side*.35,riverHeight(z)+.9,-z+j*.3);group.add(ice);}}}}scene.add(group);this.passages.push({n,group});}
  this.guard=mesh(new T.SphereGeometry(1,24,16),new T.MeshPhysicalMaterial({color:0xb5f5d9,transparent:true,opacity:.15,roughness:.12,metalness:.2,depthWrite:false,side:T.DoubleSide}),[0,1,0],[1.65,1.75,3.1]);boat.add(this.guard);this.guard.visible=false;
  this.pulse=mesh(new T.TorusGeometry(1,.055,8,48),glow(0xffed9d));this.pulse.rotation.x=-Math.PI/2;scene.add(this.pulse);
  this.danger=new T.Group;scene.add(this.danger);
  this.dangerRing=mesh(new T.RingGeometry(1.1,1.3,48),glow(0xffc86f));this.dangerRing.rotation.x=-Math.PI/2;this.dangerRing.position.y=.16;this.danger.add(this.dangerRing);
  this.dangerStripe=mesh(new T.PlaneGeometry(2.5,14),new T.MeshBasicMaterial({color:0xffb674,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false}),[0,.12,0]);this.dangerStripe.rotation.x=-Math.PI/2;this.danger.add(this.dangerStripe);
  this.hazardParts=new T.Group;this.danger.add(this.hazardParts);this.hazardKind=null;
  for(let i=0;i<10;i++){const orb=mesh(new T.SphereGeometry(.14,10,8),glow(0xa9faff));scene.add(orb);orb.visible=false;this.projectileMeshes.push(orb);}
  this.makeBranches(game);this.makeOutfit(game.boat);
 }
 makeBranches(game){this.snowBranches=[];for(const b of game.branches){const pivot=new T.Group;pivot.position.set(center(b.z)+b.side*7.2,riverHeight(b.z)+.3,-b.z);const trunk=cylinderBetween(new T.Vector3(),new T.Vector3(0,11,0),.35,this.A.materials.bark);pivot.add(trunk);
 for(let i=0;i<9;i++){const y=2+i*.9,twig=cylinderBetween(new T.Vector3(0,y,0),new T.Vector3((i%2?1:-1)*(1.1+i*.1),y+1.3,(i%3-1)*.7),.07,this.A.materials.bark);pivot.add(twig);const snow=P.snowCap(.6+i*.035);snow.position.set((i%2?1:-1)*.7,y+.55,0);snow.rotation.z=(i%2?1:-1)*.4;pivot.add(snow);}
 const dust=new T.Group;for(let i=0;i<24;i++){const flake=mesh(new T.SphereGeometry(.04+i%3*.015,5,4),P.materials.snow);dust.add(flake);}this.scene.add(pivot,dust);this.snowBranches.push({b,pivot,dust});}}
 makeOutfit(boat){if(this.boatId===boat.id)return;this.boatId=boat.id;this.gear.clear();const bronze=mat(0xc9a564,{metalness:.65}),color=mat(boat.color,{metalness:.18,roughness:.32});
  if(boat.id==='moss')for(const side of[-1,1]){const pontoon=mesh(new T.SphereGeometry(1,24,12),color,[side*1.15,.12,.15],[.28,.3,2.1]);this.gear.add(pontoon);for(const z of[-.7,1.15])this.gear.add(cylinderBetween(new T.Vector3(-1.2,.36,z),new T.Vector3(1.2,.36,z),.075,bronze));for(const z of[-1.4,.9]){const band=mesh(new T.TorusGeometry(.29,.025,6,24),bronze,[side*1.15,.12,z]);band.scale.y=1.05;this.gear.add(band);}}
  if(boat.id==='moon'){const crescent=mesh(new T.TorusGeometry(.55,.06,8,40,Math.PI*1.55),bronze,[0,.72,-2.2]);crescent.rotation.z=-.85;this.gear.add(crescent);for(const side of[-1,1]){const lantern=mesh(new T.OctahedronGeometry(.22),mat(0xc2d8fa,{emissive:0x7388d5,emissiveIntensity:.6}),[side*.72,.65,-.7]);this.gear.add(lantern);const hoop=mesh(new T.TorusGeometry(.28,.025,6,24),bronze,[side*.72,.65,-.7]);this.gear.add(hoop);}}
  if(boat.id==='feather')for(const side of[-1,1]){const fin=P.ginkgoLeaf(.32,0xf0ce80);fin.position.set(side*.54,.38,1.35);fin.rotation.y=side*.7;this.gear.add(fin);}
 }
 setDragon(template,game){
  for(const d of game.dragons){const g=new T.Group,body=template.clone(true);body.rotation.y=Math.PI/2;body.scale.multiplyScalar(1.05);g.add(body);const wingMat=new T.MeshPhysicalMaterial({color:d.id==='frost'?0x9dc9e4:d.id==='ember'?0xb96649:0x637f65,roughness:.48,side:T.DoubleSide,metalness:.08}),wings=[];
   for(const side of[-1,1]){const shape=new T.Shape;shape.moveTo(0,0);shape.lineTo(1.4,2.4);shape.lineTo(4.4,1.45);shape.quadraticCurveTo(2.9,1.15,3.4,-.6);shape.quadraticCurveTo(1.8,.25,1.5,-1);shape.lineTo(0,0);const wing=mesh(new T.ShapeGeometry(shape,16),wingMat,[side*.5,1.5,.6]);wing.scale.x=side;g.add(wing);wings.push(wing);for(const tip of[[1.4,2.4,0],[4.4,1.45,0],[1.5,-1,0]])wing.add(cylinderBetween(new T.Vector3(),new T.Vector3(...tip),.045,mat(0xc2aa78)));}
   const flame=mesh(new T.ConeGeometry(.75,9,14,1,true),glow(0xffa96c),[0,1.1,4]);flame.rotation.x=Math.PI/2;g.add(flame);sceneAdd(this.scene,g);
   const stripe=mesh(new T.PlaneGeometry(2.6,32),new T.MeshBasicMaterial({color:0xf4a477,transparent:true,opacity:.23,side:T.DoubleSide,depthWrite:false}));stripe.rotation.x=-Math.PI/2;this.scene.add(stripe);
   this.bosses.push({id:d.id,g,wings,flame,stripe});
  }
 }
 makeHazard(kind){this.hazardKind=kind;this.hazardParts.clear();const rng=random(42);
  if(kind==='rockfall'||kind==='avalanche')for(let i=0;i<9;i++){const rock=kind==='rockfall'?this.A.rock(.35+rng()*.4):mesh(new T.IcosahedronGeometry(.5+rng()*.5,2),P.materials.snow);this.hazardParts.add(rock);}
  if(kind==='lightning'){const pts=[];for(let i=0;i<10;i++)pts.push(new T.Vector3((rng()-.5)*.7,10-i*1.1,0));const bolt=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),30,.075,5,false),glow(0xd8e9ff));this.hazardParts.add(bolt);}
  if(kind==='leafstorm')for(let i=0;i<60;i++){const leaf=i%3?P.mapleLeaf(.22+rng()*.25,[0xd48131,0xc34c28,0xe6b83f][i%3]):P.ginkgoLeaf(.35,0xf1ca5a);this.hazardParts.add(leaf);}
 }
 update(game,time){
  this.makeOutfit(game.boat);for(const {n,group}of this.passages)group.visible=n.to>game.z-20&&n.from<game.z+100;
  for(const {gate,g,light}of this.gates){g.visible=gate.z>game.z-7&&gate.z<game.z+100;light.color.setHex(game.gateHits.has(gate.id)?0x91ffb6:game.gateMisses.has(gate.id)?0x8c8a7c:gate.kind==='rush'?0xa3f3ec:0xffd17d);light.opacity=.7+Math.sin(time*2+gate.z)*.15;}
  this.guard.visible=game.guard>0;this.guard.material.opacity=.1+Math.sin(time*5)*.035;
  this.pulse.visible=game.counterFlash>0||game.skillFlash>0||game.landingFlash>0;this.pulse.position.copy(this.boat.position);this.pulse.position.y=riverHeight(game.z)+.2;this.pulse.scale.setScalar(1+(1-Math.max(game.counterFlash,game.skillFlash,game.landingFlash)/.7)*5);this.pulse.material.opacity=Math.max(game.counterFlash,game.skillFlash,game.landingFlash);
  for(const v of this.bosses){const d=game.dragons.find(d=>d.id===v.id),active=game.activeDragon===d;v.g.visible=active||(d.phase==='defeated'&&d.age<1.5);v.stripe.visible=active&&(d.phase==='windup'||d.phase==='breath');if(!v.g.visible)continue;
   const defeat=d.phase==='defeated';v.g.position.set(center(game.z+24)+Math.sin(time*.8)*1.2,riverHeight(game.z+24)+2.8+Math.sin(time*1.7)*.35+(defeat?d.age*9:0),-game.z-24-(defeat?d.age*8:0));v.g.rotation.y=Math.sin(time*.6)*.12;
   v.wings.forEach((w,i)=>w.rotation.y=(i?1:-1)*(.2+Math.sin(time*4)*.35));v.flame.visible=d.phase==='breath';v.flame.scale.setScalar(.6+Math.sin(d.age*40)*.18);
   const perfect=d.phase==='windup'&&d.age>=1.15;v.stripe.material.color.setHex(perfect?0xa4ffdb:0xff9c6d);v.stripe.material.opacity=d.phase==='breath'?.36:.13+Math.sin(time*10)*.04;v.stripe.position.set(center(game.z+8)+d.lane,riverHeight(game.z+8)+.15,-game.z-8);
  }
  this.projectileMeshes.forEach((m,i)=>{const p=game.projectiles[i];m.visible=!!p;if(!p)return;const t=Math.min(1,p.age/p.duration);m.position.set(T.MathUtils.lerp(center(p.fromZ)+p.fromX,center(p.targetZ)+p.targetX,t),T.MathUtils.lerp(riverHeight(p.fromZ),riverHeight(p.targetZ),t)+.9+Math.sin(t*Math.PI)*2+2*t,T.MathUtils.lerp(-p.fromZ,-p.targetZ,t));m.scale.setScalar(p.reflected?2.4:1.2);m.material.color.setHex(p.reflected?0xffe7a0:0xb4eaff);});
  for(const v of this.snowBranches){const b=game.branches.find(b=>b.id===v.b.id),near=Math.abs(b.z-game.z)<100;v.pivot.visible=near;v.dust.visible=near&&['bending','falling'].includes(b.phase);const bend=b.phase==='bending'?Math.min(1,b.age/b.limit):0,fall=b.phase==='falling'?Math.min(1,b.age/.65):['fallen','done'].includes(b.phase)?1:0;v.pivot.rotation.z=b.side*(b.phase==='sleep'?.08:b.phase==='bending'?.08+bend*.26:.34+fall*1.22);v.dust.position.copy(v.pivot.position);v.dust.children.forEach((o,i)=>{const t=(time*.8+i/24)%1;o.position.set(-b.side*(.5+t*3),7-t*7,Math.sin(i*3)*1.3);});}
  const d=game.activeDisaster;this.danger.visible=!!d;if(!d)return;if(this.hazardKind!==d.kind)this.makeHazard(d.kind);this.danger.position.set(center(game.z)+d.lane,riverHeight(game.z),-game.z-1);this.dangerRing.scale.setScalar(1.1+Math.sin(time*10)*.1);this.dangerRing.material.opacity=d.phase==='warning'?.8:.25;this.dangerStripe.material.color.setHex(d.kind==='avalanche'||d.kind==='lightning'?0xa7d5fa:0xffb36d);this.hazardParts.visible=d.phase==='strike';
  this.hazardParts.children.forEach((o,i)=>{const t=d.age;
   if(d.kind==='rockfall'){o.position.set(Math.sin(i*7)*.85,Math.max(.1,9-t*18)+(i%3)*.3,Math.cos(i*5)*1.2);o.rotation.set(t+i,t*.5,i);}
   if(d.kind==='avalanche'){o.position.set(d.side*(1-t)*7+Math.sin(i*7),.3+Math.abs(Math.sin(t*8+i))*.6,Math.cos(i*5)*2);o.rotation.x=t*8;}
   if(d.kind==='leafstorm'){const h=(i/60*7+time*.6)%7,a=i*2.399+time*4,r=.5+h*.3;o.position.set(Math.cos(a)*r,h,Math.sin(a)*r);o.rotation.set(a,h,a*.5);}
  });
 }
}
function sceneAdd(scene,o){scene.add(o);}
