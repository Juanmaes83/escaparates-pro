(function(){
  'use strict';

  var state = window.AssemblyStore.load();
  var tab = 'pieces';
  var dom = {};

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function asset(file){ return state.assets.baseUrl.replace(/\/$/, '') + '/' + file; }
  function set(path, value){
    var parts = path.split('.');
    var obj = state;
    for (var i=0;i<parts.length-1;i++) obj = obj[parts[i]];
    obj[parts[parts.length-1]] = value;
    persist();
  }
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

  function renderFigure(){
    var base = q('base-image'), final = q('final-image'), ghost = q('ghost-final'), layer = q('pieces-layer');
    base.src = asset(state.assets.baseImage);
    final.src = asset(state.assets.finalImage);
    ghost.src = asset(state.assets.finalImage);
    ghost.style.opacity = state.motion.ghostOpacity;

    var progress = state.motion.manualProgress;
    if (state.motion.scrollMode) {
      var hero = q('assembly-hero');
      var max = Math.max(1, hero.offsetHeight - window.innerHeight);
      progress = window.AssemblyMotion.clamp((window.scrollY / max) * 100, 0, 100);
    }

    q('assembly-progress-bar').style.width = progress + '%';
    final.style.opacity = window.AssemblyMotion.finalOpacity(progress, state.motion.finalRevealStart);
    base.style.opacity = 1 - window.AssemblyMotion.finalOpacity(progress, state.motion.finalRevealStart - 18);

    var html = state.pieces.map(function(p){
      return '<img class="assembly-piece" id="piece-'+esc(p.id)+'" src="'+esc(asset(p.file))+'" alt="'+esc(p.name)+'" style="z-index:'+Number(p.z || 1)+'">';
    }).join('');
    if (layer.dataset.html !== html) { layer.innerHTML = html; layer.dataset.html = html; }

    state.pieces.forEach(function(p){
      var el = q('piece-' + p.id);
      if (!el) return;
      var t = window.AssemblyMotion.transformFor(p, progress, state.motion);
      el.style.opacity = String(t.opacity * (1 - window.AssemblyMotion.finalOpacity(progress, state.motion.finalRevealStart)));
      el.style.transform = 'translate(calc(-50% + '+t.x+'px), calc(-50% + '+t.y+'px)) rotate('+t.rotation+'deg) scale('+t.scale+')';
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
      range('X final', 'pieces.'+i+'.x', piece.x, -420, 420) +
      range('Y final', 'pieces.'+i+'.y', piece.y, -420, 520) +
      range('Escala final', 'pieces.'+i+'.scale', piece.scale, 0.3, 1.8, 0.01) +
      range('Rotación final', 'pieces.'+i+'.rotation', piece.rotation || 0, -45, 45) +
      range('Z-index', 'pieces.'+i+'.z', piece.z, 1, 40) +
      range('Inicio scroll', 'pieces.'+i+'.start', piece.start, 0, 100) +
      range('Fin scroll', 'pieces.'+i+'.end', piece.end, 0, 100) +
      range('Origen X', 'pieces.'+i+'.fromX', piece.fromX, -700, 700) +
      range('Origen Y', 'pieces.'+i+'.fromY', piece.fromY, -700, 700) +
      range('Rotación entrada', 'pieces.'+i+'.fromRot', piece.fromRot, -60, 60) +
    '</details>';
  }

  function renderGuide(){
    return '<section class="studio-guide"><p class="guide-kicker">GUÍA RÁPIDA</p><h3>Cómo preparar un ensamblaje que encaje bien</h3><p>Este módulo no debe ocultar los fallos con una imagen final. Debe calibrar cada pieza contra una referencia visual precisa.</p><div class="guide-grid"><div><strong>1. Imagen final</strong><span>Usa una referencia final clara. Aquí es samurai2.png.</span></div><div><strong>2. Piezas</strong><span>Cada pieza debe compartir escala lógica o ajustarse con X/Y/scale.</span></div><div><strong>3. Ghost</strong><span>Activa la silueta final para ver dónde debe encajar todo.</span></div><div><strong>4. Snap</strong><span>Ajusta el cierre para que la pieza se sienta imantada.</span></div></div><div class="guide-example"><code>assets/images/\n  samurai1.png\n  samurai2.png\n  helmet.png\n  body.png\n  shoulders.png\n  left_arm2.png\n  right_arm.png</code></div><ul class="guide-check"><li>Corregir posición final antes de tocar motion.</li><li>Ajustar z-index antes de decidir que una pieza está mal.</li><li>No marcar COMPLETE hasta que el ensamblaje sea visualmente limpio.</li></ul></section>';
  }

  function renderPanel(){
    var tabs = [ ['pieces','Piezas'], ['motion','Motion'], ['brand','Marca'], ['project','Proyecto'] ];
    q('studio-tabs').innerHTML = tabs.map(function(t){ return '<button class="'+(tab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'; }).join('');
    var body = '';
    if (tab === 'pieces') body = renderGuide() + state.pieces.map(pieceEditor).join('');
    if (tab === 'motion') body = renderGuide() + range('Progreso manual', 'motion.manualProgress', state.motion.manualProgress, 0, 100) + range('Opacidad ghost final', 'motion.ghostOpacity', state.motion.ghostOpacity, 0, 0.8, 0.01) + range('Inicio revelado final', 'motion.finalRevealStart', state.motion.finalRevealStart, 60, 100) + range('Snap strength', 'motion.snapStrength', state.motion.snapStrength, 0, 1, 0.01) + range('Stop-motion intensity', 'motion.stopMotion', state.motion.stopMotion, 0, 0.25, 0.01) + '<label class="toggle"><input type="checkbox" data-path="motion.scrollMode" '+(state.motion.scrollMode?'checked':'')+'> Control por scroll</label>';
    if (tab === 'brand') body = input('Eyebrow','brand.eyebrow',state.brand.eyebrow) + input('Título','brand.title',state.brand.title) + input('Subtítulo','brand.subtitle',state.brand.subtitle) + input('Heading','content.heading',state.content.heading) + input('Texto','content.body',state.content.body) + input('CTA','content.cta',state.content.cta) + input('CTA URL','content.ctaUrl',state.content.ctaUrl);
    if (tab === 'project') body = '<div class="project-actions"><button id="export-json">Export JSON</button><label class="import-btn">Import JSON<input id="import-json" type="file" accept="application/json"></label><button id="reset-project">Reset</button></div><p class="project-note">Estado REVIEW. Fuente Samurai real, pero reconstrucción visual necesaria hasta que las piezas ensamblen bien.</p>';
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
