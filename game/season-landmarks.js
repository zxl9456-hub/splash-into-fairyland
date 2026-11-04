import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Small, reusable landmark library. Texture maps are generated once; instances
// share the baked geometry and PBR materials, but keep their own animation nodes.
const TAU=Math.PI*2, UP=new T.Vector3(0,1,0), FRONT=new T.Vector3(0,0,1);
let library;
const prototypes=new Map();
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function canvas(size=512,height=size){const c=document.createElement('canvas');c.width=size;c.height=height;return [c,c.getContext('2d')];}
function texture(c,color=true){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
function mesh(geo,material,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){const o=new T.Mesh(geo,material);o.position.set(...p);o.scale.set(...scale);o.rotation.set(...rotation);o.castShadow=!material.transparent;o.receiveShadow=true;return o;}
function line(points,radius=.05,segments=28,sides=8){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p))),segments,radius,sides,false);}
function lathe(points,segments=64){return new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),segments);}
function cylinderBetween(a,b,radius,material,sides=12){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),o=mesh(new T.CylinderGeometry(radius,radius,d.length(),sides),material,av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(UP,d.normalize());return o;}
function bake(group,name){
  group.updateMatrixWorld(true);const buckets=new Map();
  group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index){const indexed=g;g=g.toNonIndexed();indexed.dispose();}if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
  const out=new T.Group();out.name=name;
  for(const [material,parts] of buckets){const geo=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geo)throw new Error(`Unable to merge landmark ${name}`);geo.computeBoundingBox();geo.computeBoundingSphere();out.add(mesh(geo,material));}
  return out;
}

