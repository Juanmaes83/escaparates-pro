(function(){
  var state = CinematicFrameStore.load();
  var motion = null;
  var activeTab = 'sequence';
  var tabs = [['sequence','Secuencia'],['brand','Marca'],['product','Producto'],['beats','Capítulos'],['motion','Motion'],['project','Proyecto']];
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]; }); }
  function set(path, value){ var keys=path.split('.'), target=state; while(keys.length>1) target=target[keys.shift()]; target[keys[0]]=value; CinematicFrameStore.save(state); render(); }
  function sequenceHelp(){
    return '<div class="studio-help"><span class="studio-help-kicker">GUÍA RÁPIDA</span><h3>Convierte frames numerados en una película interactiva por scroll</h3><p>Este módulo sirve para producto, comida, bebida, lujo, coche, hotel o campaña. La parte importante no es el código: es preparar bien la secuencia visual.</p><div class="help-grid"><section><h4>Qué tiene que preparar el usuario</h4><ul><li>Una carpeta o ZIP con imágenes numeradas.</li><li>Todos los frames con el mismo tamaño y formato.</li><li>Un primer frame potente que funcione como poster.</li><li>Opcional: vídeo fallback para móvil o carga rápida.</li></ul></section><section><h4>Cómo debe nombrarlo</h4><pre>mi-producto/\n  frame_001.jpg\n  frame_002.jpg\n  frame_003.jpg\n  ...\n  frame_240.jpg</pre></section></div><div class="help-checklist"><strong>Checklist antes de probar</strong><label><input type="checkbox"> Tengo los frames numerados en orden</label><label><input type="checkbox"> He indicado la URL base o carpeta pública</label><label><input type="checkbox"> El patrón coincide: frame_###.jpg</label><label><input type="checkbox"> He puesto el número real de frames</label><label><input type="checkbox"> He probado scroll completo y móvil</label></div><p class="help-warning"><strong>Errores comunes:</strong> frame count incorrecto, nombres no consecutivos, imágenes de distinto tamaño, carpeta base mal escrita o frames demasiado pesados.</p><p class="help-tip"><strong>Consejo:</strong> empieza con 120–240 frames optimizados. Para una demo muy cinematográfica puedes usar más; Big Kahuna usa una secuencia larga de 822 frames.</p></div>';
  }
  function field(label,path,value,type){ type=type||'text'; return '<label class="field"><span>'+label+'</span><input data-path="'+path+'" type="'+type+'" value="'+esc(value)+'"></label>'; }
  function area(label,path,value){ return '<label class="field"><span>'+label+'</span><textarea data-path="'+path+'">'+esc(value)+'</textarea></label>'; }
  function render(){
    document.documentElement.style.setProperty('--frame-primary', state.brand.primary);
    document.documentElement.style.setProperty('--frame-secondary', state.brand.secondary);
    document.documentElement.style.setProperty('--frame-accent', state.brand.accent);
    document.getElementById('app').innerHTML = '<main class="frame-site"><section class="frame-scroll" id="frame-scroll" style="height:'+Math.max(260,state.sequence.scrollLength)+'vh"><div class="frame-stage"><video class="fallback-video" src="'+esc(state.sequence.videoFallback)+'" muted loop playsinline autoplay></video><img id="frame-image" alt="Frame sequence preview"><div class="frame-shade"></div><div class="hero-copy"><span>'+esc(state.brand.eyebrow)+'</span><h1>'+esc(state.brand.headline)+'</h1><p>'+esc(state.brand.subheadline)+'</p><a href="'+esc(state.product.ctaUrl)+'">'+esc(state.product.ctaLabel)+'</a></div><div class="beat-card" id="beat-card"></div><div class="frame-counter" id="frame-counter"></div><div class="scroll-progress"><i id="scroll-progress-bar"></i></div></div></section><section class="product-content"><span>'+esc(state.product.category)+'</span><h2>'+esc(state.content.sectionTitle)+'</h2><p>'+esc(state.content.sectionText)+'</p><div class="content-cards">'+state.content.cards.map(function(c){return '<article><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>';}).join('')+'</div></section><section class="product-cta" id="product-cta"><p>'+esc(state.product.title)+'</p><h2>'+esc(state.product.ctaLabel)+'</h2><a href="'+esc(state.product.ctaUrl)+'">Activar producto</a></section></main>';
    if(motion && motion.destroy) motion.destroy();
    CinematicFrameMotion.preload(state.sequence, function(p){ document.body.style.setProperty('--preload', p + '%'); });
    motion = CinematicFrameMotion.bind(state,{ scroller:document.getElementById('frame-scroll'), image:document.getElementById('frame-image'), beat:document.getElementById('beat-card'), counter:document.getElementById('frame-counter'), progress:document.getElementById('scroll-progress-bar') });
    renderStudio();
  }
  function renderStudio(){
    var tabsEl=document.getElementById('studio-tabs'), body=document.getElementById('studio-body');
    tabsEl.innerHTML=tabs.map(function(t){return '<button class="'+(activeTab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>';}).join('');
    var html='';
    if(activeTab==='sequence') html=sequenceHelp()+field('Base URL frames','sequence.baseUrl',state.sequence.baseUrl)+field('Patrón','sequence.pattern',state.sequence.pattern)+field('Frame count','sequence.frameCount',state.sequence.frameCount,'number')+field('Preload count','sequence.preloadCount',state.sequence.preloadCount,'number')+field('Frame poster','sequence.posterFrame',state.sequence.posterFrame,'number')+field('Video fallback','sequence.videoFallback',state.sequence.videoFallback)+'<p class="hint">Preset Big Kahuna usa MCDONALDS/public/mcdonalds_animations sin copiar 822 frames dentro de Escaparates Pro. Para otro producto cambia URL base, patrón y frame count.</p>';
    if(activeTab==='brand') html=field('Nombre marca','brand.name',state.brand.name)+field('Eyebrow','brand.eyebrow',state.brand.eyebrow)+area('Headline','brand.headline',state.brand.headline)+area('Subheadline','brand.subheadline',state.brand.subheadline)+field('Color primario','brand.primary',state.brand.primary,'color')+field('Color fondo','brand.secondary',state.brand.secondary,'color')+field('Color acento','brand.accent',state.brand.accent,'color');
    if(activeTab==='product') html=field('Título producto','product.title',state.product.title)+field('Categoría','product.category',state.product.category)+field('CTA label','product.ctaLabel',state.product.ctaLabel)+field('CTA URL','product.ctaUrl',state.product.ctaUrl);
    if(activeTab==='beats') html=state.beats.map(function(b,i){return '<div class="beat-editor"><h3>Capítulo '+(i+1)+'</h3>'+field('Label','beats.'+i+'.label',b.label)+field('Progreso 0-1','beats.'+i+'.at',b.at,'number')+field('Título','beats.'+i+'.title',b.title)+area('Texto','beats.'+i+'.text',b.text)+'</div>';}).join('')+'<button class="secondary" id="add-beat">Añadir capítulo</button>';
    if(activeTab==='motion') html=field('Longitud scroll vh','sequence.scrollLength',state.sequence.scrollLength,'number')+field('Mobile frame step','sequence.mobileFrameStep',state.sequence.mobileFrameStep,'number')+'<p class="hint">Controla cuánto dura la película y cuántos frames se saltan en móvil para aligerar carga.</p>';
    if(activeTab==='project') html='<button id="export-json">Export JSON</button><label class="upload">Import JSON<input id="import-json" type="file" accept="application/json"></label><button class="danger" id="reset-project">Reset preset Big Kahuna</button><p class="hint">Estado REVIEW hasta validar web + Studio + persistencia.</p>';
    body.innerHTML=html; bindStudio();
  }
  function bindStudio(){
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.onclick=function(){ activeTab=b.dataset.tab; renderStudio(); }; });
    document.querySelectorAll('[data-path]').forEach(function(input){ input.onchange=function(){ var val=input.type==='number'?parseFloat(input.value):input.value; set(input.dataset.path,val); }; });
    var add=document.getElementById('add-beat'); if(add) add.onclick=function(){ state.beats.push({id:'new',at:0.5,label:String(state.beats.length+1).padStart(2,'0'),title:'Nuevo capítulo',text:'Describe este punto de la secuencia.'}); CinematicFrameStore.save(state); render(); };
    var ex=document.getElementById('export-json'); if(ex) ex.onclick=function(){ CinematicFrameStore.download(state); };
    var im=document.getElementById('import-json'); if(im) im.onchange=function(){ if(im.files[0]) CinematicFrameStore.importFile(im.files[0], function(next){ state=next; CinematicFrameStore.save(state); render(); }); };
    var rs=document.getElementById('reset-project'); if(rs) rs.onclick=function(){ state=CinematicFrameStore.reset(); render(); };
  }
  document.getElementById('studio-toggle').onclick=function(){ document.body.classList.add('studio-open'); };
  document.getElementById('studio-close').onclick=function(){ document.body.classList.remove('studio-open'); };
  if(new URLSearchParams(location.search).get('studio')==='1') document.body.classList.add('studio-open');
  render();
})();
