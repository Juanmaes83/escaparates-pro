import * as THREE from "https://esm.sh/three@0.172.0";

const WORLD_LABEL={city:'THE GREY CITY',nature:'THE LIVING VALLEY'};
const WORLD_SUB={city:'URBAN / ARCHITECTURAL',nature:'LAND ART / PAVILION'};
const ROLE_META={
  city:{
    video:{title:'HERO MEDIA',placement:'Urban Media Wall · left architectural façade',format:'16:9 recommended · 1.91:1 / 21:9 supported',story:'Primary campaign motion. Large, luminous and discovered as the visitor turns.'},
    image:{title:'CAMPAIGN IMAGE',placement:'Luxury Campaign Billboard · right façade',format:'4:5 recommended · 3:4 / 2:3 supported',story:'Secondary editorial campaign moment, treated like luxury OOH rather than a monitor.'},
    logo:{title:'BRAND SIGNATURE',placement:'Architectural Brand Crown · above the portal',format:'Transparent PNG / SVG recommended',story:'A flagship-style signature: no visible card, no generic screen, no competing media frame.'},
    text:{title:'NARRATIVE',placement:'Spatial Typography · upper-right architectural zone',format:'2–4 headline lines + optional subheadline',story:'Large editorial copy integrated directly into the architecture.'}
  },
  nature:{
    video:{title:'HERO MEDIA',placement:'Landscape Cinema · left riverbank pavilion',format:'16:9 recommended · panoramic supported',story:'The same campaign becomes a cinematic installation embedded in landscape.'},
    image:{title:'CAMPAIGN IMAGE',placement:'Scenic Gallery Frame · right landscape pavilion',format:'4:5 recommended · 3:4 / 2:3 supported',story:'A garden-gallery intervention with stone and timber material language.'},
    logo:{title:'BRAND SIGNATURE',placement:'Brand Monolith · foreground right',format:'Transparent PNG / SVG recommended',story:'The identity becomes an engraved / inlaid environmental object rather than signage.'},
    text:{title:'NARRATIVE',placement:'Landscape Typography · foreground left',format:'Short editorial headline + optional subheadline',story:'A restrained land-art message discovered along the path.'}
  }
};

