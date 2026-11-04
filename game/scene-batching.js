import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {bendGeometry} from './river-geometry.mjs';
import {riverHeight} from './surf.mjs';

// Preserve repeated plants as shared meshes. Expanding every leaf into a
// non-indexed bank consumed ~870 MB for just four starting chunks.
export function batchScenery(group){
 group.updateMatrixWorld(true);
 const repeated=new Map(),unique=new Map(),out=new T.Group();
 group.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material))return;
  const key=o.geometry.uuid+':'+o.material.uuid;
  if(!repeated.has(key))repeated.set(key,[]);
  repeated.get(key).push(o);
 });
 for(const objects of repeated.values()){
  const first=objects[0];
  // Tall objects (arches/trees) need vertex-wise river bending, small foliage
  // shares the prototype and moves each instance to the river elevation.
  first.geometry.computeBoundingBox();
  const extent=first.geometry.boundingBox.getSize(new T.Vector3());
  const small=objects.every(o=>extent.z*o.getWorldScale(new T.Vector3()).length()<18);
  if(objects.length>1&&small){
   const inst=new T.InstancedMesh(first.geometry,first.material,objects.length);
   objects.forEach((o,i)=>{const matrix=o.matrixWorld.clone();matrix.elements[13]+=riverHeight(-matrix.elements[14]);inst.setMatrixAt(i,matrix);});
   inst.castShadow=!first.material.transparent;inst.receiveShadow=true;
   inst.computeBoundingBox();inst.computeBoundingSphere();out.add(inst);continue;
  }
  for(const o of objects){
   const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);
   if(!geo.attributes.normal)geo.computeVertexNormals();
   if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
   for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);
   // Keep indices; mixing indexed/non-indexed geometry requires separate buckets.
   const key=o.material.uuid+':'+Boolean(geo.index);
   if(!unique.has(key))unique.set(key,{material:o.material,parts:[]});
   unique.get(key).parts.push(geo);
  }
 }
 for(const {material,parts} of unique.values()){
  const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  if(!geo)throw new Error('Unable to batch river scenery');
  bendGeometry(geo);geo.userData.chunkOwned=true;
  const m=new T.Mesh(geo,material);m.castShadow=!material.transparent;m.receiveShadow=true;out.add(m);
 }
 return out;
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
