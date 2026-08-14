/**
 * Reproduce what Juanma sees, not what my harness sees.
 *
 * Juanma's verdict — image works, text works on most panels, video does not, and
 * the Institution panel will not take a keystroke — contradicts a harness that
 * reported 15/15. When a human browser and an instrument disagree, the
 * instrument is wrong, and the first job is to find which of its conveniences
 * made the failure impossible to observe.
 *
 * Two differences between his browser and mine are candidates, and this tool
 * removes both by *testing both sides of each*:
 *
 *   1. **Frame vs top level.** He is reading a published artifact, which renders
 *      the page inside an iframe. Chrome refuses autoplay — muted included — in
 *      a frame that was not granted it, and refuses it silently: `play()`
 *      rejects, the first frame stays on screen, and a still photograph of a
 *      frozen video looks exactly like a still photograph of a playing one.
 *      My harness has always run the page at the top level.
 *
 *   2. **Autoplay policy.** Earlier runs passed `--autoplay-policy=
 *      no-user-gesture-required`, which is an instrument that cannot fail. No
 *      flag is passed here.
 *
 * So each case runs twice — TOP and FRAME — and the comparison is the finding.
 * A pass in both means the cause is elsewhere and I must keep looking; a pass in
 * TOP and a failure in FRAME names the mechanism exactly.
 *
 * Evidence is pixels over time on the surface a visitor looks at, plus the
 * element's own account of itself. Neither alone is enough: `currentTime` moving
 * proves decode, not upload; a changing canvas proves change, not *which*
 * change. Both together, with a static control region, is proof.
 *
 *   node qa/tools/juanma-repro.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const FIXTURES = path.join(MODULE_ROOT, 'qa', 'fixtures');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'repro');
const PORT = Number(process.env.IW_REPRO_PORT || 4731);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4'
};

await fs.mkdir(OUT, { recursive: true });

/**
 * A host page whose only job is to embed the studio the way a published
 * artifact embeds it. `allow` is left off deliberately — that is the condition
 * under test, not an oversight.
 */
const HOST_PAGE = `<!doctype html><meta charset="utf-8">
<title>marco</title>
<style>html,body{margin:0;height:100%;background:#100f0d}iframe{border:0;width:100vw;height:100vh;display:block}</style>
<iframe id="f" src="/labs/immersive-worlds/index.html?tier=HIGH&authoring=1"></iframe>`;

