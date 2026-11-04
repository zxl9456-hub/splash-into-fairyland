import {cp,mkdir,rm,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),source=path.join(root,'game'),out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const e of await readdir(source,{withFileTypes:true})){
 if(e.name==='tests'||e.name.startsWith('.'))continue;
 await cp(path.join(source,e.name),path.join(out,e.name),{recursive:true,dereference:true});
}
await writeFile(path.join(out,'.nojekyll'),'');
console.log('Built self-contained game: '+out);
