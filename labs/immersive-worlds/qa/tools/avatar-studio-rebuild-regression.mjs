/**
 * Regression gate — Studio preview must rebind Avatar/Character product layers
 * to the replacement Museum runtime instead of leaving a baseline-only Studio.
 *
 * Run from repo root:
 *   node labs/immersive-worlds/qa/tools/avatar-studio-rebuild-regression.mjs
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
const PORT = Number(process.env.IW_AVATAR_REBUILD_PORT || 4695);
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webm':'video/webm', '.glb':'model/gltf-binary' };

const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let file = path.resolve(REPO_ROOT, rel || 'index.html');
    if (!file.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type':MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

async function waitReady() {
  await page.waitForFunction(() => window.__IW?.ready === true
    && document.documentElement.dataset.avatarVisibilityContinuity === 'ready', null, { timeout:120000 });
}

async function applyAndWaitForReplacement() {
  await page.evaluate(() => {
    window.__AVATAR_REBUILD_PREVIOUS_STUDIO = window.__IW_STUDIO;
    window.__AVATAR_REBUILD_PREVIOUS_RUNTIME = window.__IW?.runtime;
  });
  await page.locator('[data-act="apply"]').click();
  await page.waitForFunction(() => window.__IW?.ready === true
    && window.__IW_STUDIO !== window.__AVATAR_REBUILD_PREVIOUS_STUDIO
    && window.__IW?.runtime !== window.__AVATAR_REBUILD_PREVIOUS_RUNTIME
    && document.documentElement.dataset.avatarVisibilityContinuity === 'ready', null, { timeout:120000 });
}

try {
  const base = `http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html`;
  await page.goto(base, { waitUntil:'load', timeout:300000 });
  await page.waitForFunction(() => window.__IW?.ready === true, null, { timeout:120000 });
  const presence = await page.evaluate(() => ({
    options: [...document.querySelectorAll('button[data-presence]')].map((button) => button.textContent.trim()),
    selected: document.querySelector('button[data-presence].is-selected')?.dataset?.presence || null,
    enter: document.querySelector('[data-el="enter"]')?.textContent?.trim() || null
  }));
  await page.locator('button[data-presence="avatar"]').click();
  await page.waitForURL((url) => url.searchParams.get('character') === '1' && url.searchParams.get('continuity') === '1', { timeout:120000 });
  await page.waitForFunction(() => window.__IW?.ready === true && window.__IW_CHARACTER_PHASE4B?.ready, null, { timeout:120000 });
  const selectedAvatarMode = await page.evaluate(() => ({
    selected: document.querySelector('button[data-presence].is-selected')?.dataset?.presence || null,
    enter: document.querySelector('[data-el="enter"]')?.textContent?.trim() || null,
    camera: window.__IW_CHARACTER_PHASE4B?.report?.().camera.owner || null
  }));

  await page.goto(`${base}?authoring=1`, { waitUntil:'load', timeout:300000 });
  await waitReady();
  await page.locator('[data-domain="avatar"]').click();
  await page.waitForFunction(() => window.__IW_AVATAR_VISIBILITY_FIX?.report?.().previewVisible === true, null, { timeout:120000 });
  await applyAndWaitForReplacement();

  const studio = await page.evaluate(() => ({
    avatarButton: document.querySelectorAll('button[data-domain="avatar"]').length,
    domain: window.__IW_STUDIO?.domain,
    profileAsset: window.__IW_AVATAR_VISIBILITY_FIX?.report?.().profileAsset,
    rigPass: window.__IW_AVATAR_STUDIO_PHASE5?.controller?.profile?.rigStatus?.pass,
    previewVisible: window.__IW_AVATAR_VISIBILITY_FIX?.report?.().previewVisible,
    sameMuseumScene: window.__IW_AVATAR_VISIBILITY_FIX?.report?.().sameMuseumScene,
    wetPaintHosts: document.querySelectorAll('[data-experience-id]').length
  }));

  await page.goto(`${base}?authoring=1&character=1&mobility=1&continuity=1&gatea=1`, { waitUntil:'load', timeout:300000 });
  await waitReady();
  await page.waitForFunction(() => window.__IW_CHARACTER_PHASE4B?.ready && window.__IW_CHARACTER_GATE_A?.ready, null, { timeout:120000 });
  const oldRoot = await page.evaluate(() => window.__IW_CHARACTER_PHASE4B.report().rootIdentity);
  await applyAndWaitForReplacement();
  await page.waitForFunction(() => window.__IW_CHARACTER_PHASE4B?.ready && window.__IW_CHARACTER_GATE_A?.ready, null, { timeout:120000 });

  const character = await page.evaluate(() => {
    const report = window.__IW_CHARACTER_PHASE4B.report();
    return {
      rootIdentity: report.rootIdentity,
      cameraOwner: report.camera.owner,
      cameraViolations: report.camera.violations,
      sameRootInSession: report.continuity.sameRoot,
      gateAReady: window.__IW_CHARACTER_GATE_A?.ready === true,
      avatarPreviewVisible: window.__IW_AVATAR_VISIBILITY_FIX?.report?.().previewVisible,
      wetPaintHosts: document.querySelectorAll('[data-experience-id]').length
    };
  });

  const checks = [
    ['Visitor can choose POV or Avatar before entering', presence.options.length === 2 && presence.selected === 'pov' && presence.enter === 'Entrar en POV'],
    ['Avatar choice activates the existing third-person runtime', selectedAvatarMode.selected === 'avatar' && selectedAvatarMode.enter === 'Entrar con mi avatar' && selectedAvatarMode.camera === 'THIRD_PERSON_EXPLORE'],
    ['Avatar area survives Vista previa', studio.avatarButton === 1 && studio.domain === 'avatar'],
    ['Avatar profile and rig survive Vista previa', studio.profileAsset === 'Character 2027 · aprobado' && studio.rigPass === true],
    ['Avatar preview is rebound to the replacement Museum Scene', studio.previewVisible === true && studio.sameMuseumScene === true],
    ['Wet Paint keeps one bridge after Vista previa', studio.wetPaintHosts === 1 && character.wetPaintHosts === 1],
    ['Character is recreated for the replacement runtime', character.rootIdentity && character.rootIdentity !== oldRoot],
    ['Third-person camera is authoritative without violations', character.cameraOwner === 'THIRD_PERSON_EXPLORE' && character.cameraViolations === 0],
    ['Character identity is stable inside the replacement session', character.sameRootInSession === true],
    ['Gate A and Avatar preview are rebound', character.gateAReady === true && character.avatarPreviewVisible === true],
    ['No page errors', pageErrors.length === 0]
  ];
  for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (checks.some(([, pass]) => !pass)) {
    console.error(`STUDIO ${JSON.stringify(studio)}`);
    console.error(`CHARACTER ${JSON.stringify(character)}`);
  }
  if (pageErrors.length) console.error(`PAGE_ERRORS\n${pageErrors.join('\n')}`);
  if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