const server = http.createServer(async (req, res) => {
  try {
    const raw = decodeURIComponent((req.url || '/').split('?')[0]);
    if (raw === '/__host') {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      return res.end(HOST_PAGE);
    }
    let f = path.resolve(REPO_ROOT, raw.replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    const type = MIME[path.extname(f)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [, s, e] = /bytes=(\d*)-(\d*)/.exec(range);
      const start = s ? Number(s) : 0; const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1
      });
      return fsSync.createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
const say = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * @param {'TOP'|'FRAME'} mode
 * @returns {Promise<{page:import('playwright').Page, scope:import('playwright').Frame}>}
 */
async function open(browser, mode) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(300000);
  if (mode === 'TOP') {
    await page.goto(`${BASE}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
    return { page, scope: page.mainFrame() };
  }
  await page.goto(`${BASE}/__host`, { waitUntil: 'load' });
  const handle = await page.waitForSelector('#f');
  const frame = await handle.contentFrame();
  return { page, scope: frame };
}

const ready = (scope) => scope.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
const unveil = (scope) => scope.evaluate(() => { if (window.__IW?.hud?.el?.veil) window.__IW.hud.el.veil.hidden = true; });

const browser = await chromium.launch({
  headless: true,
  // No autoplay flag. Chrome's own policy is the thing being measured.
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});

/* ── 1. The Institution panel: can a person type in it? ──────────────────── */

for (const mode of ['TOP', 'FRAME']) {
  const { page, scope } = await open(browser, mode);
  await ready(scope);
  await unveil(scope);
  await scope.waitForTimeout(1200);

  const probe = await scope.evaluate(() => {
    const input = document.querySelector('[data-bind="institution.name"]');
    if (!input) return { found: false };
    const style = getComputedStyle(input);
    const box = input.getBoundingClientRect();
    // What is actually on top of the field where a person would click it?
    const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      found: true,
      disabled: input.disabled, readOnly: input.readOnly,
      pointerEvents: style.pointerEvents, userSelect: style.userSelect,
      visibility: style.visibility, opacity: style.opacity,
      box: { x: Math.round(box.left), y: Math.round(box.top), w: Math.round(box.width), h: Math.round(box.height) },
      inViewport: box.top >= 0 && box.bottom <= innerHeight && box.width > 0,
      topmostIsSelf: at === input,
      topmost: at ? `${at.tagName.toLowerCase()}${at.className ? `.${String(at.className).split(' ')[0]}` : ''}` : null
    };
  });

  if (!probe.found) { say(`${mode} · institución · campo presente`, false, 'no existe [data-bind=institution.name]'); await page.close(); continue; }
  say(`${mode} · institución · campo editable en el DOM`, !probe.disabled && !probe.readOnly && probe.pointerEvents !== 'none',
    `disabled=${probe.disabled} readOnly=${probe.readOnly} pointer-events=${probe.pointerEvents}`);
  say(`${mode} · institución · nada tapa el campo`, probe.topmostIsSelf, `encima: ${probe.topmost}`);

  // Type like a person: click the field, then press keys.
  const selector = '[data-bind="institution.name"]';
  const el = mode === 'TOP' ? page.locator(selector) : page.frameLocator('#f').locator(selector);
  await el.click();
  const focusedAfterClick = await scope.evaluate(() =>
    document.activeElement?.dataset?.bind || document.activeElement?.tagName || null);
  say(`${mode} · institución · el clic da el foco`, focusedAfterClick === 'institution.name', `activeElement=${focusedAfterClick}`);

  await el.press('Control+a');
  const typed = 'Museo Atlántico de Vigo';
  for (const ch of typed) {
    await el.type(ch, { delay: 25 });
  }
  await scope.waitForTimeout(200);

  const after = await scope.evaluate(() => {
    const input = document.querySelector('[data-bind="institution.name"]');
    const studio = window.__IW_STUDIO;
    return {
      value: input?.value ?? null,
      focusStillThere: document.activeElement === input,
      caret: input?.selectionStart ?? null,
      config: studio?.config?.institution?.name ?? null,
      dirty: studio?.dirty ?? null
    };
  });

  say(`${mode} · institución · el campo conserva lo escrito`, after.value === typed, `valor="${after.value}"`);
  say(`${mode} · institución · el foco sobrevive a la escritura`, after.focusStillThere === true, `foco=${after.focusStillThere} caret=${after.caret}`);
  say(`${mode} · institución · llega al proyecto`, after.config === typed, `config="${after.config}" dirty=${after.dirty}`);

  await page.screenshot({ path: path.join(OUT, `institucion-${mode.toLowerCase()}.png`) });
  await page.close();
}

/* ── 2. Video: does the authored file reach the wall, and move there? ─────── */

const PROJECTION = { entity: 'entity.video.cuaderno-de-luz', slot: 'PROJECTION_VIDEO', what: 'proyección' };
const ARTWORK = { entity: null, slot: 'ARTWORK_VIDEO', what: 'obra enmarcada' };

// Which artwork is a question for the world record, not for this file.
{
  const { page, scope } = await open(browser, 'TOP');
  await ready(scope);
  ARTWORK.entity = await scope.evaluate(() =>
    (window.__IW_STUDIO.world.entities || []).find((e) => e.kind === 'ARTWORK')?.id || null);
  console.log(`obra bajo prueba: ${ARTWORK.entity}`);
  await page.close();
}

/**
 * Author a file into the projection slot and measure the wall.
 * @returns {Promise<object>}
 */
async function videoCase(mode, fixture, expectPlayable = true, target = PROJECTION) {
  const label = `${mode} · ${target.what} · ${fixture}`;
  const { page, scope } = await open(browser, mode);
  await ready(scope);
  await unveil(scope);
  await scope.waitForTimeout(1200);

  const node = mode === 'TOP'
    ? page.locator(`[data-node="${target.entity}"]`)
    : page.frameLocator('#f').locator(`[data-node="${target.entity}"]`);
  await node.click();
  await scope.waitForTimeout(2400);

  const bytes = [...await fs.readFile(path.join(FIXTURES, fixture))];
  await scope.evaluate(async ({ b, name, slot }) => {
    const dt = new DataTransfer();
    // Windows frequently reports no MIME for these extensions; that is the
    // author's real condition, so it is the one used here.
    dt.items.add(new File([new Uint8Array(b)], name, { type: '' }));
    const input = document.querySelector(`[data-media="${slot}"]`);
    if (!input) throw new Error(`no existe la ranura ${slot}`);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { b: bytes, name: fixture, slot: target.slot }).catch((e) => {
    say(`${label} · la ranura existe`, false, String(e.message).slice(0, 120));
  });

  const slotState = await scope.waitForFunction(
    (slot) => {
      const t = document.querySelector(`[data-slot="${slot}"] .st-slotstate`)?.textContent || '';
      return /Listo|no se pudo|En la sala/.test(t) ? t.trim() : false;
    },
    target.slot,
    { timeout: 120000 }
  ).then((h) => h.jsonValue()).catch(() => 'TIEMPO AGOTADO');

  if (!expectPlayable) {
    say(`${label} · el decodificador lo rechaza con motivo`, /no se pudo/i.test(slotState), `estado="${slotState}"`);
    await page.screenshot({ path: path.join(OUT, `video-${mode.toLowerCase()}-${fixture.replace(/\W/g, '-')}.png`) });
    await page.close();
    return;
  }

  say(`${label} · aceptado por el almacén`, /Listo|En la sala/.test(slotState), `estado="${slotState}"`);
  if (!/Listo|En la sala/.test(slotState)) { await page.close(); return; }

  await scope.evaluate(() => { window.__IW.ready = false; });
  const apply = mode === 'TOP' ? page.locator('[data-act="apply"]') : page.frameLocator('#f').locator('[data-act="apply"]');
  await apply.click();
  await ready(scope);
  await unveil(scope);
  await scope.waitForTimeout(1800);

  // Stand in front of the projection, using the engine's own framing rather than
  // a hand-written pose — a hand-written pose once photographed the wrong wall.
  await scope.evaluate(async (entityId) => {
    const rt = window.__IW.runtime;
    const here = () => {
      let found = false;
      rt.sceneKit.scene.traverse((o) => { if (o.userData?.entityId === entityId) found = true; });
      return found;
    };
    // Walk until the piece is actually in the room being rendered. Which portal
    // leads where is the world's business, not this tool's.
    for (const id of ['portal.lobby-gallery-a', 'portal.gallery-a-gallery-b', 'portal.gallery-b-gallery-a']) {
      if (here()) break;
      try { await rt.traversePortal(id, { source: 'QA' }); } catch { /* not from here */ }
    }
    // The product's own way of putting a piece on screen, rather than a pose of
    // my own invention. `framingFor` returns {position, target}; `setPose` wants
    // {position, yaw, pitch}, so handing one to the other silently framed
    // nothing and photographed the default view — four screenshots of different
    // fixtures came out byte-identical, which is what that looks like.
    try { rt.focusEntity(entityId, {}, { source: 'QA' }); } catch { /* reported below */ }
  }, target.entity);
  await scope.waitForTimeout(2400);

  const measured = await scope.evaluate(async (entityId) => {
    const rt = window.__IW.runtime;
    // The video must be on *this* piece. Accepting any video in the scene is how
    // a projection elsewhere in the room gets mistaken for the artwork under
    // test. The kit keeps its own id → object index; scene objects carry no
    // entity id, so asking the graph for one finds nothing, always.
    let element = null;
    const root = rt.sceneKit._entityIndex?.get(entityId)?.object || null;
    root?.traverse?.((o) => {
      if (!element && o.material?.map?.image?.tagName === 'VIDEO') element = o.material.map.image;
    });
    if (!element) {
      // "Not found" is not a finding. What the scene does contain is.
      let videosAnywhere = 0;
      rt.sceneKit.scene.traverse((o) => {
        if (o.material?.map?.image?.tagName === 'VIDEO') videosAnywhere += 1;
      });
      return {
        onWall: false,
        activeSpace: rt.state.activeSpaceId,
        videosAnywhere,
        wanted: entityId,
        inIndex: Boolean(root),
        mediaLog: rt.sceneKit.mediaLoader?.report?.() || null,
        configMedia: window.__IW_CONFIG?.entities?.[entityId] || null
      };
    }

    const sample = () => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 36;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(element, 0, 0, 64, 36);
      const d = x.getImageData(0, 0, 64, 36).data;
      let sat = 0; let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        sat += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
        sum += d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7;
      }
      return { saturation: Math.round(sat / (d.length / 4)), fingerprint: sum };
    };

    const a = sample(); const tA = element.currentTime;
    await new Promise((r) => setTimeout(r, 1000));
    const b = sample(); const tB = element.currentTime;

    return {
      onWall: true,
      w: element.videoWidth, h: element.videoHeight,
      paused: element.paused, readyState: element.readyState,
      currentTime: [+tA.toFixed(3), +tB.toFixed(3)],
      advanced: tB > tA + 0.05,
      pictureChanged: a.fingerprint !== b.fingerprint,
      // The fixture is saturated primaries; the Museum's own projection is dim
      // blue-grey. Saturation is how "whose picture is this" gets answered.
      looksLikeAuthored: a.saturation > 40,
      playError: (() => {
        let e = null;
        rt.sceneKit.scene.traverse((o) => { if (!e && o.material?.map?.userData?.playError) e = o.material.map.userData.playError; });
        return e;
      })()
    };
  }, target.entity);

  say(`${label} · el archivo del autor está en la pared`, measured.onWall && measured.looksLikeAuthored,
    measured.onWall ? `${measured.w}×${measured.h}` : JSON.stringify(measured).slice(0, 400));
  say(`${label} · se está reproduciendo`, measured.advanced === true && measured.pictureChanged === true,
    `paused=${measured.paused} t=${JSON.stringify(measured.currentTime)} cambióImagen=${measured.pictureChanged} playError=${measured.playError}`);

  // The element advancing proves decode; it does not prove the picture reached
  // the canvas the visitor is looking at. So the last question is asked of the
  // rendered pixels: does the WebGL canvas change over a second, and is the
  // change where the piece is rather than somewhere else in the room?
  const onCanvas = await scope.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const read = () => {
      const c = document.createElement('canvas');
      c.width = 160; c.height = 100;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(canvas, 0, 0, 160, 100);
      return x.getImageData(0, 0, 160, 100).data;
    };
    const a = read();
    await new Promise((r) => setTimeout(r, 1000));
    const b = read();
    let changed = 0;
    for (let i = 0; i < a.length; i += 4) {
      const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      if (d > 12) changed += 1;
    }
    return { pct: +(100 * changed / (a.length / 4)).toFixed(2) };
  });
  say(`${label} · el lienzo cambia con el tiempo`, onCanvas.pct > 0.5, `${onCanvas.pct}% de los píxeles`);

  const shot = path.join(OUT, `video-${mode.toLowerCase()}-${target.what.replace(/\W/g, '')}-${fixture.replace(/\W/g, '-')}.png`);
  await page.screenshot({ path: shot });
  await scope.waitForTimeout(900);
  await page.screenshot({ path: shot.replace('.png', '-b.png') });
  await page.close();
  return measured;
}

for (const mode of ['TOP', 'FRAME']) {
  for (const fixture of ['qa-motion.webm', 'qa-motion.mp4']) {
    await videoCase(mode, fixture, true, PROJECTION);
    // The case that could not be attempted before: a moving image on a framed
    // work. Nine of the Museum's pieces are artworks and one is a projection, so
    // this is the panel an author actually opens.
    await videoCase(mode, fixture, true, ARTWORK);
  }
  await videoCase(mode, 'qa-broken.mp4', false, PROJECTION);
}

/* ── 3. What already worked must still work ──────────────────────────────── */

// Widening the model is the kind of change that quietly breaks the case it grew
// out of. Juanma reported images as working; this is the check that they are
// still working afterwards, and that choosing a video retires the still rather
// than leaving two files on one record.
{
  const { page, scope } = await open(browser, 'TOP');
  await ready(scope);
  await unveil(scope);
  await scope.waitForTimeout(1200);
  await page.locator(`[data-node="${ARTWORK.entity}"]`).click();
  await scope.waitForTimeout(2000);

  const put = async (slot, file) => {
    const bytes = [...await fs.readFile(path.join(FIXTURES, file))];
    await scope.evaluate(({ b, name, s }) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(b)], name, { type: '' }));
      const input = document.querySelector(`[data-media="${s}"]`);
      if (!input) throw new Error(`falta la ranura ${s}`);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, { b: bytes, name: file, s: slot });
    await scope.waitForFunction(
      (s) => /Listo|no se pudo|En la sala/.test(
        document.querySelector(`[data-slot="${s}"] .st-slotstate`)?.textContent || ''),
      slot, { timeout: 120000 }
    );
  };

  await put('ARTWORK_IMAGE', 'qa-artwork.jpg');
  const afterImage = await scope.evaluate((id) => {
    const e = window.__IW_STUDIO.config.entities[id] || {};
    return { image: e.image?.name || null, video: e.video?.name || null };
  }, ARTWORK.entity);
  say('obra · la imagen sigue aceptándose', afterImage.image === 'qa-artwork.jpg', JSON.stringify(afterImage));

  await put('ARTWORK_VIDEO', 'qa-motion.mp4');
  const afterVideo = await scope.evaluate((id) => {
    const e = window.__IW_STUDIO.config.entities[id] || {};
    const vault = window.__IW_VAULT;
    return {
      image: e.image?.name || null,
      video: e.video?.name || null,
      // A released asset is gone from the vault, not merely unreferenced.
      assets: vault ? vault.report().map((a) => `${a.kind}:${a.state}`) : null
    };
  }, ARTWORK.entity);
  say('obra · elegir vídeo retira la imagen', afterVideo.image === null && afterVideo.video === 'qa-motion.mp4',
    JSON.stringify(afterVideo));
  say('obra · el archivo retirado se libera', (afterVideo.assets || []).length === 1,
    `en el almacén: ${JSON.stringify(afterVideo.assets)}`);

  await page.screenshot({ path: path.join(OUT, 'obra-video-sustituye-imagen.png') });
  await page.close();
}

const summary = {
  generatedAt: new Date().toISOString(),
  passed: results.filter((r) => r.ok).length,
  total: results.length,
  results
};
await fs.writeFile(path.join(OUT, 'juanma-repro.json'), JSON.stringify(summary, null, 1));
console.log(`\n${summary.passed}/${summary.total}`);
await browser.close();
server.close();