function metalMaps(gold=false){
  const [c,ctx]=canvas(1024),[rough,rctx]=canvas(1024),[bump,bctx]=canvas(1024),random=rng(gold?804:506);
  ctx.fillStyle=gold?'#b9924d':'#b67545';ctx.fillRect(0,0,1024,1024);rctx.fillStyle='#777777';rctx.fillRect(0,0,1024,1024);bctx.fillStyle='#898989';bctx.fillRect(0,0,1024,1024);
  for(let i=0;i<6200;i++){
    const x=random()*1024,y=random()*1024,s=1+random()*(i<100?82:10),patina=random()<(gold?.09:.42);
    ctx.fillStyle=patina?(gold?'#477b6088':['#478c7f99','#74ad9299','#3b796b99'][i%3]):(i%2?'#f2be7b30':'#4c321c24');
    ctx.beginPath();ctx.ellipse(x,y,s,s*(.3+random()),random()*TAU,0,TAU);ctx.fill();
    rctx.fillStyle=patina?'#c9c9c955':'#54545430';rctx.beginPath();rctx.ellipse(x,y,s,s*.7,0,0,TAU);rctx.fill();
    bctx.fillStyle=i%2?'#afafaf35':'#53535335';bctx.fillRect(x,y,1+random()*4,1+random()*5);
  }
  ctx.strokeStyle='#ffe0a33b';ctx.lineWidth=.7;bctx.strokeStyle='#dddddd55';
  for(let i=0;i<1100;i++){const x=random()*1024,y=random()*1024,l=2+random()*35;for(const k of [ctx,bctx]){k.beginPath();k.moveTo(x,y);k.lineTo(x+l,y+(random()-.5)*3);k.stroke();}}
  return {map:texture(c),roughnessMap:texture(rough,false),bumpMap:texture(bump,false)};
}
function woodMaps(){
  const [c,ctx]=canvas(512),[b,bctx]=canvas(512),r=rng(1701);
  ctx.fillStyle='#725336';ctx.fillRect(0,0,512,512);bctx.fillStyle='#999999';bctx.fillRect(0,0,512,512);
  for(let i=0;i<450;i++){const x=r()*512,w=.5+r()*4;ctx.strokeStyle=i%3?'#322b2280':'#c5a1717a';ctx.lineWidth=w;bctx.strokeStyle=i%3?'#3e3e3eaa':'#d9d9d977';bctx.lineWidth=w;
    for(const k of [ctx,bctx]){k.beginPath();for(let y=-20;y<550;y+=12){const xx=x+Math.sin(y*.018+x)*5+Math.sin(y*.06+x)*1.2;y===-20?k.moveTo(xx,y):k.lineTo(xx,y);}k.stroke();}}
  for(let i=0;i<18;i++){const x=r()*512,y=r()*512;ctx.strokeStyle='#35281ca0';ctx.lineWidth=2;for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(x,y,3+j*2.3,8+j*6,0,0,TAU);ctx.stroke();}}
  return {map:texture(c),bumpMap:texture(b,false)};
}
function mossTexture(){const [c,ctx]=canvas(256),r=rng(22);ctx.fillStyle='#536332';ctx.fillRect(0,0,256,256);for(let i=0;i<10000;i++){ctx.fillStyle=['#7f8c41','#acaa50','#344d2c','#657c37'][i%4];ctx.fillRect(r()*256,r()*256,1+r()*3,1+r()*4);}return texture(c);}
function frostTexture(){
  const [c,ctx]=canvas(512,1024),r=rng(472),g=ctx.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#b7c6bd');g.addColorStop(.43,'#e2c78b');g.addColorStop(1,'#ffc66b');ctx.fillStyle=g;ctx.fillRect(0,0,512,1024);
  function twig(x,y,angle,length,width,depth){const ex=x+Math.sin(angle)*length,ey=y-Math.cos(angle)*length;ctx.strokeStyle=`rgba(248,252,235,${.35+depth*.07})`;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(angle+.2)*length*.5,y-Math.cos(angle)*length*.5,ex,ey);ctx.stroke();if(depth<1)return;for(let i=2;i<7;i++){const t=i/8,bx=x+(ex-x)*t,by=y+(ey-y)*t;twig(bx,by,angle-.55,length*.22,width*.53,depth-1);twig(bx,by,angle+.55,length*.22,width*.53,depth-1);}}
  twig(256,1060,-.04,810,2.4,3);twig(90,1070,-.28,490,1.5,2);twig(440,1080,.25,570,1.5,2);
  for(let i=0;i<1500;i++){ctx.fillStyle=`rgba(253,255,247,${r()*.45})`;ctx.fillRect(r()*512,r()*1024,.5+r()*2,.5+r()*2);}
  return texture(c);
}
function faceTextures(){
  const [c,ctx]=canvas(1024),[b,bctx]=canvas(1024),r=rng(93);const g=ctx.createRadialGradient(512,490,150,512,512,520);g.addColorStop(0,'#f5eacf');g.addColorStop(.8,'#e7d8b7');g.addColorStop(1,'#ad956f');ctx.fillStyle=g;ctx.fillRect(0,0,1024,1024);bctx.fillStyle='#bbbbbb';bctx.fillRect(0,0,1024,1024);
  for(let i=0;i<165;i++){let x=r()*1024,y=r()*1024;for(const k of [ctx,bctx]){k.strokeStyle=k===ctx?'#89745455':'#575757aa';k.lineWidth=k===ctx?1:.7;k.beginPath();k.moveTo(x,y);}for(let j=0;j<6;j++){x+=(r()-.5)*55;y+=(r()-.5)*60;ctx.lineTo(x,y);bctx.lineTo(x,y);}ctx.stroke();bctx.stroke();}
  ctx.strokeStyle='#77613b';ctx.lineWidth=2;for(const rad of [465,448,350]){ctx.beginPath();ctx.arc(512,512,rad,0,TAU);ctx.stroke();}
  for(let i=0;i<60;i++){const a=i/60*TAU,r0=i%5?452:440;ctx.strokeStyle='#685332';ctx.lineWidth=i%5?2:4;ctx.beginPath();ctx.moveTo(512+Math.sin(a)*r0,512-Math.cos(a)*r0);ctx.lineTo(512+Math.sin(a)*462,512-Math.cos(a)*462);ctx.stroke();}
  const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];ctx.font='58px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#473c2d';
  for(let i=0;i<12;i++){const a=i/12*TAU;ctx.save();ctx.translate(512+Math.sin(a)*393,512-Math.cos(a)*393);ctx.rotate(a);ctx.fillText(roman[i],0,0);ctx.restore();}
  ctx.font='18px Georgia, serif';ctx.fillStyle='#8a7857';ctx.fillText('R I V E R L I G H T',512,625);ctx.font='14px Georgia, serif';ctx.fillText('AUTUMN GARDEN',512,650);
  return {map:texture(c),bumpMap:texture(b,false)};
}
function shared(){
  if(library)return library;const copper=metalMaps(),gold=metalMaps(true),wood=woodMaps(),moss=mossTexture(),face=faceTextures(),frost=frostTexture();
  const materials={
    copper:new T.MeshPhysicalMaterial({...copper,color:0xf2dfc0,metalness:.78,roughness:.58,bumpScale:.035,clearcoat:.2,clearcoatRoughness:.38}),
    gold:new T.MeshPhysicalMaterial({...gold,color:0xffe0a0,metalness:.82,roughness:.37,bumpScale:.018,clearcoat:.2}),
    edge:new T.MeshPhysicalMaterial({color:0xcda263,metalness:.84,roughness:.3,clearcoat:.28}),
    dark:new T.MeshStandardMaterial({color:0x3c3327,metalness:.62,roughness:.52}),
    wood:new T.MeshStandardMaterial({...wood,color:0xd4ba8e,roughness:.85,bumpScale:.1}),
    bark:new T.MeshStandardMaterial({...wood,color:0x968366,roughness:.94,bumpScale:.19}),
    darkBark:new T.MeshStandardMaterial({...wood,color:0x6c6953,roughness:.96,bumpScale:.16}),
    moss:new T.MeshStandardMaterial({map:moss,bumpMap:moss,bumpScale:.055,roughness:1,color:0xc6ca7f}),
    ivory:new T.MeshPhysicalMaterial({...face,roughness:.48,bumpScale:.014,clearcoat:.35,clearcoatRoughness:.3}),
    glass:new T.MeshPhysicalMaterial({map:frost,emissiveMap:frost,color:0xc7dbdb,emissive:0xffc06c,emissiveIntensity:.5,metalness:.05,roughness:.36,clearcoat:1,clearcoatRoughness:.22,transparent:true,opacity:.78,depthWrite:false,side:T.DoubleSide}),
    lens:new T.MeshPhysicalMaterial({color:0xdce6df,roughness:.16,clearcoat:1,clearcoatRoughness:.1,metalness:.1,transparent:true,opacity:.08,depthWrite:false}),
    snow:new T.MeshStandardMaterial({color:0xf3f8f7,bumpMap:moss,bumpScale:.035,roughness:.9}),
    ice:new T.MeshPhysicalMaterial({color:0xc7e6ec,roughness:.18,metalness:.12,clearcoat:1,clearcoatRoughness:.07,transparent:true,opacity:.83,depthWrite:false}),
    candle:new T.MeshStandardMaterial({color:0xffe4a4,emissive:0xffbc4e,emissiveIntensity:.28,roughness:.7}),
    flame:new T.MeshBasicMaterial({color:0xffd286}),
  };
  library={materials,sphere:new T.SphereGeometry(1,12,8),torus:new T.TorusGeometry(1,.07,8,32),box:new T.BoxGeometry(1,1,1),ice:new T.ConeGeometry(1,1,7,1)};return library;
}
function rivet(g,p,r=.045,material=shared().materials.edge){g.add(mesh(shared().sphere,material,p,[r,r,r]));}
function ring(g,r,y,tube,material){g.add(mesh(new T.TorusGeometry(r,tube,10,72),material,[0,y,0],[1,1,1],[Math.PI/2,0,0]));}
function foliage(g,points,r=.045,material=shared().materials.edge){g.add(mesh(line(points,r,points.length>8?44:24,7),material));}

