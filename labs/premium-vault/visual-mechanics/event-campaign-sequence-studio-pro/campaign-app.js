(function(){
  var state = EventCampaignStore.load();
  var motion = null;
  var activeTab = 'brand';
  var tabs = [
    ['brand','Marca'], ['sequence','Secuencia'], ['event','Evento'], ['moments','Momentos'], ['motion','Motion'], ['project','Proyecto']
  ];
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]; }); }
  function set(path, value){
    var keys = path.split('.'), target = state;
    while(keys.length > 1) target = target[keys.shift()];
    target[keys[0]] = value;
    EventCampaignStore.save(state);
    render();
  }
  function render(){
    document.documentElement.style.setProperty('--campaign-primary', state.brand.primary);
    document.documentElement.style.setProperty('--campaign-secondary', state.brand.secondary);
    document.documentElement.style.setProperty('--campaign-accent', state.brand.accent);
    var app = document.getElementById('app');
    app.innerHTML = '<main class="campaign-site">'
      + '<section class="sequence-scroll" id="sequence-scroll" style="height:'+Math.max(260, state.sequence.scrollLength)+'vh">'
      + '<div class="sequence-stage" id="sequence-stage">'
      + '<video class="fallback-video" src="'+esc(state.sequence.videoFallback)+'" muted loop playsinline autoplay></video>'
      + '<canvas id="sequence-canvas"></canvas><div class="sequence-overlay"></div>'
      + '<div class="hero-copy"><span>'+esc(state.brand.eyebrow)+'</span><h1>'+esc(state.brand.headline)+'</h1><p>'+esc(state.brand.subheadline)+'</p><a href="'+esc(state.event.ctaUrl)+'">'+esc(state.event.ctaLabel)+'</a></div>'
      + '<div class="moment-card" id="moment-card"></div><div class="frame-counter" id="frame-counter"></div><div class="scroll-progress"><i id="scroll-progress-bar"></i></div>'
      + '</div></section>'
      + '<section class="campaign-content"><span class="content-kicker">'+esc(state.event.date)+' · '+esc(state.event.location)+'</span><h2>'+esc(state.content.sectionTitle)+'</h2><p>'+esc(state.content.sectionText)+'</p><div class="campaign-cards">'+state.content.cards.map(function(c){return '<article><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>';}).join('')+'</div></section>'
      + '<section class="campaign-cta" id="tickets"><p>'+esc(state.event.title)+'</p><h2>'+esc(state.event.ctaLabel)+'</h2><a href="'+esc(state.event.ctaUrl)+'">Activar campaña</a></section>'
      + '</main>';
    if (motion && motion.destroy) motion.destroy();
    EventCampaignMotion.preload(state.sequence, function(p){ document.body.style.setProperty('--preload', p + '%'); });
    motion = EventCampaignMotion.bind(state, {
      scroller: document.getElementById('sequence-scroll'),
      stage: document.getElementById('sequence-stage'),
      canvas: document.getElementById('sequence-canvas'),
      moment: document.getElementById('moment-card'),
      counter: document.getElementById('frame-counter'),
      progress: document.getElementById('scroll-progress-bar')
    });
    renderStudio();
  }
  function field(label, path, value, type){
    type = type || 'text';
    return '<label class="field"><span>'+label+'</span><input data-path="'+path+'" type="'+type+'" value="'+esc(value)+'"></label>';
  }
  function area(label, path, value){
    return '<label class="field"><span>'+label+'</span><textarea data-path="'+path+'">'+esc(value)+'</textarea></label>';
  }
  function renderStudio(){
    var tabsEl = document.getElementById('studio-tabs');
    var body = document.getElementById('studio-body');
    tabsEl.innerHTML = tabs.map(function(t){return '<button class="'+(activeTab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>';}).join('');
    var html = '';
    if(activeTab==='brand') html = field('Nombre marca','brand.name',state.brand.name)+field('Eyebrow','brand.eyebrow',state.brand.eyebrow)+area('Headline','brand.headline',state.brand.headline)+area('Subheadline','brand.subheadline',state.brand.subheadline)+field('Color primario','brand.primary',state.brand.primary,'color')+field('Color fondo','brand.secondary',state.brand.secondary,'color')+field('Color acento','brand.accent',state.brand.accent,'color');
    if(activeTab==='sequence') html = field('Base URL frames','sequence.baseUrl',state.sequence.baseUrl)+field('Patrón','sequence.pattern',state.sequence.pattern)+field('Frame count','sequence.frameCount',state.sequence.frameCount,'number')+field('Preload count','sequence.preloadCount',state.sequence.preloadCount,'number')+field('Frame poster','sequence.posterFrame',state.sequence.posterFrame,'number')+field('Video fallback','sequence.videoFallback',state.sequence.videoFallback)+'<p class="hint">Preset Pepsi usa WEBPEPSI/public/pepsi_animations sin copiar frames al repo.</p>';
    if(activeTab==='event') html = field('Título evento','event.title',state.event.title)+field('Fecha','event.date',state.event.date)+field('Lugar','event.location',state.event.location)+field('CTA label','event.ctaLabel',state.event.ctaLabel)+field('CTA URL','event.ctaUrl',state.event.ctaUrl);
    if(activeTab==='moments') html = state.moments.map(function(m,i){return '<div class="moment-editor"><h3>Momento '+(i+1)+'</h3>'+field('Label','moments.'+i+'.label',m.label)+field('Progreso 0-1','moments.'+i+'.at',m.at,'number')+field('Título','moments.'+i+'.title',m.title)+area('Texto','moments.'+i+'.text',m.text)+'</div>';}).join('')+'<button class="secondary" id="add-moment">Añadir momento</button>';
    if(activeTab==='motion') html = field('Longitud scroll vh','sequence.scrollLength',state.sequence.scrollLength,'number')+field('Mobile frame step','sequence.mobileFrameStep',state.sequence.mobileFrameStep,'number')+'<p class="hint">Controla cuánto dura la película al hacer scroll y cuántos frames se saltan en móvil.</p>';
    if(activeTab==='project') html = '<button id="export-json">Export JSON</button><label class="upload">Import JSON<input id="import-json" type="file" accept="application/json"></label><button class="danger" id="reset-project">Reset preset Pepsi</button><p class="hint">Estado REVIEW hasta validar web + Studio + persistencia.</p>';
    body.innerHTML = html;
    bindStudio();
  }
  function bindStudio(){
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.onclick=function(){ activeTab=b.dataset.tab; renderStudio(); }; });
    document.querySelectorAll('[data-path]').forEach(function(input){ input.onchange=function(){ var val=input.type==='number'?parseFloat(input.value):input.value; set(input.dataset.path,val); }; });
    var add = document.getElementById('add-moment'); if(add) add.onclick=function(){ state.moments.push({id:'new',at:0.5,label:String(state.moments.length+1).padStart(2,'0'),title:'Nuevo momento',text:'Describe el momento de campaña.'}); EventCampaignStore.save(state); render(); };
    var ex = document.getElementById('export-json'); if(ex) ex.onclick=function(){ EventCampaignStore.download(state); };
    var im = document.getElementById('import-json'); if(im) im.onchange=function(){ if(im.files[0]) EventCampaignStore.importFile(im.files[0], function(next){ state=next; EventCampaignStore.save(state); render(); }); };
    var rs = document.getElementById('reset-project'); if(rs) rs.onclick=function(){ state=EventCampaignStore.reset(); render(); };
  }
  document.getElementById('studio-toggle').onclick = function(){ document.body.classList.add('studio-open'); };
  document.getElementById('studio-close').onclick = function(){ document.body.classList.remove('studio-open'); };
  if(new URLSearchParams(location.search).get('studio')==='1') document.body.classList.add('studio-open');
  render();
})();