const project={city:makeState(),nature:makeState()};
let manager=null,slots=null,activeWorld='city',sameAssets=true;
const urls=new Set(),runningVideos=new Set();
function makeState(){return{draft:{video:null,image:null,logo:null,text:null},saved:null,applied:false};}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function waitEvent(target,name,timeout=10000){return new Promise((resolve,reject)=>{let timer;const done=e=>{clearTimeout(timer);target.removeEventListener(name,done);resolve(e);};target.addEventListener(name,done,{once:true});timer=setTimeout(()=>{target.removeEventListener(name,done);reject(new Error(`${name} timeout`));},timeout);});}
function addMesh(parent,geometry,material,pos=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rot);parent.add(m);return m;}
function pbr(color,rough=.75,metal=.05){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function screenMat(){return new THREE.MeshBasicMaterial({color:0x0b0d0f,transparent:true,opacity:1,toneMapped:false});}
function prepFade(group){group.traverse(o=>{if(!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.userData.brandBaseOpacity=m.opacity??1;m.transparent=true;});});}
function setAlpha(group,a){group.traverse(o=>{if(!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{const base=m.userData.brandBaseOpacity??1;m.opacity=base*a;m.needsUpdate=true;});});}
function createMediaFrame(holder,{position,rotation=[0,0,0],size=[10,5.6],frameColor=0x12171b,backColor=0x090b0d,lightColor=0xb9d8eb,lightIntensity=.25,frame=.32}){
  const g=new THREE.Group();g.position.set(...position);g.rotation.set(...rotation);holder.add(g);
  const [w,h]=size;
  addMesh(g,new THREE.BoxGeometry(w+frame*2,h+frame*2,.34),pbr(frameColor,.48,.28));
  addMesh(g,new THREE.BoxGeometry(w,h,.20),pbr(backColor,.7,.05),[0,0,.20]);
  const media=addMesh(g,new THREE.PlaneGeometry(w,h),screenMat(),[0,0,.32]);media.renderOrder=5;
  const light=new THREE.PointLight(lightColor,lightIntensity,15,2);light.position.set(0,0,2.5);g.add(light);
  g.visible=false;g.userData.media=media;g.userData.light=light;prepFade(g);return g;
}
function createCityLogo(holder){
  const g=new THREE.Group();g.position.set(0,8.75,1.7);holder.add(g);
  addMesh(g,new THREE.BoxGeometry(5.8,.08,.16),pbr(0x9ba3a8,.34,.68),[0,-1.02,-.06]);
  const media=addMesh(g,new THREE.PlaneGeometry(5.4,1.8),new THREE.MeshBasicMaterial({transparent:true,opacity:1,alphaTest:.01,toneMapped:false}),[0,0,.08]);media.renderOrder=7;
  g.visible=false;g.userData.media=media;prepFade(g);return g;
}
function createNatureLogo(holder){
  const g=new THREE.Group();g.position.set(6.25,-6.45,7.6);g.rotation.y=-.08;holder.add(g);
  addMesh(g,new THREE.BoxGeometry(3.9,2.55,.62),pbr(0x777867,.92,.02));
  addMesh(g,new THREE.BoxGeometry(3.55,2.2,.66),pbr(0x8c8b74,.97,.01),[0,0,.05]);
  const media=addMesh(g,new THREE.PlaneGeometry(2.85,1.35),new THREE.MeshBasicMaterial({transparent:true,opacity:1,alphaTest:.01,toneMapped:false}),[0,.05,.40]);media.renderOrder=7;
  g.visible=false;g.userData.media=media;prepFade(g);return g;
}
function createTextRole(holder,world){
  const g=new THREE.Group();
  if(world==='city'){g.position.set(7.3,6.0,1.85);g.rotation.y=-.045;}else{g.position.set(-6.4,-5.35,7.15);g.rotation.y=.045;}
  holder.add(g);
  const media=addMesh(g,new THREE.PlaneGeometry(world==='city'?7.2:6.8,world==='city'?3.9:3.4),new THREE.MeshBasicMaterial({transparent:true,opacity:1,alphaTest:.01,depthWrite:false,toneMapped:false}),[0,0,.05]);media.renderOrder=8;
  g.visible=false;g.userData.media=media;prepFade(g);return g;
}
function makeWorldSlots(world,worldObj){
  const holder=worldObj.holder;
  const legacy=worldObj.brandSlot?.parent;if(legacy)legacy.visible=false;
  let video,image,logo,text;
  if(world==='city'){
    video=createMediaFrame(holder,{position:[-10.8,1.55,1.75],rotation:[0,.105,0],size:[10.4,5.85],frameColor:0x161b1f,lightColor:0x94c9ea,lightIntensity:.38,frame:.24});
    image=createMediaFrame(holder,{position:[10.45,.65,1.72],rotation:[0,-.09,0],size:[4.55,5.7],frameColor:0x25292c,lightColor:0xd8e1e5,lightIntensity:.16,frame:.16});
    logo=createCityLogo(holder);text=createTextRole(holder,'city');
  }else{
    video=createMediaFrame(holder,{position:[-9.65,-.85,2.55],rotation:[0,.08,0],size:[8.7,4.9],frameColor:0x34362e,backColor:0x171a16,lightColor:0xffe0a6,lightIntensity:.24,frame:.34});
    addMesh(video,new THREE.BoxGeometry(9.55,.55,1.05),pbr(0x747563,.95,.01),[0,-2.77,-.18]);
    image=createMediaFrame(holder,{position:[9.45,.15,2.62],rotation:[0,-.105,0],size:[4.35,5.45],frameColor:0x655941,backColor:0x25241d,lightColor:0xffedc8,lightIntensity:.13,frame:.22});
    addMesh(image,new THREE.BoxGeometry(5.05,.44,.9),pbr(0x85816b,.95,.01),[0,-2.9,-.20]);
    logo=createNatureLogo(holder);text=createTextRole(holder,'nature');
  }
  return{video,image,logo,text};
}

