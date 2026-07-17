(function(){
'use strict';
function params(){return new URLSearchParams(location.search)}
function tabFor(id){
  var def=EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.get&&EP.StudioTemplateRegistry.get(id);
  var label=def&&(def.shortTitle||def.title);
  if(!label){
    var status=document.getElementById('status');
    if(status)status.textContent='Plantilla no reconocida; se mantiene la plantilla por defecto.';
    return null;
  }
  return Array.from(document.querySelectorAll('.tab')).find(function(button){return button.textContent.trim()===label})||null;
}
function openTemplate(id){var tab=tabFor(id);if(tab&&!tab.classList.contains('active'))tab.click()}
function addProductNavigation(){
  var toolbar=document.querySelector('.toolbar');
  if(!toolbar||document.getElementById('studioBackCatalog'))return;
  var back=document.createElement('a');
  back.id='studioBackCatalog';
  back.className='btn';
  back.href='index.html';
  back.textContent='← Catálogo';
  back.setAttribute('aria-label','Volver al catálogo de Escaparates Pro');
  toolbar.insertBefore(back,toolbar.firstChild);
}
function waitForList(projectName,tries){
  tries=tries||0;
  var rows=Array.from(document.querySelectorAll('#projectList .media-card'));
  var row=rows.find(function(item){var title=item.querySelector('strong');return title&&title.textContent===projectName});
  if(row){
    var button=Array.from(row.querySelectorAll('button')).find(function(item){return item.textContent.trim()==='Abrir'});
    if(button)button.click();
    return;
  }
  if(tries<30)setTimeout(function(){waitForList(projectName,tries+1)},100);
}
async function openProject(id){
  var project=null;
  try{project=await EP.ProjectStoreLocal.get(id)}catch(_error){}
  if(!project&&EP.ProjectClient&&EP.ProjectClient.hasSession()){
    try{
      var remote=await EP.ProjectClient.api.get(id);
      project=remote.project||remote;
      if(project)project=await EP.ProjectStoreLocal.save(project);
    }catch(error){
      var status=document.getElementById('status');
      if(status)status.textContent='No se pudo abrir el proyecto cloud: '+error.message;
    }
  }
  if(!project)return;
  if(EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.normalizeProject)project=EP.StudioTemplateRegistry.normalizeProject(project);
  openTemplate(project.templateId);
  var button=document.getElementById('projectsBtn');
  if(button)button.click();
  waitForList(project.name);
}
function loadR2Bridge(){
  if(window.EP&&EP.StudioR2Bridge)return Promise.resolve();
  return new Promise(function(resolve,reject){
    var script=document.createElement('script');
    script.src='js/projects/studio-r2-bridge.js';
    script.onload=resolve;
    script.onerror=function(){reject(new Error('No se pudo cargar el puente R2 del Studio.'))};
    document.head.appendChild(script);
  });
}
async function init(){
  addProductNavigation();
  await loadR2Bridge();
  var query=params(),template=query.get('template'),project=query.get('project');
  if(template)openTemplate(template);
  if(project)await openProject(project);
}
function start(){
  setTimeout(function(){
    init().catch(function(error){var status=document.getElementById('status');if(status)status.textContent=error.message});
  },80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
