/**
 * Museum → Project Cloud asset adapter.
 *
 * PREPARATION ONLY. Nothing in the running Studio imports this yet: byte-level
 * persistence has not been demonstrated in any environment, and a module that
 * is wired in but unproven is exactly how `GUARDADO` starts meaning nothing.
 *
 * WHY AN ADAPTER AND NOT A SECOND BACKEND
 * ---------------------------------------
 * Escaparates Pro already owns the whole capability: `project_assets` carries
 * slot, kind, mime, original name, storage key, public URL, size, width,
 * height, duration, checksum and status; `r2-storage.ts` presigns PUT and
 * DELETE against R2; and three routes drive the lifecycle. None of that needs
 * changing for the Museum to use it. What the Museum lacks is a client, so a
 * client is all this is — no storage logic, no second source of truth, and no
 * Project Cloud code copied across.
 *
 * THE AUTHENTICATION BOUNDARY
 * ---------------------------
 * A deployed static client must never ship a long-lived bearer token, so this
 * module cannot hold one. It takes a `session` provider and asks it for
 * credentials per request; obtaining them is the host application's job, from
 * an authenticated product session. There is no default, no fallback constant
 * and nowhere to put a secret:
 *
 *     MUSEUM STUDIO (browser)
 *       → authenticated product session   ← the host app owns this
 *       → ProjectCloudAssets              ← this file
 *       → Project Cloud API → R2
 *
 * `authorize()` returning nothing is a hard error rather than an anonymous
 * request, because a silent 401 on upload is indistinguishable to an author
 * from a file that simply did not save.
 *
 * READY IS NOT SAVED
 * ------------------
 * The server's `ready` means the bytes are in R2 and the record is complete.
 * That is not the same as the project having been saved with a reference to
 * them, and it is certainly not the same as the asset being used. Those are
 * three different facts and this module reports them as three states, so the
 * distinction survives in the data rather than depending on the UI wording.
 */

/** Museum-side asset states. The first four mirror the server's own vocabulary. */
export const ASSET_STATE = {
  SELECTED: 'SELECTED',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  /** Bytes are in R2 and the project_assets row is complete. */
  READY: 'READY',
  /** READY *and* the project config referencing it has been persisted. */
  SAVED: 'SAVED',
  /** SAVED *and* assigned to at least one slot. */
  IN_USE: 'IN_USE',
  ERROR: 'ERROR'
};

/** Server status → Museum state. `saved` and `in use` are never server facts. */
const SERVER_STATE = {
  pending: ASSET_STATE.UPLOADING,
  uploading: ASSET_STATE.UPLOADING,
  processing: ASSET_STATE.PROCESSING,
  ready: ASSET_STATE.READY,
  deleted: ASSET_STATE.ERROR
};

/**
 * What the API accepts today, copied from the route's own table rather than
 * guessed. Offering an author a file the server will reject with 415 after it
 * has uploaded is a worse experience than refusing it up front.
 */
export const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'font/woff2', 'application/font-woff2'
]);

/**
 * Reference namespaces, so there is exactly one reading of any `media.src`.
 *
 * The vault's existing `authored:<id>` stays exactly what it always was — a
 * session-scoped handle to an object URL that dies with the tab. Persistent
 * assets get their own namespace, and the two never collide. A resolver can
 * therefore tell, from the reference alone and without asking anything, whether
 * a piece of media will survive a reload. That is the property that stops the
 * dual truth this migration could easily create.
 */
export const REF = {
  SESSION: 'authored:',
  PERSISTENT: 'asset:'
};

export const assetReference = (assetId) => `${REF.PERSISTENT}${assetId}`;
export const isPersistentRef = (ref) => typeof ref === 'string' && ref.startsWith(REF.PERSISTENT);
export const isSessionRef = (ref) => typeof ref === 'string' && ref.startsWith(REF.SESSION);
export const assetIdFromRef = (ref) => (isPersistentRef(ref) ? ref.slice(REF.PERSISTENT.length) : null);

