import {riverHeight} from './surf.mjs';
import * as T from 'three';
import {center} from './core.mjs';
export class CurrentView{
 constructor(scene,zones){this.items=zones.map(f=>{const group=new T.Group,foam=new T.MeshBasicMaterial({color:0xebffff,transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false});const marks=[];if(f.kind==='rapids'){const arc=new T.RingGeometry(.3,.32,20,1,0,Math.PI*1.6);for(let i=0;i<32;i++){const m=new T.Mesh(arc,foam);m.rotation.x=-Math.PI/2;m.scale.set(.7,1.8,1);group.add(m);marks.push(m);}}
 else{const pts=[];for(let i=0;i<180;i++){const t=i/179,a=t*Math.PI*8,r=.25+t*2.2;pts.push(new T.Vector3(Math.cos(a)*r,.11+Math.sin(a)*.008,Math.sin(a)*r));}group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),180,.025,4,false),foam));group.position.set(center((f.from+f.to)/2)+f.x,riverHeight((f.from+f.to)/2),-(f.from+f.to)/2);}
 scene.add(group);return {f,group,marks};});}
 update(game,time){for(const {f,group,marks}of this.items){group.visible=f.to>game.z-20&&f.from<game.z+100;if(!group.visible)continue;if(f.kind==='whirlpool'){group.rotation.y=-time*.7;continue;}marks.forEach((m,i)=>{const z=f.from+((time*12+i*1.7)%(f.to-f.from)),x=Math.sin(i*4.2)*4+Math.sin(time*2+i)*.2;m.position.set(center(z)+x,riverHeight(z)+.11+Math.sin(time*3+i)*.015,-z);m.rotation.z=f.side*.3;});}}
}
