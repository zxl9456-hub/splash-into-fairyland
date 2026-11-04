import {QUALITY} from './quality.mjs';
import {fitWaterToRiver} from './river-profile.js';
import * as T from 'three';
import {WaterSystem,Sky} from './vendor/water-pro/index.js';

export async function createRiverWater(renderer,scene,camera,boat){
 const mobile=innerWidth<700;
 const water=await WaterSystem.create(renderer,scene,camera,renderer.backend.isWebGPUBackend?QUALITY.water:'high');
 water.rebuildGeometry({baseSize:32,levels:4});water.setMaxScale(128);
 await water.recreateOceanFloor({depth:2.2,meshResolution:32,displacementScale:4,displacementStrength:.3,textureDisplacementStrength:0,normalScale:.6,tileSize:5,customTextures:{colorUrl:'./assets/environment/riverbed-color.jpg',normalUrl:'./assets/environment/riverbed-normal.jpg'},caustics:{enabled:true,intensity:1.3,scale:4.5,depthAttenuation:.14,waveDistortion:.35}});water.floor.setVisible(true);
 water.waves.update({amplitude:1.35,animationSpeed:.8,windSpeed:6.8,windDirection:Math.PI,peakWavelength:3.0,choppiness:1.35,spectralSharpness:.65,standingWaveRatio:.1});
 water.color.update({mode:'custom',waterColor:'#007985',absorptionColor:'#994f35',transmissionColor:'#4dd5bc'});
 water.fresnel.refractionStrength=.12;
 water.foam.surface.enabled=false;water.foam.surface.coverage=.85;water.foam.surface.opacity=.12;
 water.foam.shoreline.range=.65;water.foam.shoreline.coverage=.65;water.foam.shoreline.opacity=.65;water.foam.shoreline.size=2.5;
 water.foam.waves.opacity=.15;water.foam.waves.size=3;
 water.sparkle.enabled=true;water.sparkle.minDistance=0;water.sparkle.intensity=1.3;water.sparkle.power=320;water.sparkle.fadeDistance=85;
 water.ssr.enabled=true;water.ssr.strength=.95;water.ssr.stepCount=QUALITY.reflectionSteps;water.ssr.maxDistance=55;
 water.underwater.enabled=false;water.sunShafts.enabled=false;water.rain.enabled=false;water.particles.enabled=false;if(water.spray)water.spray.enabled=false;
 water.fog.fadeStart=72;water.fog.fadeEnd=180;water.fog.fadePower=1.4;water.fog.skyBlendDistance=180;water.fog.color='#c4dfcf';
 const equirect=await new T.TextureLoader().loadAsync('./assets/environment/sky-4k.jpg');equirect.mapping=T.EquirectangularReflectionMapping;equirect.colorSpace=T.SRGBColorSpace;equirect.wrapS=T.RepeatWrapping;
 const sky=new Sky(renderer,{equirect,sunDirection:water.lighting.sun.direction,brightness:1,reflectionRoughness:.09});
 water.setSky(sky);for(const dome of sky.getMeshes()){dome.scale.setScalar(.08);scene.add(dome);}scene.background=new T.Color('#c1e3ed');
 water.environment.intensity=.5;
 water.lighting.sun.direction.value.set(-.3,.82,-.5).normalize();water.lighting.sun.intensity.value=5.8;water.lighting.sun.color.set(0xfff0d2);
 const light=water.lighting.sunLight;light.shadow.mapSize.set(QUALITY.shadowSize,QUALITY.shadowSize);Object.assign(light.shadow.camera,{left:-26,right:26,top:40,bottom:-30,near:1,far:150});light.shadow.camera.updateProjectionMatrix();light.shadow.normalBias=.02;scene.add(light.target);
 water.lighting.addSunSyncListener(()=>{light.target.position.copy(boat.position).add(new T.Vector3(0,0,-28));light.position.copy(light.target.position).addScaledVector(water.lighting.sun.direction.value,80);});
 water.wake.enabled=true;water.wake.worldSize=60;water.wake.resolution=QUALITY.wakeSize;water.wake.friction=.4;water.wake.foamPersistence=.985;water.wake.foamStrength=1.3;
 water.wake.addGenerator(boat,{radius:.85,depth:.24,teleportThreshold:5,offset:new T.Vector3(0,0,1.5)});
 fitWaterToRiver(water);return water;
}
