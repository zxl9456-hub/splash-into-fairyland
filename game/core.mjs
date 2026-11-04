import {SURF_SECTIONS,SNOW_BRANCHES,resetSurf,stepSurf,riverSlope} from './surf.mjs';
import {NARROWS,GATES,passageAt,resetExpedition,ageExpedition,activateBoatSkill,stepGates} from './expedition.mjs';
import {DRAGONS,resetCombat,castMagic,stepCombat} from './combat.mjs';
import {DISASTERS,resetDisasters,stepDisasters} from './disasters.mjs';
import {seasonWeights,seasonPosition} from './season-flow.mjs';
import {WONDERS,resetWonders,ageWonders,stepWonders,seedCombo} from './adventures.mjs';
import {FLOW_ZONES,stepCurrents} from './currents.mjs';
import {makeEncounters,resetEncounters,stepEncounters} from './encounters.mjs';
export const LENGTH=1200, CHAPTER=300;
export const SEASONS=[
 {name:'花醒之春',en:'THE AWAKENING',note:'穿过风铃花，听见花园苏醒。',sky:0xc6e3e8,fog:0xc9e1d4,water:0x4ea9a4,land:0x7e9b6b,leaf:0x4e885d,flower:0xa69bd8},
 {name:'夏日荷境',en:'A SUMMER DAYDREAM',note:'荷叶撑起绿荫，蜻蜓掠过夏日水帘。',sky:0xb9dfeb,fog:0xc3dfd4,water:0x389e9d,land:0x789463,leaf:0x448662,flower:0xe5a4aa},
 {name:'金叶之秋',en:'THE GOLDEN WOODS',note:'穿过金叶与树根，听见怀表里的时光。',sky:0xe7dfc4,fog:0xe4d4b4,water:0x65a6a0,land:0xaf9460,leaf:0xc39345,flower:0xc7785f},
 {name:'初雪奇境',en:'THE QUIET WONDER',note:'循着雪中的暖灯，驶入冰晶与初雪。',sky:0xd5e5ed,fog:0xd4e2e8,water:0x77aebb,land:0xd5e2df,leaf:0x8eaeb0,flower:0xabb9df}
];
export const center=s=>Math.sin(s*.012)*6+Math.sin(s*.027)*2.5;
// Match the wavy terrain edge and leave room for the hull and winter ice shelf.
export const navigationHalfWidth=z=>Math.max(3,Math.min(4.15,5.7+Math.sin(z*.25)*.9+Math.sin(z*.63)*.35-.95-(seasonWeights(z)[3]*.4)));
export function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function makeCourse(){const r=random(871);const obstacles=[],seeds=[];for(let z=38;z<LENGTH-22;z+=22){const x=(r()-.5)*8;obstacles.push({z,x,radius:.65+r()*.3,kind:r()>.4?'rock':'log'});for(let j=0;j<3;j++)seeds.push({z:z+7+j*3.3,x:Math.max(-navigationHalfWidth(z+7+j*3.3)+.15,Math.min(navigationHalfWidth(z+7+j*3.3)-.15,-x*.8+(r()-.5)*1.1))});}const occupied=z=>NARROWS.some(n=>z>n.from-5&&z<n.to+5)||DRAGONS.some(d=>z>d.from-25&&z<d.to+5)||DISASTERS.some(d=>z>d.from-20&&z<d.to+10)||SNOW_BRANCHES.some(b=>z>b.z-35&&z<b.z+8);return {obstacles:obstacles.filter(o=>!WONDERS.some(w=>Math.abs(w.z-o.z)<8)&&!occupied(o.z)),seeds,wonders:WONDERS,encounters:makeEncounters().filter(e=>!occupied(e.z)),flows:FLOW_ZONES,narrows:NARROWS,gates:GATES,dragons:DRAGONS,disasters:DISASTERS,surf:SURF_SECTIONS,branches:SNOW_BRANCHES};}
export class Journey{
 constructor(course=makeCourse()){this.course=course;this.reset();}
 reset({mode='journey',season=0,boat='feather'}={}){this.mode=mode;this.z=season*CHAPTER;this.x=0;this.vx=0;this.speed=0;this.paddlingHard=false;this.health=3;this.seeds=0;this.time=0;this.invincible=0;this.status='ready';this.collected=new Set;this.passed=new Set;this.startSeason=season;this.events=[];this.encounters=resetEncounters(this.course.encounters||[]);this.dodges=0;this.warnedFlows=new Set;this.clearedFlows=new Set;this.current={kind:null,forward:0,lateral:0,strength:0};resetWonders(this);resetExpedition(this,boat);resetCombat(this);resetDisasters(this);resetSurf(this);this.passage=passageAt(this.z,navigationHalfWidth(this.z),this.course.narrows||[]);}
 damage(kind='obstacle'){if(this.invincible>0||this.status!=='playing')return;if((this.jump>0||this.airborne)&&kind==='obstacle')return;if(this.guard>0){this.events.push('guard-block');return;}if(this.shield){this.shield=0;this.invincible=2.2;this.events.push('shield');return;}this.combo=0;this.health--;this.invincible=2.2;this.speed*=.45;this.lastHit=kind;this.events.push('hit');if(this.health<=0){this.status='lost';this.events.push('lost');}}
 start(){this.status='playing';}
 pause(){if(this.status==='playing')this.status='paused';else if(this.status==='paused')this.status='playing';}
 step(dt,input={}){
 this.events=[];if(this.status!=='playing')return;dt=Math.max(0,Math.min(dt,.05));if(dt===0)return;
 const oldZ=this.z;this.time+=dt;ageWonders(this,dt);ageExpedition(this,dt,input);this.invincible=Math.max(0,this.invincible-dt);
 if(input.skill&&!this.skillHeld)activateBoatSkill(this);this.skillHeld=!!input.skill;
 if(input.attack&&!this.attackHeld)castMagic(this);this.attackHeld=!!input.attack;
 stepCurrents(this);
 this.paddlingHard=!!input.paddle&&!input.brake;
 const targetSpeed=Math.max(2,input.brake?3.2+Math.max(0,this.current.forward)*.32:(8.8+seasonPosition(this.z)*.7)*this.boat.speed+this.current.forward+(this.jump>0?4:0)+(this.boost>0?5:0)+(this.paddlingHard?3.8*this.boat.speed:0)+Math.max(-2,Math.min(5,-riverSlope(this.z)*7)));
 this.speed+=(targetSpeed-this.speed)*(1-Math.exp(-dt*2.3));
 this.vx+=(Number(input.steer||0)*5*this.boat.handling+this.current.lateral*this.boat.resistance-this.vx)*(1-Math.exp(-dt*6));
 this.x+=this.vx*dt;this.z=Math.min(LENGTH,this.z+this.speed*dt);
 this.passage=passageAt(this.z,navigationHalfWidth(this.z),this.course.narrows||[]);
 if(this.passage.weight>.5&&(this.x<this.passage.left||this.x>this.passage.right)){this.narrowFaults.add(this.passage.zone.id);this.damage('wall');}
 this.x=Math.max(this.passage.left,Math.min(this.passage.right,this.x));
 stepWonders(this,oldZ);stepGates(this,oldZ);
 this.course.obstacles.forEach((o,i)=>{
  if(!this.passed.has(i)&&o.z>=oldZ-1&&o.z<=this.z+1.15&&Math.abs(this.x-o.x)<o.radius+.48){this.passed.add(i);this.damage('obstacle');}
  if(o.z>=oldZ&&o.z<this.z&&!this.passed.has(i)&&!this.nearMissed.has(i)&&Math.abs(this.x-o.x)<o.radius+1.1){this.nearMissed.add(i);this.nearMisses++;this.styleScore+=15;this.energy=Math.min(100,this.energy+4);this.events.push('near-miss');}
 });
 this.course.seeds.forEach((o,i)=>{if(!this.collected.has(i)&&o.z>=oldZ-1.5&&o.z<=this.z+1.6&&Math.abs(this.x-o.x)<1.1){this.collected.add(i);this.seeds++;this.energy=Math.min(100,this.energy+5);seedCombo(this);this.events.push('seed');}});
 stepEncounters(this,dt*(this.slowTime>0?.3:1));stepCombat(this,dt*(this.slowTime>0?.65:1));stepDisasters(this,dt);stepSurf(this,oldZ,dt,input);
 if(this.z>=LENGTH&&this.status==='playing'){this.status='won';this.events.push('won');}
 }

 get season(){return Math.min(3,Math.floor(this.z/CHAPTER));}
}
