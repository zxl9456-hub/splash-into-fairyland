import * as T from 'three';
import {center,random} from './core.mjs';
import {riverHeight} from './surf.mjs';

// Local, depth-tested shafts. These are scene geometry, not a reference-image overlay.
export function createAtmosphere(scene){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,512);
 for(let y=0;y<512;y++)for(let x=0;x<128;x++){
  const i=(y*128+x)*4,u=x/127,v=y/511;
  data.data[i]=255;data.data[i+1]=248;data.data[i+2]=223;
  data.data[i+3]=255*Math.pow(Math.sin(Math.PI*u),3)*Math.pow(Math.sin(Math.PI*v),1.5);
 }
 ctx.putImageData(data,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map,transparent:true,opacity:.085,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
 const root=new T.Group(),beams=[],r=random(9921);scene.add(root);
 for(let i=0;i<9;i++){
  const m=new T.Mesh(new T.PlaneGeometry(.7+r()*1.8,30),material);
  m.rotation.z=-.52;m.renderOrder=3;root.add(m);
  beams.push({m,z:i*8+20,x:-5+r()*12});
 }
 return {update(z,time,weights){
  material.opacity=.065+weights[2]*.035+weights[3]*.045;
  material.color.setRGB(1,1-weights[2]*.06,1-weights[2]*.17);
  for(const b of beams){const worldZ=Math.floor((z+b.z)/72)*72+b.z;b.m.position.set(center(worldZ)+b.x,riverHeight(worldZ)+12,-worldZ);}
 }};
}
