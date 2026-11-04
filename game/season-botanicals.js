import {thinMaterial} from './thin-material.js';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Seasonal hero flora: reusable geometry, UV atlases and native PBR materials.
// Units are metres at scale=1; +Y is up, flowers are rooted at y=0.
const TAU=Math.PI*2;
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
function texture(kind,size=512){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=noise(u*11,v*11),f=noise(u*67,v*67),grain=hash(x,y);let r,g,b,a=255;
  if(kind==='petal'||kind==='whitePetal'){
   const pink=kind==='petal'?Math.pow(v,.75)*.85:Math.pow(v,3)*.3,edge=Math.pow(Math.abs(u-.5)*2,2)*.12;
   r=252-n*7;g=243-pink*111-edge*40-n*5;b=218-pink*27+v*16-n*5;
  }else if(kind==='lotusLeaf'){
   const radius=Math.hypot(u-.5,v-.5),m=n*.75+f*.25;r=61+m*39+radius*20;g=113+m*46+radius*22;b=39+m*24;
  }else if(kind==='wing'){r=211+f*28;g=237+f*16;b=226+f*20;a=46;}
  else if(kind==='snow'){const k=244+n*8+grain*3;r=k;g=k+1;b=Math.min(255,k+4);}
  else if(kind==='maple'||kind==='ginkgo'){const edge=Math.pow(Math.abs(u-.5)*2,3),patch=Math.max(0,noise(u*17+3,v*17)-.62)*95;const k=235+n*15+f*5-edge*25-patch;r=k;g=k-(kind==='maple'?v*14:5);b=k-22;}
  else if(kind==='bump'){const k=116+n*32+f*22+grain*10;r=g=b=k;}
  else {const k=219+n*23+f*12;r=k;g=k;b=k-7;}
  const i=(y*size+x)*4;im.data[i]=r;im.data[i+1]=g;im.data[i+2]=b;im.data[i+3]=a;
 }
 ctx.putImageData(im,0,0);ctx.lineCap='round';
 if(kind==='petal'||kind==='whitePetal'){
  for(let j=0;j<29;j++){const u=(j+.5)/29;ctx.strokeStyle=`rgba(173,82,112,${.08+hash(j,8)*.13})`;ctx.lineWidth=.6+hash(j,4)*.9;ctx.beginPath();ctx.moveTo(size*(.5+(u-.5)*.22),0);ctx.bezierCurveTo(size*(.5+(u-.5)*.66),size*.3,size*u,size*.62,size*u,size);ctx.stroke();}
  for(let j=0;j<110;j++){const x=hash(j,11)*size,y=hash(j,12)*size;ctx.fillStyle='rgba(255,255,250,.33)';ctx.beginPath();ctx.arc(x,y,.6+hash(j,13)*1.7,0,TAU);ctx.fill();}
 }
 if(kind==='lotusLeaf'){
  for(let j=0;j<22;j++){
   const a=j/22*TAU;ctx.strokeStyle='rgba(207,217,105,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(size*.5,size*.5);ctx.lineTo(size*(.5+Math.cos(a)*.52),size*(.5+Math.sin(a)*.52));ctx.stroke();
   for(let k=2;k<10;k++)for(let side of[-1,1]){const t=k*.047,x=.5+Math.cos(a)*t,y=.5+Math.sin(a)*t;ctx.strokeStyle='rgba(188,209,111,.26)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x*size,y*size);ctx.quadraticCurveTo((x+Math.cos(a+side*.48)*.042)*size,(y+Math.sin(a+side*.48)*.042)*size,(x+Math.cos(a+side*.72)*.074)*size,(y+Math.sin(a+side*.72)*.074)*size);ctx.stroke();}
  }
 }
 if(kind==='maple'){
  const tips=[[.5,.98],[.25,.78],[.04,.52],[.18,.23],[.75,.78],[.96,.52],[.82,.23]];
  ctx.strokeStyle='rgba(255,255,227,.65)';ctx.lineWidth=2.3;
  for(const [x,y] of tips){ctx.beginPath();ctx.moveTo(size*.5,size*.02);ctx.quadraticCurveTo(size*.5,size*.42,x*size,y*size);ctx.stroke();for(let j=2;j<9;j++){const t=j/10,xx=.5+(x-.5)*t,yy=.02+(y-.02)*t;ctx.lineWidth=.65;for(let s of[-1,1]){ctx.beginPath();ctx.moveTo(xx*size,yy*size);ctx.lineTo((xx+s*.07*(1-t*.5))*size,(yy+.065)*size);ctx.stroke();}}}
 }
 if(kind==='ginkgo'){
  ctx.strokeStyle='rgba(255,251,214,.6)';ctx.lineWidth=.9;for(let j=0;j<67;j++){const a=(j/66-.5)*2.6;ctx.beginPath();ctx.moveTo(size*.5,0);ctx.quadraticCurveTo(size*(.5+Math.sin(a)*.25),size*Math.cos(a)*.5,size*(.5+Math.sin(a)*.54),size*(Math.cos(a)*.78+.12));ctx.stroke();}
 }
 if(kind==='wing'){
  ctx.strokeStyle='rgba(143,177,139,.8)';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,size*.5);ctx.bezierCurveTo(size*.3,size*.42,size*.68,size*.46,size,size*.5);ctx.stroke();
  for(let j=1;j<26;j++){const x=j/26;ctx.lineWidth=.85;ctx.strokeStyle='rgba(178,197,161,.64)';for(let side of[-1,1]){ctx.beginPath();ctx.moveTo(x*size,size*.5);ctx.lineTo((x+.07)*size,(.5+side*.47)*size);ctx.stroke();}}
  for(let j=0;j<35;j++){const x=(j+.5)/35;ctx.lineWidth=.55;ctx.strokeStyle='rgba(210,220,182,.65)';for(let q=0;q<4;q++){const y=.1+q*.2;ctx.beginPath();ctx.moveTo(x*size,y*size);ctx.lineTo((x+.045)*size,(y+.09)*size);ctx.lineTo((x+.025)*size,(y+.19)*size);ctx.stroke();}}
 }
 const t=new T.CanvasTexture(c);t.flipY=false;t.anisotropy=8;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;if(kind!=='bump')t.colorSpace=T.SRGBColorSpace;return t;
}
function geometry(p,uv,idx,colors){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(idx)g.setIndex(idx);if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;}
function object(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const m=new T.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;return m;}
function scaled(g,s){g.scale.setScalar(s);return g;}
function tube(points,radius=.04,segments=14,sides=7){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,sides,false);}
function merge(group){group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=buckets.get(o.material)||[];list.push(g);buckets.set(o.material,list);});const out=new T.Group();for(const [m,parts] of buckets){out.add(object(mergeGeometries(parts,false),m));parts.forEach(g=>g.dispose());}return out;}
function petalGeometry(){const p=[],uv=[],idx=[],N=24,M=12;for(let i=0;i<=N;i++){const t=i/N,width=Math.pow(Math.sin(t*Math.PI),.7)*.4;for(let j=0;j<=M;j++){const w=j/M*2-1;p.push(w*width*(1+.035*Math.sin(t*14+w)),.055*Math.abs(w)*Math.sin(Math.PI*t)+.52*t*t+.013*Math.sin(t*31+w)*Math.pow(Math.abs(w),3),-t*1.38);uv.push(j/M,t);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);}
function lotusPoint(t,a){const r=1.72*t*(1+.025*Math.sin(a*7)+.018*Math.cos(a*13));return [Math.cos(a)*r,.035+.26*t*t+.045*Math.sin(a*9+.3)*Math.pow(t,4)+.025*Math.cos(a*22)*t,Math.sin(a)*r];}
function lotusLeafGeometry(){const p=[],uv=[],idx=[],N=15,M=88;for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){const t=i/N,a=j/M*TAU,q=lotusPoint(t,a);p.push(...q);uv.push(.5+q[0]/3.6,.5+q[2]/3.6);}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);}
function mapleGeometry(){
 const half=[[0,0],[-.16,-.23],[-.61,-.2],[-.47,-.48],[-.97,-.66],[-.61,-.76],[-.75,-1.19],[-.37,-1.01],[-.43,-1.55],[-.15,-1.3],[0,-1.98]];
 const outline=[...half,...half.slice(1,-1).reverse().map(([x,z])=>[-x,z])],edge=[];
 for(let j=0;j<outline.length;j++){const a=outline[j],b=outline[(j+1)%outline.length];for(let k=0;k<4;k++){const t=k/4,x=T.MathUtils.lerp(a[0],b[0],t),z=T.MathUtils.lerp(a[1],b[1],t),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),serrate=k%2?.018:0;edge.push([x-dz/len*serrate,z+dx/len*serrate]);}}
 const p=[],uv=[],idx=[],M=edge.length,N=6;
 for(let i=0;i<=N;i++){const t=i/N;for(let j=0;j<=M;j++){const e=edge[j%M],x=e[0]*t,z=T.MathUtils.lerp(-.83,e[1],t),y=.075*Math.sin((z+.1)*3)+Math.pow(t,3)*(.055*Math.sin(j*.37)+Math.abs(x)*.13);p.push(x,y,z);uv.push(.5+x/2,-z/2);}}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);
}
function ginkgoGeometry(){const p=[],uv=[],idx=[],N=13,M=44;for(let i=0;i<=N;i++){const t=i/N;for(let j=0;j<=M;j++){const a=(j/M-.5)*2.65,r=(1.22-.17*Math.exp(-Math.pow(a/.12,2))+.015*Math.sin(a*49))*t,x=Math.sin(a)*r,z=-Math.cos(a)*r-.08*t,y=.095*t*t+.035*Math.sin(a*4)*t*t+.01*Math.cos(a*67)*t;p.push(x,y,z);uv.push(.5+x/2.6,-z/1.4);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);}
function wingGeometry(){const p=[],uv=[],idx=[],N=24,M=6;for(let i=0;i<=N;i++){const t=i/N,width=.19*Math.pow(Math.sin(t*Math.PI),.6);for(let j=0;j<=M;j++){const w=j/M*2-1;p.push(t*1.35,.018*Math.sin(t*Math.PI)+Math.abs(w)*.009,w*width+t*t*.08);uv.push(t,j/M);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+M+1,a+1,a+1,a+M+1,a+M+2);}return geometry(p,uv,idx);}
function snowGeometry(){const p=[],uv=[],idx=[],N=15,M=64;for(let i=0;i<=N;i++){const t=i/N;for(let j=0;j<=M;j++){const a=j/M*TAU,r=Math.sin(t*Math.PI/2)*(1.1+.045*Math.sin(a*7)+.035*Math.sin(a*13)),x=Math.cos(a)*r,z=Math.sin(a)*r,y=.035+.33*Math.pow(Math.cos(t*Math.PI/2),.8)+(noise(x*5+4,z*5+4)-.5)*.042; p.push(x,Math.max(.006,y),z);uv.push(.5+x/2.4,.5+z/2.4);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);}
function icicleGeometry(){const p=[],uv=[],idx=[],N=18,M=16;for(let i=0;i<=N;i++){const t=i/N,r=.15*Math.pow(1-t,1.08)*(1+.045*Math.sin(t*57));for(let j=0;j<=M;j++){const a=j/M*TAU,rr=r*(1+.035*Math.cos(a*9+t*8));p.push(Math.cos(a)*rr+Math.pow(t,2)*.035,-t*1.65,Math.sin(a)*rr);uv.push(j/M,t);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}return geometry(p,uv,idx);}

export function createSeasonBotanicals(){
 const maps={petal:texture('petal',1024),whitePetal:texture('whitePetal',1024),lotusLeaf:texture('lotusLeaf',1024),maple:texture('maple'),ginkgo:texture('ginkgo'),wing:texture('wing'),snow:texture('snow'),bump:texture('bump',256)};
 const materials={
  petal:thinMaterial({map:maps.petal,emissive:0xd989aa,emissiveIntensity:.09,roughness:.62,side:T.DoubleSide,clearcoat:.1}),
  whitePetal:thinMaterial({map:maps.whitePetal,roughness:.64,side:T.DoubleSide,clearcoat:.08}),
  lotusLeaf:thinMaterial({map:maps.lotusLeaf,emissive:0xa2a65c,emissiveMap:maps.lotusLeaf,emissiveIntensity:.2,bumpMap:maps.bump,bumpScale:.018,roughness:.62,clearcoat:.2,clearcoatRoughness:.37,side:T.DoubleSide}),
  stem:new T.MeshStandardMaterial({color:0x648a3d,roughness:.72,bumpMap:maps.bump,bumpScale:.025}),
  pollen:new T.MeshStandardMaterial({color:0xf0c844,roughness:.7}),
  pod:new T.MeshStandardMaterial({color:0xddbd49,roughness:.62,bumpMap:maps.bump,bumpScale:.025}),
  seed:new T.MeshStandardMaterial({color:0x8c7738,roughness:.9}),
  dew:new T.MeshPhysicalMaterial({color:0xe6f8f1,roughness:.08,clearcoat:1,clearcoatRoughness:.06,metalness:.08,transparent:true,opacity:.66,depthWrite:false}),
  wing:new T.MeshPhysicalMaterial({map:maps.wing,roughness:.3,metalness:.1,clearcoat:.35,transparent:true,opacity:.86,side:T.DoubleSide,depthWrite:false}),
  insect:new T.MeshPhysicalMaterial({color:0x3aaf93,roughness:.37,metalness:.34,clearcoat:.25}),
  insectGold:new T.MeshStandardMaterial({color:0xb99d43,roughness:.46,metalness:.28}),
  eye:new T.MeshPhysicalMaterial({color:0x7a4428,roughness:.22,clearcoat:.3}),
  leg:new T.MeshStandardMaterial({color:0x597044,roughness:.75}),
  snow:new T.MeshStandardMaterial({map:maps.snow,color:0xffffff,bumpMap:maps.bump,bumpScale:.035,roughness:.94}),
  ice:new T.MeshPhysicalMaterial({color:0xd4eff5,roughness:.16,clearcoat:.7,clearcoatRoughness:.13,metalness:.05,transparent:true,opacity:.75,depthWrite:false}),
 };
 const geometries={petal:petalGeometry(),lotusLeaf:lotusLeafGeometry(),maple:mapleGeometry(),ginkgo:ginkgoGeometry(),wing:wingGeometry(),snow:snowGeometry(),icicle:icicleGeometry(),sphere:new T.SphereGeometry(1,12,8),drop:new T.SphereGeometry(1,10,7)};
 const lotusRaw=new T.Group(),flower=new T.Group();flower.position.set(.2,2.45,-.08);flower.rotation.x=.38;
 lotusRaw.add(object(tube([[0,0,0],[-.12,.75,.06],[.06,1.7,.02],[.2,2.45,-.08]],.057,22,9),materials.stem),flower);
 const rings=[{n:13,s:1.22,y:0,a:.01,mat:materials.whitePetal},{n:11,s:1.05,y:.07,a:.27,mat:materials.petal},{n:8,s:.76,y:.14,a:.59,mat:materials.petal}];
 for(let ri=0;ri<rings.length;ri++){const ring=rings[ri];for(let j=0;j<ring.n;j++){const pivot=new T.Group(),petal=object(geometries.petal,ring.mat);pivot.rotation.y=j/ring.n*TAU+ri*.27;petal.rotation.x=ring.a+(hash(j,ri)-.5)*.06;petal.position.set(0,ring.y,-.14);petal.scale.set(ring.s*(.94+hash(j,7)*.12),ring.s,ring.s);pivot.add(petal);flower.add(pivot);}}
 flower.add(object(new T.CylinderGeometry(.32,.2,.24,32),materials.pod,[0,.36,0]));
 const seedDisc=new T.CircleGeometry(.027,8);
 for(let j=0;j<19;j++){const a=j*2.399,r=Math.sqrt(j/19)*.265;flower.add(object(seedDisc,materials.seed,[Math.cos(a)*r,.483,Math.sin(a)*r],[1,1,1],[-Math.PI/2,0,0]));}
 const stamenRaw=new T.Group(),anther=new T.SphereGeometry(1,8,4);
 for(let j=0;j<36;j++){const a=j/36*TAU,r=.36+hash(j,5)*.08,h=.27+hash(j,9)*.13,x=Math.cos(a)*r,z=Math.sin(a)*r;stamenRaw.add(object(tube([[x,.1,z],[x*1.04,.2+h*.4,z*1.04],[x*1.12,.15+h,z*1.12]],.008,3,4),materials.pollen));stamenRaw.add(object(anther,materials.pollen,[x*1.12,.15+h,z*1.12],[.018,.035,.018]));}
 flower.add(stamenRaw);
 const lotusShared=merge(lotusRaw),lotus=(scale=1)=>scaled(lotusShared.clone(true),scale);
 const leafRaw=new T.Group();leafRaw.add(object(geometries.lotusLeaf,materials.lotusLeaf));
 for(let j=0;j<9;j++){const a=hash(j,73)*TAU,t=.25+hash(j,79)*.65,p=lotusPoint(t,a),r=.026+hash(j,89)*.045;leafRaw.add(object(geometries.drop,materials.dew,[p[0],p[1]+r*.55,p[2]],[r,r*.7,r]));}
 const lotusLeafShared=merge(leafRaw),lotusLeaf=(scale=1)=>scaled(lotusLeafShared.clone(true),scale);
 const colorMats=new Map();
 function autumnMaterial(kind,color){const key=kind+':'+color;if(!colorMats.has(key))colorMats.set(key,thinMaterial({color,map:maps[kind],emissive:color,emissiveMap:maps[kind],emissiveIntensity:.15,roughness:.52,clearcoat:.19,clearcoatRoughness:.38,side:T.DoubleSide,bumpMap:maps[kind],bumpScale:.028}));return colorMats.get(key);}
 materials.maple=autumnMaterial('maple',0xdca23c);materials.ginkgo=autumnMaterial('ginkgo',0xe2b842);
 const leafStem=tube([[0,0,0],[.015,-.01,.13],[.035,-.04,.28]],.012,4,5);
 function autumnLeaf(kind,scale,color){const g=new T.Group();g.add(object(geometries[kind],autumnMaterial(kind,color)));g.add(object(leafStem,materials.stem));return scaled(g,scale);}
 const mapleLeaf=(scale=1,color=0xdca23c)=>autumnLeaf('maple',scale,color),ginkgoLeaf=(scale=1,color=0xe2b842)=>autumnLeaf('ginkgo',scale,color);
 const insectRaw=new T.Group();insectRaw.add(object(geometries.sphere,materials.insect,[0,.12,0],[.105,.1,.19]),object(geometries.sphere,materials.insectGold,[0,.13,-.25],[.11,.09,.08]));
 for(let j=0;j<11;j++){const t=j/10,r=.053*(1-t*.73);insectRaw.add(object(geometries.sphere,j%3===1?materials.insectGold:materials.insect,[0,.115-t*.035,.2+j*.072],[r,r,.057]));}
 for(let side of[-1,1]){insectRaw.add(object(geometries.sphere,materials.eye,[side*.083,.16,-.265],[.06,.068,.055]));for(let j=0;j<3;j++)insectRaw.add(object(tube([[side*.05,.1,-.09+j*.09],[side*.19,-.005,-.11+j*.09],[side*.2,-.12,-.16+j*.1]],.008,4,4),materials.leg));}
 const insectShared=merge(insectRaw);
 const dragonfly=(scale=1)=>{const g=new T.Group();g.add(insectShared.clone(true));const wings=[];for(let side of[-1,1])for(let row=0;row<2;row++){const wing=object(geometries.wing,materials.wing,[side*.065,.17,row===0?-.1:.075],[row===0?1:.87,1,row===0?1:1.3],[0,(side===1?0:Math.PI)+(row===0?.23:-.3)*side,0]);wing.castShadow=false;g.add(wing);wing.userData.side=side;wing.userData.restRotationY=wing.rotation.y;wings.push(wing);}g.userData.wings=wings;return scaled(g,scale);};
 const snowCap=(scale=1)=>{const g=new T.Group();g.add(object(geometries.snow,materials.snow));return scaled(g,scale);};
 const icicle=(scale=1)=>{const g=new T.Group(),ice=object(geometries.icicle,materials.ice);ice.castShadow=false;g.add(ice);return scaled(g,scale);};
 return {lotus,lotusLeaf,mapleLeaf,ginkgoLeaf,dragonfly,snowCap,icicle,materials,geometries,maps};
}
