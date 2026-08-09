/**
 * Immersive Worlds — Thin Authoring Layer
 *
 * IW-DEC-007: V1 authoring must be *thin*. It has to prove that a World, its
 * Spaces, Content, Hotspots, Portals and Route are editable data — and it must
 * not become a Unity clone, an asset browser or a professional timeline.
 *
 * So this surface does exactly four things:
 *
 *   1. Shows the canonical records grouped by kind, resolved by ID.
 *   2. Edits a small set of fields on the selected record, through
 *      WorldStore.edit() — the one door into canonical data.
 *   3. Rebuilds the affected Space so the change is visible immediately. That
 *      round trip is the actual proof: content changes without touching scene
 *      code, because the Scene Kit reads the record, not a hard-coded scene.
 *   4. Exports the edited World back out as JSON.
 *
 * It also proves a boundary the Constitution insists on: Author Mode holds a
 * *different* camera authority (AUTHOR, an orbit rig) from the one the visitor
 * uses, and the two never run at once.
 *
 * Deliberately absent (SHOULD LATER): drag-and-drop placement, an inspector for
 * every field, undo history, asset library, timeline editing, multi-user.
 */

import { Runtime } from '../engine/core/runtime.js';
import { CAMERA_AUTHORITY, RECORD } from '../engine/schema/types.js';
import { EVENTS } from '../engine/core/event-bus.js';
import { validateWorld } from '../engine/schema/validate.js';
import { RenderHost } from '../render/render-host.js';
import { MuseumSceneKit } from '../scene-kits/museum/museum-scene-kit.js';
import { detectTier, policyForTier } from '../engine/core/device-tier.js';

const params = new URLSearchParams(location.search);
const WORLD_URL = params.get('world') || './worlds/museum-v1.world.json';

/** The only fields V1 authoring exposes. Small on purpose. */
const EDITABLE = {
  [RECORD.SPACE]: [
    { path: 'title', label: 'Título', type: 'text' },
    { path: 'sceneProfile', label: 'Perfil visual', type: 'select', options: ['white-cube', 'dark-exhibition', 'heritage'] },
    { path: 'ambience', label: 'Ambiente sonoro', type: 'text' }
  ],
  [RECORD.ENTITY]: [
    { path: 'content.title', label: 'Título', type: 'text' },
    { path: 'content.creator', label: 'Autoría', type: 'text' },
    { path: 'content.year', label: 'Año', type: 'text' },
    { path: 'content.medium', label: 'Técnica', type: 'text' },
    { path: 'content.description', label: 'Texto de sala', type: 'textarea' },
    { path: 'accessibility.label', label: 'Etiqueta accesible', type: 'text' },
    { path: 'accessibility.description', label: 'Descripción accesible', type: 'textarea' },
    { path: 'size.0', label: 'Ancho (m)', type: 'number' },
    { path: 'size.1', label: 'Alto (m)', type: 'number' },
    { path: 'representation.hints.composition', label: 'Composición (intención)', type: 'select', options: ['horizon-bands', 'field', 'hard-edge', 'graphite-study', 'photogravure'] },
    { path: 'representation.hints.palette', label: 'Paleta (intención)', type: 'select', options: ['umber', 'prussian', 'ochre', 'oxblood', 'slate', 'verdigris'] },
    { path: 'anchorId', label: 'Anclaje', type: 'anchor' }
  ],
  [RECORD.ANCHOR]: [
    { path: 'position.0', label: 'X (m)', type: 'number' },
    { path: 'position.1', label: 'Y (m)', type: 'number' },
    { path: 'position.2', label: 'Z (m)', type: 'number' },
    { path: 'label', label: 'Etiqueta', type: 'text' }
  ],
  [RECORD.HOTSPOT]: [
    { path: 'triggerDistance', label: 'Distancia de activación (m)', type: 'number' },
    { path: 'visualPolicy', label: 'Marca visible', type: 'select', options: ['ALWAYS', 'NEAR', 'NEVER'] },
    { path: 'accessibilityLabel', label: 'Etiqueta accesible', type: 'text' },
    { path: 'enabled', label: 'Activo', type: 'boolean' }
  ],
  [RECORD.PORTAL]: [
    { path: 'transitionBehaviour', label: 'Comportamiento de transición', type: 'select', options: ['CONTINUOUS', 'CUT', 'TELEPORT', 'CINEMATIC'] },
    { path: 'representationHint', label: 'Representación sugerida', type: 'select', options: ['DOOR', 'OPENING', 'SCREEN', 'ARTWORK', 'WINDOW', 'NONE'] },
    { path: 'prefetchPolicy', label: 'Precarga', type: 'select', options: ['EAGER', 'ON_APPROACH', 'LAZY'] },
    { path: 'accessibilityLabel', label: 'Etiqueta accesible', type: 'text' }
  ],
  [RECORD.STORY_STEP]: [
    { path: 'shotIntent', label: 'Intención de plano', type: 'select', options: ['ENTRY', 'OVERVIEW', 'FOCUS', 'DETAIL', 'PORTAL', 'EXIT'] },
    { path: 'duration', label: 'Duración (s)', type: 'number' },
    { path: 'caption', label: 'Locución / subtítulo', type: 'textarea' }
  ],
  [RECORD.ROUTE]: [
    { path: 'title', label: 'Título', type: 'text' },
    { path: 'description', label: 'Descripción', type: 'textarea' }
  ],
  [RECORD.CHAPTER]: [{ path: 'title', label: 'Título', type: 'text' }]
};

