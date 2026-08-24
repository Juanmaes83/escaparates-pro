(function(){
'use strict';
window.EP=window.EP||{};
var grid=document.getElementById('pcGrid'),status=document.getElementById('pcStatus'),search=document.getElementById('pcSearch'),filter=document.getElementById('pcFilter'),all=[];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function label(id){var def=EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.get&&EP.StudioTemplateRegistry.get(id);return(def&&(def.shortTitle||def.title))||{'real-estate-storytelling-custom-pro':'Real Estate Storytelling','product-storytelling-custom-pro':'Product Storytelling','luxury-real-estate-custom-pro':'Luxury Real Estate','luxury-beauty-product-pro':'Luxury Beauty Product','fashion-commerce-pro':'Fashion Commerce'}[id]||id||'Custom PRO'}
function setStatus(text,error){status.textContent=text||'';status.classList.toggle('pc-error',Boolean(error))}
function merge(local,remote){var map={};(local||[]).forEach(function(p){map[p.cloudId||p.id]=p});(remote||[]).forEach(function(p){var key=p.cloudId||p.id;map[key]=Object.assign({},map[key]||{},p)});return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))})}
function visible(){var q=(search.value||'').trim().toLowerCase(),f=filter.value;return all.filter(function(p){return(!q||String(p.name||'').toLowerCase().includes(q)||label(p.templateId).toLowerCase().includes(q))&&(!f||p.status===f)})}
function projectUrl(p){var id=encodeURIComponent(p.cloudId||p.id||'');return'studio.html?project='+id+'&template='+encodeURIComponent(p.templateId||'')}
function render(){
  var list=visible();
  if(!list.length){
    var hasFilters=Boolean((search.value||'').trim()||filter.value);
    grid.innerHTML='<div class="pc-empty">'+(all.length&&hasFilters?'No hay proyectos que coincidan con la búsqueda o los filtros.':'Todavía no tienes proyectos. Elige una plantilla Custom PRO para crear el primero.')+'</div>';
    return;
  }
  grid.innerHTML=list.map(function(p){
    var published=p.status==='published'||p.published;
    return'<article class="pc-card" data-id="'+esc(p.cloudId||p.id)+'"><div class="pc-thumb">'+esc(label(p.templateId).split(' ').map(function(x){return x[0]}).join('').slice(0,3))+'</div><div class="pc-card-body"><h2>'+esc(p.name||'Proyecto sin título')+'</h2><div class="pc-meta"><span class="pc-pill">'+esc(label(p.templateId))+'</span><span class="pc-pill">'+esc(p.status||'draft')+'</span><span class="pc-pill">'+(p.cloudId?'Cloud':'Local')+'</span></div><p class="pc-subtitle" style="font-size:12px">Actualizado '+esc(p.updatedAt?new Date(p.updatedAt).toLocaleString():'-')+'</p><div class="pc-actions"><a class="pc-btn primary" href="'+projectUrl(p)+'">Editar</a><button class="pc-btn" data-action="duplicate">Duplicar</button><button class="pc-btn" data-action="archive">'+(p.status==='archived'?'Recuperar':'Archivar')+'</button><button class="pc-btn" data-action="delete">Eliminar</button></div>'+(published?'<p class="pc-status">Publicado</p>':'')+'</div></article>';
  }).join('');
  grid.querySelectorAll('[data-action]').forEach(function(btn){btn.onclick=function(){var card=btn.closest('[data-id]'),p=all.find(function(x){return String(x.cloudId||x.id)===card.dataset.id});if(p)act(btn.dataset.action,p)}});
}
async function act(action,p){
  try{
    if(action==='duplicate'){
      var copy=EP.ProjectStoreLocal.fork?EP.ProjectStoreLocal.fork(p):JSON.parse(JSON.stringify(p));await EP.ProjectStoreLocal.save(copy);setStatus('Proyecto duplicado localmente OK');
    }else if(action==='archive'){
      var archived=p.status!=='archived';p.status=archived?'archived':'draft';await EP.ProjectStoreLocal.save(p);if(p.cloudId&&EP.ProjectClient.hasSession())await EP.ProjectClient.api.archive(p.cloudId,archived);setStatus(archived?'Proyecto archivado':'Proyecto recuperado');
    }else if(action==='delete'){
      if(!confirm('¿Eliminar este proyecto?'))return;if(p.cloudId&&EP.ProjectClient.hasSession())await EP.ProjectClient.api.remove(p.cloudId);if(p.id)await EP.ProjectStoreLocal.remove(p.id);setStatus('Proyecto eliminado');
    }
    await load();
  }catch(e){setStatus(e.message||'No se pudo completar la acción',true)}
}
async function load(){
  setStatus('Cargando proyectos…');
  var local=[],remote=[];
  try{local=await EP.ProjectStoreLocal.list()}catch(e){setStatus('No se pudo abrir IndexedDB',true)}
  if(EP.ProjectClient.hasSession()&&navigator.onLine){
    try{var result=await EP.ProjectClient.api.list({limit:100});remote=result.projects||result||[];setStatus('Biblioteca cloud sincronizada ✓')}catch(e){setStatus('Cloud no disponible; mostrando proyectos locales',true)}
  }else setStatus(navigator.onLine?'Sesión no iniciada; mostrando proyectos locales':'Sin conexión; mostrando proyectos locales');
  all=merge(local,remote);render();
}
if(EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.listCustomPro){var picker=document.querySelector('.pc-template-picker');if(picker)picker.innerHTML=EP.StudioTemplateRegistry.listCustomPro().map(function(def){return '<button class="pc-btn" data-template="'+esc(def.id)+'">'+esc(def.shortTitle||def.title)+'</button>';}).join('')}
document.querySelectorAll('[data-template]').forEach(function(btn){btn.onclick=function(){location.href='studio.html?template='+encodeURIComponent(btn.dataset.template)}});
search.oninput=render;filter.onchange=render;document.getElementById('pcRefresh').onclick=load;window.addEventListener('online',load);window.addEventListener('offline',load);load();
})();
