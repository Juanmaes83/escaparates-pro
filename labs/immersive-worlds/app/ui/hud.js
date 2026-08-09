/**
 * Immersive Worlds — Experience UI
 *
 * The visitor-facing surface. It is deliberately quiet: a prompt when something
 * is within reach, a label when something is being looked at, a caption and a
 * transport when a tour is running, and nothing else.
 *
 * Two rules shape everything here:
 *
 *   • The UI reads World State; it never writes it. Every control calls a
 *     semantic Action on the runtime, so the interface has no private idea of
 *     what is happening in the world.
 *   • The information in the canvas also exists as text in the DOM
 *     (Constitution §22). The accessibility outline is not a summary bolted on
 *     afterwards — it is generated from the same records the Scene Kit renders,
 *     which is only possible because the data is semantic in the first place.
 */

import { EVENTS } from '../../engine/core/event-bus.js';
import { EXPERIENCE_MODE } from '../../engine/world/world-state.js';
import { KEY_BINDINGS } from './input.js';

export class ExperienceHUD {
  /**
   * @param {{root:HTMLElement, runtime:import('../../engine/core/runtime.js').Runtime, audio:import('../audio-director.js').AudioDirector}} deps
   */
  constructor({ root, runtime, audio }) {
    this.root = root;
    this.runtime = runtime;
    this.audio = audio;
    this.mapOpen = false;

    this._build();
    this._subscribe();
    this.renderAccessibilityOutline();
    this.update();
  }

