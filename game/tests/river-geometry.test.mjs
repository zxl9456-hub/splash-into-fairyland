import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,InstancedMesh,BoxGeometry,MeshBasicMaterial,Matrix4,Vector3} from '../vendor/three.core.js';
import {bendStaticGroup} from '../river-geometry.mjs';
import {riverHeight} from '../surf.mjs';

test('instanced pebbles follow each section elevation without changing their shared geometry',()=>{
 const root=new Group,geo=new BoxGeometry(1,1,1),rocks=new InstancedMesh(geo,new MeshBasicMaterial,3),before=Array.from(geo.attributes.position.array);
 root.position.set(3,2,-20);root.add(rocks);const matrix=new Matrix4;
 [0,600,1100].forEach((z,i)=>rocks.setMatrixAt(i,new Matrix4().makeTranslation(5,1,-z)));
 bendStaticGroup(root);
 [0,600,1100].forEach((z,i)=>{rocks.getMatrixAt(i,matrix);const point=new Vector3().setFromMatrixPosition(matrix).applyMatrix4(rocks.matrixWorld);assert(Math.abs(point.y-(3+riverHeight(z+20)))<1e-5);assert.equal(point.z,-z-20);});
 assert.deepEqual(Array.from(geo.attributes.position.array),before);
 assert(rocks.boundingBox.min.y<-30);
});
test('ordinary scenery is bent in world coordinates and its sibling keeps shared geometry intact',()=>{
 const geo=new BoxGeometry(1,1,1),original=Array.from(geo.attributes.position.array),root=new Group,rock=new Mesh(geo,new MeshBasicMaterial);
 root.position.set(0,2,-1100);root.add(rock);bendStaticGroup(root);
 assert.notEqual(rock.geometry,geo);assert.deepEqual(Array.from(geo.attributes.position.array),original);
 assert(Math.abs(rock.geometry.attributes.position.getY(0)-(original[1]-34))<1e-5);
});
