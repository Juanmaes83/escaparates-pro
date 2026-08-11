import * as THREE from "https://esm.sh/three@0.172.0";

const WORLD_LABEL={city:'THE GREY CITY',nature:'THE LIVING VALLEY'};
const PLACEMENT={
  city:{
    video:'Main Urban Media Wall — left side of the portal',
    image:'Campaign Billboard — right side of the portal',
    logo:'Building Brand Sign — upper-left architectural zone',
    text:'Spatial Headline — upper-right architectural zone'
  },
  nature:{
    video:'Landscape Media Installation — left side of the portal',
    image:'Scenic Campaign Frame — right side of the portal',
    logo:'Environmental Brand Marker — upper-left landscape zone',
    text:'Landscape Headline — upper-right landscape zone'
  }
};

const project={
  city:{draft:{image:null,video:null,logo:null,text:null},saved:null,applied:false},
  nature:{draft:{image:null,video:null,logo:null,text:null},saved:null,applied:false}
};
const mediaUrls=[];
let manager=null;
let slots=null;

function canvasTexture(title,subtitle,accent='#dbe9e0',transparent=false){
  const c=document.createElement('canvas');c.width=1400;c.height=800;const x=c.getContext('2d');
  if(!transparent){x.fillStyle='#0c1116';x.fillRect(0,0,c.width,c.height);}else{x.clearRect(0,0,c.width,c.height);}
  x.fillStyle=accent;x.fillRect(70,78,8,640);
  x.fillStyle='#fff';x.font='800 88px Inter,Arial';x.textBaseline='top';wrap(x,title||'YOUR STORY',120,145,1160,98);
  x.fillStyle='rgba(255,255,255,.72)';x.font='600 34px Inter,Arial';wrap(x,subtitle||'',120,545,1110,46);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return tex;
}
function wrap(ctx,text,x,y,maxWidth,lineHeight){const words=(text||'').split(' ');let line='';for(let i=0;i<words.length;i++){const test=line+words[i]+' ';if(ctx.measureText(test).width>maxWidth&&i>0){ctx.fillText(line,x,y);line=words[i]+' ';y+=lineHeight;}else line=test;}ctx.fillText(line,x,y);}
function frame(parent,w,h,position,rotation,frameColor){
  const g=new THREE.Group();g.position.set(...position);g.rotation.set(...rotation);parent.add(g);
  const back=new THREE.Mesh(new THREE.BoxGeometry(w+.42,h+.42,.22),new THREE.MeshStandardMaterial({color:frameColor,roughness:.7,metalness:.16}));g.add(back);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0x11161b}));screen.position.z=.13;g.add(screen);return{group:g,screen,base:[w,h]};
}
function makeWorldSlots(worldName,world){
  const holder=world.holder;
  if(world.brandSlot?.parent)world.brandSlot.parent.visible=false;
  const isCity=worldName==='city',fc=isCity?0x202a31:0x6f6348;
  const s={};
  s.video=frame(holder,8.4,4.7,[-13,2.3,5.3],[0,.16,0],fc);
  s.image=frame(holder,6.6,4.6,[13,1.7,5.5],[0,-.16,0],fc);
  s.logo=frame(holder,4.4,2.05,[-8.8,9.0,3.9],[0,.10,0],fc);
  s.text=frame(holder,6.4,2.8,[8.5,9.0,3.9],[0,-.10,0],fc);
  if(!isCity){
    s.video.group.position.set(-12.6,.2,5.0);s.image.group.position.set(12.8,1.4,5.1);s.logo.group.position.set(-7.7,8.2,4.1);s.text.group.position.set(7.5,8.1,4.1);
    const postMat=new THREE.MeshStandardMaterial({color:0x735b3d,roughness:.95});
    [s.video,s.image].forEach(slot=>{for(const x of[-slot.base[0]*.38,slot.base[0]*.38]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,4.6,8),postMat);p.position.set(x,-slot.base[1]/2-2.2,-.1);slot.group.add(p);}});
  }
  Object.entries(s).forEach(([type,slot])=>{slot.screen.material.map=canvasTexture(type.toUpperCase(),PLACEMENT[worldName][type],isCity?'#9fb6c8':'#b9df9f');slot.screen.material.needsUpdate=true;});
  return s;
}
function clearSlot(slot){const m=slot.screen.material;if(m.map){m.map.dispose?.();m.map=null;}m.color.setHex(0xffffff);m.needsUpdate=true;slot.screen.scale.set(1,1,1);}
function fit(slot,ratio){const [w,h]=slot.base;const boxRatio=w/h;if(ratio>boxRatio)slot.screen.scale.set(1,boxRatio/ratio,1);else slot.screen.scale.set(ratio/boxRatio,1,1);}
async function imageTexture(file){const url=URL.createObjectURL(file);mediaUrls.push(url);const img=new Image();img.src=url;await img.decode();const tex=new THREE.Texture(img);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return{tex,ratio:img.naturalWidth/img.naturalHeight};}
function videoTexture(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);mediaUrls.push(url);const v=document.createElement('video');v.src=url;v.loop=true;v.muted=true;v.playsInline=true;v.preload='auto';v.addEventListener('loadedmetadata',()=>{const tex=new THREE.VideoTexture(v);tex.colorSpace=THREE.SRGBColorSpace;v.play().catch(()=>{});resolve({tex,ratio:(v.videoWidth||16)/(v.videoHeight||9),video:v});},{once:true});v.addEventListener('error',()=>reject(new Error('Video format could not be decoded by this browser.')),{once:true});v.load();});}
async function applyAsset(worldName,type,value){const slot=slots[worldName][type];clearSlot(slot);if(type==='text'){slot.screen.material.map=canvasTexture(value.headline,value.subheadline,worldName==='city'?'#acc7d7':'#c6e9a9');slot.screen.material.needsUpdate=true;return;}
  const prepared=type==='video'?await videoTexture(value.file):await imageTexture(value.file);slot.screen.material.map=prepared.tex;slot.screen.material.needsUpdate=true;fit(slot,prepared.ratio);
}

