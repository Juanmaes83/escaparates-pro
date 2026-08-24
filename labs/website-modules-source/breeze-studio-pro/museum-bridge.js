const BRIDGE_VERSION = 'museum-v1';
const TYPE = 'BREEZE_MUSEUM_BRIDGE';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function post(message) {
  try { window.parent?.postMessage({ bridge: TYPE, version: BRIDGE_VERSION, ...message }, '*'); } catch { /* parent is optional */ }
}

function fileMeta(file) {
  return file ? { name: file.name, type: file.type, size: file.size, lastModified: file.lastModified } : null;
}

function value(id, fallback = null) {
  const el = document.getElementById(id);
  return el ? el.value : fallback;
}

function checked(id, fallback = false) {
  const el = document.getElementById(id);
  return el ? Boolean(el.checked) : fallback;
}

let latestModelFile = null;
let latestBackgroundFile = null;
let latestClothFile = null;
let installed = false;
let changeTimer = 0;

function runtime() {
  return window.__BREEZE_STUDIO_PRO__ || null;
}

function panel() {
  return document.getElementById('breezeStudioPanel');
}

function getState({ includeFiles = true } = {}) {
  const rt = runtime();
  const app = rt?.app;
  const backgroundFile = app?.appliedBackgroundFile || latestBackgroundFile || null;
  const clothFile = app?.appliedClothFile || latestClothFile || null;
  const objectSpec = app?.objectSpec || null;
  return {
    experience: value('bsScene', 'cloth'),
    autoRotate: checked('bsRotate', false),
    runSimulation: checked('bsRun', true),
    wireframe: checked('bsWire', false),
    background: {
      file: includeFiles ? backgroundFile : undefined,
      meta: fileMeta(backgroundFile),
      scale: Number(value('bsBgScale', 1)), x: Number(value('bsBgX', 0)), y: Number(value('bsBgY', 0)),
      applied: Boolean(app?.appliedBackgroundFile)
    },
    cloth: {
      file: includeFiles ? clothFile : undefined,
      meta: fileMeta(clothFile),
      scale: Number(value('bsScale', 1)), x: Number(value('bsX', 0)), y: Number(value('bsY', 0)),
      opacity: Number(value('bsOpacity', 1)), brightness: Number(value('bsBrightness', 1)),
      contrast: Number(value('bsContrast', 1)), saturation: Number(value('bsSaturation', 1)),
      applied: Boolean(app?.appliedClothFile)
    },
    object: {
      template: value('bsTemplate', 'venus'),
      uploadedFile: includeFiles ? latestModelFile : undefined,
      uploadedMeta: fileMeta(latestModelFile),
      spec: objectSpec ? { kind: objectSpec.kind || null, id: objectSpec.id || null, name: objectSpec.name || null } : null
    },
    physics: { stiffness: Number(value('bsStiff', .25)), friction: Number(value('bsFriction', .25)) },
    panelOpen: !panel()?.classList.contains('museum-collapsed')
  };
}

function setInput(id, next, eventName = 'input') {
  const el = document.getElementById(id);
  if (!el || next === undefined || next === null) return;
  if (el.type === 'checkbox') el.checked = Boolean(next);
  else el.value = String(next);
  el.dispatchEvent(new Event(eventName, { bubbles: true }));
}

async function applyState(state = {}) {
  const rt = runtime();
  const app = rt?.app;
  if (!app) throw new Error('Breeze runtime no disponible');

  if (state.experience) {
    setInput('bsScene', state.experience, 'change');
    await wait(250);
  }
  setInput('bsRotate', state.autoRotate, 'change');
  setInput('bsRun', state.runSimulation, 'change');
  setInput('bsWire', state.wireframe, 'change');

  const bg = state.background || {};
  setInput('bsBgScale', bg.scale); setInput('bsBgX', bg.x); setInput('bsBgY', bg.y);
  if (bg.file) {
    latestBackgroundFile = bg.file;
    app.backgroundTransform = { scale: Number(bg.scale || 1), x: Number(bg.x || 0), y: Number(bg.y || 0) };
    await app.setAppliedBackgroundFile(bg.file);
  }

  const cloth = state.cloth || {};
  setInput('bsScale', cloth.scale); setInput('bsX', cloth.x); setInput('bsY', cloth.y);
  setInput('bsOpacity', cloth.opacity); setInput('bsBrightness', cloth.brightness);
  setInput('bsContrast', cloth.contrast); setInput('bsSaturation', cloth.saturation);
  if (cloth.file) {
    latestClothFile = cloth.file;
    app.setClothMediaTransform?.({ scale: Number(cloth.scale || 1), x: Number(cloth.x || 0), y: Number(cloth.y || 0) });
    app.setClothLook?.({ opacity: Number(cloth.opacity || 1), brightness: Number(cloth.brightness || 1), contrast: Number(cloth.contrast || 1), saturation: Number(cloth.saturation || 1) });
    await app.applyClothFile(cloth.file);
  }

  const obj = state.object || {};
  if (obj.uploadedFile) {
    latestModelFile = obj.uploadedFile;
    await app.applyUploadedObject(obj.uploadedFile);
  } else if (obj.template) {
    await app.applyObjectTemplate(obj.template);
    const select = document.getElementById('bsTemplate'); if (select) select.value = obj.template;
  }

  const physics = state.physics || {};
  setInput('bsStiff', physics.stiffness); setInput('bsFriction', physics.friction);
  setPanelOpen(state.panelOpen !== false);
  emitChanged('STATE_APPLIED');
  return getState();
}

