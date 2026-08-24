import { StudioShell } from './studio-shell.js';
import { ProjectAssetStore } from '../project-asset-store.js';

function selectedAuthoredMedia(studio) {
  const authored = studio.config?.entities?.[studio.selectedId] || {};
  if (authored.video?.assetId) return authored.video;
  if (authored.image?.assetId) return authored.image;
  return null;
}

function referencedAssetIds(config) {
  const ids = new Set();
  const add = (media) => { if (media?.assetId) ids.add(media.assetId); };
  add(config?.institution?.logo);
  for (const entity of Object.values(config?.entities || {})) {
    add(entity?.image);
    add(entity?.video);
  }
  return [...ids];
}

async function settleFrames(count = 4) {
  for (let i = 0; i < count; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
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
    await runtime.traversePortal(portal.id, { source: 'STUDIO_DURABLE_VALIDATION' });
  }
  return runtime.state.activeSpaceId === targetSpaceId;
}

function farthestReachableSpace(runtime, targetSpaceId) {
  let best = null;
  let bestLength = 0;
  for (const space of runtime.store?.spaces || []) {
    if (space.id === targetSpaceId) continue;
    const path = runtime.graph?.path?.(targetSpaceId, space.id);
    if (path && path.length > bestLength) {
      best = space.id;
      bestLength = path.length;
    }
  }
  return bestLength >= 3 ? best : null;
}

async function forceLifecycleRoundTrip(studio) {
  const runtime = window.__IW?.runtime;
  const entity = studio.selectedEntity;
  const targetSpaceId = entity?.spaceId;
  if (!runtime || !targetSpaceId) throw new Error('No hay Runtime o sala objetivo para validar la recuperación.');

  try { runtime.releaseFocus(); } catch { /* no focus */ }

  const parkingSpaceId = farthestReachableSpace(runtime, targetSpaceId);
  if (!parkingSpaceId) {
    throw new Error('No existe una sala suficientemente lejana para forzar una reconstrucción segura.');
  }

  const left = await navigateRuntime(runtime, parkingSpaceId);
  if (!left) throw new Error('No se pudo salir de la sala durante la validación durable.');
  await settleFrames(3);

  const stateAfterLeave = runtime.lifecycle?.stateOf?.(targetSpaceId) || 'UNKNOWN';
  // The working-set policy should dispose a room that is no longer active,
  // previous or adjacent. If it remains resident, validation would only prove
  // the same live mesh again, so fail rather than award a false green.
  if (stateAfterLeave !== 'DISPOSED' && stateAfterLeave !== 'UNLOADED') {
    throw new Error(`La sala no llegó a destruirse (${stateAfterLeave}); no se puede certificar recuperación real.`);
  }

  const returned = await navigateRuntime(runtime, targetSpaceId);
  if (!returned) throw new Error('No se pudo volver a la sala para comprobar la restauración.');
  await settleFrames(8);

  return { targetSpaceId, parkingSpaceId, stateAfterLeave };
}

const previousSave = StudioShell.prototype._validationSavePiece;
StudioShell.prototype._validationSavePiece = async function durableSavePiece(...args) {
  const media = selectedAuthoredMedia(this);
  if (media?.assetId) {
    const durable = await ProjectAssetStore.has(media.assetId).catch(() => false);
    if (!durable) {
      return this._say('GUARDADO BLOQUEADO · el archivo todavía no existe en el almacén durable del proyecto.', true);
    }
  }

  const result = await previousSave.apply(this, args);
  // Garbage collection is reference-aware: replacing a reused asset never
  // revokes another piece. Only ids absent from every current binding are purged.
  if (this.vault?.collect) {
    await this.vault.collect(referencedAssetIds(this.config)).catch(() => {});
  }
  return result;
};

const previousValidate = StudioShell.prototype._validationValidatePiece;
StudioShell.prototype._validationValidatePiece = async function durableValidatePiece(...args) {
  const media = selectedAuthoredMedia(this);
  if (media?.assetId) {
    const durable = await ProjectAssetStore.has(media.assetId).catch(() => false);
    if (!durable) {
      return this._say('VALIDACIÓN FALLIDA · el medio no está guardado de forma durable.', true);
    }
  }

  const selectedId = this.selectedId;
  try {
    this._say('VALIDANDO DURABILIDAD · saliendo de la sala, destruyéndola y volviendo…');
    await forceLifecycleRoundTrip(this);
    // Selection belongs to the Studio; navigation must not silently change what
    // the author is certifying.
    this.selectedId = selectedId;
    await settleFrames(4);
    const result = await previousValidate.apply(this, args);
    if (media?.assetId) {
      const stillDurable = await ProjectAssetStore.has(media.assetId).catch(() => false);
      if (!stillDurable) {
        return this._say('VALIDACIÓN FALLIDA · el asset desapareció del almacén durable durante la prueba.', true);
      }
    }
    return result;
  } catch (error) {
    this.selectedId = selectedId;
    this.render();
    return this._say(`VALIDACIÓN FALLIDA · ${String(error?.message || error)}`, true);
  }
};

window.__IW_DURABLE_VALIDATION = { forceLifecycleRoundTrip, referencedAssetIds };

export { forceLifecycleRoundTrip, referencedAssetIds };
