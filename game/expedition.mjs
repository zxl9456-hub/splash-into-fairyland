// Shared, deterministic rules for boats, narrow passages, drift and race gates.
export const BOATS=[
 {id:'feather',name:'轻羽艇',tag:'灵巧 · 跃浪',description:'轻巧跃浪，翻过险流。',health:3,speed:1,handling:1.16,resistance:1,regen:8,damage:1,color:0xefaa54,skill:'跃浪冲刺',cost:32,cooldown:7},
 {id:'moss',name:'苔石艇',tag:'坚固 · 守护',description:'稳住激流，护盾护航。',health:3,speed:.87,handling:.84,resistance:.48,regen:8,damage:1,color:0x6cae91,skill:'森之护盾',cost:36,cooldown:9},
 {id:'moon',name:'月萤艇',tag:'魔法 · 反击',description:'蓄满月光，反击恶龙。',health:3,speed:.95,handling:1,resistance:.85,regen:12,damage:2,color:0xb1a3ef,skill:'月光共鸣',cost:42,cooldown:9}
];
export const boatById=id=>BOATS.find(b=>b.id===id)||BOATS[0];
export const NARROWS=[
 {id:'root-canyon',name:'树根窄道',from:174,to:204,offset:-.9,width:1.65},
 {id:'lotus-channel',name:'荷梗回廊',from:515,to:548,offset:1,width:1.5},
 {id:'amber-gorge',name:'琥珀峡道',from:772,to:808,offset:-1.1,width:1.45},
 {id:'ice-channel',name:'冰牙窄道',from:1090,to:1124,offset:1,width:1.4}
];
export function passageAt(z,base=4.15,zones=NARROWS){
 const n=zones.find(n=>z>=n.from&&z<=n.to);if(!n)return {left:-base,right:base,mid:0,weight:0,zone:null};
 const t=(z-n.from)/(n.to-n.from),weight=Math.min(1,t*5,(1-t)*5),mid=n.offset*Math.sin(t*Math.PI*2)*weight,half=base+(n.width-base)*weight;
 return {left:Math.max(-base,mid-half),right:Math.min(base,mid+half),mid,weight,zone:n};
}
export const GATES=[...NARROWS.flatMap(n=>[.25,.5,.75].map((t,i)=>({id:n.id+'-'+i,z:n.from+(n.to-n.from)*t,x:n.offset*Math.sin(t*Math.PI*2),kind:'slalom',radius:1.18}))),
 ...[122,385,690,990].flatMap((z,k)=>[10,25,39].map((d,i)=>({id:'rush-'+k+'-'+i,z:z+d,x:[-1.5,1.2,-.6][i]*(k%2?-1:1),kind:'rush',radius:1.25})))].sort((a,b)=>a.z-b.z);
export function resetExpedition(g,id){g.boat=boatById(id);g.maxHealth=g.boat.health;g.health=g.maxHealth;g.energy=100;g.attackCooldown=0;g.skillCooldown=0;g.guard=0;g.resonance=0;g.boost=0;g.driftCharge=0;g.driftReleases=0;g.wasBraking=false;g.attackHeld=false;g.skillHeld=false;g.gateHits=new Set;g.gateMisses=new Set;g.gateStreak=0;g.bestGateStreak=0;g.narrowFaults=new Set;g.narrowCleared=new Set;g.narrowWarnings=new Set;g.styleScore=0;g.nearMisses=0;g.nearMissed=new Set;g.skillFlash=0;}
export function ageExpedition(g,dt,input){
 for(const k of['attackCooldown','skillCooldown','guard','resonance','boost','skillFlash'])g[k]=Math.max(0,g[k]-dt);
 g.energy=Math.min(100,g.energy+g.boat.regen*dt);
 if(input.brake&&Math.abs(input.steer||0)>.4&&g.speed>2.8)g.driftCharge=Math.min(1,g.driftCharge+dt*.7);
 else if(!input.brake&&g.wasBraking){if(g.driftCharge>.5){g.boost=1.3+g.driftCharge;g.driftReleases++;g.styleScore+=Math.round(g.driftCharge*25);g.events.push('drift-boost');}g.driftCharge=0;}
 else if(!input.brake)g.driftCharge=Math.max(0,g.driftCharge-dt);
 g.wasBraking=!!input.brake;
}
export function activateBoatSkill(g){
 if(g.status!=='playing'||g.skillCooldown>0||g.energy<g.boat.cost)return false;
 g.energy-=g.boat.cost;g.skillCooldown=g.boat.cooldown;g.skillFlash=.7;
 if(g.boat.id==='feather'){g.jump=1.3;g.boost=2.5;}
 if(g.boat.id==='moss')g.guard=3.8;
 if(g.boat.id==='moon'){g.resonance=5;g.attackCooldown=0;}
 g.events.push('boat-skill');return true;
}
export function stepGates(g,oldZ){
 for(const n of g.course.narrows||[]){
  if(n.from<g.startSeason*300)continue;
  if(g.z>n.from-22&&g.z<n.to&&!g.narrowWarnings.has(n.id)){g.narrowWarnings.add(n.id);g.routeHint=n.name+' · 提前减速，对准水门';g.events.push('narrow-warning');}
  if(g.z>n.to&&!g.narrowCleared.has(n.id)){g.narrowCleared.add(n.id);if(!g.narrowFaults.has(n.id)){g.styleScore+=60;g.energy=Math.min(100,g.energy+15);g.events.push('narrow-perfect');}}
 }
 for(const gate of g.course.gates||[]){if(gate.z<oldZ||gate.z>g.z||g.gateHits.has(gate.id)||g.gateMisses.has(gate.id))continue;
  if(Math.abs(g.x-gate.x)<gate.radius){g.gateHits.add(gate.id);g.gateStreak++;g.bestGateStreak=Math.max(g.bestGateStreak,g.gateStreak);g.styleScore+=20+Math.min(5,g.gateStreak)*5;g.energy=Math.min(100,g.energy+8);g.seeds+=2;if(gate.kind==='rush')g.boost=Math.max(g.boost,1.3);g.events.push(g.gateStreak%3===0?'gate-combo':'gate');}
  else{g.gateMisses.add(gate.id);g.gateStreak=0;g.events.push('gate-miss');}
 }
}
export function journeyScore(g){return Math.round(g.z)+g.seeds*10+g.styleScore+g.health*50;}
export function journeyRank(g){const score=journeyScore(g);return score>=3000?'S · 奇境领航员':score>=2300?'A · 追光冒险家':score>=1700?'B · 勇敢小船长':'C · 初航探索者';}
