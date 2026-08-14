/**
 * Museum — Experience Configuration
 *
 * The client-specific layer:  ENGINE + SCENE KIT + EXPERIENCE CONFIG = CLIENT EXPERIENCE.
 *
 * This is the product model, not the panel's UI state. It is serialisable, it
 * carries its own version, its ids are stable, and it holds no engine objects —
 * a config can be written to disk, mailed, restored a year later, and still mean
 * the same thing.
 *
 * REUSE NOTE. Escaparates Pro already solves this shape in
 * `js/customization/project-store-local.js`: a normalise pass that fills every
 * field with a defined default, an explicit `schemaVersion`, stable ids minted
 * once, `exportJSON` / `importJSON`, and a `cleanMedia` pass that keeps an
 * asset's *description* (type, name, mime, size) separate from whatever URL is
 * currently rendering it. Those decisions are adopted here deliberately.
 *
 * What is NOT adopted is the code itself. That module is an `EP.*` global in the
 * website-modules product; Immersive Worlds is strict ESM with a purity contract
 * the engine is tested against. Importing the global would couple two codebases
 * with different rules to save a few dozen lines. The proven shape is reused;
 * the binding is not.
 *
 * SCHEMA 2 (VS02) — what changed and why:
 *
 *   `artworks` became `entities`, because a projection and a sculpture are not
 *   artworks and calling them that is how VS01 ended up with a wall panel at the
 *   top of the artwork picker.
 *
 *   One `media` slot became named semantic slots — `image` and `video` — because
 *   a single slot meant choosing a video silently discarded the image, and the
 *   destination of a file stopped being knowable from the field the author used.
 *   A common vault is fine. A common slot is not.
 *
 *   `rooms` appeared, because the room title is on screen in the Museum's own
 *   header and a second institution cannot be expected to run its exhibition in
 *   rooms named by the first one.
 *
 * Version 1 configs still load: `migrate()` folds them forward.
 */

export const CONFIG_SCHEMA_VERSION = 2;

/**
 * The semantic slots a medium can occupy. The slot says what a file IS FOR,
 * which is the thing the author is choosing; the vault says what it currently
 * is. Keeping them apart is what lets the panel promise a destination and keep
 * the promise.
 */
export const MEDIA_SLOT = Object.freeze({
  INSTITUTION_LOGO: 'INSTITUTION_LOGO',
  ARTWORK_IMAGE: 'ARTWORK_IMAGE',
  ARTWORK_VIDEO: 'ARTWORK_VIDEO',
  PROJECTION_VIDEO: 'PROJECTION_VIDEO',
  PROJECTION_IMAGE: 'PROJECTION_IMAGE'
});

/**
 * What each slot accepts and where the config keeps it.
 *
 * `PROJECTION_MEDIA` used to be one slot whose medium was inferred from the
 * entity kind. That is the ambiguity this table exists to remove: the slot names
 * the medium as well as the destination, so nothing downstream has to guess, and
 * a panel cannot offer a control whose meaning depends on where you clicked it.
 */
export const SLOT_MEDIA = Object.freeze({
  INSTITUTION_LOGO: { kind: 'image', field: 'logo' },
  ARTWORK_IMAGE: { kind: 'image', field: 'image' },
  ARTWORK_VIDEO: { kind: 'video', field: 'video' },
  PROJECTION_IMAGE: { kind: 'image', field: 'image' },
  PROJECTION_VIDEO: { kind: 'video', field: 'video' }
});

/**
 * Which entity kinds can genuinely carry which slot, per the running Scene Kit.
 *
 * This table used to say a video could not hang on a framed canvas. That was
 * never true of the kit — `museum-scene-kit.js` hangs whatever texture the media
 * layer hands it, and a `VideoTexture` is a texture. It was true only of this
 * file, and the cost was that video was authorable on exactly one entity in the
 * whole Museum: an author who opened any of the nine artworks found no way to
 * give it a moving image and concluded, correctly, that video authoring did not
 * work. Video art has hung in museums since the 1960s; a platform for museums
 * that cannot accept it is not finished.
 *
 * The reverse was equally arbitrary: a projection surface can show a still. A
 * projected photograph is an ordinary thing to want, and the kit draws it.
 *
 * An entity carries one representation at a time — a work is either a still or a
 * moving image, never both at once — so the two slots on a kind are alternatives,
 * and choosing one releases the other.
 */