const GROUPS = [
  [RECORD.SPACE, 'Salas'],
  [RECORD.ENTITY, 'Contenido'],
  [RECORD.ANCHOR, 'Anclajes'],
  [RECORD.HOTSPOT, 'Hotspots'],
  [RECORD.PORTAL, 'Portales'],
  [RECORD.ROUTE, 'Rutas'],
  [RECORD.CHAPTER, 'Capítulos'],
  [RECORD.STORY_STEP, 'Pasos']
];

export async function boot() {
  const canvas = document.getElementById('iw-canvas');
  const panel = document.getElementById('iw-author');

  const env = { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency };
  const tier = params.get('tier')?.toUpperCase() || detectTier(env);

  const world = await fetch(WORLD_URL, { cache: 'no-store' }).then((r) => r.json());
  const renderHost = new RenderHost({ canvas, quality: policyForTier(tier) });
  const sceneKit = new MuseumSceneKit({ renderHost });

  const runtime = new Runtime({
    world,
    sceneKit,
    viewport: () => renderHost.viewport(),
    tier,
    env,
    mode: 'AUTHOR'
  });

  runtime.onFrame = (pose) => {
    renderHost.applyPose(pose);
    renderHost.render(sceneKit.scene);
  };
  window.addEventListener('resize', () => renderHost.resize(), { passive: true });

  await runtime.start();
  runtime.startLoop();
  frameSpaceForAuthoring(runtime, runtime.state.activeSpaceId);

  const author = new AuthorPanel({ panel, runtime, canvas });
  bindOrbitInput(canvas, runtime);

  window.__IW_AUTHOR = { runtime, author, renderHost, report: () => runtime.report() };
  document.documentElement.dataset.iwReady = 'true';
  return runtime;
}

class AuthorPanel {
  constructor({ panel, runtime, canvas }) {
    this.panel = panel;
    this.runtime = runtime;
    this.canvas = canvas;
    this.selectedId = runtime.store.startSpaceId;
    this.dirty = false;
    this._render();
    runtime.bus.on(EVENTS.SPACE_ENTERED, () => this._render());
  }

