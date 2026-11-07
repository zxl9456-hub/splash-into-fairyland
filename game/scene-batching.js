import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {bendGeometry} from './river-geometry.mjs';
import {riverHeight} from './surf.mjs';

// Build in bounded steps; retain the original detailed geometry and materials.
export function* batchScenerySteps(group){
 group.updateMatrixWorld(true);
 const repeated=new Map(),unique=new Map(),out=new T.Group();
 out.userData.ownedMaterials=group.userData.ownedMaterials||[];
 const scale=new T.Vector3(),extent=new T.Vector3(),local=new T.Matrix4();
 function add(o,matrix){
  const key=o.geometry.uuid+':'+o.material.uuid;
  if(!repeated.has(key))repeated.set(key,[]);
  repeated.get(key).push({geometry:o.geometry,material:o.material,matrix});
 }
 let complete=false;
 try{
 for(const root of group.children){
  root.traverse(o=>{
   if(!o.isMesh||Array.isArray(o.material))return;
   if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,local);add(o,new T.Matrix4().multiplyMatrices(o.matrixWorld,local));}}
   else add(o,o.matrixWorld.clone());
  });
  yield;
 }
 for(const objects of repeated.values()){
  const first=objects[0],geometry=first.geometry;
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  geometry.boundingBox.getSize(extent);
  const small=objects.every(o=>extent.z*scale.setFromMatrixScale(o.matrix).length()<18);
  if(objects.length>1&&small){
   const inst=new T.InstancedMesh(geometry,first.material,objects.length);
   if(!geometry.boundingSphere)geometry.computeBoundingSphere();
   const bounds=new Float32Array(objects.length*4),sphere=new T.Sphere();
   objects.forEach((o,i)=>{
    o.matrix.elements[13]+=riverHeight(-o.matrix.elements[14]);inst.setMatrixAt(i,o.matrix);
    sphere.copy(geometry.boundingSphere).applyMatrix4(o.matrix);
    bounds.set([sphere.center.x,sphere.center.y,sphere.center.z,sphere.radius+.8],i*4);
   });
   inst.userData.sceneryInstances={matrices:inst.instanceMatrix.array.slice(),bounds};
   inst.instanceMatrix.setUsage(T.DynamicDrawUsage);
   inst.castShadow=!first.material.transparent;inst.receiveShadow=true;
   inst.computeBoundingBox();inst.computeBoundingSphere();out.add(inst);
   if(geometry.lodGeometry){
    const far=new T.InstancedMesh(geometry.lodGeometry,first.material,objects.length);
    far.instanceMatrix.setUsage(T.DynamicDrawUsage);far.castShadow=inst.castShadow;far.receiveShadow=true;
    far.boundingBox=inst.boundingBox.clone();far.boundingSphere=inst.boundingSphere.clone();far.count=0;
    inst.userData.sceneryInstances.far=far;out.add(far);
   }
   yield;continue;
  }
  for(const o of objects){
   const geo=o.geometry.clone().applyMatrix4(o.matrix);
   if(!geo.attributes.normal)geo.computeVertexNormals();
   if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
   for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);
   const key=o.material.uuid+':'+Boolean(geo.index);
   if(!unique.has(key))unique.set(key,{material:o.material,parts:[]});
   unique.get(key).parts.push(geo);yield;
  }
 }
 for(const {material,parts} of unique.values()){
  const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());parts.length=0;
  if(!geo)throw new Error('Unable to batch river scenery');
  bendGeometry(geo);geo.userData.chunkOwned=true;
  const m=new T.Mesh(geo,material);m.castShadow=!material.transparent;m.receiveShadow=true;out.add(m);yield;
 }
 // Static transforms need no per-frame matrix recomputation.
 out.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
 complete=true;return out;
 }finally{
  if(!complete){for(const {parts} of unique.values())parts.forEach(g=>g.dispose());disposeScenery(out);}
 }
}
export function batchScenery(group){const steps=batchScenerySteps(group);let step;do{step=steps.next();}while(!step.done);return step.value;}

const frustum=new T.Frustum(),projection=new T.Matrix4(),viewProjection=new T.Matrix4(),sphere=new T.Sphere();
// Three culls an InstancedMesh as one object. Compact its visible instances so
// leaves behind the camera are not submitted in every water/shadow pass.
// A generous view margin and nearby shadow casters prevent edge flicker.
export function cullScenery(root,camera){
 camera.updateMatrixWorld();projection.copy(camera.projectionMatrix);projection.elements[0]*=.84;projection.elements[5]*=.84;
 viewProjection.multiplyMatrices(projection,camera.matrixWorldInverse);
 frustum.setFromProjectionMatrix(viewProjection,camera.coordinateSystem);
 let total=0,visible=0;
 root.traverse(o=>{
  const data=o.userData.sceneryInstances;if(!data)return;
  const {matrices,bounds,far}=data;let count=0,farCount=0;
  for(let i=0;i<bounds.length/4;i++){
   const b=i*4;sphere.center.fromArray(bounds,b);sphere.radius=bounds[b+3];
   const near=sphere.center.distanceToSquared(camera.position)<225;
   if(!near&&!frustum.intersectsSphere(sphere))continue;
   const distanceSquared=sphere.center.distanceToSquared(camera.position);
   if(far&&distanceSquared>Math.max(20,(sphere.radius-.8)*18)**2)far.instanceMatrix.array.set(matrices.subarray(i*16,i*16+16),farCount++*16);
   else o.instanceMatrix.array.set(matrices.subarray(i*16,i*16+16),count++*16);
  }
  total+=bounds.length/4;visible+=count+farCount;o.count=count;o.instanceMatrix.needsUpdate=true;if(far){far.count=farCount;far.instanceMatrix.needsUpdate=true;}
 });
 return {total,visible};
}
export function disposeScenery(root){
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{
  if(o.isInstancedMesh)o.dispose();
  if(o.geometry?.userData.chunkOwned)geometries.add(o.geometry);
  for(const m of o.userData.ownedMaterials||[])materials.add(m);
 });
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 root.removeFromParent();root.clear();
}
