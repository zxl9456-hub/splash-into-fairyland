import test from 'node:test';import assert from 'node:assert/strict';
import {Journey} from '../core.mjs';
import {SURF_SECTIONS,SNOW_BRANCHES,riverHeight,riverSlope} from '../surf.mjs';
import {castMagic,stepCombat} from '../combat.mjs';
const empty={obstacles:[],seeds:[]};
test('river height is continuous at all crests and seams, and drops 34 metres',()=>{assert.equal(riverHeight(0),0);assert.equal(riverHeight(1200),-34);for(const s of SURF_SECTIONS)for(const z of[s.from,s.crest,s.bottom,s.to]){assert(Math.abs(riverHeight(z+.001)-riverHeight(z-.001))<.005);assert(Math.abs(riverSlope(z))<.01);}for(const s of SURF_SECTIONS)assert(riverHeight(s.crest)-riverHeight(s.bottom)>s.drop);});
test('fast crest crossing launches, gravity returns to water, braking gives landing reward',()=>{const s=SURF_SECTIONS[0],g=new Journey({...empty,surf:[s]});g.reset({mode:'explore'});g.z=s.crest-.1;g.height=riverHeight(g.z)+.12;g.speed=16;g.start();g.step(.02);assert(g.airborne);assert.equal(g.surfFlights,1);let clearance=0;for(let i=0;i<300&&g.airborne;i++){g.step(1/60,{brake:true});clearance=Math.max(clearance,g.height-riverHeight(g.z));}assert(clearance>1);assert(!g.airborne);assert.equal(g.smoothLandings,1);assert(Math.abs(g.height-riverHeight(g.z)-.12)<1e-6);});
test('slow boats follow the slope without forced launch',()=>{const s=SURF_SECTIONS[0],g=new Journey({...empty,surf:[s]});g.z=s.crest-.02;g.height=riverHeight(g.z)+.12;g.speed=3;g.start();g.step(.02,{brake:true});assert(!g.airborne);assert.equal(g.surfFlights,0);});
test('snow bough bends before falling, penalizes late crossings and allows fast escape',()=>{for(const slow of[true,false]){const b=SNOW_BRANCHES[0],g=new Journey({...empty,branches:[b]});g.z=b.z-31;g.speed=10.9;g.start();let sawBend=false,sawFall=false;for(let i=0;i<1200&&g.z<b.z+4;i++){g.step(1/60,{brake:slow,paddle:!slow});sawBend ||= g.branches[0].phase==='bending';sawFall ||= g.branches[0].phase==='falling';}assert(sawBend);if(slow){assert(sawFall);assert(g.branches[0].hit);assert.equal(g.health,2);}else{assert(!g.branches[0].hit);assert.equal(g.branchEscapes,1);assert.equal(g.health,3);}}});
test('star magic delays a snow bough at most 1.2 seconds and pause freezes it',()=>{const g=new Journey({...empty,branches:[SNOW_BRANCHES[0]]});g.z=960;g.start();g.step(.01);const b=g.activeBranch,limit=b.limit;assert(b);for(let i=0;i<4;i++){g.attackCooldown=0;g.energy=100;castMagic(g);stepCombat(g,.4);}assert(Math.abs(b.limit-limit-1.2)<1e-9);g.pause();const age=b.age;g.step(.05);assert.equal(b.age,age);g.reset();assert.equal(g.branches[0].phase,'sleep');});
test('hard paddling beats a snow bough deadline for every boat; braking takes priority',()=>{
 for(const boat of['feather','moss','moon']){
  const run=paddle=>{const g=new Journey({...empty,branches:[SNOW_BRANCHES[0]]});g.reset({boat});g.z=SNOW_BRANCHES[0].z-32.1;g.speed=10.9*g.boat.speed;g.start();for(let i=0;i<600&&g.z<SNOW_BRANCHES[0].z+4;i++)g.step(1/60,{paddle});return g;};
  const fast=run(true),normal=run(false);assert.equal(fast.health,fast.maxHealth);assert(fast.branchEscapes>0);assert(normal.health<normal.maxHealth);
  for(let i=0;i<180;i++)fast.step(1/60,{paddle:true,brake:true});assert(!fast.paddlingHard);assert(fast.speed<4);fast.reset({boat});assert(!fast.paddlingHard);
 }
});
