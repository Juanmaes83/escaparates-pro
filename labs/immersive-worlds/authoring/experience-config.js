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
 */

export const CONFIG_SCHEMA_VERSION = 1;

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
    bytes: Number(media.bytes || 0) || 0
  };
}

/**
 * Fill every field, so a partial config from an author, an import or an older
 * version still produces a complete, predictable object.
 */
export function normaliseConfig(input = {}) {
  const c = input || {};
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
      introduction: String(institution.introduction || '').slice(0, 900),
      logo: normaliseMedia(institution.logo)
    },

    exhibition: {
      title: String(exhibition.title || '').slice(0, 160)
    },

    /**
     * Keyed by the world's own entity id, so an authored artwork is an overlay
     * on a semantic record that already exists rather than a second, competing
     * record. Only the fields the author actually set are carried.
     */
    artworks: Object.fromEntries(
      Object.entries(c.artworks || {}).map(([id, a]) => [id, {
        title: a.title ?? null,
        creator: a.creator ?? null,
        year: a.year ?? null,
        medium: a.medium ?? null,
        description: a.description ?? null,
        media: normaliseMedia(a.media)
      }])
    ),

    experience: {
      portalVariant: c.experience?.portalVariant || 'A'
    }
  };
}

/** The config that reproduces the Museum as it ships, so "reset" has a meaning. */
export function baseConfigFromWorld(world) {
  return normaliseConfig({
    label: world?.title || 'Configuración base',
    institution: {
      name: world?.metadata?.institution || world?.title || '',
      claim: world?.title || '',
      introduction: world?.metadata?.description || ''
    },
    exhibition: { title: world?.title || '' },
    artworks: {},
    experience: { portalVariant: 'A' }
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

  for (const entity of next.entities || []) {
    const authored = c.artworks[entity.id];
    if (!authored) continue;
    const content = { ...(entity.content || {}) };
    for (const field of ['title', 'creator', 'year', 'medium', 'description']) {
      if (authored[field] !== null && authored[field] !== undefined && authored[field] !== '') {
        content[field] = authored[field];
      }
    }
    if (authored.media) {
      const live = resolveMedia(authored.media.src) || authored.media.src;
      content.media = { ...(content.media || {}), src: live, kind: authored.media.kind };
    }
    entity.content = content;
  }

  return next;
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
