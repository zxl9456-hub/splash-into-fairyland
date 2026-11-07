export const PROFILES = Object.freeze({
 auto: {id:'auto',name:'自动 · 推荐',pixelRatio:1.5,maxPixels:1600000,water:'high',shadowSize:2048,reflectionSteps:16,wakeSize:256,adaptive:true,ao:false},
 ultra: {id:'ultra',name:'极致',pixelRatio:2,maxPixels:8300000,water:'ultra',shadowSize:4096,reflectionSteps:32,wakeSize:512,adaptive:false,ao:true},
 high: {id:'high',name:'精致',pixelRatio:1.5,maxPixels:3200000,water:'high',shadowSize:2048,reflectionSteps:24,wakeSize:256,adaptive:false,ao:true},
 balanced: {id:'balanced',name:'流畅',pixelRatio:1,maxPixels:1100000,water:'high',shadowSize:1024,reflectionSteps:12,wakeSize:128,adaptive:false,ao:false},
});
export function resolveQuality(value){return PROFILES[value]||PROFILES.auto;}
export function pixelRatioFor(profile,width,height,dpr=1){return Math.min(dpr,profile.pixelRatio,Math.sqrt(profile.maxPixels/Math.max(1,width*height)));}
// Wait for sustained load, ignore loading stalls, and recover more slowly than
// reducing load. This prevents oscillating resolution or a pause lowering it.
export class AdaptiveResolution{
 constructor(profile){this.enabled=profile.adaptive;this.scale=1;this.samples=[];this.lastChange=0;this.lastTime=0;}
 reset(){this.samples.length=0;this.lastTime=0;}
 sample(ms,now,active=true){
  if(!this.enabled||!active||ms<=0||ms>150){this.reset();return false;}
  if(!this.lastTime)this.lastTime=now;
  this.samples.push(ms);if(now-this.lastTime<2200)return false;
  const sorted=this.samples.sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length*.5)];this.reset();
  if(now-this.lastChange<5000)return false;
  const next=median>20.5?Math.max(.65,this.scale-.1):median<17.5&&now-this.lastChange>12000?Math.min(1,this.scale+.05):this.scale;
  if(Math.abs(next-this.scale)<.001)return false;
  this.scale=next;this.lastChange=now;return true;
 }
}
export const QUALITY=resolveQuality(typeof location==='undefined'?'auto':new URLSearchParams(location.search).get('quality'));
export function bindQualityMenu(){
 const select=document.getElementById('quality');select.value=QUALITY.id;
 select.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('quality',select.value);location.assign(url);});
 document.getElementById('fullscreen').addEventListener('click',async()=>{
  const button=document.getElementById('fullscreen');
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{button.textContent='请用浏览器全屏';}
 });
}