function statusLabel(asset){if(!asset)return'EMPTY';return asset.state||'LOADED';}
function updateCard(worldName){const w=project[worldName];for(const type of['image','video','logo','text']){const pill=document.querySelector(`[data-status="${worldName}-${type}"]`);if(pill){const a=w.draft[type];pill.textContent=statusLabel(a);pill.dataset.state=(a?.state||'empty').toLowerCase();}}
  const summary=document.getElementById(`${worldName}Summary`);if(summary){if(w.applied)summary.textContent='APPLIED TO EXPERIENCE';else if(w.saved)summary.textContent='WORLD SAVED';else summary.textContent='NOT SAVED';summary.dataset.state=w.applied?'applied':w.saved?'saved':'empty';}
}
function stageFile(world,type,file){if(!file)return;project[world].draft[type]={type,file,name:file.name,state:'LOADED'};project[world].saved=null;project[world].applied=false;updateCard(world);}
function stageText(world){const h=document.getElementById(`${world}Headline`).value.trim(),s=document.getElementById(`${world}Subheadline`).value.trim();if(!h&&!s){setGlobal('error','WRITE SOME TEXT','Add a headline or subheadline first.');return;}project[world].draft.text={type:'text',headline:h,subheadline:s,name:h||s,state:'LOADED'};project[world].saved=null;project[world].applied=false;updateCard(world);}
function saveWorld(world){const draft=project[world].draft;const has=Object.values(draft).some(Boolean);if(!has){setGlobal('error',`${WORLD_LABEL[world]} HAS NO CONTENT`,'Load at least one asset or text before saving.');return;}project[world].saved={...draft};Object.values(project[world].draft).forEach(a=>{if(a)a.state='SAVED';});project[world].applied=false;updateCard(world);setGlobal('saved',`${WORLD_LABEL[world]} SAVED`,'Ready to apply. You can continue customizing the other world or apply the experience now.');updateApplyAvailability();}
function updateApplyAvailability(){document.getElementById('applyExperience').disabled=!(project.city.saved||project.nature.saved);}
function setGlobal(state,title,detail){const box=document.getElementById('authoringGlobalStatus');if(!box)return;box.dataset.state=state;box.querySelector('strong').textContent=title;box.querySelector('p').textContent=detail;}
async function applyExperience(){const btn=document.getElementById('applyExperience');btn.disabled=true;btn.textContent='APPLYING…';try{for(const world of['city','nature']){const saved=project[world].saved;if(!saved)continue;for(const type of['image','video','logo','text'])if(saved[type])await applyAsset(world,type,saved[type]);Object.values(project[world].draft).forEach(a=>{if(a)a.state='APPLIED';});project[world].applied=true;updateCard(world);}setGlobal('applied','EXPERIENCE READY','Your saved assets are now placed inside both 3D worlds. Start the experience to hide the authoring panel.');document.getElementById('startExperience').disabled=false;btn.textContent='APPLIED ✓';}catch(err){console.error(err);setGlobal('error','COULD NOT APPLY',err.message||'An asset could not be prepared.');btn.disabled=false;btn.textContent='APPLY EXPERIENCE';}}
function minimizePanel(){const p=document.getElementById('customizePanel');p.classList.remove('open');p.classList.add('authoring-minimized');document.getElementById('restoreCustomize').classList.add('show');}
function restorePanel(){const p=document.getElementById('customizePanel');p.classList.remove('authoring-minimized');p.classList.add('open');document.getElementById('restoreCustomize').classList.remove('show');}
function startExperience(){minimizePanel();setGlobal('applied','EXPERIENCE ACTIVE','Use EDIT EXPERIENCE whenever you want to change the content.');}

