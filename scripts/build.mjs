import {cp,mkdir,rm,readdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {versionReferences} from './cache-version.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),source=path.join(root,'game'),out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const e of await readdir(source,{withFileTypes:true})){
 if(e.name==='tests'||e.name.startsWith('.'))continue;
 await cp(path.join(source,e.name),path.join(out,e.name),{recursive:true,dereference:true});
}
const codeFiles=(await readdir(source)).filter(name=>/\.(html|js|mjs|css)$/.test(name)).sort();
const hash=createHash('sha256');for(const name of codeFiles)hash.update(name).update(await readFile(path.join(source,name)));
const version=hash.digest('hex').slice(0,12);
for(const name of codeFiles){const text=await readFile(path.join(out,name),'utf8');await writeFile(path.join(out,name),versionReferences(text,version));}
await writeFile(path.join(out,'.nojekyll'),'');
console.log('Built self-contained game: '+out);
