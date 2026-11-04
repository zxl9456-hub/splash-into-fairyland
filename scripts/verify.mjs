import {readdir,readFile,lstat,access,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
 const abs=path.join(dir,entry.name),stat=await lstat(abs);if(stat.isSymbolicLink())throw new Error('Symbolic link: '+abs);
 if(entry.isDirectory())await walk(abs);else files.push({path:path.relative(dist,abs),bytes:stat.size});
}}
await walk(dist);const missing=[];
for(const file of files){
 if(!/\.(html|js|mjs|css)$/.test(file.path)||file.path.startsWith('vendor/'))continue;
 const abs=path.join(dist,file.path),text=await readFile(abs,'utf8');
 for(const match of text.matchAll(/["'`]((?:\.\.?\/)[^"'`\s<>]+)["'`]/g)){
  const raw=match[1];if(raw.includes('${'))continue;
  const resolved=path.resolve(path.dirname(abs),raw.split(/[?#]/)[0]);
  if(!resolved.startsWith(dist+path.sep)&&resolved!==dist)throw new Error('Path escapes site: '+raw);
  try{await access(resolved);}catch{missing.push(file.path+': '+raw);}
 }
}
for(const name of ['spring','summer','autumn','winter','stream','seed','magic','warning','hit','complete'])await access(path.join(dist,'audio',name+'.mp3'));
if(missing.length)throw new Error('Missing local resources:\n'+missing.join('\n'));
if(files.some(f=>f.bytes>=100*1024*1024))throw new Error('A file exceeds GitHub ordinary Git file size limit');
const models=[];
for(const file of files.filter(f=>f.path.endsWith('.glb'))){
 const b=await readFile(path.join(dist,file.path));const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 const triangles=gltf.meshes.reduce((n,m)=>n+m.primitives.reduce((n,p)=>n+(p.indices!==undefined?gltf.accessors[p.indices].count/3:gltf.accessors[p.attributes.POSITION].count/3),0),0);
 models.push({...file,triangles,animations:(gltf.animations||[]).map(a=>a.name),sha256:createHash('sha256').update(b).digest('hex')});
}
const result={files:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),missingResources:missing,models,defaultQuality:'ultra',paths:'relative; supports repository subpaths'};
await writeFile(path.join(root,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
