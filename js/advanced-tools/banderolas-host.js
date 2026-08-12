(function(){
'use strict';
window.EP=window.EP||{};
var TOOL_ID='banderolas-studio-pro';
var tool=EP.AdvancedTools&&EP.AdvancedTools.get(TOOL_ID);
var frame=document.getElementById('band-frame'),shell=document.getElementById('band-shell'),loading=document.getElementById('band-loading'),statusEl=document.getElementById('band-status');
var runtime=null,renderAdapter=null,recorder=null,chunks=[],currentProject=null,autosaveTimer=null,connectTimer=null;
var state={name:'Banderolas Project',config:{title:'L.A.P.D. EVIDENCE',caseStr:'Case: #884-Black Dahlia',date:'Oct 14, 1947',content:'"Meet me at the pier.\nBring the files."',signature:'- V.',mediaScale:1,mediaX:0,mediaY:0,recordFps:30},media:null,output:{},metadata:{}};
var $=function(id){return document.getElementById(id)};
function clone(v){return JSON.parse(JSON.stringify(v));}
function toast(t){var e=$('at-toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show')},1800)}
function status(t,err){statusEl.textContent=t;statusEl.style.color=err?'var(--bad)':'';if(err)console.error('[Banderolas Type B]',err)}
function download(name,data,type){var blob=data instanceof Blob?data:new Blob([data],{type:type||'text/plain'}),a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(u)},2000)}
function readFile(f){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result)};r.onerror=function(){reject(r.error)};r.readAsDataURL(f)})}

function context(){
  try{
    var wrapperDoc=frame.contentDocument;
    var inner=wrapperDoc&&wrapperDoc.getElementById('appFrame');
    var d=inner&&inner.contentDocument;
    var w=inner&&inner.contentWindow;
    return {wrapperDoc:wrapperDoc,inner:inner,d:d,w:w,canvas:d&&d.getElementById('glcanvas')};
  }catch(e){return {wrapperDoc:null,inner:null,d:null,w:null,canvas:null,error:e}}
}
function setInnerValue(d,id,value,eventName){
  var el=d&&d.getElementById(id);if(!el)return false;
  el.value=value==null?'':value;
  el.dispatchEvent(new Event(eventName||'input',{bubbles:true}));
  return true;
}
function installIntegratedView(c){
  if(!c||!c.d)return;
  var old=c.d.getElementById('ep-banderolas-integrated-style');if(old)old.remove();
  var st=c.d.createElement('style');st.id='ep-banderolas-integrated-style';
  st.textContent='body:not(.output-preview) #ui-panel{display:none!important}#overlay-text{opacity:.55!important}#canvas-container{width:100vw!important;min-width:0!important;flex:1 1 auto!important}.output-toast{right:18px!important}';
  c.d.head.appendChild(st);
}
function setConfig(cfg){
  var c=context();if(!c.d)return false;cfg=cfg||{};
  setInnerValue(c.d,'input-title',cfg.title);
  setInnerValue(c.d,'input-case',cfg.caseStr);
  setInnerValue(c.d,'input-date',cfg.date);
  setInnerValue(c.d,'input-content',cfg.content);
  setInnerValue(c.d,'input-signature',cfg.signature);
  if(c.d.getElementById('mediaScale'))setInnerValue(c.d,'mediaScale',cfg.mediaScale==null?1:cfg.mediaScale);
  if(c.d.getElementById('mediaX'))setInnerValue(c.d,'mediaX',cfg.mediaX||0);
  if(c.d.getElementById('mediaY'))setInnerValue(c.d,'mediaY',cfg.mediaY||0);
  if(c.d.getElementById('recordFps'))setInnerValue(c.d,'recordFps',cfg.recordFps||30,'change');
  return true;
}
async function setMedia(item){
  var c=context();if(!c.d||!c.w)throw new Error('Engine local no disponible');
  if(!item||!item.url){clearMedia();return true}
  var input=c.d.getElementById('media-upload');if(!input)throw new Error('Upload original no disponible');
  var response=await fetch(item.url),blob=await response.blob();
  var file=new c.w.File([blob],item.name||('banderolas-media.'+(item.type==='video'?'webm':'png')),{type:item.mimeType||blob.type||(item.type==='video'?'video/webm':'image/png')});
  var dt=new c.w.DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new c.w.Event('change',{bubbles:true}));
  return true;
}
function clearMedia(){var c=context(),btn=c.d&&c.d.getElementById('remove-media');if(btn)btn.click();return true}
function getState(){
  var c=context(),d=c.d;if(!d)return clone(state.config);
  return {title:d.getElementById('input-title')?.value||'',caseStr:d.getElementById('input-case')?.value||'',date:d.getElementById('input-date')?.value||'',content:d.getElementById('input-content')?.value||'',signature:d.getElementById('input-signature')?.value||'',mediaScale:Number(d.getElementById('mediaScale')?.value||1),mediaX:Number(d.getElementById('mediaX')?.value||0),mediaY:Number(d.getElementById('mediaY')?.value||0),recordFps:Number(d.getElementById('recordFps')?.value||30)};
}
function delegate(id){var c=context(),el=c.d&&c.d.getElementById(id);if(!el)throw new Error('Control Output V2 no disponible: '+id);el.click();return true}
function makeRuntime(){
  return {
    version:'1.2.0-output-v2-delegated',sourceCommit:tool.source.commit,
    getState:getState,setConfig:setConfig,setMedia:setMedia,clearMedia:clearMedia,
    getCanvas:function(){return context().canvas},getRenderer:function(){return null},getScene:function(){return null},getCamera:function(){return null},
    render:function(){var c=context();if(c.w&&c.w.platformState)c.w.platformState.needsTextureUpdate=true;return true},pause:function(){return true},resume:function(){return true},resize:function(){var c=context();if(c.w)c.w.dispatchEvent(new Event('resize'));return true},dispose:function(){var c=context(),v=c.d&&c.d.getElementById('hidden-video');if(v)v.pause();return true},
    capturePng:function(){var canvas=context().canvas;if(!canvas)throw new Error('Canvas no disponible');return canvas.toDataURL('image/png')},
    captureStream:function(fps){var canvas=context().canvas;if(!canvas)throw new Error('Canvas no disponible');return canvas.captureStream(fps||30)},
    downloadHtml:function(){return delegate('downloadHtml')},copyEmbed:function(){return delegate('copyEmbed')},previewClean:function(){return delegate('previewClean')}
  };
}
function connectOutputV2(attempt){
  attempt=attempt||0;var c=context();
  if(c.d&&c.canvas&&c.d.getElementById('outputStatus')&&c.d.getElementById('mediaScale')&&c.d.getElementById('downloadHtml')){
    installIntegratedView(c);runtime=makeRuntime();renderAdapter=EP.AdvancedToolRenderAdapter.create(runtime);clearTimeout(connectTimer);loading.classList.add('hidden');status('Motor local conectado · Output V2 preservado · '+tool.source.commit.slice(0,8));pushConfig();pushMedia();return true;
  }
  if(attempt<80){setTimeout(function(){connectOutputV2(attempt+1)},75);return false}
  status('El Output V2 local no terminó de inicializar');loading.querySelector('.at-loading-card').innerHTML='<strong>Output V2 local no disponible.</strong><br><a target="_blank" style="color:#d3ad68" href="'+tool.source.fallbackUrl+'">Abrir fuente preservada</a>';return false;
}
function loadRuntime(){
  if(!tool)throw new Error('Tool no registrado');status('Cargando Output V2 local preservado…');
  frame.src=tool.source.url+'?v='+tool.source.commit.slice(0,12);
  connectTimer=setTimeout(function(){if(!runtime)status('Esperando Output V2 local…')},2500);
}
frame.addEventListener('load',function(){connectOutputV2(0)});

