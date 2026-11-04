export const WONDERS=[
 {id:'chime-1',kind:'chime',z:87,x:-1.8,radius:1.3,season:0},
 {id:'chime-2',kind:'chime',z:98,x:0,radius:1.3,season:0},
 {id:'chime-3',kind:'chime',z:109,x:1.8,radius:1.3,season:0},
 {id:'lotus-1',kind:'lotus',z:455,x:-1.7,radius:1.5,season:1},
 {id:'lotus-2',kind:'lotus',z:473,x:1.6,radius:1.5,season:1},
 {id:'lotus-3',kind:'lotus',z:491,x:0,radius:1.5,season:1},
 {id:'watch',kind:'watch',z:657,x:1.8,radius:1.4,season:2},
 {id:'lantern',kind:'lantern',z:1067,x:-1.8,radius:1.4,season:3}
];
export const WONDER_HINTS={chime:'花铃连奏 · 穿过三道花环',lotus:'荷叶弹跳 · 对准荷叶，借力跃起',watch:'时间怀表 · 触碰后让怪物慢下来',lantern:'暖灯护航 · 点亮一盏灯，抵挡一次碰撞'};
export function resetWonders(g){g.wonders=new Set;g.keepsakes=new Set;g.chimes=0;g.lotusJumps=0;g.jump=0;g.slowTime=0;g.shield=0;g.combo=0;g.bestCombo=0;g.lastSeedTime=-100;g.wonderWarnings=new Set;}
export function ageWonders(g,dt){g.jump=Math.max(0,g.jump-dt);g.slowTime=Math.max(0,g.slowTime-dt);if(g.time-g.lastSeedTime>3)g.combo=0;}
export function seedCombo(g){g.combo=g.time-g.lastSeedTime<3?g.combo+1:1;g.lastSeedTime=g.time;g.bestCombo=Math.max(g.bestCombo,g.combo);if(g.combo%5===0){g.seeds+=3;g.events.push('combo');}}
export function stepWonders(g,oldZ){
 for(const w of g.course.wonders||[]){
  if(w.z<g.startSeason*300)continue;
  if(w.z-g.z<32&&w.z>g.z&&!g.wonderWarnings.has(w.kind)){g.wonderWarnings.add(w.kind);g.wonderHint=WONDER_HINTS[w.kind];g.events.push('wonder-warning');}
  if(g.wonders.has(w.id)||w.z<oldZ-1.5||w.z>g.z+1.5||Math.abs(g.x-w.x)>w.radius)continue;
  g.wonders.add(w.id);g.seeds+=2;g.events.push(w.kind);
  if(w.kind==='chime'){g.chimes++;if(g.chimes===3){g.keepsakes.add(0);g.seeds+=10;g.events.push('keepsake');}}
  if(w.kind==='lotus'){g.jump=1.3;g.lotusJumps++;g.speed=Math.max(g.speed,14);if(g.lotusJumps===3){g.keepsakes.add(1);g.seeds+=10;g.events.push('keepsake');}}
  if(w.kind==='watch'){g.slowTime=8;g.keepsakes.add(2);g.events.push('keepsake');}
  if(w.kind==='lantern'){g.shield=1;g.keepsakes.add(3);g.events.push('keepsake');}
 }
}
