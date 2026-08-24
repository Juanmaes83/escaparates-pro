import { StudioShell } from './studio-shell.js';
import { ConfigStore } from '../config-store.js';

/**
 * Validation hardening after Gallery A/B human QA.
 *
 * 1) VIDEO entities are validated against their canonical screen PlaneGeometry,
 *    never against the larger bezel BoxGeometry.
 * 2) "PROBAR RECORRIDO" becomes evidence only after route:completed. Starting a
 *    route is not proof that it worked.
 */

const LEDGER_KEY = 'iw.museum.validation.v1';

const loadLedger = () => {
  try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null') || { version: 1, pieces: {}, route: {} }; }
  catch { return { version: 1, pieces: {}, route: {} }; }
};
const saveLedger = (ledger) => localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));

function hashString(value) {
  let h = 2166136261;
  const s = String(value || '');
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}
function configHash(config) { return hashString(JSON.stringify(stable(config))); }
function pieceHash(studio, entityId = studio.selectedId) {
  const entity = (studio.world.entities || []).find((item) => item.id === entityId) || null;
  const authored = studio.config.entities?.[entityId] || null;
  return hashString(JSON.stringify(stable({ id: entityId, kind: entity?.kind || null, baseMedia: entity?.content?.media || null, authored })));
}
function pieceEvidence(studio) {
  const ledger = loadLedger();
  const hash = pieceHash(studio);
  const evidence = ledger.pieces?.[studio.selectedId] || {};
  return { hash, preview: evidence.previewHash === hash, saved: evidence.savedHash === hash, validated: evidence.validatedHash === hash };
}

function videoMedia(studio) {
  const authored = studio.config.entities?.[studio.selectedId] || {};
  if (authored.video?.src) return { media: authored.video, kind: 'video' };
  if (authored.image?.src) return { media: authored.image, kind: 'image' };
  const entity = studio.selectedEntity;
  return { media: entity?.content?.media || null, kind: String(entity?.content?.media?.kind || '').toLowerCase() };
}

function inspectVideoEntity(studio) {
  const entity = studio.selectedEntity;
  if (entity?.kind !== 'VIDEO') return null;
  const findVideoScreen = window.__MUSEUM_VIDEO_ENTITY_MEDIA?.findVideoScreen;
  if (!findVideoScreen) return { ok: false, reason: 'El adapter de pantalla de vídeo no está disponible.' };

  let screen;
  try { screen = findVideoScreen(window.__IW?.runtime?.sceneKit, entity.id); }
  catch (error) { return { ok: false, reason: String(error?.message || error) }; }

  const { media, kind } = videoMedia(studio);
  if (!media) return { ok: true, reason: 'Pantalla visible. No tiene medio sustituible configurado.' };
  if (media.assetId) {
    const asset = studio.vault.get(media.assetId);
    if (!asset || asset.state !== 'READY') return { ok: false, reason: 'El archivo de la pantalla todavía no está READY.' };
  }

  const map = screen.material?.map || null;
  if (!map) return { ok: false, reason: 'La pantalla existe, pero no tiene textura aplicada.' };
  if (kind === 'video' || String(media.kind || '').toLowerCase() === 'video') {
    const video = map.isVideoTexture ? map.image : null;
    if (!video) return { ok: false, reason: 'La pantalla no contiene el VideoTexture seleccionado.' };
    if (Number(video.readyState || 0) < 2) return { ok: false, reason: 'El vídeo todavía no puede dibujar frames.' };
    return { ok: true, reason: video.paused ? 'Vídeo visible; espera gesto de reproducción.' : 'Vídeo visible y reproduciéndose en Cuaderno de luz.' };
  }
  return { ok: true, reason: 'Imagen visible en la pantalla de Cuaderno de luz.' };
}