  _build() {
    // Identity comes from the world record. A second world must not show the
    // first world's institution — that is the whole point of a template.
    const institution = this.runtime.store.metadata?.institution?.replace(/\s*\(.*\)$/, '') ||
      this.runtime.store.title;
    const startSpace = this.runtime.store.require(this.runtime.state.activeSpaceId);

    this.root.innerHTML = `
      <div class="iw-veil" data-el="veil" role="status" aria-live="polite">
        <div class="iw-veil__inner">
          <p class="iw-veil__mark">${escapeHtml(institution)}</p>
          <p class="iw-veil__title" data-el="veilTitle">Preparando la sala…</p>
          <div class="iw-veil__bar"><i data-el="veilBar"></i></div>
          <button class="iw-btn iw-btn--primary" data-el="enter" hidden>Entrar en ${escapeHtml(startSpace.title.toLowerCase())}</button>
          <p class="iw-veil__note">Contenido y obras ficticios, generados en tiempo de ejecución.</p>
        </div>
      </div>

      <header class="iw-topbar">
        <div class="iw-topbar__mark">
          <b>${escapeHtml(institution)}</b>
          <span data-el="spaceTitle">${escapeHtml(startSpace.title)}</span>
        </div>
        <div class="iw-topbar__tools">
          <button class="iw-btn" data-el="mapBtn" aria-expanded="false">Salas <kbd>M</kbd></button>
          <button class="iw-btn" data-el="routeBtn">Recorrido comentado <kbd>G</kbd></button>
          <button class="iw-btn iw-btn--icon" data-el="soundBtn" aria-pressed="false" title="Sonido">Sonido</button>
          <button class="iw-btn iw-btn--icon" data-el="a11yBtn" aria-expanded="false">Contenido en texto</button>
        </div>
      </header>

      <div class="iw-prompt" data-el="prompt" hidden></div>

      <section class="iw-detail" data-el="detail" hidden aria-live="polite">
        <div class="iw-detail__scrim"></div>
        <div class="iw-detail__panel">
          <p class="iw-detail__eyebrow" data-el="detailEyebrow"></p>
          <h2 data-el="detailTitle"></h2>
          <p class="iw-detail__meta" data-el="detailMeta"></p>
          <p class="iw-detail__body" data-el="detailBody"></p>
          <dl class="iw-detail__facts" data-el="detailFacts"></dl>
          <p class="iw-detail__credit" data-el="detailCredit" hidden></p>

          <div class="iw-detail__zoom">
            <label for="iw-zoom">Acercar</label>
            <input id="iw-zoom" type="range" min="0" max="100" value="0" data-el="zoom"
                   aria-label="Acercarse a la obra">
            <span data-el="zoomValue">0 %</span>
          </div>

          <nav class="iw-detail__nav">
            <button class="iw-btn" data-el="detailPrev" aria-label="Obra anterior">← Anterior</button>
            <span class="iw-detail__count" data-el="detailCount"></span>
            <button class="iw-btn" data-el="detailNext" aria-label="Obra siguiente">Siguiente →</button>
          </nav>
          <button class="iw-btn iw-btn--wide" data-el="detailClose">Volver a la sala <kbd>Esc</kbd></button>
        </div>
      </section>

      <section class="iw-transport" data-el="transport" hidden>
        <div class="iw-transport__caption" data-el="caption" aria-live="polite"></div>
        <div class="iw-transport__controls">
          <span class="iw-transport__step" data-el="stepCount"></span>
          <button class="iw-btn" data-el="pauseBtn">Pausar</button>
          <button class="iw-btn" data-el="nextBtn">Siguiente</button>
          <button class="iw-btn" data-el="exitBtn">Salir del recorrido <kbd>Esc</kbd></button>
        </div>
        <div class="iw-transport__progress"><i data-el="progress"></i></div>
      </section>

      <div class="iw-map" data-el="map" hidden role="dialog" aria-label="Mapa de salas">
        <div class="iw-map__panel">
          <header>
            <h2>Salas</h2>
            <button class="iw-btn" data-el="mapClose">Cerrar</button>
          </header>
          <svg data-el="mapSvg" viewBox="0 0 320 240" role="img" aria-label="Grafo de salas y pasos entre ellas"></svg>
          <p class="iw-map__note">El mapa representa el grafo del mundo. El recorrido comentado es sólo uno de los caminos posibles.</p>
        </div>
      </div>

      <div class="iw-a11y" data-el="a11y" hidden role="dialog" aria-label="Contenido de la exposición en texto">
        <div class="iw-a11y__panel">
          <header>
            <h2>Contenido en texto</h2>
            <button class="iw-btn" data-el="a11yClose">Cerrar</button>
          </header>
          <div data-el="a11yBody"></div>
          <h3>Controles</h3>
          <ul class="iw-a11y__keys" data-el="keys"></ul>
        </div>
      </div>
    `;

    this.el = {};
    for (const node of this.root.querySelectorAll('[data-el]')) {
      this.el[node.dataset.el] = node;
    }

    this.el.mapBtn.addEventListener('click', () => this.toggleMap());
    this.el.mapClose.addEventListener('click', () => this.toggleMap(false));
    this.el.a11yBtn.addEventListener('click', () => this.toggleAccessibility());
    this.el.a11yClose.addEventListener('click', () => this.toggleAccessibility(false));
    const route = this.runtime.store.routes[0];
    this.el.routeBtn.hidden = !route;
    if (route) {
      this.el.routeBtn.firstChild.textContent = `${route.title} `;
      this.el.routeBtn.addEventListener('click', () => this.runtime.startRoute(route.id));
    }
    this.el.detailClose.addEventListener('click', () => this.runtime.releaseFocus());
    this.el.detailPrev.addEventListener('click', () => this.runtime.focusNeighbour(-1));
    this.el.detailNext.addEventListener('click', () => this.runtime.focusNeighbour(1));
    this.el.zoom.addEventListener('input', (event) => this.setZoom(Number(event.target.value) / 100));
    this.el.pauseBtn.addEventListener('click', () => this._togglePause());
    this.el.nextBtn.addEventListener('click', () => this.runtime.experience.next());
    this.el.exitBtn.addEventListener('click', () => this.runtime.exitRoute());
    this.el.soundBtn.addEventListener('click', () => this._toggleSound());

    this.el.keys.innerHTML = KEY_BINDINGS
      .map((binding) => `<li><span>${binding.keys.map((k) => `<kbd>${k}</kbd>`).join(' ')}</span><em>${binding.action}</em></li>`)
      .join('');
  }

  _subscribe() {
    const bus = this.runtime.bus;
    bus.on(EVENTS.SPACE_ENTERED, ({ spaceId }) => {
      const space = this.runtime.store.require(spaceId);
      this.el.spaceTitle.textContent = space.title;
      this.audio.setAmbience(space.ambience);
      this._drawMap();
      this.update();
    });
    bus.on(EVENTS.ENTITY_FOCUSED, ({ entityId }) => this._showDetail(entityId));
    bus.on(EVENTS.ENTITY_FOCUS_LEFT, () => this._hideDetail());
    bus.on(EVENTS.WORLD_STATE_CHANGED, () => this.update());
    bus.on(EVENTS.ROUTE_STARTED, () => this.update());
    bus.on(EVENTS.ROUTE_STEP, ({ caption, index, total }) => {
      this.el.caption.textContent = caption || '';
      this.el.stepCount.textContent = `Parada ${index + 1} de ${total}`;
      this.update();
    });
    bus.on(EVENTS.NARRATION_CUE, ({ caption }) => this.audio.speak(caption));
    bus.on(EVENTS.AUDIO_CUE, ({ cue }) => {
      if (typeof cue === 'string' && cue.startsWith('ambience.')) this.audio.setAmbience(cue);
    });
    bus.on(EVENTS.EXPERIENCE_COMPLETED, () => {
      this.audio.stopNarration();
      this.update();
    });
  }