function buildWateringCan(){
  const {materials:m}=shared(),g=new T.Group();
  g.add(mesh(lathe([[0,0],[1.78,0],[1.99,.13],[2.04,.35],[2.13,2],[2.3,4.35],[2.36,4.57],[2.3,4.72],[2.17,4.7],[2.15,4.42]],72),m.copper));
  g.add(mesh(new T.CircleGeometry(2.15,64),m.dark,[0,4.34,0],[1,1,1],[-Math.PI/2,0,0]));
  for(const [r,y] of [[2.02,.24],[2.12,1.25],[2.27,3.9],[2.32,4.62]])ring(g,r,y,.065,m.edge);
  foliage(g,[[1.1,4.5,0],[.8,6.7,0],[-.5,7.5,0],[-2.3,7.05,0],[-3,5.6,0],[-2.45,3.1,0]],.2,m.copper);
  foliage(g,[[1.1,4.5,.17],[.8,6.7,.17],[-.5,7.5,.17],[-2.3,7.05,.17],[-3,5.6,.17],[-2.45,3.1,.17]],.035,m.edge);
  for(const y of [.35,3.9,4.57])for(let i=0;i<22;i++){const a=i/22*TAU,r=2.02+y*.067;rivet(g,[Math.sin(a)*r,y,Math.cos(a)*r],.046);}
  const path=[[1.65,1.3,0],[2.9,1.75,0],[4.15,3,0],[5.3,4.48,0],[6.1,5.1,0]];
  g.add(mesh(line(path,.38,42,16),m.copper));
  const axis=new T.Vector3(1,.48,0).normalize(),faceCenter=new T.Vector3(6.55,5.32,0),q=new T.Quaternion().setFromUnitVectors(FRONT,axis);
  const rose=mesh(new T.CylinderGeometry(1.08,.36,.7,48),m.copper,faceCenter.clone().addScaledVector(axis,-.35).toArray());rose.quaternion.setFromUnitVectors(UP,axis);g.add(rose);
  const plate=new T.Shape();plate.absarc(0,0,1.08,0,TAU,false);const holes=[[0,0]];
  for(let row=1;row<=2;row++){const count=row===1?7:14,rad=row===1?.39:.8;for(let i=0;i<count;i++){const a=i/count*TAU+(row===1?.2:0);holes.push([Math.cos(a)*rad,Math.sin(a)*rad]);}}
  const spouts=[];for(const [x,y] of holes){const h=new T.Path();h.absarc(x,y,.082,0,TAU,true);plate.holes.push(h);spouts.push(new T.Vector3(x,y,.055).applyQuaternion(q).add(faceCenter));}
  const cap=mesh(new T.ExtrudeGeometry(plate,{depth:.055,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:10}),m.edge,faceCenter.toArray());cap.quaternion.copy(q);g.add(cap);
  const rim=mesh(new T.TorusGeometry(1.1,.065,10,64),m.edge,faceCenter.toArray());rim.quaternion.copy(q);g.add(rim);
  // Raised lotus motif follows the tapered copper vessel instead of floating
  // as a flat decal in front of it.
  const onBody=(x,y)=>[x,y,Math.sqrt(Math.max(.01,(2.04+y*.067)**2-x*x))+.036];
  for(let j=-3;j<=3;j++){const angle=j*.28,tipX=Math.sin(angle)*1.38,tipY=2.3+Math.cos(angle)*1.15;const pts=[onBody(0,2.04),onBody(tipX-.27,2.55),onBody(tipX,tipY),onBody(tipX+.28,2.64),onBody(0,2.04)];foliage(g,pts,.027);}
  foliage(g,[onBody(0,.55),onBody(-.15,1.3),onBody(0,2.15)],.03);
  for(const side of[-1,1])for(let j=0;j<3;j++){const y=.8+j*.45;foliage(g,[onBody(0,y),onBody(side*.7,y+.2),onBody(side*1.15,y+.8),onBody(side*1.55,y+.42),onBody(side*1.05,y+.18)],.024);}
  for(let i=0;i<13;i++){const a=i*.62;g.add(mesh(shared().sphere,m.moss,[-1.4+Math.sin(a)*.5,4.65-i*.16,.9+Math.cos(a)*.42],[.21,.11,.15]));}
  const out=bake(g,'PatinatedCopperWateringCan');out.userData.spoutCoordinates=spouts.map(v=>v.toArray());out.userData.spoutDirection=axis.toArray();return out;
}

