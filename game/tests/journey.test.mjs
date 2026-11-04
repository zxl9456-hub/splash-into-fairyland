import {test} from 'node:test';import assert from 'node:assert/strict';import {Journey,LENGTH,makeCourse,navigationHalfWidth} from '../core.mjs';
function tick(g,seconds,input={}){for(let i=0;i<seconds*60;i++)g.step(1/60,input);}
test('every boat and launch mode has exactly three lives, loses on the third hit and resets',()=>{
 for(const boat of ['feather','moss','moon'])for(const mode of ['journey','explore']){
  const g=new Journey({obstacles:[],seeds:[]});g.reset({boat,mode,season:mode==='explore'?2:0});
  assert.equal(g.health,3);assert.equal(g.maxHealth,3);g.start();
  for(const remaining of [2,1,0]){g.invincible=0;g.damage('rockfall');assert.equal(g.health,remaining);g.damage('rockfall');assert.equal(g.health,remaining);}
  assert.equal(g.status,'lost');const distance=g.z;tick(g,5);assert.equal(g.z,distance);
  g.reset({boat,mode});assert.equal(g.health,3);assert.equal(g.maxHealth,3);assert.equal(g.status,'ready');
 }
});
test('motion is bounded, braking lowers speed and pause freezes progress',()=>{const g=new Journey({obstacles:[],seeds:[]});g.start();tick(g,5,{steer:1});assert.equal(g.x,navigationHalfWidth(g.z));const fast=g.speed;tick(g,3,{brake:true});assert(g.speed<fast*.5);g.pause();const z=g.z;tick(g,3);assert.equal(g.z,z);g.pause();tick(g,1);assert(g.z>z);});
test('collisions consume one life per object and have a grace period',()=>{const g=new Journey({obstacles:[{z:3,x:0,radius:1},{z:4,x:0,radius:1}],seeds:[]});g.start();tick(g,1);assert.equal(g.health,2);assert.equal(g.passed.size,2);tick(g,1);assert.equal(g.health,2);});
test('pickups are collected once, reset restores course state',()=>{const g=new Journey({obstacles:[],seeds:[{x:0,z:3}]});g.start();tick(g,2);assert.equal(g.seeds,1);g.reset();assert.equal(g.seeds,0);assert.equal(g.collected.size,0);assert.equal(g.status,'ready');});
test('unobstructed journey reaches all seasons and wins',()=>{const g=new Journey({...makeCourse(),obstacles:[],encounters:[],dragons:[],disasters:[],narrows:[],branches:[]});g.reset({mode:'explore'});g.start();const seasons=new Set;for(let i=0;i<60*150;i++){g.step(1/60);seasons.add(g.season);}assert.deepEqual([...seasons],[0,1,2,3]);assert.equal(g.z,LENGTH);assert.equal(g.status,'won');assert.equal(g.health,3);});
test('three separated collisions end journey; finish never overwrites failure',()=>{const g=new Journey({obstacles:[{x:0,z:8,radius:1},{x:0,z:43,radius:1},{x:0,z:78,radius:1}],seeds:[]});g.start();tick(g,20);assert.equal(g.health,0);assert.equal(g.status,'lost');const z=g.z;tick(g,50);assert.equal(g.z,z);});
test('route and frame-rate behavior are deterministic',()=>{assert.deepEqual(makeCourse(),makeCourse());const a=new Journey({obstacles:[],seeds:[]}),b=new Journey({obstacles:[],seeds:[]});a.start();b.start();for(let i=0;i<600;i++)a.step(1/60);for(let i=0;i<300;i++)b.step(1/30);assert(Math.abs(a.z-b.z)<.1);});

test('hull stays inside the changing riverbank and winter ice clearance',()=>{for(const side of[-1,1]){const g=new Journey({...makeCourse(),obstacles:[],encounters:[],dragons:[],disasters:[],narrows:[],branches:[]});g.reset({mode:'explore'});g.start();for(let i=0;i<60*150;i++){g.step(1/60,{steer:side});assert.ok(Math.abs(g.x)<=navigationHalfWidth(g.z)+1e-9);}}for(const seed of makeCourse().seeds)assert.ok(Math.abs(seed.x)<navigationHalfWidth(seed.z));});
