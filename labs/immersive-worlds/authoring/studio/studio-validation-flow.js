import { StudioShell } from './studio-shell.js';
import { ConfigStore } from '../config-store.js';
import { SLOTS_FOR_KIND, SLOT_MEDIA } from '../experience-config.js';

/**
 * Museum Studio — controlled validation flow V1
 *
 * Human workflow:
 *   PREVISUALIZAR → GUARDAR PIEZA → VALIDAR PIEZA → PROBAR RECORRIDO → APROBAR RECORRIDO
 *
 * This is deliberately evidence-driven. A green state is not inferred from a
 * filled field or a READY MediaVault row. It is written only after the user has
 * executed the corresponding gate against the running Museum. Any later edit
 * invalidates the affected piece and the route approval.
 */

const LEDGER_KEY = 'iw.museum.validation.v1';
const FLOW_VERSION = 1;

const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));

function loadLedger() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null');
    if (raw?.version === FLOW_VERSION) return raw;
  } catch { /* corrupt evidence is no evidence */ }
  return { version: FLOW_VERSION, pieces: {}, route: {} };
}

function saveLedger(ledger) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

function hashString(value) {
  let h = 2166136261;
  const s = String(value || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function configHash(config) {
  return hashString(JSON.stringify(stable(config)));
}

function pieceHash(studio, entityId = studio.selectedId) {
  const entity = (studio.world.entities || []).find((item) => item.id === entityId) || null;
  const authored = studio.config.entities?.[entityId] || null;
  return hashString(JSON.stringify(stable({
    id: entityId,
    kind: entity?.kind || null,
    baseMedia: entity?.content?.media || null,
    authored
  })));
}

function pieceEvidence(studio, entityId = studio.selectedId) {
  const ledger = loadLedger();
  const evidence = ledger.pieces?.[entityId] || {};
  const hash = pieceHash(studio, entityId);
  return {
    hash,
    preview: evidence.previewHash === hash,
    saved: evidence.savedHash === hash,
    validated: evidence.validatedHash === hash,
    previewAt: evidence.previewAt || null,
    savedAt: evidence.savedAt || null,
    validatedAt: evidence.validatedAt || null
  };
}

function selectedMedia(studio, entityId = studio.selectedId) {
  const entity = (studio.world.entities || []).find((item) => item.id === entityId);
  const authored = studio.config.entities?.[entityId] || {};
  if (!entity) return { entity: null, media: null };
  if (authored.video?.src) return { entity, media: authored.video, kind: 'video' };
  if (authored.image?.src) return { entity, media: authored.image, kind: 'image' };
  const own = entity.content?.media;
  if (own?.src) return { entity, media: own, kind: String(own.kind || '').toLowerCase() };
  return { entity, media: null, kind: null };
}

function visualSurface(entityId) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  const record = sceneKit?._entityIndex?.get(entityId);
  const root = record?.object;
  if (!root) return null;
  let best = null;
  let bestArea = 0;
  root.traverse?.((node) => {
    if (!node?.isMesh || !node.material) return;
    const p = node.geometry?.parameters || {};
    const area = Number(p.width || 0) * Number(p.height || 0);
    if (area > bestArea) { best = node; bestArea = area; }
  });
  return best;
}

function inspectPiece(studio, entityId = studio.selectedId) {
  const { entity, media, kind } = selectedMedia(studio, entityId);
  if (!entity) return { ok: false, reason: 'Selecciona una pieza del Museo.' };
  const surface = visualSurface(entityId);
  if (!surface) return { ok: false, reason: 'La pieza no tiene una superficie visible en la sala activa.' };

  if (!media) return { ok: true, reason: 'Pieza visible. No tiene medio sustituible configurado.' };

  if (media.assetId) {
    const asset = studio.vault.get(media.assetId);
    if (!asset || asset.state !== 'READY') {
      return { ok: false, reason: 'El archivo está configurado pero no está READY en la biblioteca de esta sesión.' };
    }
  }

  const map = surface.material?.map || null;
  if (!map) return { ok: false, reason: 'El archivo está listo, pero la superficie 3D no tiene textura aplicada.' };

  const video = map.isVideoTexture ? map.image : null;
  if (kind === 'video' || String(media.kind || '').toLowerCase() === 'video') {
    if (!video) return { ok: false, reason: 'La superficie tiene textura, pero no es un VideoTexture activo.' };
    if (Number(video.readyState || 0) < 2) return { ok: false, reason: 'El vídeo existe en la superficie, pero todavía no puede dibujar frames.' };
    return { ok: true, reason: video.paused ? 'Vídeo visible; el navegador espera un gesto para reproducir.' : 'Vídeo visible y reproduciéndose.' };
  }

  return { ok: true, reason: 'Imagen visible en la superficie 3D.' };
}

async function settleFrames(count = 3) {
  for (let i = 0; i < count; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
}

async function navigateRuntime(runtime, targetSpaceId) {
  if (!runtime || !targetSpaceId) return false;
  if (runtime.state.activeSpaceId === targetSpaceId) return true;
  const path = runtime.graph?.path?.(runtime.state.activeSpaceId, targetSpaceId);
  if (!path || path.length < 2) return false;

  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1];
    const to = path[i];
    const portal = runtime.graph.exits(from).find((candidate) => candidate.toSpaceId === to);
    if (!portal) return false;
    await runtime.traversePortal(portal.id, { source: 'STUDIO_VALIDATION' });
  }
  return runtime.state.activeSpaceId === targetSpaceId;
}

