(function(){
'use strict';
window.EP=window.EP||{};
var CUSTOM_BY_NAME={
  'Real Estate Storytelling — Custom PRO':'real-estate-storytelling-custom-pro',
  'Product Storytelling — Custom PRO':'product-storytelling-custom-pro',
  'Luxury Real Estate — Custom Blueprint PRO':'luxury-real-estate-custom-pro',
  'Luxury Real Estate — Custom PRO':'luxury-real-estate-custom-pro'
};
function addStyles(){
  if(document.getElementById('pcProductStyles'))return;
  var style=document.createElement('style');
  style.id='pcProductStyles';
  style.textContent=[
    '.pc-studio-link{display:inline-flex;align-items:center;justify-content:center;margin-top:9px;padding:7px 10px;border-radius:8px;border:1px solid #d3ad68;background:#d3ad68;color:#090909!important;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:.02em}',
    '.pc-studio-link:hover{filter:brightness(1.08)}',
    '.ss-template-card.pc-custom-pro{border-color:rgba(211,173,104,.5)}',
    '.pc-studio-top{white-space:nowrap;border-color:rgba(211,173,104,.72)!important;color:#f1d390!important}',
    '.pc-projects-top{white-space:nowrap}',
    '@media(max-width:1180px){.pc-projects-top{display:none}}',
    '@media(max-width:720px){.pc-studio-top{padding-left:8px!important;padding-right:8px!important;font-size:0!important}.pc-studio-top:after{content:"Studio";font-size:11px}}'
  ].join('');
  document.head.appendChild(style);
}
function addTopLinks(){
  var host=document.querySelector('.top-right');
  if(!host)return;
  if(!document.getElementById('btn-product-studio')){
    var studio=document.createElement('a');
    studio.id='btn-product-studio';
    studio.className='top-action top-action-ghost pc-studio-top';
    studio.href='studio.html';
    studio.title='Abrir el Studio de las plantillas Custom PRO';
    studio.textContent='Studio';
    host.insertBefore(studio,host.firstChild);
  }
  if(!document.getElementById('btn-project-cloud')){
    var projects=document.createElement('a');
    projects.id='btn-project-cloud';
    projects.className='top-action top-action-ghost pc-projects-top';
    projects.href='projects.html';
    projects.title='Abrir la biblioteca de proyectos';
    projects.textContent='Mis proyectos';
    var studioLink=document.getElementById('btn-product-studio');
    host.insertBefore(projects,studioLink?studioLink.nextSibling:host.firstChild);
  }
}
function resolveCard(card){
  var explicit=card.getAttribute('data-sector-blueprint');
  if(explicit==='luxury-real-estate-custom-pro')return explicit;
  var name=card.querySelector('.ss-name');
  return name?CUSTOM_BY_NAME[name.textContent.trim()]||null:null;
}
function enhance(container){
  if(!container)return;
  container.querySelectorAll('.ss-template-card').forEach(function(card){
    var id=resolveCard(card);
    if(!id||card.querySelector('.pc-studio-link'))return;
    card.classList.add('pc-custom-pro');
    var link=document.createElement('a');
    link.className='pc-studio-link';
    link.href='studio.html?template='+encodeURIComponent(id);
    link.textContent='Personalizar en Studio';
    link.addEventListener('click',function(event){event.stopPropagation();});
    var body=card.querySelector('div:nth-child(2)')||card;
    body.appendChild(link);
  });
}
function scan(){
  enhance(document.getElementById('scroll-sections-catalog'));
  enhance(document.getElementById('sector-blueprints-catalog'));
}
function init(){
  addStyles();
  addTopLinks();
  scan();
  ['scroll-sections-catalog','sector-blueprints-catalog'].forEach(function(id){
    var element=document.getElementById(id);
    if(element)new MutationObserver(scan).observe(element,{childList:true,subtree:true});
  });
}
EP.ProjectCloudProduct={init:init,scan:scan};
})();