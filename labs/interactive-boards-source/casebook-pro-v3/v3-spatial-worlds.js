// CASEBOOK PRO V3 — Spatial Worlds layer
// Additive runtime over the frozen V2 engine. No V1/V2 files are modified.
(function(){
'use strict';

const V3_KEY='casebook-pro-v3-world-v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

let world={
  version:'casebook-pro-v3',
  name:'Untitled Spatial World',
  chapters:[],
  activeChapterId:null,
  route:[],
  map:{image:null},
  guide:{index:0,running:false}
};
let placingHotspot=false;
let placingMapNode=false;
let hotspotDraft=null;
let activeMapChapterId=null;
let transitionBusy=false;

function qa(s,p=document){return Array.from(p.querySelectorAll(s));}
function q(s,p=document){return p.querySelector(s);}
function toast(msg,ms=2600){try{showStatus(msg,ms)}catch(_){console.log('[V3]',msg)}}
function stage(){return q('.stage')}
function boardApi(){try{return api()}catch(_){return null}}
function activeChapter(){return world.chapters.find(c=>c.id===world.activeChapterId)||null}
function saveWorld(){
  try{
    const safe=clone(world);
    safe.chapters.forEach(c=>{if(c.state){
      // Object URLs are session-only; media blobs remain managed by Casebook IndexedDB.
      (c.state.items||[]).forEach(it=>{if(it.pro?.media?.url?.startsWith('blob:'))delete it.pro.media.url});
    }});
    localStorage.setItem(V3_KEY,JSON.stringify(safe));
  }catch(e){console.warn('V3 persistence skipped',e)}
}
function loadWorld(){
  try{const raw=localStorage.getItem(V3_KEY);if(raw){const w=JSON.parse(raw);if(w?.version==='casebook-pro-v3')world=w}}catch(e){console.warn(e)}
}

function injectCss(){
const css=`
:root{--v3:#b6ff7d;--v3b:#17301e;--v3line:#355b40;--v3cyan:#82ddff}
.v3badge{display:inline-flex;gap:5px;align-items:center;padding:4px 7px;border:1px solid var(--v3line);background:#102016;color:#c9ffa4;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.07em}
.v3flow{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0}.v3flow span{font-size:7.5px;text-align:center;padding:6px 2px;border-radius:6px;background:#101b14;border:1px solid #263b2b;color:#bce8c4}
.v3tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0}.v3tabs button{padding:7px 2px;font-size:8px}
.v3list{display:grid;gap:5px;margin-top:7px}.v3row{border:1px solid #2b3430;border-radius:8px;background:#0f1210;padding:7px;display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.v3row.active{border-color:#477d55;background:#111d14}.v3row b{font-size:9.5px}.v3row small{display:block;color:#737e76;font-size:8px;margin-top:2px}.v3row .actions{display:flex;gap:4px}.v3row .actions button{padding:4px 6px;font-size:8px}
.v3hotLayer{position:absolute;inset:0;z-index:26;pointer-events:none}.v3hotLayer.placing{pointer-events:auto;cursor:crosshair;background:rgba(130,221,255,.025)}
.v3hot{position:absolute;width:24px;height:24px;margin:-12px;border-radius:50%;border:1px solid rgba(255,255,255,.75);background:rgba(12,13,14,.82);box-shadow:0 0 0 4px rgba(130,221,255,.12),0 8px 24px rgba(0,0,0,.35);display:grid;place-items:center;color:white;font:900 8px ui-monospace,monospace;pointer-events:auto;cursor:pointer;transition:.18s}.v3hot:hover{transform:scale(1.18);box-shadow:0 0 0 7px rgba(130,221,255,.18),0 8px 26px rgba(0,0,0,.45)}.v3hot.portal{border-color:#b6ff7d;box-shadow:0 0 0 4px rgba(182,255,125,.12)}.v3hot.info{border-color:#82ddff}.v3hot.media{border-color:#ffd07d}.v3hot.hiddenMarker{opacity:.15}.v3hotLabel{position:absolute;top:28px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 5px;border-radius:5px;background:rgba(0,0,0,.82);font-size:7px;color:#ddd;pointer-events:none}
.v3transition{position:absolute;inset:0;z-index:90;pointer-events:none;background:#090909;opacity:0;transition:opacity .35s ease}.v3transition.fade.on{opacity:1}.v3transition.blur.on{opacity:.8;backdrop-filter:blur(16px)}
.stage.v3zoom #preview{transition:transform .55s cubic-bezier(.2,.75,.2,1),filter .55s;transform:scale(2.15);filter:blur(1.5px)}.stage.v3zoomout #preview{transition:transform .55s cubic-bezier(.2,.75,.2,1),opacity .45s;transform:scale(.55);opacity:.25}.stage.v3panleft #preview{transition:transform .5s ease;transform:translateX(-32%)}.stage.v3panright #preview{transition:transform .5s ease;transform:translateX(32%)}.stage.v3whip #preview{transition:transform .28s cubic-bezier(.55,0,.9,.3),filter .28s;transform:translateX(-65%) scale(1.08);filter:blur(9px)}
.v3modalWrap{position:absolute;inset:0;z-index:88;background:rgba(3,4,4,.78);backdrop-filter:blur(12px);display:none;place-items:center}.v3modalWrap.open{display:grid}.v3modal{width:min(720px,calc(100% - 36px));max-height:84vh;overflow:auto;border:1px solid #354139;border-radius:16px;background:#101311;padding:16px;box-shadow:0 30px 100px rgba(0,0,0,.6)}.v3modal h2{margin:0 0 5px;font-size:17px}.v3modal p{font-size:10px;line-height:1.55;color:#939c96}.v3modal .close{float:right}
.v3worldmap{position:relative;height:min(64vh,620px);min-height:360px;border:1px solid #313a34;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 20% 20%,#172019,#0c0f0d 70%)}.v3worldmap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.75}.v3mapSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.v3mapNode{position:absolute;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;border:2px solid #b6ff7d;background:#101710;color:#dfffc8;display:grid;place-items:center;font-size:10px;font-weight:900;cursor:pointer;z-index:3;box-shadow:0 0 0 5px rgba(182,255,125,.12)}.v3mapNode.active{background:#2a4a31}.v3mapNode span{position:absolute;top:40px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(8,9,8,.9);padding:3px 5px;border-radius:4px;font-size:8px;color:#ddd}.v3mapPlace{cursor:crosshair}.v3routeLegend{display:flex;gap:6px;overflow:auto;padding:8px 0}.v3routeLegend button{white-space:nowrap}
.v3guideHud{position:absolute;z-index:35;left:50%;bottom:18px;transform:translateX(-50%);display:none;align-items:center;gap:7px;padding:7px;border:1px solid #405644;border-radius:12px;background:rgba(9,14,10,.9);backdrop-filter:blur(14px);box-shadow:0 18px 45px rgba(0,0,0,.4)}.v3guideHud.open{display:flex}.v3guideHud .meta{min-width:150px}.v3guideHud b{display:block;font-size:9px}.v3guideHud small{color:#7f9183;font-size:8px}.v3guideHud button{padding:7px 9px;font-size:8px}
.v3coords{font:8px ui-monospace,monospace;color:#72937a}.v3split{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v3hotForm{display:grid;gap:6px}.v3hotForm input,.v3hotForm select,.v3hotForm textarea{width:100%;border:1px solid #303a33;background:#0c0f0d;color:#eee;border-radius:7px;padding:7px;font-size:10px}.v3hotForm textarea{min-height:70px}.v3helpStep{border-left:2px solid #496d52;padding:8px 10px;margin:8px 0;background:#0d110e}.v3helpStep b{font-size:10px}.v3helpStep p{margin:3px 0 0}
body.v3-guided .v2StoryRail{bottom:76px}
`;
const s=document.createElement('style');s.id='casebook-v3-css';s.textContent=css;document.head.appendChild(s);
}

function injectUi(){
  document.title='CASEBOOK PRO V3 — Spatial Worlds';
  const head=q('.headText'); if(head){q('b',head).textContent='CASEBOOK PRO V3';q('span',head).textContent='Spatial Worlds · World → Chapters → Hotspots → Guided Tour';}
  const mark=q('.mark');if(mark)mark.textContent='V3';
  const scroll=q('.scroll');
  const first=scroll?.firstElementChild;
  const sec=document.createElement('details');sec.className='sec';sec.open=true;sec.id='v3WorldSection';
  sec.innerHTML=`<summary>V3 · Spatial Worlds</summary><div class="body">
    <div class="v3flow"><span>WORLD</span><span>CHAPTERS</span><span>HOTSPOTS</span><span>TOUR</span></div>
    <div class="demoNote"><b>Spatial Worlds Engine</b><span>Convierte varios boards en un mundo navegable. Los hotspots pueden informar o transportar entre Chapters con transiciones cinematográficas.</span></div>
    <div class="field"><label>World name</label><input id="v3WorldName" type="text" value="Untitled Spatial World"></div>
    <div class="v3tabs"><button class="btn" id="v3MapBtn">WORLD MAP</button><button class="btn" id="v3GuideBtn">GUIDED TOUR</button><button class="btn" id="v3HelpBtn">? GUIDE</button><button class="btn ghost" id="v3SaveBtn">SAVE</button></div>
    <div class="divider"></div>
    <div class="row"><button class="btn primary" id="v3NewChapter">+ NEW CHAPTER</button><button class="btn" id="v3DuplicateChapter">DUPLICATE</button></div>
    <div class="v3list" id="v3ChapterList"></div>
    <div class="divider"></div>
    <div class="demoNote"><b>Hotspots</b><span>Dos formas de colocación: click visual sobre la escena o coordenadas X/Y normalizadas. INFO abre una ficha; PORTAL navega a otro Chapter.</span></div>
    <button class="btn full primary" id="v3AddHotspot">+ ADD HOTSPOT</button>
    <div class="v3list" id="v3HotspotList"></div>
  </div>`;
  if(first)scroll.insertBefore(sec,first);else scroll?.appendChild(sec);

  const st=stage();
  const layer=document.createElement('div');layer.className='v3hotLayer';layer.id='v3HotLayer';st.appendChild(layer);
  const tr=document.createElement('div');tr.className='v3transition';tr.id='v3Transition';st.appendChild(tr);
  const mw=document.createElement('div');mw.className='v3modalWrap';mw.id='v3ModalWrap';mw.innerHTML='<div class="v3modal" id="v3Modal"></div>';st.appendChild(mw);
  const gh=document.createElement('div');gh.className='v3guideHud';gh.id='v3GuideHud';st.appendChild(gh);
}

async function waitApi(){for(let i=0;i<80;i++){if(boardApi()?.exportState)return true;await sleep(100)}return false}
function snapshot(){const a=boardApi();return a?.exportState?clone(a.exportState()):null}
async function restore(st){const a=boardApi();if(!a||!st)return false;const ok=a.importState(clone(st));try{v2RenderZones();v2RenderStory()}catch(_){}await sleep(120);return ok}

async function ensureWorld(){
  loadWorld();
  const ready=await waitApi();if(!ready){toast('V3: editor no disponible');return}
  if(!world.chapters?.length){
    const id=uid('chapter');world.chapters=[{id,name:'Chapter 1',state:snapshot(),hotspots:[],mapX:18,mapY:55}];world.activeChapterId=id;world.route=[id];saveWorld();
  }
  if(!world.activeChapterId||!world.chapters.some(c=>c.id===world.activeChapterId))world.activeChapterId=world.chapters[0].id;
  q('#v3WorldName').value=world.name||'Untitled Spatial World';
  renderAll();
}

function persistCurrent(){const c=activeChapter();if(c){const s=snapshot();if(s)c.state=s}world.name=q('#v3WorldName')?.value.trim()||world.name;saveWorld()}

function blankFrom(st){
  const s=clone(st||snapshot()||{});s.version='casebook-pro-v2';s.items=[];s.connections=[];s.camera={x:0,y:1,z:8};if(s.v2){s.v2.zones=[];s.v2.story={steps:[]};}return s;
}

async function addChapter(duplicate=false){
  persistCurrent();
  const base=activeChapter();const id=uid('chapter');
  const n=world.chapters.length+1;
  const state=duplicate?clone(base?.state||snapshot()):blankFrom(base?.state||snapshot());
  const c={id,name:'Chapter '+n,state,hotspots:[],mapX:15+((n-1)%4)*23,mapY:25+Math.floor((n-1)/4)*35};
  world.chapters.push(c);world.route.push(id);world.activeChapterId=id;saveWorld();await restore(state);renderAll();toast(duplicate?'Chapter duplicado':'Nuevo Chapter creado');
}

async function switchChapter(id,transition='fade',origin=null){
  if(transitionBusy||id===world.activeChapterId)return;
  const target=world.chapters.find(c=>c.id===id);if(!target)return;
  transitionBusy=true;persistCurrent();
  await playTransitionOut(transition,origin);
  world.activeChapterId=id;saveWorld();await restore(target.state);
  renderAll();await playTransitionIn(transition);transitionBusy=false;
}

async function playTransitionOut(type,origin){
  const st=stage(),fr=q('#preview'),ov=q('#v3Transition');
  if(origin&&fr)fr.style.transformOrigin=`${origin.x}% ${origin.y}%`;
  if(type==='zoom-in'||type==='doorway')st.classList.add('v3zoom');
  else if(type==='zoom-out')st.classList.add('v3zoomout');
  else if(type==='pan-left')st.classList.add('v3panleft');
  else if(type==='pan-right')st.classList.add('v3panright');
  else if(type==='whip')st.classList.add('v3whip');
  if(type==='blur'){ov.className='v3transition blur on'}else{ov.className='v3transition fade on'}
  await sleep(type==='whip'?300:560);
}
async function playTransitionIn(){
  const st=stage(),fr=q('#preview'),ov=q('#v3Transition');
  st.classList.remove('v3zoom','v3zoomout','v3panleft','v3panright','v3whip');
  if(fr){fr.style.transform='';fr.style.filter='';}
  await sleep(40);ov.className='v3transition fade';await sleep(380);
}

function renderChapters(){
  const el=q('#v3ChapterList');if(!el)return;el.innerHTML='';
  world.chapters.forEach((c,i)=>{
    const r=document.createElement('div');r.className='v3row'+(c.id===world.activeChapterId?' active':'');
    r.innerHTML=`<div><b>${String(i+1).padStart(2,'0')} · ${esc(c.name)}</b><small>${c.hotspots?.length||0} hotspots · map ${Math.round(c.mapX)}%, ${Math.round(c.mapY)}%</small></div><div class="actions"><button class="btn" data-open="${c.id}">OPEN</button><button class="btn ghost" data-edit="${c.id}">✎</button></div>`;
    el.appendChild(r);
  });
  qa('[data-open]',el).forEach(b=>b.onclick=()=>switchChapter(b.dataset.open,'fade'));
  qa('[data-edit]',el).forEach(b=>b.onclick=()=>editChapter(b.dataset.edit));
}
function editChapter(id){
  const c=world.chapters.find(x=>x.id===id);if(!c)return;
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>Edit Chapter</h2><p>Un Chapter es un espacio/nodo del mundo. Puede representar una sala física, una fase, una idea o cualquier board independiente.</p>
  <div class="v3hotForm"><label>Chapter name<input id="v3ChName" value="${esc(c.name)}"></label><div class="v3split"><label>Map X %<input id="v3ChX" type="number" min="0" max="100" step=".1" value="${c.mapX}"></label><label>Map Y %<input id="v3ChY" type="number" min="0" max="100" step=".1" value="${c.mapY}"></label></div><button class="btn" id="v3PlaceChapterMap">PLACE ON MAP VISUALLY</button><button class="btn primary" id="v3SaveChapter">SAVE CHAPTER</button></div>`);
  q('#v3SaveChapter').onclick=()=>{c.name=q('#v3ChName').value.trim()||c.name;c.mapX=clamp(Number(q('#v3ChX').value)||50,0,100);c.mapY=clamp(Number(q('#v3ChY').value)||50,0,100);saveWorld();closeModal();renderAll()};
  q('#v3PlaceChapterMap').onclick=()=>{c.name=q('#v3ChName').value.trim()||c.name;saveWorld();closeModal();activeMapChapterId=c.id;placingMapNode=true;showWorldMap(true)};
}

function startHotspotPlacement(){
  const c=activeChapter();if(!c)return;
  hotspotDraft={id:uid('hotspot'),type:'portal',title:'New hotspot',body:'',x:50,y:50,targetChapterId:world.chapters.find(x=>x.id!==c.id)?.id||'',transition:'zoom-in',visible:true};
  placingHotspot=true;q('#v3HotLayer').classList.add('placing');toast('Haz click sobre el punto exacto de la escena');
}
function stagePoint(e){const r=stage().getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width*100,0,100),y:clamp((e.clientY-r.top)/r.height*100,0,100)}}
function editHotspot(h,isNew=false){
  const targets=world.chapters.filter(c=>c.id!==world.activeChapterId).map(c=>`<option value="${c.id}" ${h.targetChapterId===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>${isNew?'Create':'Edit'} Hotspot</h2><p>INFO abre una ficha sin abandonar el Chapter. PORTAL transporta a otro Chapter. La posición puede definirse visualmente o con X/Y exactas.</p>
  <div class="v3hotForm">
  <div class="v3split"><label>Type<select id="v3HsType"><option value="portal" ${h.type==='portal'?'selected':''}>PORTAL · spatial navigation</option><option value="info" ${h.type==='info'?'selected':''}>INFO · content card</option><option value="media" ${h.type==='media'?'selected':''}>MEDIA · rich info</option></select></label><label>Transition<select id="v3HsTrans"><option value="zoom-in">Zoom In</option><option value="zoom-out">Zoom Out</option><option value="doorway">Doorway / Object Enter</option><option value="pan-left">Pan Left</option><option value="pan-right">Pan Right</option><option value="whip">Whip Pan</option><option value="blur">Blur</option><option value="fade">Crossfade</option></select></label></div>
  <label>Title<input id="v3HsTitle" value="${esc(h.title)}"></label><label>Information<textarea id="v3HsBody">${esc(h.body)}</textarea></label>
  <div class="v3split"><label>X %<input id="v3HsX" type="number" min="0" max="100" step=".1" value="${h.x.toFixed(2)}"></label><label>Y %<input id="v3HsY" type="number" min="0" max="100" step=".1" value="${h.y.toFixed(2)}"></label></div>
  <label>Portal destination<select id="v3HsTarget"><option value="">— none —</option>${targets}</select></label>
  <label><input id="v3HsVisible" type="checkbox" ${h.visible!==false?'checked':''}> Visible marker in Explore mode</label>
  <div class="row"><button class="btn" id="v3RepositionHs">PLACE VISUALLY</button><button class="btn primary" id="v3SaveHs">SAVE HOTSPOT</button></div>
  </div>`);
  q('#v3HsTrans').value=h.transition||'zoom-in';
  const commit=()=>{h.type=q('#v3HsType').value;h.transition=q('#v3HsTrans').value;h.title=q('#v3HsTitle').value.trim()||'Hotspot';h.body=q('#v3HsBody').value;h.x=clamp(Number(q('#v3HsX').value)||0,0,100);h.y=clamp(Number(q('#v3HsY').value)||0,0,100);h.targetChapterId=q('#v3HsTarget').value;h.visible=q('#v3HsVisible').checked;};
  q('#v3SaveHs').onclick=()=>{commit();const c=activeChapter();if(isNew&&!c.hotspots.some(x=>x.id===h.id))c.hotspots.push(h);saveWorld();closeModal();renderAll();toast('Hotspot guardado')};
  q('#v3RepositionHs').onclick=()=>{commit();closeModal();hotspotDraft=h;placingHotspot=true;q('#v3HotLayer').classList.add('placing');toast('Reposiciona el hotspot haciendo click')};
}
function renderHotspots(){
  const c=activeChapter(),layer=q('#v3HotLayer'),list=q('#v3HotspotList');if(!layer||!list||!c)return;
  layer.innerHTML='';list.innerHTML='';
  (c.hotspots||[]).forEach((h,i)=>{
    const m=document.createElement('button');m.className='v3hot '+h.type+(h.visible===false?' hiddenMarker':'');m.style.left=h.x+'%';m.style.top=h.y+'%';m.title=h.title;m.innerHTML=`${i+1}<span class="v3hotLabel">${esc(h.title)}</span>`;m.onclick=e=>{e.stopPropagation();activateHotspot(h)};layer.appendChild(m);
    const r=document.createElement('div');r.className='v3row';r.innerHTML=`<div><b>${i+1}. ${esc(h.title)}</b><small>${h.type.toUpperCase()} · <span class="v3coords">X ${h.x.toFixed(1)} / Y ${h.y.toFixed(1)}</span></small></div><div class="actions"><button class="btn" data-hsedit="${h.id}">EDIT</button><button class="btn ghost" data-hsdel="${h.id}">×</button></div>`;list.appendChild(r);
  });
  qa('[data-hsedit]',list).forEach(b=>b.onclick=()=>{const h=c.hotspots.find(x=>x.id===b.dataset.hsedit);if(h)editHotspot(h,false)});
  qa('[data-hsdel]',list).forEach(b=>b.onclick=()=>{c.hotspots=c.hotspots.filter(x=>x.id!==b.dataset.hsdel);saveWorld();renderHotspots()});
}
async function activateHotspot(h){
  if(h.type==='portal'){
    if(!h.targetChapterId){toast('Este portal no tiene destino');return}await switchChapter(h.targetChapterId,h.transition||'zoom-in',{x:h.x,y:h.y});
  }else{
    openModal(`<button class="btn ghost close" data-v3close>✕</button><div class="v3badge">${h.type.toUpperCase()} HOTSPOT</div><h2 style="margin-top:10px">${esc(h.title)}</h2><p>${esc(h.body).replace(/\n/g,'<br>')||'Sin contenido adicional.'}</p><div class="v3coords">X ${h.x.toFixed(2)}% · Y ${h.y.toFixed(2)}%</div>`);
  }
}

function renderRoute(){if(!world.route?.length)world.route=world.chapters.map(c=>c.id);world.route=world.route.filter(id=>world.chapters.some(c=>c.id===id));}
function showWorldMap(placeMode=false){
  persistCurrent();renderRoute();
  const bg=world.map?.image?`<img src="${world.map.image}">`:'';
  const nodes=world.chapters.map((c,i)=>`<button class="v3mapNode ${c.id===world.activeChapterId?'active':''}" data-mapnode="${c.id}" style="left:${c.mapX}%;top:${c.mapY}%">${i+1}<span>${esc(c.name)}</span></button>`).join('');
  const legend=world.route.map((id,i)=>{const c=world.chapters.find(x=>x.id===id);return c?`<button class="btn ghost" data-routejump="${id}">${i+1}. ${esc(c.name)}</button>`:''}).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>World Map / Navigator</h2><p>Plano global del mundo y del recorrido. Carga una imagen de planta/mapa o utiliza el canvas abstracto. Los números muestran el orden espacial de los Chapters.</p>
  <div class="row"><button class="btn" id="v3MapUploadBtn">UPLOAD MAP / FLOOR PLAN</button><button class="btn ghost" id="v3MapClearBtn">CLEAR MAP</button></div><input id="v3MapFile" type="file" accept="image/*" style="display:none">
  <div class="v3routeLegend">${legend}</div><div class="v3worldmap ${placeMode?'v3mapPlace':''}" id="v3WorldMapCanvas">${bg}<svg class="v3mapSvg" id="v3MapSvg"></svg>${nodes}</div>
  <p>${placeMode?'PLACE MODE: haz click en el punto exacto del plano donde debe quedar el Chapter seleccionado.':'Haz click en un nodo para navegar directamente a ese Chapter.'}</p>`);
  drawMapLines();
  qa('[data-mapnode]').forEach(b=>b.onclick=()=>{if(placeMode)return;closeModal();switchChapter(b.dataset.mapnode,'zoom-in')});
  qa('[data-routejump]').forEach(b=>b.onclick=()=>{closeModal();switchChapter(b.dataset.routejump,'fade')});
  q('#v3MapUploadBtn').onclick=()=>q('#v3MapFile').click();
  q('#v3MapFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{world.map=world.map||{};world.map.image=r.result;saveWorld();showWorldMap(placeMode)};r.readAsDataURL(f)};
  q('#v3MapClearBtn').onclick=()=>{world.map={image:null};saveWorld();showWorldMap(placeMode)};
  if(placeMode)q('#v3WorldMapCanvas').onclick=e=>{if(!placingMapNode||!activeMapChapterId)return;const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100,c=world.chapters.find(c=>c.id===activeMapChapterId);if(c){c.mapX=clamp(x,0,100);c.mapY=clamp(y,0,100);saveWorld()}placingMapNode=false;activeMapChapterId=null;showWorldMap(false);renderAll();toast('Chapter posicionado en World Map')};
}
function drawMapLines(){
  const svg=q('#v3MapSvg');if(!svg)return;renderRoute();let out='';for(let i=0;i<world.route.length-1;i++){const a=world.chapters.find(c=>c.id===world.route[i]),b=world.chapters.find(c=>c.id===world.route[i+1]);if(!a||!b)continue;out+=`<line x1="${a.mapX}%" y1="${a.mapY}%" x2="${b.mapX}%" y2="${b.mapY}%" stroke="rgba(182,255,125,.55)" stroke-width="2" stroke-dasharray="7 5"/><circle cx="${b.mapX}%" cy="${b.mapY}%" r="3" fill="#b6ff7d"/>`}svg.innerHTML=out;
}

function showGuideBuilder(){
  persistCurrent();renderRoute();
  const rows=world.route.map((id,i)=>{const c=world.chapters.find(x=>x.id===id);return c?`<div class="v3row"><div><b>${i+1}. ${esc(c.name)}</b><small>${c.hotspots?.length||0} hotspots</small></div><div class="actions"><button class="btn" data-up="${i}">↑</button><button class="btn" data-down="${i}">↓</button><button class="btn ghost" data-rm="${i}">×</button></div></div>`:''}).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>Guided Tour</h2><p>Define el recorrido antes de empezar. El Tour navega entre Chapters y deja disponible el Story Path de V2 dentro de cada estancia.</p><div class="v3list">${rows}</div><div class="row" style="margin-top:10px"><button class="btn" id="v3RouteAll">RESET TO ALL CHAPTERS</button><button class="btn primary" id="v3StartGuide">▶ START GUIDED TOUR</button></div>`);
  qa('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0)[world.route[i-1],world.route[i]]=[world.route[i],world.route[i-1]];saveWorld();showGuideBuilder()});
  qa('[data-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.down;if(i<world.route.length-1)[world.route[i+1],world.route[i]]=[world.route[i],world.route[i+1]];saveWorld();showGuideBuilder()});
  qa('[data-rm]').forEach(b=>b.onclick=()=>{world.route.splice(+b.dataset.rm,1);saveWorld();showGuideBuilder()});
  q('#v3RouteAll').onclick=()=>{world.route=world.chapters.map(c=>c.id);saveWorld();showGuideBuilder()};
  q('#v3StartGuide').onclick=()=>{closeModal();startGuidedTour()};
}
async function startGuidedTour(){
  renderRoute();if(!world.route.length){toast('Guided Tour vacío');return}world.guide={index:0,running:true};document.body.classList.add('v3-guided');const first=world.route[0];if(first!==world.activeChapterId)await switchChapter(first,'fade');renderGuideHud();toast('Guided Tour iniciado');
}
async function guideMove(delta){
  if(!world.guide?.running)return;const ni=world.guide.index+delta;if(ni<0||ni>=world.route.length)return;world.guide.index=ni;const id=world.route[ni];if(id!==world.activeChapterId)await switchChapter(id,delta>0?'zoom-in':'zoom-out');renderGuideHud();
}
function renderGuideHud(){
  const h=q('#v3GuideHud');if(!h)return;if(!world.guide?.running){h.classList.remove('open');return}const c=world.chapters.find(c=>c.id===world.route[world.guide.index]);h.innerHTML=`<button class="btn ghost" id="v3GuidePrev">←</button><div class="meta"><b>${world.guide.index+1} / ${world.route.length} · ${esc(c?.name||'')}</b><small>Guided Tour · hotspots + Story available</small></div><button class="btn" id="v3GuideStory">PLAY STORY</button><button class="btn primary" id="v3GuideNext">NEXT →</button><button class="btn ghost" id="v3GuideStop">STOP</button>`;h.classList.add('open');
  q('#v3GuidePrev').onclick=()=>guideMove(-1);q('#v3GuideNext').onclick=()=>guideMove(1);q('#v3GuideStop').onclick=stopGuide;q('#v3GuideStory').onclick=()=>{try{v2StartPresentation(false)}catch(e){toast('Este Chapter no tiene Story Path')}};
}
function stopGuide(){world.guide={index:0,running:false};document.body.classList.remove('v3-guided');renderGuideHud();toast('Guided Tour detenido')}

function showHelp(){
  openModal(`<button class="btn ghost close" data-v3close>✕</button><div class="v3badge">V3 QUICK START</div><h2 style="margin-top:10px">Cómo construir un Spatial World</h2><p>V3 organiza la complejidad en un flujo progresivo. No necesitas dominar todo para empezar.</p>
  <div class="v3helpStep"><b>1 · WORLD</b><p>Define el mundo general: museo, vivienda, mapa, estrategia, exposición o experiencia.</p></div>
  <div class="v3helpStep"><b>2 · CHAPTERS</b><p>Cada Chapter es un board independiente. Guarda automáticamente el estado al cambiar de estancia.</p></div>
  <div class="v3helpStep"><b>3 · HOTSPOTS</b><p>ADD HOTSPOT → click visual en la escena, o ajusta X/Y manualmente. INFO abre contenido; PORTAL navega a otro Chapter.</p></div>
  <div class="v3helpStep"><b>4 · WORLD MAP</b><p>Carga un plano/mapa y coloca cada Chapter sobre él. El Navigator muestra el recorrido completo de un vistazo.</p></div>
  <div class="v3helpStep"><b>5 · GUIDED TOUR</b><p>Ordena los Chapters, inicia el Tour y navega NEXT/PREV. Dentro de cada Chapter puedes usar el Story Path de V2.</p></div>
  <div class="v3helpStep"><b>6 · STORY → PRESENTATION → RECORDING</b><p>Todo el motor V2 permanece disponible: Story, Focus, Preflight, Present Exact/Live y Recording.</p></div>`);
}

function openModal(html){const w=q('#v3ModalWrap'),m=q('#v3Modal');m.innerHTML=html;w.classList.add('open');qa('[data-v3close]',m).forEach(b=>b.onclick=closeModal)}
function closeModal(){q('#v3ModalWrap')?.classList.remove('open')}
function renderAll(){renderChapters();renderHotspots();renderGuideHud();}

function bind(){
  q('#v3WorldName').onchange=()=>{world.name=q('#v3WorldName').value.trim()||world.name;saveWorld()};
  q('#v3SaveBtn').onclick=()=>{persistCurrent();toast('Spatial World guardado')};
  q('#v3NewChapter').onclick=()=>addChapter(false);q('#v3DuplicateChapter').onclick=()=>addChapter(true);
  q('#v3AddHotspot').onclick=startHotspotPlacement;q('#v3MapBtn').onclick=()=>showWorldMap(false);q('#v3GuideBtn').onclick=showGuideBuilder;q('#v3HelpBtn').onclick=showHelp;
  q('#v3HotLayer').onclick=e=>{if(!placingHotspot)return;const p=stagePoint(e);placingHotspot=false;q('#v3HotLayer').classList.remove('placing');hotspotDraft.x=p.x;hotspotDraft.y=p.y;editHotspot(hotspotDraft,true)};
  window.addEventListener('beforeunload',persistCurrent);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&placingHotspot){placingHotspot=false;q('#v3HotLayer').classList.remove('placing');toast('Colocación cancelada')}if(world.guide?.running&&e.key==='ArrowRight'){e.preventDefault();guideMove(1)}if(world.guide?.running&&e.key==='ArrowLeft'){e.preventDefault();guideMove(-1)}});
}

async function boot(){
  injectCss();injectUi();bind();
  await ensureWorld();
  // Restore saved active chapter when a previous V3 world exists.
  const c=activeChapter();if(c?.state)await restore(c.state);
  renderAll();
  toast('CASEBOOK PRO V3 · Spatial Worlds ready',3500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,60));else setTimeout(boot,60);
})();
