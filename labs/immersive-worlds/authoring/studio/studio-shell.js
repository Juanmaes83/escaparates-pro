/**
 * Museum authoring — the Studio shell (VS02)
 *
 * VS01 was a form floating over the room it was editing. This is a workspace the
 * room lives inside: the Museum keeps the middle of the screen at its own size,
 * the tree says where you are, the editor says what you are changing, and
 * readiness says whether any of it is finished.
 *
 * The one structural rule, taken from the approved reference and from the
 * product brief: THE PREVIEW IS THE PRODUCT. Everything else is furniture around
 * it, and no piece of furniture may cover it.
 *
 * Art direction follows the Museum's own constitution rather than the
 * reference's gold: warm neutrals, hairline rules, one serif and one grotesque,
 * and no saturated colour except the art on the walls. State colours are the
 * single exception, because "listo" and "no se pudo usar" have to be
 * distinguishable without reading.
 */

import {
  normaliseConfig, exportConfigJSON, MEDIA_SLOT, SLOTS_FOR_KIND, SLOT_MEDIA
} from '../experience-config.js';

/**
 * What each slot is called on the panel. The name says the destination *and* the
 * medium, because those are the two things an author is choosing between and a
 * label reading only "Medios" leaves them guessing which control does what.
 */
const SLOT_COPY = Object.freeze({
  INSTITUTION_LOGO: { label: 'Logotipo', formats: 'PNG, JPG o WebP' },
  ARTWORK_IMAGE: { label: 'Imagen de la obra', formats: 'JPG, PNG o WebP' },
  ARTWORK_VIDEO: { label: 'Vídeo de la obra', formats: 'MP4 o WebM' },
  PROJECTION_IMAGE: { label: 'Imagen proyectada', formats: 'JPG, PNG o WebP' },
  PROJECTION_VIDEO: { label: 'Vídeo de la proyección', formats: 'MP4 o WebM' }
});

/**
 * What the file dialog will let an author pick.
 *
 * Extensions as well as MIME types, and the extensions are not belt-and-braces.
 * The dialog resolves a MIME type to a set of extensions through the operating
 * system, and on Windows `.mp4` and `.webm` frequently have no registry entry —
 * the same gap that made files arrive with `type: ''`. A MIME-only `accept` on
 * such a machine greys out the author's own videos: they open the dialog, see
 * their file unselectable, and conclude the product does not take video. Naming
 * the extensions outright removes the operating system from the decision.
 */
const ACCEPT = Object.freeze({
  image: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  video: '.mp4,.m4v,.webm,video/mp4,video/webm'
});

/**
 * How a piece is mounted, said the way a registrar would say it.
 *
 * The panel used to print the world file's `representation.profile` verbatim —
 * so a Spanish cataloguing tool told its author the support was
 * `framed-canvas`. That is the engine's identifier for a rendering profile, in
 * English, in a field a museum professional reads. Constitution §12 keeps the
 * engine's vocabulary out of the author's sight; this is the last place it was
 * still getting through.
 */
const SUPPORT = Object.freeze({
  'framed-canvas': 'Lienzo enmarcado',
  'framed-paper': 'Obra sobre papel, enmarcada',
  'framed-panel': 'Tabla enmarcada',
  'plinth-vessel': 'Pieza exenta sobre peana',
  'projected-light': 'Proyección sobre pared',
  'wall-panel': 'Cartela de pared',
  'floor-listening-point': 'Punto de escucha'
});

/** Two slots on one piece are alternatives, and the panel says so in words. */
const SLOT_CHOICE_NOTE = Object.freeze({
  ARTWORK: 'Una obra se muestra como imagen o como vídeo. Al elegir uno se retira el otro.',
  PROJECTION: 'La proyección muestra un vídeo o una imagen fija. Al elegir uno se retira el otro.'
});
import { ConfigStore } from '../config-store.js';
import { describeAsset } from '../media-vault.js';
import { buildExperienceTree, walkTree, findNode, roomOf, NODE } from './experience-tree.js';
import { evaluateReadiness, PROJECT_STATE, SEVERITY } from './readiness.js';

/** What the editor is editing, said as a noun rather than as a slug. */
const NODE_NOUN = {
  INSTITUTION: 'Institución', EXHIBITION: 'Exposición', ROOM: 'Sala', ENTITY: 'Pieza'
};

/** The same nouns the tree uses, so one object is not an OBRA here and a PIEZA there. */
const KIND_NOUN = {
  ARTWORK: 'Obra', SCULPTURE: 'Escultura', PROJECTION: 'Proyección',
  AUDIO: 'Pieza sonora', TEXT: 'Señalética'
};

/**
 * A reference a registrar can read aloud. The engine id stays in the tooltip,
 * because it is real and occasionally needed, but `entity.artwork.division-tercera`
 * is a data-model slug and does not belong on an institution's screen.
 */
