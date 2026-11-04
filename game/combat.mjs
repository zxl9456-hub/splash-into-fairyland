export const DRAGONS=[{id:'briar',name:'荆棘溪龙',from:212,to:290,hp:4},{id:'ember',name:'赤叶恶龙',from:716,to:770,hp:7},{id:'frost',name:'霜冠恶龙',from:1036,to:1086,hp:8}];
export function resetCombat(g){g.dragons=(g.course.dragons||[]).map(d=>({...d,maxHp:d.hp,phase:'sleep',age:0,cycle:0,lane:0,hit:false,flash:0}));g.activeDragon=null;g.projectiles=[];g.shots=0;g.perfectCounters=0;g.dragonsDefeated=0;g.counterFlash=0;}
function hurtDragon(g,d,damage){if(d.hp<=0)return;d.hp=Math.max(0,d.hp-damage);d.flash=.3;g.events.push('dragon-hit');if(d.hp===0){d.phase='defeated';d.age=0;g.dragonsDefeated++;g.seeds+=15;g.styleScore+=200;g.energy=Math.min(100,g.energy+25);g.events.push('dragon-defeated');}}
export function castMagic(g){
 if(g.status!=='playing'||g.attackCooldown>0||g.energy<18)return false;
 g.energy-=18;g.attackCooldown=g.resonance>0?.36:.85;g.shots++;const d=g.activeDragon,branch=!d&&g.activeBranch?.phase==='bending'?g.activeBranch:null;
 const perfect=d&&d.phase==='windup'&&d.age>=1.15;
 if(perfect){hurtDragon(g,d,g.boat.damage+2);if(d.hp>0){d.phase='recover';d.age=0;}g.perfectCounters++;g.counterFlash=.7;g.styleScore+=60;g.energy=Math.min(100,g.energy+10);g.events.push('perfect-counter');}
 g.projectiles.push({age:0,duration:.32,fromZ:g.z,fromX:g.x,target:d?.id||(branch?'branch:'+branch.id:null),targetZ:d?g.z+24:branch?branch.z:g.z+35,targetX:d?d.lane:g.x,damage:g.boat.damage+(g.resonance>0?1:0),reflected:!!perfect,done:!!perfect});g.events.push('cast');return true;
}
export function stepCombat(g,dt){
 g.counterFlash=Math.max(0,g.counterFlash-dt);g.activeDragon=null;
 for(const d of g.dragons){
  d.flash=Math.max(0,d.flash-dt);
  if(d.phase==='sleep'&&g.z>=d.from-20&&g.z<d.to){d.phase='approach';d.age=0;g.events.push('boss-warning');}
  if(d.phase==='sleep')continue;
  if(d.phase==='defeated'){d.age+=dt;continue;}
  if(g.z>d.to){if(d.phase!=='escaped'){d.phase='escaped';g.events.push('dragon-escaped');}continue;}
  if(d.phase==='escaped')continue;
  g.activeDragon=d;d.age+=dt;
  if(d.phase==='approach'&&g.z>=d.from){d.phase='windup';d.age=0;d.lane=Math.max(-2.5,Math.min(2.5,g.x));d.hit=false;}
  if(d.phase==='windup'&&d.age>=1.8){d.phase='breath';d.age=0;g.events.push('dragon-breath');}
  else if(d.phase==='breath'){
   if(d.age>=.38&&!d.hit){d.hit=true;if(Math.abs(g.x-d.lane)<1.3&&g.jump<=0&&!g.airborne)g.damage('breath');else{g.styleScore+=20;g.events.push('breath-dodged');}}
   if(d.age>=.85){d.phase='recover';d.age=0;}
  }else if(d.phase==='recover'&&d.age>=1.1){d.phase='windup';d.age=0;d.cycle++;d.lane=Math.max(-2.5,Math.min(2.5,g.x));d.hit=false;}
 }
 for(const p of g.projectiles){p.age+=dt;if(p.age>=p.duration&&!p.done){p.done=true;const d=g.dragons.find(d=>d.id===p.target);if(d&&d.hp>0&&d.phase!=='escaped')hurtDragon(g,d,p.damage);else if(p.target?.startsWith('branch:')){const b=g.branches.find(b=>b.id===p.target.slice(7));if(b&&b.phase==='bending'&&b.delay<1.2){const extra=Math.min(.6,1.2-b.delay);b.limit+=extra;b.delay+=extra;g.events.push('branch-delayed');}}else if(!p.target){const e=g.encounters.find(e=>e.phase!=='defeated'&&Math.abs(e.x-p.fromX)<3.2&&e.z>=p.fromZ&&e.z<p.fromZ+37);if(e){e.phase='defeated';e.rewarded=true;g.seeds+=3;g.styleScore+=25;g.events.push('dragon-hit');}}}}
 g.projectiles=g.projectiles.filter(p=>p.age<p.duration+.25);
}