  /* == veil ================================================================= */

  setLoadingProgress(fraction, label) {
    this.el.veilBar.style.width = `${Math.round(fraction * 100)}%`;
    if (label) this.el.veilTitle.textContent = label;
  }

  /** @param {() => void} onEnter */
  showEnter(onEnter) {
    this.el.veilTitle.textContent = 'La sala está preparada';
    this.el.enter.hidden = false;
    this.el.enter.focus();
    this.el.enter.addEventListener('click', () => {
      this.el.veil.classList.add('is-gone');
      setTimeout(() => { this.el.veil.hidden = true; }, 700);
      onEnter();
    }, { once: true });
  }

  /* == state rendering ====================================================== */

  update() {
    const state = this.runtime.state;
    const guided = state.mode === EXPERIENCE_MODE.GUIDED;

    this.el.transport.hidden = !guided;
    this.el.routeBtn.hidden = guided;
    this.el.pauseBtn.textContent = this.runtime.experience.transport === 'PAUSED' ? 'Reanudar' : 'Pausar';
    this.el.progress.style.width = `${Math.round(this.runtime.experience.progress * 100)}%`;

    const nearest = this.runtime.proximity.nearestHotspot;
    if (nearest && !guided && !state.focusedEntityId) {
      this.el.prompt.hidden = false;
      this.el.prompt.innerHTML = `<kbd>E</kbd><span>${nearest.accessibilityLabel}</span>`;
    } else {
      this.el.prompt.hidden = true;
    }
  }

