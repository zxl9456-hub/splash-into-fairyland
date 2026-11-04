import {MeshSSSNodeMaterial,Color} from 'three';
import {texture,vec3,float} from 'three/tsl';

// Thin leaves and petals transmit the actual scene lights through their backs.
// Full geometry and normal maps are retained; no transparent sorting is needed.
export function thinMaterial(parameters,strength=.2){
 const material=new MeshSSSNodeMaterial(parameters);
 const tint=new Color(parameters.color??0xffffff);
 material.thicknessColorNode=(parameters.map?texture(parameters.map).rgb:vec3(1)).mul(vec3(tint.r,tint.g,tint.b));
 material.thicknessDistortionNode=float(.18);
 material.thicknessAmbientNode=float(.08);
 material.thicknessAttenuationNode=float(strength);
 material.thicknessPowerNode=float(2.2);
 material.thicknessScaleNode=float(2.5);
 return material;
}
