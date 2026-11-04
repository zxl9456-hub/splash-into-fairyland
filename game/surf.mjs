// One height profile shared by river vertices, terrain, boats and gameplay.
export const SURF_SECTIONS=[
 {id:'spring-drop',name:'花溪跃浪',from:122,crest:132,bottom:149,to:168,lift:2.4,drop:6,roller:1.2},
 {id:'summer-drop',name:'荷间飞瀑',from:385,crest:396,bottom:414,to:438,lift:3,drop:8,roller:1.5},
 {id:'autumn-drop',name:'金叶飞流',from:690,crest:701,bottom:722,to:748,lift:3.3,drop:9,roller:1.7},
 {id:'winter-drop',name:'冰谷俯冲',from:990,crest:1002,bottom:1024,to:1048,lift:3.5,drop:11,roller:2}
];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function riverHeight(z){let h=0;for(const s of SURF_SECTIONS){h+=s.lift*smooth((z-s.from)/(s.crest-s.from))-(s.lift+s.drop)*smooth((z-s.crest)/(s.bottom-s.crest));if(z>s.bottom&&z<s.to)h+=s.roller*Math.sin((z-s.bottom)/(s.to-s.bottom)*Math.PI)**2;}return h;}
export const riverSlope=z=>(riverHeight(z+.15)-riverHeight(z-.15))/.3;
export const surfAt=z=>SURF_SECTIONS.find(s=>z>=s.from-12&&z<=s.to)||null;
export const SNOW_BRANCHES=[{id:'snow-bough-a',z:986,side:-1},{id:'snow-bough-b',z:1177,side:1}];
export function resetSurf(g){g.height=riverHeight(g.z)+.12;g.verticalSpeed=0;g.airborne=false;g.surfFlights=0;g.smoothLandings=0;g.landingFlash=0;g.surfWarnings=new Set;g.jumpedCrests=new Set;g.surfSection=null;g.branches=(g.course.branches||[]).map(b=>({...b,phase:'sleep',age:0,limit:0,hit:false,escaped:false,delay:0}));g.activeBranch=null;g.branchEscapes=0;}
export function stepSurf(g,oldZ,dt,input){
 g.landingFlash=Math.max(0,g.landingFlash-dt);g.surfSection=(g.course.surf||[]).find(s=>g.z>=s.from-12&&g.z<=s.to)||null;
 for(const s of g.course.surf||[]){if(g.z>=s.from-12&&g.z<s.to&&!g.surfWarnings.has(s.id)){g.surfWarnings.add(s.id);g.events.push('surf-warning');}if(oldZ<s.crest&&g.z>=s.crest&&!g.jumpedCrests.has(s.id)){g.jumpedCrests.add(s.id);if(g.speed>10.5){g.airborne=true;g.height=riverHeight(s.crest)+.18;g.verticalSpeed=2.4+g.speed*.1;g.surfFlights++;g.events.push('surf-launch');}}}
 const surface=riverHeight(g.z)+.12;
 if(g.airborne){g.verticalSpeed-=9.8*dt;g.height+=g.verticalSpeed*dt;if(g.height<=surface){g.height=surface;g.airborne=false;g.landingFlash=.65;g.verticalSpeed=0;g.speed*=input.brake?.94:.82;if(input.brake||g.boat.id==='moss'){g.smoothLandings++;g.styleScore+=45;g.events.push('surf-perfect');}else{g.styleScore+=15;g.events.push('surf-land');}}}
 else{g.height=surface;g.verticalSpeed=g.speed*riverSlope(g.z);}
 g.activeBranch=null;
 for(const b of g.branches){
  if(b.z<g.startSeason*300)continue;
  if(b.phase==='sleep'&&g.z>=b.z-32&&g.z<b.z&&!g.activeDisaster&&!g.activeDragon){b.phase='bending';b.age=0;b.limit=Math.max(1.8,(b.z-g.z)/(10.9*g.boat.speed)-.55);g.events.push('branch-warning');}
  if(b.phase==='sleep'||b.phase==='done')continue;
  b.age+=dt;if(g.z<b.z+6)g.activeBranch=b;
  if(b.phase==='bending'&&b.age>=b.limit){b.phase='falling';b.age=0;}
  if(b.phase==='falling'&&b.age>.65){b.phase='fallen';b.age=0;}
  if((b.phase==='falling'&&b.age>.5||b.phase==='fallen')&&!b.hit&&Math.abs(g.z-b.z)<2.8){b.hit=true;if(!g.airborne&&g.jump<=0)g.damage('branch');}
  if(g.z>b.z+3&&!b.escaped){b.escaped=true;g.branchEscapes++;if(!b.hit){g.styleScore+=70;g.energy=Math.min(100,g.energy+10);g.events.push('branch-escaped');}}
  if(g.z>b.z+30)b.phase='done';
 }
}
