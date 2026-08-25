(function(){
  'use strict';
  window.EP=window.EP||{};

  var entries=[
    {id:'restaurant-premium',name:'Restauración Premium — Dish Journey',group:'Web completa / Restauración',status:'COMPLETE',note:'Web de restauración premium aprobada: experiencia visual completa, navegable y con panel de personalización según validación del proyecto. Se muestra dentro del Vault sin sacar al usuario de Escaparates Pro.',preview:'https://raw.githack.com/Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/class7-dish-journey-premium/index.html'},
    {id:'eloria',name:'ELORIA Signature',group:'Beauty / Product',status:'COMPLETE',note:'Experiencia de perfume validada en Escaparates Pro: scroll-driven bottle journey con frasco protagonista y panel personalizable existente.',open:{mode:'mode-btn-sector-blueprints',text:'Luxury Beauty Product'}},
    {id:'luxury-beauty',name:'Luxury Beauty Product PRO',group:'Beauty / Product',status:'COMPLETE',note:'Blueprint personalizable de beauty/fragrance con producto protagonista, escenas, contenidos, colección, media y journey configurable.',open:{mode:'mode-btn-sector-blueprints',text:'Luxury Beauty Product'}},
    {id:'luxury-real-estate-custom',name:'Luxury Real Estate — Custom Blueprint PRO',group:'Web completa / Inmobiliaria',status:'COMPLETE',note:'Web inmobiliaria premium completa con panel profundo de marca, hero, propiedades, contacto, media, color y motion.',open:{mode:'mode-btn-sector-blueprints',text:'Luxury Real Estate — Custom'}},
    {id:'luxury-real-estate-source',name:'Luxury Real Estate — Source Faithful PRO',group:'Web completa / Inmobiliaria',status:'PARTIAL',note:'Versión fuente preservada. Tiene valor visual, pero no debe marcarse como completa hasta confirmar panel de personalización equivalente.',open:{mode:'mode-btn-sector-blueprints',text:'Luxury Real Estate — Source Faithful'}},
    {id:'story-custom',name:'Real Estate Storytelling — Custom PRO',group:'Storytelling / Scroll',status:'COMPLETE',note:'Storytelling inmobiliario con panel configurable: vídeo, fases, CTA, color, longitud, scrub y smoothing.',open:{mode:'mode-btn-scroll-sections',text:'Real Estate Storytelling — Custom'}},
    {id:'story-source',name:'Real Estate Storytelling — Source Faithful',group:'Storytelling / Scroll',status:'PARTIAL',note:'Fuente preservada del recorrido inmobiliario scroll-driven. Falta confirmar paridad completa de panel.',open:{mode:'mode-btn-scroll-sections',text:'Real Estate Storytelling — Source Faithful'}},
    {id:'bidirectional',name:'Real Estate Bidirectional Story PRO',group:'Storytelling / Scroll',status:'PARTIAL',note:'Evolución bidireccional preservada. Debe validarse preview y panel antes de cambiarla a COMPLETE.',open:{mode:'mode-btn-scroll-sections',text:'Real Estate Bidirectional'}},
    {id:'product-scroll',name:'Product Scroll Storytelling PRO',group:'Storytelling / Scroll',status:'PARTIAL',note:'Storytelling de producto sincronizado al scroll. Capacidad preservada; falta validar panel completo.',open:{mode:'mode-btn-scroll-sections',text:'Product Scroll Storytelling'}},
    {id:'breeze',name:'Breeze Museum Authoring Studio',group:'3D / Immersive',status:'PARTIAL',note:'Authoring nativo existente. Debe conservarse, pero falta puente de panel lateral Escaparates para considerarlo módulo completo de la plataforma.',preview:'labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=./worlds/museum-v1.world.json'},
    {id:'rubik-brand',name:'Rubik SOTA — Immersive Brand Landing',group:'Brand / Scroll Journey',status:'NO_PANEL',note:'Landing fuente importante. No existe todavía adaptador/panel Escaparates validado dentro de la plataforma.'},
    {id:'aurum',name:'AURUM Properties Boutique',group:'Web completa / Inmobiliaria',status:'NO_PANEL',note:'Fuente inmobiliaria boutique preservada. No tiene todavía panel Escaparates conectado.'},
    {id:'immersphere-pro',name:'IMMERSPHERE PRO Inmobiliarias',group:'Web completa / Inmobiliaria',status:'NO_PANEL',note:'Evolución inmobiliaria inmersiva preservada. Panel Escaparates pendiente.'},
    {id:'immersphere-premium',name:'Inmobiliaria Premium IMMERSPHERE',group:'Web completa / Inmobiliaria',status:'NO_PANEL',note:'Segunda evolución IMMERSPHERE preservada. No se absorbe ni reemplaza la anterior. Panel pendiente.'},
    {id:'rubik-real-estate',name:'Rubik Sota Inmobiliaria Premium',group:'Web completa / Inmobiliaria',status:'PRESERVED',note:'Fuente original preservada junto a sus adaptaciones Source Faithful y Custom PRO. No se elimina.'},
    {id:'story-source-repo',name:'Inmobiliaria Storytelling Scroll Premium',group:'Storytelling / Scroll',status:'PRESERVED',note:'Fuente original del recorrido scroll inmobiliario preservada junto a sus adaptaciones. No se elimina.'}
  ];

  function findCard(text){
    var cards=document.querySelectorAll('.ss-template-card');
    text=(text||'').toLowerCase();
    for(var i=0;i<cards.length;i++) if((cards[i].textContent||'').toLowerCase().indexOf(text)!==-1) return cards[i];
    return null;
  }

  function openInternal(item){
    deactivate();
    var mode=document.getElementById(item.open.mode); if(mode) mode.click();
    setTimeout(function(){var c=findCard(item.open.text); if(c)c.click();},180);
  }

  function style(){
    var s=document.createElement('style');
    s.textContent='#pvf{position:fixed;inset:48px 0 0;z-index:260;background:#0c0c0e;display:none;color:#eee;font-family:var(--font,Arial)}#pvf.active{display:grid;grid-template-columns:330px 1fr 330px}.pvf-list{overflow:auto;padding:14px;border-right:1px solid #28282d;background:#121214}.pvf-head{padding:8px 8px 16px}.pvf-head small{font-size:10px;color:#8f8f97;letter-spacing:.12em}.pvf-head h2{margin:5px 0 7px}.pvf-card{padding:12px;border:1px solid #29292f;border-radius:8px;margin:0 0 8px;background:#18181b;cursor:pointer}.pvf-card:hover,.pvf-card.active{border-color:#4f8cff;background:#1d2330}.pvf-card b{display:block;margin-bottom:4px}.pvf-meta{font-size:10px;color:#8f8f97}.pvf-status{display:inline-block;margin-top:7px;font-size:9px;font-weight:900;letter-spacing:.07em}.pvf-status.COMPLETE{color:#85f0a6}.pvf-status.PARTIAL{color:#8fc5ff}.pvf-status.NO_PANEL{color:#ffc46b}.pvf-status.PRESERVED{color:#c5a7ff}.pvf-center{position:relative;background:#09090a}.pvf-center iframe{width:100%;height:100%;border:0;display:none}.pvf-empty{position:absolute;inset:0;display:grid;place-items:center;padding:50px;text-align:center;color:#8e8e96}.pvf-empty strong{display:block;color:white;font-size:28px;margin-bottom:10px}.pvf-panel{padding:18px;border-left:1px solid #28282d;background:#141417;overflow:auto}.pvf-panel h2{margin:7px 0}.pvf-panel p{color:#aaa;line-height:1.5}.pvf-action{width:100%;margin-top:12px;padding:11px;border:0;border-radius:7px;background:#4f8cff;color:white;font-weight:800;cursor:pointer}.pvf-action.secondary{background:#26262b;border:1px solid #333}.pvf-close{position:absolute;right:14px;top:12px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid #333;background:#17171a;color:#fff;cursor:pointer}@media(max-width:980px){#pvf.active{grid-template-columns:280px 1fr}.pvf-panel{position:absolute;right:0;top:0;bottom:0;width:320px}}';
    document.head.appendChild(s);
  }

  function inject(){
    if(document.getElementById('mode-btn-premium-vault-functional'))return;
    var modes=document.getElementById('app-mode-toggle'); if(!modes)return;
    var btn=document.createElement('button'); btn.className='mode-btn'; btn.id='mode-btn-premium-vault-functional'; btn.textContent='Vault'; btn.title='Premium Experiences Vault'; modes.appendChild(btn);
    var shell=document.createElement('section'); shell.id='pvf'; shell.innerHTML='<div class="pvf-list"><div class="pvf-head"><small>PREMIUM EXPERIENCES VAULT</small><h2>Vault</h2><div class="pvf-meta">Familia integrada dentro de Escaparates Pro. COMPLETE = web + panel. PARTIAL = falta validar o completar panel. NO_PANEL = merece panel, pero aún no existe.</div></div><div id="pvf-cards"></div></div><div class="pvf-center"><button class="pvf-close" id="pvf-close">×</button><iframe id="pvf-frame" title="Preview"></iframe><div class="pvf-empty" id="pvf-empty"><div><strong>Vault</strong>Selecciona un módulo para ver su estado y abrir preview/panel sin salir de Escaparates Pro.</div></div></div><aside class="pvf-panel" id="pvf-panel"></aside>';
    document.body.appendChild(shell);
    var box=document.getElementById('pvf-cards'); entries.forEach(function(item){var c=document.createElement('div');c.className='pvf-card';c.dataset.id=item.id;c.innerHTML='<b>'+item.name+'</b><div class="pvf-meta">'+item.group+'</div><span class="pvf-status '+item.status+'">'+item.status+'</span>';c.onclick=function(){select(item);};box.appendChild(c);});
    btn.onclick=activate; document.getElementById('pvf-close').onclick=deactivate;
  }

  function select(item){
    document.querySelectorAll('.pvf-card').forEach(function(c){c.classList.toggle('active',c.dataset.id===item.id);});
    var frame=document.getElementById('pvf-frame'),empty=document.getElementById('pvf-empty');
    if(item.preview){frame.style.display='block';frame.src=item.preview;empty.style.display='none';}else{frame.style.display='none';frame.removeAttribute('src');empty.style.display='grid';empty.innerHTML='<div><strong>'+item.name+'</strong>'+item.note+'</div>';}
    var p=document.getElementById('pvf-panel');p.innerHTML='<small>'+item.group+'</small><h2>'+item.name+'</h2><div class="pvf-status '+item.status+'">'+item.status+'</div><p>'+item.note+'</p>';
    if(item.open){var b=document.createElement('button');b.className='pvf-action';b.textContent='Abrir módulo y panel dentro de Escaparates Pro';b.onclick=function(){openInternal(item);};p.appendChild(b);}    
    if(item.preview){var v=document.createElement('button');v.className='pvf-action secondary';v.textContent='Ver preview en el visor central';v.onclick=function(){frame.style.display='block';frame.src=item.preview;empty.style.display='none';};p.appendChild(v);}
  }

  function activate(){
    var shell=document.getElementById('pvf'); if(!shell)return;
    shell.classList.add('active');
    var b=document.getElementById('mode-btn-premium-vault-functional'); if(b)b.classList.add('active');
  }
  function deactivate(){var s=document.getElementById('pvf');if(s)s.classList.remove('active');var b=document.getElementById('mode-btn-premium-vault-functional');if(b)b.classList.remove('active');}
  function init(){style();inject();if(new URLSearchParams(location.search).get('vault')==='1')setTimeout(activate,120);}
  EP.PremiumVaultFunctional={init:init,entries:entries.slice(),activate:activate,deactivate:deactivate};
})();
