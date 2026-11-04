import {thinMaterial} from './thin-material.js';
import {riverHeight} from './surf.mjs';
import {bendGeometry,bendStaticGroup} from './river-profile.js';
import * as T from 'three';
import {texture,attribute,mix,vec3} from 'three/tsl';
import {seasonWeights,seasonAt} from './season-flow.mjs';
import {batchScenery,disposeScenery} from './scene-batching.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {center,random,SEASONS} from './core.mjs';
import {createBotanicalAssets} from './botanical-assets.js';
import {springDressing,taperedBranch} from './spring-dressing.js?v=tapered2';
import {SeasonScenery,seasonalPlants as P} from './season-scenery.js';
const TAU=Math.PI*2, A=createBotanicalAssets(), loader=new GLTFLoader();
const CUP_POSITIONS=[27,205];
const inPouringLane=(z,off,side)=>off<18&&((side>0&&CUP_POSITIONS.some(c=>Math.abs(c-z)<6))||(side<0&&[327,507,924,1104].some(c=>Math.abs(c-z)<7))||(side>0&&[628,808].some(c=>Math.abs(c-z)<8)));
const cache=new Map;
export function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!cache.has(key))cache.set(key,new T.MeshPhysicalMaterial({color,roughness:.52,...extra}));return cache.get(key);}
function mesh(geo,material,p=[0,0,0],s=[1,1,1],r=[0,0,0]){const m=new T.Mesh(geo,material);m.position.set(...p);m.scale.set(...s);m.rotation.set(...r);m.castShadow=true;m.receiveShadow=true;return m;}
function tube(points,r=.08){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false);}
function place(o,x,y,z,rotation=0){o.position.set(x,y,-z);o.rotation.y=rotation;return o;}
function groundY(off,z){return .3+Math.max(0,off-6)*.14+Math.sin(z*.19+off)*.28+Math.sin(z*.41-off*.7)*.16;}
const mergeStatic=batchScenery;
const snowSurfaces=new Map;
export function snowCoat(object){
 // Fit the snow to the actual top mesh, rather than a floating bounding-box lid.
 const source=object.children.find(o=>o.isMesh),key=source.geometry.uuid;
 if(!snowSurfaces.has(key)){
  const geometry=source.geometry;geometry.computeBoundingBox();const box=geometry.boundingBox,c=box.getCenter(new T.Vector3),size=box.getSize(new T.Vector3);
  const sample=new T.Mesh(geometry,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster(),p=[],uv=[],ix=[],rows=16,cols=48;
  sample.updateMatrixWorld(true);
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
   const t=i/rows,a=j/cols*TAU,r=Math.sin(t*Math.PI/2)*(.92+.025*Math.sin(a*7));let x=c.x+Math.cos(a)*size.x*.5*r,z=c.z+Math.sin(a)*size.z*.5*r,hit;
   for(let attempt=0;attempt<5;attempt++){ray.set(new T.Vector3(x,box.max.y+1,z),new T.Vector3(0,-1,0));hit=ray.intersectObject(sample,false)[0];if(hit)break;x=c.x+(x-c.x)*.9;z=c.z+(z-c.z)*.9;}
   p.push(x,(hit?.point.y??box.max.y)+.018+.12*Math.pow(1-t,.6),z);uv.push(j/cols,t);
  }
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j;ix.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
  const g=new T.BufferGeometry;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();snowSurfaces.set(key,g);sample.material.dispose();
 }
 source.updateWorldMatrix(true,false);const coat=mesh(snowSurfaces.get(key),P.materials.snow);coat.applyMatrix4(source.matrixWorld);return coat;
}

