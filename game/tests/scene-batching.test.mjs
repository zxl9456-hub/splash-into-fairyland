import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s,c,next){if(s==='three')return {url:${JSON.stringify(new URL('../vendor/three.webgpu.js',import.meta.url).href)},shortCircuit:true};if(s.startsWith('three/addons/'))return {url:new URL(s.slice(13),${JSON.stringify(new URL('../vendor/addons/',import.meta.url).href)}).href,shortCircuit:true};return next(s,c);}`)}`);
const T=await import('../vendor/three.webgpu.js');
const {batchScenery,batchScenerySteps,cullScenery,disposeScenery}=await import('../scene-batching.js');

test('culling retains nearby geometry, uses distant LOD, and restores instances after camera turn',()=>{
 const root=new T.Group(),geo=new T.SphereGeometry(1,20,16),mat=new T.MeshBasicMaterial();geo.lodGeometry=new T.SphereGeometry(1,6,4);
 for(const z of [-5,-40,40]){const m=new T.Mesh(geo,mat);m.position.z=z;root.add(m);}
 const batched=batchScenery(root),near=batched.children.find(o=>o.userData.sceneryInstances),far=near.userData.sceneryInstances.far;
 const camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,0,0);camera.lookAt(0,0,-1);
 assert.deepEqual(cullScenery(batched,camera),{total:3,visible:2});assert.equal(near.count,1);assert.equal(far.count,1);
 camera.lookAt(0,0,1);assert.equal(cullScenery(batched,camera).visible,2);assert.equal(far.count,1);
 camera.lookAt(0,0,-1);cullScenery(batched,camera);const matrix=new T.Matrix4();far.getMatrixAt(0,matrix);assert.equal(matrix.elements[14],-40);
 disposeScenery(batched);geo.dispose();geo.lodGeometry.dispose();mat.dispose();
});

test('nested instanced plants retain every transform when batched',()=>{
 const root=new T.Group(),geo=new T.BoxGeometry(1,1,1),mat=new T.MeshBasicMaterial(),inst=new T.InstancedMesh(geo,mat,2);
 inst.position.x=3;inst.setMatrixAt(0,new T.Matrix4().makeTranslation(1,0,-5));inst.setMatrixAt(1,new T.Matrix4().makeTranslation(2,0,-8));root.add(inst);
 const result=batchScenery(root),data=result.children[0].userData.sceneryInstances;
 assert.equal(data.matrices.length,32);assert.equal(data.matrices[12],4);assert.equal(data.matrices[28],5);assert.equal(data.matrices[30],-8);
 disposeScenery(result);inst.dispose();geo.dispose();mat.dispose();
});

test('cancelling a partial batch releases its owned materials without touching shared ones',()=>{
 const root=new T.Group(),owned=new T.MeshBasicMaterial(),shared=new T.MeshBasicMaterial();root.userData.ownedMaterials=[owned];
 const geo=new T.BoxGeometry();root.add(new T.Mesh(geo,shared));let ownedDisposed=0,sharedDisposed=0;
 owned.addEventListener('dispose',()=>ownedDisposed++);shared.addEventListener('dispose',()=>sharedDisposed++);
 const steps=batchScenerySteps(root);steps.next();steps.return();assert.equal(ownedDisposed,1);assert.equal(sharedDisposed,0);geo.dispose();shared.dispose();
});