function hand(length,width,material,name){
  const s=new T.Shape();s.moveTo(-width*.45,-.36);s.lineTo(-width*.7,.18);s.quadraticCurveTo(-width*.38,length*.58,-width*.48,length*.77);s.lineTo(0,length);s.lineTo(width*.48,length*.77);s.quadraticCurveTo(width*.38,length*.58,width*.7,.18);s.lineTo(width*.45,-.36);s.closePath();
  const o=new T.Group();o.name=name;o.add(mesh(new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:1}),material));
  const loop=mesh(new T.TorusGeometry(width*.85,width*.16,6,24),material,[0,length*.66,.025],[.7,1.2,1]);o.add(loop);return o;
}
function buildPocketWatch(){
  const {materials:m}=shared(),g=new T.Group(),cy=3.25;
  g.add(mesh(new T.CylinderGeometry(3.15,3.15,.62,96),m.gold,[0,cy,0],[1,1,1],[Math.PI/2,0,0]));
  for(const [radius,tube,z] of [[3.09,.12,.34],[2.84,.095,.41],[2.71,.045,.43],[3.09,.08,-.33]])g.add(mesh(new T.TorusGeometry(radius,tube,10,96),m.edge,[0,cy,z]));
  g.add(mesh(new T.CircleGeometry(2.71,96),m.ivory,[0,cy,.386]));
  g.add(mesh(new T.CircleGeometry(2.69,96),m.lens,[0,cy,.485]));
  for(let j=0;j<32;j++){
    const a=j/32*TAU,points=[];
    for(let k=0;k<=18;k++){const t=k/18,aa=a+(t-.5)*TAU/32,rr=2.955+Math.sin(t*TAU)*.075;points.push([Math.sin(aa)*rr,cy+Math.cos(aa)*rr,.415+Math.sin(t*Math.PI)*.022]);}
    foliage(g,points,.023,m.edge);rivet(g,[Math.sin(a)*3.09,cy+Math.cos(a)*3.09,.43],.025);
  }
  g.add(mesh(new T.CylinderGeometry(.32,.22,.28,24),m.edge,[0,6.55,0]));
  g.add(mesh(shared().sphere,m.gold,[0,6.86,0],[.45,.29,.33]));
  for(let i=0;i<22;i++){const a=i/22*TAU;foliage(g,[[Math.cos(a)*.31,6.66,Math.sin(a)*.24],[Math.cos(a)*.44,6.86,Math.sin(a)*.31],[Math.cos(a)*.25,7.07,Math.sin(a)*.21]],.021,m.edge);}
  g.add(mesh(new T.TorusGeometry(.58,.105,12,48),m.gold,[0,7.27,0],[1,1,1]));
  for(let i=0;i<15;i++){const t=i/14,x=.55+Math.sin(t*1.35)*3.65,y=7.05-t*6.55,z=-.07+Math.sin(t*4)*.12;g.add(mesh(new T.TorusGeometry(.22,.065,8,22),m.edge,[x,y,z],[.82,1.42,1],[0,i%2?1.05:.15,-.45+t*.7]));}
  const out=bake(g,'EngravedGardenPocketWatch');
  const hour=hand(1.64,.14,m.dark,'hourHand'),minute=hand(2.25,.11,m.dark,'minuteHand'),second=hand(2.4,.025,m.edge,'secondHand');
  for(const [o,z,a]of [[hour,.54,1.05],[minute,.59,-1.05],[second,.64,-2.25]]){o.position.set(0,cy,z);o.rotation.z=a;out.add(o);}
  out.add(mesh(shared().sphere,m.edge,[0,cy,.69],[.15,.15,.07]));return out;
}

