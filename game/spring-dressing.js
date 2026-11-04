import * as T from 'three';
import {vec3} from 'three/tsl';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {seasonWeights,seasonAt} from './season-flow.mjs';
import {center,random} from './core.mjs';
const TAU=Math.PI*2;
const frostMaterial=new T.MeshStandardMaterial({color:0xedf5ff,roughness:.82});
const frostGeometry=(()=>{const parts=[];const up=new T.Vector3(0,1,0);
 const branch=(a,b,r)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),g=new T.CylinderGeometry(r*.18,r,delta.length(),5,2);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,delta.normalize()));g.translate(...start.add(end).multiplyScalar(.5));parts.push(g);};
 branch([0,0,0],[0,.12,-1.8],.035);for(let i=0;i<5;i++)for(const side of[-1,1]){const z=-.25-i*.27;branch([0,.08,z],[side*(.52-i*.06),.18,z-.25],.022);}
 const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());return geo;})();

export function taperedBranch(curve,radius){
 const geo=new T.TubeGeometry(curve,28,radius,10,false),p=geo.attributes.position;
 for(let row=0;row<=28;row++){
  const t=row/28,c=curve.getPointAt(t),scale=.035+.965*Math.pow(1-t,.65);
  for(let j=0;j<=10;j++){const i=row*11+j;p.setXYZ(i,c.x+(p.getX(i)-c.x)*scale,c.y+(p.getY(i)-c.y)*scale,c.z+(p.getZ(i)-c.z)*scale);}
 }
 geo.computeVertexNormals();return geo;
}

