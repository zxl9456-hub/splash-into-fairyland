import {thinMaterial} from './thin-material.js';
import * as T from 'three';
import {normalWorld,dot,vec3,max,texture} from 'three/tsl';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Shared code-native PBR atlases. All geometry uses UVs and native Three materials.
const TAU = Math.PI * 2;
const clamp = (x, a=0, b=1) => Math.min(b, Math.max(a, x));
const hash = (x,y=0) => { const n=Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
function atlas(kind,size=512){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');const d=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=noise(u*9,v*9),fine=hash(x,y),grain=noise(u*38,v*38);let rgb;
  if(kind==='leaf') {const ridge=Math.exp(-Math.abs(u-.5)*100),edge=Math.abs(u-.5)*2;const fleck=Math.max(0,grain-.62)*42;rgb=[49+n*37+ridge*31+fleck,119+n*48+ridge*34-edge*10,38+n*25+ridge*13];}
  else if(kind==='leaf-bump') {const v0=113+n*20+grain*20;rgb=[v0,v0,v0];}
  else if(kind==='stone') {const k=55+n*48+grain*25+fine*12;rgb=[k*.91,k,k*.97];}
  else if(kind==='stone-bump') {const k=65+n*85+grain*60+fine*30;rgb=[k,k,k];}
  else if(kind==='moss') {const k=n*.15+noise(u*80,v*80)*.48+noise(u*180,v*180)*.25+fine*.12;rgb=[42+k*76,74+k*90,19+k*28];}
  else if(kind==='stem'){const fibres=Math.pow(Math.max(0,Math.sin(u*121+noise(u*15,v*7)*7)),8);const fleck=Math.pow(noise(u*58,v*80),7)*190;rgb=[239-n*21-fibres*22-fleck,224-n*23-fibres*30-fleck,188-n*24-fibres*29-fleck*.8];}
  else if(kind==='moss-bump'){const k=70+noise(u*96,v*96)*110+fine*36;rgb=[k,k,k];}
  else if(kind==='bark'){const lines=Math.pow(Math.max(0,Math.sin(u*150+noise(u*7,v*4)*7)),9);const k=63+n*31+grain*15-lines*34;rgb=[k*1.15,k*.9,k*.61];}
  else if(kind==='bark-bump'){const k=90+noise(u*55,v*4)*90+Math.sin(u*150+noise(u*7,v*4)*7)*27;rgb=[k,k,k];}
  else if(kind==='cap'){const edge=Math.hypot(u-.5,v-.5);rgb=[177+n*36+grain*12,49+n*33+edge*13,36+n*21];}
  else if(kind==='cap-bump'){const k=113+n*12+grain*18;rgb=[k,k,k];}
  else if(kind==='petal'){const edge=Math.abs(u-.5)*2;rgb=[246-n*9,240-n*13-edge*9,218-n*20-edge*10];}
  else {const k=150+grain*45+fine*22;rgb=[k,k,k];}
  const i=(y*size+x)*4;d.data[i]=rgb[0];d.data[i+1]=rgb[1];d.data[i+2]=rgb[2];d.data[i+3]=255;
 }
 ctx.putImageData(d,0,0);
 if(kind==='leaf'||kind==='leaf-bump'){
  ctx.lineCap='round';ctx.strokeStyle=kind==='leaf'?'rgba(193,210,94,.52)':'rgba(240,240,240,.8)';ctx.lineWidth=2;
  for(let s of[-1,1])for(let j=1;j<15;j++){const y=size*(j/16)+(hash(j,s)-.5)*size*.018;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(size*.5,y);ctx.bezierCurveTo(size*(.5+s*.13),y-size*.05,size*(.5+s*.27),y-size*.12,size*(.5+s*.48),y-size*.16);ctx.stroke();ctx.lineWidth=.5;for(let q=1;q<5;q++){const x=size*(.5+s*q*.085),yy=y-size*q*.028;ctx.beginPath();ctx.moveTo(x,yy);ctx.bezierCurveTo(x+s*size*.03,yy-size*.02,x+s*size*.055,yy-size*.045,x+s*size*.07,yy-size*.075);ctx.stroke();}}
  ctx.lineWidth=4;ctx.strokeStyle=kind==='leaf'?'rgba(211,224,125,.68)':'white';ctx.beginPath();ctx.moveTo(size*.5,0);ctx.lineTo(size*.5,size);ctx.stroke();
 }
 if(kind==='cap'||kind==='cap-bump'){
  for(let j=0;j<145;j++){const x=hash(j,7)*size,y=hash(j,12)*size,r=2+Math.pow(hash(j,19),1.6)*8;ctx.fillStyle=kind==='cap' ? `rgba(255,242,215,${.7+hash(j,22)*.25})` : 'rgb(195,195,195)';ctx.beginPath();for(let k=0;k<12;k++){const a=k/12*TAU,rr=r*(.82+hash(j,k)*.28);const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}
 }
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(!kind.includes('bump')&&kind!=='rough')t.colorSpace=T.SRGBColorSpace;return t;
}
function mesh(g,m){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;return o;}
function place(g,m,p=[0,0,0],s=[1,1,1],r=[0,0,0]){const o=mesh(g,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);return o;}
function groupScale(g,s){g.scale.setScalar(s);return g;}
function tube(points,r=.05,segments=14,sides=6){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,sides,false);}
function leafGeometry(n=22,m=10,petal=false,variant=0){
 const p=[],uv=[],idx=[];
 for(let i=0;i<=n;i++){
  const t=i/n,envelope=Math.sin(t*Math.PI),bend=Math.sin(t*Math.PI*.85+variant*.6)*t*.11;
  for(let j=0;j<=m;j++){
   const w=j/m*2-1,edge=Math.pow(Math.abs(w),2),rib=Math.sin(t*17*Math.PI+(w>0?.8:0)+variant)*.015;
   const width=Math.pow(envelope,petal?.58:.77)*(petal?.42:.64)*(1+(w<0?.09:-.025)*Math.sin(t*Math.PI)+Math.sin(t*19+variant+w)*.035);
   const ripple=petal?.018:.018;
   const y=envelope*(.18+Math.abs(w)*.11)+Math.sin(t*TAU)*.035-Math.pow(t,5)*(.18+variant*.025)+edge*Math.sin(t*29+variant+w*2)*ripple+rib*edge+Math.sin(t*8+variant)*w*.055;
   p.push(w*width+bend,y,-t*(petal?1.12:2.5)+Math.sin(t*24+variant)*edge*.022);uv.push(j/m,t);
  }
 }
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j;idx.push(a,a+1,a+m+1,a+1,a+m+2,a+m+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function surfaceGeometry(p,uv,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(idx)g.setIndex(idx);g.computeVertexNormals();return g;}
function capPoint(t,a,variant=0,underside=false){
 const rim=1.49*(1+Math.sin(a*3+variant)*.046+Math.sin(a*7+1.3)*.023),r=rim*Math.sin(t*Math.PI/2);
 const cx=.1*Math.cos(variant+.5),cz=.08*Math.sin(variant+.7),undulation=Math.pow(t,2.5)*(Math.sin(a*3+variant)*.065+Math.sin(a*9+1.7)*.024);
 const h=underside ? 2.07-Math.sin(t*Math.PI)*.055 : 2.07+(.7+variant*.055)*Math.pow(Math.cos(t*Math.PI/2),.86);
 return [cx+Math.cos(a)*r*(1+variant*.015),h+undulation+Math.sin(a+variant)*t*.07,cz+Math.sin(a)*r];
}
function capGeometry(variant=0,underside=false){
 const p=[],uv=[],idx=[],N=underside?5:14,M=56;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){const t=i/N,a=j/M*TAU,v=capPoint(t,a,variant,underside);p.push(...v);uv.push(.5+(v[0]-.1*Math.cos(variant+.5))/3.4,.5+(v[2]-.08*Math.sin(variant+.7))/3.4);}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;underside?idx.push(a,a+M+1,a+1,a+1,a+M+1,a+M+2):idx.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}
 return surfaceGeometry(p,uv,idx);
}
function gillGeometry(variant=0){
 const p=[],uv=[],idx=[];
 for(let j=0;j<64;j++){
  const a=j/64*TAU+(hash(j,3)-.5)*.009,start=j%3===0?.32:.11,offset=p.length/3;
  for(let k=0;k<=6;k++){const t=start+(1-start)*k/6,v=capPoint(t,a,variant,true),depth=Math.sin(k/6*Math.PI)*(.012+hash(j,2)*.008)+.004;for(let side of[-1,1]){p.push(v[0]+Math.cos(a+Math.PI/2)*side*.005,v[1]-(side===1?depth:0),v[2]+Math.sin(a+Math.PI/2)*side*.005);uv.push(k/6,(side+1)/2);}}
  for(let k=0;k<6;k++){const n=offset+k*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 return surfaceGeometry(p,uv,idx);
}
function mushroomStemGeometry(variant=0){
 const p=[],uv=[],idx=[],N=16,M=14;
 for(let i=0;i<=N;i++){const t=i/N,r=.235*(1+.35*Math.pow(1-t,4)-.13*Math.sin(t*Math.PI)+.18*Math.pow(t,5));for(let j=0;j<=M;j++){const a=j/M*TAU,rr=r*(1+Math.sin(a*7+t*13)*.035);p.push(Math.cos(a)*rr+Math.sin(t*4+variant)*.065,t*2.17,Math.sin(a)*rr+Math.sin(t*3+variant)*.035);uv.push(j/M,t);}}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j;idx.push(a,a+M+1,a+1,a+1,a+M+1,a+M+2);}return surfaceGeometry(p,uv,idx);
}
function merged(group){group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;const a=buckets.get(o.material)||[];const g=o.geometry.clone().applyMatrix4(o.matrixWorld);a.push(g);buckets.set(o.material,a);});const out=new T.Group();for(const [m,gs] of buckets){const g=mergeGeometries(gs,false);if(g)out.add(mesh(g,m));gs.forEach(g=>g.dispose());}return out;}
function stoneGeometry(){let g=new T.IcosahedronGeometry(1,8);g.deleteAttribute('normal');g=mergeVertices(g,1e-4);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(noise(x*3+3+y*1.5,z*3+4)-.5)*.38+Math.sin(y*14+x*4)*.028;p.setXYZ(i,x*k*1.27,(y*k+1)*.68+noise(x*8+3,z*8+4)*.055,z*k*1.08);}g.computeVertexNormals();return g;}
function mossGeometry(g){const src=g.index?g.toNonIndexed():g;const p=src.attributes.position,u=src.attributes.uv,nn=src.attributes.normal,pp=[],uv=[],normal=[];for(let i=0;i<p.count;i+=3){const y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,x=p.getX(i),z=p.getZ(i);if(y<.68+(noise(x*3,z*3)-.5)*.27)continue;for(let j=0;j<3;j++){pp.push(p.getX(i+j)*1.012,p.getY(i+j)+.045+noise(p.getX(i+j)*9,p.getZ(i+j)*9)*.07,p.getZ(i+j)*1.012);uv.push(u.getX(i+j)*2,u.getY(i+j)*2);normal.push(nn.getX(i+j),nn.getY(i+j),nn.getZ(i+j));}}const m=new T.BufferGeometry();m.setAttribute('position',new T.Float32BufferAttribute(pp,3));m.setAttribute('uv',new T.Float32BufferAttribute(uv,2));m.setAttribute('normal',new T.Float32BufferAttribute(normal,3));return m;}

