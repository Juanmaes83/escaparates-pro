(function(){
  'use strict';

  var state = window.AssemblyStore.load();
  var tab = 'pieces';
  var dom = {};

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function asset(file){ return state.assets.baseUrl.replace(/\/$/, '') + '/' + file; }
  function persist(){ window.AssemblyStore.save(state); render(); }

  function bindText(){
    document.querySelectorAll('[data-bind]').forEach(function(el){
      var path = el.getAttribute('data-bind').split('.');
      var v = state;
      path.forEach(function(p){ v = v && v[p]; });
      el.textContent = v || '';
    });
    q('assembly-cta').href = state.content.ctaUrl || '#';
  }

  function scrollProgress(){
    if (!state.motion.scrollMode) return Number(state.motion.manualProgress || 0);
    var hero = q('assembly-hero');
    var rect = hero.getBoundingClientRect();
    var max = Math.max(1, hero.offsetHeight - window.innerHeight);
    return window.AssemblyMotion.clamp((-rect.top / max) * 100, 0, 100);
  }

  function renderFigure(){
    var base = q('base-image'), final = q('final-image'), ghost = q('ghost-final'), layer = q('pieces-layer');
    if (!base || !final || !ghost || !layer) return;
    base.src = asset(state.assets.baseImage);
    final.src = asset(state.assets.finalImage);
    ghost.src = asset(state.assets.finalImage);

    var progress = scrollProgress();
    var finalO = window.AssemblyMotion.finalOpacity(progress, state.motion.finalRevealStart);
    var guideFade = progress < 88 ? 1 : Math.max(0, 1 - ((progress - 88) / 10));

    q('assembly-progress-bar').style.width = progress + '%';
    ghost.style.opacity = String(Number(state.motion.ghostOpacity || 0) * guideFade);
    base.style.opacity = String(Number(state.motion.baseGuideOpacity || 0) * guideFade);
    final.style.opacity = String(finalO);

    var html = state.pieces.map(function(p){
      return '<img class="assembly-piece" id="piece-'+esc(p.id)+'" src="'+esc(asset(p.file))+'" alt="'+esc(p.name)+'" style="z-index:'+Number(p.z || 1)+'">';
    }).join('');
    if (layer.dataset.html !== html) { layer.innerHTML = html; layer.dataset.html = html; }

    state.pieces.forEach(function(p){
      var el = q('piece-' + p.id);
      if (!el) return;
      var t = window.AssemblyMotion.transformFor(p, progress, state.motion);
      var pieceOpacity = t.opacity * (1 - finalO);
      el.style.opacity = String(pieceOpacity);
      el.style.transform = 'translate(calc(-50% + '+t.x+'px), calc(-50% + '+t.y+'px)) rotate('+t.rotation+'deg) scale('+t.scale+')';
      el.classList.toggle('settled', !!t.settled);
    });
  }

  function input(label, path, value, type){
    type = type || 'text';
    return '<label class="field"><span>'+label+'</span><input data-path="'+path+'" type="'+type+'" value="'+esc(value)+'"></label>';
  }
  function range(label, path, value, min, max, step){
    return '<label class="field"><span>'+label+' <b>'+esc(value)+'</b></span><input data-path="'+path+'" type="range" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+esc(value)+'"></label>';
  }
  function pieceEditor(piece, i){
    return '<details class="piece-card" '+(i===0?'open':'')+'><summary><strong>'+esc(piece.name)+'</strong><span>'+esc(piece.file)+'</span></summary>'+ 
      input('Archivo', 'pieces.'+i+'.file', piece.file) +
      range('X final', 'pieces.'+i+'.x', piece.x, -520, 520) +
      range('Y final', 'pieces.'+i+'.y', piece.y, -520, 620) +
      range('Escala final', 'pieces.'+i+'.scale', piece.scale, 0.3, 1.8, 0.01) +
      range('Rotación final', 'pieces.'+i+'.rotation', piece.rotation || 0, -45, 45) +
      range('Z-index', 'pieces.'+i+'.z', piece.z, 1, 40) +
      range('Inicio scroll', 'pieces.'+i+'.start', piece.start, 0, 100) +
      range('Fin scroll', 'pieces.'+i+'.end', piece.end, 0, 100) +
      range('Origen X', 'pieces.'+i+'.fromX', piece.fromX, -900, 900) +
      range('Origen Y', 'pieces.'+i+'.fromY', piece.fromY, -900, 900) +
      range('Rotación entrada', 'pieces.'+i+'.fromRot', piece.fromRot, -60, 60) +
    '</details>';
  }

  function renderGuide(){
    return '<section class="studio-guide"><p class="guide-kicker">GUÍA RÁPIDA</p><h3>Resolver el puzzle visual, no esconderlo</h3><p>Primero separa las piezas. Después calibra X/Y/scale/z-index contra una guía casi invisible. La imagen final sólo aparece al 94% para verificar que el encaje ya funciona.</p><div class="guide-grid"><div><strong>1. Separación</strong><span>Al inicio no debe parecer montado.</span></div><div><strong>2. Guía sutil</strong><span>Ghost bajo: referencia, no protagonista.</span></div><div><strong>3. Snap</strong><span>El final debe sentirse imantado.</span></div><div><strong>4. Validación</strong><span>No COMPLETE hasta que Juanma vea encaje limpio.</span></div></div><div class="guide-example"><code>body → shoulders → helmet → arms → final reveal</code></div><ul class="guide-check"><li>Corregir posición final antes de motion.</li><li>Revisar z-index antes de retocar assets.</li><li>La figura no debe cortarse durante el hero sticky.</li></ul></section>';
  }

  function renderPanel(){
    var tabs = [ ['pieces','Piezas'], ['motion','Motion'], ['brand','Marca'], ['project','Proyecto'] ];
    q('studio-tabs').innerHTML = tabs.map(function(t){ return '<button class="'+(tab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'; }).join('');
    var body = '';
    if (tab === 'pieces') body = renderGuide() + state.pieces.map(pieceEditor).join('');
    if (tab === 'motion') body = renderGuide() + range('Progreso manual', 'motion.manualProgress', state.motion.manualProgress, 0, 100) + range('Opacidad ghost final', 'motion.ghostOpacity', state.motion.ghostOpacity, 0, 0.45, 0.005) + range('Opacidad base guía', 'motion.baseGuideOpacity', state.motion.baseGuideOpacity || 0, 0, 0.3, 0.005) + range('Inicio revelado final', 'motion.finalRevealStart', state.motion.finalRevealStart, 78, 100) + range('Snap strength', 'motion.snapStrength', state.motion.snapStrength, 0, 1, 0.01) + range('Stop-motion intensity', 'motion.stopMotion', state.motion.stopMotion, 0, 0.2, 0.01) + '<label class="toggle"><input type="checkbox" data-path="motion.scrollMode" '+(state.motion.scrollMode?'checked':'')+'> Control por scroll</label>';
    if (tab === 'brand') body = input('Eyebrow','brand.eyebrow',state.brand.eyebrow) + input('Título','brand.title',state.brand.title) + input('Subtítulo','brand.subtitle',state.brand.subtitle) + input('Heading','content.heading',state.content.heading) + input('Texto','content.body',state.content.body) + input('CTA','content.cta',state.content.cta) + input('CTA URL','content.ctaUrl',state.content.ctaUrl);
    if (tab === 'project') body = '<div class="project-actions"><button id="export-json">Export JSON</button><label class="import-btn">Import JSON<input id="import-json" type="file" accept="application/json"></label><button id="reset-project">Reset</button></div><p class="project-note">Estado REVIEW / NEEDS_REBUILD. Esta iteración corrige sticky, ghost y separación inicial; falta validación visual de Juanma.</p>';
    q('studio-body').innerHTML = body;
  }

  function bindPanelEvents(){
    q('studio-tabs').onclick = function(e){ if(e.target.dataset.tab){ tab = e.target.dataset.tab; render(); } };
    q('studio-body').oninput = function(e){
      var p = e.target.dataset.path;
      if (!p) return;
      var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (e.target.type === 'range' || e.target.type === 'number') value = Number(value);
      var parts = p.split('.');
      var obj = state;
      for (var i=0;i<parts.length-1;i++) obj = obj[parts[i]];
      obj[parts[parts.length-1]] = value;
      window.AssemblyStore.save(state);
      renderFigure(); bindText(); renderPanel(); bindPanelEvents();
    };
    q('studio-body').onclick = function(e){
      if (e.target.id === 'export-json') window.AssemblyStore.download(state);
      if (e.target.id === 'reset-project') { state = window.AssemblyStore.reset(); render(); }
    };
    var imp = q('import-json');
    if (imp) imp.onchange = function(){
      var file = imp.files && imp.files[0];
      if (!file) return;
      window.AssemblyStore.readFile(file).then(function(txt){ state = JSON.parse(txt); persist(); });
    };
  }

  function render(){ bindText(); renderFigure(); renderPanel(); bindPanelEvents(); }
  function tick(){ renderFigure(); requestAnimationFrame(tick); }

  function init(){
    dom.panel = q('studio-panel');
    q('toggle-studio').onclick = function(){ dom.panel.classList.remove('open'); };
    q('open-studio').onclick = function(){ dom.panel.classList.add('open'); };
    var params = new URLSearchParams(location.search);
    if (params.get('studio') === '1') dom.panel.classList.add('open');
    window.addEventListener('scroll', renderFigure, {passive:true});
    render(); tick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
