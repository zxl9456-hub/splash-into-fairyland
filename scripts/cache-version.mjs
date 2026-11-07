// Keep all game modules in one release when browsers still cache older files.
// Vendored libraries are unchanged and retain their import-map identity.
export function versionReferences(text,version){
 return text.replace(/(["'`])(\.{1,2}\/[^"'`\s<>]+?\.(?:js|mjs|css)(?:[?#][^"'`\s<>]*)?)\1/g,(match,quote,raw)=>{
  if(raw.includes('/vendor/')||raw.includes('${'))return match;
  const [address,fragment]=raw.split('#'),[pathname,search]=address.split('?'),query=new URLSearchParams(search);
  query.set('build',version);return quote+pathname+'?'+query+(fragment===undefined?'':'#'+fragment)+quote;
 });
}