function routeSubjects(studio) {
  const runtime = window.__IW?.runtime;
  const route = runtime?.store?.routes?.[0];
  if (!route) return [];
  const ids = new Set();
  for (const step of runtime.store.routeSteps(route.id) || []) {
    const ref = step.subjectRef;
    if (ref && (studio.world.entities || []).some((entity) => entity.id === ref)) ids.add(ref);
  }
  return [...ids];
}

function validationSummary(studio) {
  const ledger = loadLedger();
  const targets = routeSubjects(studio);
  const validated = targets.filter((id) => pieceEvidence(studio, id).validated).length;
  const pct = targets.length ? Math.round((validated / targets.length) * 100) : 0;
  const projectHash = configHash(studio.config);
  return {
    targets,
    validated,
    pct,
    routeTested: ledger.route?.testedHash === projectHash,
    routeApproved: ledger.route?.approvedHash === projectHash,
    testedAt: ledger.route?.testedAt || null,
    approvedAt: ledger.route?.approvedAt || null
  };
}

function stateDot(ok, pending = false) {
  return `<span class="st-flowdot ${ok ? 'is-ok' : pending ? 'is-warn' : ''}" aria-hidden="true"></span>`;
}

const originalRender = StudioShell.prototype.render;
StudioShell.prototype.render = function validationFlowRender(...args) {
  // Upgrade the Studio's one-hop reveal into a graph-backed reveal before the
  // first interaction. The product already owns WorldGraph.path(); authoring
  // should not invent a weaker navigation model.
  if (!this.__validationRevealInstalled) {
    this.__validationRevealInstalled = true;
    const legacyReveal = this.onReveal;
    this.onReveal = async (nodeId) => {
      const runtime = window.__IW?.runtime;
      const entity = (this.world.entities || []).find((item) => item.id === nodeId);
      const targetSpaceId = entity?.spaceId
        || ((this.world.spaces || []).some((space) => space.id === nodeId) ? nodeId : null);
      if (runtime && targetSpaceId) {
        const arrived = await navigateRuntime(runtime, targetSpaceId);
        if (arrived && entity) {
          try { runtime.focusEntity(entity.id, {}, { source: 'STUDIO' }); } catch { /* surface may be non-focusable */ }
          return;
        }
      }
      return legacyReveal?.(nodeId);
    };
  }
  return originalRender.apply(this, args);
};

