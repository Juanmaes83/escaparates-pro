import { Runtime } from '../engine/core/runtime.js';
import { StudioShell } from './studio/studio-shell.js';
import { ConfigStore } from './config-store.js';
import { installMuseumMediaBindingRestorer } from './museum-media-binding-restorer.js';

/**
 * Persistence bridge that survives full Museum rebuilds.
 *
 * experience-app may create a fresh Runtime whenever Studio applies changes.
 * Patching Runtime.start keeps the media restorer attached to every generation,
 * not only the first boot of the recovery receiver.
 */

if (!Runtime.prototype.__projectPersistenceInstalled) {
  Runtime.prototype.__projectPersistenceInstalled = true;
  const originalStart = Runtime.prototype.start;
  Runtime.prototype.start = async function projectPersistentStart(...args) {
    const result = await originalStart.apply(this, args);
    installMuseumMediaBindingRestorer({
      runtime: this,
      getConfig: () => window.__IW_STUDIO?.config || window.__IW_CONFIG || ConfigStore.load()
    });
    return result;
  };
}

if (!StudioShell.prototype.__projectPersistenceStudioInstalled) {
  StudioShell.prototype.__projectPersistenceStudioInstalled = true;

  const previousRender = StudioShell.prototype.render;
  StudioShell.prototype.render = function projectPersistentRender(...args) {
    window.__IW_STUDIO = this;
    window.__IW_CONFIG = this.config;
    return previousRender.apply(this, args);
  };

  const previousMarkDirty = StudioShell.prototype._markDirty;
  StudioShell.prototype._markDirty = function projectPersistentDirty(...args) {
    const result = previousMarkDirty.apply(this, args);
    window.__IW_STUDIO = this;
    window.__IW_CONFIG = this.config;
    return result;
  };
}

export function currentProjectConfig() {
  return window.__IW_STUDIO?.config || window.__IW_CONFIG || ConfigStore.load();
}
