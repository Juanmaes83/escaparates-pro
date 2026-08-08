// CASEBOOK PRO V3 — FASHION SPATIAL SCENE SYSTEM
// Phase 3F.1 / 3F.2 / 3F.3 — isolated Fashion Lab only.
// Adds a semantic Fashion technical-art layer to the real Three.js Casebook scene.
(function(){
'use strict';

const LAB_VERSION='3F.3-black-runway-alpha';
const SEMANTIC_TYPES=['look','garment','material','campaign','reference','talent','location','copy','product','mood'];
const RELATION_TYPES=['inspired-by','styled-with','material-of','variation-of','campaign-for','paired-with','selected-for','approved-by'];
const SHOTS=['ENTRY','HERO','OVERVIEW','DETAIL','PORTAL','EXIT'];
const SCENES={
  'black-runway':{label:'Black Runway',status:'ACTIVE',note:'Dark runway / showroom · authored light'},
  'white-studio':{label:'White Editorial',status:'LOCKED',note:'Cyclorama / publication space'},
  'campaign-wall':{label:'Campaign Wall',status:'LOCKED',note:'2.5D art-direction spread'},
  'material-library':{label:'Material Library',status:'LOCKED',note:'Textile / object taxonomy'}
};

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function api(){try{return window.__CasebookV3Host?.api?.()||null}catch(_){return null}}
function selected(){try{return api()?.getSelected?.()||null}catch(_){return null}}
function sceneApi(){try{return api()?.fashion||null}catch(_){return null}}
function q(s,p=document){return p.querySelector(s)}
function qa(s,p=document){return Array.from(p.querySelectorAll(s))}

/*
 * patchFashionSceneBridge() runs before the Casebook iframe srcdoc is assigned.
 * The injected code executes inside the existing Three.js runtime and therefore
 * operates on the real scene/camera/items/ropes instead of faking 3D in the shell.
 */
window.patchFashionSceneBridge=function patchFashionSceneBridge(source){
  const marker='window.CasebookPro={';
  if(!String(source).includes(marker))throw new Error('Fashion bridge: CasebookPro marker not found');
  if(String(source).includes('__CASEBOOK_FASHION_RUNTIME__'))return source;

  const inner=String.raw`
/* __CASEBOOK_FASHION_RUNTIME__ ${LAB_VERSION} */
const __fashionState={
  version:'${LAB_VERSION}',sceneId:'black-runway',enabled:true,diagnostic:false,structure:false,
  group:new THREE.Group(),decorByItem:new Map(),lights:[],original:{},shot:'OVERVIEW',quality:'editorial',
  palette:{void:0x030303,black:0x090909,paper:0xedeae2,silver:0x999999,acid:0xe8ff3f}
};
__fashionState.group.name='CASEBOOK_FASHION_BLACK_RUNWAY';

function __fDisposeObject(o){
  try{o.traverse(n=>{if(n.geometry)n.geometry.dispose?.();if(n.material){const arr=Array.isArray(n.material)?n.material:[n.material];arr.forEach(m=>{if(m.map&&m.userData?.fashionOwnedMap)m.map.dispose?.();m.dispose?.()})}})}catch(_){ }
}
function __fMat(color,rough=.55,metal=.05,opts={}){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:rough,metalness:metal,transparent:false},opts))}
function __fLineMat(color,opacity=.55){return new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false})}
function __fBox(w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m}
function __fPlane(w,h,mat){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.receiveShadow=true;return m}
function __fAdd(parent,obj,x=0,y=0,z=0){obj.position.set(x,y,z);parent.add(obj);return obj}
function __fBounds(obj){try{const b=new THREE.Box3().setFromObject(obj);const s=new THREE.Vector3();b.getSize(s);return {w:Math.max(5,s.x),h:Math.max(5,s.y),d:Math.max(.2,s.z),box:b}}catch(_){return {w:18,h:13,d:1}}}
function __fCanvasTexture(lines,kind='label'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
  x.clearRect(0,0,c.width,c.height);x.fillStyle=kind==='acid'?'#e8ff3f':'#eeece6';
  x.font=kind==='hero'?'900 84px Arial Narrow,Arial,sans-serif':'700 29px Arial,Helvetica,sans-serif';
  x.textBaseline='top';
  (Array.isArray(lines)?lines:[lines]).slice(0,3).forEach((t,i)=>x.fillText(String(t||'').toUpperCase(),24,20+i*(kind==='hero'?86:48),970));
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;tx.needsUpdate=true;tx.userData.fashionOwnedMap=true;return tx;
}
function __fTextPlane(text,w=25,h=5,kind='label'){
  const mat=new THREE.MeshBasicMaterial({map:__fCanvasTexture(text,kind),transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.renderOrder=18;return m;
}

function __fClear(){
  for(const [it,g] of __fashionState.decorByItem){try{it.grp?.remove(g);__fDisposeObject(g)}catch(_){}}
  __fashionState.decorByItem.clear();
  scene.remove(__fashionState.group);__fDisposeObject(__fashionState.group);
  __fashionState.group=new THREE.Group();__fashionState.group.name='CASEBOOK_FASHION_BLACK_RUNWAY';
  __fashionState.lights.forEach(l=>{try{scene.remove(l);l.target&&scene.remove(l.target)}catch(_){}});__fashionState.lights=[];
}
function __fRemember(){
  if(__fashionState.original.saved)return;
  __fashionState.original.saved=true;
  __fashionState.original.background=scene.background;
  __fashionState.original.fog=scene.fog;
  __fashionState.original.exposure=renderer.toneMappingExposure;
  __fashionState.original.shadowEnabled=renderer.shadowMap.enabled;
  __fashionState.original.boardVisible=typeof __surface!=='undefined'&&__surface.board?__surface.board.visible:null;
  __fashionState.original.wallVisible=typeof __surface!=='undefined'&&__surface.wall?__surface.wall.visible:null;
}
function __fRestore(){
  __fClear();
  scene.background=__fashionState.original.background||new THREE.Color(0x0c0a09);scene.fog=__fashionState.original.fog||null;
  renderer.toneMappingExposure=__fashionState.original.exposure||1;renderer.shadowMap.enabled=__fashionState.original.shadowEnabled!==false;
  if(typeof __surface!=='undefined'&&__surface.board&&__fashionState.original.boardVisible!==null)__surface.board.visible=__fashionState.original.boardVisible;
  if(typeof __surface!=='undefined'&&__surface.wall&&__fashionState.original.wallVisible!==null)__surface.wall.visible=__fashionState.original.wallVisible;
  items.forEach(it=>{if(it.grp){it.grp.visible=true;it.grp.traverse(n=>{if(n.material&&n.userData?.__fashionOriginalOpacity!=null){n.material.opacity=n.userData.__fashionOriginalOpacity;n.material.transparent=n.userData.__fashionOriginalTransparent}})}});
  __fashionState.enabled=false;
}

function __fRunwayArchitecture(){
  const g=__fashionState.group;scene.add(g);
  // Deep back plate: visually infinite but still physically present for contact/shadow reading.
  const back=__fPlane(245,145,__fMat(0x060606,.88,0));back.position.set(0,1,-3.9);back.receiveShadow=true;g.add(back);
  // Runway path is layered rather than one glossy rectangle.
  const path=__fPlane(56,126,__fMat(0x0b0b0b,.26,.18));path.position.set(0,-4,-2.8);g.add(path);
  const core=__fPlane(22,126,__fMat(0x111111,.18,.27));core.position.set(0,-4,-2.65);g.add(core);
  const seamMat=__fLineMat(0x777777,.19);
  [-11,11].forEach(x=>{const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-67,-2.55),new THREE.Vector3(x,59,-2.55)]);g.add(new THREE.Line(geom,seamMat.clone()))});
  // Lateral architecture / luminous fins. Not decorative particles: they establish scale and rhythm.
  const finMat=__fMat(0x111111,.38,.42);const edgeMat=__fMat(0xd9d7d0,.35,.1,{emissive:0x34342f,emissiveIntensity:.22});
  const xs=[-82,-64,-46,46,64,82];
  xs.forEach((x,i)=>{
    const fin=__fBox(1.05,76,.8,finMat.clone());fin.position.set(x,(i%2?6:-3),-2.35-i*.06);g.add(fin);
    const edge=__fBox(.055,68,.16,edgeMat.clone());edge.position.set(x+(x<0?.58:-.58),(i%2?6:-3),-1.82);g.add(edge);
  });
  // Horizon bars create a photographic studio rhythm and depth scale.
  [-38,0,38].forEach((y,i)=>{const bar=__fBox(194,.18,.25,__fMat(i===1?0x343434:0x181818,.5,.25));bar.position.set(0,y,-2.05);g.add(bar)});
  // Editorial issue marker / spatial title.
  const title=__fTextPlane(['BLACK RUNWAY','SPATIAL EDITION 001'],42,10,'hero');title.position.set(-70,49,-1.75);g.add(title);
  const index=__fTextPlane(['CASEBOOK PRO / FASHION','WORLD 01  —  RUNWAY'],35,6,'label');index.position.set(68,-53,-1.7);g.add(index);
  // Scale marker: acid line deliberately sparse, one accent only.
  const acid=__fBox(1.2,19,.18,__fMat(0xe8ff3f,.5,0,{emissive:0xe8ff3f,emissiveIntensity:.08}));acid.position.set(91,47,-1.6);g.add(acid);
}

function __fLights(){
  // We preserve existing scene lights, but Fashion gets authored key/rim fixtures.
  renderer.shadowMap.enabled=true;
  try{renderer.outputEncoding=THREE.sRGBEncoding}catch(_){ }
  if('ACESFilmicToneMapping' in THREE)renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=__fashionState.diagnostic?.82:1.02;
  const add=(l,target)=>{scene.add(l);__fashionState.lights.push(l);if(target){scene.add(target);l.target=target;__fashionState.lights.push(target)}};
  const target=new THREE.Object3D();target.position.set(0,2,0);
  const key=new THREE.SpotLight(0xf5f0e6,__fashionState.diagnostic?1.1:2.25,260,Math.PI*.23,.66,1.3);key.position.set(-88,58,66);key.castShadow=!__fashionState.diagnostic;key.shadow.mapSize.set(1024,1024);add(key,target);
  const rimTarget=new THREE.Object3D();rimTarget.position.set(10,-2,0);
  const rim=new THREE.SpotLight(0xd7e4ff,__fashionState.diagnostic?.55:1.25,250,Math.PI*.20,.72,1.7);rim.position.set(92,38,38);add(rim,rimTarget);
  const fill=new THREE.DirectionalLight(0xa9a6a0,__fashionState.diagnostic?.25:.42);fill.position.set(0,-30,70);scene.add(fill);__fashionState.lights.push(fill);
}

function __fSemanticType(it,index){
  const explicit=it.pro?.fashionType||it.meta?.fashionType||it.type;
  if(SEMANTIC_TYPES.includes(explicit))return explicit;
  const title=String(it.title||it.name||it.text||'').toLowerCase();
  if(/fabric|textile|silk|cotton|leather|material/.test(title))return 'material';
  if(/campaign|launch|editorial/.test(title))return 'campaign';
  if(/look|outfit|style/.test(title))return 'look';
  if(/model|talent|cast/.test(title))return 'talent';
  if(/location|studio|venue/.test(title))return 'location';
  if(/copy|headline|claim|text/.test(title))return 'copy';
  return ['look','campaign','reference','material','product'][index%5];
}
function __fDecorateItem(it,index){
  if(!it?.grp||__fashionState.decorByItem.has(it))return;
  const b=__fBounds(it.grp),w=Math.min(42,Math.max(12,b.w+2.2)),h=Math.min(38,Math.max(9,b.h+2.2));
  const type=__fSemanticType(it,index);if(!it.pro)it.pro={};it.pro.fashionType=type;
  const g=new THREE.Group();g.name='FASHION_OBJECT_'+String(it.id||index);g.userData={fashionOwned:true,semanticType:type};
  // Shadow gap / physical backing creates an object, not a card skin.
  const backing=__fPlane(w,h,__fMat(type==='material'?0x171614:0x0b0b0b,type==='material'?.78:.46,type==='material'?0:.11,{transparent:true,opacity:.96}));
  backing.position.z=-.34;backing.receiveShadow=true;g.add(backing);
  // Editorial frame: asymmetrical, one strong edge and registration ticks.
  const edge=__fBox(.14,h+.7,.18,__fMat(index%4===0?0xe8ff3f:0xe9e6df,.4,.05,{emissive:index%4===0?0x303500:0x111111,emissiveIntensity:.12}));edge.position.set(-w/2-.2,0,.18);g.add(edge);
  const top=__fBox(w+.7,.08,.12,__fMat(0xb9b7b1,.55,.1));top.position.set(0,h/2+.22,.13);g.add(top);
  const tick1=__fBox(2.6,.06,.11,__fMat(0xbdbab2,.65,0));tick1.position.set(w/2-1.1,-h/2-.22,.14);g.add(tick1);
  const tick2=__fBox(.06,2.6,.11,__fMat(0xbdbab2,.65,0));tick2.position.set(w/2+.22,-h/2+1.1,.14);g.add(tick2);
  const label=__fTextPlane([String(index+1).padStart(2,'0')+' / '+type,String(it.title||it.name||'UNTITLED').slice(0,28)],Math.min(w,24),3.7,'label');label.position.set(-Math.max(0,w/2-12),-h/2-2.2,.22);g.add(label);
  // Controlled depth: editorial objects alternate a few millimeters/centimeters, not random 3D chaos.
  g.position.z=.16+(index%3)*.11;
  it.grp.add(g);__fashionState.decorByItem.set(it,g);
  // De-emphasize glossy/glowing legacy materials without destroying their maps/content.
  it.grp.traverse(n=>{if(n.material&&!n.userData?.fashionOwned){const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(m=>{if(m.userData.__fashionOriginalOpacity==null){m.userData.__fashionOriginalOpacity=m.opacity;m.userData.__fashionOriginalTransparent=m.transparent}if('roughness' in m)m.roughness=Math.max(.42,Math.min(.76,m.roughness??.55));if('metalness' in m)m.metalness=Math.min(.18,m.metalness??0);if('emissiveIntensity' in m)m.emissiveIntensity=Math.min(.12,m.emissiveIntensity??0)})}});
}
function __fDecorateAll(){items.forEach(__fDecorateItem)}

function __fRelationships(){
  // Keep semantics; quiet the inherited rope aesthetic into editorial rules.
  ropes.forEach((r,i)=>{
    if(!r.meta)r.meta={};if(!r.meta.smart)r.meta.smart={};
    r.meta.smart.fashionType=r.meta.smart.fashionType||RELATION_TYPES[i%RELATION_TYPES.length];
    r.meta.smart.style='minimal';r.meta.smart.width=Math.min(1.15,Number(r.meta.smart.width)||.75);r.meta.smart.animated=false;
    try{r.color=i%5===0?0xe8ff3f:0x8d8d88;r.thick=.055}catch(_){ }
  });
}
function __fSurface(){
  __fRemember();scene.background=new THREE.Color(__fashionState.diagnostic?0x111111:__fashionState.palette.void);
  scene.fog=__fashionState.diagnostic?null:new THREE.FogExp2(0x030303,.0042);
  if(typeof __surface!=='undefined'){
    if(__surface.board)__surface.board.visible=false;
    if(__surface.boardMedia)__surface.boardMedia.visible=false;
    if(__surface.wall)__surface.wall.visible=false;
  }
}
function __fApply(){
  __fashionState.enabled=true;__fClear();__fSurface();__fRunwayArchitecture();__fLights();__fDecorateAll();__fRelationships();
  __fashionState.structure&&__fSetStructure(true);
}
function __fSetDiagnostic(v){__fashionState.diagnostic=!!v;__fApply();return __fashionState.diagnostic}
function __fSetStructure(v){
  __fashionState.structure=!!v;
  const wire=__fashionState.structure;
  __fashionState.group.traverse(n=>{if(n.material&&'wireframe' in n.material)n.material.wireframe=wire});
  for(const [,g] of __fashionState.decorByItem)g.traverse(n=>{if(n.material&&'wireframe' in n.material)n.material.wireframe=wire});
  return wire;
}
function __fSetScene(id){
  if(id!=='black-runway')return {ok:false,reason:'Scene family intentionally locked until Black Runway approval',sceneId:__fashionState.sceneId};
  __fashionState.sceneId=id;__fApply();return {ok:true,sceneId:id};
}
function __fShot(intent='OVERVIEW',subjectId=null){
  intent=String(intent).toUpperCase();if(!['ENTRY','HERO','OVERVIEW','DETAIL','PORTAL','EXIT'].includes(intent))intent='OVERVIEW';
  __fashionState.shot=intent;
  const it=subjectId?items.find(x=>String(x.id)===String(subjectId)):(primary&&items.includes(primary)?primary:null);
  let tx=0,ty=1,tz=Z_HOME;
  if(intent==='ENTRY'){tx=-22;ty=5;tz=Z_HOME*1.22}
  if(intent==='HERO'){tx=it?.target?.x||-8;ty=it?.target?.y||2;tz=Z_HOME*.72}
  if(intent==='DETAIL'){tx=it?.target?.x||0;ty=it?.target?.y||0;tz=Z_HOME*.47}
  if(intent==='PORTAL'){tx=it?.target?.x||0;ty=it?.target?.y||0;tz=Z_HOME*.34}
  if(intent==='EXIT'){tx=18;ty=5;tz=Z_HOME*1.3}
  // Author through the existing rig so all Casebook controls remain coherent.
  rig.tx=tx;rig.ty=ty;rig.tz=tz;
  return {intent,subjectId:it?.id||null,target:{x:tx,y:ty,z:tz}};
}
function __fAnchorAt(cx,cy){
  raycaster.setFromCamera({x:(cx/innerWidth)*2-1,y:-(cy/innerHeight)*2+1},camera);
  const owned=[];for(const [it,g] of __fashionState.decorByItem)g.traverse(n=>{if(n.isMesh){n.userData.__fashionItemId=it.id;owned.push(n)}});
  const hits=raycaster.intersectObjects(owned,true);if(!hits.length)return null;
  const h=hits[0],id=h.object.userData.__fashionItemId;const it=items.find(x=>String(x.id)===String(id));if(!it)return null;
  it.grp.updateWorldMatrix(true,false);const local=it.grp.worldToLocal(h.point.clone());
  return {type:'item3d',itemId:it.id,local:[local.x,local.y,local.z],semanticType:it.pro?.fashionType||'reference'};
}
function __fStats(){
  let tris=0,meshes=0;scene.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;const g=o.geometry;tris+=g.index?g.index.count/3:(g.attributes.position?.count||0)/3}});
  return {version:__fashionState.version,sceneId:__fashionState.sceneId,enabled:__fashionState.enabled,diagnostic:__fashionState.diagnostic,structure:__fashionState.structure,shot:__fashionState.shot,items:items.length,relationships:ropes.length,meshes,triangles:Math.round(tris)};
}
const __fashionApi={
  version:__fashionState.version,
  semanticTypes:${JSON.stringify(SEMANTIC_TYPES)},relationshipTypes:${JSON.stringify(RELATION_TYPES)},shotIntents:${JSON.stringify(SHOTS)},
  apply:__fApply,restore:__fRestore,setScene:__fSetScene,setDiagnostic:__fSetDiagnostic,setStructure:__fSetStructure,setShot:__fShot,
  getState:()=>({sceneId:__fashionState.sceneId,enabled:__fashionState.enabled,diagnostic:__fashionState.diagnostic,structure:__fashionState.structure,shot:__fashionState.shot}),
  stats:__fStats,refresh:()=>{__fDecorateAll();__fRelationships();return __fStats()},anchorAt:__fAnchorAt
};
__fApply();
`;
  return String(source).replace(marker,inner+'\n'+marker.replace('{','{fashion:__fashionApi,'));
};

function markLab(){
  document.body.classList.add('v3-fashion-lab');
  try{localStorage.setItem('casebook-v3-editorial-theme','fashion')}catch(_){ }
  document.body.dataset.esTheme='fashion';
  const theme=q('#esTheme');if(theme)theme.value='fashion';
  const brand=q('.esBrandCopy b');if(brand)brand.textContent='Casebook Pro V3 / Fashion';
  const sub=q('.esBrandCopy span');if(sub)sub.textContent='Spatial Scene Lab · Edition 001';
}

function fashionPanel(){
  const w=window.CasebookProV3?.getWorld?.();
  const c=w?.chapters?.find(x=>x.id===w.activeChapterId);
  return `<div class="fashionLabPanel">
    <div class="flKicker">Phase 3F / Art Direction</div>
    <div class="flTitle">Fashion Scene System</div>
    <div class="flSceneGrid">${Object.entries(SCENES).map(([id,s])=>`<button class="flSceneBtn ${id==='black-runway'?'active':''}" data-fl-scene="${id}" ${s.status==='LOCKED'?'disabled':''}><b>${esc(s.label)}</b><small>${esc(s.note)}${s.status==='LOCKED'?' · after approval':''}</small></button>`).join('')}</div>
    <div class="flControl"><label><span>Camera intent</span><span id="flShotRead">OVERVIEW</span></label><select id="flShot">${SHOTS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div>
    <div class="flToggleRow"><button class="flToggle" id="flNoPost">No-post diagnostic</button><button class="flToggle" id="flStructure">Structure</button></div>
    <div class="flToggleRow"><button class="flToggle" id="flRefresh">Refresh objects</button><button class="flToggle" id="flFrameSelected">Frame selected</button></div>
    <div class="flQuality" id="flQuality"><b>BLACK RUNWAY / QUALITY GATE</b><br>Form → material → light → interaction. Bloom/particles are not used to carry the scene.</div>
    <div style="display:none" data-fl-context>${esc(c?.name||'')}</div>
  </div>`;
}

function bindPanel(root){
  const shot=q('#flShot',root);if(shot)shot.onchange=()=>{const a=sceneApi();const r=a?.setShot?.(shot.value,selected()?.id||null);q('#flShotRead',root).textContent=r?.intent||shot.value};
  const diag=q('#flNoPost',root);if(diag)diag.onclick=()=>{const v=sceneApi()?.setDiagnostic?.(!diag.classList.contains('on'));diag.classList.toggle('on',!!v)};
  const structure=q('#flStructure',root);if(structure)structure.onclick=()=>{const v=sceneApi()?.setStructure?.(!structure.classList.contains('on'));structure.classList.toggle('on',!!v)};
  const refresh=q('#flRefresh',root);if(refresh)refresh.onclick=()=>{const s=sceneApi()?.refresh?.();if(s)q('#flQuality',root).innerHTML=`<b>RENDERER CHECK</b><br>${s.items} objects · ${s.relationships} relations · ${s.meshes} meshes · ${s.triangles.toLocaleString()} tris`};
  const frame=q('#flFrameSelected',root);if(frame)frame.onclick=()=>{const sel=selected();sceneApi()?.setShot?.('DETAIL',sel?.id||null);if(shot)shot.value='DETAIL';q('#flShotRead',root).textContent='DETAIL'};
  qa('[data-fl-scene]',root).forEach(b=>b.onclick=()=>{if(b.disabled)return;const r=sceneApi()?.setScene?.(b.dataset.flScene);if(r?.ok){qa('[data-fl-scene]',root).forEach(x=>x.classList.toggle('active',x===b))}});
}

let inspectorSig='';
function enhanceInspector(){
  const ins=q('#esInspector');if(!ins)return;
  const w=window.CasebookProV3?.getWorld?.();const sel=selected();const sig=[w?.worldId,w?.activeChapterId,sel?.id,ins.textContent?.slice(0,80)].join('|');
  if(sig===inspectorSig&&q('.fashionLabPanel',ins))return;inspectorSig=sig;
  if(!q('.fashionLabPanel',ins)){ins.insertAdjacentHTML('beforeend',fashionPanel());bindPanel(ins)}
}
function syncRuntime(){
  markLab();enhanceInspector();
  const a=sceneApi();if(a&&!window.__fashionInitialSync){window.__fashionInitialSync=true;a.apply?.();}
}
function boot(){
  markLab();
  const observer=new MutationObserver(()=>enhanceInspector());const shell=q('#esShell');if(shell)observer.observe(shell,{subtree:true,childList:true});
  setInterval(syncRuntime,700);
  window.CasebookFashionLab={version:LAB_VERSION,semanticTypes:SEMANTIC_TYPES.slice(),relationshipTypes:RELATION_TYPES.slice(),scenes:{...SCENES},sceneApi};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,60));else setTimeout(boot,60);
})();
