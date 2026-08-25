(function(){
  'use strict';

  var state = window.AssemblyStore.load();
  var tab = 'motion';
  var dom = {};

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function asset(file){ return state.assets.baseUrl.replace(/\/$/, '') + '/' + file; }
  function progress(){
    if (!state.motion.scrollMode) return Number(state.motion.manualProgress || 0);
    var hero = q('assembly-hero');
    var rect = hero.getBoundingClientRect();
    var max = Math.max(1, hero.offsetHeight - window.innerHeight);
    return window.AssemblyMotion.clamp((-rect.top / max) * 100, 0, 100);
  }

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
    var p = progress();
    var base = q('base-image');
    var final = q('final-image');
    var layer = q('pieces-layer');
    if (!base || !final || !layer) return;

    base.src = asset(state.assets.baseImage);
    final.src = asset(state.assets.finalImage);
    q('assembly-progress-bar').style.width = p + '%';

    var finalO = window.AssemblyMotion.finalOpacity(p, state.motion.finalRevealStart);
    var baseO = window.AssemblyMotion.baseFade(p, state.motion.finalRevealStart) * Number(state.motion.baseOpacity || 1);
    base.style.opacity = String(baseO);
    final.style.opacity = String(finalO);
    var scale = 1 + ((Number(state.motion.finalScale || 1.05) - 1) * finalO);
    final.style.transform = 'translate(-50%, -50%) scale('+scale+')';

    var html = state.pieces.map(function(piece){
      return '<img class="assembly-piece" id="piece-'+esc(piece.id)+'" src="'+esc(asset(piece.file))+'" alt="'+esc(piece.name)+'" style="z-index:'+Number(piece.z || 1)+'">';
    }).join('');
    if (layer.dataset.html !== html) { layer.innerHTML = html; layer.dataset.html = html; }

    state.pieces.forEach(function(piece){
      var el = q('piece-' + piece.id);
      if (!el) return;
      var t = window.AssemblyMotion.transformFor(piece, p, state.motion);
      el.style.opacity = String(t.opacity * (1 - finalO));
      el.style.transform = 'translate(calc(-50% + '+t.x+'px), calc(-50% + '+t.y+'px)) rotate('+t.rotation+'deg) scale('+t.scale+')';
      el.classList.toggle('settled', !!t.settled);
    });
  }

  function renderCards(){
    var grid = q('armor-grid');
    if (!grid || grid.dataset.rendered === '1') return;
    grid.innerHTML = (state.cards || []).map(function(card){
      return '<article class="armor-card"><div class="armor-card-visual"><img src="'+esc(asset(card.file))+'" alt="'+esc(card.title)+'"></div><div><h3>'+esc(card.title)+'</h3><span>'+esc(card.tag)+'</span><p>'+esc(card.body)+'</p></div></article>';
    }).join('');
    grid.dataset.rendered = '1';
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
      range('Origen X', 'pieces.'+i+'.fromX', piece.fromX, -240, 240) +
      range('Origen Y', 'pieces.'+i+'.fromY', piece.fromY, -180, 180) +
      range('Rotación entrada', 'pieces.'+i+'.fromRot', piece.fromRot, -35, 35) +
      range('Destino X', 'pieces.'+i+'.x', piece.x, -240, 240) +
      range('Destino Y', 'pieces.'+i+'.y', piece.y, -120, 420) +
      range('Escala', 'pieces.'+i+'.scale', piece.scale, 0.6, 1.5, 0.01) +
      range('Z-index', 'pieces.'+i+'.z', piece.z, 1, 40) +
      range('Inicio', 'pieces.'+i+'.start', piece.start, 0, 100) +
      range('Fin', 'pieces.'+i+'.end', piece.end, 0, 100) +
    '</details>';
  }

  function renderGuide(){
    return '<section class="studio-guide"><p class="guide-kicker">PROMPT SAMURAI OFICIAL</p><h3>Armor Reveal, no puzzle exacto</h3><p>La fuente aprobada dice: 0–15% piezas fuera de pantalla con flotación; 15–70% atracción magnética; 70–85% snap; 85–100% crossfade a samurai2.png. Esta versión reconstruye esa lógica y evita el error anterior de intentar vender un encaje matemático.</p><div class="guide-grid"><div><strong>Hero</strong><span>280vh sticky, no 500/620vh.</span></div><div><strong>Base</strong><span>samurai1 fijo al centro.</span></div><div><strong>Piezas</strong><span>Se aproximan y luego desaparecen.</span></div><div><strong>Final</strong><span>samurai2 revela sin cortes.</span></div></div></section>';
  }

  function renderPanel(){
    var tabs = [ ['motion','Motion'], ['pieces','Piezas'], ['brand','Marca'], ['project','Proyecto'] ];
    q('studio-tabs').innerHTML = tabs.map(function(t){ return '<button class="'+(tab===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'; }).join('');
    var body = '';
    if (tab === 'motion') body = renderGuide() + range('Progreso manual', 'motion.manualProgress', state.motion.manualProgress, 0, 100) + range('Hero height vh', 'motion.heroHeightVh', state.motion.heroHeightVh || 280, 220, 360) + range('Float amount', 'motion.floatAmount', state.motion.floatAmount, 0, 34) + range('Snap start', 'motion.snapStart', state.motion.snapStart, 55, 85) + range('Snap end', 'motion.snapEnd', state.motion.snapEnd, 70, 95) + range('Final reveal start', 'motion.finalRevealStart', state.motion.finalRevealStart, 78, 95) + range('Snap strength', 'motion.snapStrength', state.motion.snapStrength, 0, 1, 0.01) + range('Final scale', 'motion.finalScale', state.motion.finalScale, 1, 1.12, 0.01) + '<label class="toggle"><input type="checkbox" data-path="motion.scrollMode" '+(state.motion.scrollMode?'checked':'')+'> Control por scroll</label>';
    if (tab === 'pieces') body = renderGuide() + state.pieces.map(pieceEditor).join('');
    if (tab === 'brand') body = input('Eyebrow','brand.eyebrow',state.brand.eyebrow) + input('Título','brand.title',state.brand.title) + input('Subtítulo','brand.subtitle',state.brand.subtitle) + input('Heading','content.heading',state.content.heading) + input('Texto','content.body',state.content.body) + input('CTA','content.cta',state.content.cta) + input('CTA URL','content.ctaUrl',state.content.ctaUrl);
    if (tab === 'project') body = '<div class="project-actions"><button id="export-json">Export JSON</button><label class="import-btn">Import JSON<input id="import-json" type="file" accept="application/json"></label><button id="reset-project">Reset</button></div><p class="project-note">Estado REVIEW. Reconstrucción basada en Prompts_SAMURAI.md y assets del repo madre. No COMPLETE hasta prueba visual y aprobación Juanma.</p>';
    q('studio-body').innerHTML = body;
  }

  function bindPanelEvents(){
    q('studio-tabs').onclick = function(e){ if(e.target.dataset.tab){ tab = e.target.dataset.tab; renderPanel(); bindPanelEvents(); } };
    q('studio-body').oninput = function(e){
      var p = e.target.dataset.path;
      if (!p) return;
      var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (e.target.type === 'range' || e.target.type === 'number') value = Number(value);
      var parts = p.split('.');
      var obj = state;
      for (var i=0;i<parts.length-1;i++) obj = obj[parts[i]];
      obj[parts[parts.length-1]] = value;
      if (p === 'motion.heroHeightVh') q('assembly-hero').style.height = value + 'vh';
      window.AssemblyStore.save(state);
      bindText(); renderFigure(); renderPanel(); bindPanelEvents();
    };
    q('studio-body').onclick = function(e){
      if (e.target.id === 'export-json') window.AssemblyStore.download(state);
      if (e.target.id === 'reset-project') { state = window.AssemblyStore.reset(); tab = 'motion'; q('armor-grid').dataset.rendered=''; render(); }
    };
    var imp = q('import-json');
    if (imp) imp.onchange = function(){
      var file = imp.files && imp.files[0];
      if (!file) return;
      window.AssemblyStore.readFile(file).then(function(txt){ state = JSON.parse(txt); window.AssemblyStore.save(state); render(); });
    };
  }

  function render(){
    q('assembly-hero').style.height = Number(state.motion.heroHeightVh || 280) + 'vh';
    bindText(); renderCards(); renderFigure(); renderPanel(); bindPanelEvents();
  }
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
