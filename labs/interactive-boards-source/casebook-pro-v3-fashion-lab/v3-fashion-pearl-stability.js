// CASEBOOK PRO V3 — PEARL FASHION STABILITY + AUTHORING HARDENING
// Phase 3F.7. Isolated to the Fashion Pearl clone. No shared/V1/V2 mutation.
(function(){
'use strict';
const VERSION='3F.7-pearl-authoring-hardening';
const OLD_STARTER_KEY='casebook-v3-fashion-starter-seeded-v2';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
try{localStorage.setItem(OLD_STARTER_KEY,'managed-by-'+VERSION)}catch(_){}

const style=document.createElement('style');
style.id='pearl-stability-css';
style.textContent=`
body.v3-fashion-lab #esShell,
body.v3-fashion-pearl #esShell,
body.v3-fashion-lab.v3-fashion-pearl #esShell{
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
}
body.v3-fashion-pearl .stage{
  background:radial-gradient(circle at 48% 35%,#efede7 0%,#d7d4ce 54%,#bfc0c0 100%)!important;
}
body.v3-fashion-pearl.pearl-experience #esShell{background:transparent!important}
`;
(document.head||document.documentElement).appendChild(style);

function api(){try{return window.__CasebookV3Host?.api?.()||null}catch(_){return null}}
function v3(){return window.CasebookProV3||null}
function world(){try{return v3()?.getWorld?.()||null}catch(_){return null}}
function activeChapter(w){return w?.chapters?.find(c=>c.id===w.activeChapterId)||null}
function baseState(){try{return api()?.exportState?.()||null}catch(_){return null}}
function sceneApi(){try{return api()?.fashion||null}catch(_){return null}}
function currentSignature(){
  const w=world(),c=activeChapter(w),s=baseState();
  const ids=(s?.items||[]).map(x=>x.id||x.title||'').join(',');
  return [w?.worldId||'',w?.activeChapterId||'',c?.state?.items?.length??'',ids].join('|');
}
async function waitFor(fn,tries=80,ms=100){
  for(let i=0;i<tries;i++){try{const v=fn();if(v)return v}catch(_){ }await sleep(ms)}
  return null;
}
async function persistWorldName(name){
  const controller=v3();
  if(controller?.getWorld&&controller?.importState){
    try{
      const next=controller.getWorld();
      next.name=name;
      await controller.importState(next,{restoreActive:false});
      if(world()?.name===name)return true;
    }catch(e){console.warn('[Pearl Stability] direct world rename failed',e)}
  }
  for(let i=0;i<8;i++){
    const legacy=document.querySelector('#v3WorldName');
    if(legacy){legacy.value=name;legacy.dispatchEvent(new Event('input',{bubbles:true}));legacy.dispatchEvent(new Event('change',{bubbles:true}))}
    const save=document.querySelector('#v3SaveBtn');
    if(save)save.click();else v3()?.save?.();
    await sleep(100);
    if(world()?.name===name)return true;
  }
  return false;
}

let lastSig='',reconcileTimer=0,pollTimer=0,legacyStopped=false;
let experience=false,experienceRaf=0,progress=.04,target=.04;

function stopLegacyDirector(){
  if(legacyStopped)return;
  try{if(window.CasebookPearlDirector?.destroy){window.CasebookPearlDirector.destroy();legacyStopped=true}}catch(_){}
}

function installAuthoringRuntime(){
  const frame=document.querySelector('.stage iframe');
  if(!frame?.contentDocument||!frame.contentWindow)return false;
  if(frame.contentWindow.__PearlAuthoringHardeningInstalled)return true;
  const doc=frame.contentDocument;
  const sc=doc.createElement('script');
  sc.id='pearl-authoring-hardening-runtime';
  sc.textContent=String.raw`
(function(){
'use strict';
if(window.__PearlAuthoringHardeningInstalled)return;
window.__PearlAuthoringHardeningInstalled=true;
const S={mode:'author',minZ:92,maxZ:440,fitPadding:1.13,version:'3F.7'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function markHidden(el){if(!el||el.id==='pearlCameraHud')return;if(el.dataset.pearlLegacyHidden==='1')return;el.dataset.pearlLegacyHidden='1';el.dataset.pearlPrevDisplay=el.style.display||'';el.style.setProperty('display','none','important');}
function hideTopbarFrom(id){
  let n=document.getElementById(id);if(!n)return;
  for(let i=0;i<6&&n.parentElement;i++){
    n=n.parentElement;const r=n.getBoundingClientRect();
    if(r.width>innerWidth*.66&&r.height>24&&r.height<110){markHidden(n);break;}
  }
}
function hideLegacyChrome(){
  ['rail','inspector','avatars','bellBtn','kebabBtn','undoBtn','redoBtn','filtersBtn','timelineBtn','minimap'].forEach(id=>markHidden(document.getElementById(id)));
  document.querySelectorAll('.v2Modebar,.v2StoryRail,.v2Hud,.v2Overlay:not(.open)').forEach(markHidden);
  hideTopbarFrom('menuBtn');
  if(typeof __v2!=='undefined'&&Array.isArray(__v2.zones)){
    __v2.zones.forEach(z=>{try{if(z.__mesh)z.__mesh.visible=false}catch(_){}});
  }
  // Hide any legacy zone title mesh that may have been rebuilt after a chapter restore.
  if(typeof scene!=='undefined')scene.traverse(o=>{
    try{
      const n=String(o.name||'').toLowerCase();
      if(n.includes('zone')&&!o.userData?.fashionOwned)o.visible=false;
    }catch(_){ }
  });
}
function renderNow(){try{camera.updateProjectionMatrix();camera.updateMatrixWorld();renderer.render(scene,camera);rig.wake?.()}catch(_){}}
function cameraTarget(){const cx=(typeof __pcState!=='undefined'&&__pcState.center)?__pcState.center.x:0;return {x:cx,y:9,z:5};}
function setCamera(x,y,z,lx,ly,lz){
  rig.tx=x;rig.ty=y;rig.tz=z;
  camera.position.set(x,y,z);camera.lookAt(lx,ly,lz);renderNow();
}
function fitScene(){
  const t=cameraTarget();
  const aspect=Math.max(.6,camera.aspect||((canvasEl?.clientWidth||1)/(canvasEl?.clientHeight||1))||1);
  const vfov=Math.max(.2,(camera.fov||30)*Math.PI/180);
  // Curated Pearl composition envelope: includes couture hero, halo, spatial copy and lateral ribbons, excludes cyclorama itself.
  const compositionW=166,compositionH=116;
  const hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
  const dv=(compositionH*.5)/Math.tan(vfov/2),dh=(compositionW*.5)/Math.tan(hfov/2);
  const z=clamp(Math.max(dv,dh)*S.fitPadding+10,190,340);
  setCamera(t.x,8,z,t.x,9,5);
  return {x:t.x,y:8,z};
}
function zoomBy(delta){
  if(S.mode!=='author')return;
  const t=cameraTarget(),z=clamp((Number(rig.tz)||240)+delta,S.minZ,S.maxZ);
  setCamera(Number(rig.tx)||t.x,Number(rig.ty)||8,z,t.x,9,5);
}
function buildHud(){
  if(document.getElementById('pearlCameraHud'))return;
  const hud=document.createElement('div');hud.id='pearlCameraHud';
  hud.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;gap:6px;align-items:center;padding:6px;background:rgba(31,30,28,.76);border:1px solid rgba(255,255,255,.22);border-radius:999px;backdrop-filter:blur(12px);font:600 10px/1 Arial;color:#f6f3ed;letter-spacing:.08em';
  hud.innerHTML='<button data-pcam="fit">FIT SCENE</button><button data-pcam="out">−</button><button data-pcam="in">＋</button><span id="pearlZoomReadout">FREE CAMERA</span>';
  hud.querySelectorAll('button').forEach(b=>b.style.cssText='border:0;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 10px;cursor:pointer;font:700 9px Arial;letter-spacing:.08em');
  hud.addEventListener('click',e=>{const a=e.target.closest('[data-pcam]')?.dataset.pcam;if(a==='fit')fitScene();if(a==='out')zoomBy(32);if(a==='in')zoomBy(-32);});
  document.body.appendChild(hud);
}
function setMode(mode){
  S.mode=mode==='experience'?'experience':'author';
  hideLegacyChrome();buildHud();
  const hud=document.getElementById('pearlCameraHud');if(hud)hud.style.display=S.mode==='author'?'flex':'none';
  if(S.mode==='author')setTimeout(fitScene,0);
  return S.mode;
}
const baseApply=__fashionApi.apply.bind(__fashionApi);
const baseProgress=__fashionApi.setProgress.bind(__fashionApi);
__fashionApi.apply=function(){const r=baseApply();hideLegacyChrome();if(S.mode==='author')setTimeout(fitScene,0);return r;};
__fashionApi.refresh=__fashionApi.apply;
__fashionApi.setProgress=function(p){
  if(S.mode==='experience')return baseProgress(p);
  return {progress:Number(p)||0,authorCamera:true,camera:{x:rig.tx,y:rig.ty,z:rig.tz}};
};
__fashionApi.setAuthorMode=setMode;
__fashionApi.fitScene=fitScene;
__fashionApi.zoomOut=()=>zoomBy(32);
__fashionApi.zoomIn=()=>zoomBy(-32);
__fashionApi.getAuthorState=()=>({mode:S.mode,z:rig.tz,minZ:S.minZ,maxZ:S.maxZ,version:S.version});

document.addEventListener('wheel',e=>{
  if(S.mode!=='author'||e.target.closest?.('#pearlCameraHud'))return;
  e.preventDefault();e.stopImmediatePropagation();
  zoomBy(e.deltaY*.28);
},{capture:true,passive:false});
const mo=new MutationObserver(()=>hideLegacyChrome());
mo.observe(document.body,{childList:true,subtree:true});
hideLegacyChrome();buildHud();setTimeout(fitScene,30);
})();`;
  try{doc.documentElement.appendChild(sc);return !!frame.contentWindow.__PearlAuthoringHardeningInstalled}catch(e){console.warn('[Pearl Stability] authoring runtime install failed',e);return false}
}

function reconcile(reason='state-change',force=false){
  clearTimeout(reconcileTimer);
  reconcileTimer=setTimeout(()=>{
    installAuthoringRuntime();
    const a=sceneApi();if(!a)return;
    const sig=currentSignature();
    if(!force&&sig===lastSig)return;
    lastSig=sig;
    try{
      a.apply?.();
      if(!experience){a.setAuthorMode?.('author');a.fitScene?.();}
      window.dispatchEvent(new CustomEvent('casebook-pearl-reconciled',{detail:{reason,signature:sig,version:VERSION}}));
    }catch(e){console.error('[Pearl Stability] reconcile failed',e)}
  },110);
}

async function seedInitialPearl(){
  const w=world(),a=api();if(!w||!a)return false;
  const c=activeChapter(w);if(!c)return false;
  const liveCount=a.exportState?.()?.items?.length||0;
  const allEmpty=(w.chapters||[]).every(ch=>(ch.state?.items?.length||0)===0);
  const eligible=w.name==='Untitled Spatial World'&&allEmpty&&liveCount===0;
  const key=`casebook-v3-fashion-starter:${w.worldId}:${c.id}:pearl-v1`;
  if(!eligible||localStorage.getItem(key)==='ready')return false;
  const preset=document.querySelector('#preset'),load=document.querySelector('#loadPresetBtn');
  if(!preset||!load)return false;
  localStorage.setItem(key,'loading');
  preset.value='fashion';preset.dispatchEvent(new Event('change',{bubbles:true}));load.click();
  const loaded=await waitFor(()=>{const x=api(),n=x?.exportState?.()?.items?.length||0;return x&&n>=8?x:null},100,100);
  if(!loaded){localStorage.removeItem(key);return false}
  await sleep(220);
  await persistWorldName('AFTER DARK / FW26');
  v3()?.save?.();
  installAuthoringRuntime();
  loaded.fashion?.apply?.();loaded.fashion?.setAuthorMode?.('author');loaded.fashion?.fitScene?.();
  localStorage.setItem(key,'ready');lastSig='';reconcile('starter-ready',true);return true;
}

function experienceTick(){
  if(!experience){experienceRaf=0;return}
  progress+=(target-progress)*.075;
  try{sceneApi()?.setProgress?.(progress)}catch(_){}
  experienceRaf=requestAnimationFrame(experienceTick);
}
function enterExperience(){
  if(experience)return;experience=true;document.body.classList.add('pearl-experience');stopLegacyDirector();progress=.04;target=.04;
  installAuthoringRuntime();
  try{sceneApi()?.setAuthorMode?.('experience');sceneApi()?.apply?.();sceneApi()?.setProgress?.(progress)}catch(_){}
  if(!experienceRaf)experienceRaf=requestAnimationFrame(experienceTick);
}
function exitExperience(){
  if(!experience)return;experience=false;document.body.classList.remove('pearl-experience');if(experienceRaf)cancelAnimationFrame(experienceRaf);experienceRaf=0;
  try{sceneApi()?.setAuthorMode?.('author');sceneApi()?.fitScene?.()}catch(_){}
  reconcile('exit-experience',true);
}
function bindExperience(){
  document.addEventListener('click',e=>{if(e.target.closest?.('#esPreview'))setTimeout(enterExperience,0)},true);
  const stage=document.querySelector('.stage');
  if(stage&&!stage.dataset.pearlStableWheel){stage.dataset.pearlStableWheel='1';stage.addEventListener('wheel',e=>{if(experience)target=clamp(target+e.deltaY*.00055)},{passive:true})}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&experience)exitExperience()},true);
}
function startLifecycle(){
  stopLegacyDirector();bindExperience();
  waitFor(()=>document.querySelector('.stage iframe')?.contentDocument,60,100).then(()=>{installAuthoringRuntime();return seedInitialPearl()}).catch(e=>console.warn('[Pearl Stability] starter skipped',e)).finally(()=>reconcile('v3-ready',true));
  if(!pollTimer)pollTimer=setInterval(()=>{stopLegacyDirector();installAuthoringRuntime();if(currentSignature()!==lastSig)reconcile('revision')},220);
}
window.addEventListener('casebook-pro-v3-ready',startLifecycle,{once:false});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(stopLegacyDirector,0);setTimeout(()=>{if(v3())startLifecycle()},250)},{once:true});
else{setTimeout(stopLegacyDirector,0);setTimeout(()=>{if(v3())startLifecycle()},250)}
window.CasebookFashionStability={version:VERSION,reconcile:()=>reconcile('manual',true),enterExperience,exitExperience,persistWorldName,fitScene:()=>sceneApi()?.fitScene?.(),zoomOut:()=>sceneApi()?.zoomOut?.(),zoomIn:()=>sceneApi()?.zoomIn?.(),getState:()=>({version:VERSION,legacyDirectorStopped:legacyStopped,experience,lastSignature:lastSig,worldId:world()?.worldId||null,chapterId:world()?.activeChapterId||null,author:sceneApi()?.getAuthorState?.()||null})};
})();