async function settleFrames(count = 4) {
  for (let i = 0; i < count; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
}

const previousPreview = StudioShell.prototype._validationPreviewPiece;
StudioShell.prototype._validationPreviewPiece = async function hardenedPreviewPiece() {
  if (this.selectedEntity?.kind !== 'VIDEO') return previousPreview.call(this);
  this.busy = 'preview';
  this.render();
  try {
    await this.onReveal(this.selectedId);
    await settleFrames();
    const result = inspectVideoEntity(this);
    if (!result?.ok) return this._say(`PREVIEW CON ERROR · ${result?.reason || 'Pantalla no disponible.'}`, true);
    const ledger = loadLedger();
    const hash = pieceHash(this);
    ledger.pieces ||= {};
    ledger.pieces[this.selectedId] = { ...(ledger.pieces[this.selectedId] || {}), previewHash: hash, previewAt: new Date().toISOString() };
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

const previousSave = StudioShell.prototype._validationSavePiece;
StudioShell.prototype._validationSavePiece = function hardenedSavePiece() {
  if (this.selectedEntity?.kind !== 'VIDEO') return previousSave.call(this);
  const evidence = pieceEvidence(this);
  if (!evidence.preview) return this._say('Primero previsualiza esta versión de la pantalla.', true);
  const result = inspectVideoEntity(this);
  if (!result?.ok) return this._say(`No se guarda como válida: ${result?.reason || 'Pantalla no disponible.'}`, true);

  ConfigStore.save(this.config);
  this.dirty = false;
  this.savedAt = new Date();
  const ledger = loadLedger();
  const hash = pieceHash(this);
  ledger.pieces ||= {};
  ledger.pieces[this.selectedId] = { ...(ledger.pieces[this.selectedId] || {}), previewHash: hash, savedHash: hash, savedAt: new Date().toISOString() };
  ledger.route = {};
  saveLedger(ledger);
  this._say('PIEZA GUARDADA · Cuaderno de luz sigue visible. Falta VALIDAR PIEZA.');
};

const previousValidate = StudioShell.prototype._validationValidatePiece;
StudioShell.prototype._validationValidatePiece = async function hardenedValidatePiece() {
  if (this.selectedEntity?.kind !== 'VIDEO') return previousValidate.call(this);
  const evidence = pieceEvidence(this);
  if (!evidence.saved) return this._say('Primero guarda esta versión de la pantalla.', true);
  try {
    await this.onReveal(this.selectedId);
    await settleFrames();
    const result = inspectVideoEntity(this);
    if (!result?.ok) return this._say(`VALIDACIÓN FALLIDA · ${result?.reason || 'Pantalla no disponible.'}`, true);
    const ledger = loadLedger();
    const hash = pieceHash(this);
    ledger.pieces ||= {};
    ledger.pieces[this.selectedId] = {
      ...(ledger.pieces[this.selectedId] || {}),
      previewHash: hash, savedHash: hash, validatedHash: hash, validatedAt: new Date().toISOString()
    };
    ledger.route = {};
    saveLedger(ledger);
    this._say(`PIEZA VALIDADA · ${result.reason}`);
  } catch (error) {
    this._say(`VALIDACIÓN FALLIDA · ${String(error?.message || error)}`, true);
  }
};

async function navigateRuntime(runtime, targetSpaceId) {
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

// Invalidate route evidence created by the earlier V1 behaviour, which marked a
// test as successful at route START rather than route COMPLETION.
{
  const ledger = loadLedger();
  if (ledger.route?.testedHash && !ledger.route?.completionConfirmed) {
    ledger.route = {};
    saveLedger(ledger);
  }
}

StudioShell.prototype._validationTestRoute = async function hardenedTestRoute() {
  const runtime = window.__IW?.runtime;
  const route = runtime?.store?.routes?.[0];
  if (!runtime || !route) return this._say('Este proyecto no tiene un recorrido disponible.', true);

  const summary = window.__IW_VALIDATION_FLOW?.summary?.();
  if (!summary?.validated) return this._say('Valida al menos una pieza antes de probar el recorrido.', true);

  this.busy = 'route';
  this.render();
  try {
    try { runtime.releaseFocus(); } catch { /* no focus */ }
    if (runtime.state.mode === 'GUIDED') { try { runtime.exitRoute(); } catch { /* idle */ } }
    const arrived = await navigateRuntime(runtime, runtime.store.startSpaceId);
    if (!arrived) throw new Error('No se pudo volver al inicio del recorrido.');
    await settleFrames(3);
    this._applyExperienceSettings();

    const ledger = loadLedger();
    ledger.route = { startedHash: configHash(this.config), startedAt: new Date().toISOString() };
    saveLedger(ledger);

    runtime.bus.once('route:completed', () => {
      const completed = loadLedger();
      completed.route = {
        ...(completed.route || {}),
        testedHash: configHash(this.config),
        testedAt: new Date().toISOString(),
        completionConfirmed: true,
        approvedHash: null,
        approvedAt: null
      };
      saveLedger(completed);
      this._say('RECORRIDO COMPLETADO · prueba registrada. Ya puede aprobarse cuando todas las piezas del recorrido estén validadas.');
    });

    runtime.startRoute(route.id);
    this._say('RECORRIDO EN PRUEBA · debe llegar al final para quedar registrado como probado.');
  } catch (error) {
    this._say(`NO SE PUDO PROBAR EL RECORRIDO · ${String(error?.message || error)}`, true);
  } finally {
    this.busy = null;
    this.render();
  }
};

window.__IW_VALIDATION_HARDENING = { inspectVideoEntity };