  _render() {
    const store = this.runtime.store;
    const record = store.get(this.selectedId);
    const kind = store.kindOf(this.selectedId);

    this.panel.innerHTML = `
      <header class="iw-au__head">
        <div>
          <b>Immersive Worlds</b>
          <span>Capa de autoría · V1 mínima</span>
        </div>
        <span class="iw-au__mode">Cámara: AUTHOR</span>
      </header>

      <div class="iw-au__space">
        <label>Sala en edición</label>
        <select data-el="spaceSelect">
          ${store.spaces.map((space) => `<option value="${space.id}" ${space.id === this.runtime.state.activeSpaceId ? 'selected' : ''}>${escapeHtml(space.title)}</option>`).join('')}
        </select>
      </div>

      <div class="iw-au__tree">
        ${GROUPS.map(([groupKind, label]) => this._group(groupKind, label)).join('')}
      </div>

      <div class="iw-au__form" data-el="form">
        <h3>${escapeHtml(recordLabel(record, kind))}</h3>
        <p class="iw-au__id">${escapeHtml(this.selectedId)} · ${kind}</p>
        ${(EDITABLE[kind] || []).map((field) => this._field(record, field)).join('') || '<p class="iw-au__empty">Este tipo de registro no es editable en V1.</p>'}
      </div>

      <footer class="iw-au__foot">
        <button class="iw-au__btn" data-el="rebuild">Reconstruir sala</button>
        <button class="iw-au__btn" data-el="validate">Validar mundo</button>
        <button class="iw-au__btn iw-au__btn--primary" data-el="export">Exportar JSON</button>
        <p class="iw-au__status" data-el="status">${this.dirty ? 'Cambios sin exportar' : 'Sin cambios'}</p>
      </footer>
    `;

    this.el = {};
    for (const node of this.panel.querySelectorAll('[data-el]')) this.el[node.dataset.el] = node;

    for (const node of this.panel.querySelectorAll('[data-select]')) {
      node.addEventListener('click', () => {
        this.selectedId = node.dataset.select;
        this._render();
      });
    }
    for (const node of this.panel.querySelectorAll('[data-path]')) {
      node.addEventListener('change', () => this._apply(node));
    }
    this.el.spaceSelect.addEventListener('change', (event) => this._gotoSpace(event.target.value));
    this.el.rebuild.addEventListener('click', () => this._rebuild());
    this.el.validate.addEventListener('click', () => this._validate());
    this.el.export.addEventListener('click', () => this._export());
  }

  _group(kind, label) {
    const store = this.runtime.store;
    const active = this.runtime.state.activeSpaceId;
    const records = store.all(kind).filter((record) => {
      if (kind === RECORD.SPACE || kind === RECORD.ROUTE) return true;
      if (kind === RECORD.CHAPTER || kind === RECORD.STORY_STEP) return true;
      // Everything spatial is filtered to the Space being edited: a thin
      // authoring layer should show what is in front of you, not the world.
      return (record.spaceId || record.fromSpaceId) === active;
    });
    if (!records.length) return '';
    return `
      <details ${kind === RECORD.ENTITY ? 'open' : ''}>
        <summary>${label} <i>${records.length}</i></summary>
        <ul>
          ${records.map((record) => `
            <li data-select="${record.id}" class="${record.id === this.selectedId ? 'is-selected' : ''}">
              ${escapeHtml(recordLabel(record, kind))}
            </li>`).join('')}
        </ul>
      </details>`;
  }