function addIcicle(g,p,length=.5,radius=.065){const o=mesh(shared().ice,shared().materials.ice,p,[radius,length,radius],[Math.PI,0,0]);g.add(o);}
function buildLantern(){
  const {materials:m}=shared(),g=new T.Group(),r=1.49;
  g.add(mesh(lathe([[0,0],[1.5,0],[1.65,.14],[1.65,.32],[1.44,.45],[1.35,.66],[1.54,.76]],6),m.copper,[0,0,0],[1,1,1],[0,Math.PI/6,0]));
  for(const y of [.7,.85,4.45,4.62])g.add(mesh(new T.CylinderGeometry(1.63,1.63,.105,6),m.edge,[0,y,0],[1,1,1],[0,Math.PI/6,0]));
  const panel=new T.PlaneGeometry(1.48,3.53,1,1);
  for(let i=0;i<6;i++){
    const a=i/6*TAU,ca=a+Math.PI/6,x=Math.sin(a)*r,z=Math.cos(a)*r;
    g.add(cylinderBetween([x,.75,z],[x,4.61,z],.075,m.edge,10));
    g.add(mesh(panel,m.glass,[Math.sin(ca)*r*.866,2.65,Math.cos(ca)*r*.866],[1,1,1],[0,ca,0]));
    for(const y of[.92,4.35])rivet(g,[x,y,z],.075);
    for(const side of[-1,1]){const b=ca+side*.43;foliage(g,[[Math.sin(a)*r,3.87,Math.cos(a)*r],[Math.sin(b)*r,4.35,Math.cos(b)*r],[Math.sin(ca)*r*.9,4.46,Math.cos(ca)*r*.9]],.035,m.edge);}
  }
  g.add(mesh(lathe([[1.8,4.62],[1.9,4.74],[1.55,4.92],[1.2,5.3],[.93,5.62],[.42,5.95],[.26,6.08],[0,6.12]],6),m.copper,[0,0,0],[1,1,1],[0,Math.PI/6,0]));
  g.add(mesh(lathe([[1.8,4.77],[1.6,4.9],[1.48,5.03],[1.1,5.43],[.86,5.74],[.4,6.03],[.24,6.16],[0,6.19]],6),m.snow,[0,0,0],[1,1,1],[0,Math.PI/6,0]));
  for(let i=0;i<6;i++){const a=i/6*TAU;foliage(g,[[Math.sin(a)*1.75,4.75,Math.cos(a)*1.75],[Math.sin(a)*1.2,5.35,Math.cos(a)*1.2],[Math.sin(a)*.4,5.96,Math.cos(a)*.4]],.045,m.edge);}
  g.add(mesh(new T.CylinderGeometry(.31,.34,.2,16),m.edge,[0,6.2,0]));g.add(mesh(new T.TorusGeometry(.45,.085,10,40),m.gold,[0,6.44,0]));
  g.add(mesh(new T.CylinderGeometry(.3,.36,1.62,20),m.candle,[0,1.64,0]));g.add(mesh(shared().sphere,m.flame,[0,2.66,0],[.13,.34,.13]));
  for(let i=0;i<18;i++){const a=i/18*TAU,len=.24+(Math.sin(i*2.7)*.5+.5)*.57;addIcicle(g,[Math.sin(a)*1.78,4.68-len*.5,Math.cos(a)*1.78],len,.05);}
  const out=bake(g,'WinterFrostLantern'),light=new T.PointLight(0xffbd72,18,14,2);light.name='lanternLight';light.position.set(0,2.6,0);light.castShadow=false;out.add(light);return out;
}

