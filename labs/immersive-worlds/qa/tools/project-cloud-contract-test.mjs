/**
 * CONTRACT TEST — Museum asset adapter against the Project Cloud API shapes.
 *
 * THIS IS NOT A PERSISTENCE PROOF.
 *
 * Nothing here touches Postgres, R2 or a network. It drives the adapter against
 * a stub that enforces the request and response shapes taken from the real route
 * (`apps/api/src/routes/project-assets.ts`) and the real table
 * (`apps/api/src/db/project-cloud-schema.ts`). It can prove the adapter speaks
 * the contract correctly. It cannot prove a byte ever reached storage, and no
 * result from this file may be reported as if it had.
 *
 * The distinction matters because a green run here looks identical to a green
 * run of a real integration, and the entire P0.2 trust problem is people being
 * told something was saved when it was not.
 *
 *   node qa/tools/project-cloud-contract-test.mjs
 */
import assert from 'node:assert/strict';
import {
  ProjectCloudAssets, ASSET_STATE, REF, assetReference, isPersistentRef,
  isSessionRef, assetIdFromRef, mediaFromAsset, mediaState, ACCEPTED_MIME
} from '../../authoring/project-cloud/asset-client.js';

let passed = 0;
const results = [];
const test = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); passed += 1; console.log(`OK    ${name}`); } catch (e) {
    results.push({ name, ok: false, detail: e.message });
    console.log(`FALLO ${name}\n      ${e.message}`);
  }
};

/**
 * The stub server. It asserts what the real routes assert, so a request this
 * accepts is one the real API would also parse — the point of a contract test.
 */