function autumnGround(){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),r=random(219);ctx.fillStyle='#806542';ctx.fillRect(0,0,512,512);const colors=['#af7e3e','#bd903d','#8b6734','#785b35','#d2a650'];for(let i=0;i<2600;i++){const x=r()*512,y=r()*512,a=r()*TAU;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=colors[i%5];ctx.beginPath();ctx.moveTo(0,-3-r()*6);ctx.lineTo(3+r()*3,0);ctx.lineTo(0,5+r()*7);ctx.lineTo(-4-r()*3,0);ctx.closePath();ctx.fill();ctx.restore();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
const autumnGroundMap=autumnGround();
const textureLoader=new T.TextureLoader();
function repeatTexture(path,n,color=false){const t=textureLoader.load(path);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(n,n);t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
const bedMat=new T.MeshStandardMaterial({color:0xa0b69b,map:repeatTexture('./assets/environment/riverbed-color.jpg',1,true),normalMap:repeatTexture('./assets/environment/riverbed-normal.jpg',1),roughnessMap:repeatTexture('./assets/environment/riverbed-roughness.jpg',1),roughness:.75,normalScale:new T.Vector2(.7,.7)});
const landMat=new T.MeshStandardMaterial({color:0x94a779,map:A.textures.moss,bumpMap:A.textures.stoneBump,bumpScale:.12,roughness:.92});
// One spatial material across every chunk; the two adjacent rows have identical colors.
const blendedLand=new T.MeshStandardNodeMaterial({roughness:.92,bumpMap:A.textures.stoneBump,bumpScale:.075});
blendedLand.colorNode=mix(mix(texture(A.textures.moss).rgb.mul(vec3(.87,.97,.78)),texture(autumnGroundMap).rgb,attribute('seasonMix','vec3').y),texture(P.materials.snow.map).rgb,attribute('seasonMix','vec3').z);
function terrain(a,b,side,si){const p=[],uv=[],idx=[],weights=[];const rows=80,cols=32;for(let i=0;i<=rows;i++){const z=a+(b-a)*i/rows,w=seasonWeights(z);for(let j=0;j<=cols;j++){const off=5.7+j*1.6,edge=Math.sin(z*.25)*.9+Math.sin(z*.63)*.35;const y=j===0?-.6:groundY(off,z);p.push(center(z)+side*(off+edge),y+riverHeight(z),-z);uv.push(off*.22,z*.22);weights.push(w[1],w[2],w[3]);}}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const n=i*(cols+1)+j;side>0?idx.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1):idx.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}const g=new T.BufferGeometry;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('seasonMix',new T.Float32BufferAttribute(weights,3));g.setIndex(idx);g.computeVertexNormals();g.userData.chunkOwned=true;return mesh(g,blendedLand);}