export const SLOTS_FOR_KIND = Object.freeze({
  ARTWORK: [MEDIA_SLOT.ARTWORK_IMAGE, MEDIA_SLOT.ARTWORK_VIDEO],
  // A sculpture is built, not photographed: the Scene Kit raises a vessel on a
  // plinth and never reads a media file for it. Offering an image slot here
  // would be a control that does nothing, and requiring one would report the
  // shipped Museum as incomplete because a sculpture is not a picture.
  SCULPTURE: [],
  PROJECTION: [MEDIA_SLOT.PROJECTION_VIDEO, MEDIA_SLOT.PROJECTION_IMAGE],
  AUDIO: [],
  TEXT: []
});

/** A media reference: what the author chose, never how it is currently drawn. */
function normaliseMedia(media) {
  if (!media) return null;
  return {
    kind: media.kind === 'video' ? 'video' : 'image',
    // `src` is a durable reference — a repository path, or `authored:<assetId>`
    // for something the author supplied. The live object URL lives in the media
    // vault and is deliberately not stored here: it dies with the tab.
    src: String(media.src || ''),
    assetId: media.assetId || null,
    name: String(media.name || ''),
    mimeType: media.mimeType || null,
    bytes: Number(media.bytes || 0) || 0,
    // The author's file has its own proportions. Carrying them means the world
    // can be told the real aspect instead of drawing a new image inside the
    // frame the previous one happened to need.
    width: Number(media.width || 0) || 0,
    height: Number(media.height || 0) || 0,
    durationMs: Number(media.durationMs || 0) || 0
  };
}

/**
 * The world speaks a different vocabulary than the config: `IMAGE` / `VIDEO`,
 * not `image` / `video`. Translating here — at the one boundary that crosses —
 * is what keeps the config a document and the world a world.
 */
const WORLD_MEDIA_KIND = { image: 'IMAGE', video: 'VIDEO' };

function emptyEntity() {
  return {
    title: null, creator: null, year: null, medium: null, description: null,
    image: null, video: null
  };
}

/** Fold a version-1 config forward. A stored project must not die of a rename. */
function migrate(input) {
  const c = { ...(input || {}) };
  if (Number(c.schemaVersion || 1) >= 2) return c;

  c.entities = { ...(c.entities || {}) };
  for (const [id, old] of Object.entries(c.artworks || {})) {
    const entity = { ...emptyEntity(), ...c.entities[id] };
    for (const field of ['title', 'creator', 'year', 'medium', 'description']) {
      if (old?.[field] != null) entity[field] = old[field];
    }
    // A v1 config carried one ambiguous `media`. Its own kind is the only
    // evidence of what it was for, so that is what decides where it lands.
    if (old?.media) {
      if (old.media.kind === 'video') entity.video = old.media;
      else entity.image = old.media;
    }
    c.entities[id] = entity;
  }
  delete c.artworks;
  return c;
}

/**
 * Fill every field, so a partial config from an author, an import or an older
 * version still produces a complete, predictable object.
 */
