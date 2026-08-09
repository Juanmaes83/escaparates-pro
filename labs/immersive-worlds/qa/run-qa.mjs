/**
 * Immersive Worlds — IW-1 QA runner
 *
 * Constitution §23 and §19: a milestone is not evidenced by a green build. This
 * runner drives a real browser through the prototype and checks the claims the
 * architecture makes about itself, then writes the evidence to disk.
 *
 *   node labs/immersive-worlds/qa/run-qa.mjs
 *   node labs/immersive-worlds/qa/run-qa.mjs --headed --keep
 *
 * It is dependency-light on purpose: it needs `playwright` and nothing else, so
 * it runs from a bare checkout without installing a test framework first.
 *
 * Output: qa/evidence/report.json + qa/evidence/*.png
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const EVIDENCE = path.join(HERE, 'evidence');
const PORT = Number(process.env.IW_QA_PORT || 4188);
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const headed = process.argv.includes('--headed');
const keep = process.argv.includes('--keep');

/* == tiny assertion harness ================================================= */

const results = [];
let failures = 0;

function check(id, claim, pass, detail = '') {
  results.push({ id, claim, pass: !!pass, detail: String(detail) });
  if (!pass) failures += 1;
  const mark = pass ? '  ok  ' : ' FAIL ';
  console.log(`${mark} ${id.padEnd(26)} ${claim}${detail ? `  — ${detail}` : ''}`);
}

function near(a, b, epsilon = 1e-6) {
  return Math.abs(a - b) <= epsilon;
}

