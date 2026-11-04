import {QUALITY,bindQualityMenu} from './quality.mjs';
import {createAtmosphere} from './atmosphere.js';
import {createBoatControls} from './controls.mjs';
import {galleryStop} from './gallery.mjs';
import {riverHeight,riverSlope,resetSurf} from './surf.mjs';
import {BOATS,boatById,journeyScore,journeyRank} from './expedition.mjs';
import {ExpeditionView} from './expedition-view.js';
import * as T from 'three';
import {seasonWeights,transitionAt} from './season-flow.mjs';
import {FairytaleAudio} from './fairytale-audio.js';
import {resetPaddling,updatePaddling,PaddleWater} from './paddling.js';
import {WonderView} from './wonder-view.js';
import {Journey,SEASONS,LENGTH,center} from './core.mjs';
import {Garden,makeBoat,loadKayaker,obstacle,seed,botanicals} from './world-v2.js';
import {createRiverWater} from './river-water.js';
import {EncounterView} from './encounter-view.js';
import {createGardenLight} from './garden-light.js';
import {CurrentView} from './current-view.js';
const $=id=>document.getElementById(id), canvas=$('world');
bindQualityMenu();canvas.dataset.quality=QUALITY.id;
const startup=window.riverlightStartup;
if(startup)startup.progress('正在铺开河流…');
let renderer;
try{renderer=new T.WebGPURenderer({canvas,antialias:true,alpha:false,forceWebGL:new URLSearchParams(location.search).get('backend')==='webgl',powerPreference:'high-performance'});}catch(e){$('loading').textContent='浏览器未能启动 3D 图形。请开启硬件加速后刷新。';throw e;}
await renderer.init();
renderer.info.autoReset=false;renderer.setPixelRatio(Math.min(devicePixelRatio,QUALITY.pixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene;scene.background=new T.Color(SEASONS[0].sky);scene.fog=null;const camera=new T.PerspectiveCamera(53,innerWidth/innerHeight,.1,220);
const hemisphere=new T.HemisphereLight(0xc4e7f5,0x495e34,.55);scene.add(hemisphere);
const portraitLight=new T.DirectionalLight(0xe5f0ff,.3);scene.add(portraitLight,portraitLight.target);
const artMode=new URLSearchParams(location.search).has("art");let artFrozen=false,galleryActive=false;const game=new Journey, garden=new Garden(scene),boat=makeBoat();scene.add(boat);const obstacles=game.course.obstacles.map(o=>{const m=obstacle(o);scene.add(m);return m;}),seeds=game.course.seeds.map(o=>{const m=seed(o);scene.add(m);return m;});
const wakes=[],paddleWater=new PaddleWater(scene);
await garden.prepare(0);
const water=await createRiverWater(renderer,scene,camera,boat);
if(startup)startup.progress('正在准备角色与花园…');
const encounterView=new EncounterView(scene,game);
const currentView=new CurrentView(scene,game.course.flows);
const wonderView=new WonderView(scene,game.course.wonders);
const expeditionView=new ExpeditionView(scene,boat,game,botanicals);
const gardenLight=createGardenLight(renderer,scene,camera);
const atmosphere=createAtmosphere(scene);
const keys=new Set;let castRequested=false,skillRequested=false,selectedBoat='feather';let selectedSeason=0,lastSeason=-1,toastUntil=0,noticeUntil=0,elapsed=0,last=performance.now(),assetReady=false,renderReady=false,frameStopped=false,frameCount=0,fps=60,fpsAt=0;const camTarget=new T.Vector3,lookTarget=new T.Vector3;const audio=new FairytaleAudio;let soundOn=false;
$('sound').onclick=async()=>{soundOn=!soundOn;$('sound').classList.toggle('enabled',soundOn);$('sound').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');try{await audio.enable(soundOn);}catch(e){console.error(e);soundOn=false;$('sound').classList.remove('enabled');$('sound').setAttribute('aria-label','开启声音');$('notice').textContent='声音未就绪 · 再点一次试试';noticeUntil=elapsed+4;}};
const controls=createBoatControls({canvas,buttons:{left:$('left'),right:$('right'),brake:$('brake'),paddle:$('paddle')},active:()=>game.status==='playing'&&!galleryActive});
function resetInput(){keys.clear();controls.reset();castRequested=false;skillRequested=false;}
function begin(mode){galleryActive=false;document.body.classList.remove('viewing');$('galleryBar').hidden=true;if(!assetReady||!renderReady||frameStopped)return;$('sound').disabled=false;document.querySelector('.guide').open=false;resetPaddling(boat);paddleWater.reset();audio.reset();resetInput();noticeUntil=0;$('notice').hidden=true;game.reset({mode,season:mode==='journey'?0:selectedSeason,boat:selectedBoat});game.start();artFrozen=false;lastSeason=-1;document.body.classList.add('playing');$('menu').hidden=true;$('modal').hidden=true;$('journeyHud').hidden=false;$('stats').hidden=false;$('actionHud').hidden=false;$('pause').hidden=false;$('touchControls').hidden=!(innerWidth<700||matchMedia('(pointer:coarse)').matches);canvas.focus();requestAnimationFrame(()=>canvas.focus());updateCamera(true);toastUntil=elapsed+4;}
function chooseBoat(id){selectedBoat=id;document.querySelectorAll('[data-boat]').forEach(x=>{x.classList.toggle('selected',x.dataset.boat===id);x.setAttribute('aria-pressed',String(x.dataset.boat===id));});$('boatDescription').textContent=boatById(selectedBoat).description;game.reset({season:selectedSeason,boat:selectedBoat});game.z=galleryStop(selectedSeason);resetSurf(game);expeditionView.makeOutfit(game.boat);}
$('attack').onclick=()=>{castRequested=true;canvas.focus();};$('boatSkill').onclick=()=>{skillRequested=true;canvas.focus();};
if(startup)startup.bindStart(begin);else{$('start').onclick=()=>begin('journey');$('explore').onclick=()=>begin('explore');}
function chooseSeason(id){selectedSeason=id;document.querySelectorAll('[data-season]').forEach(x=>{x.classList.toggle('selected',+x.dataset.season===id);x.setAttribute('aria-pressed',String(+x.dataset.season===id));});game.reset({season:selectedSeason,boat:selectedBoat});game.z=galleryStop(selectedSeason);resetSurf(game);lastSeason=selectedSeason;updateCamera(true);}
if(startup)startup.bindChoices({boat:chooseBoat,season:chooseSeason});else{document.querySelectorAll('[data-boat]').forEach(b=>b.onclick=()=>chooseBoat(b.dataset.boat));document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>chooseSeason(+b.dataset.season));}
function showModal(kind){
 resetInput();$('touchControls').hidden=true;$('pause').hidden=true;$('sound').disabled=true;$('modal').hidden=false;
 const won=kind==='won',paused=kind==='paused';$('resume').hidden=!paused;$('resultStats').hidden=paused;
 $('modalKicker').textContent=paused?'稍作停留':won?'本次奇游完成':'本次航行结束';
 $('modalTitle').textContent=paused?'河流等你。':won?'漂出了新天地。':'差一点，就过了。';
 $('modalCopy').textContent=paused?'歇口气，继续冒险。':won?'带上四季，再出发。':'换个策略，再试一次。';
 if(!paused){
  const score=journeyScore(game);let best=score;
  try{best=Math.max(score,Number(localStorage.getItem('teacup-escape-best-score')||0));localStorage.setItem('teacup-escape-best-score',best);}catch{}
  $('resultRank').textContent=journeyRank(game).split(' · ')[0];$('resultScore').textContent=score.toLocaleString('zh-CN');
  $('resultDistance').textContent=Math.floor(game.z-game.startSeason*300);$('resultSeeds').textContent=game.seeds;
  $('resultGates').textContent=game.gateHits.size;$('resultCounters').textContent=game.perfectCounters;
  $('resultBest').textContent='最佳成绩 '+best.toLocaleString('zh-CN');
 }
 $('restart').textContent=paused?'重新出发':'再跑一趟';(paused?$('resume'):$('restart')).focus();
}
function togglePause(){if(game.status==='playing'){game.pause();showModal('paused');}else if(game.status==='paused'){game.pause();$('modal').hidden=true;$('pause').hidden=false;$('sound').disabled=false;$('touchControls').hidden=!(innerWidth<700||matchMedia('(pointer:coarse)').matches);canvas.focus();}}
$('pause').onclick=togglePause;
$('gallery').onclick=()=>{if(!assetReady||!renderReady||frameStopped){$('loading').textContent='花园准备好后，就能打开实机观景。';return;}begin('explore');game.z=galleryStop(selectedSeason);resetSurf(game);galleryActive=true;artFrozen=true;document.body.classList.add('viewing');$('galleryBar').hidden=false;$('galleryName').textContent=SEASONS[selectedSeason].name;$('chapterToast').classList.remove('show');updateCamera(true);};
$('exitGallery').onclick=()=>{$('home').click();};$('resume').onclick=togglePause;$('restart').onclick=()=>begin(game.mode);$('home').onclick=()=>{galleryActive=false;artFrozen=false;document.body.classList.remove('viewing');$('galleryBar').hidden=true;$('sound').disabled=false;resetInput();noticeUntil=0;toastUntil=0;$('notice').hidden=true;$('courseAlert').hidden=true;game.reset({season:selectedSeason,boat:selectedBoat});game.z=galleryStop(selectedSeason);resetSurf(game);$('modal').hidden=true;$('menu').hidden=false;$('journeyHud').hidden=true;$('stats').hidden=true;$('actionHud').hidden=true;$('bossHud').hidden=true;$('driftHud').hidden=true;$('pause').hidden=true;$('touchControls').hidden=true;$('chapterToast').classList.remove('show');document.body.classList.remove('playing');$('start').focus();updateCamera(true);};
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD','Escape','KeyP','KeyE','KeyQ','KeyW','ArrowUp'].includes(e.code)){if(e.code==='Space'&&e.target.tagName==='BUTTON'&&e.target.getClientRects().length)return;e.preventDefault();}keys.add(e.code);if(artMode&&!galleryActive&&e.code==='KeyV'&&!e.repeat)artFrozen=!artFrozen;if(!e.repeat&&(e.code==='Escape'||e.code==='KeyP')){if(galleryActive)$('home').click();else togglePause();}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{resetInput();if(game.status==='playing'&&!galleryActive)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.status==='playing'&&!galleryActive)togglePause();last=performance.now();});
function updateCamera(snap=false){
 const z=game.z,cx=center(z),mobile=innerWidth<650,terrain=riverHeight(z),surf=!!game.surfSection;
 const targetFov=53+(game.boost>0?5:game.paddlingHard?3:0)+(surf?Math.min(7,Math.max(0,game.speed-9)):(game.current.kind==='rapids'?game.current.strength*2.5:0));camera.fov+=(targetFov-camera.fov)*.06;camera.updateProjectionMatrix();
 const lift=game.jump>0?Math.sin(Math.PI*(1-game.jump/1.3))*1.8:0,height=game.height+lift;
 camTarget.set(cx+game.x*(mobile?.96:.43)+(game.status==='ready'?-2.1:0),height+(mobile?4.3:3.3),-z+(mobile?9.2:7));if(snap)camera.position.copy(camTarget);else camera.position.lerp(camTarget,surf?.13:.075);
 lookTarget.set(mobile?center(z+17)+game.x*.86:cx+(center(z+17)-cx)*.25+game.x*.4,riverHeight(z+17)+(mobile?1.7:2.6),-z-17);camera.lookAt(lookTarget);
 portraitLight.position.set(cx-5,terrain+7,-z+8);portraitLight.target.position.set(cx,terrain+1,-z);
 boat.position.set(cx+game.x,height+Math.sin(elapsed*2)*.035,-z);const pitch=game.airborne?Math.atan2(game.verticalSpeed,Math.max(8,game.speed)):Math.atan(riverSlope(z));
 boat.rotation.set(pitch+(game.jump>0?Math.cos(Math.PI*(1-game.jump/1.3))*.13:0)+Math.sin(elapsed*2)*.016,-Math.atan2(center(z+1)-cx,1)-game.vx*.04,-game.vx*.025);
}

function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();water.resize();$('touchControls').hidden=game.status!=='playing'||!(innerWidth<700||matchMedia('(pointer:coarse)').matches);}window.addEventListener('resize',resize);

const palettes={sky:SEASONS.map(s=>new T.Color(s.sky)),fog:SEASONS.map(s=>new T.Color(s.fog)),sun:[0xfff0d2,0xfff4db,0xffd9a0,0xffedcf].map(c=>new T.Color(c)),hemi:[0xc4e7f5,0xcceaff,0xe4dfcb,0xc9e2ff].map(c=>new T.Color(c)),water:[0x006d75,0x006e79,0x08757a,0x057790].map(c=>new T.Color(c)),ground:[0x495e34,0x47643a,0x806142,0x9cbbd6].map(c=>new T.Color(c))};
const mixColor=(colors,w,out)=>{out.setRGB(0,0,0);for(let i=0;i<4;i++){out.r+=colors[i].r*w[i];out.g+=colors[i].g*w[i];out.b+=colors[i].b*w[i];}return out;};
function applySeasonLight(w){mixColor(palettes.sky,w,scene.background);mixColor(palettes.fog,w,water.fog.color);mixColor(palettes.sun,w,water.lighting.sun.color);mixColor(palettes.hemi,w,hemisphere.color);mixColor(palettes.ground,w,hemisphere.groundColor);mixColor(palettes.water,w,water.color.waterColor);water.lighting.sun.intensity.value=w.reduce((v,x,i)=>v+x*[6.7,6.9,5.8,6.0][i],0);water.lighting.sun.direction.value.set(-.48,w.reduce((v,x,i)=>v+x*[.72,.86,.55,.58][i],0),-.6).normalize();}
function updateAdventureHud(){
 $('boatName').textContent=game.boat.name;$('energyValue').textContent=Math.floor(game.energy);$('energyFill').style.width=game.energy+'%';
 $('attack').disabled=game.status!=='playing'||game.energy<18||game.attackCooldown>0;
 $('attackState').textContent=game.attackCooldown>0?game.attackCooldown.toFixed(1)+' s':'18 魔力';
 $('boatSkill').disabled=game.status!=='playing'||game.energy<game.boat.cost||game.skillCooldown>0;
 $('skillLabel').firstChild.textContent=({feather:'跃浪',moss:'护盾',moon:'共鸣'})[game.boat.id];$('skillState').textContent=game.skillCooldown>0?Math.ceil(game.skillCooldown)+' s':game.boat.cost+' 魔力';
 const d=game.activeDragon;$('bossHud').hidden=!d||game.status==='ready';
 if(d){$('bossName').textContent=d.name;$('bossHealth').style.width=d.hp/d.maxHp*100+'%';const perfect=d.phase==='windup'&&d.age>=1.15;$('bossHud').classList.toggle('counterReady',perfect);$('bossPhase').textContent=d.hp+' / '+d.maxHp;$('bossHint').textContent=perfect?'反击时机！':d.phase==='windup'?'蓄力中 · 避开光带':d.phase==='breath'?'龙息来袭':d.phase==='recover'?'趁现在，反击':'恶龙拦路';}
 $('driftHud').hidden=game.status!=='playing'||(game.driftCharge<=.05&&game.boost<=0);$('driftFill').style.width=(game.boost>0?100:game.driftCharge*100)+'%';$('driftLabel').textContent=game.boost>0?'顺流冲刺':game.driftCharge>.5?'松开空格 · 冲刺！':'压弯蓄力';
 const branch=game.activeBranch;$('courseAlert').hidden=game.status!=='playing'||!!d||(!branch&&!game.surfSection);$('courseAlert').textContent=branch?(branch.phase==='bending'?`雪枝将落 · ${Math.max(0,branch.limit-branch.age).toFixed(1)}s · 加速通过`:'倒木来袭 · 使用技能'):game.surfSection?`${game.surfSection.name} · ↓ ${game.surfSection.drop} m · 减速落水`:'';
 Object.assign(canvas.dataset,{height:game.height.toFixed(2),riverHeight:riverHeight(game.z).toFixed(2),airborne:String(game.airborne),surfFlights:String(game.surfFlights),landings:String(game.smoothLandings),branch:branch?branch.id+':'+branch.phase:'none',paddlingHard:String(game.paddlingHard),boat:game.boat.id,health:String(game.health),maxHealth:String(game.maxHealth),energy:game.energy.toFixed(1),guard:game.guard.toFixed(1),resonance:game.resonance.toFixed(1),boost:game.boost.toFixed(1),drift:game.driftCharge.toFixed(2),gateHits:String(game.gateHits.size),counter:String(game.perfectCounters),boss:d?d.id+':'+d.phase+':'+d.hp:'none',disaster:game.activeDisaster?game.activeDisaster.kind+':'+game.activeDisaster.phase:'none',score:String(journeyScore(game))});
}
function failRuntime(error){
 if(frameStopped)return;frameStopped=true;console.error('Game runtime stopped',error);resetInput();if(game.status==='playing')game.pause();
 galleryActive=false;document.body.classList.remove('playing','viewing');$('galleryBar').hidden=true;$('menu').hidden=false;$('modal').hidden=true;
 for(const id of ['journeyHud','stats','actionHud','touchControls','pause','bossHud','driftHud','courseAlert','notice'])$(id).hidden=true;
 $('chapterToast').classList.remove('show');canvas.dataset.state='error';canvas.dataset.failure='runtime';
 if(startup)startup.fail('画面暂时中断，请重新准备花园。');else $('loading').textContent='画面暂时中断，请重新打开游戏。';
}
function readyToPlay(){
 if(!assetReady||!renderReady||frameStopped)return;
 $('gallery').disabled=false;if(startup)startup.ready();else{$('start').disabled=false;$('explore').disabled=false;$('loading').textContent='';$('start').querySelector('span').textContent='出 发';}
}
if(startup)startup.onRuntimeFailure(failRuntime);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failRuntime(new Error('Graphics context lost'));});
async function frame(now){
 if(frameStopped)return;
 try{await drawFrame(now);}catch(error){failRuntime(error);}
}
async function drawFrame(now){renderer.info.reset();let dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;frameCount++;if(now-fpsAt>1000){fps=Math.round(frameCount*1000/(now-fpsAt));frameCount=0;fpsAt=now;canvas.dataset.fps=fps;}
 const playing=game.status==='playing',touch=controls.sample();const steer=touch.steer||(Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')));if(!galleryActive)game.step(artFrozen?0:dt,{steer,brake:touch.brake||keys.has('Space'),paddle:touch.paddle||keys.has('KeyW')||keys.has('ArrowUp'),attack:castRequested||keys.has('KeyE'),skill:skillRequested||keys.has('KeyQ')});else game.events=[];castRequested=false;skillRequested=false;
 if(game.events.includes('hit')){$('hitFlash').style.opacity='.65';setTimeout(()=>$('hitFlash').style.opacity='0',230);$('notice').textContent=({plant:'食人花咬中了 · 反击它',dragon:'撞上溪龙',breath:'龙息击中 · 留意反击时机',wall:'擦到岩壁 · 减速',rockfall:'落石击中 · 避开光圈',lightning:'闪电击中 · 远离落点',leafstorm:'卷入龙卷 · 逆风划出',avalanche:'雪崩击中 · 避开光带',branch:'被倒木砸中 · 加速或开盾'}[game.lastHit]||'碰到礁石 · 减速绕行');noticeUntil=elapsed+2.3;}if(game.events.includes('plant-warning')||game.events.includes('dragon-warning')){$('notice').textContent=game.events.includes('plant-warning')?'食人花苏醒 · 避开粉圈':'溪龙横渡 · 减速';noticeUntil=elapsed+2.5;}if(game.events.includes('rapids-warning')||game.events.includes('whirlpool-warning')){$('notice').textContent=game.events.includes('rapids-warning')?'急流将至 · 减速稳船':'漩涡 · 绕外圈';noticeUntil=elapsed+3;}if(game.events.includes('current-clear')){$('notice').textContent='冲过险流 · +3 光种';noticeUntil=elapsed+2;}if(game.events.includes('dodge')){$('notice').textContent='巧妙闪避 · +5 光种';noticeUntil=elapsed+2;}if(game.events.includes('won')||game.events.includes('lost'))showModal(game.status);

 const magicNotices={chime:`花铃响起 · ${game.chimes} / 3`,lotus:`荷叶借力 · 跃过水面 ${game.lotusJumps} / 3`,watch:'怀表魔法 · 怪物动作放慢 8 秒',lantern:'暖灯点亮 · 抵挡下一次碰撞',shield:'暖灯守住了小舟',combo:`光种连收 ×${game.combo} · +3 光种`};
 for(const event of game.events){if(event==='wonder-warning'){$('notice').textContent=game.wonderHint;noticeUntil=elapsed+3;}if(magicNotices[event]){$('notice').textContent=magicNotices[event];noticeUntil=elapsed+2.5;}}
 const adventureNotices={'surf-launch':'跃浪！减速落水','surf-perfect':'完美落水 +45','surf-land':'漂亮落水','branch-escaped':'惊险逃脱！','branch-delayed':'雪枝暂缓 · 快走！','drift-boost':'压弯冲刺！','gate':'水门通过 · 魔力 +8','gate-combo':`连续穿门 ×${game.gateStreak} · 漂流高手！`,'gate-miss':'错过水门','narrow-perfect':'无伤过窄道','near-miss':'擦身而过 +15','boat-skill':game.boat.skill+'！','guard-block':'护盾挡住了！','perfect-counter':'完美反击！','dragon-defeated':'恶龙退散 · +15 光种','dragon-escaped':'恶龙飞走了 · 下一次抓住反击时机','disaster-perfect':'无伤过险流'};
 for(const e of game.events){if(adventureNotices[e]){$('notice').textContent=adventureNotices[e];noticeUntil=elapsed+2.2;}if(e==='surf-warning'){$('notice').textContent=(game.surfSection?.name||'前方飞流')+' · 浪峰后有陡降';noticeUntil=elapsed+3;}if(e==='branch-warning'){$('notice').textContent='雪枝开裂 · 奋力划桨！';noticeUntil=elapsed+3;}if(e==='narrow-warning'){$('notice').textContent=game.routeHint;noticeUntil=elapsed+3;}if(e==='disaster-warning'){$('notice').textContent=game.activeDisaster?.hint||'危险将至 · 留意水面';noticeUntil=elapsed+2.5;}}
 if(game.events.includes('keepsake')){noticeUntil=elapsed+3;$('notice').textContent=`四季纪念 ${game.keepsakes.size} / 4`;}
 if(game.season!==lastSeason&&playing){lastSeason=game.season;const s=SEASONS[lastSeason];$('chapterToast').querySelector('small').textContent=s.en;$('chapterToast').querySelector('strong').textContent=s.name;$('chapterToast').querySelector('p').textContent=s.note;toastUntil=lastSeason===game.startSeason&&game.z<10?elapsed+3:0;} $('chapterToast').classList.toggle('show',playing&&!galleryActive&&elapsed<toastUntil);$('notice').hidden=elapsed>=noticeUntil;$('notice').style.opacity=elapsed<noticeUntil?'1':'0';
 updateAdventureHud();expeditionView.update(game,game.time);audio.update(game);canvas.dataset.audio=audio.ready?'suno-ready':audio.error?'error':'off';canvas.dataset.audioEnabled=String(audio.enabled);canvas.dataset.audioContext=audio.ctx?.state||'off';canvas.dataset.audioBuffers=audio.buffers.size;canvas.dataset.audioMaster=audio.master?.gain.value.toFixed(3)||'0';canvas.dataset.audioStream=audio.music?.[4]?.gain.gain.value.toFixed(3)||'0';canvas.dataset.audioMix=audio.music?.slice(0,4).map(t=>t.gain.gain.value.toFixed(2)).join(',')||'';const s=SEASONS[game.season],weights=seasonWeights(game.z);applySeasonLight(weights);garden.update(game.z,elapsed,game.season);atmosphere.update(game.z,elapsed,weights);updateCamera();updatePaddling(boat,dt,game,touch.brake||keys.has('Space'),steer,artFrozen);paddleWater.update(boat,game.status==='paused'||artFrozen?0:dt,game.status==='playing'&&!artFrozen);canvas.dataset.paddleClip=boat.userData.clip||'loading';canvas.dataset.paddleTime=boat.userData.paddleAction?.time.toFixed(3)||'0';canvas.dataset.paddleRate=boat.userData.paddleAction?.timeScale.toFixed(3)||'0';canvas.dataset.paddlePaused=String(boat.userData.paddleAction?.paused);canvas.dataset.paddleSplashes=paddleWater.emissions;
 obstacles.forEach((o,i)=>o.visible=Math.abs(game.course.obstacles[i].z-game.z)<115);seeds.forEach((o,i)=>{const d=game.course.seeds[i].z-game.z;o.visible=!game.collected.has(i)&&d>-5&&d<100;if(o.visible){o.rotation.y=elapsed*1.2;o.position.y=riverHeight(game.course.seeds[i].z)+.75+Math.sin(elapsed*2+i)*.13;}});wakes.forEach((w,i)=>{const t=(elapsed*.7+i/20)%1;w.position.set(center(game.z)+game.x,riverHeight(game.z)+.025,-game.z+1.7+t*5);w.scale.set(1+t*2,1+t*3,1);w.material.opacity=playing?(1-t)*.15:.03;});boat.visible=game.invincible<=0||Math.sin(elapsed*30)>.05;
 $('seasonName').textContent=transitionAt(game.z)?.name||s.name;$('keepsakes').textContent=['✿','❀','◷','✧'].map((icon,i)=>game.keepsakes.has(i)?icon:'·').join('  ');$('keepsakes').setAttribute('aria-label',`四季纪念 ${game.keepsakes.size} / 4`);$('power').textContent=game.slowTime>0?`缓时 ${Math.ceil(game.slowTime)}s`:game.shield?'暖灯守护':game.combo>=3?`光种连收 ×${game.combo}`:'';$('distance').textContent=Math.floor(game.z);$('progress').style.width=game.z/LENGTH*100+'%';$('seedCount').textContent=String(game.seeds).padStart(2,'0');document.querySelectorAll('#health .life').forEach((heart,i)=>heart.classList.toggle('is-empty',i>=game.health));$('health').setAttribute('aria-label',`剩余生命 ${game.health} / 3`);canvas.dataset.weights=weights.map(w=>w.toFixed(3)).join(',');canvas.dataset.keepsakes=game.keepsakes.size;canvas.dataset.jump=game.jump.toFixed(2);canvas.dataset.slowTime=game.slowTime.toFixed(1);canvas.dataset.shield=game.shield;wonderView.update(game,elapsed);canvas.dataset.artFrozen=String(artFrozen);canvas.dataset.view=galleryActive?'gallery':'game';canvas.dataset.sun=water.lighting.sunLight.intensity;canvas.dataset.state=game.status;canvas.dataset.season=game.season;canvas.dataset.distance=Math.floor(game.z);canvas.dataset.lateral=game.x.toFixed(2);canvas.dataset.models=assetReady?'hyper3d-loaded':'loading';canvas.dataset.kayaker=boat.userData.model||'loading';encounterView.update(game,elapsed);currentView.update(game,elapsed);canvas.dataset.current=game.current.kind||'calm';canvas.dataset.speed=game.speed.toFixed(2);canvas.dataset.braking=String(touch.brake||keys.has('Space'));canvas.dataset.inputSteer=String(touch.steer);canvas.dataset.inputPaddle=String(touch.paddle);canvas.dataset.scenery=['bluebell-teacup','lotus-watering-can','maple-pocket-watch','snow-lantern'][game.season];canvas.dataset.enemies=game.encounters.filter(e=>e.phase==='warning'||e.phase==='attack').map(e=>e.kind+':'+e.phase).join(',');canvas.dataset.water='water-pro-3.5.1';canvas.dataset.backend=water.backend;await water.update(dt);if(gardenLight)gardenLight.render();else water.render();canvas.dataset.triangles=renderer.info.render.triangles;canvas.dataset.calls=renderer.info.render.drawCalls;canvas.dataset.textures=renderer.info.memory.textures;canvas.dataset.geometries=renderer.info.memory.geometries;if(!renderReady){renderReady=true;canvas.dataset.firstFrame='ready';readyToPlay();}if(!frameStopped)requestAnimationFrame(frame);
}
if(startup)startup.interactive();
updateCamera(true);requestAnimationFrame(frame);
const assetTasks=[()=>garden.loadModels(),()=>garden.loadFlowers(),()=>loadKayaker(boat),()=>encounterView.loadDragon().then(template=>expeditionView.setDragon(template,game))];
const assetDone=assetTasks.map(()=>false);let assetLoading=false;
async function loadGameAssets(){
 if(assetLoading)return;assetLoading=true;assetReady=false;if(!startup){$('start').disabled=true;$('explore').disabled=true;}
 if(startup)startup.progress('正在准备角色与花园…');
 const results=await Promise.all(assetTasks.map(async(task,i)=>{
  if(assetDone[i])return true;
  try{await task();assetDone[i]=true;if(startup)startup.progress('正在准备花园 '+assetDone.filter(Boolean).length+' / 4');return true;}
  catch(error){console.error('Game asset load failed',error);return false;}
 }));
 assetLoading=false;
 if(results.every(Boolean)){assetReady=true;readyToPlay();}
 else if(startup)startup.fail('有一部分花园没有加载好，请重试。',loadGameAssets);
 else $('loading').textContent='花园还没准备好 · 刷新再试';
}
loadGameAssets();
