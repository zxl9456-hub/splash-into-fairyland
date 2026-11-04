import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../startup-ui.js',import.meta.url),'utf8');
class Element extends EventTarget{
 constructor(id,dataset={}){super();this.id=id;this.dataset=dataset;this.disabled=true;this.hidden=true;this.textContent='';this.attrs={};this.span={textContent:''};this.classList={toggle(){}};}
 querySelector(){return this.span;}setAttribute(k,v){this.attrs[k]=v;}click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}
}
function setup(loadEngine){
 const ids=Object.fromEntries(['loading','retryLoad','start','explore','sound','boatDescription'].map(id=>[id,new Element(id)]));
 const boats=['feather','moss','moon'].map(boat=>new Element('',{boat})),seasons=[0,1,2,3].map(season=>new Element('',{season:String(season)}));
 const root={dataset:{}},host=new EventTarget(),timers=new Map();let timer=0,reloads=0;
 const document={documentElement:root,getElementById:id=>ids[id],querySelectorAll:selector=>selector==='[data-boat]'?boats:selector==='[data-season]'?seasons:[...boats,...seasons,ids.sound]};
 host.location={reload(){reloads++;}};if(loadEngine)host.riverlightLoadEngine=loadEngine;
 vm.runInNewContext(source,{window:host,document,setTimeout(fn){timers.set(++timer,fn);return timer;},clearTimeout(id){timers.delete(id);}});
 return{ids,boats,seasons,root,host,api:host.riverlightStartup,timers,get reloads(){return reloads;}};
}
test('start responds before engine readiness and starts exactly once when ready',()=>{
 const h=setup(),calls=[];h.ids.start.click();assert.match(h.ids.loading.textContent,/自动出发/);
 h.api.bindStart(mode=>calls.push(mode));assert.equal(calls.length,0);h.api.ready();h.api.ready();assert.deepEqual(calls,['journey']);
});
test('early boat and season selections reach the engine when it binds',()=>{
 const h=setup(),selection={};h.boats[2].click();h.seasons[3].click();
 h.api.bindChoices({boat:id=>selection.boat=id,season:id=>selection.season=id});assert.deepEqual(selection,{boat:'moon',season:3});assert.equal(h.boats[2].attrs['aria-pressed'],'true');
});
test('fatal first-frame failure stays fatal after late model progress and completion',()=>{
 const h=setup(),calls=[];h.api.bindStart(mode=>calls.push(mode));h.ids.start.click();h.api.fail('画面暂时中断');h.api.progress('4 / 4');assert.equal(h.api.ready(),false);
 assert.equal(h.root.dataset.boot,'fatal');assert.equal(h.ids.loading.textContent,'画面暂时中断');assert.equal(h.ids.retryLoad.hidden,false);assert.deepEqual(calls,[]);
 h.ids.start.click();assert.equal(h.reloads,1);
});
test('recoverable model failure retries on the page and can become ready',()=>{
 const h=setup();let retried=0;h.api.fail('模型失败',()=>{retried++;});h.ids.retryLoad.click();assert.equal(retried,1);h.api.ready();assert.equal(h.root.dataset.boot,'ready');assert.equal(h.ids.retryLoad.hidden,true);
});
test('an unhandled error after ready reaches the runtime recovery handler',()=>{
 const h=setup();let called=0;h.api.onRuntimeFailure(()=>called++);h.api.ready();h.host.dispatchEvent(new Event('unhandledrejection'));assert.equal(called,1);
});
test('startup timeout exposes a working retry even if engine never loaded',()=>{
 const h=setup();for(const fn of h.timers.values())fn();assert.equal(h.ids.retryLoad.hidden,false);h.ids.retryLoad.click();assert.equal(h.reloads,1);
});
test('early explore request is preserved and cleared when a fatal error occurs',()=>{
 const h=setup(),calls=[];h.ids.explore.click();h.api.bindStart(mode=>calls.push(mode));h.api.ready();assert.deepEqual(calls,['explore']);
 h.api.fail('运行中断');h.api.ready();assert.deepEqual(calls,['explore']);
});

test('lightweight menu allocates no engine before a start gesture and queues one launch',()=>{
 let engines=0;const h=setup(()=>engines++),calls=[];
 assert.equal(h.root.dataset.boot,'idle');assert.equal(engines,0);assert.equal(h.timers.size,0);
 h.boats[1].click();h.seasons[3].click();assert.equal(engines,0);
 h.ids.explore.click();h.ids.explore.click();assert.equal(engines,1);
 const choice={};h.api.bindChoices({boat:v=>choice.boat=v,season:v=>choice.season=v});
 h.api.bindStart(mode=>calls.push(mode));h.api.ready();assert.deepEqual(calls,['explore']);assert.deepEqual(choice,{boat:'moss',season:3});
});
