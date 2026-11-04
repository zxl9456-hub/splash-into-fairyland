import * as T from 'three';
import {pass,mix,float} from 'three/tsl';
import {ao} from 'three/addons/tsl/display/GTAONode.js';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
export function createGardenLight(renderer,scene,camera){
 const pipeline=new T.RenderPipeline(renderer),scenePass=pass(scene,camera),color=scenePass.getTextureNode('output');
 const softLight=bloom(color,.12,.3,2.0);
 // The current WebGPU backend compiler rejects this optional GTAO shader.
 // Directional shadows remain active on both backends.
 if(renderer.backend.isWebGPUBackend){pipeline.outputNode=color.add(softLight);}
 else{const occlusion=ao(scenePass.getTextureNode('depth'),null,camera);occlusion.resolutionScale=.5;occlusion.radius.value=1.3;occlusion.thickness.value=1.8;occlusion.samples.value=8;occlusion.scale.value=1.2;pipeline.outputNode=color.mul(mix(float(1),occlusion.getTextureNode().r,.65)).add(softLight);}
 return pipeline;
}
