(function(){
  'use strict';
  window.EP=window.EP||{};

  var entries=[
    {id:'eloria',icon:'EL',name:'ELORIA New Luxury Fragrance',version:'Source + Custom PRO',sector:'Beauty / Product Journey',status:'CONNECTED',description:'Scroll-driven bottle journey con el frasco como protagonista persistente.',preview:'labs/source-experiences/eloria-luxury-fragrance-journey/',source:'https://github.com/Juanmaes83/ELORIA-New-Luxury-Fragrance',editor:{mode:'mode-btn-sector-blueprints',selector:'[data-sector-blueprint="luxury-beauty-product-pro"]'}},
    {id:'luxury-real-estate-source',icon:'LS',name:'Luxury Real Estate — Source Faithful PRO',version:'Source Faithful',sector:'Luxury Real Estate',status:'PARTIAL',description:'Versión visual fuente preservada. Panel deliberadamente limitado para proteger la referencia.',preview:'labs/source-experiences/luxury-real-estate-source-faithful/',editor:{mode:'mode-btn-sector-blueprints',selector:'[data-sector-blueprint="luxury-real-estate-source-faithful"]'}},
    {id:'luxury-real-estate-custom',icon:'LC',name:'Luxury Real Estate — Custom Blueprint PRO',version:'Custom PRO',sector:'Luxury Real Estate',status:'CONNECTED',description:'Web inmobiliaria premium completa con panel profundo, propiedades, contacto, media, color y motion.',editor:{mode:'mode-btn-sector-blueprints',selector:'[data-sector-blueprint="luxury-real-estate-custom-pro"]'}},
    {id:'storytelling-source',icon:'SS',name:'Real Estate Storytelling — Source Faithful',version:'Source Faithful',sector:'Real Estate / Scroll Story',status:'PARTIAL',description:'Recorrido inmobiliario scroll-driven preservado como referencia fuente.'},
    {id:'storytelling-custom',icon:'SC',name:'Real Estate Storytelling — Custom PRO',version:'Custom PRO',sector:'Real Estate / Scroll Story',status:'CONNECTED',description:'Narrativa inmobiliaria configurable: vídeo, cuatro fases, CTA, color, longitud, scrub y smoothing.'},
    {id:'breeze',icon:'BZ',name:'Breeze Museum Authoring Studio',version:'Authoring Studio',sector:'3D / Immersive Worlds',status:'NATIVE AUTHORING',description:'Mundo museo inmersivo con authoring nativo. Falta puente de panel lateral Escaparates.',preview:'labs/source-experiences/breeze-museum-authoring-studio/'},
    {id:'rubik-brand',icon:'RB',name:'Rubik SOTA — Immersive Brand Landing',version:'Landing + Engine',sector:'Brand / Scroll Journey',status:'PENDING',description:'Objeto/brazo robótico acompaña el scroll y migra entre secciones. Panel Escaparates pendiente.',preview:'labs/source-experiences/rubik-sota-immersive-brand-landing/',source:'https://github.com/Juanmaes83/immersive-brand-landing-rubik-sota'},
    {id:'aurum',icon:'AU',name:'AURUM Properties Boutique',version:'Independent Source',sector:'Luxury Real Estate',status:'PENDING',description:'Web inmobiliaria boutique premium preservada por separado. Panel Escaparates pendiente.',source:'https://github.com/Juanmaes83/AURUM_PROPERTIES_BOUTIQUE'},
    {id:'immersphere-pro',icon:'I1',name:'IMMERSPHERE PRO Inmobiliarias',version:'Evolution A',sector:'Immersive Real Estate',status:'PENDING',description:'Experiencia inmobiliaria inmersiva completa. Se conserva como evolución independiente.',source:'https://github.com/Juanmaes83/IMMERSPHERE-PRO-INMOBILIARIAS'},
    {id:'immersphere-premium',icon:'I2',name:'Inmobiliaria Premium IMMERSPHERE',version:'Evolution B',sector:'Immersive Real Estate',status:'PENDING',description:'Segunda evolución IMMERSPHERE. No se absorbe ni reemplaza la anterior.',source:'https://github.com/Juanmaes83/INMOBILIARIA-PREMIUM_IMMERSPHERE-'},
    {id:'rubik-real-estate-source',icon:'RR',name:'Rubik Sota Inmobiliaria Premium',version:'Original Source',sector:'Luxury Real Estate',status:'PRESERVED',description:'Repo fuente original preservado junto a sus adaptaciones Source Faithful y Custom PRO.',source:'https://github.com/Juanmaes83/Rubik-Sota-Inmobiliaria-Premium'},
    {id:'real-estate-story-source',icon:'RS',name:'Inmobiliaria Storytelling Scroll Premium',version:'Original Source',sector:'Real Estate / Scroll Story',status:'PRESERVED',description:'Repo fuente del recorrido scroll inmobiliario, conservado junto a sus adaptaciones.',source:'https://github.com/Juanmaes83/INMOBILIARIA-STORYTELLING-SCROOL-PREMIUM'},
    {id:'rubik-engine',icon:'EN',name:'Rubik SOTA Immersive Landing Engine',version:'Technical Engine',sector:'Engine / Private',status:'ENGINE',description:'Dependencia técnica privada asociada a la landing. Registrada pero no expuesta mediante enlace público.'}
  ];

  function css(){
    var style=document.createElement('style');
    style.textContent='\
#premium-vault-overlay{position:fixed;inset:48px 0 0;z-index:250;background:#0d0d0f;display:none;color:#e8e8ea;font-family:var(--font,Arial,sans-serif)}\
#premium-vault-overlay.active{display:grid;grid-template-columns:340px 1fr 320px}\
#premium-vault-catalog{overflow:auto;border-right:1px solid rgba(255,255,255,.08);padding:14px;background:#121214}\
.pv-head{padding:8px 8px 16px}.pv-head small{color:#8c8c93;text-transform:uppercase;letter-spacing:.13em}.pv-head h2{font-size:20px;margin:6px 0}.pv-card{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:8px;margin-bottom:8px;cursor:pointer;background:#17171a}.pv-card:hover,.pv-card.active{border-color:#4f8cff;background:#1d2230}.pv-icon{width:36px;height:36px;border-radius:7px;display:grid;place-items:center;background:#24242a;font-weight:800}.pv-card h3{font-size:13px;margin:0 0 4px}.pv-meta{font-size:10px;color:#8f8f97}.pv-status{display:inline-block;margin-top:6px;padding:3px 6px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.06em;background:#2a2a30}.pv-status.CONNECTED{color:#91f7b0}.pv-status.PENDING{color:#ffd38c}.pv-status.PARTIAL,.pv-status.NATIVE\ AUTHORING{color:#9cc8ff}.pv-status.ENGINE{color:#d6a3ff}\
#premium-vault-preview{position:relative;background:#09090a}.pv-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:50px;color:#8f8f97}.pv-empty strong{display:block;color:#fff;font-size:28px;margin-bottom:10px}#premium-vault-frame{width:100%;height:100%;border:0;display:none;background:#09090a}\
#premium-vault-panel{overflow:auto;border-left:1px solid rgba(255,255,255,.08);background:#151518;padding:18px}.pv-panel-status{font-size:11px;font-weight:900;letter-spacing:.08em;margin:12px 0}.pv-panel-copy{color:#a8a8af;line-height:1.55;margin-bottom:16px}.pv-action{width:100%;margin:7px 0;padding:10px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:#24242a;color:#fff;cursor:pointer;font-weight:700}.pv-action.primary{background:#4f8cff;border-color:#4f8cff}.pv-action:disabled{opacity:.45;cursor:not-allowed}.pv-close{position:absolute;right:14px;top:10px;z-index:4;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:#1b1b1f;color:#fff;cursor:pointer}\
@media(max-width:980px){#premium-vault-overlay.active{grid-template-columns:280px 1fr}#premium-vault-panel{position:absolute;right:0;top:0;bottom:0;width:310px;box-shadow:-20px 0 60px rgba(0,0,0,.5)}}';
    document.head.appendChild(style);
  }

  function inject(){
    var modes=document.getElementById('app-mode-toggle');
    if(!modes||document.getElementById('mode-btn-premium-vault'))return;
    var btn=document.createElement('button');
    btn.className='mode-btn';btn.id='mode-btn-premium-vault';btn.textContent='Vault';btn.title='Premium Experiences Vault — webs y experiencias completas preservadas';
    modes.appendChild(btn);

    var overlay=document.createElement('section');overlay.id='premium-vault-overlay';
    overlay.innerHTML='<div id="premium-vault-catalog"></div><div id="premium-vault-preview"><button class="pv-close" id="premium-vault-close">×</button><iframe id="premium-vault-frame" title="Premium Experience"></iframe><div class="pv-empty" id="premium-vault-empty"><div><strong>Premium Experiences Vault</strong>Selecciona una experiencia. Nada se elimina: las versiones originales y evoluciones permanecen disponibles.</div></div></div><aside id="premium-vault-panel"></aside>';
    document.body.appendChild(overlay);
    btn.onclick=activate;document.getElementById('premium-vault-close').onclick=deactivate;
    renderCatalog();
  }

  function renderCatalog(){
    var box=document.getElementById('premium-vault-catalog');if(!box)return;
    box.innerHTML='<div class="pv-head"><small>Familia nueva · aditiva</small><h2>Premium Experiences Vault</h2><p style="color:#8f8f97;line-height:1.45">Webs completas, scroll journeys, mundos inmersivos y evoluciones preservadas.</p></div>';
    entries.forEach(function(item){var card=document.createElement('article');card.className='pv-card';card.dataset.vault=item.id;card.innerHTML='<span class="pv-icon">'+item.icon+'</span><div><h3>'+item.name+'</h3><div class="pv-meta">'+item.sector+' · '+item.version+'</div><span class="pv-status '+item.status+'">'+item.status+'</span></div>';card.onclick=function(){select(item.id);};box.appendChild(card);});
  }

  function select(id){
    var item=entries.filter(function(x){return x.id===id;})[0];if(!item)return;
    document.querySelectorAll('.pv-card').forEach(function(card){card.classList.toggle('active',card.dataset.vault===id);});
    var frame=document.getElementById('premium-vault-frame'),empty=document.getElementById('premium-vault-empty');
    if(item.preview){frame.style.display='block';empty.style.display='none';frame.src=item.preview+'?v='+Date.now();}else{frame.style.display='none';frame.removeAttribute('src');empty.style.display='grid';empty.innerHTML='<div><strong>'+item.name+'</strong>'+item.description+'</div>';}
    var panel=document.getElementById('premium-vault-panel');
    panel.innerHTML='<small style="color:#8f8f97;text-transform:uppercase;letter-spacing:.12em">'+item.sector+'</small><h2 style="margin:8px 0 4px">'+item.name+'</h2><div class="pv-panel-status">PANEL · '+item.status+'</div><p class="pv-panel-copy">'+item.description+'</p>';
    if(item.editor){var edit=document.createElement('button');edit.className='pv-action primary';edit.textContent='Abrir panel personalizable conectado';edit.onclick=function(){openExistingEditor(item.editor);};panel.appendChild(edit);}else if(item.status==='PENDING'){var pending=document.createElement('button');pending.className='pv-action primary';pending.disabled=true;pending.textContent='Panel Escaparates pendiente de adaptador';panel.appendChild(pending);}else if(item.status==='NATIVE AUTHORING'){var nativeBtn=document.createElement('button');nativeBtn.className='pv-action primary';nativeBtn.textContent='Usar authoring nativo en el preview';nativeBtn.onclick=function(){if(item.preview){frame.style.display='block';frame.src=item.preview+'?v='+Date.now();}};panel.appendChild(nativeBtn);}
    if(item.source){var source=document.createElement('button');source.className='pv-action';source.textContent='Abrir repo fuente';source.onclick=function(){window.open(item.source,'_blank','noopener');};panel.appendChild(source);}
    var note=document.createElement('p');note.className='pv-panel-copy';note.style.marginTop='16px';note.textContent='Regla Vault: esta entrada es adicional. No sustituye ni elimina ninguna copia existente en Blueprints, Scroll Sections, Source Labs o RUBIK SOTA.';panel.appendChild(note);
  }

  function openExistingEditor(editor){
    deactivate();
    var mode=document.getElementById(editor.mode);if(mode)mode.click();
    setTimeout(function(){var card=document.querySelector(editor.selector);if(card)card.click();},80);
  }

  function activate(){
    var overlay=document.getElementById('premium-vault-overlay');if(!overlay)return;
    ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-source-labs','mode-btn-interactive-boards','mode-btn-rubik-tools'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('active');});
    document.getElementById('mode-btn-premium-vault').classList.add('active');overlay.classList.add('active');
  }
  function deactivate(){var overlay=document.getElementById('premium-vault-overlay');if(overlay)overlay.classList.remove('active');var b=document.getElementById('mode-btn-premium-vault');if(b)b.classList.remove('active');}
  function init(){css();inject();}

  EP.PremiumExperiencesVault={init:init,getAll:function(){return entries.slice();},activate:activate,deactivate:deactivate};
})();