function readUi(){state.name=$('band-project-name').value||'Banderolas Project';state.config={title:$('band-title').value,caseStr:$('band-case').value,date:$('band-date').value,content:$('band-content').value,signature:$('band-signature').value,mediaScale:Number($('band-scale').value),mediaX:Number($('band-x').value),mediaY:Number($('band-y').value),recordFps:Number($('band-fps').value)||30};return state}
function writeUi(){var c=state.config||{};$('band-project-name').value=state.name||'Banderolas Project';$('band-title').value=c.title||'';$('band-case').value=c.caseStr||'';$('band-date').value=c.date||'';$('band-content').value=c.content||'';$('band-signature').value=c.signature||'';$('band-scale').value=c.mediaScale==null?1:c.mediaScale;$('band-x').value=c.mediaX||0;$('band-y').value=c.mediaY||0;$('band-fps').value=c.recordFps||30;syncValues();renderMediaPreview()}
function pushConfig(){readUi();if(runtime)runtime.setConfig(clone(state.config))}
function pushMedia(){if(!runtime)return;runtime.setMedia(state.media?clone(state.media):null).catch(function(e){status('Error de media',e)})}
function syncValues(){$('band-scale-v').textContent=Number($('band-scale').value).toFixed(2)+'x';$('band-x-v').textContent=$('band-x').value;$('band-y-v').textContent=$('band-y').value}
function renderMediaPreview(){var root=$('band-media-preview'),thumb=$('band-thumb');thumb.innerHTML='';if(!state.media){root.classList.remove('on');return}var el=document.createElement(state.media.type==='video'?'video':'img');el.src=state.media.url;if(state.media.type==='video'){el.muted=true;el.loop=true;el.playsInline=true}thumb.appendChild(el);$('band-media-name').textContent=state.media.name||'Media';$('band-media-kind').textContent=state.media.type.toUpperCase();root.classList.add('on')}
function scheduleAutosave(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(function(){saveProject(true).catch(function(e){status('Autosave error',e)})},900)}
function projectPayload(){readUi();return EP.AdvancedToolProjectAdapter.make(tool,{name:state.name,config:state.config,branding:{},presentation:{},media:state.media?[state.media]:[],output:state.output,metadata:state.metadata},currentProject)}
async function saveProject(silent){currentProject=await EP.ProjectStoreLocal.save(projectPayload());if(!silent)toast('Proyecto guardado ✓');return currentProject}
async function loadLatest(){var list=await EP.ProjectStoreLocal.list(),p=list.find(function(x){return x.templateId==='advanced-tool/'+TOOL_ID&&x.config&&x.config.advancedTool&&x.config.advancedTool.moduleId===TOOL_ID});if(!p){toast('No hay proyecto guardado');return}var r=EP.AdvancedToolProjectAdapter.read(tool,p);if(!r)return;currentProject=p;state.name=r.name||p.name||state.name;state.config=Object.assign(state.config,r.config||{});state.media=r.media&&r.media[0]?r.media[0]:null;state.output=r.output||{};writeUi();pushConfig();pushMedia();toast('Proyecto restaurado ✓')}
async function makeVersion(){var p=await saveProject(true);var v=await EP.ProjectVersioning.createLocal(p,'Snapshot '+new Date().toLocaleTimeString(),'manual');toast('Versión creada · '+v.label)}

