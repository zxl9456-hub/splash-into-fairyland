export const PROFILES = Object.freeze({
 ultra: {id:'ultra',name:'极致',pixelRatio:2,water:'ultra',shadowSize:4096,reflectionSteps:32,wakeSize:512},
 high: {id:'high',name:'精致',pixelRatio:1.5,water:'high',shadowSize:2048,reflectionSteps:24,wakeSize:256},
 balanced: {id:'balanced',name:'均衡',pixelRatio:1,water:'high',shadowSize:2048,reflectionSteps:16,wakeSize:256},
});
export function resolveQuality(value){return PROFILES[value]||PROFILES.ultra;}
export const QUALITY=resolveQuality(typeof location==='undefined'?'ultra':new URLSearchParams(location.search).get('quality'));
export function bindQualityMenu(){
 const select=document.getElementById('quality');select.value=QUALITY.id;
 select.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('quality',select.value);location.assign(url);});
 document.getElementById('fullscreen').addEventListener('click',async()=>{
  const button=document.getElementById('fullscreen');
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{button.textContent='请用浏览器全屏';}
 });
}
