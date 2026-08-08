// CASEBOOK PRO V3 — PEARL FASHION STABILITY PASS
// Phase 3F.6. Additive lifecycle fix for the isolated Fashion Pearl branch only.
(function(){
'use strict';
const VERSION='3F.6-pearl-stability';
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

let lastSig='',reconcileTimer=0,pollTimer=0,legacyStopped=false;
let experience=false,experienceRaf=0,progress=.04,target=.04;

function stopLegacyDirector(){
  if(legacyStopped)return;
  try{
    if(window.CasebookPearlDirector?.destroy){
      window.CasebookPearlDirector.destroy();
      legacyStopped=true;
    }
  }catch(_){}
}
function reconcile(reason='state-change',force=false){
  clearTimeout(reconcileTimer);
  reconcileTimer=setTimeout(()=>{
    const a=sceneApi();if(!a)return;
    const sig=currentSignature();
    if(!force&&sig===lastSig)return;
    lastSig=sig;
    try{
      a.apply?.();
      if(!experience)a.setProgress?.(.04);
      window.dispatchEvent(new CustomEvent('casebook-pearl-reconciled',{detail:{reason,signature:sig,version:VERSION}}));
    }catch(e){console.error('[Pearl Stability] reconcile failed',e)}
  },90);
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
  preset.value='fashion';
  preset.dispatchEvent(new Event('change',{bubbles:true}));
  load.click();
  const loaded=await waitFor(()=>{
    const x=api(),n=x?.exportState?.()?.items?.length||0;
    return x&&n>=8?x:null;
  },100,100);
  if(!loaded){localStorage.removeItem(key);return false}
  const input=document.querySelector('#v3WorldName');
  if(input){
    input.value='AFTER DARK / FW26';
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  v3()?.save?.();
  loaded.fashion?.apply?.();
  loaded.fashion?.setProgress?.(.04);
  await sleep(140);
  v3()?.save?.();
  localStorage.setItem(key,'ready');
  lastSig='';
  reconcile('starter-ready',true);
  return true;
}

function experienceTick(){
  if(!experience){experienceRaf=0;return}
  progress+=(target-progress)*.075;
  try{sceneApi()?.setProgress?.(progress)}catch(_){}
  experienceRaf=requestAnimationFrame(experienceTick);
}
function enterExperience(){
  if(experience)return;
  experience=true;
  document.body.classList.add('pearl-experience');
  stopLegacyDirector();
  progress=.04;target=.04;
  try{sceneApi()?.apply?.();sceneApi()?.setProgress?.(progress)}catch(_){}
  if(!experienceRaf)experienceRaf=requestAnimationFrame(experienceTick);
}
function exitExperience(){
  if(!experience)return;
  experience=false;
  document.body.classList.remove('pearl-experience');
  if(experienceRaf)cancelAnimationFrame(experienceRaf);
  experienceRaf=0;
  reconcile('exit-experience',true);
}

function bindExperience(){
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#esPreview'))setTimeout(enterExperience,0);
  },true);
  const stage=document.querySelector('.stage');
  if(stage&&!stage.dataset.pearlStableWheel){
    stage.dataset.pearlStableWheel='1';
    stage.addEventListener('wheel',e=>{
      if(!experience)return;
      target=clamp(target+e.deltaY*.00055);
    },{passive:true});
  }
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&experience)exitExperience()},true);
}

function startLifecycle(){
  stopLegacyDirector();
  bindExperience();
  seedInitialPearl().catch(e=>console.warn('[Pearl Stability] starter skipped',e)).finally(()=>{
    reconcile('v3-ready',true);
  });
  if(!pollTimer){
    pollTimer=setInterval(()=>{
      stopLegacyDirector();
      if(currentSignature()!==lastSig)reconcile('revision');
    },180);
  }
}

window.addEventListener('casebook-pro-v3-ready',startLifecycle,{once:false});
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(stopLegacyDirector,0);
    setTimeout(()=>{if(v3())startLifecycle()},250);
  },{once:true});
}else{
  setTimeout(stopLegacyDirector,0);
  setTimeout(()=>{if(v3())startLifecycle()},250);
}

window.CasebookFashionStability={
  version:VERSION,
  reconcile:()=>reconcile('manual',true),
  enterExperience,
  exitExperience,
  getState:()=>({version:VERSION,legacyDirectorStopped:legacyStopped,experience,lastSignature:lastSig,worldId:world()?.worldId||null,chapterId:world()?.activeChapterId||null})
};
})();