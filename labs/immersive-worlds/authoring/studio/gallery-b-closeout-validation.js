import { StudioShell } from './studio-shell.js';
import { findArtworkPlate } from '../museum-visible-media.js';
import { findProjectionSurface } from '../museum-projection-authored-clean.js';
import { ConfigStore } from '../config-store.js';

const LEDGER_KEY = 'iw.museum.validation.v1';

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
};

function hashString(value) {
  let h = 2166136261;
  const s = String(value || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function loadLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null');
    if (parsed?.version === 1) return parsed;
  } catch { /* no evidence */ }
  return { version: 1, pieces: {}, route: {} };
}

function saveLedger(ledger) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

function pieceHash(studio, entityId = studio.selectedId) {
  const entity = (studio.world.entities || []).find((item) => item.id === entityId) || null;
  const authored = studio.config.entities?.[entityId] || null;
  return hashString(JSON.stringify(stable({ id: entityId, kind: entity?.kind || null, baseMedia: entity?.content?.media || null, authored })));
}

function evidence(studio) {
  const ledger = loadLedger();
  const current = ledger.pieces?.[studio.selectedId] || {};
  const hash = pieceHash(studio);
  return { hash, preview: current.previewHash === hash, saved: current.savedHash === hash };
}

function selectedMedia(studio) {
  const entity = studio.selectedEntity;
  const authored = studio.config.entities?.[studio.selectedId] || {};
  if (!entity) return { entity: null, media: null, kind: null };
  if (authored.video?.src) return { entity, media: authored.video, kind: 'video' };
  if (authored.image?.src) return { entity, media: authored.image, kind: 'image' };
  const own = entity.content?.media || null;
  return { entity, media: own, kind: String(own?.kind || '').toLowerCase() };
}

function exactSurface(entity) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit || !entity) return null;
  if (entity.kind === 'ARTWORK') {
    try { return findArtworkPlate(sceneKit, entity.id); } catch { return null; }
  }
  if (entity.kind === 'PROJECTION') {
    try { return findProjectionSurface(sceneKit, entity.id); } catch { return null; }
  }
  const record = sceneKit._entityIndex?.get(entity.id);
  return record?.object || null;
}

function inspectExact(studio) {
  const { entity, media, kind } = selectedMedia(studio);
  if (!entity) return { ok: false, reason: 'Selecciona una pieza del Museo.' };
  const surface = exactSurface(entity);
  if (!surface?.material) return { ok: false, reason: 'No se encontró la superficie visual exacta de esta pieza.' };

  if (media?.assetId) {
    const asset = studio.vault?.get?.(media.assetId);
    if (!asset || asset.state !== 'READY') return { ok: false, reason: 'El medio todavía no está READY en la biblioteca.' };
  }

  if (!media) return { ok: true, reason: 'Pieza visible sin medio sustituible.' };
  const map = surface.material.map || null;
  if (!map) return { ok: false, reason: 'La superficie exacta no tiene la textura aplicada.' };

  if (kind === 'video' || String(media.kind || '').toLowerCase() === 'video') {
    if (!map.isVideoTexture) return { ok: false, reason: 'La superficie exacta no contiene un VideoTexture.' };
    const video = map.image;
    if (Number(video?.readyState || 0) < 2) return { ok: false, reason: 'El vídeo aún no puede dibujar frames.' };
    return { ok: true, reason: video.paused ? 'Vídeo visible; espera gesto del navegador para reproducir.' : 'Vídeo visible y reproduciéndose.' };
  }
  return { ok: true, reason: 'Imagen visible en la superficie exacta.' };
}

async function settle(count = 4) {
  for (let i = 0; i < count; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
}

StudioShell.prototype._validationPreviewPiece = async function closeoutPreview() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de previsualizar.', true);
  this.busy = 'preview';
  this.render();
  try {
    await this.onReveal(this.selectedId);
    await settle();
    const result = inspectExact(this);
    if (!result.ok) return this._say(`PREVIEW CON ERROR · ${result.reason}`, true);
    const ledger = loadLedger();
    const hash = pieceHash(this);
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

StudioShell.prototype._validationSavePiece = function closeoutSave() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de guardar.', true);
  const before = evidence(this);
  if (!before.preview) return this._say('Primero previsualiza esta versión de la pieza.', true);
  const result = inspectExact(this);
  if (!result.ok) return this._say(`No se guarda como válida: ${result.reason}`, true);
  ConfigStore.save(this.config);
  this.dirty = false;
  this.savedAt = new Date();
  const ledger = loadLedger();
  const hash = pieceHash(this);
  ledger.pieces[this.selectedId] = { ...(ledger.pieces[this.selectedId] || {}), previewHash: hash, savedHash: hash, savedAt: new Date().toISOString() };
  ledger.route = {};
  saveLedger(ledger);
  this._say('PIEZA GUARDADA · superficie exacta comprobada. Falta VALIDAR PIEZA.');
};

StudioShell.prototype._validationValidatePiece = async function closeoutValidate() {
  if (!this.selectedEntity) return this._say('Selecciona una pieza antes de validar.', true);
  const before = evidence(this);
  if (!before.saved) return this._say('Primero guarda esta versión de la pieza.', true);
  try {
    await this.onReveal(this.selectedId);
    await settle();
    const result = inspectExact(this);
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

window.__IW_GALLERY_B_CLOSEOUT = { inspectExact };
