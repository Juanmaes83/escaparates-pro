(function(){
'use strict';
window.EP=window.EP||{};
var manager=new EP.ProjectManager.Manager({onStatus:setCloudStatus,onProject:function(){}}),modal,body,statusEl,current=null;
function $(id){return document.getElementById(id)}
function hasSession(){return Boolean(EP.ProjectClient&&EP.ProjectClient.hasSession&&EP.ProjectClient.hasSession())}
function cloudReady(){return hasSession()&&navigator.onLine}
function studioReadOnly(){return Boolean(EP.StudioRuntime&&EP.StudioRuntime.isReadOnly&&EP.StudioRuntime.isReadOnly())}
function setCloudStatus(state){
  if(!statusEl)return;
  statusEl.dataset.state=state;
  var map={local:'Modo local · sesión no iniciada','saved-local':'Proyecto guardado localmente ✓',synced:'Guardado en la nube ✓',syncing:'Sincronizando…',pending:'Cloud disponible · cambios pendientes',offline:'Sin conexión','api-error':'API no disponible',conflict:'Conflicto de versión',readonly:'Proyecto no compatible · solo lectura',error:'Error cloud'};
  statusEl.querySelector('span:last-child').textContent=map[state]||state;
}
function updateCloudControls(){
  var save=$('cloudSave'),versions=$('versionsBtn'),exportButton=$('exportProject');
  if(!save||!versions||!exportButton)return;
  var readOnly=studioReadOnly(),session=hasSession(),online=navigator.onLine;
  save.disabled=readOnly||!session||!online;
  versions.disabled=readOnly||!session||!online;
  exportButton.disabled=readOnly;
  if(readOnly){
    save.title='Proyecto no compatible en modo solo lectura';
    versions.title='Proyecto no compatible en modo solo lectura';
    exportButton.title='Solo se permite exportar el JSON original desde el editor';
    setCloudStatus('readonly');
  }else if(!session){
    save.title='Inicia sesión para guardar en la nube';
    versions.title='Las versiones cloud requieren iniciar sesión';
    exportButton.title='Exportar o publicar el proyecto';
    setCloudStatus('local');
  }else if(!online){
    save.title='Sin conexión a Internet';
    versions.title='Sin conexión a Internet';
    exportButton.title='Exportar o publicar el proyecto';
    setCloudStatus('offline');
  }else{
    save.title='Guardar este proyecto en la nube';
    versions.title='Consultar y restaurar versiones';
    exportButton.title='Exportar o publicar el proyecto';
    setCloudStatus('pending');
  }
}
async function latestLocal(){
  if(studioReadOnly())throw new Error('Proyecto no compatible en modo solo lectura.');
  var name=($('projectName')&&$('projectName').value)||'',list=await EP.ProjectStoreLocal.list();
  current=list.find(function(project){return project.name===name})||list[0]||null;
  if(!current){
    current=EP.ProjectStoreLocal.normalize({name:name||'Proyecto sin título',templateId:(document.querySelector('.tab.active')&&document.querySelector('.tab.active').dataset&&document.querySelector('.tab.active').dataset.templateId)||'',templateKind:'scroll',config:{},media:[]});
  }
  return current;
}
function buildHtml(){var frame=$('preview');return frame&&frame.srcdoc||''}
function openModal(title,html){$('phase2Title').textContent=title;body.innerHTML=html;modal.classList.add('open')}
function closeModal(){modal.classList.remove('open')}
function reportHtml(report){var checks=report.checks||{};return '<div class="phase2-checks">'+[['Plantilla Custom PRO',checks.template],['Sin URLs temporales',checks.noTemporaryUrls],['Assets preparados',checks.assetsReady],['Enlaces válidos',checks.linksValid],['Fuentes autorizadas',checks.fontsReady]].map(function(item){return '<div class="phase2-check '+(item[1]?'ok':'bad')+'">'+(item[1]?'OK ':'NO ')+item[0]+'</div>'}).join('')+'</div>'}
function readonlyMessage(){openModal('Proyecto no compatible','<p>Este proyecto está protegido en modo solo lectura. Solo puedes descargar el JSON original desde el editor.</p>')}
async function saveCloud(){
  if(studioReadOnly()){readonlyMessage();return}
  if(!hasSession()){openModal('Inicia sesión','<p>El proyecto está guardado localmente. Inicia sesión para guardarlo también en la nube.</p>');return}
  if(!navigator.onLine){setCloudStatus('offline');openModal('Sin conexión','<p>El proyecto sigue guardado localmente. Conéctate a Internet para sincronizarlo.</p>');return}
  var project=await latestLocal();setCloudStatus('syncing');
  try{current=project.cloudId?await manager.save(project):await manager.create(project);setCloudStatus('synced')}catch(error){setCloudStatus(navigator.onLine?'api-error':'offline');openModal('Sincronización cloud','<p>'+error.message+'</p><p>El proyecto sigue guardado localmente.</p>')}
}
async function showExport(){
  if(studioReadOnly()){readonlyMessage();return}
  var project=await latestLocal(),html=buildHtml(),report=EP.ExportValidator.validate(project,html);
  openModal('Exportar proyecto',reportHtml(report)+'<div class="phase2-grid"><button class="phase2-option" id="doHtml"><strong>HTML completo</strong><span>Landing final con URLs persistentes.</span></button><button class="phase2-option" id="doZip"><strong>ZIP portable</strong><span>HTML, assets, manifest y README.</span></button><button class="phase2-option" id="doEmbed"><strong>Copiar embed</strong><span>Iframe responsive para otra web.</span></button><button class="phase2-option" id="doPublish"><strong>Publicar</strong><span>Genera o actualiza el enlace alojado.</span></button></div>');
  $('doHtml').onclick=function(){try{var out=EP.HtmlExport.build(project,html);EP.HtmlExport.download(out)}catch(error){alert((error.report&&error.report.errors.map(function(item){return item.message}).join('\n'))||error.message)}};
  $('doZip').onclick=async function(){try{this.disabled=true;this.textContent='Preparando ZIP…';var out=await EP.ZipExport.build(project,html);EP.ZipExport.download(out)}catch(error){alert(error.message)}finally{this.disabled=false;this.textContent='ZIP portable'}};
  $('doEmbed').onclick=async function(){if(!project.published||!project.published.url){alert('Publica primero el proyecto para obtener una URL HTTPS.');return}var code=EP.EmbedExport.responsive(project.published.url,{title:project.name});await EP.EmbedExport.copy(code);openModal('Código embed','<textarea class="phase2-code" readonly>'+code.replace(/</g,'&lt;')+'</textarea>')};
  $('doPublish').onclick=function(){publishProject(project,html)};
}
async function publishProject(project,html){
  if(studioReadOnly()){readonlyMessage();return}
  var report=EP.ExportValidator.validate(project,html);
  if(!report.ok){openModal('Publicación bloqueada',reportHtml(report));return}
  if(!project.cloudId){openModal('Proyecto no sincronizado','<p>Guarda primero el proyecto en la nube.</p>');return}
  try{setCloudStatus('syncing');await EP.ProjectVersioning.create(project,'Antes de publicar','publish');project=await manager.publish(project,{html:html,slug:EP.HtmlExport.slug(project.name)});current=project;setCloudStatus('synced');openModal('Proyecto publicado','<p>URL pública:</p><textarea class="phase2-code" readonly>'+(project.published&&project.published.url||'')+'</textarea>')}catch(error){setCloudStatus('api-error');openModal('Error de publicación','<p>'+error.message+'</p>')}
}
async function showVersions(){
  if(studioReadOnly()){readonlyMessage();return}
  if(!cloudReady()){openModal(hasSession()?'Sin conexión':'Inicia sesión',hasSession()?'<p>Conéctate a Internet para consultar versiones cloud.</p>':'<p>Las versiones cloud requieren iniciar sesión.</p>');return}
  var project=await latestLocal(),result=await EP.ProjectVersioning.list(project),items=(result.cloud||[]).concat(result.local||[]);
  openModal('Versiones del proyecto',items.length?items.map(function(version){return '<div class="phase2-version"><div><strong>'+(version.label||'Versión')+'</strong><small>'+(version.createdAt||'')+'</small></div><button class="btn" data-version="'+(version.id||'')+'">Restaurar</button></div>'}).join(''):'<p>No hay versiones todavía.</p>');
  body.querySelectorAll('[data-version]').forEach(function(button){button.onclick=async function(){var version=items.find(function(item){return item.id===button.dataset.version});if(version){await EP.ProjectVersioning.restore(project,version);location.reload()}}});
}
function observeLocalStatus(){var localStatus=$('status');if(!localStatus)return;new MutationObserver(function(){if(!hasSession()&&!studioReadOnly()&&/Guardado localmente/.test(localStatus.textContent||''))setCloudStatus('saved-local')}).observe(localStatus,{childList:true,characterData:true,subtree:true})}
function inject(){
  var side=document.querySelector('.side');if(!side||$('phase2Bar'))return;
  var bar=document.createElement('div');bar.id='phase2Bar';bar.className='phase2-bar';bar.innerHTML='<div class="phase2-status" id="phase2Status" data-state="local"><span class="phase2-dot"></span><span>Modo local</span></div><button class="btn" id="cloudSave">Guardar cloud</button><button class="btn" id="versionsBtn">Versiones</button><button class="btn primary" id="exportProject">Exportar / Publicar</button>';side.appendChild(bar);statusEl=$('phase2Status');$('cloudSave').onclick=saveCloud;$('versionsBtn').onclick=showVersions;$('exportProject').onclick=showExport;
  modal=document.createElement('div');modal.id='phase2Modal';modal.className='phase2-modal';modal.innerHTML='<div class="phase2-card"><div class="phase2-head"><h2 id="phase2Title">Studio</h2><button class="btn" id="phase2Close">Cerrar</button></div><div id="phase2Body"></div></div>';document.body.appendChild(modal);body=$('phase2Body');$('phase2Close').onclick=closeModal;modal.onclick=function(event){if(event.target===modal)closeModal()};window.addEventListener('online',updateCloudControls);window.addEventListener('offline',updateCloudControls);window.addEventListener('EP_STUDIO_READ_ONLY_CHANGE',updateCloudControls);observeLocalStatus();updateCloudControls();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
