/**
 * Museum — local configuration store.
 *
 * Browser-local on purpose for this slice: the point is to prove that authoring
 * is data that survives a reset, not to choose a cloud yet.
 *
 * Config is lightweight JSON, so localStorage remains the right layer. Authored
 * media bytes are persisted separately by MediaVault in IndexedDB.
 *
 * IMPORTANT: configuration is namespaced by world/project. A temporary
 * exhibition must never restore Fundación Arenas' config, and vice versa.
 */

import { normaliseConfig, exportConfigJSON, importConfigJSON } from './experience-config.js';

const BASE_KEY = 'iw.museum.authoring.v1';
let scope = 'default';

function safeScope(value) {
  return String(value || 'default')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

function key() {
  return `${BASE_KEY}.${scope}`;
}

export const ConfigStore = {
  setScope(value) {
    scope = safeScope(value);
    return scope;
  },

  getScope() { return scope; },
  getKey() { return key(); },

  save(config) {
    const normalised = normaliseConfig(config);
    localStorage.setItem(key(), JSON.stringify(normalised));
    return normalised;
  },

  load() {
    const raw = localStorage.getItem(key());
    if (!raw) return null;
    try { return importConfigJSON(raw); } catch { return null; }
  },

  clear() { localStorage.removeItem(key()); },

  toJSON: exportConfigJSON,
  fromJSON: importConfigJSON
};
