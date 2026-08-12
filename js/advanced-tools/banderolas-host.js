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

function bridgeSource(){return String.raw`
(function(){
if(window.BanderolasTypeB)return;
window.__bandMediaScale=1;window.__bandMediaX=0;window.__bandMediaY=0;
if(!window.__epBandDrawPatched){window.__epBandDrawPatched=true;const proto=CanvasRenderingContext2D.prototype,orig=proto.drawImage;proto.drawImage=function(){const a=[...arguments];try{if(a[0]===platformState.mediaElement&&a.length===5){const s=window.__bandMediaScale||1,ox=window.__bandMediaX||0,oy=window.__bandMediaY||0,dx=a[1],dy=a[2],dw=a[3],dh=a[4],cx=dx+dw/2,cy=dy+dh/2,nw=dw*s,nh=dh*s;a[1]=cx-nw/2+ox;a[2]=cy-nh/2+oy;a[3]=nw;a[4]=nh}}catch(e){}return orig.apply(this,a)}}
function dispatch(id,value){const el=document.getElementById(id);if(!el)return;el.value=value==null?'':value;el.dispatchEvent(new Event('input',{bubbles:true}))}
function setConfig(s){s=s||{};if('title'in s)dispatch('input-title',s.title);if('caseStr'in s)dispatch('input-case',s.caseStr);if('date'in s)dispatch('input-date',s.date);if('content'in s)dispatch('input-content',s.content);if('signature'in s)dispatch('input-signature',s.signature);window.__bandMediaScale=Number(s.mediaScale)||1;window.__bandMediaX=Number(s.mediaX)||0;window.__bandMediaY=Number(s.mediaY)||0;platformState.needsTextureUpdate=true;return true}
function clearMedia(){platformState.mediaType=null;platformState.mediaElement=null;hiddenVideo.pause();hiddenVideo.removeAttribute('src');hiddenVideo.load();mediaPreviewContainer.style.display='none';platformState.needsTextureUpdate=true;return true}
function setMedia(item){return new Promise((resolve,reject)=>{if(!item||!item.url){clearMedia();resolve(true);return}if(item.type==='video'){hiddenVideo.src=item.url;hiddenVideo.loop=true;hiddenVideo.muted=true;hiddenVideo.playsInline=true;hiddenVideo.onloadeddata=()=>{platformState.mediaType='video';platformState.mediaElement=hiddenVideo;platformState.needsTextureUpdate=true;mediaTypeLabel.innerText='ATTACHED: VIDEO';mediaPreviewContainer.style.display='block';hiddenVideo.play().catch(()=>{});resolve(true)};hiddenVideo.onerror=reject}else{const img=new Image();img.onload=()=>{platformState.mediaType='image';platformState.mediaElement=img;platformState.needsTextureUpdate=true;mediaTypeLabel.innerText='ATTACHED: IMAGE';mediaPreviewContainer.style.display='block';resolve(true)};img.onerror=reject;img.src=item.url}})}
function standalone(payload){const clone=document.documentElement.cloneNode(true),head=clone.querySelector('head'),body=clone.querySelector('body');clone.querySelector('#ep-banderolas-bridge')?.remove();clone.querySelector('#ep-banderolas-integrated-style')?.remove();const style=clone.ownerDocument.createElement('style');style.textContent='#ui-panel,#overlay-text,#cursor{display:none!important}#canvas-container{width:100vw!important;flex:1!important}body{overflow:hidden!important}';head.appendChild(style);const safe=JSON.stringify(payload||{}).replace(/</g,'\\u003c');const boot=clone.ownerDocument.createElement('script');boot.textContent=\`window.addEventListener('load',()=>{const P=\${safe};const q=id=>document.getElementById(id);const set=(id,v)=>{const e=q(id);if(e){e.value=v==null?'':v;e.dispatchEvent(new Event('input',{bubbles:true}))}};set('input-title',P.config?.title);set('input-case',P.config?.caseStr);set('input-date',P.config?.date);set('input-content',P.config?.content);set('input-signature',P.config?.signature);if(P.media?.url){if(P.media.type==='video'){const v=q('hidden-video');v.src=P.media.url;v.loop=true;v.muted=true;v.playsInline=true;v.onloadeddata=()=>{platformState.mediaType='video';platformState.mediaElement=v;platformState.needsTextureUpdate=true;v.play().catch(()=>{})}}else{const im=new Image();im.onload=()=>{platformState.mediaType='image';platformState.mediaElement=im;platformState.needsTextureUpdate=true};im.src=P.media.url}}});\`;body.appendChild(boot);return '<!DOCTYPE html>\n'+clone.outerHTML}
window.BanderolasTypeB={version:'1.1.0-local-source',sourceCommit:'538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83',getState:()=>({title:platformState.title,caseStr:platformState.caseStr,date:document.getElementById('input-date').value,content:document.getElementById('input-content').value,signature:platformState.signature,mediaScale:window.__bandMediaScale,mediaX:window.__bandMediaX,mediaY:window.__bandMediaY}),setConfig:setConfig,setMedia:setMedia,clearMedia:clearMedia,getCanvas:()=>canvas,getRenderer:()=>null,getScene:()=>null,getCamera:()=>null,render:()=>{platformState.needsTextureUpdate=true},pause:()=>true,resume:()=>true,resize:()=>{window.dispatchEvent(new Event('resize'));return true},dispose:()=>{try{hiddenVideo.pause()}catch(e){}return true},capturePng:()=>canvas.toDataURL('image/png'),captureStream:(fps)=>canvas.captureStream(fps||30),standalone:standalone};
const st=document.createElement('style');st.id='ep-banderolas-integrated-style';st.textContent='#ui-panel{display:none!important}#canvas-container{width:100vw!important;flex:1!important}#overlay-text{opacity:.55}';document.head.appendChild(st);
})();
`}