['band-title','band-case','band-date','band-content','band-signature','band-scale','band-x','band-y','band-fps'].forEach(function(id){$(id).addEventListener('input',function(){syncValues();pushConfig();scheduleAutosave()})});
$('band-upload').onclick=function(){$('band-file').click()};$('band-file').addEventListener('change',async function(){var f=this.files&&this.files[0];if(!f)return;var url=await readFile(f);state.media={id:'band_'+Date.now(),type:f.type.indexOf('video/')===0?'video':'image',url:url,name:f.name,mimeType:f.type,size:f.size,source:'user-local'};renderMediaPreview();pushMedia();scheduleAutosave();this.value=''});
$('band-remove').onclick=function(){state.media=null;renderMediaPreview();if(runtime)runtime.clearMedia();scheduleAutosave()};
$('band-reset-media').onclick=function(){$('band-scale').value=1;$('band-x').value=0;$('band-y').value=0;syncValues();pushConfig();scheduleAutosave()};
$('band-save').onclick=function(){saveProject(false).catch(function(e){status('Error al guardar',e)})};$('band-load').onclick=function(){loadLatest().catch(function(e){status('Error al restaurar',e)})};$('band-version').onclick=function(){makeVersion().catch(function(e){status('Error de versión',e)})};
$('band-original').onclick=function(){state={name:'Banderolas Project',config:{title:'L.A.P.D. EVIDENCE',caseStr:'Case: #884-Black Dahlia',date:'Oct 14, 1947',content:'"Meet me at the pier.\nBring the files."',signature:'- V.',mediaScale:1,mediaX:0,mediaY:0,recordFps:30},media:null,output:{},metadata:{}};writeUi();pushConfig();if(runtime)runtime.clearMedia();toast('Estado original restaurado')};
$('band-png').onclick=function(){if(!renderAdapter)return toast('Motor no listo');var a=document.createElement('a');a.href=renderAdapter.capturePng();a.download='banderolas-studio-pro.png';a.click();toast('PNG exportado')};
$('band-record').onclick=function(){var btn=this;if(recorder&&recorder.state==='recording'){recorder.stop();return}if(!renderAdapter)return toast('Motor no listo');var fps=Number($('band-fps').value)||30,stream=renderAdapter.captureStream(fps),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:fps===60?12000000:8000000});recorder.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};recorder.onstop=function(){download('banderolas-studio-pro.webm',new Blob(chunks,{type:mime}));btn.textContent='Grabar WEBM';toast('WEBM exportado')};recorder.start(250);btn.textContent='Detener y descargar';toast('Grabando '+fps+' FPS…')};
$('band-json').onclick=async function(){var p=await saveProject(true);download('banderolas-studio-pro.json',JSON.stringify(p,null,2),'application/json')};
$('band-html').onclick=function(){if(!runtime)return toast('Motor no listo');try{runtime.downloadHtml();toast('Exportador HTML V2 activado')}catch(e){status('HTML no disponible',e)}};
$('band-embed').onclick=function(){if(!runtime)return toast('Motor no listo');try{runtime.copyEmbed();toast('Embed V2 activado')}catch(e){status('Embed no disponible',e)}};
$('band-preview-clean').onclick=function(){document.body.classList.toggle('band-clean');this.textContent=document.body.classList.contains('band-clean')?'Salir Preview':'Preview Clean';try{if(runtime)runtime.previewClean()}catch(e){}};$('band-fullscreen').onclick=function(){if(shell.requestFullscreen)shell.requestFullscreen()};

function init(){writeUi();try{loadRuntime()}catch(e){status('No se pudo cargar Output V2 local',e)}}
window.addEventListener('beforeunload',function(){clearTimeout(connectTimer);if(renderAdapter)renderAdapter.dispose()});init();
})();
