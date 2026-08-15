(function(){
'use strict';
window.EP=window.EP||{};
var query=new URLSearchParams(location.search);
var toolId=query.get('tool')||'infinite-display-studio-pro';
var tool=EP.AdvancedTools&&EP.AdvancedTools.get(toolId);
var frame=document.getElementById('at-preview');
var shell=document.getElementById('at-frame-shell');
var statusEl=document.getElementById('at-status');
var loading=document.getElementById('at-loading');
var controlsRoot=document.getElementById('at-controls');
var brandingRoot=document.getElementById('at-branding');
var mediaRoot=document.getElementById('at-media-list');
var mediaInput=document.getElementById('at-media-input');
var logoInput=document.getElementById('at-logo-input');
var projectName=document.getElementById('at-project-name');
var runtime=null,renderAdapter=null,recording=null,recorded=[],runtimeSource='';
var state={name:'Infinite Display Project',config:{},branding:{},presentation:{active:false,intervalMs:15000},media:[],output:{presetId:'screen-16-9'},metadata:{}};

function clone(v){return JSON.parse(JSON.stringify(v));}
function toast(text){var el=document.getElementById('at-toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('show')},1800)}
function status(text,error){if(statusEl){statusEl.textContent=text;statusEl.style.color=error?'var(--bad)':''}if(error)console.error('[Advanced Tool]',error)}
function defaults(list){var out={};(list||[]).forEach(function(c){out[c.key]=c.default});return out}
function hydrateDefaults(){state.config=Object.assign(defaults(tool.controls),state.config||{});state.branding=Object.assign(defaults(tool.brandingControls),state.branding||{});state.presentation=Object.assign({active:false,intervalMs:(tool.presentation&&tool.presentation.intervalMs)||15000},state.presentation||{});projectName.value=state.name||tool.name+' Project'}

function controlInput(ctrl,value,onChange){
  var input;
  if(ctrl.type==='select'){
    input=document.createElement('select');(ctrl.options||[]).forEach(function(opt){var o=document.createElement('option');o.value=opt.v;o.textContent=opt.label||opt.v;input.appendChild(o)});input.value=value;
  }else if(ctrl.type==='boolean'){
    input=document.createElement('input');input.type='checkbox';input.checked=Boolean(value);
  }else{
    input=document.createElement('input');input.type=ctrl.type==='color'?'color':ctrl.type==='range'?'range':'text';input.value=value==null?'':value;
    if(ctrl.min!=null)input.min=ctrl.min;if(ctrl.max!=null)input.max=ctrl.max;if(ctrl.step!=null)input.step=ctrl.step;if(ctrl.maxLength)input.maxLength=ctrl.maxLength;
  }
  var handler=function(){var next=ctrl.type==='boolean'?input.checked:ctrl.type==='range'?Number(input.value):input.value;onChange(next,input)};
  input.addEventListener('input',handler);if(ctrl.type==='select'||ctrl.type==='boolean')input.addEventListener('change',handler);
  return input;
}
function renderControlGroups(root,list,bucket,send){
  root.innerHTML='';var groups={};(list||[]).forEach(function(c){var g=c.group||'Brand';(groups[g]=groups[g]||[]).push(c)});
  Object.keys(groups).forEach(function(group){var sec=document.createElement('section');sec.className='at-section';var head=document.createElement('button');head.type='button';head.textContent=group.toUpperCase();var body=document.createElement('div');body.className='at-body';groups[group].forEach(function(ctrl){var field=document.createElement('div');field.className='at-field';var label=document.createElement('label');var labelText=document.createElement('span');labelText.textContent=ctrl.label||ctrl.key;var val=document.createElement('span');val.className='at-value';var current=bucket[ctrl.key];val.textContent=ctrl.type==='boolean'?(current?'ON':'OFF'):String(current==null?'':current);label.appendChild(labelText);label.appendChild(val);var input=controlInput(ctrl,current,function(next){bucket[ctrl.key]=next;val.textContent=ctrl.type==='boolean'?(next?'ON':'OFF'):String(next);send();scheduleAutosave()});field.appendChild(label);field.appendChild(input);body.appendChild(field)});head.onclick=function(){body.hidden=!body.hidden};sec.appendChild(head);sec.appendChild(body);root.appendChild(sec)})
}
function renderControls(){renderControlGroups(controlsRoot,tool.controls,state.config,sendConfig);renderControlGroups(brandingRoot,(tool.brandingControls||[]).map(function(c){return Object.assign({group:'Branding'},c)}),state.branding,sendBranding)}
function renderMedia(){mediaRoot.innerHTML='';if(!state.media.length){var empty=document.createElement('div');empty.className='at-media-name';empty.textContent='Sin media de usuario · se conserva la colección demo original.';mediaRoot.appendChild(empty);return}state.media.forEach(function(item,index){var row=document.createElement('div');row.className='at-media-item';var preview=document.createElement(item.type==='video'?'video':'img');preview.src=item.url;if(item.type==='video'){preview.muted=true;preview.loop=true;preview.playsInline=true}var name=document.createElement('div');name.className='at-media-name';name.textContent=item.name||('Media '+(index+1));var remove=document.createElement('button');remove.type='button';remove.className='at-btn';remove.textContent='×';remove.onclick=function(){state.media.splice(index,1);renderMedia();sendMedia();scheduleAutosave()};row.appendChild(preview);row.appendChild(name);row.appendChild(remove);mediaRoot.appendChild(row)})}

function bridgeInjection(){return String.raw`
            // ---- ESCAPARATES PRO TYPE B RUNTIME BRIDGE ----
            const __epIntegrated = new URLSearchParams(location.search).get('integrated') === '1' || window.frameElement?.dataset?.epIntegrated === '1';
            function __epSyncGui(){ if(gui&&gui.controllers) gui.controllers.forEach(c=>c.updateDisplay()); }
            function __epApplyConfig(patch){
                patch=patch||{}; const structural=['displayMode','planeCount','bandCount']; let rebuild=false;
                Object.keys(patch).forEach(key=>{ if(Object.prototype.hasOwnProperty.call(settings,key)){ settings[key]=patch[key]; if(structural.includes(key)) rebuild=true; }});
                applySettings(); if(rebuild&&displayGroup) rebuildDisplay(); updateGUIVisibility(); __epSyncGui();
                return {...settings};
            }
            function __epApplyBranding(patch){ patch=patch||{}; Object.keys(patch).forEach(key=>{if(Object.prototype.hasOwnProperty.call(overlaySettings,key))overlaySettings[key]=patch[key]}); updateOverlayDOM(); return {...overlaySettings}; }
            function __epSetLogo(dataUrl){ return new Promise((resolve,reject)=>{ if(!dataUrl){logoImage=null;updateOverlayDOM();resolve(true);return;} const img=new Image();img.onload=()=>{logoImage=img;updateOverlayDOM();resolve(true)};img.onerror=reject;img.src=dataUrl; }); }
            function __epMediaObject(item){ return new Promise((resolve,reject)=>{ if(item.type==='video'){const v=document.createElement('video');v.src=item.url;v.loop=true;v.muted=true;v.playsInline=true;v.preload='auto';v.onloadeddata=()=>{v.play().catch(()=>{});resolve({type:'video',video:v,name:item.name||'Video',url:item.url,id:item.id||('ep_'+Math.random())})};v.onerror=reject;}else{const img=new Image();img.onload=()=>resolve({type:'image',img:img,name:item.name||'Image',url:item.url,id:item.id||('ep_'+Math.random())});img.onerror=reject;img.src=item.url;} }); }
            async function __epSetMedia(items){
                userMedia.forEach(m=>{if(m.type==='video'&&m.video){m.video.pause();if(String(m.video.src).startsWith('blob:'))URL.revokeObjectURL(m.video.src)}}); userMedia.length=0;
                for(const item of (items||[])){try{userMedia.push(await __epMediaObject(item))}catch(err){console.warn('Type B media skipped',item&&item.name,err)}}
                updateMediaPanel(); rebuildMediaList(); if(allImagesLoaded&&displayGroup) rebuildDisplay(); return userMedia.length;
            }
            function __epPresentation(active){ if(Boolean(active)!==presentationActive) togglePresentation(); return presentationActive; }
            window.InfiniteDisplayTypeB={
                version:'1.0.0', sourceCommit:'89ee1beb56a0c86c06366bbbb155f421e2d23981',
                getState:()=>({config:{...settings},branding:{...overlaySettings},presentation:{active:presentationActive,intervalMs:15000}}),
                setConfig:__epApplyConfig,setBranding:__epApplyBranding,setMedia:__epSetMedia,setLogo:__epSetLogo,setPresentation:__epPresentation,
                getCanvas:()=>renderer&&renderer.domElement,getRenderer:()=>renderer,getScene:()=>scene,getCamera:()=>camera,
                render:()=>{if(composer)composer.render();else if(renderer&&scene&&camera)renderer.render(scene,camera)},
                pause:()=>{window.__EP_TYPE_B_PAUSED__=true;return true},resume:()=>{window.__EP_TYPE_B_PAUSED__=false;return true},seek:(value)=>{targetScrollY=Number(value)||0;scrollY=targetScrollY;return true},
                resize:()=>{if(!renderer||!camera)return false;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);return true},
                dispose:()=>{window.__EP_TYPE_B_PAUSED__=true;if(currentAudio)currentAudio.pause();if(presentationTimer)clearInterval(presentationTimer);if(displayGroup)disposeGroup(displayGroup);return true}
            };
            if(__epIntegrated){
                const style=document.createElement('style');style.textContent='.lil-gui,#upload-btn,#manage-btn,#download-btn,#record-btn,#share-btn,#presentation-btn,#music-btn,#credits,#rubik-credit,.controls-panel{display:none!important}.info{opacity:.6;transform:scale(.72);transform-origin:top right}';document.head.appendChild(style);
            }
            parent.postMessage({type:'EP_ADVANCED_TOOL_BRIDGE_READY',toolId:'infinite-display-studio-pro',sourceCommit:'89ee1beb56a0c86c06366bbbb155f421e2d23981'},'*');
`}
function buildRuntimeSource(source){
  var marker='            loadImages();';
  if(source.indexOf(marker)===-1)throw new Error('Canonical source marker not found; source changed unexpectedly.');
  var patched=source.replace('            function animate() {','            function animate() {\n                if (window.__EP_TYPE_B_PAUSED__) { requestAnimationFrame(animate); return; }');
  patched=patched.replace(marker,bridgeInjection()+'\n'+marker);
  patched=patched.replace('<title>Infinite Display – Pro</title>','<title>Infinite Display Studio PRO · Engine</title>');
  return patched;
}
async function loadRuntime(){
  if(!tool)throw new Error('Advanced Tool not registered: '+toolId);
  status('Cargando motor canónico '+tool.source.commit.slice(0,8)+'…');
  var response=await fetch(tool.source.url,{cache:'no-store'});if(!response.ok)throw new Error('No se pudo cargar source canónico ('+response.status+')');
  var source=await response.text();runtimeSource=buildRuntimeSource(source);
  frame.dataset.epIntegrated='1';
  frame.srcdoc=runtimeSource;
}
function connectBridge(){
  var win=frame.contentWindow;if(!win||!win.InfiniteDisplayTypeB)return false;runtime=win.InfiniteDisplayTypeB;renderAdapter=EP.AdvancedToolRenderAdapter.create(runtime);loading.classList.add('hidden');status('Motor conectado · source '+tool.source.commit.slice(0,8)+' · Type B');sendConfig();sendBranding();sendMedia();if(state.branding.logoDataUrl)runtime.setLogo(state.branding.logoDataUrl);if(state.presentation&&state.presentation.active)runtime.setPresentation(true);return true;
}
window.addEventListener('message',function(event){if(event.source===frame.contentWindow&&event.data&&event.data.type==='EP_ADVANCED_TOOL_BRIDGE_READY')setTimeout(connectBridge,30)});
frame.addEventListener('load',function(){setTimeout(connectBridge,80)});
function sendConfig(){if(runtime)runtime.setConfig(clone(state.config))}
function sendBranding(){if(runtime)runtime.setBranding(clone(state.branding))}
function sendMedia(){if(runtime)runtime.setMedia(clone(state.media)).catch(function(err){status('Error cargando media',err)})}

function readFile(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(reader.result)};reader.onerror=function(){reject(reader.error)};reader.readAsDataURL(file)})}
async function addFiles(files){
  files=Array.from(files||[]).slice(0,Math.max(0,(tool.media.max||15)-state.media.length));
  for(var i=0;i<files.length;i++){var f=files[i];if(f.size>20*1024*1024){toast(f.name+' supera 20 MB en modo local');continue}var url=await readFile(f);state.media.push({id:'media_'+Date.now()+'_'+i,type:f.type.indexOf('video/')===0?'video':'image',url:url,name:f.name,source:'user-local',size:f.size,mimeType:f.type,temporary:false})}
  renderMedia();sendMedia();scheduleAutosave();
}
mediaInput.addEventListener('change',function(){addFiles(this.files).catch(function(err){status('Error de media',err)});this.value=''});
document.getElementById('at-add-media').onclick=function(){mediaInput.click()};
logoInput.addEventListener('change',async function(){var f=this.files&&this.files[0];if(!f)return;var url=await readFile(f);state.branding.logoDataUrl=url;state.branding.overlayEnabled=true;if(runtime)await runtime.setLogo(url);renderControls();sendBranding();scheduleAutosave();this.value=''});
document.getElementById('at-logo').onclick=function(){logoInput.click()};

var autosaveTimer=null,currentProject=null;
function projectPayload(){state.name=projectName.value||tool.name+' Project';return EP.AdvancedToolProjectAdapter.make(tool,state,currentProject)}
async function saveProject(silent){currentProject=await EP.ProjectStoreLocal.save(projectPayload());state.name=currentProject.name;if(!silent)toast('Proyecto guardado localmente ✓');return currentProject}
function scheduleAutosave(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(function(){saveProject(true).catch(function(err){status('Error de autosave',err)})},800)}
async function loadLatest(){var list=await EP.ProjectStoreLocal.list();var found=list.find(function(p){return p.templateId==='advanced-tool/'+tool.id&&p.config&&p.config.advancedTool&&p.config.advancedTool.moduleId===tool.id});if(!found){toast('No hay proyecto guardado todavía');return}var restored=EP.AdvancedToolProjectAdapter.read(tool,found);if(!restored)return;currentProject=found;state=Object.assign(state,restored);hydrateDefaults();renderControls();renderMedia();sendConfig();sendBranding();sendMedia();if(runtime&&state.branding.logoDataUrl)runtime.setLogo(state.branding.logoDataUrl);toast('Proyecto restaurado ✓')}
async function makeVersion(){var p=await saveProject(true);var v=await EP.ProjectVersioning.createLocal(p,'Snapshot '+new Date().toLocaleTimeString(),'manual');toast('Versión creada · '+v.label)}

document.getElementById('at-save').onclick=function(){saveProject(false).catch(function(err){status('Error al guardar',err);});};
document.getElementById('at-load').onclick=function(){loadLatest().catch(function(err){status('Error al restaurar',err)})};
document.getElementById('at-version').onclick=function(){makeVersion().catch(function(err){status('Error de versión',err)})};
document.getElementById('at-reset').onclick=function(){state.config=defaults(tool.controls);state.branding=defaults(tool.brandingControls);state.presentation={active:false,intervalMs:tool.presentation.intervalMs};state.media=[];hydrateDefaults();renderControls();renderMedia();if(runtime){runtime.setPresentation(false);runtime.setConfig(state.config);runtime.setBranding(state.branding);runtime.setMedia([]);runtime.setLogo(null)}scheduleAutosave();toast('Estado original restaurado')};
projectName.addEventListener('input',scheduleAutosave);

function downloadData(name,data,type){var blob=data instanceof Blob?data:new Blob([data],{type:type||'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
document.getElementById('at-json').onclick=async function(){var p=await saveProject(true);downloadData('infinite-display-studio-pro.json',JSON.stringify(p,null,2),'application/json')};
document.getElementById('at-png').onclick=function(){if(!renderAdapter){toast('Motor no listo');return}var data=renderAdapter.capturePng();var a=document.createElement('a');a.href=data;a.download='infinite-display-studio-pro.png';a.click();toast('PNG exportado')};
document.getElementById('at-record').onclick=function(){
  var btn=this;if(recording&&recording.state==='recording'){recording.stop();return}if(!renderAdapter){toast('Motor no listo');return}
  var stream=renderAdapter.captureStream(30);recorded=[];var mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';recording=new MediaRecorder(stream,{mimeType:mime});recording.ondataavailable=function(e){if(e.data.size)recorded.push(e.data)};recording.onstop=function(){downloadData('infinite-display-studio-pro.webm',new Blob(recorded,{type:'video/webm'}));btn.textContent='Grabar WEBM';toast('WEBM exportado')};recording.start();btn.textContent='Detener';toast('Grabando…')
};
document.getElementById('at-presentation').onclick=function(){state.presentation.active=!state.presentation.active;if(runtime)runtime.setPresentation(state.presentation.active);this.textContent=state.presentation.active?'Detener presentación':'Presentación';scheduleAutosave()};
document.getElementById('at-fullscreen').onclick=function(){if(shell.requestFullscreen)shell.requestFullscreen()};

function renderOutputPresets(){var select=document.getElementById('at-output-preset');if(!select||!EP.OutputPresets)return;EP.OutputPresets.getAll().forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.group+' · '+p.label;select.appendChild(o)});select.value=state.output.presetId;select.onchange=function(){state.output.presetId=this.value;applyOutputPreset();scheduleAutosave()};applyOutputPreset()}
function applyOutputPreset(){if(!EP.OutputPresets)return;var p=EP.OutputPresets.get(state.output.presetId);if(!p)return;shell.style.aspectRatio=String(p.ratio);shell.style.height='auto';shell.style.maxHeight='100%';shell.style.maxWidth='100%';if(p.ratio<1){shell.style.width='min(100%, 52vh)'}else{shell.style.width='100%'}if(runtime)runtime.resize()}

async function init(){
  if(!tool){status('Tool no registrado: '+toolId,true);return}
  document.title=tool.name+' · Escaparates Pro';document.getElementById('at-title').textContent=tool.name;document.getElementById('at-source').textContent='TYPE B · '+tool.family+' · '+tool.source.commit.slice(0,8);
  hydrateDefaults();renderControls();renderMedia();renderOutputPresets();
  try{await loadRuntime()}catch(err){loading.classList.remove('hidden');loading.querySelector('.at-loading-card').innerHTML='<strong>No se pudo cargar el motor canónico.</strong><br>'+String(err.message||err)+'<br><br><a style="color:#d3ad68" target="_blank" href="'+tool.source.fallbackUrl+'">Abrir source standalone</a>';status('Motor canónico no disponible',err)}
}
window.addEventListener('beforeunload',function(){if(renderAdapter)renderAdapter.dispose()});
init();
})();
