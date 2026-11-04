import {riverHeight} from './surf.mjs';

// Static meshes are bent vertex by vertex; small instanced plants and pebbles
// must instead move each instance, since their shared geometry is at the origin.
export function bendGeometry(g){
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+riverHeight(-p.getZ(i)));
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function bendStaticGroup(root){
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh)return;
  const inverse=o.matrixWorld.clone().invert();
  if(o.isInstancedMesh){
   const local=o.matrixWorld.clone(),world=o.matrixWorld.clone();
   for(let i=0;i<o.count;i++){
    o.getMatrixAt(i,local);world.multiplyMatrices(o.matrixWorld,local);
    world.elements[13]+=riverHeight(-world.elements[14]);
    local.multiplyMatrices(inverse,world);o.setMatrixAt(i,local);
   }
   o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();return;
  }
  o.geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);o.geometry.userData.chunkOwned=true;
  bendGeometry(o.geometry);o.geometry.applyMatrix4(inverse);
 });return root;
}