function arch(z,si){const g=new T.Group,stone=A.materials.stone;for(let i=0;i<21;i++){const angle=i/20*Math.PI,x=Math.cos(angle)*7.6,y=2+Math.sin(angle)*7;const block=mesh(new T.BoxGeometry(1.2,1.55,1.8,3,3,3),stone,[center(z)+x,y,-z],[1,1,1],[0,0,angle-Math.PI/2]);g.add(block);if(i%2===0){const moss=A.rock(.6);moss.scale.y=.35;place(moss,center(z)+x,y+.7,z);g.add(moss);const flowers=A.flowerPatch(.55);place(flowers,center(z)+x,y+.8,z);g.add(flowers);}}for(const side of[-1,1])g.add(mesh(new T.CylinderGeometry(.8,1.1,2.5,20),stone,[center(z)+side*7.5,1,-z]));return g;}
function tree(z,side,rng,si){
 const g=new T.Group,x=center(z)+side*(17+rng()*13),y=groundY(Math.abs(x-center(z)),z),h=14+rng()*8;
 const trunk=new T.CatmullRomCurve3([[x,y,-z],[x+side*.4,y+h*.3,-z+.3],[x-side*1.2,y+h*.7,-z-1.4],[x+side*1.5,y+h,-z-2]].map(p=>new T.Vector3(...p)));
 g.add(mesh(taperedBranch(trunk,.65+rng()*.4),A.materials.bark));
 for(let k=0;k<7;k++){
  const angle=k*2.4,length=4+rng()*6,start=trunk.getPointAt(.44+k*.065),end=start.clone().add(new T.Vector3(Math.cos(angle)*length,3,Math.sin(angle)*length));
  const branch=new T.CatmullRomCurve3([start,start.clone().lerp(end,.52).add(new T.Vector3(0,.7,0)),end]);
  g.add(mesh(taperedBranch(branch,.18+rng()*.12),A.materials.bark));
  if(si===3){
   g.add(mesh(taperedBranch(new T.CatmullRomCurve3(branch.points.map(v=>v.clone().add(new T.Vector3(0,.2,0)))),.26),P.materials.snow));
   for(let q=0;q<3;q++){
    const base=branch.getPointAt(.45+q*.17),tip=base.clone().add(new T.Vector3(Math.cos(angle+q)*2,1.3,Math.sin(angle+q)*2));
    const twig=new T.CatmullRomCurve3([base,base.clone().lerp(tip,.5),tip]);
    g.add(mesh(taperedBranch(twig,.07),A.materials.bark));
   }
   for(let j=0;j<2;j++){const ice=P.icicle(.6+rng()*.8);ice.position.copy(branch.getPointAt(.55+j*.2));g.add(ice);}continue;
  }
  for(let j=0;j<26;j++){const leaf=si===2?(k%2?P.mapleLeaf(1.5+rng()*1.8,[0xdfb647,0xcb6131,0xc53e25][j%3]):P.ginkgoLeaf(1.8+rng()*1.5,0xe6c04f)):A.leaf(.4+rng()*.85);place(leaf,end.x+(rng()-.5)*5,end.y+(rng()-.5)*4,-end.z+(rng()-.5)*5,rng()*TAU);leaf.rotation.x=-.25+rng()*.5;g.add(leaf);}
 }
 return g;
}
function foxgloveGeometry(){const p=[],uv=[],ix=[],rows=24,cols=32;for(let i=0;i<=rows;i++){const t=i/rows,r=.1+.44*Math.sin(t*Math.PI*.75)+.18*Math.pow(t,8);for(let j=0;j<=cols;j++){const a=j/cols*TAU,flute=1+Math.cos(a*5)*.09*Math.pow(t,4);p.push(Math.cos(a)*r*flute,-t*1.3+Math.cos(a*5)*.09*Math.pow(t,8),Math.sin(a)*r*flute+t*t*.22);uv.push(j/cols,t);}}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const n=i*(cols+1)+j;ix.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}const g=new T.BufferGeometry;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
const foxGeometry=foxgloveGeometry();
const foxCanvas=document.createElement('canvas');foxCanvas.width=foxCanvas.height=512;const foxCtx=foxCanvas.getContext('2d'),gradient=foxCtx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#cc5982');gradient.addColorStop(.5,'#e991b2');gradient.addColorStop(1,'#f7c5d8');foxCtx.fillStyle=gradient;foxCtx.fillRect(0,0,512,512);const fr=random(220);for(let i=0;i<380;i++){foxCtx.fillStyle=i%3?'#bd4f7c88':'#fce5e388';foxCtx.beginPath();foxCtx.ellipse(fr()*512,180+fr()*330,1+fr()*3,2+fr()*6,0,0,TAU);foxCtx.fill();}const foxTexture=new T.CanvasTexture(foxCanvas);foxTexture.colorSpace=T.SRGBColorSpace;const foxMaterial=thinMaterial({map:foxTexture,side:T.DoubleSide,roughness:.46,clearcoat:.2,bumpMap:A.textures.leafBump,bumpScale:.015});
function pinkBell(){const g=new T.Group;const stem=mat(0x5d8132,{roughness:.6});g.add(mesh(tube([[0,0,0],[.3,3,0],[0,6,0],[.6,9,0]],.13),stem));for(let k=0;k<12;k++){const y=3.4+k*.45,a=k*2.4,x=Math.cos(a)*.7,z=Math.sin(a)*.7;g.add(mesh(tube([[0,y,0],[x,y+.3,z]],.05),stem));const pts=[];for(let i=0;i<=18;i++){const t=i/18;pts.push(new T.Vector2(.1+.46*Math.sin(t*Math.PI*.72)+.2*Math.pow(t,8),-t*1.25));}const bell=mesh(foxGeometry,foxMaterial,[x,y+.3,z]);bell.rotation.set(Math.cos(a)*.55,0,-Math.sin(a)*.55);g.add(bell);for(let j=0;j<5;j++){const q=j*TAU/5;g.add(mesh(new T.SphereGeometry(.06,8,6),mat(0xf4cf7c),[x+Math.cos(q)*.2,y-.86,z+Math.sin(q)*.2]));}}return g;}
export class Garden{
 constructor(scene){this.scene=scene;this.chunks=new Map;this.cups=[];this.heroFlowers=[];this.waterfalls=[];this.bluebell=null;this.currentSeason=0;this.flowMaps=[];this.petals=[];this.seasonScenery=new SeasonScenery(scene,mergeStatic);
 const bed=mesh(new T.PlaneGeometry(160,1500,16,1500),bedMat,[0,-3.1,-600],[1,1,1],[-Math.PI/2,0,0]);bed.geometry.attributes.uv.array.forEach((_,i,a)=>a[i]*=i%2?250:27);bed.geometry.attributes.uv.needsUpdate=true;bed.castShadow=false;bendStaticGroup(bed);scene.add(bed);
 this.addParticles();
 const petalMaterial=A.materials.pink.clone();petalMaterial.color.set(0xf4b3cc);petalMaterial.emissive=new T.Color(0x421121);petalMaterial.emissiveIntensity=.1;petalMaterial.roughness=.25;petalMaterial.clearcoat=.75;const rng=random(82);for(let i=0;i<42;i++){const petal=mesh(A.geometries.heroPetal,petalMaterial);petal.scale.set(1.3+rng(),.5,1.8+rng());petal.rotation.y=rng()*TAU;const dew=A.dewDrops(.58);dew.position.y=.18;petal.add(dew);scene.add(petal);this.petals.push({o:petal,z:8+i*29,x:(i%2?1:-1)*(3.6+rng())});}
}
 buildChunk(i){if(this.chunks.has(i))return;const a=i*60,b=a+60,si=T.MathUtils.clamp(Math.floor((a+30)/300),0,3),rng=random(i+453),deco=new T.Group,g=new T.Group;g.add(terrain(a,b,-1,si),terrain(a,b,1,si));
 for(const side of[-1,1]){
  for(let k=0;k<62;k++){const z=a+rng()*60,si=seasonAt(z,rng()),off=6.3+rng()*9,x=center(z)+side*off,y=groundY(off,z);if(inPouringLane(z,off,side))continue;const rock=A.rock(.4+rng()*1.5);rock.scale.y*=k%4===0?1.35:.7;deco.add(place(rock,x,y-.25,z,rng()*TAU));if(si<2&&k%2===0)deco.add(place(A.flowerPatch(.65+rng()*.65),x,y+.2,z,rng()*TAU));if(si===3)deco.add(snowCoat(rock));if(si===2){const box=new T.Box3().setFromObject(rock);for(let q=0;q<3;q++){const leaf=P.mapleLeaf(.45,[0xd79939,0xe5bd49,0xbe6034][q]);deco.add(place(leaf,x+(q-1)*.4,box.max.y+.04,z+q*.3,rng()*TAU));}}}
  for(let k=0;k<13;k++){const z=a+rng()*60,off=7+rng()*10,x=center(z)+side*off;if(inPouringLane(z,off,side)||rng()>seasonWeights(z)[0])continue;const leaf=A.leaf(.8+rng()*1.55);leaf.rotation.x=-.5-rng()*.5;if(k%8===0){const dew=A.dewDrops();dew.position.y=.24;leaf.add(dew);}deco.add(place(leaf,x,groundY(off,z),z,rng()*TAU));}
  for(let k=0;k<72;k++){const z=a+rng()*60,si=seasonAt(z,rng()),off=6.7+rng()*7,x=center(z)+side*off,y=groundY(off,z);if(inPouringLane(z,off,side)||rng()>[1,.45,.22,0][si])continue;deco.add(place(k%3===0?A.fern(1+rng()*.8):k%3===1?A.grassPatch(1+rng()):A.clover(1.2+rng()),x,y-.04,z,rng()*TAU));if(si<2&&k%4===0)deco.add(place(A.flowerPatch(.8+rng()*.5),x+.4,y,z+.4,rng()*TAU));}
  for(let k=0;k<(i===0?0:4);k++){if(i===0&&side===1&&k<3)continue;const z=a+6+k*k*4+rng()*3,si=seasonAt(z,rng()),off=8.3+rng()*4;if(inPouringLane(z,off,side)||(si===1&&rng()>.25))continue;const shroom=A.mushroom(.65+rng()*1.35);deco.add(place(shroom,center(z)+side*off,groundY(off,z),z,rng()*TAU));if(si===3)deco.add(snowCoat(shroom,.66));}
  for(let k=0;k<4;k++){const z=a+rng()*60;deco.add(tree(z,side,rng,seasonAt(z,rng())));}
  for(let k=0;k<3;k++){const z=a+8+k*21,off=8.5;if(inPouringLane(z,off,side))continue;const root=A.root(9+rng()*5);root.rotation.z=side*.12;deco.add(place(root,center(z)+side*off,groundY(off,z),z,-side*.25));}
  if(rng()<seasonWeights(a+38)[0]){const z=a+38+(inPouringLane(a+38,9,side)?9:0),flower=pinkBell();flower.scale.setScalar(1.3);deco.add(place(flower,center(z)+side*9,1,z,side*.6));const stem=mesh(tube([[side*11,1,0],[side*10,6,0],[side*5,9,0]],.2),mat(0x497735));place(stem,center(a+10),0,a+10);deco.add(stem);const leaf=A.leaf(3.2);leaf.rotation.x=.2;deco.add(place(leaf,center(a+10)+side*9,11,a+10,side*Math.PI/2));}
 }
 if(si===0&&i%3===0){deco.add(arch(a+44,si));const key=new T.Group,brass=mat(0xd6ad55,{metalness:.78,roughness:.27});for(let j=0;j<3;j++){const angle=j*TAU/3;key.add(mesh(new T.TorusGeometry(.36,.065,10,32),brass,[Math.cos(angle)*.3,4.7+Math.sin(angle)*.3,0]));}key.add(mesh(new T.CylinderGeometry(.075,.075,3.8,16),brass,[0,2.6,0]));key.add(mesh(new T.BoxGeometry(.55,.18,.16),brass,[.23,.8,0]));key.add(mesh(new T.BoxGeometry(.18,.45,.16),brass,[.45,.68,0]));place(key,center(a+36)+6.9,.3,a+36,-.3);key.rotation.z=-.35;deco.add(key);}
 if(si===0){
  if(i===0){for(const [zz,off,scale]of[[21,-9.2,2.05],[25,-10.7,1.45],[16,-8,.8]]){const m=A.mushroom(scale);place(m,center(zz)+off,.6,zz,.4);m.rotation.z=.08;deco.add(m);}
   for(const [zz,off,ss,rx,ry]of[[8,-8.5,3.1,.12,-1.5],[12,-9.5,2.7,.3,-.8],[7,9.2,2.4,.15,1.8]]){const l=A.leaf(ss);place(l,center(zz)+off,.8,zz,ry);l.rotation.x=rx;const d=A.dewDrops(1);d.position.y=.23;l.add(d);deco.add(l);}
  }
  if(i%3===0){for(let q=0;q<42;q++){const t=q/41*Math.PI,xx=center(a+44)+Math.cos(t)*7.6,yy=2+Math.sin(t)*7;for(let v=0;v<3;v++){const l=A.clover(.6+rng()*.5);place(l,xx+(rng()-.5),yy+.9,a+44+(rng()-.5)*2,rng()*TAU);deco.add(l);}if(q%3===0)deco.add(place(A.flowerPatch(.55),xx,yy+.9,a+44));}}
 }
 const baked=mergeStatic(deco);g.add(baked);for(let ss=1;ss<4;ss++)if(Math.max(seasonWeights(a)[ss],seasonWeights(b)[ss],seasonWeights((a+b)/2)[ss])>0)g.add(this.seasonScenery.buildChunk(a,b,ss));g.add(bendStaticGroup(springDressing(a,b,A)));this.scene.add(g);this.chunks.set(i,{a,b,g});if(this.bluebell)this.addBells(a,b,si);}
 addParticles(){const r=random(98),p=[];for(let i=0;i<120;i++)p.push((r()-.5)*35,r()*14,-r()*100);const geo=new T.BufferGeometry;geo.setAttribute('position',new T.Float32BufferAttribute(p,3));this.particles=new T.Points(geo,new T.PointsMaterial({color:0xffecc7,size:.055,transparent:true,opacity:.65,depthWrite:false}));this.scene.add(this.particles);}
 async loadModels(){const gltf=await loader.loadAsync('./assets/models/teacup.glb');const obj=gltf.scene;obj.rotation.y=Math.PI;obj.updateMatrixWorld(true);const box=new T.Box3().setFromObject(obj),size=box.getSize(new T.Vector3),c=box.getCenter(new T.Vector3);const rim=[];obj.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);if(v.y>box.max.y-size.y*.055)rim.push(v.sub(c));}});obj.position.sub(c);const normalized=new T.Group;normalized.add(obj);normalized.scale.setScalar(9/size.y);obj.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;const m=o.material;o.material=new T.MeshPhysicalMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,color:m.color,roughness:.27,metalness:.04,clearcoat:.8,clearcoatRoughness:.16,ior:1.48});}});for(const z of CUP_POSITIONS){const holder=new T.Group;holder.add(normalized.clone(true));holder.rotation.set(0,.35,1.0);holder.position.set(center(z)+13,5.6+riverHeight(z),-z);this.scene.add(holder);this.cups.push({s:z,o:holder});holder.updateMatrixWorld(true);const lip=rim.map(p=>p.clone().multiplyScalar(9/size.y).applyMatrix4(holder.matrixWorld)).sort((a,b)=>a.y-b.y)[0];this.makeWaterfall(z,lip);}}
 async loadFlowers(){const gltf=await loader.loadAsync('./assets/models/bluebell.glb');const obj=gltf.scene;obj.updateMatrixWorld(true);const box=new T.Box3().setFromObject(obj),size=box.getSize(new T.Vector3),c=box.getCenter(new T.Vector3);obj.position.set(-c.x,-box.min.y,-c.z);obj.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material.roughness=.4;o.material.metalness=0;}});const holder=new T.Group;holder.add(obj);holder.scale.setScalar(8/size.y);this.bluebell=holder;for(const {a,b}of this.chunks.values())this.addBells(a,b,T.MathUtils.clamp(Math.floor((a+30)/300),0,3));}
 addBells(a,b,si){if(seasonWeights(a)[0]<=0)return;for(let z=a+15;z<b;z+=22){const side=(z-a<20)?-1:1;if(inPouringLane(z,8,side)||random(z+811)()>seasonWeights(z)[0])continue;const o=this.bluebell.clone(true);o.scale.multiplyScalar(.9+(Math.sin(z)*.5+.5)*.5);place(o,center(z)+side*8,.7+riverHeight(z),z,side===1?-Math.PI*.7:Math.PI*.2);this.scene.add(o);this.heroFlowers.push({s:z,o});}}
 makeWaterfall(z,lip){const start=lip.clone().add(new T.Vector3(-.12,.035,0)),end=new T.Vector3(center(z)+4.3,.03+riverHeight(z),start.z-.7),p=[],uv=[],idx=[];
 for(let i=0;i<=40;i++){const t=i/40;for(let j=0;j<=16;j++){const f=j/16-.5,width=.75+t*1.75;p.push(T.MathUtils.lerp(start.x,end.x,t)+f*width*.85,T.MathUtils.lerp(start.y,end.y,t*t)+Math.sin(j*2+t*17)*.035,T.MathUtils.lerp(start.z,end.z,t)+f*width*.52+Math.sin(j*2+t*14)*.025);uv.push(j/16,t);}if(i<40)for(let j=0;j<16;j++){const a=i*17+j;idx.push(a,a+1,a+17,a+1,a+18,a+17);}}
 const g=new T.BufferGeometry;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const can=document.createElement('canvas');can.width=128;can.height=512;const ctx=can.getContext('2d');ctx.fillStyle='#75b9c2';ctx.fillRect(0,0,128,512);const rng=random(76);for(let i=0;i<130;i++){ctx.fillStyle=`rgba(239,255,255,${.2+rng()*.6})`;ctx.fillRect(rng()*128,rng()*512,.5+rng()*1.5,20+rng()*150);}const t=new T.CanvasTexture(can);t.colorSpace=T.SRGBColorSpace;t.wrapT=T.RepeatWrapping;this.flowMaps.push(t);const m=new T.MeshPhysicalMaterial({map:t,color:0xf2ffff,metalness:.15,roughness:.12,transparent:true,opacity:.8,side:T.DoubleSide,clearcoat:1,depthWrite:false});const o=mesh(g,m);o.castShadow=false;this.scene.add(o);this.waterfalls.push({s:z,o});
 for(let k=0;k<34;k++){const drop=mesh(new T.SphereGeometry(.025+k%3*.012,6,6),mat(0xe3ffff,{roughness:.1,metalness:.1}),end.toArray());drop.castShadow=false;this.scene.add(drop);this.waterfalls.push({s:z,o:drop,drop:k,end});}}

 releaseChunk(i){const c=this.chunks.get(i);if(!c)return;this.seasonScenery.releaseChunk(c.g);disposeScenery(c.g);this.chunks.delete(i);this.heroFlowers=this.heroFlowers.filter(f=>{if(f.s>=c.a&&f.s<c.b){f.o.removeFromParent();return false;}return true;});}
 async prepare(z=0){const chunk=Math.floor(z/60);for(const i of [...this.chunks.keys()])if(i<chunk-1||i>chunk+2)this.releaseChunk(i);for(let i=Math.max(-1,chunk-1);i<=Math.min(20,chunk+2);i++){await new Promise(resolve=>setTimeout(resolve,0));this.buildChunk(i);}}
 update(z,time,season){const chunk=Math.floor(z/60);for(const i of [...this.chunks.keys()])if(i<chunk-1||i>chunk+2)this.releaseChunk(i);for(let i=Math.max(-1,chunk-1);i<=Math.min(20,chunk+2);i++){if(!this.chunks.has(i)){this.buildChunk(i);break;}}for(const c of this.chunks.values())c.g.visible=c.b>z-25&&c.a<z+145;this.heroFlowers.forEach(c=>c.o.visible=c.s>z-22&&c.s<z+110);this.cups.forEach(c=>c.o.visible=Math.abs(c.s-z)<130);this.waterfalls.forEach(c=>{c.o.visible=Math.abs(c.s-z)<110;if(c.drop!==undefined){const t=(time*1.8+c.drop*.137)%1;c.o.position.set(c.end.x+Math.sin(c.drop*7)*t*.9,riverHeight(c.s)+Math.sin(t*Math.PI)*.6,c.end.z+Math.cos(c.drop*5)*t*1.3);}});this.petals.forEach(p=>{p.o.visible=random(p.z+77)()<seasonWeights(p.z)[0]+seasonWeights(p.z)[1]&&Math.abs(p.z-z)<100;p.o.position.set(center(p.z)+p.x,riverHeight(p.z)+.11+Math.sin(time*1.5+p.z)*.035,-p.z);p.o.rotation.z=Math.sin(time+p.z)*.025;});this.flowMaps.forEach(t=>t.offset.y=-time*.7);this.seasonScenery.update(z,time,season);this.particles.visible=seasonWeights(z)[0]+seasonWeights(z)[1]>.01;this.particles.material.opacity=.55*(seasonWeights(z)[0]+seasonWeights(z)[1]);this.particles.position.set(center(z),riverHeight(z),-z);this.particles.material.color.setHex(season===3?0xffffff:0xffe6a8);this.particles.material.size=season===3?.1:.045;}
}
export function makeBoat(){const g=new T.Group;g.name='RiverlightKayaker';return g;}
export async function loadKayaker(holder){
 const gltf=await loader.loadAsync('./art-models/kayaker-paddling.glb');
 const obj=gltf.scene;obj.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(obj),size=box.getSize(new T.Vector3),c=box.getCenter(new T.Vector3);
 obj.position.set(-c.x,-box.min.y,-c.z);
 const normal=new T.Group;normal.add(obj);normal.scale.setScalar(6.2/size.z);normal.position.y=-.18;
 // Skinning and the alternating stroke were authored and baked in Blender.
 obj.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material.map)o.material.map.anisotropy=8;if(o.material.normalMap)o.material.normalMap.anisotropy=8; if(/kayak|boat/i.test(o.name)){o.material.roughness=.28;} }});
 holder.userData.rowers=[];holder.add(normal);holder.userData.visual=normal;
 const mixer=new T.AnimationMixer(obj),clip=gltf.animations.find(c=>c.name==='Paddle_Cycle')||gltf.animations[0];if(!clip)throw new Error('Paddle animation missing');const action=mixer.clipAction(clip);action.play();action.time=clip.duration*.25;mixer.update(0);holder.userData.paddleMixer=mixer;holder.userData.paddleAction=action;holder.userData.bladeTips=['BladeTip_L','BladeTip_R'].map(n=>obj.getObjectByName(n)).filter(Boolean);holder.userData.model='blender-kayaker-animated';holder.userData.clip=clip.name;
}
export function obstacle(o){if(o.kind==='log'){const root=A.root(2.4);root.rotation.y=Math.PI/2+.3;root.position.set(center(o.z)+o.x,riverHeight(o.z)+.15,-o.z);return root;}const r=A.rock(o.radius);r.position.set(center(o.z)+o.x,riverHeight(o.z)-.2,-o.z);return r;}
export function seed(o){const g=new T.Group,m=mat(0xffdf7c,{emissive:0xffba36,emissiveIntensity:2,roughness:.25});const shape=new T.Shape;shape.moveTo(0,-.22);shape.quadraticCurveTo(-.22,.06,0,.4);shape.quadraticCurveTo(.25,.1,0,-.22);const leaf=mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2}),m);g.add(leaf);g.add(mesh(new T.TorusGeometry(.29,.008,4,32),new T.MeshBasicMaterial({color:0xffdc85})));g.position.set(center(o.z)+o.x,riverHeight(o.z)+.85,-o.z);return g;}
export {A as botanicals};
