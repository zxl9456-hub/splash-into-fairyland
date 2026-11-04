import {seasonWeights} from './season-flow.mjs';
// All source recordings were generated in Suno. No synthesized substitute sounds.
export class FairytaleAudio{
 constructor(){this.enabled=false;this.ready=false;this.error=null;this.effects=new Set;this.buffers=new Map;this.cooldowns=new Map;}
 async enable(value){this.enabled=value;if(!value){if(this.master)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.06);return;}
  if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);this.music=[];this.lastState='ready';}
  await this.ctx.resume();
  if(!this.loading)this.loading=this.load().catch(e=>{this.error=e;this.enabled=false;this.loading=null;throw e;});
  await this.loading;if(this.enabled)this.master.gain.setTargetAtTime(.8,this.ctx.currentTime,.2);
 }
 async load(){const names=['spring','summer','autumn','winter','stream','seed','magic','warning','hit','complete'];
  const loaded=await Promise.all(names.map(async name=>{const r=await fetch(`./audio/${name}.mp3`);if(!r.ok)throw new Error(`Audio ${name}: ${r.status}`);return[name,await this.ctx.decodeAudioData(await r.arrayBuffer())];}));
  this.buffers=new Map(loaded);
  for(const name of['spring','summer','autumn','winter','stream']){const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.get(name);source.loop=true;gain.gain.value=0;source.connect(gain).connect(this.master);source.start();this.music.push({name,source,gain});}
  this.ready=true;this.error=null;
 }
 play(name,volume=1){if(!this.ready||!this.enabled)return;if(this.effects.size>=6)return;const now=this.ctx.currentTime;if(now-(this.cooldowns.get(name)||-100)<(name==='seed'?.14:.3))return;this.cooldowns.set(name,now);const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.get(name);if(!source.buffer)return;gain.gain.value=volume;source.connect(gain).connect(this.master);source.start();this.effects.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.effects.delete(source);};if(name==='warning'||name==='hit')this.duckUntil=now+1.6;}
 reset(){for(const s of this.effects)s.stop();this.effects.clear();this.cooldowns.clear();this.duckUntil=0;}
 update(game){if(!this.ready)return;const t=this.ctx.currentTime,w=seasonWeights(game.z),active=game.status==='playing',duck=t<(this.duckUntil||0)?.45:1;
  for(let i=0;i<4;i++)this.music[i].gain.gain.setTargetAtTime(active?Math.sqrt(w[i])*.68*duck:game.status==='ready'&&i===0?.24:0,t,.28);
  this.music[4].gain.gain.setTargetAtTime(active?.5+Math.min(.18,game.speed*.009):0,t,.3);
  if(!active&&this.lastState==='playing'&&game.status==='paused')this.reset();this.lastState=game.status;
  for(const e of game.events){if(e==='seed'||e==='chime')this.play('seed',.68);else if(e==='hit')this.play('hit',.8);else if(e==='won')this.play('complete',.9);else if(e.endsWith('-warning')&&e!=='wonder-warning')this.play('warning',.65);else if(['lotus','watch','lantern','shield','combo','keepsake','current-clear','dodge','cast','perfect-counter','boat-skill','dragon-defeated','gate','gate-combo','drift-boost','disaster-perfect','surf-launch','surf-land','surf-perfect','branch-escaped','branch-delayed'].includes(e))this.play('magic',.65);}
 }
}