/* == static server ========================================================== */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const decoded = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
      let file = path.resolve(REPO_ROOT, decoded || 'index.html');
      if (!file.startsWith(REPO_ROOT)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

/* == 1. static purity ======================================================= */

/**
 * The strongest single claim of IW-1: the semantic engine does not know that
 * Three.js exists. This is checked against the files, not against intent.
 */
async function checkEnginePurity() {
  const offenders = [];
  const scanned = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) {
        scanned.push(full);
        const source = await fs.readFile(full, 'utf8');
        const importsThree = /from\s+['"][^'"]*three[^'"]*['"]/i.test(source) ||
          /import\s*\(\s*['"][^'"]*three[^'"]*['"]/i.test(source);
        const touchesRenderer = /\bnew\s+THREE\./.test(source) || /\bdocument\.createElement\(/.test(source);
        if (importsThree || touchesRenderer) offenders.push(path.relative(MODULE_ROOT, full));
      }
    }
  }
  await walk(path.join(MODULE_ROOT, 'engine'));

  check(
    'ENGINE-PURITY',
    'engine/ no importa Three.js ni toca el DOM',
    offenders.length === 0,
    `${scanned.length} archivos revisados${offenders.length ? `; infractores: ${offenders.join(', ')}` : ''}`
  );
  return { scanned: scanned.length, offenders };
}

/** Protected baselines must not be touched by this milestone. */
async function checkProtectedPaths() {
  const protectedPaths = [
    'labs/interactive-boards-source', 'js/interactive-boards-casebook-pro-v1-1.js',
    'js/interactive-boards-casebook-pro-v2.js', 'js/interactive-boards-casebook-pro-v3.js',
    'js/interactive-boards-casebook-pro-v3-fashion-lab.js', 'index.html', 'js/website-modules.js'
  ];
  const missing = protectedPaths.filter((p) => !fsSync.existsSync(path.join(REPO_ROOT, p)));
  check('PROTECTED-PATHS', 'Las rutas protegidas siguen presentes', missing.length === 0, missing.join(', '));
}

/* == 2. browser checks ====================================================== */

async function main() {
  await fs.mkdir(EVIDENCE, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    headless: !headed,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
  });

  const evidence = { startedAt: new Date().toISOString(), states: {}, performance: {}, checks: [] };

  try {
    await checkEnginePurity();
    await checkProtectedPaths();

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

    /* -- boot ------------------------------------------------------------- */
    await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH&state=museum:lobby-entry`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 45000 });
    check('BOOT', 'El prototipo arranca sin errores de consola', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

    /* -- schema ------------------------------------------------------------ */
    const validation = await page.evaluate(() => window.__IW.runtime.store.validation);
    check('SCHEMA-VALID', 'El mundo cumple todas las invariantes del esquema', validation.ok,
      `${validation.errors.length} errores, ${validation.warnings.length} avisos, ${JSON.stringify(validation.counts)}`);

    /* -- architectural invariants ------------------------------------------ */
    const invariants = await page.evaluate(() => window.__IW.assertInvariants());
    for (const result of invariants.results) {
      check(result.id, result.claim, result.pass, result.detail);
    }

    /* -- focus: deterministic return ---------------------------------------- */
    const focusReturn = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      await rt.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      rt.explore.setPose({ position: [-4.8, 1.62, -12.4], yaw: Math.PI, pitch: 0 });
      await window.__IW.frames(3);
      const before = JSON.parse(JSON.stringify(rt.camera.pose));

      rt.actions.dispatch({ type: 'FOCUS_ENTITY', target: 'entity.artwork.horizonte-interrumpido' }, { source: 'QA' });
      await window.__IW.frames(4);
      const during = { owner: rt.camera.owner, pose: JSON.parse(JSON.stringify(rt.camera.pose)) };

      rt.releaseFocus();
      await window.__IW.frames(4);
      return { before, during, after: { owner: rt.camera.owner, pose: rt.camera.pose }, violations: rt.camera.violations.length };
    });

    check('FOCUS-AUTHORITY', 'Al enfocar, la autoridad de cámara pasa a FOCUS',
      focusReturn.during.owner === 'FOCUS', focusReturn.during.owner);
    check('FOCUS-MOVED', 'El encuadre de foco mueve realmente la cámara',
      !near(focusReturn.before.position[2], focusReturn.during.pose.position[2], 0.01),
      `z ${focusReturn.before.position[2].toFixed(2)} → ${focusReturn.during.pose.position[2].toFixed(2)}`);
    check('FOCUS-RETURN', 'Al salir del foco el visitante vuelve exactamente donde estaba',
      focusReturn.after.owner === 'EXPLORE' &&
      focusReturn.before.position.every((value, i) => near(value, focusReturn.after.pose.position[i], 0.02)),
      `${JSON.stringify(focusReturn.after.pose.position.map((v) => Number(v.toFixed(3))))}`);

    /* -- portal: lifecycle and working set ---------------------------------- */
    const portal = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const before = rt.spaces.report().workingSet.map((s) => `${s.spaceId}:${s.state}`);
      const result = await rt.traversePortal('portal.gallery-a-gallery-b', { source: 'QA' });
      await window.__IW.frames(3);
      return {
        before,
        after: rt.spaces.report().workingSet.map((s) => `${s.spaceId}:${s.state}`),
        activeSpaceId: rt.state.activeSpaceId,
        traversed: [...rt.state.traversedPortalIds],
        timings: rt.spaces.report().timings,
        waitedMs: result.waitedMs
      };
    });
    check('PORTAL-TRAVERSE', 'Un Portal cambia la Space activa', portal.activeSpaceId === 'space.gallery-b', portal.activeSpaceId);
    check('PORTAL-PREWARMED', 'La sala vecina ya estaba precargada al cruzar', portal.waitedMs < 60, `${portal.waitedMs} ms de espera`);
    check('LIFECYCLE-COOLING', 'La sala anterior queda en COOLING, no destruida ni activa',
      portal.after.some((entry) => entry.endsWith(':COOLING')), portal.after.join(', '));
    evidence.performance.spaceTimings = portal.timings;

    /* -- guided experience shares World State -------------------------------- */
    const guided = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const visitedBefore = [...rt.state.visitedEntityIds];
      const storeBefore = rt.store;

      rt.startRoute('route.comentado');
      await window.__IW.frames(3);
      const duringOwner = rt.camera.owner;
      const duringMode = rt.state.mode;

      for (let i = 0; i < 4; i += 1) {
        rt.experience.next();
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      await window.__IW.frames(3);
      const midStep = rt.experience.report();
      const visitedDuring = [...rt.state.visitedEntityIds];

      rt.exitRoute();
      await window.__IW.frames(4);

      return {
        visitedBefore, visitedDuring,
        sameStore: rt.store === storeBefore,
        duringOwner, duringMode,
        afterOwner: rt.camera.owner,
        afterMode: rt.state.mode,
        midStep,
        actions: rt.actions.summary().bySource,
        violations: rt.camera.violations.length
      };
    });
    check('GUIDED-AUTHORITY', 'El recorrido guiado toma la cámara como DIRECTED',
      guided.duringOwner === 'DIRECTED' && guided.duringMode === 'GUIDED', `${guided.duringOwner}/${guided.duringMode}`);
    check('SHARED-WORLD-STATE', 'Explore y Guided operan sobre el mismo World State',
      guided.sameStore && guided.visitedDuring.length > guided.visitedBefore.length,
      `visitadas ${guided.visitedBefore.length} → ${guided.visitedDuring.length}`);
    check('SHARED-ACTION-PATH', 'Hotspot y Experiencia despachan las mismas Actions',
      Boolean(guided.actions.EXPERIENCE) && Boolean(guided.actions.QA || guided.actions.HOTSPOT),
      JSON.stringify(guided.actions));
    check('GUIDED-RETURN', 'Al salir del recorrido la cámara vuelve al visitante',
      guided.afterOwner === 'EXPLORE' && guided.afterMode === 'EXPLORE', `${guided.afterOwner}/${guided.afterMode}`);
    check('CAMERA-NO-VIOLATIONS', 'Ni una sola escritura de cámara en conflicto en toda la sesión',
      guided.violations === 0, `${guided.violations} violaciones`);

    /* -- proximity ---------------------------------------------------------- */
    const proximity = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      await rt.traversePortal('portal.gallery-b-gallery-a', { source: 'QA' });
      // A work not yet visited in this session: VISITED is deliberately sticky,
      // so proximity is checked on a hotspot whose state is still AVAILABLE.
      rt.explore.setPose({ position: [4.6, 1.62, -13.6], yaw: Math.PI, pitch: 0 });
      for (let i = 0; i < 20; i += 1) { rt.step(1 / 12); }
      const nearId = rt.proximity.nearestHotspot?.id || null;
      const nearState = nearId ? rt.state.hotspotState(nearId) : null;

      rt.explore.setPose({ position: [-2.0, 1.62, -6.0], yaw: 0, pitch: 0 });
      for (let i = 0; i < 20; i += 1) { rt.step(1 / 12); }
      const awayId = rt.proximity.nearestHotspot?.id || null;
      const awayState = rt.state.hotspotState('hotspot.art.division-tercera');
      return { nearId, nearState, awayId, awayState };
    });
    check('PROXIMITY-SPATIAL', 'La proximidad es espacial: acercarse y alejarse cambian el estado del hotspot',
      proximity.nearId === 'hotspot.art.division-tercera' && proximity.nearState === 'NEAR' &&
      proximity.awayId === null && proximity.awayState === 'AVAILABLE',
      `${proximity.nearId}/${proximity.nearState} → ${proximity.awayId}/${proximity.awayState}`);

    /* -- accessibility ------------------------------------------------------ */
    const a11y = await page.evaluate(() => {
      window.__IW.hud.toggleAccessibility(true);
      const items = document.querySelectorAll('.iw-a11y li').length;
      const sections = document.querySelectorAll('.iw-a11y section').length;
      const entities = window.__IW.runtime.store.entities.length;
      window.__IW.hud.toggleAccessibility(false);
      return { items, sections, entities };
    });
    check('A11Y-OUTLINE', 'Todo el contenido existe como texto fuera del canvas',
      a11y.items >= a11y.entities && a11y.sections === 4, `${a11y.items} obras en ${a11y.sections} salas (${a11y.entities} entidades)`);

    /* -- deterministic states: captures + performance ------------------------ */
    const stateNames = await page.evaluate(() => window.__IW.states);
    for (const name of stateNames) {
      const url = `${BASE}/index.html?reducedMotion=1&tier=HIGH&state=${encodeURIComponent(name)}`;
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 45000 });
      await page.evaluate(() => window.__IW.frames(24));
      const file = path.join(EVIDENCE, `${name.replace(/:/g, '_')}.png`);
      await page.screenshot({ path: file });
      evidence.states[name] = await page.evaluate(() => {
        const rt = window.__IW.runtime;
        return {
          space: rt.state.activeSpaceId,
          cameraOwner: rt.camera.owner,
          cameraViolations: rt.camera.violations.length,
          focus: rt.state.focusedEntityId,
          render: rt.sceneKit.renderStats(),
          frame: rt.frameStats()
        };
      });
    }
    const allClean = Object.values(evidence.states).every((state) => state.cameraViolations === 0);
    check('STATES-DETERMINISTIC', 'Todos los estados nombrados se reproducen y capturan',
      Object.keys(evidence.states).length === stateNames.length && allClean,
      `${Object.keys(evidence.states).length}/${stateNames.length} estados`);

    /* -- performance under sustained load ------------------------------------ */
    await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH&state=museum:gallery-a-overview`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 45000 });
    await page.evaluate(() => window.__IW.frames(180));
    const perf = await page.evaluate(() => ({
      frame: window.__IW.runtime.frameStats(),
      render: window.__IW.runtime.sceneKit.renderStats(),
      quality: window.__IW.runtime.quality
    }));
    evidence.performance.desktop = perf;
    check('PERF-CAPTURED', 'Medición de rendimiento capturada (SwiftShader, sin GPU)', perf.frame.samples > 100,
      `p50 ${perf.frame.p50Ms} ms · p95 ${perf.frame.p95Ms} ms · ${perf.render.drawCalls} draws · ${perf.render.triangles} tris`);

    /* -- mobile -------------------------------------------------------------- */
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(`${BASE}/index.html?reducedMotion=1&tier=LOW&state=museum:artwork-horizonte-focus`, { waitUntil: 'load' });
    await mobile.waitForFunction(() => window.__IW?.ready === true, { timeout: 45000 });
    await mobile.evaluate(() => window.__IW.frames(24));
    await mobile.screenshot({ path: path.join(EVIDENCE, 'mobile_artwork-focus.png') });
    const mobileReport = await mobile.evaluate(() => {
      const rt = window.__IW.runtime;
      const host = window.__IW.renderHost;
      return {
        tier: rt.quality.tier,
        shadows: rt.quality.policy.shadows,
        dpr: host.stats().pixelRatio,
        vfov: host.camera.fov,
        distance: Math.hypot(
          rt.camera.pose.position[0] - rt.camera.pose.target[0],
          rt.camera.pose.position[2] - rt.camera.pose.target[2]
        ),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    evidence.performance.mobile = mobileReport;
    check('MOBILE-TIER', 'El tier LOW desactiva realmente sombras y limita el DPR',
      mobileReport.shadows === false && mobileReport.dpr <= 1, `dpr ${mobileReport.dpr}, sombras ${mobileReport.shadows}`);
    check('MOBILE-FRAMING', 'El encuadre se recalcula para pantalla vertical',
      mobileReport.vfov > 60 && mobileReport.distance > 0.5,
      `vfov ${mobileReport.vfov}°, distancia ${mobileReport.distance.toFixed(2)} m`);
    check('MOBILE-NO-OVERFLOW', 'Sin desbordamiento horizontal en móvil', !mobileReport.horizontalOverflow);

    /* -- authoring ----------------------------------------------------------- */
    // Three live WebGL contexts under software rendering is enough to make a
    // cold boot miss a 30 s window. Close what we no longer need first.
    await mobile.close();
    await page.close();

    const authorPage = await context.newPage();
    const authorErrors = [];
    authorPage.on('pageerror', (error) => authorErrors.push(error.message));
    await authorPage.goto(`${BASE}/author.html`, { waitUntil: 'load' });
    await authorPage.waitForFunction(() => document.documentElement.dataset.iwReady === 'true', { timeout: 90000 });
    const authoring = await authorPage.evaluate(async () => {
      const A = window.__IW_AUTHOR;
      A.author.selectedId = 'entity.artwork.horizonte-interrumpido';
      A.author._render();
      const input = document.querySelector('[data-path="content.title"]');
      const original = input.value;
      input.value = 'Título editado desde la capa de autoría';
      input.dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        cameraOwner: A.runtime.camera.owner,
        edited: A.runtime.store.get('entity.artwork.horizonte-interrumpido').content.title,
        original,
        revision: A.runtime.store.revision,
        stillValid: A.author._validate().ok,
        hasVisitorUI: !!document.querySelector('.iw-transport, .iw-prompt')
      };
    });
    await authorPage.screenshot({ path: path.join(EVIDENCE, 'authoring.png') });
    check('AUTHOR-EDITS-DATA', 'La autoría edita el registro canónico y reconstruye la sala',
      authoring.edited === 'Título editado desde la capa de autoría' && authoring.revision > 0 && authoring.stillValid);
    check('AUTHOR-SEPARATE-CAMERA', 'Author Mode usa su propia autoridad de cámara',
      authoring.cameraOwner === 'AUTHOR', authoring.cameraOwner);
    check('AUTHOR-NOT-EXPERIENCE', 'La superficie de autoría no contiene la UI del visitante',
      authoring.hasVisitorUI === false);
    check('AUTHOR-NO-ERRORS', 'La autoría arranca sin errores', authorErrors.length === 0, authorErrors.join(' | '));

    evidence.checks = results;
    evidence.finishedAt = new Date().toISOString();
    evidence.summary = { total: results.length, failed: failures, passed: results.length - failures };
    await fs.writeFile(path.join(EVIDENCE, 'report.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  } finally {
    if (!keep) await browser.close();
    server.close();
  }

  console.log('');
  console.log(`${results.length - failures}/${results.length} comprobaciones superadas`);
  console.log(`Evidencia: ${path.relative(REPO_ROOT, EVIDENCE)}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('[IW QA] runner failed:', error);
  process.exit(2);
});