StudioShell.prototype._topBar = function validationTopBar(r) {
  const saved = this._savedLabel();
  const entity = this.selectedEntity;
  const isPiece = Boolean(entity);
  const evidence = isPiece ? pieceEvidence(this) : { preview: false, saved: false, validated: false };
  const summary = validationSummary(this);
  const previewBusy = this.busy === 'preview';
  const routeBusy = this.busy === 'route';

  return `
    <header class="st-top st-top--validation">
      <div class="st-brand">
        <span class="st-mark" aria-hidden="true">E</span>
        <span><b>Estudio de Experiencia</b><i>Museo · autoría premium</i></span>
      </div>
      <nav class="st-crumbs" aria-label="Dónde estoy">${this._crumbHTML()}</nav>
      <div class="st-acts st-acts--flow">
        <span class="st-saved ${this.dirty ? 'st-saved--dirty' : ''}" data-role="saved">${this.dirty ? 'Cambios sin guardar' : esc(saved)}</span>
        <button class="st-b" data-act="piecePreview" ${isPiece ? '' : 'disabled'}>${stateDot(evidence.preview, isPiece)}${previewBusy ? 'PREVISUALIZANDO…' : 'PREVISUALIZAR'}</button>
        <button class="st-b" data-act="pieceSave" ${isPiece && evidence.preview ? '' : 'disabled'}>${stateDot(evidence.saved, evidence.preview)}GUARDAR PIEZA</button>
        <button class="st-b" data-act="pieceValidate" ${isPiece && evidence.saved ? '' : 'disabled'}>${stateDot(evidence.validated, evidence.saved)}VALIDAR PIEZA</button>
        <button class="st-b" data-act="routeTest" ${summary.validated ? '' : 'disabled'}>${stateDot(summary.routeTested, summary.validated > 0)}${routeBusy ? 'INICIANDO…' : 'PROBAR RECORRIDO'}</button>
        <button class="st-b st-b--go" data-act="routeApprove" ${summary.routeTested && summary.validated === summary.targets.length && summary.targets.length ? '' : 'disabled'}>${stateDot(summary.routeApproved, summary.routeTested)}APROBAR RECORRIDO</button>
      </div>
    </header>`;
};

const originalReadiness = StudioShell.prototype._readiness;
StudioShell.prototype._readiness = function validationReadiness(r) {
  const base = originalReadiness.call(this, r);
  const personalisedPct = r.requiredTotal ? Math.round((r.requiredReady / r.requiredTotal) * 100) : 100;
  const summary = validationSummary(this);
  const entity = this.selectedEntity;
  const evidence = entity ? pieceEvidence(this) : null;
  const approvedLabel = summary.routeApproved ? 'RECORRIDO APROBADO' : 'RECORRIDO PENDIENTE';

  const flow = `
    <section class="st-flowstate" aria-label="Validación funcional">
      <h3>Control de validación</h3>
      <div class="st-flowmetrics">
        <div><b>${personalisedPct}%</b><span>Personalizado</span></div>
        <div><b>${summary.pct}%</b><span>Validado</span></div>
      </div>
      <div class="st-flowapproval ${summary.routeApproved ? 'is-ok' : ''}">${stateDot(summary.routeApproved, summary.routeTested)}<b>${approvedLabel}</b></div>
      ${entity ? `<ol class="st-flowsteps">
        <li class="${evidence.preview ? 'is-ok' : ''}">${stateDot(evidence.preview)}<span>1. Previsualizar en sala</span></li>
        <li class="${evidence.saved ? 'is-ok' : ''}">${stateDot(evidence.saved, evidence.preview)}<span>2. Guardar pieza</span></li>
        <li class="${evidence.validated ? 'is-ok' : ''}">${stateDot(evidence.validated, evidence.saved)}<span>3. Validar pieza</span></li>
        <li class="${summary.routeTested ? 'is-ok' : ''}">${stateDot(summary.routeTested, summary.validated > 0)}<span>4. Probar recorrido</span></li>
        <li class="${summary.routeApproved ? 'is-ok' : ''}">${stateDot(summary.routeApproved, summary.routeTested)}<span>5. Aprobar recorrido</span></li>
      </ol>` : '<p class="st-note">Selecciona una pieza para ver su cadena de validación.</p>'}
      <p class="st-note">Un punto verde significa evidencia funcional de esta versión. Editar una pieza invalida su validación y cualquier aprobación del recorrido.</p>
    </section>`;

  return base.replace('<h2>Proyecto</h2>', `<h2>Proyecto</h2>${flow}`);
};