class AssetError extends Error {
  constructor(code, message, status = 0, requestId = null) {
    super(message);
    this.name = 'AssetError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export class ProjectCloudAssets {
  /**
   * @param {object} deps
   * @param {string} deps.apiBase          e.g. https://api.example.com — no trailing slash
   * @param {string} deps.projectId        the Museum project's Project Cloud id
   * @param {{authorize:() => Promise<{token:string}|null>}} deps.session
   *        Supplies credentials per request from an authenticated product
   *        session. Never persisted here, never defaulted, never bundled.
   * @param {typeof fetch} [deps.fetch]    injected so contract tests can drive it
   */
  constructor({ apiBase, projectId, session, fetch: fetchImpl }) {
    if (!apiBase) throw new AssetError('CONFIG', 'apiBase es obligatorio');
    if (!projectId) throw new AssetError('CONFIG', 'projectId es obligatorio');
    if (!session || typeof session.authorize !== 'function') {
      throw new AssetError('CONFIG', 'se requiere una sesión autenticada; este cliente no puede contener credenciales');
    }
    this.apiBase = apiBase.replace(/\/+$/, '');
    this.projectId = projectId;
    this.session = session;
    this._fetch = fetchImpl || ((...a) => globalThis.fetch(...a));
  }

  async _authHeaders() {
    const auth = await this.session.authorize();
    if (!auth?.token) {
      throw new AssetError('UNAUTHENTICATED', 'No hay sesión autenticada para subir medios');
    }
    return { authorization: `Bearer ${auth.token}` };
  }

  async _json(url, init) {
    const response = await this._fetch(url, init);
    let body = null;
    try { body = await response.json(); } catch { /* an empty or non-JSON body is handled below */ }
    if (!response.ok) {
      throw new AssetError(
        body?.error?.code || 'HTTP_ERROR',
        body?.error?.message || `La API respondió ${response.status}`,
        response.status,
        body?.requestId || null
      );
    }
    return body;
  }

  /**
   * Step 1 — claim an asset id and a presigned URL.
   *
   * The row exists at `uploading` from this point, which is why a failure after
   * here still has an id to report against instead of vanishing.
   */
  async initUpload({ filename, mimeType, size, slot = 'media' }) {
    if (!ACCEPTED_MIME.has(String(mimeType).toLowerCase())) {
      throw new AssetError('MIME_NOT_ALLOWED', `El servidor no acepta ${mimeType}`, 415);
    }
    const body = await this._json(`${this.apiBase}/v1/projects/${this.projectId}/assets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await this._authHeaders()) },
      body: JSON.stringify({ filename, mimeType, size, slot })
    });
    return { asset: body.asset, upload: body.upload };
  }

  /**
   * Step 2 — the bytes, straight to R2.
   *
   * Deliberately not through the API: the presigned URL exists so file bodies
   * never traverse the application server, and routing them through it would be
   * inventing a second upload path the platform already decided against.
   */
  async putBytes(upload, file) {
    const response = await this._fetch(upload.url, {
      method: 'PUT',
      headers: upload.headers,
      body: file
    });
    if (!response.ok) {
      throw new AssetError('STORAGE_PUT_FAILED', `El almacenamiento respondió ${response.status}`, response.status);
    }
    return response.headers?.get?.('etag') || null;
  }

  /**
   * Step 3 — tell the record what arrived.
   *
   * `duration` is SECONDS here: the route multiplies by 1000 itself, and
   * sending milliseconds would store an hour-long clip for a four-second one.
   * The Museum measures these while probing the file locally, so they cost
   * nothing extra to supply and they are what the Media Library later renders.
   */
  async complete(assetId, { etag = null, width = null, height = null, durationMs = null } = {}) {
    const payload = {};
    if (etag) payload.etag = etag;
    if (width) payload.width = width;
    if (height) payload.height = height;
    if (durationMs) payload.duration = durationMs / 1000;
    const body = await this._json(`${this.apiBase}/v1/projects/${this.projectId}/assets/${assetId}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await this._authHeaders()) },
      body: JSON.stringify(payload)
    });
    return body.asset;
  }

  async remove(assetId) {
    await this._json(`${this.apiBase}/v1/projects/${this.projectId}/assets/${assetId}`, {
      method: 'DELETE',
      headers: await this._authHeaders()
    });
    return true;
  }

  /**
   * The whole lifecycle, reporting each step as it happens.
   *
   * `onState` exists so the Studio can show the truth rather than a spinner: the
   * author sees UPLOADING while bytes move and READY when the record completes,
   * and never sees SAVED from here — this module cannot know whether the project
   * was saved afterwards, so it does not claim it.
   */
  async upload(file, { slot = 'media', probe = null, onState = () => {} } = {}) {
    onState({ state: ASSET_STATE.SELECTED, file: file.name });
    try {
      const { asset, upload } = await this.initUpload({
        filename: file.name, mimeType: file.type, size: file.size, slot
      });
      onState({ state: ASSET_STATE.UPLOADING, assetId: asset.id });
      const etag = await this.putBytes(upload, file);
      onState({ state: ASSET_STATE.PROCESSING, assetId: asset.id });
      const meta = probe ? await probe(file) : {};
      const ready = await this.complete(asset.id, { etag, ...meta });
      onState({ state: ASSET_STATE.READY, assetId: ready.id, asset: ready });
      return ready;
    } catch (error) {
      onState({ state: ASSET_STATE.ERROR, code: error.code, message: error.message });
      throw error;
    }
  }
}

/**
 * The config record for a persisted asset.
 *
 * Same shape `normaliseMedia()` already stores, so nothing downstream has to
 * learn a new object — only the reference namespace changes, and `publicUrl` is
 * carried so a reload can draw the asset before any session exists.
 */
export function mediaFromAsset(asset) {
  return {
    kind: asset.kind === 'video' ? 'video' : 'image',
    src: assetReference(asset.id),
    assetId: asset.id,
    publicUrl: asset.url || asset.publicUrl || null,
    name: asset.originalName || asset.filename || '',
    mimeType: asset.mimeType || null,
    bytes: Number(asset.size || asset.sizeBytes || 0) || 0,
    width: Number(asset.width || 0) || 0,
    height: Number(asset.height || 0) || 0,
    durationMs: asset.duration != null ? Math.round(asset.duration * 1000) : Number(asset.durationMs || 0) || 0
  };
}

/**
 * What an author should be told about one piece of media.
 *
 * The three facts are kept apart on purpose. A session reference is never SAVED
 * however complete its upload was, because it is not going to survive the tab —
 * which is precisely the trust problem this whole slice exists to remove.
 */
export function mediaState(media, { serverStatus = null, savedInProject = false, usedBy = 0 } = {}) {
  if (!media?.src) return ASSET_STATE.SELECTED;
  if (isSessionRef(media.src)) return ASSET_STATE.READY;
  if (serverStatus && SERVER_STATE[serverStatus] !== ASSET_STATE.READY) return SERVER_STATE[serverStatus];
  if (!savedInProject) return ASSET_STATE.READY;
  return usedBy > 0 ? ASSET_STATE.IN_USE : ASSET_STATE.SAVED;
}
