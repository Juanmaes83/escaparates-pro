(function(){
  'use strict';

  var state = window.AssemblyStore.load();
  var tab = 'final';
  var dom = {};

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function asset(file){ return state.assets.baseUrl.replace(/\/$/, '') + '/' + file; }
  function isFinalCalibration(){ return state.motion && state.motion.mode === 'calibrate-final'; }
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
    if (isFinalCalibration()) return 100;
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
    var calibrating = isFinalCalibration();
    var finalO = calibrating ? Number(state.motion.finalReferenceOpacity || 0.32) : window.AssemblyMotion.finalOpacity(progress, state.motion.finalRevealStart);
    var guideFade = calibrating ? 1 : (progress < 88 ? 1 : Math.max(0, 1 - ((progress - 88) / 10)));

    q('assembly-progress-bar').style.width = progress + '%';
    q('assembly-hero').classList.toggle('is-calibrating-final', calibrating);
    ghost.style.opacity = calibrating ? '0' : String(Number(state.motion.ghostOpacity || 0) * guideFade);
    base.style.opacity = calibrating ? '0' : String(Number(state.motion.baseGuideOpacity || 0) * guideFade);
    final.style.opacity = String(finalO);

    var html = state.pieces.map(function(p){
      return '<img class="assembly-piece" id="piece-'+esc(p.id)+'" src="'+esc(asset(p.file))+'" alt="'+esc(p.name)+'" style="z-index:'+Number(p.z || 1)+'">';
    }).join('');
    if (layer.dataset.html !== html) { layer.innerHTML = html; layer.dataset.html = html; }

    state.pieces.forEach(function(p){
      var el = q('piece-' + p.id);
      if (!el) return;
      var t = window.AssemblyMotion.transformFor(p, progress, state.motion);
      var pieceOpacity = calibrating ? 1 : t.opacity * (1 - finalO);
      el.style.opacity = String(pieceOpacity);
      el.style.transform = 'translate(calc(-50% + '+t.x+'px), calc(-50% + '+t.y+'px)) rotate('+t.rotation+'deg) scale('+t.scale+')';
      el.classList.toggle('settled', !!t.settled || calibrating);
    });
  }

  function input(label, path, value, type){
    type = type || 'text';
    return '<label class="field"><span>'+label+'</span><input data-path="'+path+'" type="'+type+'" value="'+esc(value)+'"></label>';
  }
  function select(label, path, value, options){
    return '<label class="field"><span>'+label+'</span><select data-path="'+path+'">'+options.map(function(o){return '<option value="'+esc(o[0])+'" '+(String(value)===String(o[0])?'selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select></label>';
  }
  function range(label, path, value, min, max, step){
    return '<label class="field"><span>'+label+' <b>'+esc(value)+'</b></span><input data-path="'+path+'" type="range" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+esc(value)+'"></label>';
  }
  function finalEditor(piece, i){
    return '<details class="piece-card" '+(i===0?'open':'')+'><summary><strong>'+esc(piece.name)+'</strong><span>Estado B · '+esc(piece.file)+'</span></summary>'+ 
      input('Archivo', 'pieces.'+i+'.file', piece.file) +
      range('X final', 'pieces.'+i+'.x', piece.x, -520, 520) +
      range('Y final', 'pieces.'+i+'.y', piece.y, -520, 620) +
      range('Escala final', 'pieces.'+i+'.scale', piece.scale, 0.3, 1.8, 0.01) +
      range('Rotación final', 'pieces.'+i+'.rotation', piece.rotation || 0, -45, 45) +
      range('Z-index final', 'pieces.'+i+'.z', piece.z, 1, 40) +
    '</details>';
  }
  function scatterEditor(piece, i){
    return '<details class="piece-card" '+(i===0?'open':'')+'><summary><strong>'+esc(piece.name)+'</strong><span>Estado A · dispersión</span></summary>'+
      range('Origen X', 'pieces.'+i+'.fromX', piece.fromX, -900, 900) +
      range('Origen Y', 'pieces.'+i+'.fromY', piece.fromY, -900, 900) +
      range('Rotación entrada', 'pieces.'+i+'.fromRot', piece.fromRot, -60, 60) +
      range('Inicio scroll', 'pieces.'+i+'.start', piece.start, 0, 100) +
      range('Fin scroll', 'pieces.'+i+'.end', piece.end, 0, 100) +
    '</details>';
  }

  function renderGuide(mode){
    if (mode === 'final') {
      return '<section class="studio-guide"><p class="guide-kicker">ESTADO B CALIBRATION</p><h3>Primero el samurái perfecto</h3><p>Esta pantalla arranca por el final. La imagen samurai2.png queda como referencia semitransparente y las piezas reales se colocan encima. El objetivo no es animar todavía: es comprobar si las piezas encajan con el samurái completo.</p><div class="guide-grid"><div><strong>1. Final primero</strong><span>No tocar dispersión hasta cerrar el encaje.</span></div><div><strong>2. Canvas lock</strong><span>Si las piezas comparten canvas, X/Y/scale deben quedar cerca de 0/0/1.</span></div><div><strong>3. Z-index</strong><span>Ordenar capas antes de culpar a la imagen.</span></div><div><strong>4. Sólo después</strong><span>Dispersar e invertir A → B.</span></div></div><ul class="guide-check"><li>La figura ensamblada debe coincidir con samurai2.png.</li><li>Si una pieza no coincide, ajustar sólo esa pieza.</li><li>No entregar enlace final hasta validación visual real.</li></ul></section>';
    }
    return '<section class="studio-guide"><p class="guide-kicker">A → B TRANSITION</p><h3>Del desorden al orden</h3><p>Cuando el Estado B esté perfecto, esta zona define el Estado A: piezas dispersas pero bellas, listas para invertir el viaje.</p><div class="guide-grid"><div><strong>A</strong><span>Desorden diseñado.</span></div><div><strong>B</strong><span>Orden calibrado.</span></div><div><strong>Scroll</strong><span>Interpolación limpia.</span></div><div><strong>Snap</strong><span>Cierre magnético.</span></div></div></section>';
  }

  function renderPanel(){
    var tabs = [ ['final','Estado B'], ['scatter','Estado A'], ['motion','Transición'], ['brand','Marca'], ['project','Proyecto'] ];
    q('studio-tabs').innerHTML = tabs.map(function(t){ return '<button class="'+(tab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'; }).join('');
    var body = '';
    if (tab === 'final') body = renderGuide('final') + state.pieces.map(finalEditor).join('');
    if (tab === 'scatter') body = renderGuide('scatter') + state.pieces.map(scatterEditor).join('');
    if (tab === 'motion') body = renderGuide('scatter') + select('Modo actual', 'motion.mode', state.motion.mode || 'calibrate-final', [['calibrate-final','Calibrar Estado B'],['animate','Animar A → B']]) + range('Progreso manual', 'motion.manualProgress', state.motion.manualProgress, 0, 100) + range('Opacidad referencia final', 'motion.finalReferenceOpacity', state.motion.finalReferenceOpacity || 0.32, 0, 0.7, 0.01) + range('Opacidad ghost', 'motion.ghostOpacity', state.motion.ghostOpacity, 0, 0.45, 0.005) + range('Inicio revelado final', 'motion.finalRevealStart', state.motion.finalRevealStart, 78, 100) + range('Snap strength', 'motion.snapStrength', state.motion.snapStrength, 0, 1, 0.01) + range('Stop-motion intensity', 'motion.stopMotion', state.motion.stopMotion, 0, 0.2, 0.01) + '<label class="toggle"><input type="checkbox" data-path="motion.scrollMode" '+(state.motion.scrollMode?'checked':'')+'> Control por scroll en modo animación</label>';
    if (tab === 'brand') body = input('Eyebrow','brand.eyebrow',state.brand.eyebrow) + input('Título','brand.title',state.brand.title) + input('Subtítulo','brand.subtitle',state.brand.subtitle) + input('Heading','content.heading',state.content.heading) + input('Texto','content.body',state.content.body) + input('CTA','content.cta',state.content.cta) + input('CTA URL','content.ctaUrl',state.content.ctaUrl);
    if (tab === 'project') body = '<div class="project-actions"><button id="export-json">Export JSON</button><label class="import-btn">Import JSON<input id="import-json" type="file" accept="application/json"></label><button id="reset-project">Reset</button></div><p class="project-note">Estado REVIEW / NEEDS_REBUILD. La estrategia cambia: primero Estado B perfecto, después Estado A, después transición invertida.</p>';
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
    q('studio-body').onchange = q('studio-body').oninput;
    q('studio-body').onclick = function(e){
      if (e.target.id === 'export-json') window.AssemblyStore.download(state);
      if (e.target.id === 'reset-project') { state = window.AssemblyStore.reset(); tab = 'final'; render(); }
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
