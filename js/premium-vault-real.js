// Premium Experiences Vault — real Escaparates Pro family mode
// Additive only: no existing family, module or source is deleted, moved or replaced.
(function() {
  'use strict';
  window.EP = window.EP || {};

  var state = { active: false, id: null };

  var STATUS_COPY = {
    COMPLETE: 'Web/experiencia con integración o panel ya existente dentro del sistema aprobado.',
    PARTIAL: 'Existe experiencia visual o fuente funcional, pero falta paridad completa de panel o validación dentro del Vault.',
    NO_PANEL: 'Proyecto importante preservado. Falta crear adaptador/panel Escaparates Pro.',
    PRESERVED: 'Fuente/evolución preservada para no perderla. No se presenta como módulo cliente completo.',
    ENGINE: 'Motor técnico o dependencia. No es una web cliente personalizable.'
  };

  var ENTRIES = [
    {
      id: 'restaurant-premium-dish-journey', icon: 'RP', name: 'Restauración Premium — Dish Journey',
      group: 'Web completa / Restauración', status: 'COMPLETE',
      description: 'Web premium de restauración aprobada: Dish Journey con narrativa visual, navegación y experiencia completa.',
      previewUrl: 'https://raw.githack.com/Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/class7-dish-journey-premium/index.html',
      panelSummary: ['Estado declarado por proyecto: aprobada', 'Web visual completa y navegable', 'Debe conservarse en Vault como Restaurant / Gastronomy Premium']
    },
    {
      id: 'eloria-signature', icon: 'EL', name: 'ELORIA Signature',
      group: 'Beauty / Product', status: 'COMPLETE',
      description: 'Preset canónico de perfume con frasco protagonista: scroll-driven bottle journey.',
      kind: 'sector', targetId: 'luxury-beauty-product-pro', targetText: 'Luxury Beauty Product',
      panelSummary: ['Panel de Luxury Beauty Product PRO', 'Producto protagonista configurable', 'Escenas, colección, ingredientes, narrativa y journey']
    },
    {
      id: 'luxury-beauty-product-pro', icon: 'LB', name: 'Luxury Beauty Product PRO',
      group: 'Beauty / Product', status: 'COMPLETE',
      description: 'Blueprint personalizable de producto/fragancia premium con star product journey.',
      kind: 'sector', targetId: 'luxury-beauty-product-pro', targetText: 'Luxury Beauty Product',
      panelSummary: ['Blueprint editable existente', 'Media slots y contenido comercial', 'Export HTML final desde Blueprints']
    },
    {
      id: 'luxury-real-estate-custom-pro', icon: 'LC', name: 'Luxury Real Estate — Custom Blueprint PRO',
      group: 'Web completa / Inmobiliaria', status: 'COMPLETE',
      description: 'Web inmobiliaria premium completa con panel profundo: marca, hero, propiedades, contacto, colores, media y motion.',
      kind: 'sector', targetId: 'luxury-real-estate-custom-pro', targetText: 'Luxury Real Estate — Custom',
      panelSummary: ['Panel profundo ya existente', 'Propiedades/precios/contacto editables', 'Preview y export desde Sector Blueprints']
    },
    {
      id: 'luxury-real-estate-source-faithful', icon: 'LS', name: 'Luxury Real Estate — Source Faithful PRO',
      group: 'Web completa / Inmobiliaria', status: 'PARTIAL',
      description: 'Versión fuente preservada. Valor visual alto; panel limitado frente a Custom PRO.',
      kind: 'sector', targetId: 'luxury-real-estate-source-faithful', targetText: 'Luxury Real Estate — Source Faithful',
      panelSummary: ['Referencia visual preservada', 'No sustituye a Custom PRO', 'Falta paridad de personalización']
    },
    {
      id: 'real-estate-storytelling-custom-pro', icon: 'SC', name: 'Real Estate Storytelling — Custom PRO',
      group: 'Storytelling / Scroll', status: 'COMPLETE',
      description: 'Scroll story inmobiliario con vídeo, fases, CTA, color, longitud de scroll, scrub y smoothing configurables.',
      kind: 'scroll', targetId: 'real-estate-storytelling-custom-pro', targetText: 'Real Estate Storytelling — Custom',
      panelSummary: ['Panel de Scroll Sections existente', 'Vídeo y cuatro fases configurables', 'Export HTML de sección']
    },
    {
      id: 'real-estate-storytelling-source-faithful', icon: 'SS', name: 'Real Estate Storytelling — Source Faithful',
      group: 'Storytelling / Scroll', status: 'PARTIAL',
      description: 'Fuente preservada del recorrido inmobiliario scroll-driven.',
      kind: 'scroll', targetId: 'real-estate-storytelling-source-faithful', targetText: 'Real Estate Storytelling — Source Faithful',
      panelSummary: ['Fuente preservada', 'Preview posible desde Scroll Sections', 'Falta panel equivalente a Custom PRO']
    },
    {
      id: 'real-estate-bidirectional-story-pro', icon: 'BD', name: 'Real Estate Bidirectional Story PRO',
      group: 'Storytelling / Scroll', status: 'PARTIAL',
      description: 'Evolución bidireccional del storytelling inmobiliario. Preservada para revisión funcional.',
      kind: 'scroll-search', targetText: 'Real Estate Bidirectional',
      panelSummary: ['Capacidad identificada en la línea Premium Storytelling', 'Debe verificarse preview', 'Debe verificarse panel antes de COMPLETE']
    },
    {
      id: 'product-scroll-storytelling-pro', icon: 'PS', name: 'Product Scroll Storytelling PRO',
      group: 'Storytelling / Scroll', status: 'PARTIAL',
      description: 'Storytelling de producto sincronizado al scroll, preservado como capacidad independiente.',
      kind: 'scroll-search', targetText: 'Product Scroll Storytelling',
      panelSummary: ['Capacidad preservada', 'Falta verificar panel completo', 'No sustituye a ELORIA']
    },
    {
      id: 'breeze-museum-authoring-studio', icon: 'BZ', name: 'Breeze Museum Authoring Studio',
      group: '3D / Immersive', status: 'PARTIAL',
      description: 'Studio inmersivo con authoring nativo para el mundo museo.',
      previewUrl: 'labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=./worlds/museum-v1.world.json',
      panelSummary: ['Authoring propio existente', 'Falta puente de panel lateral Escaparates', 'No se debe degradar su editor nativo']
    },
    {
      id: 'rubik-sota-immersive-brand-landing', icon: 'RB', name: 'Rubik SOTA — Immersive Brand Landing',
      group: 'Brand / Scroll Journey', status: 'NO_PANEL',
      description: 'Landing fuente importante donde el objeto/brazo robótico acompaña el scroll. Falta adaptador real Escaparates.',
      sourceUrl: 'https://github.com/Juanmaes83/immersive-brand-landing-rubik-sota',
      panelSummary: ['Fuente localizada', 'No hay panel Escaparates validado', 'Debe convertirse en módulo con posiciones/escenas/CTA/media']
    },
    {
      id: 'aurum-properties-boutique', icon: 'AU', name: 'AURUM Properties Boutique',
      group: 'Web completa / Inmobiliaria', status: 'NO_PANEL',
      description: 'Web inmobiliaria boutique premium preservada. Falta panel Escaparates Pro.',
      sourceUrl: 'https://github.com/Juanmaes83/AURUM_PROPERTIES_BOUTIQUE',
      panelSummary: ['Fuente preservada', 'Debe tener panel de propiedades, precios, media y contacto', 'No se elimina ni absorbe']
    },
    {
      id: 'immersphere-pro-inmobiliarias', icon: 'I1', name: 'IMMERSPHERE PRO Inmobiliarias',
      group: 'Web completa / Inmobiliaria', status: 'NO_PANEL',
      description: 'Evolución inmobiliaria inmersiva preservada. Panel pendiente.',
      sourceUrl: 'https://github.com/Juanmaes83/IMMERSPHERE-PRO-INMOBILIARIAS',
      panelSummary: ['Evolución preservada', 'Panel Escaparates pendiente', 'No se fusiona con otra versión sin aprobación']
    },
    {
      id: 'inmobiliaria-premium-immersphere', icon: 'I2', name: 'Inmobiliaria Premium IMMERSPHERE',
      group: 'Web completa / Inmobiliaria', status: 'NO_PANEL',
      description: 'Segunda evolución IMMERSPHERE preservada como pieza independiente.',
      sourceUrl: 'https://github.com/Juanmaes83/INMOBILIARIA-PREMIUM_IMMERSPHERE-',
      panelSummary: ['Segunda evolución preservada', 'Debe compararse con IMMERSPHERE PRO', 'Panel pendiente']
    },
    {
      id: 'rubik-sota-inmobiliaria-premium', icon: 'RR', name: 'Rubik Sota Inmobiliaria Premium',
      group: 'Web completa / Inmobiliaria', status: 'PRESERVED',
      description: 'Fuente original preservada junto a sus adaptaciones Source Faithful y Custom PRO.',
      sourceUrl: 'https://github.com/Juanmaes83/Rubik-Sota-Inmobiliaria-Premium',
      panelSummary: ['Fuente original', 'Conectada conceptualmente a Luxury Real Estate', 'No se elimina']
    },
    {
      id: 'inmobiliaria-storytelling-scroll-premium', icon: 'RS', name: 'Inmobiliaria Storytelling Scroll Premium',
      group: 'Storytelling / Scroll', status: 'PRESERVED',
      description: 'Fuente original del recorrido scroll inmobiliario preservada junto a sus adaptaciones.',
      sourceUrl: 'https://github.com/Juanmaes83/INMOBILIARIA-STORYTELLING-SCROOL-PREMIUM',
      panelSummary: ['Fuente original', 'Conectada a Real Estate Storytelling Custom/Source', 'No se elimina']
    },
    {
      id: 'rubik-sota-immersive-engine', icon: 'EN', name: 'Rubik SOTA Immersive Landing Engine',
      group: 'Engine / Privado', status: 'ENGINE',
      description: 'Motor técnico privado asociado a Rubik SOTA Immersive Brand Landing. No se expone como web cliente.',
      panelSummary: ['Dependencia técnica', 'No es módulo cliente', 'No se debe exponer públicamente']
    }
  ];

  function media() { return EP.Media && EP.Media.getAll ? EP.Media.getAll() : []; }

  function sectorDefaults(id) {
    var values = {};
    if (!EP.SectorBlueprints || !EP.SectorBlueprints.getSchema) return values;
    (EP.SectorBlueprints.getSchema(id) || []).forEach(function(field) { values[field.key] = field.default !== undefined ? field.default : ''; });
    return values;
  }

  function scrollDefaults(id) {
    var values = {};
    if (!EP.ScrollSectionsUI) return values;
    // Scroll Sections UI owns deeper field schemas; fallback preview can still build with template defaults.
    return values;
  }

  function buildPreview(entry) {
    try {
      if (entry.previewUrl) return { url: entry.previewUrl };
      if (entry.kind === 'sector' && EP.SectorBlueprints && EP.SectorBlueprints.build) {
        return { srcdoc: EP.SectorBlueprints.build(entry.targetId, media(), sectorDefaults(entry.targetId)) };
      }
      if ((entry.kind === 'scroll' || entry.kind === 'scroll-search') && EP.ScrollSections && EP.ScrollSections.buildDocument) {
        var id = entry.targetId || findScrollIdByText(entry.targetText);
        if (id) return { srcdoc: EP.ScrollSections.buildDocument(id, media(), scrollDefaults(id)) };
      }
    } catch (e) {
      return { error: e.message || String(e) };
    }
    return null;
  }

  function findScrollIdByText(text) {
    if (!EP.ScrollSections || !EP.ScrollSections.getAll || !text) return null;
    var needle = text.toLowerCase();
    var list = EP.ScrollSections.getAll();
    for (var i = 0; i < list.length; i++) {
      if ((list[i].name || '').toLowerCase().indexOf(needle) !== -1 || (list[i].id || '').toLowerCase().indexOf(needle.replace(/\s+/g, '-')) !== -1) return list[i].id;
    }
    return null;
  }

  function ensureDom() {
    if (document.getElementById('mode-btn-premium-vault')) return;

    var modes = document.getElementById('app-mode-toggle');
    var rubikBtn = document.getElementById('mode-btn-rubik-tools');
    if (modes) {
      var btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.id = 'mode-btn-premium-vault';
      btn.setAttribute('data-mode', 'premium-vault');
      btn.title = 'Premium Experiences Vault — webs completas, scroll journeys y fuentes rescatadas';
      btn.textContent = 'Vault';
      if (rubikBtn && rubikBtn.parentNode === modes) modes.insertBefore(btn, rubikBtn);
      else modes.appendChild(btn);
    }

    var sourceStage = document.getElementById('source-labs-stage');
    if (sourceStage && sourceStage.parentNode) {
      var stage = document.createElement('div');
      stage.id = 'premium-vault-stage';
      stage.innerHTML = '<iframe id="pv-preview-frame" title="Vista previa Premium Vault" allow="autoplay; fullscreen; display-capture; clipboard-write" allowfullscreen></iframe><div id="pv-empty"><strong>Premium Experiences Vault</strong><span>Selecciona un módulo del catálogo para ver su estado real.</span></div>';
      sourceStage.parentNode.insertBefore(stage, sourceStage.nextSibling);
    }

    var effectsPanel = document.getElementById('effects-panel');
    if (effectsPanel && !document.getElementById('premium-vault-catalog')) {
      var catalog = document.createElement('div');
      catalog.id = 'premium-vault-catalog';
      catalog.style.display = 'none';
      effectsPanel.appendChild(catalog);
    }

    var propsPanel = document.getElementById('properties-panel');
    var sourceProps = document.getElementById('source-labs-props');
    if (propsPanel && !document.getElementById('premium-vault-props')) {
      var props = document.createElement('div');
      props.className = 'panel-section';
      props.id = 'premium-vault-props';
      props.style.display = 'none';
      props.innerHTML = '<h3 id="pv-props-title">PREMIUM VAULT</h3><div id="pv-props-fields"></div><div id="pv-source-note" class="ss-source-note"></div>';
      if (sourceProps && sourceProps.parentNode === propsPanel) propsPanel.insertBefore(props, sourceProps.nextSibling);
      else propsPanel.insertBefore(props, propsPanel.firstChild ? propsPanel.firstChild.nextSibling : null);
    }

    injectStyles();
  }

  function injectStyles() {
    if (document.getElementById('premium-vault-real-styles')) return;
    var style = document.createElement('style');
    style.id = 'premium-vault-real-styles';
    style.textContent = '\
#premium-vault-stage{position:fixed;top:var(--top-h);left:var(--panel-w);right:var(--panel-w);bottom:var(--bottom-h);background:#09090a;display:none;z-index:20}\
#premium-vault-stage.active{display:block}\
#premium-vault-stage iframe{width:100%;height:100%;border:0;display:none;background:#09090a}\
#pv-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:44px;color:rgba(255,255,255,.56);background:radial-gradient(circle at 30% 20%,rgba(79,140,255,.12),transparent 36%),#09090a}\
#pv-empty strong{display:block;color:#fff;font-size:28px;margin-bottom:10px}\
#pv-empty span{display:block;max-width:620px;line-height:1.5}\
body.mode-premium-vault #canvas-container{display:none}\
body.mode-premium-vault #timeline-bar{display:none}\
#premium-vault-catalog{overflow:auto;flex:1;padding:10px 10px 22px}\
.pv-family-head{padding:7px 5px 12px;border-bottom:1px solid var(--border);margin-bottom:10px}\
.pv-family-head small{display:block;color:var(--text-dim);font-size:10px;letter-spacing:.13em;text-transform:uppercase;margin-bottom:4px}\
.pv-family-head strong{display:block;color:var(--text);font-size:15px;margin-bottom:5px}\
.pv-family-head span{display:block;color:var(--text-dim);font-size:11px;line-height:1.4}\
.pv-card{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:10px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.035);margin-bottom:8px;cursor:pointer;transition:.18s}\
.pv-card:hover,.pv-card.active{border-color:rgba(79,140,255,.58);background:rgba(79,140,255,.12)}\
.pv-icon{width:36px;height:36px;border-radius:7px;display:grid;place-items:center;background:var(--surface-2);font-weight:900;font-size:11px;color:var(--text)}\
.pv-name{font-size:12px;font-weight:800;color:var(--text);line-height:1.2;margin-bottom:4px}\
.pv-desc{font-size:10px;color:var(--text-dim);line-height:1.35}\
.pv-status{display:inline-flex;margin-top:6px;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.06);font-size:9px;font-weight:900;letter-spacing:.06em}\
.pv-status.COMPLETE{color:#8ff5ad;border:1px solid rgba(143,245,173,.18)}\
.pv-status.PARTIAL{color:#91c8ff;border:1px solid rgba(145,200,255,.18)}\
.pv-status.NO_PANEL{color:#ffc46f;border:1px solid rgba(255,196,111,.18)}\
.pv-status.PRESERVED{color:#d0a7ff;border:1px solid rgba(208,167,255,.18)}\
.pv-status.ENGINE{color:#ff9df0;border:1px solid rgba(255,157,240,.18)}\
.pv-field-card{border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.035);padding:10px;margin-bottom:10px}\
.pv-field-card p{font-size:11px;line-height:1.45;color:var(--text-dim);margin:0}\
.pv-summary{margin:8px 0 0;padding-left:16px;color:var(--text-dim);font-size:11px;line-height:1.45}\
.pv-action{width:100%;margin-top:8px;border:1px solid var(--border);border-radius:7px;background:var(--surface-2);color:var(--text);padding:9px;font:800 11px var(--font);cursor:pointer}\
.pv-action.primary{background:var(--accent);border-color:var(--accent);color:#fff}\
.pv-action:hover{border-color:var(--border-hover)}';
    document.head.appendChild(style);
  }

  function setVisible(id, visible) {
    var el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
  }

  function renderCatalog() {
    var box = document.getElementById('premium-vault-catalog');
    if (!box) return;
    box.innerHTML = '<div class="pv-family-head"><small>Familia real dentro de Escaparates Pro</small><strong>Premium Experiences Vault</strong><span>Completo / parcial / sin panel. Nada se elimina ni se sustituye.</span></div>';
    ENTRIES.forEach(function(entry) {
      var card = document.createElement('div');
      card.className = 'pv-card' + (entry.id === state.id ? ' active' : '');
      card.setAttribute('data-premium-vault', entry.id);
      card.innerHTML = '<span class="pv-icon">' + entry.icon + '</span><div><div class="pv-name">' + entry.name + '</div><div class="pv-desc">' + entry.group + '</div><span class="pv-status ' + entry.status + '">' + entry.status + '</span></div>';
      card.onclick = function() { select(entry.id); };
      box.appendChild(card);
    });
  }

  function renderProps(entry) {
    var title = document.getElementById('pv-props-title');
    var fields = document.getElementById('pv-props-fields');
    var note = document.getElementById('pv-source-note');
    if (title) title.textContent = entry.name.toUpperCase();
    if (!fields) return;
    fields.innerHTML = '';

    var status = document.createElement('div');
    status.className = 'pv-field-card';
    status.innerHTML = '<span class="pv-status ' + entry.status + '">' + entry.status + '</span><p style="margin-top:8px;">' + (STATUS_COPY[entry.status] || '') + '</p>';
    fields.appendChild(status);

    var desc = document.createElement('div');
    desc.className = 'pv-field-card';
    desc.innerHTML = '<p>' + entry.description + '</p>';
    fields.appendChild(desc);

    if (entry.panelSummary && entry.panelSummary.length) {
      var summary = document.createElement('div');
      summary.className = 'pv-field-card';
      summary.innerHTML = '<p><strong>Panel / integración:</strong></p><ul class="pv-summary">' + entry.panelSummary.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>';
      fields.appendChild(summary);
    }

    if (entry.kind === 'sector' || entry.kind === 'scroll' || entry.kind === 'scroll-search') {
      var open = document.createElement('button');
      open.className = 'pv-action primary';
      open.textContent = 'Abrir módulo y panel original dentro de Escaparates Pro';
      open.onclick = function() { openOriginal(entry); };
      fields.appendChild(open);
    }
    if (entry.sourceUrl) {
      var src = document.createElement('button');
      src.className = 'pv-action';
      src.textContent = 'Abrir repo fuente';
      src.onclick = function(){ window.open(entry.sourceUrl, '_blank', 'noopener'); };
      fields.appendChild(src);
    }
    if (note) note.textContent = 'Vault es aditivo: esta entrada no borra ni sustituye otras familias. Limpieza sólo con aprobación explícita.';
  }

  function renderPreview(entry) {
    var frame = document.getElementById('pv-preview-frame');
    var empty = document.getElementById('pv-empty');
    if (!frame || !empty) return;
    var preview = buildPreview(entry);
    frame.style.display = 'none';
    frame.removeAttribute('src');
    frame.removeAttribute('srcdoc');
    if (preview && preview.srcdoc) {
      frame.srcdoc = preview.srcdoc;
      frame.style.display = 'block';
      empty.style.display = 'none';
    } else if (preview && preview.url) {
      frame.src = preview.url;
      frame.style.display = 'block';
      empty.style.display = 'none';
    } else {
      var reason = preview && preview.error ? ('Error de preview: ' + preview.error) : entry.description;
      empty.innerHTML = '<div><strong>' + entry.name + '</strong><span>' + reason + '</span></div>';
      empty.style.display = 'grid';
    }
  }

  function select(id) {
    var entry = ENTRIES.filter(function(item) { return item.id === id; })[0];
    if (!entry) return;
    state.id = id;
    renderCatalog();
    renderProps(entry);
    renderPreview(entry);
  }

  function findCardByText(text) {
    var cards = document.querySelectorAll('.ss-template-card');
    var needle = String(text || '').toLowerCase();
    for (var i = 0; i < cards.length; i++) {
      if ((cards[i].textContent || '').toLowerCase().indexOf(needle) !== -1) return cards[i];
    }
    return null;
  }

  function openOriginal(entry) {
    if (entry.kind === 'sector') {
      deactivate();
      if (EP.SectorBlueprintsUI && EP.SectorBlueprintsUI.activate) EP.SectorBlueprintsUI.activate();
      else { var sb = document.getElementById('mode-btn-sector-blueprints'); if (sb) sb.click(); }
      setTimeout(function(){ var card = document.querySelector('[data-sector-blueprint="' + entry.targetId + '"]') || findCardByText(entry.targetText); if (card) card.click(); }, 180);
      return;
    }
    if (entry.kind === 'scroll' || entry.kind === 'scroll-search') {
      deactivate();
      if (EP.ScrollSectionsUI && EP.ScrollSectionsUI.activate) EP.ScrollSectionsUI.activate();
      else { var ss = document.getElementById('mode-btn-scroll-sections'); if (ss) ss.click(); }
      setTimeout(function(){ var card = entry.targetId ? document.querySelector('[data-scroll-template="' + entry.targetId + '"]') : null; card = card || findCardByText(entry.targetText); if (card) card.click(); }, 220);
    }
  }

  function deactivateOthers() {
    if (EP.WebsiteModulesUI && EP.WebsiteModulesUI.deactivate) EP.WebsiteModulesUI.deactivate();
    if (EP.SectorBlueprintsUI && EP.SectorBlueprintsUI.deactivate) EP.SectorBlueprintsUI.deactivate();
    if (EP.SourceLabsUI && EP.SourceLabsUI.deactivate) EP.SourceLabsUI.deactivate();
    if (EP.ScrollSectionsUI && EP.ScrollSectionsUI.setMode) EP.ScrollSectionsUI.setMode('effects');
    document.body.classList.remove('mode-rubik-tools');
    ['rubik-tools-stage','website-modules-stage','sector-blueprints-stage','source-labs-stage','interactive-boards-stage','scroll-sections-stage'].forEach(function(id){ var el = document.getElementById(id); if (el) el.classList.remove('active'); });
    ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-source-labs','mode-btn-interactive-boards','mode-btn-rubik-tools'].forEach(function(id){ var el = document.getElementById(id); if (el) el.classList.remove('active'); });
  }

  function activate() {
    if (state.active) return;
    state.active = true;
    ensureDom();
    deactivateOthers();
    document.body.classList.add('mode-premium-vault');
    var btn = document.getElementById('mode-btn-premium-vault'); if (btn) btn.classList.add('active');
    var stage = document.getElementById('premium-vault-stage'); if (stage) stage.classList.add('active');
    setVisible('effects-catalog-body', false);
    setVisible('scroll-sections-catalog', false);
    setVisible('website-modules-catalog', false);
    setVisible('sector-blueprints-catalog', false);
    setVisible('source-labs-catalog', false);
    setVisible('premium-vault-catalog', true);
    ['scroll-sections-props','website-modules-props','sector-blueprints-props','source-labs-props'].forEach(function(id){ setVisible(id, false); });
    setVisible('premium-vault-props', true);
    var heading = document.querySelector('#effects-panel .panel-header h2'); if (heading) heading.textContent = 'Vault';
    if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();
    renderCatalog();
    select(state.id || 'restaurant-premium-dish-journey');
  }

  function deactivate() {
    state.active = false;
    document.body.classList.remove('mode-premium-vault');
    var btn = document.getElementById('mode-btn-premium-vault'); if (btn) btn.classList.remove('active');
    var stage = document.getElementById('premium-vault-stage'); if (stage) stage.classList.remove('active');
    setVisible('premium-vault-catalog', false);
    setVisible('premium-vault-props', false);
    var heading = document.querySelector('#effects-panel .panel-header h2'); if (heading) heading.textContent = 'Efectos';
  }

  function init() {
    ensureDom();
    var btn = document.getElementById('mode-btn-premium-vault');
    if (btn) btn.onclick = activate;
    ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-source-labs','mode-btn-interactive-boards','mode-btn-rubik-tools'].forEach(function(id){
      var el = document.getElementById(id); if (el) el.addEventListener('click', deactivate);
    });
    if (new URLSearchParams(window.location.search).get('vault') === '1') setTimeout(activate, 350);
  }

  EP.PremiumVault = { init: init, activate: activate, deactivate: deactivate, getAll: function(){ return ENTRIES.slice(); } };
})();
