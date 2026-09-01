/**
 * Regression gate — Studio Schema 3 must survive save/reload without leaking
 * render implementation keys into the semantic World.
 *
 * Reproduces the real failure:
 *   persisted ConfigStore presentation.material -> reload -> authoredWorld -> INV-6
 *
 * Run from repo root:
 *   node labs/immersive-worlds/qa/tools/studio-schema3-boot-regression.mjs
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
const PORT = Number(process.env.IW_SCHEMA3_BOOT_PORT || 4694);
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webm':'video/webm', '.glb':'model/gltf-binary' };
const STORAGE_KEY = 'iw.museum.authoring.v1';
const ENTITY_ID = 'entity.artwork.horizonte-interrumpido';
const PRESENTATION = Object.freeze({
  frame:'oak-frame', mount:'paper', material:'oak', finish:'satin',
  glass:'museum-glass', passepartout:'warm-white', plinth:'none', mountingHeightCm:154
});
const ARTIFACT_DIR = path.join(REPO_ROOT, 'output', 'playwright');
const ARTIFACT_SCREENSHOT = path.join(ARTIFACT_DIR, 'studio-schema3-boot-regression.png');

const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    if (rel === '__schema3_storage_reset__.html') {
      res.writeHead(200, { 'Content-Type':'text/html', 'Cache-Control':'no-store' });
      return res.end('<!doctype html><title>Schema 3 storage reset</title>');
    }
    let file = path.resolve(REPO_ROOT, rel || 'index.html');
    if (!file.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'] });
const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
const page = await context.newPage();
const errors = [];
const failedRequests = [];
let finishShellInstall;
let shellInstalled;
const armShellInstall = () => {
  shellInstalled = new Promise((resolve) => { finishShellInstall = resolve; });
};
armShellInstall();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  const text = message.text();
  if (text.startsWith('[Wet Paint]')) finishShellInstall(text);
  if (message.type() === 'error' || /failed validation|INV-6/.test(text)) errors.push(text);
});
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

async function waitForMuseumReady(stage) {
  try {
    // waitForFunction(pageFunction, arg, options): the previous two-argument call
    // accidentally passed the timeout object as `arg`, leaving Playwright's 30 s
    // default in force.
    await page.waitForFunction(() => window.__IW?.ready === true, null, { timeout:120000 });
  } catch (error) {
    const state = await page.evaluate(() => ({
      ready: window.__IW?.ready ?? null,
      iwError: document.documentElement.dataset.iwError || null,
      readyDataset: document.documentElement.dataset.iwReady || null,
      studio: document.body.dataset.studio || null,
      text: document.getElementById('iw-ui')?.innerText?.slice(0, 1200) || ''
    })).catch(() => ({ ready:null, iwError:'Unable to inspect page after timeout' }));
    await fs.mkdir(ARTIFACT_DIR, { recursive:true });
    await page.screenshot({ path:ARTIFACT_SCREENSHOT, fullPage:true }).catch(() => {});
    throw new Error(`${stage} did not reach Museum ready: ${error.message}\nSTATE ${JSON.stringify(state)}\nPAGE_ERRORS ${JSON.stringify(errors)}\nFAILED_REQUESTS ${JSON.stringify(failedRequests)}`);
  }
}

async function waitForShellInstall() {
  let timeoutId;
  try {
    await Promise.race([
      shellInstalled,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Studio shell installers did not finish')), 60000);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

try {
  const url = `http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?authoring=1&portalVariant=D`;
  // Establish the same origin and start from a known browser-local project state.
  // The saved project is created below through the real Studio controls.
  await page.goto(`http://127.0.0.1:${PORT}/__schema3_storage_reset__.html`, { waitUntil:'domcontentloaded' });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.goto(url, { waitUntil:'load', timeout:300000 });
  await waitForMuseumReady('Initial Studio boot');
  await page.waitForFunction(() =>
    document.documentElement.dataset.museumPhase2 === 'ready'
      && document.documentElement.dataset.museumPhase2Hardening === 'ready'
      && document.documentElement.dataset.avatarVisibilityContinuity === 'ready',
  null, { timeout:60000 });
  await waitForShellInstall();

  // Studio -> edit entity presentation -> save -> ConfigStore.
  // Selecting through the Studio object only expands the correct editor; every
  // authored value and the save itself go through the rendered UI controls.
  await page.evaluate((id) => {
    window.__IW_STUDIO.selectedId = id;
    window.__IW_STUDIO.render();
  }, ENTITY_ID);
  for (const [field, value] of Object.entries(PRESENTATION)) {
    const input = page.locator(`[data-p2-path="entities.${ENTITY_ID}.presentation.${field}"]`);
    if (await input.count() !== 1) throw new Error(`Studio presentation control missing: ${field}`);
    await input.fill(String(value));
  }
  const draftAfterInput = await page.evaluate((entityId) => ({
    config: structuredClone(window.__IW_STUDIO.config.entities?.[entityId]?.presentation || null),
    controls: Object.fromEntries([...document.querySelectorAll(`[data-p2-path^="entities.${entityId}.presentation."]`)]
      .map((input) => [input.dataset.p2Path.split('.').at(-1), input.value]))
  }), ENTITY_ID);
  await page.locator('[data-act="save"]').first().click();

  const savedBeforeReload = await page.evaluate(({ key, entityId }) => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return saved.entities?.[entityId]?.presentation || null;
  }, { key:STORAGE_KEY, entityId:ENTITY_ID });

  // Browser reload -> ConfigStore.load -> applyConfigToWorld -> Runtime -> validateWorld.
  armShellInstall();
  await page.reload({ waitUntil:'load', timeout:300000 });
  await waitForMuseumReady('Persisted Schema 3 reload');

  const result = await page.evaluate(() => {
    const entityId = 'entity.artwork.horizonte-interrumpido';
    const saved = JSON.parse(localStorage.getItem('iw.museum.authoring.v1') || '{}');
    const entity = window.__IW?.runtime?.store?.get?.(entityId)
      || window.__IW?.runtime?.store?.entities?.find?.((e) => e.id === entityId);
    const forbidden = [];
    const keys = new Set(['mesh','geometry','material','materials','shader','texture','object3d','object3D','scene','renderer','threeObject','uniforms']);
    const scan = (value, path = 'entity', depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 8) return;
      for (const [key, child] of Object.entries(value)) {
        if (keys.has(key)) forbidden.push(`${path}.${key}`);
        scan(child, `${path}.${key}`, depth + 1);
      }
    };
    scan(entity);
    return {
      ready: window.__IW?.ready === true,
      savedPresentation: saved.entities?.[entityId]?.presentation || null,
      runtimeForbidden: forbidden,
      runtimeMount: entity?.representation?.hints?.mount || null,
      runtimeTitle: entity?.content?.title || null,
      validationOk: window.__IW?.runtime?.store?.validation?.ok === true,
      validationErrors: window.__IW?.runtime?.store?.validation?.errors || []
    };
  });

  // Re-open the same entity after reload and verify the values the author sees,
  // not only the serialised localStorage record.
  await page.waitForFunction(() =>
    document.documentElement.dataset.museumPhase2 === 'ready'
      && document.documentElement.dataset.museumPhase2Hardening === 'ready'
      && document.documentElement.dataset.avatarVisibilityContinuity === 'ready',
  null, { timeout:60000 });
  await waitForShellInstall();
  await page.evaluate((id) => {
    window.__IW_STUDIO.selectedId = id;
    window.__IW_STUDIO.render();
  }, ENTITY_ID);
  const reopenedPresentation = await page.evaluate((entityId) =>
    Object.fromEntries([...document.querySelectorAll(`[data-p2-path^="entities.${entityId}.presentation."]`)]
      .map((input) => [input.dataset.p2Path.split('.').at(-1), input.type === 'number' ? Number(input.value) : input.value])),
  ENTITY_ID);

  const presentationPreserved = Object.entries(PRESENTATION).every(([key, value]) =>
    savedBeforeReload?.[key] === value
      && result.savedPresentation?.[key] === value
      && reopenedPresentation?.[key] === value
  );
  const inv6Errors = result.validationErrors.filter((message) => message.includes('INV-6'));
  const checks = [
    ['Museum boots after persisted Schema 3 config', result.ready],
    ['Studio UI saved the complete presentation through ConfigStore', presentationPreserved],
    ['Studio persisted material is preserved after reload', result.savedPresentation?.material === 'oak'],
    ['Runtime World validation passes', result.validationOk],
    ['INV-6 reports zero errors', inv6Errors.length === 0],
    ['No forbidden render key reaches runtime World', result.runtimeForbidden.length === 0],
    ['Supported mount intent reaches representation hints', result.runtimeMount === 'paper'],
    ['Canonical entity is present', Boolean(result.runtimeTitle)],
    ['No validation/page errors', errors.length === 0]
  ];
  for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!presentationPreserved) {
    console.error(`PRESENTATION_AFTER_INPUT ${JSON.stringify(draftAfterInput)}`);
    console.error(`PRESENTATION_BEFORE_RELOAD ${JSON.stringify(savedBeforeReload)}`);
    console.error(`PRESENTATION_AFTER_RELOAD ${JSON.stringify(result.savedPresentation)}`);
    console.error(`PRESENTATION_REOPENED_UI ${JSON.stringify(reopenedPresentation)}`);
  }
  if (errors.length) console.error(errors.join('\n'));
  if (failedRequests.length) console.error(`FAILED_REQUESTS\n${failedRequests.join('\n')}`);
  await fs.mkdir(ARTIFACT_DIR, { recursive:true });
  await page.locator('.st-gh', { hasText:'Presentación física' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path:ARTIFACT_SCREENSHOT, fullPage:true });
  console.log(`EVIDENCE ${path.relative(REPO_ROOT, ARTIFACT_SCREENSHOT)}`);
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
