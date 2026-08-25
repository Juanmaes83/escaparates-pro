const BRIDGE = 'BREEZE_MUSEUM_STATE_V1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const byId = (id) => document.getElementById(id);
const num = (id, fallback) => {
  const value = Number(byId(id)?.value);
  return Number.isFinite(value) ? value : fallback;
};
const bool = (id, fallback = false) => byId(id) ? Boolean(byId(id).checked) : fallback;
const selectedFile = (id) => byId(id)?.files?.[0] || null;
const runtime = () => window.__BREEZE_STUDIO_PRO__ || null;

function post(message) {
  if (window.parent === window) return;
  window.parent.postMessage({ bridge: BRIDGE, ...message }, '*');
}

function fileMeta(file) {
  return file ? {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  } : null;
}

function readState({ includeFiles = true } = {}) {
  const rt = runtime();
  const app = rt?.app;
  const backgroundFile = app?.appliedBackgroundFile || selectedFile('bsBackground');
  const clothFile = app?.appliedClothFile || selectedFile('bsMedia');
  const modelFile = selectedFile('bsModel');
  const objectSpec = app?.objectSpec || null;

  return {
    version: 1,
    experience: byId('bsScene')?.value || 'cloth',
    autoRotate: bool('bsRotate'),
    runSimulation: bool('bsRun', true),
    wireframe: bool('bsWire'),
    background: {
      file: includeFiles ? backgroundFile : undefined,
      meta: fileMeta(backgroundFile),
      applied: Boolean(app?.appliedBackgroundFile),
      scale: num('bsBgScale', 1),
      x: num('bsBgX', 0),
      y: num('bsBgY', 0)
    },
    cloth: {
      file: includeFiles ? clothFile : undefined,
      meta: fileMeta(clothFile),
      applied: Boolean(app?.appliedClothFile),
      scale: num('bsScale', 1),
      x: num('bsX', 0),
      y: num('bsY', 0),
      opacity: num('bsOpacity', 1),
      brightness: num('bsBrightness', 1),
      contrast: num('bsContrast', 1),
      saturation: num('bsSaturation', 1)
    },
    object: {
      template: byId('bsTemplate')?.value || 'venus',
      uploadedFile: includeFiles ? modelFile : undefined,
      uploadedMeta: fileMeta(modelFile),
      spec: objectSpec ? {
        kind: objectSpec.kind || null,
        id: objectSpec.id || null,
        name: objectSpec.name || null
      } : null
    },
    physics: {
      stiffness: num('bsStiff', 0.25),
      friction: num('bsFriction', 0.25)
    }
  };
}

function setControl(id, value, eventName = 'input') {
  const el = byId(id);
  if (!el || value === undefined || value === null) return;
  if (el.type === 'checkbox') el.checked = Boolean(value);
  else el.value = String(value);
  el.dispatchEvent(new Event(eventName, { bubbles: true }));
}

async function waitForRuntime(timeout = 15000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    if (runtime()?.app && byId('breezeStudioPanel') && byId('bsScene')) return runtime();
    await sleep(50);
  }
  throw new Error('Breeze Studio PRO runtime did not become ready');
}

async function waitForExperience(value, timeout = 10000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const select = byId('bsScene');
    const status = document.body?.innerText || '';
    if (select?.value === value && /Experience STARTED/i.test(status)) return true;
    await sleep(80);
  }
  return byId('bsScene')?.value === value;
}

async function applyState(state) {
  const rt = await waitForRuntime();
  const app = rt.app;

  if (state?.experience && byId('bsScene')?.value !== state.experience) {
    setControl('bsScene', state.experience, 'change');
    await waitForExperience(state.experience);
  }

  setControl('bsRotate', state?.autoRotate, 'change');
  setControl('bsRun', state?.runSimulation, 'change');
  setControl('bsWire', state?.wireframe, 'change');

  const bg = state?.background || {};
  setControl('bsBgScale', bg.scale);
  setControl('bsBgX', bg.x);
  setControl('bsBgY', bg.y);
  if (bg.file) {
    app.backgroundTransform = {
      scale: Number(bg.scale ?? 1),
      x: Number(bg.x ?? 0),
      y: Number(bg.y ?? 0)
    };
    await app.setAppliedBackgroundFile(bg.file);
    app.applyBackgroundTransform?.();
  }

  const cloth = state?.cloth || {};
  setControl('bsScale', cloth.scale);
  setControl('bsX', cloth.x);
  setControl('bsY', cloth.y);
  setControl('bsOpacity', cloth.opacity);
  setControl('bsBrightness', cloth.brightness);
  setControl('bsContrast', cloth.contrast);
  setControl('bsSaturation', cloth.saturation);
  app.setClothMediaTransform?.({
    scale: Number(cloth.scale ?? 1),
    x: Number(cloth.x ?? 0),
    y: Number(cloth.y ?? 0)
  });
  app.setClothLook?.({
    opacity: Number(cloth.opacity ?? 1),
    brightness: Number(cloth.brightness ?? 1),
    contrast: Number(cloth.contrast ?? 1),
    saturation: Number(cloth.saturation ?? 1)
  });
  if (cloth.file) await app.applyClothFile(cloth.file);

  const object = state?.object || {};
  if (object.uploadedFile) {
    await app.applyUploadedObject(object.uploadedFile);
  } else if (object.template) {
    await app.applyObjectTemplate(object.template);
    const select = byId('bsTemplate');
    if (select) select.value = object.template;
  }

  const physics = state?.physics || {};
  setControl('bsStiff', physics.stiffness);
  setControl('bsFriction', physics.friction);

  return readState({ includeFiles: true });
}

function validateState() {
  const rt = runtime();
  const app = rt?.app;
  const state = readState({ includeFiles: false });
  const checks = {
    runtime: Boolean(app && rt?.renderer),
    panel: Boolean(byId('breezeStudioPanel')),
    experience: Boolean(state.experience),
    background: !state.background.meta || Boolean(app?.appliedBackgroundFile),
    cloth: !state.cloth.meta || Boolean(app?.appliedClothFile),
    object: Boolean(state.object.template || state.object.spec),
    physics: Number.isFinite(state.physics.stiffness) && Number.isFinite(state.physics.friction)
  };
  return { ok: Object.values(checks).every(Boolean), checks, state };
}

window.addEventListener('message', async (event) => {
  const msg = event.data;
  if (!msg || msg.bridge !== BRIDGE || !msg.requestId) return;
  try {
    if (msg.type === 'GET_STATE') {
      post({ type: 'STATE', requestId: msg.requestId, state: readState({ includeFiles: true }) });
    } else if (msg.type === 'APPLY_STATE') {
      const state = await applyState(msg.state || {});
      post({ type: 'APPLY_RESULT', requestId: msg.requestId, state });
    } else if (msg.type === 'VALIDATE_STATE') {
      post({ type: 'VALIDATION', requestId: msg.requestId, result: validateState() });
    }
  } catch (error) {
    post({ type: 'ERROR', requestId: msg.requestId, error: String(error?.message || error) });
  }
});

(async () => {
  try {
    await waitForRuntime();
    post({ type: 'READY', state: readState({ includeFiles: false }) });
  } catch (error) {
    post({ type: 'BOOT_ERROR', error: String(error?.message || error) });
  }
})();
