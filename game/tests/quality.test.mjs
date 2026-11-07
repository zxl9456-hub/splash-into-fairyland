import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES,resolveQuality,pixelRatioFor,AdaptiveResolution} from '../quality.mjs';
test('default keeps detailed assets but caps retina framebuffer work',()=>{
 assert.equal(resolveQuality().id,'auto');assert.equal(resolveQuality('bad').id,'auto');assert.equal(resolveQuality('ultra').id,'ultra');
 for(const [w,h,dpr] of [[1920,1080,2],[390,844,3],[3840,2160,2]]){const ratio=pixelRatioFor(PROFILES.auto,w,h,dpr);assert(w*h*ratio**2<=1600001);assert(ratio<=dpr);}
});
test('adaptive resolution responds to sustained slow frames, not one loading hitch',()=>{
 const a=new AdaptiveResolution(PROFILES.auto);let changed=false;
 for(let t=100;t<12000;t+=33)changed=a.sample(33,t)||changed;
 assert(changed);assert(a.scale<1);assert(a.scale>=.65);
 const scale=a.scale;a.sample(1800,12000);a.sample(200,12200,false);assert.equal(a.scale,scale);
});
test('explicit quality is stable and recovery has hysteresis',()=>{
 const a=new AdaptiveResolution(PROFILES.ultra);for(let t=0;t<25000;t+=40)a.sample(40,t);assert.equal(a.scale,1);
 const b=new AdaptiveResolution(PROFILES.auto);b.scale=.7;
 for(let t=100;t<25000;t+=16)b.sample(16,t);
 assert(b.scale>.7&&b.scale<1);
});