function clearRole(role){
  const mesh=role.userData.media;if(!mesh)return;
  const map=mesh.material.map;
  if(map){if(map.userData?.video){map.userData.video.pause();runningVideos.delete(map.userData.video);}map.dispose?.();mesh.material.map=null;}
  mesh.material.color.setHex(0xffffff);mesh.material.needsUpdate=true;
}
function coverTexture(texture,sourceW,sourceH,targetW,targetH){
  const src=sourceW/sourceH,target=targetW/targetH;texture.repeat.set(1,1);texture.offset.set(0,0);
  if(src>target){const rx=target/src;texture.repeat.x=rx;texture.offset.x=(1-rx)/2;}else{const ry=src/target;texture.repeat.y=ry;texture.offset.y=(1-ry)/2;}
  texture.needsUpdate=true;
}
async function imageTexture(file){
  const url=URL.createObjectURL(file);urls.add(url);const img=new Image();img.decoding='async';img.src=url;
  try{await img.decode();}catch{await waitEvent(img,'load');}
  const tex=new THREE.Texture(img);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return{texture:tex,width:img.naturalWidth,height:img.naturalHeight,url};
}
async function videoTexture(file){
  const url=URL.createObjectURL(file);urls.add(url);const video=document.createElement('video');
  video.src=url;video.preload='auto';video.muted=true;video.loop=true;video.playsInline=true;video.autoplay=false;video.crossOrigin='anonymous';video.style.display='none';document.body.appendChild(video);
  video.load();if(video.readyState<1)await waitEvent(video,'loadedmetadata',12000);if(video.readyState<2)await waitEvent(video,'loadeddata',15000);
  let played=false;try{await video.play();played=true;}catch(e){video.remove();throw new Error('This browser could not start the selected video. Try MP4/H.264 or WebM.');}
  if(video.requestVideoFrameCallback){await Promise.race([new Promise(r=>video.requestVideoFrameCallback(()=>r())),sleep(1800)]);}else await sleep(120);
  if(!played||video.readyState<2){video.remove();throw new Error('Video first frame is not ready.');}
  const tex=new THREE.VideoTexture(video);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.userData.video=video;runningVideos.add(video);
  return{texture:tex,width:video.videoWidth||16,height:video.videoHeight||9,duration:video.duration||0,url,video};
}
function wrapLines(ctx,text,maxWidth,maxLines=4){const words=(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines-1)break;}else line=test;}if(line&&lines.length<maxLines)lines.push(line);return lines;}
function textTexture(world,headline,subheadline){
  const c=document.createElement('canvas');c.width=1800;c.height=1000;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.textBaseline='top';x.shadowColor='rgba(0,0,0,.18)';x.shadowBlur=10;
  if(world==='city'){x.fillStyle='#f4f5f2';x.font='800 170px Arial,Helvetica,sans-serif';const lines=wrapLines(x,(headline||'YOUR MESSAGE').toUpperCase(),1500,4);lines.forEach((l,i)=>x.fillText(l,90,80+i*175));x.shadowBlur=0;x.fillStyle='rgba(244,245,242,.72)';x.font='600 48px Arial,Helvetica,sans-serif';x.fillText(subheadline||'',94,820);}else{x.fillStyle='#f7f1df';x.font='700 155px Georgia,Times New Roman,serif';const lines=wrapLines(x,headline||'Your message',1500,3);lines.forEach((l,i)=>x.fillText(l,92,100+i*180));x.shadowBlur=0;x.fillStyle='rgba(247,241,223,.74)';x.font='500 46px Arial,Helvetica,sans-serif';x.fillText(subheadline||'',96,760);}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
async function applyRole(world,type,item){
  const role=slots[world][type],mesh=role.userData.media;clearRole(role);
  if(type==='text'){mesh.material.map=textTexture(world,item.headline,item.subheadline);mesh.material.color.setHex(0xffffff);mesh.material.needsUpdate=true;role.visible=true;setAlpha(role,.96);return;}
  if(type==='video'){
    const loaded=await videoTexture(item.file);mesh.material.map=loaded.texture;mesh.material.color.setHex(0xffffff);mesh.material.needsUpdate=true;
    const size=world==='city'?[10.4,5.85]:[8.7,4.9];coverTexture(loaded.texture,loaded.width,loaded.height,...size);item.meta=`${loaded.width}×${loaded.height} · ${formatDuration(loaded.duration)} · READY`;
  }else{
    const loaded=await imageTexture(item.file);mesh.material.map=loaded.texture;mesh.material.color.setHex(0xffffff);mesh.material.needsUpdate=true;
    if(type==='image'){const size=world==='city'?[4.55,5.7]:[4.35,5.45];coverTexture(loaded.texture,loaded.width,loaded.height,...size);}else{
      loaded.texture.repeat.set(1,1);loaded.texture.offset.set(0,0);const aspect=loaded.width/loaded.height,maxW=world==='city'?5.4:2.85,maxH=world==='city'?1.8:1.35;let w=maxW,h=w/aspect;if(h>maxH){h=maxH;w=h*aspect;}mesh.scale.set(w/maxW,h/maxH,1);
    }
    item.meta=`${loaded.width}×${loaded.height} · READY`;
  }
  role.visible=true;setAlpha(role,type==='logo'?.96:.20);
}
function formatDuration(v){if(!Number.isFinite(v))return'--:--';const m=Math.floor(v/60),s=Math.round(v%60).toString().padStart(2,'0');return`${m}:${s}`;}

function updateReveal(){
  if(!manager||!slots){requestAnimationFrame(updateReveal);return;}
  for(const world of['city','nature']){
    const camera=manager.worlds[world].camera,forward=new THREE.Vector3();camera.getWorldDirection(forward);
    for(const type of['video','image']){
      const role=slots[world][type];if(!role.visible)continue;const wp=new THREE.Vector3();role.getWorldPosition(wp);const dir=wp.sub(camera.position).normalize(),dot=forward.dot(dir),threshold=type==='video'?.982:.986;const focus=THREE.MathUtils.smoothstep(dot,threshold,.999);setAlpha(role,.14+.86*focus);
    }
    if(slots[world].logo.visible)setAlpha(slots[world].logo,.96);
    if(slots[world].text.visible)setAlpha(slots[world].text,.92);
  }
  requestAnimationFrame(updateReveal);
}

function cloneDraft(source,target){project[target].draft={...project[source].draft};project[target].saved=null;project[target].applied=false;refreshUI();}
function stageFile(world,type,file){if(!file)return;const old=project[world].draft[type];if(old?.previewUrl)URL.revokeObjectURL(old.previewUrl);const previewUrl=URL.createObjectURL(file);urls.add(previewUrl);project[world].draft[type]={type,file,name:file.name,previewUrl,state:'LOADED',meta:'Inspecting…'};project[world].saved=null;project[world].applied=false;inspectDraft(world,type,project[world].draft[type]);if(sameAssets){const other=world==='city'?'nature':'city';project[other].draft[type]={...project[world].draft[type]};project[other].saved=null;project[other].applied=false;}refreshUI();}
async function inspectDraft(world,type,item){try{if(type==='video'){const v=document.createElement('video');v.preload='metadata';v.src=item.previewUrl;await waitEvent(v,'loadedmetadata',8000);item.meta=`${v.videoWidth||'?'}×${v.videoHeight||'?'} · ${formatDuration(v.duration)} · LOADED`;}else{const i=new Image();i.src=item.previewUrl;try{await i.decode();}catch{await waitEvent(i,'load',8000);}item.meta=`${i.naturalWidth}×${i.naturalHeight} · LOADED`;}refreshUI();}catch{item.meta='LOADED · metadata unavailable';refreshUI();}}
function stageText(world){const h=document.getElementById(`${world}Headline`)?.value.trim()||'',s=document.getElementById(`${world}Subheadline`)?.value.trim()||'';if(!h&&!s){setGlobal('error','ADD YOUR MESSAGE','Write a headline or subheadline first.');return;}project[world].draft.text={type:'text',headline:h,subheadline:s,name:h||s,state:'LOADED',meta:'Spatial typography · LOADED'};project[world].saved=null;project[world].applied=false;if(sameAssets){const other=world==='city'?'nature':'city';project[other].draft.text={...project[world].draft.text};project[other].saved=null;project[other].applied=false;}refreshUI();}
function saveWorld(world){const draft=project[world].draft;if(!Object.values(draft).some(Boolean)){setGlobal('error','NOTHING TO SAVE',`Load at least one asset for ${WORLD_LABEL[world]}.`);return;}project[world].saved={...draft};Object.values(draft).forEach(a=>{if(a)a.state='SAVED';});project[world].applied=false;setGlobal('saved',`${WORLD_LABEL[world]} SAVED`,sameAssets?'The same brand assets are ready to be expressed differently in both worlds.':'You can continue with the other world or apply the experience.');refreshUI();}
async function applyExperience(){const button=document.getElementById('applyExperience');button.disabled=true;button.textContent='VALIDATING MEDIA…';try{
  for(const world of['city','nature']){const saved=project[world].saved;if(!saved)continue;for(const type of['video','image','logo','text'])if(saved[type]){button.textContent=`APPLYING ${WORLD_LABEL[world]} · ${ROLE_META[world][type].title}…`;await applyRole(world,type,saved[type]);saved[type].state='APPLIED';}project[world].applied=true;}
  setGlobal('applied','EXPERIENCE READY','Media is decoded, video first frames are ready, and each asset has been translated into its world-specific expression.');button.textContent='APPLIED ✓';document.getElementById('startExperience').disabled=false;refreshUI();
 }catch(err){console.error('[Brand Expression V1.2]',err);setGlobal('error','MEDIA VALIDATION FAILED',err?.message||'An asset could not be prepared.');button.textContent='APPLY EXPERIENCE';button.disabled=false;}}
function resetExpression(){for(const world of['city','nature']){project[world]=makeState();if(slots)for(const type of['video','image','logo','text']){clearRole(slots[world][type]);slots[world][type].visible=false;}}setGlobal('idle','READY TO CREATE','One brand can now become two different spatial expressions.');document.getElementById('startExperience')?.setAttribute('disabled','disabled');refreshUI();}

function previewHTML(world,type,item){if(!item)return`<div class="asset-empty">NO ASSET</div>`;if(type==='video')return`<div class="asset-preview media-preview"><video src="${item.previewUrl}" muted playsinline preload="metadata"></video><span>VIDEO</span></div>`;if(type==='image'||type==='logo')return`<div class="asset-preview media-preview ${type}"><img src="${item.previewUrl}" alt=""/><span>${type.toUpperCase()}</span></div>`;return`<div class="asset-preview copy-preview ${world}"><b>${escapeHTML(item.headline||'')}</b><span>${escapeHTML(item.subheadline||'')}</span></div>`;}
function escapeHTML(v){return(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function roleCard(world,type){const item=project[world].draft[type],m=ROLE_META[world][type],state=item?.state||'EMPTY';return`<article class="expression-card" data-role="${type}">
  <div class="expression-card-head"><div><small>${m.title}</small><h5>${type==='video'?'VIDEO':type==='image'?'IMAGE':type==='logo'?'LOGO':'TEXT'}</h5></div><span class="state-pill" data-state="${state.toLowerCase()}">${state}</span></div>
  ${previewHTML(world,type,item)}
  <div class="expression-meta"><p><b>PLACEMENT</b>${m.placement}</p><p><b>FORMAT</b>${m.format}</p><p><b>ROLE</b>${m.story}</p></div>
  ${type==='text'?`<input id="${world}Headline" class="premium-input" maxlength="64" placeholder="Headline" value="${escapeHTML(item?.headline||'')}"/><input id="${world}Subheadline" class="premium-input" maxlength="90" placeholder="Subheadline" value="${escapeHTML(item?.subheadline||'')}"/><button class="asset-button" data-load-text="${world}">LOAD TEXT</button>`:`<label class="asset-button file-button">${item?'REPLACE':'LOAD'} ${type.toUpperCase()}<input data-file="${world}-${type}" type="file" accept="${type==='video'?'video/*':'image/*'+(type==='logo'?',.svg':'')}"/></label>`}
  <div class="asset-detail">${escapeHTML(item?.name||'')}${item?.meta?`<span>${escapeHTML(item.meta)}</span>`:''}</div>
</article>`;}
function renderActiveWorld(){const host=document.getElementById('expressionWorldHost');if(!host)return;const w=activeWorld;host.innerHTML=`<div class="world-expression-head"><div><small>WORLD ${w==='city'?'01':'02'}</small><h4>${WORLD_LABEL[w]}</h4><p>${WORLD_SUB[w]}</p></div><span class="world-save-state" data-state="${project[w].applied?'applied':project[w].saved?'saved':'draft'}">${project[w].applied?'APPLIED':project[w].saved?'SAVED':'DRAFT'}</span></div>${['video','image','logo','text'].map(t=>roleCard(w,t)).join('')}<button class="save-expression" data-save-world="${w}">SAVE ${WORLD_LABEL[w]}</button>`;
  host.querySelectorAll('[data-file]').forEach(input=>input.addEventListener('change',e=>{const [world,type]=input.dataset.file.split('-');stageFile(world,type,e.target.files?.[0]);}));host.querySelectorAll('[data-load-text]').forEach(b=>b.onclick=()=>stageText(b.dataset.loadText));host.querySelector('[data-save-world]')?.addEventListener('click',()=>saveWorld(w));
}
function refreshUI(){renderActiveWorld();document.querySelectorAll('.world-tab').forEach(b=>b.classList.toggle('active',b.dataset.world===activeWorld));const apply=document.getElementById('applyExperience');if(apply&&!project.city.applied&&!project.nature.applied){apply.disabled=!(project.city.saved||project.nature.saved);apply.textContent='APPLY EXPERIENCE';}const same=document.getElementById('sameBrandAssets');if(same)same.checked=sameAssets;}
function setGlobal(state,title,detail){const box=document.getElementById('expressionGlobal');if(!box)return;box.dataset.state=state;box.querySelector('strong').textContent=title;box.querySelector('p').textContent=detail;}
function minimizePanel(){const panel=document.getElementById('customizePanel');panel.classList.remove('open');panel.classList.add('brand-minimized');document.getElementById('editExperience')?.classList.add('show');}
function restorePanel(){const panel=document.getElementById('customizePanel');panel.classList.remove('brand-minimized');panel.classList.add('open');document.getElementById('editExperience')?.classList.remove('show');}

function injectUI(){
  const panel=document.getElementById('customizePanel');if(!panel)return;const section=[...panel.querySelectorAll('section')].find(s=>s.querySelector('h3')?.textContent.trim()==='Brand expression');if(!section)return;
  section.innerHTML=`<h3>Brand expression</h3><p class="expression-intro">One brand. Two worlds. Each asset changes language instead of becoming another floating screen.</p><label class="same-assets"><input id="sameBrandAssets" type="checkbox" checked/><span><b>USE THE SAME BRAND ASSETS IN BOTH WORLDS</b><small>City translates them into flagship / OOH language. Nature translates them into pavilion / land-art language.</small></span></label><div id="expressionGlobal" class="expression-global" data-state="idle"><strong>READY TO CREATE</strong><p>Choose a world, load the campaign, save it, then apply the complete experience.</p></div><div class="world-tabs"><button class="world-tab active" data-world="city"><small>01</small>CITY</button><button class="world-tab" data-world="nature"><small>02</small>NATURE</button></div><div id="expressionWorldHost"></div><div class="expression-actions"><button id="applyExperience" disabled>APPLY EXPERIENCE</button><button id="startExperience" disabled>START EXPERIENCE</button></div>`;
  const close=document.getElementById('closePanel'),min=document.createElement('button');min.id='minimizeExpression';min.className='panel-minimize';min.type='button';min.textContent='−';min.title='Minimize';close?.before(min);
  const edit=document.createElement('button');edit.id='editExperience';edit.type='button';edit.innerHTML='<span></span>EDIT EXPERIENCE';document.body.appendChild(edit);
  section.querySelectorAll('.world-tab').forEach(b=>b.onclick=()=>{activeWorld=b.dataset.world;refreshUI();});
  document.getElementById('sameBrandAssets').onchange=e=>{sameAssets=e.target.checked;if(sameAssets)cloneDraft(activeWorld,activeWorld==='city'?'nature':'city');};
  document.getElementById('applyExperience').onclick=applyExperience;document.getElementById('startExperience').onclick=minimizePanel;min.onclick=minimizePanel;edit.onclick=restorePanel;
  document.getElementById('customizeToggle')?.addEventListener('click',()=>{panel.classList.remove('brand-minimized');edit.classList.remove('show');});close?.addEventListener('click',()=>edit.classList.remove('show'));
  document.getElementById('resetAll')?.addEventListener('click',()=>setTimeout(resetExpression,0));refreshUI();
}
function injectStyles(){const s=document.createElement('style');s.textContent=`
.expression-intro{font:600 9px/1.55 Inter,sans-serif;color:rgba(255,255,255,.5);margin:0 0 12px}.same-assets{display:flex!important;gap:9px!important;padding:11px!important;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.035)}.same-assets input{margin:2px 0 0!important}.same-assets span{display:block}.same-assets b{display:block;color:#fff;font:800 8px/1.3 Inter;letter-spacing:.09em}.same-assets small{display:block;margin-top:4px;color:rgba(255,255,255,.45);font:600 8px/1.4 Inter}.expression-global{padding:11px 12px;margin:10px 0;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#0d1217}.expression-global strong{display:block;font:800 8px Inter;letter-spacing:.12em}.expression-global p{margin:5px 0 0!important;font:600 8px/1.45 Inter!important;color:rgba(255,255,255,.48)!important}.expression-global[data-state=saved]{border-color:rgba(112,179,229,.35)}.expression-global[data-state=applied]{border-color:rgba(118,215,149,.4);background:rgba(81,157,105,.08)}.expression-global[data-state=error]{border-color:rgba(238,106,99,.42)}
.world-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}.world-tab{height:38px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#11171c;color:rgba(255,255,255,.5);font:800 9px Inter;letter-spacing:.1em;cursor:pointer}.world-tab small{margin-right:7px;opacity:.45}.world-tab.active{background:#eef3ef;color:#09110d;border-color:#eef3ef}.world-expression-head{display:flex;justify-content:space-between;gap:10px;align-items:start;margin:13px 0 8px}.world-expression-head small{font:700 7px Inter;letter-spacing:.16em;opacity:.4}.world-expression-head h4{font:800 16px Inter;margin:3px 0}.world-expression-head p{font:700 7px Inter;letter-spacing:.11em;color:rgba(255,255,255,.42);margin:0}.world-save-state{font:800 7px Inter;letter-spacing:.1em;padding:6px 7px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:rgba(255,255,255,.48)}.world-save-state[data-state=saved]{color:#9fcff4;border-color:rgba(112,179,229,.35)}.world-save-state[data-state=applied]{color:#9fe2af;border-color:rgba(118,215,149,.4)}
.expression-card{border:1px solid rgba(255,255,255,.085);border-radius:12px;background:rgba(255,255,255,.025);padding:10px;margin:8px 0}.expression-card-head{display:flex;justify-content:space-between;align-items:start}.expression-card-head small{display:block;font:800 7px Inter;letter-spacing:.13em;color:rgba(255,255,255,.42)}.expression-card-head h5{font:800 11px Inter;margin:3px 0 0}.state-pill{font:800 7px Inter;letter-spacing:.09em;padding:4px 6px;border:1px solid rgba(255,255,255,.1);border-radius:999px;color:rgba(255,255,255,.42)}.state-pill[data-state=loaded]{color:#eac56f}.state-pill[data-state=saved]{color:#9fcff4}.state-pill[data-state=applied]{color:#9fe2af}.asset-empty,.asset-preview{height:92px;margin:9px 0;border-radius:8px;overflow:hidden;background:#090d10;border:1px solid rgba(255,255,255,.07)}.asset-empty{display:grid;place-items:center;font:800 7px Inter;letter-spacing:.13em;color:rgba(255,255,255,.22)}.media-preview{position:relative}.media-preview img,.media-preview video{width:100%;height:100%;display:block;object-fit:cover}.media-preview.logo img{object-fit:contain;padding:12px;background:linear-gradient(135deg,#22292e,#0e1215)}.media-preview>span{position:absolute;left:7px;bottom:7px;padding:4px 6px;background:rgba(0,0,0,.55);border-radius:999px;font:800 6px Inter;letter-spacing:.12em;color:#fff}.copy-preview{padding:12px;display:flex;flex-direction:column;justify-content:center}.copy-preview b{font:800 17px/1.03 Arial,sans-serif;text-transform:uppercase}.copy-preview.nature b{font:700 18px/1.05 Georgia,serif;text-transform:none;color:#f7f1df}.copy-preview span{font:600 8px Inter;margin-top:7px;color:rgba(255,255,255,.5)}
.expression-meta{padding:8px 0}.expression-meta p{display:grid;grid-template-columns:58px 1fr;gap:6px;margin:4px 0!important;font:600 7px/1.4 Inter!important;color:rgba(255,255,255,.44)!important}.expression-meta b{font:800 6px Inter;letter-spacing:.1em;color:rgba(255,255,255,.72)}.asset-button,.save-expression{display:flex!important;align-items:center;justify-content:center;width:100%;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#151b20;color:#fff;font:800 7px Inter;letter-spacing:.1em;cursor:pointer}.file-button input{display:none!important}.premium-input{width:100%;margin:5px 0 0!important}.asset-detail{min-height:14px;margin-top:6px;font:700 7px/1.35 Inter;color:rgba(255,255,255,.55);word-break:break-all}.asset-detail span{display:block;color:rgba(255,255,255,.33);margin-top:2px}.save-expression{height:38px;margin-top:10px;background:#e8efeb;color:#07100b;border-color:#e8efeb}.expression-actions{position:sticky;bottom:-30px;z-index:3;display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:13px 0 5px;background:linear-gradient(180deg,transparent,rgba(8,11,14,.98) 25%)}.expression-actions button{height:40px;border-radius:9px;border:1px solid rgba(255,255,255,.14);font:800 8px Inter;letter-spacing:.1em;cursor:pointer}.expression-actions button:first-child{background:#e5ece8;color:#07100b}.expression-actions button:last-child{background:#8bd8a1;color:#07100b}.expression-actions button:disabled{opacity:.32;cursor:not-allowed}
.panel-minimize{border:0!important;background:none!important;color:#fff!important;font-size:22px!important;line-height:1!important;opacity:.6!important;cursor:pointer!important;padding:0 8px!important;margin-left:auto!important}.panel.brand-minimized{transform:translateX(102%)!important}#editExperience{position:fixed;z-index:13;right:22px;bottom:22px;display:none;align-items:center;gap:8px;padding:11px 14px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,11,14,.8);backdrop-filter:blur(18px);color:#fff;font:800 9px Inter;letter-spacing:.1em;cursor:pointer;box-shadow:0 14px 40px rgba(0,0,0,.3)}#editExperience.show{display:flex}#editExperience span{width:7px;height:7px;border-radius:50%;background:#8cdda1;box-shadow:0 0 12px rgba(140,221,161,.65)}
`;document.head.appendChild(s);}

function boot(m){if(manager)return;manager=m;injectStyles();slots={city:makeWorldSlots('city',m.worlds.city),nature:makeWorldSlots('nature',m.worlds.nature)};injectUI();requestAnimationFrame(updateReveal);}
window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__)boot(window.__IW_BRAND_MANAGER__);