function humanRef(node, position) {
  const prefix = node.kind === 'ROOM' ? 'SALA'
    : { ARTWORK: 'OBRA', SCULPTURE: 'ESC', PROJECTION: 'PROY', AUDIO: 'SON', TEXT: 'SEÑ' }[node.entityKind] || 'REG';
  return `${prefix} ${String(position).padStart(2, '0')}`;
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The five domains of the blueprint. VS02 implements the two it can honour. */
/**
 * Hairline marks, drawn rather than fetched — the page must stay one file, and
 * an icon font would be a second rendering truth for glyphs.
 *
 * Monochrome and stroked, never filled with colour: house art direction gives
 * the only saturated colour in the room to the art on the walls, so the rail
 * that frames the art cannot compete with it. The approved reference paints its
 * chrome gold throughout; that is the one place this deliberately diverges.
 */
const ICON = Object.freeze({
  build: '<path d="M3 7.5 9 4l6 3.5V14L9 17.5 3 14Z"/><path d="M3 7.5 9 11l6-3.5M9 11v6.5"/>',
  content: '<path d="M3 4.5h5.2c.99 0 1.8.81 1.8 1.8V17a2 2 0 0 0-2-1.6H3Z"/><path d="M17 4.5h-5.2c-.99 0-1.8.81-1.8 1.8V17a2 2 0 0 1 2-1.6H17Z"/>',
  experience: '<circle cx="10" cy="10" r="2.4"/><path d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17M5.05 5.05l1.55 1.55M13.4 13.4l1.55 1.55M14.95 5.05 13.4 6.6M6.6 13.4l-1.55 1.55"/>',
  visitor: '<circle cx="10" cy="6.4" r="2.6"/><path d="M4.8 16.4a5.2 5.2 0 0 1 10.4 0"/>',
  publish: '<path d="M10 14.5V4.2"/><path d="m6.3 7.9 3.7-3.7 3.7 3.7"/><path d="M4.5 15.8h11"/>'
});

/**
 * The Authoring Workspaces, as the system blueprint names them.
 *
 * These five are the product's spine, not a filter: the blueprint draws them as
 * the domains the whole platform is organised by, and the sub-areas under each
 * are where a future plan or role will attach its capabilities. Three of them
 * are honest about not being built yet — hiding that would make the product
 * look smaller than it is planned to be, and would leave nowhere for the
 * capability gating to land.
 */
const DOMAINS = [
  {
    id: 'build',
    label: 'Construir',
    hint: 'Institución, exposición, salas y piezas',
    ready: true,
    areas: ['Espacios y salas', 'Estructura de la exposición', 'Colección y piezas']
  },
  {
    id: 'content',
    label: 'Contenido',
    hint: 'Cartelas, medios e interpretación',
    ready: true,
    areas: ['Datos de la obra', 'Cartelas', 'Interpretación curatorial', 'Medios']
  },
  {
    id: 'experience',
    label: 'Experiencia',
    hint: 'Luz, proyección, recorridos',
    ready: false,
    areas: ['Iluminación', 'Proyección', 'Recorridos', 'Comportamientos', 'Audio']
  },
  {
    id: 'visitor',
    label: 'Visitante',
    hint: 'Información, accesibilidad, idiomas',
    ready: false,
    areas: ['Información al visitante', 'Accesibilidad', 'Idiomas', 'Guía']
  },
  {
    id: 'publish',
    label: 'Publicar',
    hint: 'Validación, derechos, publicación',
    ready: false,
    areas: ['Validación', 'Derechos y fuentes', 'Exportación', 'Publicación']
  }
];

export class StudioShell {
  /**
   * @param {object} deps
   * @param {object} deps.config         the project being authored
   * @param {object} deps.world          the world record as it ships
   * @param {object} deps.vault          MediaVault
   * @param {(config:object)=>Promise<void>} deps.onApply   rebuild the preview
   * @param {(config:object)=>Promise<void>} deps.onStart   leave authoring
   * @param {(nodeId:string)=>Promise<void>} deps.onReveal  walk the preview there
   */
  constructor({ config, world, vault, onApply, onStart, onReveal, currentRoom }) {
    this.config = normaliseConfig(config);
    this.world = world;
    this.vault = vault;
    this.onApply = onApply;
    this.onStart = onStart;
    this.onReveal = onReveal || (async () => {});
    // The studio has to name the room the preview is actually standing in, which
    // only the runtime knows. Asking is cheaper and more honest than tracking a
    // copy that can drift.
    this.currentRoom = currentRoom || (() => '');

    // "Saved" is a fact about the stored project, not about whether this shell
    // happens to be dirty. Applying a preview rebuilds the shell, and a fresh
    // shell reporting "saved" because it had not been typed into yet was the
    // studio telling the author their work was safe when it might not be.
    this.domain = 'build';
    this.selectedId = 'institution';
    this.dirty = false;
    this.savedAt = null;
    this.busy = null;
    this.message = null;
    this.messageBad = false;
    this.collapsed = new Set();
    this.jump = 'tree';

    this.root = document.createElement('div');
    this.root.id = 'st';
    this.root.setAttribute('aria-label', 'Estudio de experiencia');
    document.body.appendChild(this.root);

    // The vault drives its own progression; the studio just redraws when a file
    // moves, so LOADING → DECODED → READY is visible without polling.
    this._vaultWatch = (asset) => { this._lastAsset = asset; this.render(); };
    this.vault.onChange = this._vaultWatch;

    // The letterbox is a measurement, so it has to be retaken when the thing it
    // measured changes size.
    this._onResize = () => this._layout();
    window.addEventListener('resize', this._onResize, { passive: true });

    this.render();
  }

  /* == derived state ======================================================== */

  get tree() { return buildExperienceTree(this.world, this.config); }

  get readiness() {
    return evaluateReadiness(this.world, this.config, (ref) => {
      const id = typeof ref === 'string' && ref.startsWith('authored:') ? ref.slice(9) : null;
      const asset = id ? this.vault.get(id) : null;
      return asset ? { state: asset.state, error: asset.error } : null;
    });
  }

  /** The world entity behind the selected node, when there is one. */
  get selectedEntity() {
    return (this.world.entities || []).find((e) => e.id === this.selectedId) || null;
  }

  _entityDraft(id) {
    if (!this.config.entities[id]) {
      this.config.entities[id] = {
        title: null, creator: null, year: null, medium: null, description: null, image: null, video: null
      };
    }
    return this.config.entities[id];
  }

  _roomDraft(id) {
    if (!this.config.rooms[id]) this.config.rooms[id] = { title: null };
    return this.config.rooms[id];
  }

  /* == render =============================================================== */

  render() {
    const r = this.readiness;
    this.root.innerHTML = `
      ${this._topBar(r)}
      <div class="st-body">
        ${this._rail()}
        ${this._tree()}
        <div class="st-stage" id="st-stage-slot">
          <span class="st-live ${this.dirty ? 'is-stale' : ''}">${
  this.dirty ? 'Vista previa desactualizada' : 'Vista previa aplicada'} <b>${esc(this.currentRoom() || '')}</b></span>
        </div>
        ${this._editor()}
        ${this._readiness(r)}
      </div>
      ${this._filmstrip()}
      <nav class="st-jump" aria-label="Ir a">
        ${[['tree', 'Experiencia'], ['ed', 'Editar'], ['val', 'Proyecto']].map(([id, label]) => `
          <button data-jump="${id}" class="${this.jump === id ? 'is-on' : ''}">${label}</button>`).join('')}
      </nav>`;
    this._bind();
    this._layout();
  }

  /**
   * The preview is letterboxed to the shape a visitor will see. Only the browser
   * knows how wide the column came out, so the height is measured and published
   * as a variable the stylesheet uses for both the canvas and the strip below it.
   */
  _layout() {
    const stage = this.root.querySelector('.st-stage');
    if (!stage) return;
    const { width, height } = stage.getBoundingClientRect();
    if (!width) return;

    // The strip takes what its content needs and the preview takes the rest.
    // A fixed 16:10 left 420 px of flat charcoal under a four-chip strip, which
    // read as an unbuilt region — and it was exactly the space the preview
    // should have had.
    const film = this.root.querySelector('.st-film');
    const filmNeeds = film ? Math.min(film.scrollHeight + 2, height * 0.42) : 132;
    const h = Math.round(Math.max(
      Math.min(height - filmNeeds, width * 0.8),
      Math.min(width * 0.52, height - 132)
    ));
    const px = `${Math.max(h, 240)}px`;
    this.root.style.setProperty('--st-canvas-h', px);
    document.documentElement.style.setProperty('--st-canvas-h', px);
    requestAnimationFrame(() => window.__IW?.renderHost?.resize());
  }

  /** The current room's pieces, in the order the world lists them. */
  _filmstrip() {
    const room = roomOf(this.tree, this.selectedId)
      || this.tree.children[0].children.find((r) => r.label === this.currentRoom())
      || this.tree.children[0].children[0];
    if (!room) return '';
    const pieces = (room.children || []).filter((c) => c.entityKind !== 'TEXT');
    return `
      <section class="st-film" aria-label="Piezas de la sala">
        <div class="st-filmhead">
          <h3>${esc(room.label)}</h3>
          <span>${esc(room.sublabel)}</span>
        </div>
        <div class="st-filmrow">
          ${pieces.length ? pieces.map((p, i) => `
            <button class="st-chip ${p.id === this.selectedId ? 'is-on' : ''}" data-node="${esc(p.id)}">
              <b>${i + 1}. ${esc(p.label)}</b>
              <i>${esc(p.sublabel)}</i>
              ${p.authored ? '<em>Personalizado</em>' : ''}
            </button>`).join('')
    : '<p class="st-note">Esta sala no expone piezas: es el acceso a la exposición.</p>'}
        </div>
      </section>`;
  }

  /** Where this record sits in its room, or the room in the exhibition. */
  _positionOf(node) {
    const rooms = this.tree.children[0].children;
    if (node.kind === NODE.ROOM) return rooms.findIndex((r) => r.id === node.id) + 1;
    const room = roomOf(this.tree, node.id);
    return (room?.children || []).filter((c) => c.entityKind !== 'TEXT')
      .findIndex((c) => c.id === node.id) + 1;
  }

  _crumbHTML() {
    const node = findNode(this.tree, this.selectedId);
    const room = roomOf(this.tree, this.selectedId);
    const parts = [
      this.config.institution.name.replace(/\s*\(.*\)$/, '') || 'Institución',
      this.config.exhibition.title || this.world.title || 'Exposición'
    ];
    if (room) parts.push(room.label);
    const here = node && node.kind === NODE.ENTITY ? node.label : null;
    return parts.map((p) => `<span>${esc(p)}</span>`).join('')
      + (here ? `<span class="st-here">${esc(here)}</span>` : '');
  }

  /** Does the stored project match what is on screen? */
  _isSaved() {
    if (this.dirty) return false;
    try {
      const stored = ConfigStore.load();
      if (!stored) return false;
      const strip = (c) => JSON.stringify({ ...normaliseConfig(c), updatedAt: null, configId: null });
      return strip(stored) === strip(this.config);
    } catch { return false; }
  }

  _savedLabel() {
    if (!this._isSaved()) return 'Sin guardar todavía';
    return this.savedAt
      ? `Guardado · ${this.savedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
      : 'Guardado';
  }

  _topBar(r) {
    const saved = this._savedLabel();
    return `
      <header class="st-top">
        <div class="st-brand">
          <span class="st-mark" aria-hidden="true">E</span>
          <span>
            <b>Estudio de Experiencia</b>
            <i>Museo · autoría premium</i>
          </span>
        </div>
        <nav class="st-crumbs" aria-label="Dónde estoy">${this._crumbHTML()}</nav>
        <div class="st-acts">
          <span class="st-saved ${this.dirty ? 'st-saved--dirty' : ''}" data-role="saved">${
            this.dirty ? 'Cambios sin guardar' : esc(saved)}</span>
          <button class="st-b" data-act="save">Guardar</button>
          <button class="st-b" data-act="apply">${this.busy === 'apply' ? 'Aplicando…' : 'Vista previa'}</button>
          <button class="st-b" data-act="validate">Validar</button>
          <button class="st-b st-b--go" data-act="start" ${r.canStart ? '' : 'disabled'}
            title="${r.canStart ? 'Entrar en la experiencia como visitante' : 'Faltan elementos necesarios'}">
            Empezar experiencia
          </button>
        </div>
      </header>`;
  }

  /**
   * The workspace spine.
   *
   * This existed as markup and was hidden by a stylesheet, with the domains
   * demoted to a filter strip inside the validation column. The cost was that
   * the product's own architecture — the five Authoring Workspaces the system
   * blueprint is built around — was invisible in the thing an author navigates
   * with. Beside the approved reference the shell read as one form next to a
   * viewport, rather than as a platform whose scope you can see at a glance.
   */
  _rail() {
    return `
      <nav class="st-rail" aria-label="Áreas de trabajo">
        <h2>Áreas</h2>
        <ul>
          ${DOMAINS.map((d) => {
    const on = d.id === this.domain;
    return `
            <li>
              <button class="st-dom ${on ? 'is-on' : ''} ${d.ready ? '' : 'is-later'}"
                data-domain="${d.id}" ${d.ready ? '' : 'disabled'}
                aria-current="${on ? 'true' : 'false'}"
                title="${esc(d.hint)}${d.ready ? '' : ' · en preparación'}">
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${ICON[d.id]}</svg>
                <span><b>${esc(d.label)}</b><i>${esc(d.hint)}</i></span>
                ${d.ready ? '' : '<em>Pronto</em>'}
              </button>
              ${on && d.areas ? `<ul class="st-areas">${
  d.areas.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
            </li>`;
  }).join('')}
        </ul>
      </nav>`;
  }

  _tree() {
    const rows = [];
    for (const { node, depth } of walkTree(this.tree)) {
      const collapsed = this.collapsed.has(node.id);
      const hasKids = (node.children || []).length > 0;
      rows.push(`
        <li>
          <div class="st-node ${node.id === this.selectedId ? 'is-on' : ''} st-node--${node.kind.toLowerCase()}"
            style="--d:${depth}">
            ${hasKids
    ? `<button class="st-twist" data-twist="${esc(node.id)}" aria-label="${collapsed ? 'Desplegar' : 'Plegar'}">${collapsed ? '▸' : '▾'}</button>`
    : '<span class="st-twist st-twist--leaf"></span>'}
            <button class="st-nodebtn" data-node="${esc(node.id)}">
              <b>${esc(node.label)}</b>
              <i>${esc(node.sublabel || '')}</i>
            </button>
            ${node.authored ? '<span class="st-dot" title="Personalizado"></span>' : ''}
          </div>
        </li>`);
      if (collapsed) {
        // Skip this subtree: consume its descendants from the walk by rebuilding
        // the list without them.
        for (const { node: child } of walkTree(node)) if (child !== node) rows.pop();
      }
    }
    return `
      <section class="st-tree" aria-label="Árbol de la experiencia">
        <h2>Experiencia</h2>
        <ul>${rows.join('')}</ul>
        <p class="st-treefoot">Institución → Exposición → Salas → Piezas</p>
      </section>`;
  }

  /* == the contextual editor ================================================ */

  _editor() {
    const node = findNode(this.tree, this.selectedId);
    if (!node) return '<section class="st-ed"></section>';

    const body = node.kind === NODE.INSTITUTION ? this._institutionEditor()
      : node.kind === NODE.EXHIBITION ? this._exhibitionEditor()
        : node.kind === NODE.ROOM ? this._roomEditor(node)
          : this._entityEditor(node);

    return `
      <section class="st-ed" aria-label="Editor">
        <header class="st-edtop">
          <div>
            <p class="st-eyebrow">${esc(
    node.kind === NODE.ENTITY ? (KIND_NOUN[node.entityKind] || 'Pieza') : NODE_NOUN[node.kind] || 'Editor')}</p>
            <h2>${esc(node.label)}</h2>
          </div>
          ${node.kind === NODE.ENTITY || node.kind === NODE.ROOM
    ? `<code class="st-id" title="Referencia del registro · ${esc(node.id)}">${esc(humanRef(node, this._positionOf(node)))}</code>`
    : ''}
        </header>
        ${body}
      </section>`;
  }

  /**
   * A field that can tell an author three different things apart: what they
   * wrote, what the Museum's own record already says, and nothing at all.
   *
   * Rendering the inherited value as a grey placeholder made "has catalogue data"
   * look identical to "is empty" — in a cataloguing tool that is a data hazard,
   * not a styling nit. Inherited values are shown as values, marked as inherited,
   * and the mark disappears the moment the author takes ownership of the field.
   */
  _field(label, path, value, { hint = '', inherited = '', area = false, rows = 4 } = {}) {
    const owned = value != null && value !== '';
    const shown = owned ? value : inherited;
    const state = owned ? 'own' : inherited ? 'inherited' : 'empty';
    const control = area
      ? `<textarea rows="${rows}" data-bind="${path}" data-state="${state}" placeholder="Sin texto">${esc(shown || '')}</textarea>`
      : `<input data-bind="${path}" data-state="${state}" value="${esc(shown || '')}" title="${esc(shown || '')}" placeholder="Sin dato">`;
    return `
      <label class="st-f">
        <span class="st-l">
          ${esc(label)}
          ${state === 'inherited' ? '<em class="st-inh">del registro</em>' : ''}
        </span>
        ${hint ? `<span class="st-h">${esc(hint)}</span>` : ''}
        ${control}
      </label>`;
  }

  _institutionEditor() {
    const i = this.config.institution;
    return `
      ${this._group('Identidad', `
        ${this._field('Nombre de la institución', 'institution.name', i.name)}
        ${this._field('Claim', 'institution.claim', i.claim, { hint: 'Encabeza la cartela de entrada' })}
        ${this._field('Fechas de la colección', 'institution.dates', i.dates, { hint: 'Bajo el claim, en la misma cartela' })}
        ${this._field('Introducción', 'institution.introduction', i.introduction,
    { area: true, rows: 6, hint: 'Texto de la cartela de entrada' })}
      `)}
      ${this._group('Marca', `
        <p class="st-note">Se imprime en la cartela de entrada, sobre el claim — donde una institución pone su marca.</p>
        ${this._slot(MEDIA_SLOT.INSTITUTION_LOGO, SLOT_COPY.INSTITUTION_LOGO.label, i.logo,
    SLOT_MEDIA.INSTITUTION_LOGO.kind, SLOT_COPY.INSTITUTION_LOGO.formats)}
      `)}`;
  }

  _exhibitionEditor() {
    return this._group('Exposición', `
      ${this._field('Título de la exposición', 'exhibition.title', this.config.exhibition.title)}
      <p class="st-note">Aparece en la cabecera de la sala y encabeza la experiencia del visitante.</p>
    `);
  }

  _roomEditor(node) {
    const space = (this.world.spaces || []).find((s) => s.id === node.id);
    const authored = this.config.rooms[node.id] || {};
    return `
      ${this._group('Sala', `
        ${this._field('Nombre de la sala', `rooms.${node.id}.title`, authored.title, {
    inherited: space?.title || '', hint: 'Se lee en la cabecera mientras el visitante está dentro'
  })}
      `)}
      ${this._group('Contenido', `
        <ul class="st-list">
          ${(node.children || []).map((c) => `
            <li><button data-node="${esc(c.id)}"><b>${esc(c.label)}</b><i>${esc(c.sublabel)}</i></button></li>`).join('')}
        </ul>
      `)}`;
  }

  _entityEditor(node) {
    if (node.editedAt === 'institution') {
      return this._group('Señalética institucional', `
        <p class="st-note">
          Esta cartela es la voz de la institución, no una obra. Su texto y su marca se editan en
          <b>Institución</b>, para que la cabecera y la pared no puedan decir cosas distintas.
        </p>
        <button class="st-b" data-node="institution">Ir a Institución</button>
      `);
    }

    const entity = this.selectedEntity;
    const d = this.config.entities[node.id] || {};
    const src = entity?.content || {};
    const slots = SLOTS_FOR_KIND[node.entityKind] || [];

    return `
      ${this._group('Identidad', `
        ${this._field('Título', `entities.${node.id}.title`, d.title, { inherited: src.title })}
        ${this._field('Autoría', `entities.${node.id}.creator`, d.creator, { inherited: src.creator })}
        ${this._field('Año', `entities.${node.id}.year`, d.year, { inherited: src.year })}
        ${this._field('Técnica', `entities.${node.id}.medium`, d.medium, { inherited: src.medium })}
      `)}
      ${this._group('Interpretación', `
        ${this._field('Texto curatorial', `entities.${node.id}.description`, d.description,
    { area: true, inherited: src.description })}
      `)}
      ${slots.length ? this._group('Medios', `
        <p class="st-note">${esc(SLOT_CHOICE_NOTE[node.entityKind] || '')}</p>
        ${slots.map((slot) => {
    const spec = SLOT_COPY[slot];
    return this._slot(slot, spec.label, d[SLOT_MEDIA[slot].field], SLOT_MEDIA[slot].kind, spec.formats);
  }).join('')}
      `) : this._group('Medios', `
        <p class="st-note">Esta pieza no admite medios sustituibles en esta versión.</p>
      `)}
      ${this._group('Presentación', `
        <dl class="st-facts">
          <dt>Sala</dt><dd>${esc(roomOf(this.tree, node.id)?.label || '')}</dd>
          <dt>Soporte</dt><dd>${esc(SUPPORT[entity?.representation?.profile] || '—')}</dd>
          <dt>Medidas</dt><dd>${entity?.size ? `${(entity.size[0] * 100).toFixed(0)} × ${(entity.size[1] * 100).toFixed(0)} cm` : '—'}</dd>
        </dl>
        <p class="st-note">La colocación y el encuadre los gobierna la sala. El estudio no expone coordenadas de cámara.</p>
      `)}`;
  }

  _group(title, inner) {
    const id = `g_${title.replace(/\s+/g, '-').toLowerCase()}`;
    const off = this.collapsed.has(id);
    return `
      <section class="st-g ${off ? 'is-off' : ''}">
        <button class="st-gh" data-twist="${id}">
          <span>${esc(title)}</span><i>${off ? '▸' : '▾'}</i>
        </button>
        ${off ? '' : `<div class="st-gb">${inner}</div>`}
      </section>`;
  }

  /**
   * A media slot. The slot is named for what it is FOR, the native input is
   * wrapped so no browser English reaches the author, and the state chain is
   * drawn rather than summarised in one word.
   */
  _slot(slot, label, media, kind, formats) {
    const asset = media?.assetId ? this.vault.get(media.assetId) : null;
    const d = describeAsset(asset, media);
    const chain = d.chain.length ? d.chain : (kind === 'video' ? ['SELECTED', 'LOADING', 'DECODED', 'READY'] : ['SELECTED', 'LOADING', 'READY']);
    const at = d.index;
    const bad = d.state === 'ERROR';
    const names = { SELECTED: 'Seleccionado', LOADING: 'Cargando', DECODED: 'Decodificado', READY: 'Listo' };

    return `
      <div class="st-slot ${bad ? 'is-bad' : ''}" data-slot="${slot}">
        <div class="st-slothead">
          <span class="st-l">${esc(label)}</span>
          <span class="st-h">${esc(formats)}</span>
        </div>
        <div class="st-slotrow">
          <label class="st-file">
            <input type="file" data-media="${slot}" accept="${ACCEPT[kind]}">
            <span>${media ? 'Cambiar archivo' : 'Elegir archivo'}</span>
          </label>
          <span class="st-filename">${media ? esc(media.name) : 'Ningún archivo seleccionado'}</span>
        </div>
        ${media ? `
          <ol class="st-chain" aria-label="Estado del archivo">
            ${chain.map((step, i) => `
              <li class="${bad ? 'is-bad'
    // READY is the end of the chain, not a step still in progress. Painting the
    // last state amber made a finished file look like a stalled one.
    : i < at || (i === at && step === 'READY') ? 'is-done'
      : i === at ? 'is-now' : ''}">
                ${esc(names[step] || step)}
              </li>`).join('')}
            <li class="${this._isSaved() ? 'is-done' : ''}">Guardado</li>
          </ol>
          <p class="st-slotstate ${bad ? 'is-bad' : d.state === 'READY' ? 'is-ok' : 'is-busy'}">
            ${esc(d.label)}${d.detail ? ` · ${esc(d.detail)}` : ''}
          </p>
          ${bad ? `<button class="st-b st-b--small" data-retry="${slot}">Elegir otro archivo</button>` : ''}
        ` : `<p class="st-slotstate">${esc(this._emptySlotNote(kind, slot))}</p>`}
      </div>`;
  }

  /**
   * What an empty slot says about itself.
   *
   * Both slots used to say "se conserva el medio original de la pieza", which
   * is true of the one whose medium the piece actually has and a small lie
   * under the other: a framed painting's original medium is a photograph, so
   * printing that sentence under «Vídeo de la obra» told the author a video was
   * being preserved when none had ever existed. Two identical sentences in
   * adjacent cards also read as a template that had not been finished.
   */
  _emptySlotNote(kind, slot) {
    // The institution's mark is not a piece and has no original to preserve.
    if (slot === MEDIA_SLOT.INSTITUTION_LOGO) {
      return 'Sin logotipo. La cartela de entrada mostrará solo el nombre.';
    }
    const inherited = this.selectedEntity?.content?.media;
    const inheritedKind = inherited?.kind === 'VIDEO' ? 'video' : inherited?.src ? 'image' : null;
    if (inheritedKind === kind) return 'Se conserva el medio original de la pieza.';
    return kind === 'video'
      ? 'Sin vídeo. Añade uno para que la pieza se muestre en movimiento.'
      : 'Sin imagen. Añade una para que la pieza se muestre como fotografía.';
  }

  /* == readiness column ===================================================== */

  _readiness(r) {
    const pct = r.requiredTotal ? Math.round((r.requiredReady / r.requiredTotal) * 100) : 100;
    const tone = r.state === PROJECT_STATE.READY ? 'ok' : r.state === PROJECT_STATE.LOADING ? 'busy' : 'bad';
    const group = (title, list, cls) => list.length ? `
      <div class="st-vgroup">
        <h3 class="${cls}">${esc(title)} · ${list.length}</h3>
        <ul>${list.slice(0, 8).map((i) => `
          <li><button data-node="${esc(i.where || '')}">${esc(i.label)}${i.detail ? `<i>${esc(i.detail)}</i>` : ''}</button></li>`).join('')}
        </ul>
      </div>` : '';

    return `
      <aside class="st-val" aria-label="Estado del proyecto">
        <h2>Proyecto</h2>
        <div class="st-gauge is-${tone}">
          <b>${pct}%</b>
          <i>${esc(r.headline)}</i>
        </div>
        <ul class="st-domains">
          ${r.domains.filter((d) => d.total > 0).map((d) => `
            <li class="${d.ok === d.total ? 'is-ok' : d.worst === SEVERITY.BLOCKING ? 'is-bad' : 'is-warn'}">
              <span>${esc(d.name)}</span><i>${d.ok}/${d.total}</i>
            </li>`).join('')}
        </ul>
        ${group('Falta para poder empezar', r.blocking, 'is-bad')}
        ${group('Avisos', r.warnings, 'is-warn')}
        ${group('Sugerencias', r.suggestions, 'is-dim')}
        <div class="st-io">
          <button class="st-b st-b--small" data-act="export">Exportar proyecto</button>
          <button class="st-b st-b--small" data-act="museumB">Abrir «Museo de la Bruma» (ejemplo)</button>
          <button class="st-b st-b--small" data-act="reset">Restaurar la Fundación Arenas</button>
        </div>
        ${this.message ? `<p class="st-msg ${this.messageBad ? 'is-bad' : ''}">${esc(this.message)}</p>` : ''}
      </aside>`;
  }

  /* == behaviour ============================================================ */

  /**
   * @param {Element} [scope] bind only inside this subtree.
   *
   * Scoped, because binding the whole studio again after a partial redraw left
   * two listeners on every control that had not been replaced. The visible cost
   * was a file being accepted twice per click — two decodes, two object URLs,
   * one of them leaked — and it compounded with every selection: by the sixth,
   * one upload ran six times.
   */
  _bind(scope = this.root) {
    const on = (selector, event, handler) => {
      for (const el of scope.querySelectorAll(selector)) el.addEventListener(event, handler);
    };

    on('[data-jump]', 'click', (e) => {
      this.jump = e.currentTarget.dataset.jump;
      const target = { tree: '.st-tree', ed: '.st-ed', val: '.st-val' }[this.jump];
      this.root.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      for (const b of this.root.querySelectorAll('[data-jump]')) {
        b.classList.toggle('is-on', b.dataset.jump === this.jump);
      }
    });

    on('[data-domain]', 'click', (e) => {
      this.domain = e.currentTarget.dataset.domain;
      this.render();
    });

    on('[data-node]', 'click', async (e) => {
      const id = e.currentTarget.dataset.node;
      if (!id) return;
      this.selectedId = id;
      this.render();
      // Selecting a thing should show you the thing. The preview walks to the
      // room it lives in, because "where does this live" is a question the tree
      // can answer in words and the Museum can answer in space.
      await this.onReveal(id);
      // The walk changed which room is live, and a badge that still names the
      // room you left is worse than no badge.
      this._refreshLive();
    });

    on('[data-twist]', 'click', (e) => {
      const id = e.currentTarget.dataset.twist;
      if (this.collapsed.has(id)) this.collapsed.delete(id); else this.collapsed.add(id);
      this.render();
    });

    on('[data-bind]', 'input', (e) => {
      this._write(e.target.dataset.bind, e.target.value);
      this._markDirty();
      // Only the header and the readiness column depend on a keystroke; redrawing
      // the whole studio on every character would steal focus mid-word.
      this._refreshLive();
    });

    on('[data-media]', 'change', (e) => this._takeFile(e.currentTarget.dataset.media, e.target.files?.[0]));
    on('[data-retry]', 'click', (e) => {
      const input = this.root.querySelector(`[data-media="${e.currentTarget.dataset.retry}"]`);
      input?.click();
    });

    const act = (name, fn) => on(`[data-act="${name}"]`, 'click', fn);
    act('save', () => this._save());
    act('apply', () => this._apply());
    act('validate', () => { this.message = this.readiness.headline; this.messageBad = !this.readiness.canStart; this.render(); });
    act('start', () => this._start());
    act('export', () => {
      const text = exportConfigJSON(this.config);
      navigator.clipboard?.writeText(text).catch(() => {});
      this._say(`Proyecto copiado al portapapeles · ${text.length} bytes.`);
    });
    act('museumB', async () => {
      const response = await fetch('./authoring/museum-b.config.json', { cache: 'no-store' });
      this.config = normaliseConfig(await response.json());
      this.selectedId = 'institution';
      this._markDirty();
      await this._apply();
    });
    act('reset', async () => {
      const { baseConfigFromWorld } = await import('../experience-config.js');
      this.config = baseConfigFromWorld(this.world);
      this.selectedId = 'institution';
      this._markDirty();
      await this._apply();
    });
  }

  /** Redraw only what a keystroke can change, so the caret stays put. */
  _refreshLive() {
    const r = this.readiness;
    const live = this.root.querySelector('.st-live');
    if (live) {
      live.innerHTML = `${this.dirty ? 'Vista previa desactualizada' : 'Vista previa aplicada'} <b>${esc(this.currentRoom() || '')}</b>`;
      live.classList.toggle('is-stale', this.dirty);
    }
    const saved = this.root.querySelector('[data-role=saved]');
    if (saved) {
      // The same sentence the first render used. Reporting "Guardado" for a
      // project that has never been saved is a small lie the header should not
      // tell.
      saved.textContent = this.dirty ? 'Cambios sin guardar' : this._savedLabel();
      saved.classList.toggle('st-saved--dirty', this.dirty);
    }

    // Every surface that names the thing being edited follows the field that
    // renames it. Typing a new institution while the header, the breadcrumb and
    // the tree all still said the old one made the product look like it had not
    // heard — the one screenshot meant to prove "what will change" proved the
    // opposite.
    const node = findNode(this.tree, this.selectedId);
    const crumbs = this.root.querySelector('.st-crumbs');
    if (crumbs) crumbs.innerHTML = this._crumbHTML();
    const edTitle = this.root.querySelector('.st-edtop h2');
    if (edTitle && node) edTitle.textContent = node.label;
    const edEyebrow = this.root.querySelector('.st-edtop .st-eyebrow');
    if (edEyebrow && node) edEyebrow.textContent = node.sublabel || 'Editor';
    for (const row of this.root.querySelectorAll('.st-nodebtn')) {
      const id = row.parentElement?.querySelector('[data-node]')?.dataset.node;
      const fresh = id ? findNode(this.tree, id) : null;
      if (!fresh) continue;
      const b = row.querySelector('b'); const i = row.querySelector('i');
      if (b) b.textContent = fresh.label;
      if (i) i.textContent = fresh.sublabel || '';
    }

    // The filmstrip names the same pieces as the tree, so it has to hear the
    // same rename. It did not, and the result was the worst kind of wrong: an
    // author retitled a work and watched the tree and the editor agree on the
    // new name while the strip below the preview kept insisting on the old one.
    // Two surfaces contradicting each other about the same record, in the same
    // glance, in a tool whose job is cataloguing.
    for (const chip of this.root.querySelectorAll('.st-chip')) {
      const fresh = findNode(this.tree, chip.dataset.node);
      if (!fresh) continue;
      const b = chip.querySelector('b'); const i = chip.querySelector('i');
      // The ordinal belongs to the strip, not to the record, so it is kept.
      if (b) b.textContent = `${b.textContent.match(/^\d+\./)?.[0] || ''} ${fresh.label}`.trim();
      if (i) i.textContent = fresh.sublabel || '';
      const mark = chip.querySelector('em');
      if (fresh.authored && !mark) chip.insertAdjacentHTML('beforeend', '<em>Personalizado</em>');
      if (!fresh.authored && mark) mark.remove();
    }
    const val = this.root.querySelector('.st-val');
    if (val) {
      val.outerHTML = this._readiness(r);
      // Only the replaced column is rebound. Rebinding the studio would double
      // every listener that survived the redraw.
      this._bind(this.root.querySelector('.st-val'));
    }
    const start = this.root.querySelector('[data-act=start]');
    if (start) start.disabled = !r.canStart;
  }

  _write(path, value) {
    const parts = path.split('.');
    if (parts[0] === 'institution' || parts[0] === 'exhibition') {
      this.config[parts[0]][parts[1]] = value;
    } else if (parts[0] === 'rooms') {
      this._roomDraft(parts.slice(1, -1).join('.')).title = value || null;
    } else if (parts[0] === 'entities') {
      const field = parts[parts.length - 1];
      this._entityDraft(parts.slice(1, -1).join('.'))[field] = value || null;
    }
  }

  async _takeFile(slot, file) {
    const { kind, field } = SLOT_MEDIA[slot];
    const holder = slot === MEDIA_SLOT.INSTITUTION_LOGO
      ? this.config.institution
      : this._entityDraft(this.selectedId);
    const target = { get: () => holder[field], set: (v) => { holder[field] = v; } };

    // Replacing releases the previous asset: an object URL that is dropped
    // rather than revoked is a leak that never announces itself.
    const previous = target.get();
    if (previous?.assetId) this.vault.release(previous.assetId);

    // A piece shows one representation. Choosing a video for a work that already
    // had a photograph retires the photograph rather than leaving two files on
    // one record for a later rule to arbitrate — the author decided; the config
    // should record the decision, not the ambiguity.
    for (const other of SLOTS_FOR_KIND[this.selectedEntity?.kind] || []) {
      const spec = SLOT_MEDIA[other];
      if (spec.field === field) continue;
      const stale = holder[spec.field];
      if (stale?.assetId) this.vault.release(stale.assetId);
      holder[spec.field] = null;
    }

    const asset = await this.vault.accept(file, { kind });
    if (asset.state === 'ERROR') {
      // The reference is kept so the author sees which file failed and why, and
      // the slot offers the way out instead of going quiet.
      target.set({
        kind, src: asset.reference, assetId: asset.id, name: asset.name,
        mimeType: asset.mimeType, bytes: asset.bytes, width: 0, height: 0, durationMs: 0
      });
      this._markDirty();
      this.render();
      return;
    }

    target.set({
      kind, src: asset.reference, assetId: asset.id, name: asset.name,
      mimeType: asset.mimeType, bytes: asset.bytes,
      width: asset.width, height: asset.height, durationMs: Math.round((asset.duration || 0) * 1000)
    });
    this._markDirty();
    this.render();
  }

  _markDirty() { this.dirty = true; }

  _say(message, bad = false) {
    this.message = message;
    this.messageBad = bad;
    this.render();
  }

  _save() {
    ConfigStore.save(this.config);
    this.dirty = false;
    this.savedAt = new Date();
    this._say('Proyecto guardado en este navegador.');
  }

  async _apply() {
    this.busy = 'apply';
    this.render();
    await this.onApply(this.config);
    this.busy = null;
    // A rebuild puts the visitor back at the entrance. The badge kept naming the
    // room the preview had been in before the rebuild, which is the kind of small
    // lie that makes an author distrust everything else on screen.
    this._say('La vista previa muestra el proyecto actual.');
    this._refreshLive();
  }

  async _start() {
    const r = this.readiness;
    if (!r.canStart) { this._say('Faltan elementos necesarios para empezar.', true); return; }
    // START is not another Apply: it applies if there is anything unapplied, and
    // then leaves the authoring context entirely.
    if (this.dirty) await this.onApply(this.config);
    await this.onStart(this.config);
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    document.documentElement.style.removeProperty('--st-canvas-h');
    this.root.remove();
  }
}