  _field(record, field) {
    const value = getPath(record, field.path) ?? '';
    const id = `f-${field.path.replace(/\W/g, '-')}`;
    let control;
    switch (field.type) {
      case 'textarea':
        control = `<textarea id="${id}" data-path="${field.path}" data-type="${field.type}" rows="3">${escapeHtml(value)}</textarea>`;
        break;
      case 'select':
        control = `<select id="${id}" data-path="${field.path}" data-type="${field.type}">
          ${field.options.map((option) => `<option ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
        </select>`;
        break;
      case 'anchor': {
        const anchors = this.runtime.store.anchorsOf(record.spaceId);
        control = `<select id="${id}" data-path="${field.path}" data-type="text">
          ${anchors.map((anchor) => `<option value="${anchor.id}" ${anchor.id === value ? 'selected' : ''}>${escapeHtml(anchor.label || anchor.id)}</option>`).join('')}
        </select>`;
        break;
      }
      case 'boolean':
        control = `<input id="${id}" type="checkbox" data-path="${field.path}" data-type="boolean" ${value !== false ? 'checked' : ''}>`;
        break;
      case 'number':
        control = `<input id="${id}" type="number" step="0.05" data-path="${field.path}" data-type="number" value="${value}">`;
        break;
      default:
        control = `<input id="${id}" type="text" data-path="${field.path}" data-type="text" value="${escapeHtml(value)}">`;
    }
    return `<div class="iw-au__row"><label for="${id}">${field.label}</label>${control}</div>`;
  }

  /** Every edit goes through WorldStore.edit — one door into canonical data. */
  _apply(node) {
    const path = node.dataset.path;
    const type = node.dataset.type;
    let value = node.type === 'checkbox' ? node.checked : node.value;
    if (type === 'number') value = Number(value);

    this.runtime.store.edit(this.selectedId, (record) => setPath(record, path, value));
    this.dirty = true;
    this._rebuild();
  }

  /**
   * Rebuild the Space so the edit becomes visible. Dispose, then re-activate —
   * the same lifecycle the visitor experience uses, which is how we know the
   * disposal path actually works.
   */
  async _rebuild() {
    const spaceId = this.runtime.state.activeSpaceId;
    const camera = { ...this.runtime.author };
    this.runtime.spaces.dispose(spaceId);
    await this.runtime.spaces.activate(spaceId);
    this.runtime.sceneKit.setCutaway(this.runtime.spaces.handleOf(spaceId), true);
    this.runtime.proximity.rebuild(spaceId);
    Object.assign(this.runtime.author, {
      pivot: camera.pivot, distance: camera.distance, yaw: camera.yaw, pitch: camera.pitch
    });
    this._render();
    if (this.el?.status) this.el.status.textContent = 'Sala reconstruida desde los datos';
  }

  async _gotoSpace(spaceId) {
    await this.runtime.spaces.activate(spaceId);
    this.runtime.state.enterSpace(spaceId);
    frameSpaceForAuthoring(this.runtime, spaceId);
    this.selectedId = spaceId;
    this._render();
  }

  _validate() {
    const report = validateWorld(this.toJSON());
    this.el.status.textContent = report.ok
      ? `Válido · ${Object.entries(report.counts).map(([k, v]) => `${v} ${k}`).join(', ')}`
      : `${report.errors.length} errores: ${report.errors[0]}`;
    this.el.status.dataset.ok = String(report.ok);
    return report;
  }

  toJSON() {
    const store = this.runtime.store;
    return {
      id: store.id,
      schemaVersion: store.schemaVersion,
      title: store.title,
      sceneKit: store.sceneKit,
      startSpaceId: store.startSpaceId,
      metadata: store.metadata,
      spaces: store.spaces,
      anchors: store.anchors,
      entities: store.entities,
      hotspots: store.hotspots,
      portals: store.portals,
      chapters: store.chapters,
      storySteps: store.storySteps,
      routes: store.routes
    };
  }

  _export() {
    const report = this._validate();
    if (!report.ok) return;
    const blob = new Blob([JSON.stringify(this.toJSON(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.runtime.store.id}.world.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.dirty = false;
    this.el.status.textContent = 'Exportado';
  }
}

/**
 * Put the author camera above and outside the room, with the ceiling removed,
 * so placement can be judged in plan. A visitor can never see a Space this way,
 * which is the visible half of "Author Mode ≠ Experience Mode".
 */
function frameSpaceForAuthoring(runtime, spaceId) {
  const bounds = runtime.store.require(spaceId).bounds;
  runtime.sceneKit.setCutaway(runtime.spaces.handleOf(spaceId), true);
  runtime.author.framePoint(
    [bounds.origin[0], bounds.origin[1] + 1.3, bounds.origin[2]],
    Math.max(bounds.size[0], bounds.size[2]) * 0.82
  );
  runtime.author.pitch = 0.62;
  runtime.author.yaw = 0.35;
}

/** Orbit input for the author camera. Separate rig, separate authority. */
function bindOrbitInput(canvas, runtime) {
  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = { x: event.clientX, y: event.clientY, pan: event.button === 1 || event.shiftKey };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;
    dragging.x = event.clientX;
    dragging.y = event.clientY;
    if (dragging.pan) {
      runtime.author.input.panX += dx;
      runtime.author.input.panY += dy;
    } else {
      runtime.author.input.orbitX += dx;
      runtime.author.input.orbitY += dy;
    }
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    runtime.author.input.dolly += event.deltaY;
  }, { passive: false });

  // Author Mode must never quietly hold the visitor's camera.
  if (runtime.camera.owner !== CAMERA_AUTHORITY.AUTHOR) {
    runtime.camera.request(CAMERA_AUTHORITY.AUTHOR, { reason: 'author-mode' });
  }
}

function recordLabel(record, kind) {
  if (!record) return '—';
  if (kind === RECORD.ENTITY) return record.content?.title || record.id;
  return record.title || record.label || record.accessibilityLabel || record.id;
}

function getPath(object, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), object);
}

function setPath(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let target = object;
  for (const key of keys) {
    if (target[key] == null) target[key] = Number.isNaN(Number(key)) ? {} : [];
    target = target[key];
  }
  target[last] = value;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
