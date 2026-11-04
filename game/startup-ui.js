(function(){
 'use strict';
 var status=document.getElementById('loading'),retry=document.getElementById('retryLoad'),start=document.getElementById('start'),explore=document.getElementById('explore');
 var phase=window.riverlightLoadEngine?'idle':'loading',handler=null,watchdog=null,pending=null,begin=null,runtimeFailure=null,choices=null,selectedBoat="feather",selectedSeason=0;
 function title(text){var span=start.querySelector('span');if(span)span.textContent=text;}
 function interactive(){document.querySelectorAll('[data-boat],[data-season],#sound').forEach(function(b){b.disabled=false;});}
 function arm(){clearTimeout(watchdog);watchdog=setTimeout(function(){if(phase==='loading'){status.textContent='花园准备得有点久，可以重新加载。';retry.hidden=false;}},30000);}
 function progress(text){if(phase==='ready'||phase==='fatal')return;phase='loading';status.textContent=pending?'正在准备花园，完成后自动出发…':text;retry.hidden=true;retry.disabled=false;arm();}
 function fail(text,retryHandler){
  if(phase==='fatal')return;
  phase=retryHandler?'error':'fatal';clearTimeout(watchdog);pending=null;
  status.textContent=text||'花园加载中断，请重试。';handler=retryHandler||null;retry.hidden=false;retry.disabled=false;
  start.disabled=false;explore.disabled=false;title('重新准备');document.documentElement.dataset.boot=phase;
 }
 function ready(){
  if(phase==='fatal')return false;
  phase='ready';clearTimeout(watchdog);status.textContent='';retry.hidden=true;start.disabled=false;explore.disabled=false;title('出 发');document.documentElement.dataset.boot='ready';
  var mode=pending;pending=null;if(mode&&begin)begin(mode);return true;
 }
 function restart(){
  if(retry.disabled)return;
  var fn=handler;handler=null;retry.disabled=true;
  if(fn){phase='loading';progress('正在重新准备花园…');fn();}
  else{status.textContent='正在重新打开花园…';window.location.reload();}
 }
 function request(mode){
  if(phase==='ready'&&begin){begin(mode);return;}
  if(phase==='fatal'||phase==='error'){restart();return;}
  pending=mode;if(phase==='idle'){phase='loading';window.riverlightLoadEngine();arm();}title('准备出发…');status.textContent='正在准备花园，完成后自动出发…';
 }
 function unexpected(e){
  var error=e&&e.reason||e&&e.error||e;
  if(runtimeFailure)runtimeFailure(error);else fail('花园加载中断，请重新准备。');
 }
 start.disabled=false;explore.disabled=false;
 start.addEventListener('click',function(){request('journey');});explore.addEventListener('click',function(){request('explore');});retry.addEventListener('click',restart);
 window.addEventListener('error',unexpected);window.addEventListener('unhandledrejection',unexpected);
 // Selection is independent of graphics initialization.
 document.querySelectorAll('[data-boat]').forEach(function(b){b.disabled=false;b.addEventListener('click',function(){
  selectedBoat=b.dataset.boat;document.querySelectorAll('[data-boat]').forEach(function(x){x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});
  document.getElementById('boatDescription').textContent={feather:'轻巧跃浪，翻过险流。',moss:'展开护盾，稳稳穿过险流。',moon:'蓄满月光，反击恶龙。'}[selectedBoat];
  if(choices)choices.boat(selectedBoat);
 });});
 document.querySelectorAll('[data-season]').forEach(function(b){b.disabled=false;b.addEventListener('click',function(){
  selectedSeason=Number(b.dataset.season);document.querySelectorAll('[data-season]').forEach(function(x){x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});
  if(choices)choices.season(selectedSeason);
 });});
 document.getElementById('sound').disabled=true;
 window.riverlightStartup={progress:progress,fail:fail,ready:ready,interactive:interactive,bindChoices:function(callbacks){choices=callbacks;choices.boat(selectedBoat);choices.season(selectedSeason);},bindStart:function(fn){begin=fn;},onRuntimeFailure:function(fn){runtimeFailure=fn;}};
 if(phase==='idle'){document.documentElement.dataset.boot='idle';title('出 发');status.textContent='选好小船，出发吧。';}else{document.documentElement.dataset.boot='loading';progress('正在唤醒花园…');}
})();
