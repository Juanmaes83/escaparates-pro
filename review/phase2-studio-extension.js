(function(){
'use strict';
window.EP=window.EP||{};
var manager=new EP.ProjectManager.Manager({onStatus:setCloudStatus,onProject:function(){}}),modal,body,statusEl,current=null;
function $(id){return document.getElementById(id)}
function hasSession(){return Boolean(EP.ProjectClient&&EP.ProjectClient.hasSession&&EP.ProjectClient.hasSession())}
function cloudReady(){return hasSession()&&navigator.onLine}
function setCloudStatus(state){
  if(!statusEl)return;
  statusEl.dataset.state=state;
  var map={
    local:'Modo local · sesión no iniciada',
    'saved-local':'Proyecto guardado localmente ✓',
    synced:'Guardado en la nube ✓',
    syncing:'Sincronizando…',
    pending:'Cloud disponible · cambios pendientes',
    offline:'Sin conexión',
    'api-error':'API no disponible',
    conflict:'Conflicto de versión',
    error:'Error cloud'
  };
  statusEl.querySelector('span:last-child').textContent=map[state]||state;
}
function updateCloudControls(){
  var save=$('cloudSave'),versions=$('versionsBtn');
  if(!save||!versions)return;
  var session=hasSession(),online=navigator.onLine;
  save.disabled=!session||!online;
  versions.disabled=!session||!online;
  if(!session){
    save.title='Inicia sesión para guardar en la nube';
    versions.title='Las versiones cloud requieren iniciar sesión';
    setCloudStatus('local');
  }else if(!online){
    save.title='Sin conexión a Internet';
    versions.title='Sin conexión a Internet';
    setCloudStatus('offline');
  }else{
    save.title='Guardar este proyecto en la nube';
    versions.title='Consultar y restaurar versiones';
    setCloudStatus('pending');
  }
}
async function latestLocal(){
  var name=($('projectName')&&$('projectName').value)||'';
  var list=await EP.ProjectStoreLocal.list();
  current=list.find(function(p){return p.name===name})||list[0]||null;
  if(!current){
    current=EP.ProjectStoreLocal.normalize({name:name||'Proyecto sin título',templateId:(document.querySelector('.tab.active')&&document.querySelector('.tab.active').dataset&&document.querySelector('.tab.active').dataset.templateId)||'',templateKind:'scroll',config:{},media:[]});
  }
  return current;
}
function buildHtml(){var frame=$('preview');return frame&&frame.srcdoc||''}
function openModal(title,html){$('phase2Title').textContent=title;body.innerHTML=html;modal.classList.add('open')}
function closeModal(){modal.classList.remove('open')}
function reportHtml(report){
  var c=report.checks||{};
  return '<div class="phase2-checks">'+[['Plantilla Custom PRO',c.template],['Sin URLs temporales',c.noTemporaryUrls],['Assets preparados',c.assetsReady],['Enlaces válidos',c.linksValid],['Fuentes autorizadas',c.fontsReady]].map(function(x){return '<div class="phase2-check '+(x[1]?'ok':'bad')+'">'+(x[1]?'OK ':'NO ')+x[0]+'</div>'}).join('')+'</div>';
}
async function saveCloud(){
  if(!hasSession()){
    openModal('Inicia sesión','<p>El proyecto está guardado localmente. Inicia sesión para guardarlo también en la nube.</p>');
    return;
  }
  if(!navigator.onLine){
    setCloudStatus('offline');
    openModal('Sin conexión','<p>El proyecto sigue guardado localmente. Conéctate a Internet para sincronizarlo.</p>');
    return;
  }
  var p=await latestLocal();
  setCloudStatus('syncing');
  try{
    current=p.cloudId?await manager.save(p):await manager.create(p);
    setCloudStatus('synced');
  }catch(e){
    setCloudStatus(navigator.onLine?'api-error':'offline');
    openModal('Sincronización cloud','<p>'+e.message+'</p><p>El proyecto sigue guardado localmente.</p>');
  }
}
async function showExport(){
  var p=await latestLocal(),html=buildHtml(),r=EP.ExportValidator.validate(p,html);
  openModal('Exportar proyecto',reportHtml(r)+'<div class="phase2-grid"><button class="phase2-option" id="doHtml"><strong>HTML completo</strong><span>Landing final con URLs persistentes.</span></button><button class="phase2-option" id="doZip"><strong>ZIP portable</strong><span>HTML, assets, manifest y README.</span></button><button class="phase2-option" id="doEmbed"><strong>Copiar embed</strong><span>Iframe responsive para otra web.</span></button><button class="phase2-option" id="doPublish"><strong>Publicar</strong><span>Genera o actualiza el enlace alojado.</span></button></div>');
  $('doHtml').onclick=function(){try{var out=EP.HtmlExport.build(p,html);EP.HtmlExport.download(out)}catch(e){alert((e.report&&e.report.errors.map(function(x){return x.message}).join('\n'))||e.message)}};
  $('doZip').onclick=async function(){try{this.disabled=true;this.textContent='Preparando ZIP…';var out=await EP.ZipExport.build(p,html);EP.ZipExport.download(out)}catch(e){alert(e.message)}finally{this.disabled=false;this.textContent='ZIP portable'}};
  $('doEmbed').onclick=async function(){if(!p.published||!p.published.url){alert('Publica primero el proyecto para obtener una URL HTTPS.');return}var code=EP.EmbedExport.responsive(p.published.url,{title:p.name});await EP.EmbedExport.copy(code);openModal('Código embed','<textarea class="phase2-code" readonly>'+code.replace(/</g,'&lt;')+'</textarea>')};
  $('doPublish').onclick=function(){publishProject(p,html)};
}
async function publishProject(p,html){
  var r=EP.ExportValidator.validate(p,html);
  if(!r.ok){openModal('Publicación bloqueada',reportHtml(r));return}
  if(!p.cloudId){openModal('Proyecto no sincronizado','<p>Guarda primero el proyecto en la nube.</p>');return}
  try{
    setCloudStatus('syncing');
    await EP.ProjectVersioning.create(p,'Antes de publicar','publish');
    p=await manager.publish(p,{html:html,slug:EP.HtmlExport.slug(p.name)});
    current=p;
    setCloudStatus('synced');
    openModal('Proyecto publicado','<p>URL pública:</p><textarea class="phase2-code" readonly>'+(p.published&&p.published.url||'')+'</textarea>');
  }catch(e){setCloudStatus('api-error');openModal('Error de publicación','<p>'+e.message+'</p>')}
}
async function showVersions(){
  if(!cloudReady()){
    openModal(hasSession()?'Sin conexión':'Inicia sesión',hasSession()?'<p>Conéctate a Internet para consultar versiones cloud.</p>':'<p>Las versiones cloud requieren iniciar sesión.</p>');
    return;
  }
  var p=await latestLocal(),result=await EP.ProjectVersioning.list(p),items=(result.cloud||[]).concat(result.local||[]);
  openModal('Versiones del proyecto',items.length?items.map(function(v){return '<div class="phase2-version"><div><strong>'+(v.label||'Versión')+'</strong><small>'+(v.createdAt||'')+'</small></div><button class="btn" data-version="'+(v.id||'')+'">Restaurar</button></div>'}).join(''):'<p>No hay versiones todavía.</p>');
  body.querySelectorAll('[data-version]').forEach(function(btn){btn.onclick=async function(){var v=items.find(function(x){return x.id===btn.dataset.version});if(v){await EP.ProjectVersioning.restore(p,v);location.reload()}}});
}
function observeLocalStatus(){
  var localStatus=$('status');
  if(!localStatus)return;
  new MutationObserver(function(){
    if(!hasSession()&&/Guardado localmente/.test(localStatus.textContent||''))setCloudStatus('saved-local');
  }).observe(localStatus,{childList:true,characterData:true,subtree:true});
}
function inject(){
  var side=document.querySelector('.side');
  if(!side||$('phase2Bar'))return;
  var bar=document.createElement('div');
  bar.id='phase2Bar';
  bar.className='phase2-bar';
  bar.innerHTML='<div class="phase2-status" id="phase2Status" data-state="local"><span class="phase2-dot"></span><span>Modo local</span></div><button class="btn" id="cloudSave">Guardar cloud</button><button class="btn" id="versionsBtn">Versiones</button><button class="btn primary" id="exportProject">Exportar / Publicar</button>';
  side.appendChild(bar);
  statusEl=$('phase2Status');
  $('cloudSave').onclick=saveCloud;
  $('versionsBtn').onclick=showVersions;
  $('exportProject').onclick=showExport;
  modal=document.createElement('div');
  modal.id='phase2Modal';
  modal.className='phase2-modal';
  modal.innerHTML='<div class="phase2-card"><div class="phase2-head"><h2 id="phase2Title">Studio</h2><button class="btn" id="phase2Close">Cerrar</button></div><div id="phase2Body"></div></div>';
  document.body.appendChild(modal);
  body=$('phase2Body');
  $('phase2Close').onclick=closeModal;
  modal.onclick=function(e){if(e.target===modal)closeModal()};
  window.addEventListener('online',updateCloudControls);
  window.addEventListener('offline',updateCloudControls);
  observeLocalStatus();
  updateCloudControls();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
