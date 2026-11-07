import test from 'node:test';
import assert from 'node:assert/strict';
import {versionReferences} from '../../scripts/cache-version.mjs';
test('build versions static imports, dynamic imports, bootstrap and CSS',()=>{
 const s=`import {x} from './world-v2.js';import('./game.js');<script src="./startup-ui.js"></script><link href="./style.css">`;
 const result=versionReferences(s,'abc123');assert.equal((result.match(/build=abc123/g)||[]).length,4);
});
test('build versions preserve import-map libraries and assets',()=>{
 const s=`"three":"./vendor/three.webgpu.js";import 'three';const a='./assets/model.glb';`;
 assert.equal(versionReferences(s,'123'),s);
});
test('existing queries and fragments survive; replacing the stamp is idempotent',()=>{
 const s=`import './spring-dressing.js?v=tapered2#part';`;
 const a=versionReferences(s,'123');assert(a.includes('?v=tapered2&build=123#part'));assert.equal(versionReferences(a,'123'),a);
 assert(versionReferences(a,'456').includes('build=456'));assert(!versionReferences(a,'456').includes('build=123'));
});