function makeApi({ failStorage = false } = {}) {
  const calls = [];
  const rows = new Map();
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', headers: init.headers || {}, body: init.body });
    const json = (status, body) => ({
      ok: status < 400, status,
      json: async () => body,
      headers: { get: () => '"etag-abc"' }
    });

    // Storage PUT — a presigned URL, not the API.
    if (init.method === 'PUT') {
      return failStorage ? json(500, {}) : json(200, {});
    }
    const auth = init.headers?.authorization;
    if (!auth) return json(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const init$ = /\/v1\/projects\/([^/]+)\/assets$/.exec(String(url));
    if (init$ && init.method === 'POST') {
      const body = JSON.parse(init.body);
      // The route's zod schema: filename, mimeType, size (positive int), slot.
      assert.ok(body.filename && body.filename.length <= 240, 'filename');
      assert.ok(body.mimeType && body.mimeType.length <= 120, 'mimeType');
      assert.ok(Number.isInteger(body.size) && body.size > 0, 'size must be a positive integer');
      assert.ok(body.slot && body.slot.length <= 80, 'slot');
      const id = `asset-${rows.size + 1}`;
      const row = {
        id, kind: body.mimeType.startsWith('video/') ? 'video' : 'image',
        mimeType: body.mimeType, originalName: body.filename, size: body.size,
        url: `https://cdn.example.org/ws/proj/${id}`, status: 'uploading',
        width: null, height: null, duration: null
      };
      rows.set(id, row);
      return json(201, {
        asset: row,
        upload: { url: `https://r2.example.org/put/${id}?sig=x`, headers: { 'content-type': body.mimeType }, expiresIn: 900 },
        requestId: 'req-1'
      });
    }

    const done$ = /\/v1\/projects\/([^/]+)\/assets\/([^/]+)\/complete$/.exec(String(url));
    if (done$ && init.method === 'POST') {
      const row = rows.get(done$[2]);
      if (!row) return json(404, { error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' } });
      const body = JSON.parse(init.body);
      // The route converts `duration` SECONDS to milliseconds itself.
      if (body.duration != null) assert.ok(body.duration < 3600, 'duration must be seconds, not milliseconds');
      Object.assign(row, {
        status: 'ready', width: body.width ?? null, height: body.height ?? null,
        duration: body.duration ?? null, checksum: body.etag ?? null
      });
      return json(200, { asset: row, requestId: 'req-2' });
    }

    const del$ = /\/v1\/projects\/([^/]+)\/assets\/([^/]+)$/.exec(String(url));
    if (del$ && init.method === 'DELETE') {
      const row = rows.get(del$[2]);
      if (!row) return json(404, { error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' } });
      row.status = 'deleted';
      return json(200, { deleted: true, requestId: 'req-3' });
    }
    return json(404, { error: { code: 'NOT_FOUND', message: String(url) } });
  };
  return { fetchImpl, calls, rows };
}

const session = { authorize: async () => ({ token: 'test-session-token-not-a-secret' }) };
const client = (api, over = {}) => new ProjectCloudAssets({
  apiBase: 'https://api.example.org', projectId: 'proj-1', session, fetch: api.fetchImpl, ...over
});

await test('el cliente no puede construirse sin sesión', () => {
  assert.throws(() => new ProjectCloudAssets({ apiBase: 'https://a', projectId: 'p' }), /sesión autenticada/);
});

await test('sin token la subida falla en vez de ir anónima', async () => {
  const api = makeApi();
  const c = client(api, { session: { authorize: async () => null } });
  await assert.rejects(() => c.initUpload({ filename: 'a.png', mimeType: 'image/png', size: 10 }), /UNAUTHENTICATED|sesión/);
  assert.equal(api.calls.length, 0, 'no debe llegar a la red sin credenciales');
});

await test('un MIME no admitido se rechaza antes de subir nada', async () => {
  const api = makeApi();
  await assert.rejects(
    () => client(api).initUpload({ filename: 'x.tiff', mimeType: 'image/tiff', size: 10 }),
    (e) => e.code === 'MIME_NOT_ALLOWED'
  );
  assert.equal(api.calls.length, 0, 'no debe gastarse una petición en algo que el servidor rechazaría con 415');
});

await test('ciclo completo: init → PUT → complete, con los estados en orden', async () => {
  const api = makeApi();
  const seen = [];
  const file = { name: 'obra.png', type: 'image/png', size: 2048 };
  const asset = await client(api).upload(file, {
    slot: 'artwork.image',
    probe: async () => ({ width: 1600, height: 1200 }),
    onState: (s) => seen.push(s.state)
  });
  assert.deepEqual(seen, [
    ASSET_STATE.SELECTED, ASSET_STATE.UPLOADING, ASSET_STATE.PROCESSING, ASSET_STATE.READY
  ]);
  assert.equal(asset.status, 'ready');
  assert.equal(asset.width, 1600);
  // Bytes must go to the presigned URL, never through the API host.
  const put = api.calls.find((c) => c.method === 'PUT');
  assert.ok(put.url.startsWith('https://r2.example.org/'), 'los bytes deben ir al almacenamiento presignado');
});

await test('la duración de vídeo se envía en segundos, como espera la ruta', async () => {
  const api = makeApi();
  await client(api).upload({ name: 'v.mp4', type: 'video/mp4', size: 999 }, {
    probe: async () => ({ durationMs: 4200 })
  });
  const done = api.calls.find((c) => String(c.url).endsWith('/complete'));
  assert.equal(JSON.parse(done.body).duration, 4.2);
});

await test('un fallo de almacenamiento sale como ERROR y no como READY', async () => {
  const api = makeApi({ failStorage: true });
  const seen = [];
  await assert.rejects(() => client(api).upload({ name: 'a.png', type: 'image/png', size: 5 }, { onState: (s) => seen.push(s.state) }));
  assert.equal(seen.at(-1), ASSET_STATE.ERROR);
  assert.ok(!seen.includes(ASSET_STATE.READY));
});

await test('las referencias de sesión y persistentes no se confunden', () => {
  assert.equal(assetReference('abc'), 'asset:abc');
  assert.ok(isPersistentRef('asset:abc'));
  assert.ok(!isPersistentRef('authored:abc'));
  assert.ok(isSessionRef('authored:abc'));
  assert.equal(assetIdFromRef('asset:abc'), 'abc');
  assert.equal(assetIdFromRef('authored:abc'), null);
  assert.notEqual(REF.SESSION, REF.PERSISTENT);
});

await test('READY no es SAVED, y una referencia de sesión nunca es SAVED', () => {
  const persistent = { src: 'asset:abc' };
  const sessionMedia = { src: 'authored:xyz' };
  assert.equal(mediaState(persistent, { serverStatus: 'uploading' }), ASSET_STATE.UPLOADING);
  assert.equal(mediaState(persistent, { serverStatus: 'ready', savedInProject: false }), ASSET_STATE.READY);
  assert.equal(mediaState(persistent, { serverStatus: 'ready', savedInProject: true }), ASSET_STATE.SAVED);
  assert.equal(mediaState(persistent, { serverStatus: 'ready', savedInProject: true, usedBy: 2 }), ASSET_STATE.IN_USE);
  // The whole point: a session asset can be perfectly loaded and is still not saved.
  assert.equal(mediaState(sessionMedia, { savedInProject: true, usedBy: 3 }), ASSET_STATE.READY);
});

await test('el registro de config conserva la forma que ya usa normaliseMedia', () => {
  const media = mediaFromAsset({
    id: 'a1', kind: 'video', mimeType: 'video/mp4', originalName: 'c.mp4',
    size: 1234, url: 'https://cdn/x', width: 1920, height: 1080, duration: 12.5
  });
  assert.equal(media.src, 'asset:a1');
  assert.equal(media.assetId, 'a1');
  assert.equal(media.durationMs, 12500);
  assert.equal(media.publicUrl, 'https://cdn/x');
  for (const k of ['kind', 'src', 'assetId', 'name', 'mimeType', 'bytes', 'width', 'height', 'durationMs']) {
    assert.ok(k in media, `falta ${k}`);
  }
});

await test('el allowlist de MIME coincide con el de la ruta', () => {
  for (const m of ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'font/woff2']) {
    assert.ok(ACCEPTED_MIME.has(m), m);
  }
  assert.ok(!ACCEPTED_MIME.has('image/tiff'));
});

console.log(`\nCONTRACT TEST — ${passed}/${results.length} · NO es prueba de persistencia`);
process.exit(passed === results.length ? 0 : 1);