const originalBind = StudioShell.prototype._bind;
StudioShell.prototype._bind = function validationBind(scope = this.root) {
  originalBind.call(this, scope);
  const on = (selector, fn) => {
    for (const el of scope.querySelectorAll(selector)) {
      if (el.dataset.flowBound) continue;
      el.dataset.flowBound = '1';
      el.addEventListener('click', fn);
    }
  };

  on('[data-act="piecePreview"]', async () => this._validationPreviewPiece());
  on('[data-act="pieceSave"]', () => this._validationSavePiece());
  on('[data-act="pieceValidate"]', async () => this._validationValidatePiece());
  on('[data-act="routeTest"]', async () => this._validationTestRoute());
  on('[data-act="routeApprove"]', () => this._validationApproveRoute());
};

const originalMarkDirty = StudioShell.prototype._markDirty;
StudioShell.prototype._markDirty = function validationMarkDirty(...args) {
  originalMarkDirty.apply(this, args);
  const ledger = loadLedger();
  if (this.selectedEntity) delete ledger.pieces[this.selectedId];
  ledger.route = {};
  saveLedger(ledger);
};

StudioShell.prototype._validationPreviewPiece = async function validationPreviewPiece() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de previsualizar.', true);
  this.busy = 'preview';
  this.render();
  try {
    await this.onReveal(this.selectedId);
    await settleFrames();
    const result = inspectPiece(this);
    if (!result.ok) return this._say(`PREVIEW CON ERROR · ${result.reason}`, true);
    const ledger = loadLedger();
    const hash = pieceHash(this);
    ledger.pieces[this.selectedId] = {
      ...(ledger.pieces[this.selectedId] || {}),
      previewHash: hash,
      previewAt: new Date().toISOString()
    };
    ledger.route = {};
    saveLedger(ledger);
    this._say(`PREVIEW OK · ${result.reason}`);
  } catch (error) {
    this._say(`PREVIEW CON ERROR · ${String(error?.message || error)}`, true);
  } finally {
    this.busy = null;
    this.render();
  }
};

StudioShell.prototype._validationSavePiece = function validationSavePiece() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de guardar.', true);
  const evidence = pieceEvidence(this);
  if (!evidence.preview) return this._say('Primero previsualiza esta versión de la pieza.', true);

  const result = inspectPiece(this);
  if (!result.ok) return this._say(`No se guarda como válida: ${result.reason}`, true);

  ConfigStore.save(this.config);
  this.dirty = false;
  this.savedAt = new Date();
  const ledger = loadLedger();
  const hash = pieceHash(this);
  ledger.pieces[this.selectedId] = {
    ...(ledger.pieces[this.selectedId] || {}),
    previewHash: hash,
    savedHash: hash,
    savedAt: new Date().toISOString()
  };
  ledger.route = {};
  saveLedger(ledger);
  this._say('PIEZA GUARDADA · configuración y medio siguen resolubles en esta sesión. Falta VALIDAR PIEZA.');
};