function installBridge(){
  try{
    var d=frame.contentDocument,w=frame.contentWindow;
    if(!d||!w||!d.getElementById('glcanvas'))throw new Error('El engine local no expuso su canvas.');
    if(!w.BanderolasTypeB){var s=d.createElement('script');s.id='ep-banderolas-bridge';s.textContent=bridgeSource();d.body.appendChild(s)}
    if(!w.BanderolasTypeB)throw new Error('El adapter local no se inicializó.');
    runtime=w.BanderolasTypeB;
    renderAdapter=EP.AdvancedToolRenderAdapter.create(runtime);
    clearTimeout(connectTimer);loading.classList.add('hidden');status('Motor local conectado · cloth preservado · '+tool.source.commit.slice(0,8));
    pushConfig();pushMedia();return true;
  }catch(e){status('Error conectando motor local',e);return false}
}
function loadRuntime(){
  if(!tool)throw new Error('Tool no registrado');
  status('Cargando fuente local preservada…');
  frame.src=tool.source.url+'?v='+tool.source.commit.slice(0,12);
  connectTimer=setTimeout(function(){if(!runtime){status('El motor local no terminó de inicializar');loading.querySelector('.at-loading-card').innerHTML='<strong>Motor local no disponible.</strong><br><a target="_blank" style="color:#d3ad68" href="'+tool.source.fallbackUrl+'">Abrir Output V2 preservado</a>'}},5000);
}
frame.addEventListener('load',function(){setTimeout(installBridge,30)});

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
$('band-html').onclick=function(){if(!runtime)return toast('Motor no listo');readUi();var html=runtime.standalone({config:clone(state.config),media:state.media?clone(state.media):null});download('banderolas-studio-pro.html',html,'text/html');toast('Standalone HTML exportado')};
$('band-embed').onclick=async function(){if(!runtime)return toast('Motor no listo');readUi();var html=runtime.standalone({config:clone(state.config),media:state.media?clone(state.media):null}),u=URL.createObjectURL(new Blob([html],{type:'text/html'})),code='<iframe src="'+u+'" style="width:100%;aspect-ratio:16/9;border:0" allow="autoplay;fullscreen"></iframe>';try{await navigator.clipboard.writeText(code);toast('Embed temporal copiado')}catch(e){toast('Clipboard bloqueado')}};
$('band-preview-clean').onclick=function(){document.body.classList.toggle('band-clean');this.textContent=document.body.classList.contains('band-clean')?'Salir Preview':'Preview Clean'};$('band-fullscreen').onclick=function(){if(shell.requestFullscreen)shell.requestFullscreen()};

function init(){writeUi();try{loadRuntime()}catch(e){status('No se pudo cargar la fuente local',e)}}
window.addEventListener('beforeunload',function(){clearTimeout(connectTimer);if(renderAdapter)renderAdapter.dispose()});init();
})();