function organicTube(points,radius,seed=1,segments=56,sides=14){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),p=[],uv=[],idx=[];
  for(let i=0;i<=segments;i++){const t=i/segments,center=curve.getPointAt(t),base=radius*(.88+Math.sin(t*12+seed)*.06+Math.sin(t*31+seed)*.035+(Math.abs(t-.5)>.37?.18:0));
    for(let j=0;j<=sides;j++){const a=j/sides*TAU,r=base*(1+Math.sin(a*5+Math.sin(t*7))* .07+Math.cos(a*9+t*4)*.025),v=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);p.push(v.x,v.y,v.z);uv.push(j/sides,t*6);}
    if(i<segments)for(let j=0;j<sides;j++){const n=i*(sides+1)+j;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function buildRootArch(snow=false){
  const {materials:m}=shared(),g=new T.Group(),r=rng(181),points=[[-8.7,.3,.4],[-7,2.6,.2],[-5.3,6.2,-.3],[-2.7,8.05,-.2],[.1,8.25,.2],[3.5,7.1,.45],[6,4.7,.15],[8.35,.35,-.1]],curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  g.add(mesh(organicTube(points,.76,2),m.bark));
  for(let k=0;k<6;k++){const path=[];for(let i=0;i<=17;i++){const t=i/17,p=curve.getPointAt(t),a=t*10+k*TAU/6;p.z+=Math.cos(a)*.55;p.y+=Math.sin(a)*.51;path.push(p.toArray());}g.add(mesh(organicTube(path,.095+(k%3)*.023,k+2,52,8),k%2?m.bark:m.darkBark));}
  for(const side of[-1,1]){
    for(let j=0;j<7;j++){const z=(j-3)*.63;g.add(mesh(organicTube([[side*6.4,3.9,z*.1],[side*(7.5+j*.13),1.5,z*.4],[side*(8.9+j*.2),.48,z],[side*(10.2+j*.2),.17,z*1.9]],.13+j*.012,j,28,8),m.bark));}
    foliage(g,[[side*4.7,6.8,-.2],[side*5.9,8,-1],[side*7.1,8.7,-1.6],[side*8.5,8.85,-1.8]],.18,m.bark);
    for(let j=0;j<3;j++)foliage(g,[[side*(6+j*.5),8.1+j*.16,-1.2],[side*(6.8+j*.6),8.6+j*.06,-2],[side*(7.1+j*.9),8.9-j*.1,-2.8]],.045,m.darkBark);
  }
  for(let i=0;i<58;i++){const t=.03+r()*.94,p=curve.getPointAt(t);p.y+=.57+r()*.16;p.z+=(r()-.5)*1.15;g.add(mesh(shared().sphere,m.moss,p.toArray(),[.17+r()*.28,.09+r()*.1,.2+r()*.22],[r(),r(),r()]));}
  if(snow){
    for(let i=0;i<48;i++){const t=i/47,p=curve.getPointAt(t);p.y+=.59;p.z+=Math.sin(i*2.3)*.1;g.add(mesh(shared().sphere,m.snow,p.toArray(),[.45+r()*.18,.17+r()*.1,.49+r()*.13],[0,r(),.1*Math.sin(i)]));}
    for(let i=0;i<30;i++){const t=.15+i/29*.7,p=curve.getPointAt(t),len=.35+r()*1.25;p.y-=.53+len*.5;p.z+=.6;addIcicle(g,p.toArray(),len,.055+r()*.06);}
  }
  return bake(g,snow?'SnowAndIcicleRootArch':'MossyAncientRootArch');
}
function buildWoodBridge(){
  const {materials:m}=shared(),g=new T.Group(),height=x=>5.25+Math.cos(x/8*Math.PI*.5)*1.1;
  for(let i=0;i<33;i++){const x=-8+i*.5,y=height(x);const o=mesh(shared().box,m.wood,[x,y,0],[.47,.22,3.15],[0,0,-Math.sin(x/8*Math.PI*.5)*.2]);g.add(o);for(const z of[-1.2,1.2])rivet(g,[x,y+.12,z],.025,m.dark);}
  for(const side of[-1,1]){
    const under=[],upper=[],middle=[];for(let j=0;j<=20;j++){const x=-8+j*.8,y=height(x);under.push([x,y-.22,side*1.32]);upper.push([x,y+1.29,side*1.48]);middle.push([x,y+.62,side*1.48]);}
    foliage(g,under,.17,m.bark);foliage(g,upper,.085,m.wood);foliage(g,middle,.055,m.bark);
    for(let i=0;i<9;i++){const x=-8+i*2,y=height(x);g.add(cylinderBetween([x,y-.2,side*1.48],[x,y+1.35,side*1.48],.105,m.wood));rivet(g,[x,y+1.38,side*1.48],.13,m.wood);}
    for(const x of[-7.6,7.6]){g.add(cylinderBetween([x,.1,side*1.3],[x,height(x),side*1.3],.22,m.bark));g.add(cylinderBetween([x,.8,side*1.3],[x-Math.sign(x)*1.2,4.7,side*1.3],.12,m.bark));}
    for(let j=0;j<6;j++){const x=(j%2?-1:1)*(7+j*.12);g.add(mesh(shared().sphere,m.moss,[x,height(x)+.12,side*1.25],[.2,.05,.13]));}
  }
  return bake(g,'ArchedGardenFootbridge');
}

function instance(key,build){if(!prototypes.has(key))prototypes.set(key,build());return prototypes.get(key).clone(true);}

/** Local Y=0 is the ground line. The watch faces +Z; watering rose points +X.
 * Factories return independent transform groups with shared static GPU data.
 * Do not dispose a clone's geometries/materials until every instance is removed.
 */
export function createSeasonLandmarks(){
  shared();
  return {
    wateringCan(){const o=instance('can',buildWateringCan);o.userData.spouts=o.userData.spoutCoordinates.map(p=>new T.Vector3(...p));o.userData.spoutDirection=new T.Vector3(...o.userData.spoutDirection);return o;},
    pocketWatch(){const o=instance('watch',buildPocketWatch);o.userData.hands={hour:o.getObjectByName('hourHand'),minute:o.getObjectByName('minuteHand'),second:o.getObjectByName('secondHand')};return o;},
    lantern(){const o=instance('lantern',buildLantern);o.userData.light=o.getObjectByName('lanternLight');return o;},
    rootArch({snow=false}={}){return instance(snow?'archSnow':'arch',()=>buildRootArch(snow));},
    woodBridge(){return instance('bridge',buildWoodBridge);},
  };
}
