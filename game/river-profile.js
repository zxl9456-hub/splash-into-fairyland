import {float,positionLocal,positionWorld,vec3,smoothstep,sin} from 'three/tsl';
import {SURF_SECTIONS} from './surf.mjs';
export {bendGeometry,bendStaticGroup} from './river-geometry.mjs';
export function riverHeightNode(z){let h=float(0);for(const s of SURF_SECTIONS){h=h.add(smoothstep(s.from,s.crest,z).mul(s.lift)).sub(smoothstep(s.crest,s.bottom,z).mul(s.lift+s.drop));const t=z.sub(s.bottom).div(s.to-s.bottom).clamp(0,1);h=h.add(sin(t.mul(Math.PI)).pow(2).mul(s.roller));}return h;}
export function fitWaterToRiver(water){
 // Keep Water Pro's FFT, refraction, wake and foam. Only add river elevation
 // to its displacement; the depth and reflection passes use the same profile.
 const material=water.waterMaterial,z=positionLocal.z.add(material.clipmapOffsetUniform.y).negate();
 material.positionNode=material.positionNode.add(vec3(0,riverHeightNode(z),0));material.needsUpdate=true;
 water.renderPassManager.waterDepthPass.setPositionNode(material.positionNode);
 const reflection=water.renderPassManager.gBufferPass?.material;
 if(reflection){reflection.positionNode=reflection.positionNode.add(vec3(0,riverHeightNode(z),0));reflection.needsUpdate=true;}
 const floor=water.floor.getMesh().material;
 floor.positionNode=floor.positionNode.add(vec3(0,riverHeightNode(positionWorld.z.negate()),0));floor.needsUpdate=true;
}
