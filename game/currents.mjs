export const FLOW_ZONES=[
 {id:'spring-rush',kind:'rapids',from:122,to:168,side:-1,strength:1},
 {id:'spring-swirl',kind:'whirlpool',from:234,to:264,x:1.9,strength:.85},
 {id:'summer-rush',kind:'rapids',from:385,to:430,side:1,strength:1.15},
 {id:'summer-swirl',kind:'whirlpool',from:553,to:582,x:-1.6,strength:1},
 {id:'autumn-rush',kind:'rapids',from:690,to:746,side:-1,strength:1.3},
 {id:'autumn-swirl',kind:'whirlpool',from:810,to:840,x:1.8,strength:1.15},
 {id:'winter-rush',kind:'rapids',from:990,to:1044,side:1,strength:1.4},
 {id:'winter-swirl',kind:'whirlpool',from:1130,to:1162,x:-1.8,strength:1.25}
];
export function currentAt(z,x,time,zones=FLOW_ZONES){
 const zone=zones.find(f=>z>=f.from&&z<=f.to);if(!zone)return {kind:null,forward:0,lateral:0,strength:0};
 const t=(z-zone.from)/(zone.to-zone.from),envelope=Math.sin(t*Math.PI),strength=envelope*zone.strength;
 if(zone.kind==='rapids')return {kind:zone.kind,strength,forward:4.4*strength,lateral:strength*(zone.side*1.5+Math.sin(time*2.2)*.65)};
 const near=Math.max(0,1-Math.abs(x-zone.x)/4.5);
 return {kind:zone.kind,strength:strength*near,forward:strength*(.8-2.2*near),lateral:strength*near*(Math.max(-3,Math.min(3,(zone.x-x)*1.5))+Math.sin(t*Math.PI*2)*1.1)};
}
export function stepCurrents(game){
 const zones=game.course.flows||[];game.current=currentAt(game.z,game.x,game.time,zones);
 for(const f of zones){if(f.from<game.startSeason*300)continue;if(!game.warnedFlows.has(f.id)&&game.z>=f.from-20&&game.z<f.to){game.warnedFlows.add(f.id);game.events.push(f.kind+'-warning');}if(game.z>f.to&&!game.clearedFlows.has(f.id)){game.clearedFlows.add(f.id);if(game.mode==='journey'){game.seeds+=3;game.events.push('current-clear');}}}
}
