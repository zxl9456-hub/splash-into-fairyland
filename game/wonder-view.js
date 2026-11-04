import {riverHeight} from './surf.mjs';
import * as T from 'three';
import {center} from './core.mjs';
import {seasonalPlants as P} from './season-scenery.js';
const gold=new T.MeshPhysicalMaterial({color:0xf9d981,emissive:0xbe7d20,emissiveIntensity:.45,metalness:.55,roughness:.3});
const glow=new T.MeshBasicMaterial({color:0xffefb6,transparent:true,opacity:.75,depthWrite:false});
const put=(g,geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
export class WonderView{
 constructor(scene,items){this.items=items.map(w=>{const g=new T.Group();g.position.set(center(w.z)+w.x,riverHeight(w.z),-w.z);const aura=put(g,new T.TorusGeometry(w.radius,.025,6,56),glow,0,.04);aura.rotation.x=-Math.PI/2;
  if(w.kind==='chime'){
   put(g,new T.TorusGeometry(1.65,.045,8,64),gold,0,1.65);
   for(let i=0;i<7;i++){const a=Math.PI*i/6,flower=P.lotus(.13);flower.position.set(Math.cos(a)*1.65,1.65+Math.sin(a)*1.65,0);g.add(flower);}
   put(g,new T.CylinderGeometry(.035,.035,.5,8),gold,0,2.8);put(g,new T.SphereGeometry(.09,12,8),gold,0,2.55);
  }else if(w.kind==='lotus'){const leaf=P.lotusLeaf(.85);g.add(leaf);const fly=P.dragonfly(.35);fly.position.set(0,1.8,0);g.add(fly);g.userData.fly=fly;
  }else if(w.kind==='watch'){
   put(g,new T.TorusGeometry(.52,.085,12,48),gold,0,1.25);
   const face=put(g,new T.CircleGeometry(.49,48),new T.MeshStandardMaterial({color:0xfff3d9,side:T.DoubleSide}),0,1.25,.015);
   put(g,new T.BoxGeometry(.035,.32,.035),gold,0,1.4,.04);put(g,new T.BoxGeometry(.25,.035,.035),gold,.1,1.25,.04);put(g,new T.TorusGeometry(.17,.035,8,24),gold,0,1.97);
  }else{
   put(g,new T.CylinderGeometry(.35,.44,.09,8),gold,0,.7);put(g,new T.ConeGeometry(.48,.26,8),gold,0,1.72);
   for(const x of[-.29,.29])for(const z of[-.29,.29])put(g,new T.CylinderGeometry(.025,.025,.9,6),gold,x,1.2,z);
   put(g,new T.SphereGeometry(.2,12,10),new T.MeshBasicMaterial({color:0xffd078}),0,1.16);put(g,new T.TorusGeometry(.15,.025,8,24),gold,0,2);
  }
  scene.add(g);return {w,g,aura};});
 }
 update(game,t){for(const {w,g,aura}of this.items){g.visible=!game.wonders.has(w.id)&&w.z>game.z-8&&w.z<game.z+110;if(!g.visible)continue;aura.scale.setScalar(1+Math.sin(t*2)*.045);if(w.kind==='watch'||w.kind==='lantern')g.position.y=riverHeight(w.z)+Math.sin(t*1.6)*.12;if(g.userData.fly){const f=g.userData.fly;f.position.y=1.8+Math.sin(t*3)*.15;for(const wing of f.userData.wings||[])wing.rotation.z=wing.userData.side*Math.sin(t*43)*.24;}}}
}