export function normaliseConfig(input = {}) {
  const c = migrate(input);
  const institution = c.institution || {};
  const exhibition = c.exhibition || {};
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    configId: c.configId || `cfg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    label: String(c.label || 'Configuración sin título').slice(0, 120),
    updatedAt: new Date().toISOString(),

    institution: {
      name: String(institution.name || '').slice(0, 120),
      claim: String(institution.claim || '').slice(0, 200),
      // Free text, because "1958 — 1994" and "desde 1902" are both things an
      // institution says about itself and neither is a date the product parses.
      dates: String(institution.dates || '').slice(0, 60),
      introduction: String(institution.introduction || '').slice(0, 900),
      logo: normaliseMedia(institution.logo)
    },

    exhibition: {
      title: String(exhibition.title || '').slice(0, 160)
    },

    /** Keyed by the world's own space id. */
    rooms: Object.fromEntries(
      Object.entries(c.rooms || {}).map(([id, r]) => [id, { title: r?.title ?? null }])
    ),

    /**
     * Keyed by the world's own entity id, so an authored record is an overlay on
     * a semantic record that already exists rather than a second, competing
     * record. Only the fields the author actually set are carried.
     */
    entities: Object.fromEntries(
      Object.entries(c.entities || {}).map(([id, e]) => [id, {
        title: e?.title ?? null,
        creator: e?.creator ?? null,
        year: e?.year ?? null,
        medium: e?.medium ?? null,
        description: e?.description ?? null,
        image: normaliseMedia(e?.image),
        video: normaliseMedia(e?.video)
      }])
    ),

    experience: {
      portalVariant: c.experience?.portalVariant || 'A',
      // How the camera travels between authored beats — never where it lands.
      pacing: PACING[c.experience?.pacing] ? c.experience.pacing : 'NATURAL',
      // Whether the visitor's own system preference may be overridden towards
      // stillness. It may never be overridden the other way: a visitor who has
      // asked for reduced motion does not get talked out of it by a config.
      motion: c.experience?.motion === 'CALM' ? 'CALM' : 'SYSTEM'
    }
  };
}

/**
 * The pace of travel, in author language and in numbers.
 *
 * An author picks a feeling; the engine takes a multiplier. Both live here so
 * the panel never has to know that "Paseo" is 1.35, and the director never has
 * to know what "Paseo" is called in Spanish.
 */
export const PACING = Object.freeze({
  BRISK: { label: 'Ágil', hint: 'Llega antes a cada obra', factor: 0.75 },
  NATURAL: { label: 'Natural', hint: 'El ritmo con el que se compuso el recorrido', factor: 1 },
  CALM: { label: 'Pausado', hint: 'Da tiempo a mirar mientras la cámara viaja', factor: 1.35 }
});

/** What each transition family is called for someone who is not an engineer. */
export const TRANSITION_LABEL = Object.freeze({
  T1_MICRO_REFRAMING: 'Reencuadre suave',
  T2_LOCAL_WALK: 'Paseo corto',
  T3_GALLERY_TRAVERSE: 'Recorrido de sala',
  T4_OBJECT_ORBIT: 'Órbita de objeto',
  T5_THRESHOLD_APPROACH: 'Aproximación al umbral',
  T6_ROOM_CROSSING: 'Paso entre salas'
});

/** The entry wall: the institution's own voice, already written into the world. */
function welcomePanelOf(world) {
  return (world?.entities || []).find(
    (e) => e.kind === 'TEXT' && e.subtype === 'wall-panel' && e.spaceId === world?.startSpaceId
  ) || null;
}

/**
 * The config that reproduces the Museum as it ships, so "reset" has a meaning.
 *
 * The institution fields are read from the entry wall rather than invented from
 * the world's title, because the wall is where they are going to be written
 * back. Anything else would make the default Museum change the first time it
 * booted through the authoring path — a personalisation layer that alters the
 * thing it is supposed to leave alone.
 */
export function baseConfigFromWorld(world) {
  const welcome = welcomePanelOf(world);
  return normaliseConfig({
    schemaVersion: CONFIG_SCHEMA_VERSION,
    label: world?.title || 'Configuración base',
    institution: {
      name: world?.metadata?.institution || world?.title || '',
      claim: welcome?.content?.title || world?.title || '',
      dates: welcome?.content?.year || '',
      introduction: welcome?.content?.description || world?.metadata?.description || ''
    },
    exhibition: { title: world?.title || '' },
    rooms: {},
    entities: {},
    experience: { portalVariant: 'A', pacing: 'NATURAL', motion: 'SYSTEM' }
  });
}

/**
 * Apply a config to a world record *before* the Museum is built from it.
 *
 * Working on the data rather than on the built scene is what makes the second
 * museum test pass without engine changes: every representation — wall label,
 * Focus panel, Collection Browse, the HUD's institution line — already derives
 * from these same records, so changing the record changes all of them and no
 * representation needs to know an authoring layer exists.
 *
 * @param {object} world  the world JSON, not mutated
 * @param {object} config
 * @param {(ref:string)=>string|null} [resolveMedia]  authored asset -> live URL
 */
export function applyConfigToWorld(world, config, resolveMedia = () => null) {
  const c = normaliseConfig(config);
  const next = structuredClone(world);

  if (c.institution.name) {
    next.metadata = { ...(next.metadata || {}), institution: c.institution.name };
  }
  if (c.exhibition.title) next.title = c.exhibition.title;
  if (c.institution.claim) {
    next.metadata = { ...(next.metadata || {}), claim: c.institution.claim };
  }
  if (c.institution.introduction) {
    next.metadata = { ...(next.metadata || {}), description: c.institution.introduction };
  }

  applyInstitutionSignage(next, c, resolveMedia);

  for (const space of next.spaces || []) {
    const authored = c.rooms[space.id];
    if (authored?.title) space.title = authored.title;
  }

  for (const entity of next.entities || []) {
    const authored = c.entities[entity.id];
    if (!authored) continue;
    const content = { ...(entity.content || {}) };
    for (const field of ['title', 'creator', 'year', 'medium', 'description']) {
      if (authored[field] !== null && authored[field] !== undefined && authored[field] !== '') {
        content[field] = authored[field];
      }
    }

    // The slot the author used decides the destination, and the entity's own
    // kind decides which slots it was allowed to use. A kind that admits no slot
    // reads no file, however much the config happens to carry.
    const allowed = SLOTS_FOR_KIND[entity.kind] || [];
    const takes = (medium) => allowed.some((slot) => SLOT_MEDIA[slot].kind === medium);
    // The studio releases one when the other is chosen, so this is a tie that
    // should never arrive. If a hand-edited config brings one anyway, the moving
    // image wins: it is the more specific claim, and silently preferring the
    // still would drop the medium the author went out of their way to supply.
    const chosen = (takes('video') && authored.video)
      || (takes('image') && authored.image)
      || null;
    if (chosen) content.media = mediaForWorld(chosen, content.media, c, resolveMedia);

    entity.content = content;
  }

  return next;
}

/** One authored file, described the way the world requires it to be described. */
function mediaForWorld(authored, previous, config, resolveMedia) {
  const live = resolveMedia(authored.src) || authored.src;
  const aspect = authored.width && authored.height
    ? authored.width / authored.height
    : previous?.aspect;
  return {
    ...(previous || {}),
    src: live,
    kind: WORLD_MEDIA_KIND[authored.kind] || 'IMAGE',
    aspect,
    // Rights travel with the file, and an authored file does not inherit the
    // previous owner's credit line. Saying so is not decoration: INV-10 asks
    // every medium in a world to name who owns it.
    credit: `${config.institution.name || 'La institución autora'} — medio aportado en la configuración`,
    rights: 'Medio aportado por la institución que firma esta configuración. ' +
      'Los derechos son suyos y no derivan de la colección de demostración.'
  };
}

/**
 * Institutional signage is not an artwork: the welcome panel in the entry space
 * *is* the institution's own voice on the wall, so it is written from the
 * institution record rather than left carrying the previous tenant's name.
 *
 * The visitor reads that wall before anything else. A header that says one
 * institution while the wall says another is the single most visible way a
 * personalisable museum can look unpersonalised.
 *
 * The logo belongs here too. An institution's mark goes on its own signage —
 * not on a floating plane invented to have somewhere to put it.
 */
function applyInstitutionSignage(world, config, resolveMedia) {
  const { name, claim, dates, introduction, logo } = config.institution;
  if (!name && !claim && !introduction && !logo) return;

  // On a wall, an institution signs itself the way it is called, not the way its
  // metadata qualifies it. The HUD already strips this parenthetical for the
  // same reason; doing it in one more place keeps the two headers agreeing.
  const signature = name.replace(/\s*\(.*\)$/, '');

  for (const entity of world.entities || []) {
    if (entity.kind !== 'TEXT' || entity.subtype !== 'wall-panel') continue;
    const content = { ...(entity.content || {}) };

    // Every institutional panel is signed by the institution.
    if (signature) content.creator = signature;

    // Only the welcome panel carries the claim, the dating, the introduction and
    // the mark; the notes in other rooms are about those rooms.
    if (entity.spaceId === world.startSpaceId) {
      if (claim) content.title = claim;
      // Written even when empty: a second institution that states no dates must
      // not inherit the previous one's, which is exactly what silence would do.
      if (claim || dates) content.year = dates;
      if (introduction) content.description = introduction;
      if (logo) content.media = mediaForWorld(logo, content.media, config, resolveMedia);
    }
    entity.content = content;
  }
}

export function exportConfigJSON(config) {
  return JSON.stringify(normaliseConfig(config), null, 2);
}

export function importConfigJSON(text) {
  const parsed = JSON.parse(text);
  if (parsed.schemaVersion && parsed.schemaVersion > CONFIG_SCHEMA_VERSION) {
    throw new Error(
      `Esta configuración usa el esquema ${parsed.schemaVersion} y este Museo entiende hasta el ${CONFIG_SCHEMA_VERSION}.`
    );
  }
  return normaliseConfig(parsed);
}
