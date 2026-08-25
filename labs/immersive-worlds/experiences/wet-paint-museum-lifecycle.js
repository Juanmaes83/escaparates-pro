import { EVENTS } from '../engine/core/event-bus.js';
import { SPACE_STATE } from '../engine/schema/types.js';
import { installWetPaint } from './wet-paint-adapter.js';

/**
 * Museum host seam for the Human-PASS Wet Paint donor.
 *
 * The isolated wet-paint-studio starts directly inside the itinerant room, so
 * its artwork plates exist when installWetPaint() restores stored results. The
 * full Museum starts in Lobby; restoring at boot therefore used to be a silent
 * no-op. This wrapper keeps one Wet Paint engine but binds restoration to the
 * canonical SpaceLifecycle facts instead of boot timing.
 */

export const WET_PAINT_SPACE_ID = 'space.itinerant-wet-paint';

export function installWetPaintMuseumLifecycle(runtime) {
  if (!runtime?.bus || !runtime?.spaces) {
    console.error('[WetPaint Museum] runtime lifecycle unavailable');
    return null;
  }

  const installed = installWetPaint(runtime);
  if (!installed?.engine) return null;

  const { engine } = installed;
  let restoreChain = Promise.resolve();
  let disposed = false;

  const roomExists = () => {
    const state = runtime.spaces.stateOf(WET_PAINT_SPACE_ID);
    return state === SPACE_STATE.READY || state === SPACE_STATE.ACTIVE || state === SPACE_STATE.COOLING;
  };

  const restore = (reason) => {
    if (!roomExists()) return Promise.resolve(false);
    restoreChain = restoreChain
      .catch(() => false)
      .then(async () => {
        try {
          await engine.restoreAll();
          window.__IW_WET_PAINT_ROOM = {
            spaceId: WET_PAINT_SPACE_ID,
            status: 'RESTORED',
            reason,
            at: new Date().toISOString()
          };
          return true;
        } catch (error) {
          console.error('[WetPaint Museum] restore failed', error);
          window.__IW_WET_PAINT_ROOM = {
            spaceId: WET_PAINT_SPACE_ID,
            status: 'ERROR',
            reason,
            message: String(error?.message || error),
            at: new Date().toISOString()
          };
          return false;
        }
      });
    return restoreChain;
  };

  const offReady = runtime.bus.on(EVENTS.SPACE_READY, ({ spaceId }) => {
    if (spaceId === WET_PAINT_SPACE_ID) restore('SPACE_READY');
  });
  const offEntered = runtime.bus.on(EVENTS.SPACE_ENTERED, ({ spaceId }) => {
    if (spaceId === WET_PAINT_SPACE_ID) restore('SPACE_ENTERED');
  });
  const offDisposed = runtime.bus.on(EVENTS.SPACE_DISPOSED, ({ spaceId }) => {
    if (spaceId !== WET_PAINT_SPACE_ID) return;
    window.__IW_WET_PAINT_ROOM = {
      spaceId: WET_PAINT_SPACE_ID,
      status: 'DISPOSED',
      at: new Date().toISOString()
    };
  });

  // The room may already be preloaded as a neighbour by the time this host seam
  // is installed. Restore once immediately only when a real room handle exists.
  if (roomExists()) restore('INSTALL_ALREADY_READY');

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    offReady?.();
    offEntered?.();
    offDisposed?.();
  };

  return { ...installed, restore, dispose, spaceId: WET_PAINT_SPACE_ID };
}