StudioShell.prototype._validationValidatePiece = async function validationValidatePiece() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de validar.', true);
  const before = pieceEvidence(this);
  if (!before.saved) return this._say('Primero guarda esta versión de la pieza.', true);

  try {
    // Validation deliberately re-enters the piece through the navigation contract
    // instead of trusting the surface left by upload. This catches tree/room/focus
    // drift without pretending a file is good because its thumbnail is green.
    await this.onReveal(this.selectedId);
    await settleFrames(4);
    const result = inspectPiece(this);
    if (!result.ok) return this._say(`VALIDACIÓN FALLIDA · ${result.reason}`, true);

    const ledger = loadLedger();
    const hash = pieceHash(this);
    ledger.pieces[this.selectedId] = {
      ...(ledger.pieces[this.selectedId] || {}),
      previewHash: hash,
      savedHash: hash,
      validatedHash: hash,
      validatedAt: new Date().toISOString()
    };
    ledger.route = {};
    saveLedger(ledger);
    this._say(`PIEZA VALIDADA · ${result.reason}`);
  } catch (error) {
    this._say(`VALIDACIÓN FALLIDA · ${String(error?.message || error)}`, true);
  }
};

StudioShell.prototype._validationTestRoute = async function validationTestRoute() {
  const runtime = window.__IW?.runtime;
  const route = runtime?.store?.routes?.[0];
  if (!runtime || !route) return this._say('Este proyecto no tiene un recorrido disponible.', true);

  const summary = validationSummary(this);
  if (!summary.validated) return this._say('Valida al menos una pieza antes de probar el recorrido.', true);

  this.busy = 'route';
  this.render();
  try {
    // A route is authored from the world's start. Starting it from Gallery B and
    // merely handing the camera to DIRECTED produced black frames because the
    // first shot was in Lobby while World State still said Gallery B.
    try { runtime.releaseFocus(); } catch { /* no focus */ }
    if (runtime.state.mode === 'GUIDED') {
      try { runtime.exitRoute(); } catch { /* idle */ }
    }
    const arrived = await navigateRuntime(runtime, runtime.store.startSpaceId);
    if (!arrived) throw new Error('No se pudo volver al inicio del recorrido.');
    await settleFrames(3);
    this._applyExperienceSettings();
    runtime.startRoute(route.id);

    const ledger = loadLedger();
    ledger.route = {
      testedHash: configHash(this.config),
      testedAt: new Date().toISOString(),
      approvedHash: null,
      approvedAt: null
    };
    saveLedger(ledger);
    this._say('RECORRIDO EN PRUEBA · obsérvalo completo. Si todo funciona, vuelve al Studio y pulsa APROBAR RECORRIDO.');
  } catch (error) {
    this._say(`NO SE PUDO PROBAR EL RECORRIDO · ${String(error?.message || error)}`, true);
  } finally {
    this.busy = null;
    this.render();
  }
};

StudioShell.prototype._validationApproveRoute = function validationApproveRoute() {
  const summary = validationSummary(this);
  if (!summary.routeTested) return this._say('Primero prueba el recorrido completo.', true);
  if (!summary.targets.length || summary.validated !== summary.targets.length) {
    return this._say(`No se puede aprobar: ${summary.validated}/${summary.targets.length} piezas del recorrido están validadas.`, true);
  }
  if (!this.readiness.canStart) return this._say('No se puede aprobar: el proyecto todavía tiene bloqueos de contenido/readiness.', true);

  const ledger = loadLedger();
  ledger.route = {
    ...(ledger.route || {}),
    testedHash: configHash(this.config),
    approvedHash: configHash(this.config),
    approvedAt: new Date().toISOString()
  };
  saveLedger(ledger);
  this._say('RECORRIDO APROBADO · 100% funcional para esta versión. Cualquier modificación exigirá revalidación.');
};

window.__IW_VALIDATION_FLOW = {
  key: LEDGER_KEY,
  load: loadLedger,
  summary: () => window.__IW_STUDIO ? validationSummary(window.__IW_STUDIO) : null
};