export function createBotanicalAssets(){
 const textures={leaf:atlas('leaf',1024),leafBump:atlas('leaf-bump',1024),stone:atlas('stone'),stoneBump:atlas('stone-bump'),moss:atlas('moss'),mossBump:atlas('moss-bump'),stem:atlas('stem'),bark:atlas('bark'),barkBump:atlas('bark-bump'),cap:atlas('cap'),capBump:atlas('cap-bump'),petal:atlas('petal'),rough:atlas('rough',256)};
 const materials={
  leaf:thinMaterial({map:textures.leaf,bumpMap:textures.leafBump,bumpScale:.045,roughnessMap:textures.rough,roughness:.46,clearcoat:.32,clearcoatRoughness:.3,side:T.DoubleSide}),
  stem:new T.MeshStandardMaterial({color:0x9cab72,map:textures.leaf,bumpMap:textures.leafBump,bumpScale:.025,roughness:.55}),
  stone:new T.MeshPhysicalMaterial({map:textures.stone,bumpMap:textures.stoneBump,bumpScale:.16,roughness:.34,clearcoat:.45,clearcoatRoughness:.4}),
  moss:new T.MeshStandardMaterial({map:textures.moss,bumpMap:textures.mossBump,bumpScale:.12,roughness:.95}),
  bark:new T.MeshStandardMaterial({map:textures.bark,bumpMap:textures.barkBump,bumpScale:.12,roughness:.76}),
  mushroom:new T.MeshPhysicalMaterial({map:textures.cap,bumpMap:textures.capBump,bumpScale:.055,roughness:.65,clearcoat:.1,clearcoatRoughness:.45}),
  ivory:new T.MeshStandardMaterial({color:0xfff5df,map:textures.stem,bumpMap:textures.barkBump,bumpScale:.025,roughness:.78,side:T.DoubleSide}),
  gill:new T.MeshStandardMaterial({color:0xe4cda5,roughness:.88,side:T.DoubleSide}),
  white:thinMaterial({map:textures.petal,roughness:.58,side:T.DoubleSide}),
  violet:thinMaterial({color:0x9875d4,map:textures.petal,roughness:.48,side:T.DoubleSide}),
  pollen:new T.MeshStandardMaterial({color:0xe2b841,bumpMap:textures.stoneBump,bumpScale:.04,roughness:.9}),
  pink:thinMaterial({color:0xee719a,map:textures.petal,bumpMap:textures.leafBump,bumpScale:.018,roughness:.43,clearcoat:.15,side:T.DoubleSide}),
  mouth:new T.MeshPhysicalMaterial({color:0x662746,roughness:.4,clearcoat:.25,side:T.DoubleSide}),
  lip:new T.MeshPhysicalMaterial({color:0xc44f87,roughness:.4,clearcoat:.28}),
  tooth:new T.MeshStandardMaterial({color:0xffe7af,roughness:.45}),
  dew:new T.MeshPhysicalMaterial({color:0xd8f3e9,roughness:.09,metalness:.05,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.62,depthWrite:false}),
 };
 materials.mushroom.color.setHex(0xffdbce);materials.mushroom.clearcoat=.3;materials.mushroom.roughness=.48;
 materials.leaf.emissiveNode=texture(textures.leaf).rgb.mul(vec3(1.1,1,.4)).mul(max(dot(normalWorld,vec3(.3,-.82,.5)),0).pow(1.8)).mul(.055);
 const geometries={leaf:leafGeometry(),petal:leafGeometry(18,8,true),heroPetal:leafGeometry(24,12,true),pollen:new T.SphereGeometry(1,8,6),sphere:new T.SphereGeometry(1,12,8),cap:capGeometry(),stone:stoneGeometry(),smallLeaf:leafGeometry(12,5)};
 textures.bark.center.set(.5,.5);textures.bark.rotation=Math.PI/2;textures.barkBump.center.set(.5,.5);textures.barkBump.rotation=Math.PI/2;const scanLoader=new T.TextureLoader();const scan=(name,color=false,rot=0)=>{const t=scanLoader.load('./art-textures/'+name+'.jpg');t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;t.center.set(.5,.5);t.rotation=rot;return t;};
 materials.stone.map=scan('mossy_rock-diff',true);materials.stone.normalMap=scan('mossy_rock-nor_gl');materials.stone.normalScale=new T.Vector2(.8,.8);materials.stone.bumpMap=null;materials.stone.roughness=.58;materials.stone.clearcoat=.22;
 materials.bark.map=scan('bark_brown_02-diff',true,Math.PI/2);materials.bark.normalMap=scan('bark_brown_02-nor_gl',false,Math.PI/2);materials.bark.bumpMap=null;materials.bark.normalScale=new T.Vector2(1,1);materials.bark.color.setHex(0xcdbb96);
 materials.moss.normalMap=scan('mossy_rock-nor_gl');materials.moss.normalMap.repeat.set(2,2);materials.moss.normalScale=new T.Vector2(.8,.8);materials.moss.bumpScale=.025;materials.moss.color.setHex(0xc9d19b);
 geometries.moss=mossGeometry(geometries.stone);
 geometries.leafVariants=[geometries.leaf,leafGeometry(22,10,false,1),leafGeometry(22,10,false,2)];
 let leafIndex=0,mushroomIndex=0;
 const leaf=(scale=1)=>{const g=new T.Group();g.add(mesh(geometries.leafVariants[leafIndex++%3],materials.leaf));return groupScale(g,scale);};
 // Fine geometric moss tips break the smooth shell silhouette at close range.
 const sampleStone=mesh(geometries.stone,materials.stone),ray=new T.Raycaster(),mp=[],mu=[],mi=[];
 sampleStone.updateMatrixWorld(true);
 for(let j=0;j<120;j++){
  const x=(hash(j,71)-.5)*2.1,z=(hash(j,83)-.5)*1.7;ray.set(new T.Vector3(x,3,z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(sampleStone,false)[0];
  if(!hit||hit.point.y<.77)continue;
  for(let k=0;k<3;k++){
   const a=hash(j,k)*TAU,h=.04+hash(j+4,k)*.08,w=.01+hash(j,k+2)*.008,base=mp.length/3,xx=x+Math.cos(a)*.02,zz=z+Math.sin(a)*.02,yy=hit.point.y+.016;
   mp.push(xx-Math.cos(a)*w,yy,zz-Math.sin(a)*w,xx+Math.cos(a)*w,yy,zz+Math.sin(a)*w,xx+Math.sin(a)*h*.3,yy+h,zz+Math.cos(a)*h*.3);mu.push(0,0,1,0,.5,1);mi.push(base,base+1,base+2);
  }
 }
 geometries.mossTips=surfaceGeometry(mp,mu,mi);materials.moss.side=T.DoubleSide;
 const rock=(scale=1)=>{const g=new T.Group();g.add(mesh(geometries.stone,materials.stone),mesh(geometries.moss,materials.moss),mesh(geometries.mossTips,materials.moss));return groupScale(g,scale);};
 // Shared asymmetric variants prevent repeated umbrella silhouettes.
 const mushroomPrototypes=[];
 for(let variant=0;variant<3;variant++){
  const g=new T.Group();g.add(mesh(capGeometry(variant),materials.mushroom),mesh(mushroomStemGeometry(variant),materials.ivory),mesh(capGeometry(variant,true),materials.ivory),mesh(gillGeometry(variant),materials.gill));
  const p=[],uv=[],idx=[];
  for(let j=0;j<=32;j++){const a=j/32*TAU;for(let k=0;k<2;k++){const r=k?.34+Math.sin(a*7)*.025:.235;p.push(Math.cos(a)*r+.02,1.53-(k?.09+Math.sin(a*5)*.035:0),Math.sin(a)*r);uv.push(j/32,k);}if(j<32){const n=j*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
  g.add(mesh(surfaceGeometry(p,uv,idx),materials.ivory));mushroomPrototypes.push(g);
 }
 const mushroom=(scale=1)=>groupScale(mushroomPrototypes[mushroomIndex++%3].clone(true),scale);
 const patchPrototype=new T.Group();
 for(let f=0;f<8;f++){
  const a=f*2.3999,r=Math.sqrt(f/8)*1.12,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.48+hash(f,4)*.64,violet=f%3===0;
  patchPrototype.add(mesh(tube([[x,0,z],[x+.07,h*.5,z],[x,h,z]],.015,4,4),materials.stem));
  const flower=new T.Group();flower.position.set(x,h,z);flower.rotation.set((hash(f,14)-.5)*.5,hash(f,13)*TAU,(hash(f,11)-.5)*.3);
  const count=violet?5:10;for(let i=0;i<count;i++){const p=mesh(geometries.petal,violet?materials.violet:materials.white);p.rotation.y=i/count*TAU;p.scale.setScalar(violet?.38:.3);flower.add(p);}flower.add(place(geometries.pollen,materials.pollen,[0,.04,0],[violet?.07:.095,.045,violet?.07:.095]));patchPrototype.add(flower);
  for(let j=0;j<2;j++){const l=mesh(geometries.smallLeaf,materials.leaf);l.position.set(x,h*(.25+j*.2),z);l.rotation.set(-.5,j*Math.PI+f,0);l.scale.setScalar(.15);patchPrototype.add(l);}
 }
 const patch=merged(patchPrototype);
 const flowerPatch=(scale=1)=>groupScale(patch.clone(true),scale);
 const root=(length=8)=>{
  const g=new T.Group(),pieces=new T.Group();const pts=[[0,.18,0],[.65,.38,-length*.22],[-.35,.29,-length*.48],[.18,.75,-length*.75],[.7,1.65,-length]];
  pieces.add(mesh(tube(pts,.34,18,9),materials.bark));
  for(let j=0;j<3;j++){const t=(j+1)/4,z=-length*t;pieces.add(mesh(tube([[.15,.25,z],[j%2?-.6:.7,.15,z-.7],[j%2?-1.3:1.4,.02,z-1.4]],.11,8,6),materials.bark));}
  g.add(merged(pieces));return g;
 };
 const carnivorousPlant=()=>{
  const g=new T.Group(),head=new T.Group();
  g.add(mesh(tube([[0,0,0],[-.3,1.2,0],[.1,2.5,-.15],[.5,3.6,0]],.15,18,9),materials.stem));
  for(let j=0;j<5;j++){const l=leaf(.65+j*.06);l.position.set(j%2?.05:-.08,.5+j*.43,0);l.rotation.set(-.55,j*2.4,0);g.add(l);}
  head.position.set(.5,3.6,0);g.add(head);
  for(let j=0;j<8;j++){const p=mesh(geometries.heroPetal,materials.pink);const a=j/8*TAU;p.position.set(Math.sin(a)*.42,Math.cos(a)*.42,.1);p.rotation.set(Math.PI/2,0,-a);p.scale.set(1.35,1.35,1.6);head.add(p);}
  const bowl=place(new T.SphereGeometry(1,24,12),materials.mouth,[0,0,-.12],[.72,.6,.25]);head.add(bowl);
  const bottom=new T.Group(),jaw=new T.Group();jaw.position.z=-.18;head.add(bottom,jaw);
  const lipPoints=(upper)=>Array.from({length:17},(_,i)=>{const a=i/16*Math.PI;return [Math.cos(a)*.74,Math.sin(a)*(upper?.54:-.54),.17];});
  bottom.add(mesh(tube(lipPoints(false),.092,16,7),materials.lip));jaw.add(mesh(tube(lipPoints(true),.092,16,7),materials.lip));
  const fang=new T.ConeGeometry(.065,.23,6);for(let j=1;j<9;j++){const a=j/9*Math.PI;bottom.add(place(fang,materials.tooth,[Math.cos(a)*.66,-Math.sin(a)*.45+.04,.2],[1,1,1]));jaw.add(place(fang,materials.tooth,[Math.cos(a)*.66,Math.sin(a)*.45-.04,.2],[1,1,1],[Math.PI,0,0]));}
  g.userData.jaw=jaw;g.userData.mouth=head;g.userData.head=head;g.userData.restJaw=0;return g;
 };
 // Groundcover prototypes are generated once, then cheaply cloned and merged by material.
 const fernPrototype=new T.Group(),pinna=leafGeometry(8,4,false,1);
 for(let f=0;f<5;f++){
  const frond=new T.Group(),angle=f*2.399+.2,extent=.85+hash(f,33)*.45;
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,.02,0),new T.Vector3(.04,.65,-.32),new T.Vector3(.07,.98,-.85),new T.Vector3(.12,.71,-1.4)]);
  frond.add(mesh(new T.TubeGeometry(curve,14,.012,4,false),materials.stem));
  for(let j=0;j<14;j++){
   const t=.12+j*.058,point=curve.getPoint(t),size=Math.sin(t*Math.PI)*.24*(1-j*.016);
   for(let side of[-1,1]){const l=mesh(pinna,materials.leaf);l.position.copy(point);l.rotation.set(-.16+Math.sin(t*3)*.22,side*(1.22-t*.33),side*.09);l.scale.set(size*.7,size,size);frond.add(l);}
  }
  frond.rotation.y=angle;frond.scale.setScalar(extent);fernPrototype.add(frond);
 }
 const fernShared=merged(fernPrototype),fern=(scale=1)=>groupScale(fernShared.clone(true),scale);
 const gp=[],gu=[],gi=[];
 for(let j=0;j<42;j++){
  const a=hash(j,45)*TAU,r=Math.sqrt(hash(j,62))*.68,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.22+hash(j,56)*.56,w=.012+hash(j,12)*.024,bend=.08+hash(j,19)*.3,base=gp.length/3;
  for(let k=0;k<=5;k++){const t=k/5,ww=w*Math.pow(1-t,.7);for(let side of[-1,1]){gp.push(x+Math.sin(a)*bend*t*t+Math.cos(a)*ww*side,h*t-h*.16*t*t*t,z+Math.cos(a)*bend*t*t-Math.sin(a)*ww*side);gu.push((side+1)/2,t);}}
  for(let k=0;k<5;k++){const n=base+k*2;gi.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 geometries.grass=surfaceGeometry(gp,gu,gi);const grassPatch=(scale=1)=>{const g=new T.Group();g.add(mesh(geometries.grass,materials.leaf));return groupScale(g,scale);};
 const cp=[0,.025,-.35],cu=[.5,.5],ci=[];
 for(let j=0;j<=28;j++){const a=j/28*TAU,x=.32*Math.pow(Math.sin(a),3),z=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)+17)/32*.66;cp.push(x,.02+Math.sin(-z*Math.PI/.66)*.035+Math.abs(x)*.08,z);cu.push(.5+x/ .7,-z/.66);if(j<28)ci.push(0,j+1,j+2);}
 geometries.clover=surfaceGeometry(cp,cu,ci);const cloverPrototype=new T.Group();
 for(let j=0;j<7;j++){
  const a=j*2.399,r=Math.sqrt(j/7)*.67,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.14+hash(j,79)*.25;
  cloverPrototype.add(mesh(tube([[x,0,z],[x+.025,h*.5,z],[x,h,z]],.009,4,4),materials.stem));
  for(let k=0;k<3;k++){const l=mesh(geometries.clover,materials.leaf);l.position.set(x,h,z);l.rotation.set((hash(j,k)-.5)*.22,k*TAU/3+a,0);l.scale.setScalar(.52+hash(j,81)*.12);cloverPrototype.add(l);}
 }
 const cloverShared=merged(cloverPrototype),clover=(scale=1)=>groupScale(cloverShared.clone(true),scale);
 const dewPrototype=new T.Group(),drop=new T.SphereGeometry(1,10,7);
 for(let j=0;j<6;j++){const r=.025+hash(j,47)*.035;dewPrototype.add(place(drop,materials.dew,[(hash(j,29)-.5)*.75,r*.65,-hash(j,39)*1.7],[r,r*.67,r]));}
 const dewShared=merged(dewPrototype),dewDrops=(scale=1)=>groupScale(dewShared.clone(true),scale);
 const stoneSegment=(width=1.3,height=1.7,depth=2)=>{const g=new T.Group();const s=rock(1);s.scale.set(width/2.7,height/1.16,depth/2.2);g.add(s);return g;};
 return {leaf,mushroom,flowerPatch,rock,root,carnivorousPlant,fern,grassPatch,clover,dewDrops,stoneSegment,materials,geometries,textures};
}
