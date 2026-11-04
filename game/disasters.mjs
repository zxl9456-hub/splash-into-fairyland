export const DISASTERS=[
 {id:'spring-rocks',kind:'rockfall',name:'春雨落石',hint:'岩石将落下 · 离开琥珀色圆圈',from:46,to:74,side:-1},
 {id:'summer-storm',kind:'lightning',name:'夏日雷暴',hint:'雷暴将至 · 离开闪电落点',from:334,to:368,side:1},
 {id:'autumn-vortex',kind:'leafstorm',name:'金叶龙卷',hint:'风卷落叶 · 逆风划出旋涡',from:618,to:648,side:-1},
 {id:'winter-slide',kind:'avalanche',name:'雪崩奔流',hint:'雪坡松动 · 避开蓝色冲击带',from:930,to:965,side:1}
];
export function resetDisasters(g){g.disasters=(g.course.disasters||[]).map(d=>({...d,phase:'sleep',age:0,cycle:0,lane:0,struck:false,hit:false,rewarded:false}));g.activeDisaster=null;g.disastersSurvived=0;}
export function stepDisasters(g,dt){
 g.activeDisaster=null;
 for(const d of g.disasters){
  if(d.from<g.startSeason*300)continue;
  if(d.phase==='sleep'&&g.z>=d.from-14&&g.z<d.to){d.phase='warning';d.age=0;d.lane=Math.max(-2.5,Math.min(2.5,g.x));g.events.push('disaster-warning');}
  if(d.phase==='sleep'||d.phase==='done')continue;
  if(g.z>d.to){d.phase='done';if(!d.rewarded){d.rewarded=true;g.disastersSurvived++;if(!d.hit){g.styleScore+=80;g.seeds+=6;g.events.push('disaster-perfect');}}continue;}
  g.activeDisaster=d;
  // Major attacks never overlap: a dragon owns its combat window.
  if(g.activeDragon)continue;
  d.age+=dt;
  if(d.phase==='warning'&&d.age>=1.65){d.phase='strike';d.age=0;d.struck=false;g.events.push('disaster-strike');}
  else if(d.phase==='strike'){
   if(d.kind==='leafstorm')g.vx+=(d.lane-g.x)*dt*4*g.boat.resistance;
   if(d.age>.38&&!d.struck){d.struck=true;if(Math.abs(g.x-d.lane)<1.25&&g.jump<=0&&!g.airborne){const health=g.health;g.damage(d.kind);d.hit=d.hit||g.health<health;}}
   if(d.age>1){d.phase='rest';d.age=0;}
  }else if(d.phase==='rest'&&d.age>.75){d.phase='warning';d.age=0;d.cycle++;d.lane=Math.max(-2.5,Math.min(2.5,g.x));g.events.push('disaster-warning');}
 }
}
