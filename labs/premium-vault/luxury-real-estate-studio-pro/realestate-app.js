(function(){
  'use strict';
  var defaults = window.LuxuryRealEstateConfig;
  var Store = window.LuxuryRealEstateStore;
  var Motion = window.LuxuryRealEstateMotion;
  var state = Store.clone(defaults);
  var mediaRecords = {};
  var selectedProperty = 0;
  var saveTimer = 0;

  function qs(sel,root){ return (root||document).querySelector(sel); }
  function qsa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function getPath(obj,path){ return path.split('.').reduce(function(acc,key){ return acc && acc[key]; }, obj); }
  function setPath(obj,path,value){ var parts=path.split('.'), cur=obj; parts.slice(0,-1).forEach(function(k){ cur[k]=cur[k]||{}; cur=cur[k]; }); cur[parts[parts.length-1]]=value; }
  function esc(value){ return String(value==null?'':value').replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function attr(value){ return esc(value).replace(/`/g,'&#96;'); }
  function isVideo(url,type){ return type==='video' || /\.(mp4|webm|mov)(\?|$)/i.test(url||''); }
  function mediaUrl(slot, fallback){ var rec=mediaRecords[slot]; if(rec && rec.file) return URL.createObjectURL(rec.file); return fallback || ''; }
  function mediaType(slot, fallbackUrl, fallbackType){ var rec=mediaRecords[slot]; if(rec && rec.file) return rec.file.type.indexOf('video/')===0 ? 'video' : 'image'; return fallbackType || (isVideo(fallbackUrl) ? 'video' : 'image'); }
  function setText(id,value){ var el=qs('#'+id); if(el) el.textContent = value || ''; }
  function setHref(id,label,url){ var el=qs('#'+id); if(el){ el.textContent=label||''; el.href=url||'#'; } }
  function lang(){ return state.brand.lang === 'en' ? 'en' : 'es'; }
  function serviceItems(){ return String(state.services.itemsText||'').split('\n').map(function(x){return x.trim();}).filter(Boolean); }
  function scheduleSave(){ clearTimeout(saveTimer); var status=qs('#studio-status'); if(status){ status.textContent='Guardando'; status.dataset.state='dirty'; } saveTimer=setTimeout(save,350); }
  async function save(){ await Store.saveProject(state); var status=qs('#studio-status'); if(status){ status.textContent='Guardado'; status.dataset.state='saved'; } }

  function render(){
    document.documentElement.style.setProperty('--accent', state.brand.accent);
    document.documentElement.style.setProperty('--ink', state.brand.ink);
    document.documentElement.style.setProperty('--text', state.brand.text);
    document.body.style.backgroundColor = state.brand.ink;
    setText('brand-mark', state.brand.mark);
    setText('brand-name', state.brand.name);
    setText('studio-project-name', state.brand.name);
    setText('lang-toggle', lang().toUpperCase());
    var nav = state.nav[lang()] || state.nav.es;
    Object.keys(nav).forEach(function(key){ qsa('[data-nav="'+key+'"]').forEach(function(el){ el.textContent=nav[key]; }); });
    setText('hero-kicker', state.hero.kicker); setText('hero-line1', state.hero.line1); setText('hero-line2', state.hero.line2); setText('hero-subtitle', state.hero.subtitle); setHref('hero-cta', state.hero.ctaLabel+' ↘', state.hero.ctaUrl);
    renderHeroMedia();
    setText('about-kicker', state.about.kicker); setText('about-title', state.about.title); setText('about-text', state.about.text);
    setText('properties-kicker', state.properties.kicker); setText('properties-title', state.properties.title); setText('properties-intro', state.properties.intro); renderProperties();
    setText('services-kicker', state.services.kicker); setText('services-title', state.services.title); renderServices();
    setText('contact-kicker', state.contact.kicker); setText('contact-title', state.contact.title); setText('contact-text', state.contact.text); setHref('contact-primary', state.contact.primaryLabel, state.contact.primaryUrl); setHref('contact-secondary', state.contact.secondaryLabel, state.contact.secondaryUrl);
    setText('footer-brand', state.brand.name); setText('footer-credits', state.brand.credits); setText('footer-rights', '© 2026 · Luxury Real Estate Studio PRO');
    renderStudioFields(); renderPropertyList(); Motion.init(state);
  }

  function renderHeroMedia(){
    var host=qs('[data-media-host="hero"]'), fallback=qs('[data-media-host="heroFallback"]'); if(!host||!fallback) return;
    var url=mediaUrl('hero', state.hero.videoUrl), poster=state.hero.posterUrl;
    var type=mediaType('hero', url, isVideo(url)?'video':'image');
    fallback.innerHTML = poster ? '<img src="'+attr(poster)+'" alt="">' : '';
    if(type==='video'){
      host.innerHTML = '<video data-hero-video muted playsinline preload="auto" poster="'+attr(poster)+'"><source src="'+attr(url)+'"></video>';
      var v=qs('[data-hero-video]',host);
      v.addEventListener('loadedmetadata',function(){ try{ v.pause(); }catch(e){} host.classList.remove('media-error'); });
      v.addEventListener('error',function(){ host.classList.add('media-error'); host.innerHTML = poster ? '<img src="'+attr(poster)+'" alt="">' : ''; });
    } else host.innerHTML = '<img src="'+attr(url||poster)+'" alt="">';
  }

  function renderProperties(){
    var grid=qs('#properties-grid'); if(!grid) return; grid.innerHTML='';
    (state.properties.items||[]).filter(function(p){return p.enabled!==false;}).forEach(function(p){
      var media = p.mediaType==='video' ? '<video src="'+attr(p.mediaUrl)+'" muted playsinline loop preload="metadata"></video>' : '<img src="'+attr(p.mediaUrl)+'" alt="'+attr(p.title)+'">';
      var card=document.createElement('article'); card.className='property-card';
      card.innerHTML='<div class="property-media">'+media+'</div><div class="property-copy"><small>'+esc(p.location)+'</small><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||'')+'</p><div class="property-bottom"><strong>'+esc(p.price)+'</strong><a class="text-link" href="'+attr(p.url||'#contact')+'">'+esc(p.cta||'Ver propiedad')+'</a></div></div>';
      grid.appendChild(card);
    });
  }
  function renderServices(){
    var grid=qs('#services-grid'); if(!grid) return; grid.innerHTML='';
    state.services.items = serviceItems();
    state.services.items.forEach(function(item,i){ var el=document.createElement('article'); el.className='service-card'; el.innerHTML='<span>0'+(i+1)+'</span><strong>'+esc(item)+'</strong>'; grid.appendChild(el); });
  }
  function renderStudioFields(){
    qsa('[data-path]').forEach(function(input){ var path=input.dataset.path, value=getPath(state,path); if(document.activeElement===input) return; if(input.tagName==='SELECT') input.value=String(value); else if(input.type==='range'||input.type==='color'||input.type==='text'||input.tagName==='TEXTAREA'||input.type==='url') input.value=value==null?'':value; });
    var json=qs('#project-json'); if(json) json.value=JSON.stringify(state,null,2);
  }
  function renderPropertyList(){
    var list=qs('#property-list'); if(!list) return; list.innerHTML='';
    state.properties.items.forEach(function(p,i){ var card=document.createElement('div'); card.className='item-card'+(i===selectedProperty?' active':'')+(p.enabled===false?' hidden-item':''); card.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><div><strong>'+esc(p.title)+'</strong><small>'+esc(p.location)+' · '+esc(p.price)+'</small></div>'; card.onclick=function(){ selectedProperty=i; renderPropertyEditor(); renderPropertyList(); }; list.appendChild(card); });
    renderPropertyEditor();
  }
  function renderPropertyEditor(){
    var p=state.properties.items[selectedProperty]; if(!p) return;
    var enabled=qs('#property-enabled'); if(enabled) enabled.checked=p.enabled!==false;
    qsa('[data-property]').forEach(function(input){ if(document.activeElement===input) return; input.value=p[input.dataset.property] == null ? '' : p[input.dataset.property]; });
  }

  function bindStudio(){
    qsa('.studio-open').forEach(function(btn){ btn.addEventListener('click',function(){ qs('#studio').classList.add('open'); qs('#studio').setAttribute('aria-hidden','false'); }); });
    qs('#studio-close').addEventListener('click',function(){ qs('#studio').classList.remove('open'); qs('#studio').setAttribute('aria-hidden','true'); });
    qsa('.studio-nav button').forEach(function(btn){ btn.addEventListener('click',function(){ qsa('.studio-nav button').forEach(function(b){b.classList.remove('active')}); btn.classList.add('active'); qsa('.studio-panel').forEach(function(p){ p.hidden = p.dataset.panel !== btn.dataset.panel; }); }); });
    qsa('[data-path]').forEach(function(input){ input.addEventListener('input',function(){ var val=input.value; if(input.type==='range') val=Number(val); setPath(state,input.dataset.path,val); render(); scheduleSave(); }); });
    qsa('[data-property]').forEach(function(input){ input.addEventListener('input',function(){ var p=state.properties.items[selectedProperty]; if(!p) return; p[input.dataset.property]=input.value; render(); scheduleSave(); }); });
    qs('#property-enabled').addEventListener('change',function(){ var p=state.properties.items[selectedProperty]; if(p){ p.enabled=this.checked; render(); scheduleSave(); } });
    qs('#property-add').onclick=function(){ state.properties.items.push({enabled:true,title:'Nueva propiedad',location:'Costa Blanca',price:'€0',cta:'Ver propiedad',url:'#contact',mediaType:'image',mediaUrl:state.hero.posterUrl,description:'Descripción de la propiedad.'}); selectedProperty=state.properties.items.length-1; render(); scheduleSave(); };
    qs('#property-duplicate').onclick=function(){ var p=Store.clone(state.properties.items[selectedProperty]); p.title+=' copia'; state.properties.items.splice(selectedProperty+1,0,p); selectedProperty++; render(); scheduleSave(); };
    qs('#property-up').onclick=function(){ if(selectedProperty>0){ var a=state.properties.items; var tmp=a[selectedProperty-1]; a[selectedProperty-1]=a[selectedProperty]; a[selectedProperty]=tmp; selectedProperty--; render(); scheduleSave(); } };
    qs('#property-down').onclick=function(){ var a=state.properties.items; if(selectedProperty<a.length-1){ var tmp=a[selectedProperty+1]; a[selectedProperty+1]=a[selectedProperty]; a[selectedProperty]=tmp; selectedProperty++; render(); scheduleSave(); } };
    qs('#property-delete').onclick=function(){ if(state.properties.items.length>1){ state.properties.items.splice(selectedProperty,1); selectedProperty=Math.max(0,selectedProperty-1); render(); scheduleSave(); } };
    qsa('[data-preview-target]').forEach(function(btn){ btn.onclick=function(){ qs(btn.dataset.previewTarget).scrollIntoView({behavior:'smooth',block:'start'}); }; });
    qsa('[data-preview]').forEach(function(btn){ btn.onclick=function(){ document.body.dataset.preview=btn.dataset.preview; }; });
    qs('#lang-toggle').onclick=function(){ state.brand.lang = lang()==='es'?'en':'es'; render(); scheduleSave(); };
    qs('#export-json').onclick=function(){ var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='luxury-real-estate-studio-pro.json'; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},1000); };
    qs('#import-json').addEventListener('change',function(){ var file=this.files&&this.files[0]; if(!file) return; var reader=new FileReader(); reader.onload=function(){ try{ state=Object.assign(Store.clone(defaults), JSON.parse(reader.result)); render(); scheduleSave(); }catch(e){ alert('JSON no válido'); } }; reader.readAsText(file); });
    qs('#reset-project').onclick=async function(){ if(confirm('Resetear proyecto y media local?')){ await Store.reset(); state=Store.clone(defaults); mediaRecords={}; selectedProperty=0; render(); scheduleSave(); } };
    qsa('.media-upload').forEach(function(input){ input.addEventListener('change',async function(){ var file=this.files&&this.files[0]; if(!file) return; await Store.saveMedia(this.dataset.slot,file); mediaRecords=await Store.loadMedia(); render(); scheduleSave(); }); });
  }
  async function boot(){ state = await Store.loadProject(defaults); mediaRecords = await Store.loadMedia(); bindStudio(); render(); }
  window.addEventListener('DOMContentLoaded',boot);
})();