function validation() {
  const rt = runtime();
  const app = rt?.app;
  const renderer = rt?.renderer;
  const state = getState({ includeFiles: false });
  const checks = {
    runtime: Boolean(app && renderer),
    panel: Boolean(panel()),
    experience: Boolean(state.experience),
    background: !state.background.meta || Boolean(app?.appliedBackgroundFile),
    cloth: !state.cloth.meta || Boolean(app?.appliedClothFile),
    object: Boolean(state.object.template || state.object.spec),
    physics: Number.isFinite(state.physics.stiffness) && Number.isFinite(state.physics.friction)
  };
  return { ok: Object.values(checks).every(Boolean), checks, state };
}

function emitChanged(reason = 'CHANGE') {
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => post({ type: 'BREEZE_STATE_CHANGED', reason, state: getState() }), 100);
}

function setPanelOpen(open) {
  const p = panel();
  if (!p) return;
  p.classList.toggle('museum-collapsed', !open);
  const toggle = document.getElementById('breezeMuseumToggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('[data-chevron]').textContent = open ? '−' : '+';
  }
}

function installSkin() {
  const p = panel();
  if (!p || p.dataset.museumSkin === '1') return;
  p.dataset.museumSkin = '1';
  const style = document.createElement('style');
  style.textContent = `
    #breezeStudioPanel{top:12px!important;right:12px!important;width:342px!important;max-height:calc(100vh - 24px)!important;border-radius:3px!important;background:rgba(15,14,12,.96)!important;border:1px solid rgba(197,172,112,.28)!important;box-shadow:0 16px 44px rgba(0,0,0,.38)!important;color:#e9e4d8!important;padding:0!important;overflow:auto!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important}
    #breezeStudioPanel>h1,#breezeStudioPanel>.sub{display:none!important}
    #breezeStudioPanel .section{margin:0!important;padding:12px 14px!important;border-top:1px solid rgba(255,255,255,.07)!important}
    #breezeStudioPanel .sectionTitle{color:#b8a476!important;letter-spacing:.14em!important;font-size:9px!important}
    #breezeStudioPanel button,#breezeStudioPanel .upload,#breezeStudioPanel select{border-radius:2px!important;background:#1a1917!important;border-color:rgba(255,255,255,.13)!important}
    #breezeStudioPanel button:hover,#breezeStudioPanel .upload:hover{background:#24211c!important;border-color:rgba(197,172,112,.35)!important}
    #breezeStudioPanel .status{margin:10px 14px 14px!important;border-radius:2px!important;background:#141311!important}
    #breezeMuseumToggle{position:sticky;top:0;z-index:5;width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:0!important;border-bottom:1px solid rgba(197,172,112,.25)!important;background:rgba(15,14,12,.98)!important;color:#eee7d8!important;text-align:left;cursor:pointer}
    #breezeMuseumToggle b{display:block;font:650 12px/1.2 Georgia,serif;letter-spacing:.02em}#breezeMuseumToggle small{display:block;margin-top:3px;color:#8f8779;font:9px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
    #breezeStudioPanel.museum-collapsed{max-height:none!important;overflow:hidden!important;width:300px!important}
    #breezeStudioPanel.museum-collapsed .section,#breezeStudioPanel.museum-collapsed .status{display:none!important}
  `;
  document.head.appendChild(style);
  const toggle = document.createElement('button');
  toggle.id = 'breezeMuseumToggle'; toggle.type = 'button'; toggle.setAttribute('aria-expanded','true');
  toggle.innerHTML = '<span><b>Breeze Studio</b><small>Sala especializada · Museum</small></span><span data-chevron>−</span>';
  toggle.addEventListener('click', () => setPanelOpen(p.classList.contains('museum-collapsed')));
  p.prepend(toggle);

  p.addEventListener('change', (e) => {
    const file = e.target?.files?.[0] || null;
    if (e.target?.id === 'bsBackground' && file) latestBackgroundFile = file;
    if (e.target?.id === 'bsMedia' && file) latestClothFile = file;
    if (e.target?.id === 'bsModel' && file) latestModelFile = file;
    emitChanged(e.target?.id || 'CHANGE');
  }, true);
  p.addEventListener('input', (e) => emitChanged(e.target?.id || 'INPUT'), true);
  p.addEventListener('click', (e) => { if (e.target?.closest('button') && e.target?.id !== 'breezeMuseumToggle') setTimeout(() => emitChanged(e.target.id || 'BUTTON'), 120); }, true);
}

async function install() {
  if (installed) return;
  for (let i = 0; i < 240; i += 1) {
    if (runtime()?.app && panel()) break;
    await wait(50);
  }
  if (!runtime()?.app || !panel()) {
    post({ type: 'BREEZE_BRIDGE_ERROR', error: 'Breeze Studio PRO no terminó de inicializar.' });
    return;
  }
  installed = true;
  installSkin();
  post({ type: 'BREEZE_BRIDGE_READY', state: getState() });
}

window.addEventListener('message', async (event) => {
  const msg = event.data;
  if (!msg || msg.bridge !== TYPE) return;
  const requestId = msg.requestId || null;
  try {
    if (msg.type === 'BREEZE_GET_STATE') post({ type: 'BREEZE_STATE', requestId, state: getState() });
    else if (msg.type === 'BREEZE_APPLY_STATE') post({ type: 'BREEZE_APPLY_RESULT', requestId, state: await applyState(msg.state || {}) });
    else if (msg.type === 'BREEZE_VALIDATE') post({ type: 'BREEZE_VALIDATE_RESULT', requestId, result: validation() });
    else if (msg.type === 'BREEZE_PANEL') { setPanelOpen(Boolean(msg.open)); post({ type: 'BREEZE_PANEL_RESULT', requestId, open: Boolean(msg.open) }); }
  } catch (error) {
    post({ type: 'BREEZE_BRIDGE_ERROR', requestId, error: String(error?.message || error) });
  }
});

install();
