// Shared spatial blending: scenery, weather, light and sound use the same river coordinate.
export const SEASON_BORDERS=[300,600,900];
export const TRANSITION_HALF_WIDTH=60;
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function seasonWeights(z){
 const w=[1,0,0,0];
 for(let i=0;i<3;i++){const t=smooth((z-(SEASON_BORDERS[i]-TRANSITION_HALF_WIDTH))/(TRANSITION_HALF_WIDTH*2));w[i]-=t;w[i+1]+=t;}
 return w;
}
export function seasonAt(z,choice=.5){const w=seasonWeights(z);for(let i=0;i<4;i++){choice-=w[i];if(choice<=0)return i;}return 3;}
export function seasonPosition(z){return seasonWeights(z).reduce((v,w,i)=>v+w*i,0);}
export function transitionAt(z){for(let i=0;i<3;i++){const t=(z-SEASON_BORDERS[i]+TRANSITION_HALF_WIDTH)/(TRANSITION_HALF_WIDTH*2);if(t>0&&t<1)return {from:i,to:i+1,mix:smooth(t),name:['春深 · 夏近','夏尽 · 秋来','秋暮 · 初雪'][i]};}return null;}
