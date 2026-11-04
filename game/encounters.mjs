export function makeEncounters(){
 const list=[];
 for(let chapter=0;chapter<4;chapter++){
  const offsets=chapter===0?[68,194]:chapter===1?[54,137,225]:chapter===2?[42,114,185,259]:[40,108,176,246];
  offsets.forEach((z,i)=>list.push({z:z+chapter*300,kind:i%2===0?'plant':'dragon',side:(i+chapter)%2?1:-1,chapter}));
 }
 return list;
}
export function resetEncounters(list){return list.map(e=>({...e,phase:'dormant',age:0,x:e.side*6.8,hit:false,rewarded:false,progress:0}));}
export function stepEncounters(game,dt){
 for(const e of game.encounters){
  if(e.z<game.startSeason*300||e.phase==='defeated')continue;
  if(e.phase==='dormant'&&e.z-game.z<34&&e.z>game.z-3){e.phase='warning';e.age=0;game.events.push(e.kind+'-warning');}
  if(e.phase==='dormant')continue;
  e.age+=dt;
  const warning=2.1-e.chapter*.12,attack=e.kind==='dragon'?4.4:2.9;
  if(e.age<warning){e.phase='warning';e.progress=e.age/warning;e.x=e.side*6.8;}
  else if(e.age<warning+attack){
   e.phase='attack';e.progress=(e.age-warning)/attack;
   e.x=e.kind==='dragon'?e.side*(7-14*e.progress):e.side*(6.8-4.3*Math.sin(Math.PI*e.progress));
   const radius=e.kind==='dragon'?1.7:1.45;
   if(!e.hit&&Math.abs(game.z-e.z)<2.0&&Math.abs(game.x-e.x)<radius+.45){e.hit=true;game.damage(e.kind);}
  }else{e.phase='recovery';e.progress=Math.min(1,(e.age-warning-attack)/1.8);e.x=e.kind==='dragon'?-e.side*7:e.side*6.8;}
  if(!e.rewarded&&game.z>e.z+5){e.rewarded=true;if(!e.hit&&game.mode==='journey'){game.seeds+=5;game.dodges++;game.events.push('dodge');}}
 }
}