function worldCard(world,label){const p=PLACEMENT[world];return `
  <article class="world-author-card" data-world="${world}">
    <div class="world-author-head"><div><small>WORLD ${world==='city'?'01':'02'}</small><h4>${label}</h4></div><span id="${world}Summary" class="world-summary" data-state="empty">NOT SAVED</span></div>
    <div class="placement-map"><strong>WHERE YOU WILL SEE IT</strong><div><b>VIDEO</b><span>${p.video}</span></div><div><b>IMAGE</b><span>${p.image}</span></div><div><b>LOGO</b><span>${p.logo}</span></div><div><b>TEXT</b><span>${p.text}</span></div></div>
    ${fileRow(world,'video','Video','video/*')}${fileRow(world,'image','Image','image/*')}${fileRow(world,'logo','Logo','image/*,.svg')}
    <div class="asset-row text-row"><div class="asset-title"><b>TEXT</b><span class="asset-status" data-status="${world}-text" data-state="empty">EMPTY</span></div><input id="${world}Headline" type="text" maxlength="64" placeholder="Headline"/><input id="${world}Subheadline" type="text" maxlength="90" placeholder="Subheadline"/><button data-load-text="${world}" class="mini-action">LOAD TEXT</button></div>
    <button data-save-world="${world}" class="save-world">SAVE ${label}</button>
  </article>`;
}
function fileRow(world,type,label,accept){return `<div class="asset-row"><div class="asset-title"><b>${label.toUpperCase()}</b><span class="asset-status" data-status="${world}-${type}" data-state="empty">EMPTY</span></div><input data-file="${world}-${type}" type="file" accept="${accept}"/><p>${PLACEMENT[world][type]}</p></div>`;}
function injectUI(){
  const panel=document.getElementById('customizePanel');if(!panel)return;
  const legacy=[...panel.querySelectorAll('section')].find(s=>s.querySelector('h3')?.textContent.trim()==='Brand media');if(!legacy)return;
  legacy.innerHTML=`<h3>Brand experience</h3><p class="authoring-intro">Customize both worlds independently. Assets are only stored for this browser session until you reload.</p><div id="authoringGlobalStatus" class="authoring-global" data-state="empty"><strong>READY TO CUSTOMIZE</strong><p>Load content, save each world, apply the experience, then start it.</p></div>${worldCard('city',WORLD_LABEL.city)}${worldCard('nature',WORLD_LABEL.nature)}<div class="experience-actions"><button id="applyExperience" disabled>APPLY EXPERIENCE</button><button id="startExperience" disabled>START EXPERIENCE</button></div>`;
  const head=panel.querySelector('.panel-head');const close=document.getElementById('closePanel');const minimize=document.createElement('button');minimize.id='minimizePanel';minimize.type='button';minimize.textContent='−';minimize.title='Minimize panel';minimize.className='panel-minimize';head.insertBefore(minimize,close);
  const restore=document.createElement('button');restore.id='restoreCustomize';restore.type='button';restore.innerHTML='<span></span>EDIT EXPERIENCE';document.body.appendChild(restore);
  panel.querySelectorAll('[data-file]').forEach(input=>input.addEventListener('change',e=>{const [world,type]=input.dataset.file.split('-');stageFile(world,type,e.target.files?.[0]);}));
  panel.querySelectorAll('[data-load-text]').forEach(b=>b.onclick=()=>stageText(b.dataset.loadText));
  panel.querySelectorAll('[data-save-world]').forEach(b=>b.onclick=()=>saveWorld(b.dataset.saveWorld));
  document.getElementById('applyExperience').onclick=applyExperience;document.getElementById('startExperience').onclick=startExperience;minimize.onclick=minimizePanel;restore.onclick=restorePanel;
  document.getElementById('customizeToggle').addEventListener('click',()=>{panel.classList.remove('authoring-minimized');restore.classList.remove('show');});
  close.addEventListener('click',()=>restore.classList.remove('show'));
  updateCard('city');updateCard('nature');updateApplyAvailability();
}
function injectStyles(){const s=document.createElement('style');s.textContent=`
.authoring-intro{font:600 9px/1.55 Inter,sans-serif;color:rgba(255,255,255,.52);margin:0 0 12px}.authoring-global{padding:12px;border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.045);margin-bottom:12px}.authoring-global strong{display:block;font:800 9px Inter;letter-spacing:.12em;margin-bottom:5px}.authoring-global p{margin:0!important;font:600 9px/1.45 Inter!important;color:rgba(255,255,255,.54)!important}.authoring-global[data-state=saved]{border-color:rgba(119,177,228,.35)}.authoring-global[data-state=applied]{border-color:rgba(121,218,151,.42);background:rgba(89,166,111,.08)}.authoring-global[data-state=error]{border-color:rgba(236,112,105,.42)}
.world-author-card{border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:12px;margin:11px 0;background:rgba(255,255,255,.025)}.world-author-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.world-author-head small{font:700 7px Inter;letter-spacing:.15em;opacity:.42}.world-author-head h4{font:800 13px Inter;margin:4px 0 0}.world-summary,.asset-status{font:800 7px Inter;letter-spacing:.10em;padding:5px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.11);color:rgba(255,255,255,.48)}.world-summary[data-state=saved],.asset-status[data-state=saved]{color:#9bcdf5;border-color:rgba(120,184,235,.35)}.world-summary[data-state=applied],.asset-status[data-state=applied]{color:#9de2ae;border-color:rgba(110,213,137,.38)}.asset-status[data-state=loaded]{color:#edc66e;border-color:rgba(237,198,110,.35)}
.placement-map{margin:11px 0;padding:10px;background:#0d1217;border-radius:9px}.placement-map>strong{display:block;font:800 7px Inter;letter-spacing:.13em;color:#fff;margin-bottom:7px}.placement-map div{display:grid;grid-template-columns:44px 1fr;gap:7px;margin:4px 0}.placement-map b{font:800 7px Inter;color:#fff}.placement-map span{font:600 7px/1.35 Inter;color:rgba(255,255,255,.47)}
.asset-row{padding:9px 0;border-top:1px solid rgba(255,255,255,.065)}.asset-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}.asset-title b{font:800 8px Inter;letter-spacing:.10em}.asset-row p{font:600 7px/1.35 Inter!important;color:rgba(255,255,255,.38)!important;margin:5px 0 0!important}.asset-row input[type=file],.asset-row input[type=text]{width:100%;margin:4px 0 0!important}.text-row input{margin-bottom:5px!important}.mini-action,.save-world{width:100%;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.13);cursor:pointer;font:800 8px Inter;letter-spacing:.09em}.mini-action{margin-top:5px;background:#151b20;color:#fff}.save-world{margin-top:8px;background:#e7eeea;color:#07100b}.experience-actions{position:sticky;bottom:-30px;padding:12px 0 5px;background:linear-gradient(180deg,transparent,rgba(8,11,14,.98) 22%);display:grid;grid-template-columns:1fr 1fr;gap:7px}.experience-actions button{height:40px;border-radius:9px;border:1px solid rgba(255,255,255,.15);font:800 8px Inter;letter-spacing:.10em;cursor:pointer}.experience-actions button:first-child{background:#dfeae3;color:#07100b}.experience-actions button:last-child{background:#86d29b;color:#07100b}.experience-actions button:disabled{opacity:.34;cursor:not-allowed}
.panel-minimize{margin-left:auto;border:0;background:none;color:#fff;font-size:22px;line-height:1;opacity:.6;cursor:pointer;padding:0 8px}.panel.authoring-minimized{transform:translateX(102%)!important}#restoreCustomize{position:fixed;z-index:13;right:22px;bottom:22px;display:none;align-items:center;gap:8px;padding:11px 14px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,11,14,.80);backdrop-filter:blur(18px);color:#fff;font:800 9px Inter;letter-spacing:.10em;cursor:pointer;box-shadow:0 14px 40px rgba(0,0,0,.3)}#restoreCustomize.show{display:flex}#restoreCustomize span{width:7px;height:7px;border-radius:50%;background:#8cdda1;box-shadow:0 0 12px rgba(140,221,161,.65)}
`;document.head.appendChild(s);}

function boot(m){if(manager)return;manager=m;injectStyles();slots={city:makeWorldSlots('city',manager.worlds.city),nature:makeWorldSlots('nature',manager.worlds.nature)};injectUI();}
window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__)boot(window.__IW_BRAND_MANAGER__);