// Fine vegetation is instanced: leaf silhouettes, rather than opaque canopy blobs.
export function springDressing(a,b,A){
 const r=random(4147+a),g=new T.Group(),buckets=new Map(),dummy=new T.Object3D();
 const add=(geo,mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>{if(y>10&&Math.abs(x-center(-z))<3.6&&r()<.78)return;if(geo!==A.geometries.stone){const w=seasonWeights(-z);if(r()<w[3]){if(r()>.25)return;geo=frostGeometry;mat=frostMaterial;}if(geo!==frostGeometry&&r()<w[2])mat=leafMats[4+Math.floor(r()*4)];}dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();const key=geo.uuid+mat.uuid;if(!buckets.has(key))buckets.set(key,{geo,mat,matrices:[]});buckets.get(key).matrices.push(dummy.matrix.clone());};
 const leafMats=[0x80a455,0xa4b85f,0x72974f,0x95af57,0xcd9e36,0xc76434,0xe5b642,0xa4472e].map(color=>{const m=A.materials.leaf.clone();m.color.setHex(color);m.emissiveNode=null;m.thicknessColorNode=A.materials.leaf.thicknessColorNode.mul(vec3(m.color.r,m.color.g,m.color.b));m.roughness=.48;m.clearcoat=.25;return m;});
 g.userData.ownedMaterials=leafMats;
 const leaf=[A.geometries.smallLeaf,A.geometries.smallLeaf,A.geometries.smallLeaf];
 // Bank shrubbery leaves openings for the cup and the navigable channel.
 for(const side of[-1,1]){
  for(let k=0;k<66;k++){
   const z=a+r()*60,off=8+r()*22,x=center(z)+side*off,y=.5+(off-6)*.13+r()*1.3;
   if(off<17&&((side===1&&[27,205,628,808].some(c=>Math.abs(z-c)<8))||(side===-1&&[327,507,924,1104].some(c=>Math.abs(z-c)<8))))continue;
   const tall=off>17?2.4:1,spread=1.1+r()*1.1;
   for(let n=0;n<14;n++){
    const az=r()*TAU,rad=Math.sqrt(r())*spread,xx=x+Math.cos(az)*rad,zz=-z+Math.sin(az)*rad,yy=y+r()*tall;
    const s=.22+r()*.52;add(leaf[n%3],leafMats[k%4],xx,yy,zz,s*.8,s,s,-.2-r()*.8,az,(r()-.5)*.4);
   }
  }
  // A distant forest wall provides overlapping silhouettes and atmospheric depth.
  for(let k=0;k<9;k++){
   const z=a+r()*60,off=22+r()*16,x=center(z)+side*off,h=10+r()*10;
   const curve=new T.CatmullRomCurve3([new T.Vector3(x,0,-z),new T.Vector3(x+side,h*.4,-z-.7),new T.Vector3(x-side*2,h,-z-2)]);
   const trunk=new T.Mesh(new T.TubeGeometry(curve,16,.26+r()*.5,9,false),A.materials.bark);trunk.castShadow=trunk.receiveShadow=true;g.add(trunk);
   for(let cluster=0;cluster<7;cluster++){
    const az=cluster*2.4,rad=1+r()*4,cx=x+Math.cos(az)*rad,cy=h-5+r()*6,cz=-z+Math.sin(az)*rad;
    for(let n=0;n<24;n++){const s=.4+r()*.7;add(leaf[n%3],leafMats[(cluster+k)%4],cx+(r()-.5)*4,cy+(r()-.5)*3,cz+(r()-.5)*4,s,s,s,(r()-.5)*1.5,r()*TAU,(r()-.5)*1.2);}
   }
  }
  // Clusters of smaller pebbles make a broken, wet shoreline instead of a smooth shelf.
  for(let k=0;k<105;k++){
   const z=a+r()*60,off=5.85+r()*1.6,edge=Math.sin(z*.25)*.9+Math.sin(z*.63)*.35,x=center(z)+side*(off+edge),s=.14+r()*.38;
   add(A.geometries.stone,A.materials.stone,x,-.12+r()*.15,-z,s*(1+r()),s*.8,s,0,r()*TAU,0);
  }
 }
 // Irregular, tapered limbs avoid the repeated open-ended pipe silhouette.
 for(let k=0;k<2;k++)for(const side of[-1,1]){
  const z=a+12+k*29+r()*9,xx=center(z),h=12+r()*5,winter=seasonWeights(z)[3];
  const curve=new T.CatmullRomCurve3([new T.Vector3(xx+side*21,1,-z),new T.Vector3(xx+side*16,h*.57,-z-1),new T.Vector3(xx+side*8,h,-z-4),new T.Vector3(winter>.5?xx+side*(3+r()*3):xx-side*(1+r()*4),h+.4,-z-7-r()*4)]);
  const trunk=new T.Mesh(taperedBranch(curve,.6+r()*.25),A.materials.bark);trunk.castShadow=trunk.receiveShadow=true;g.add(trunk);
  for(let j=0;j<4;j++){
   const t=.32+j*.15,c=curve.getPoint(t),direction=j%2?1:-1;
   const twig=new T.CatmullRomCurve3([c,c.clone().add(new T.Vector3(side*(1+r()),.8,direction*1.7)),c.clone().add(new T.Vector3(side*(2+r()*2),1.8,direction*(3+r()*2)))]);
   const branch=new T.Mesh(taperedBranch(twig,.13*(1-t)),A.materials.bark);branch.castShadow=true;g.add(branch);
  }
  if(winter>.05){
   const snowCurve=new T.CatmullRomCurve3(curve.points.map(v=>v.clone().add(new T.Vector3(0,.27,0))));
   const snow=new T.Mesh(taperedBranch(snowCurve,.35*winter),new T.MeshStandardMaterial({color:0xeaf5ff,roughness:.86}));snow.receiveShadow=true;g.add(snow);
  }
  for(let j=0;j<12;j++){const c=curve.getPoint(.35+j*.055);for(let n=0;n<24;n++){const ss=.45+r()*.6;add(leaf[n%3],leafMats[j%4],c.x+(r()-.5)*4,c.y+(r()-.5)*2.8,c.z+(r()-.5)*5,ss,ss,ss,(r()-.5)*1.5,r()*TAU,(r()-.5)*.8);}}
 }
 for(const {geo,mat,matrices}of buckets.values()){
  const inst=new T.InstancedMesh(geo,mat,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();g.add(inst);
 }
 return g;
}