  _showDetail(entityId) {
    const entity = this.runtime.store.require(entityId);
    const content = entity.content || {};
    const guided = this.runtime.state.mode === EXPERIENCE_MODE.GUIDED;

    this.el.detail.hidden = false;
    this.el.detail.dataset.guided = String(guided);
    this.el.detailEyebrow.textContent = `${KIND_LABEL[entity.kind] || 'Obra'} · ${this.runtime.store.require(entity.spaceId).title}`;
    this.el.detailTitle.textContent = content.title || entity.id;
    this.el.detailMeta.textContent = [content.creator, content.year, content.medium].filter(Boolean).join(' · ');
    this.el.detailBody.textContent = content.description || entity.accessibility?.description || '';

    // Facts come from the record, so an institution that fills in more fields
    // gets a richer panel without anyone touching the interface.
    const facts = [
      ['Dimensiones', entity.size ? `${(entity.size[0] * 100).toFixed(0)} × ${(entity.size[1] * 100).toFixed(0)} cm` : null],
      ['Sala', this.runtime.store.require(entity.spaceId).title],
      ['Referencia', entity.id.replace(/^entity\./, '')]
    ].filter(([, value]) => value);
    this.el.detailFacts.innerHTML = facts
      .map(([term, value]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join('');

    const credit = content.media?.credit || content.media?.rights;
    this.el.detailCredit.hidden = !credit;
    this.el.detailCredit.textContent = credit ? `Imagen: ${credit}` : '';

    // Stepping through works and zooming belong to the visitor. During a guided
    // route the camera is the Director's, so they are not offered.
    const works = this.runtime.focusableInSpace();
    const index = works.findIndex((work) => work.id === entityId);
    this.el.detailCount.textContent = works.length > 1 ? `${index + 1} / ${works.length}` : '';
    for (const key of ['detailPrev', 'detailNext', 'detailClose']) this.el[key].hidden = guided;
    this.el.detail.querySelector('.iw-detail__zoom').hidden = guided;
    if (works.length < 2) {
      this.el.detailPrev.hidden = true;
      this.el.detailNext.hidden = true;
    }

    this.setZoom(0);
  }

  /** @param {number} zoom 0..1 */
  setZoom(zoom) {
    const value = Math.max(0, Math.min(1, zoom));
    this.runtime.setDetailZoom(value);
    this.el.zoom.value = String(Math.round(value * 100));
    this.el.zoomValue.textContent = `${Math.round(value * 100)} %`;
  }

  get zoom() {
    return this.runtime.focus.zoom;
  }

  _hideDetail() {
    this.el.detail.hidden = true;
    this.setZoom(0);
  }

  _togglePause() {
    const director = this.runtime.experience;
    if (director.transport === 'PAUSED') {
      director.resume();
    } else {
      director.pause();
      this.audio.stopNarration();
    }
    this.update();
  }

  async _toggleSound() {
    if (!this.audio.running) {
      const ok = await this.audio.resume();
      if (ok) {
        this.audio.setMuted(false);
        this.audio.setAmbience(this.runtime.store.require(this.runtime.state.activeSpaceId).ambience);
      }
    } else {
      this.audio.setMuted(!this.audio.muted);
    }
    const on = this.audio.running && !this.audio.muted;
    this.el.soundBtn.setAttribute('aria-pressed', String(on));
    this.el.soundBtn.textContent = on ? 'Sonido activo' : 'Sonido';
  }

  /* == map ================================================================== */

  toggleMap(force) {
    this.mapOpen = force ?? !this.mapOpen;
    this.el.map.hidden = !this.mapOpen;
    this.el.mapBtn.setAttribute('aria-expanded', String(this.mapOpen));
    if (this.mapOpen) this._drawMap();
  }

  /**
   * The map is drawn from WorldGraph, not from a hand-authored diagram — which
   * is the point of keeping the graph as data (World Graph ≠ World Map).
   */
  _drawMap() {
    const graph = this.runtime.graph;
    const store = this.runtime.store;
    const active = this.runtime.state.activeSpaceId;
    const visited = this.runtime.state.visitedSpaceIds;

    // Lay the nodes out from the real floor plan: the map is a plan, not a blob.
    const positions = new Map();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const space of store.spaces) {
      const [x, , z] = space.bounds.origin;
      positions.set(space.id, { x, z });
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const pad = 42;
    const scale = Math.min((320 - pad * 2) / Math.max(maxX - minX, 1), (240 - pad * 2) / Math.max(maxZ - minZ, 1));
    const project = ({ x, z }) => ({
      x: pad + (x - minX) * scale,
      y: pad + (z - minZ) * scale
    });

    const edges = graph.edges
      .filter((edge, index, all) => all.findIndex((other) => other.from === edge.to && other.to === edge.from) >= index)
      .map((edge) => {
        const a = project(positions.get(edge.from));
        const b = project(positions.get(edge.to));
        const dashed = edge.behaviour === 'TELEPORT';
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="iw-map__edge${dashed ? ' is-teleport' : ''}" />`;
      })
      .join('');

    const nodes = store.spaces
      .map((space) => {
        const p = project(positions.get(space.id));
        const cls = space.id === active ? 'is-active' : visited.has(space.id) ? 'is-visited' : '';
        return `
          <g class="iw-map__node ${cls}">
            <circle cx="${p.x}" cy="${p.y}" r="7" />
            <text x="${p.x}" y="${p.y - 13}" text-anchor="middle">${space.title.replace(/ —.*$/, '')}</text>
          </g>`;
      })
      .join('');

    this.el.mapSvg.innerHTML = edges + nodes;
  }

  /* == accessibility ======================================================== */

  toggleAccessibility(force) {
    const open = force ?? this.el.a11y.hidden;
    this.el.a11y.hidden = !open;
    this.el.a11yBtn.setAttribute('aria-expanded', String(open));
  }

  /**
   * Every Space and Entity as readable text, generated from the canonical
   * records. A screen reader, a search engine and a curator all get the same
   * content the canvas is showing.
   */
  renderAccessibilityOutline() {
    const store = this.runtime.store;
    this.el.a11yBody.innerHTML = store.spaces
      .map((space) => {
        const entities = store.entitiesOf(space.id);
        const items = entities
          .map((entity) => `
            <li>
              <strong>${escapeHtml(entity.content?.title || entity.id)}</strong>
              <span>${escapeHtml([entity.content?.creator, entity.content?.year, entity.content?.medium].filter(Boolean).join(' · '))}</span>
              <p>${escapeHtml(entity.accessibility?.description || entity.content?.description || '')}</p>
              ${entity.accessibility?.transcript ? `<p class="iw-a11y__transcript">Transcripción: ${escapeHtml(entity.accessibility.transcript)}</p>` : ''}
            </li>`)
          .join('');
        const exits = this.runtime.graph
          .exits(space.id)
          .map((portal) => escapeHtml(portal.accessibilityLabel))
          .join('; ');
        return `
          <section>
            <h3>${escapeHtml(space.title)}</h3>
            <ul>${items}</ul>
            <p class="iw-a11y__exits">Salidas: ${exits || 'ninguna'}</p>
          </section>`;
      })
      .join('');
  }
}

const KIND_LABEL = {
  ARTWORK: 'Obra',
  SCULPTURE: 'Escultura',
  VIDEO: 'Vídeo',
  AUDIO: 'Registro sonoro',
  TEXT: 'Texto de sala',
  OBJECT_3D: 'Objeto'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}
