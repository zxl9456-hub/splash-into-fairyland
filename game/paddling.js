import {riverHeight} from './surf.mjs';
import * as T from 'three';

export function resetPaddling(boat){
 const action=boat.userData.paddleAction;if(!action)return;
 action.reset().play();boat.userData.paddleMixer.update(0);
}
export function updatePaddling(boat,dt,game,braking,steer,frozen=false){
 const {paddleAction:action,paddleMixer:mixer}=boat.userData;if(!action)return;
 const active=game.status==='playing'&&!frozen;
 action.paused=!active;
 action.timeScale=T.MathUtils.clamp(.65+game.speed*.035+Math.abs(steer)*.16+(game.paddlingHard?.25:0),.65,1.7)*(braking?.55:1)*(game.jump>0?.5:1);
 if(active)mixer.update(dt);
 boat.updateMatrixWorld(true);
}

// Contact points are exported from the Blender paddle bone, so splashes follow
// the animated blades rather than a timer beside the boat.
export class PaddleWater{
 constructor(scene){
  this.points=new Map;this.clock=0;this.emissions=0;this.cursor=0;this.ringCursor=0;this.tmp=new T.Object3D;this.pos=new T.Vector3;
  this.particles=Array.from({length:64},()=>({life:0,p:new T.Vector3,v:new T.Vector3}));
  this.drops=new T.InstancedMesh(new T.SphereGeometry(.035,5,4),new T.MeshBasicMaterial({color:0xeafcff}),64);this.drops.frustumCulled=false;scene.add(this.drops);
  this.rings=Array.from({length:10},()=>{const m=new T.Mesh(new T.RingGeometry(.87,1,32),new T.MeshBasicMaterial({color:0xeaffff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return{m,life:0};});
 }
 reset(){this.points.clear();this.emissions=0;for(const p of this.particles)p.life=0;for(const r of this.rings){r.life=0;r.m.visible=false;}}
 splash(p){
  this.emissions++;const ring=this.rings[this.ringCursor++%this.rings.length];ring.life=.7;ring.m.position.set(p.x,riverHeight(-p.z)+.075,p.z);ring.m.visible=true;
  for(let j=0;j<7;j++){const q=this.particles[this.cursor++%this.particles.length],a=j/7*Math.PI*2+this.emissions*.7;q.life=.38+(j%3)*.07;q.p.set(p.x,riverHeight(-p.z)+.09,p.z);q.v.set(Math.cos(a)*(.35+j*.055),.7+(j%3)*.28,Math.sin(a)*(.35+j*.055));}
 }
 update(boat,dt,active){
  this.clock+=dt;
  if(active)for(const tip of boat.userData.bladeTips||[]){
   tip.getWorldPosition(this.pos);const state=this.points.get(tip.name)||{wet:false,last:-10};const wet=this.pos.y<riverHeight(-this.pos.z)+.12;
   if(wet&&(!state.wet||this.clock-state.last>.18)){this.splash(this.pos);state.last=this.clock;}
   state.wet=wet;this.points.set(tip.name,state);
  }
  for(let i=0;i<this.particles.length;i++){const p=this.particles[i];p.life=Math.max(0,p.life-dt);if(p.life){p.v.y-=3.7*dt;p.p.addScaledVector(p.v,dt);if(p.p.y<riverHeight(-p.p.z)+.06)p.life=0;}this.tmp.position.copy(p.p);this.tmp.scale.setScalar(p.life?Math.min(1,p.life*6):0);this.tmp.updateMatrix();this.drops.setMatrixAt(i,this.tmp.matrix);}this.drops.instanceMatrix.needsUpdate=true;
  for(const r of this.rings){r.life=Math.max(0,r.life-dt);r.m.visible=r.life>0;if(r.life){r.m.scale.setScalar(.14+(1-r.life/.7)*.6);r.m.material.opacity=r.life/.7*.48;}}
 }
}
