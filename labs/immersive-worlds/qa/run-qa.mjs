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

/** Spanish claims for the manifest-level invariants, kept beside the runner's other copy. */
const TOUR_CLAIMS = {
  'TOUR-ONE-START': 'El recorrido tiene exactamente un inicio canónico',
  'TOUR-ONE-END': 'El recorrido tiene exactamente un final canónico',
  'TOUR-ORDER-UNIQUE': 'Ningún número de parada está duplicado',
  'TOUR-ORDER-CONTIGUOUS': 'La numeración va de 01 a N sin huecos',
  'TOUR-IDS-UNIQUE': 'Cada parada tiene una identidad técnica única',
  'TOUR-NO-ORPHANS': 'Todo beat pertenece exactamente a una parada canónica',
  'TOUR-NEXT-PREV-CONSISTENT': 'Siguiente y anterior son mutuamente consistentes',
  'TOUR-NO-UNEXPECTED-CYCLES': 'El recorrido no se cierra sobre sí mismo',
  'TOUR-ALL-REACHABLE': 'Todas las paradas se alcanzan siguiendo «siguiente» desde el inicio'
};

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
    // Real media decoding under SwiftShader is slow; give every step room.
    context.setDefaultTimeout(90000);
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

      // Advance until the route has actually marked something, rather than a
      // fixed number of steps. The claim under test is that a guided step
      // writes the same World State an Explore focus does — not that it happens
      // on the fourth step. Authoring a new beat into the route moved that, and
      // a step-counting check failed on a route that was working correctly.
      for (let i = 0; i < 8; i += 1) {
        if (rt.state.visitedEntityIds.size > visitedBefore.length) break;
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

    /* -- leaving a route leaves the visitor inside the room they are in ------ */
    // The route walks the visitor from the lobby into a gallery. Exiting used to
    // restore the pose it captured at the start, which is a lobby coordinate,
    // and dropped the camera inside a Gallery A wall looking at black. Nothing
    // in the suite noticed, because every existing camera assertion was about
    // authority rather than about the pose being a place you can stand.
    const handoff = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      rt.startRoute('route.comentado');
      for (let i = 0; i < 24; i += 1) {
        if (rt.experience.currentStep?.id === 'step.04b-horizonte-cesion') break;
        rt.experience.next();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      rt.exitRoute();
      await window.__IW.frames(6);
      const space = rt.store.require(rt.state.activeSpaceId);
      const volume = rt.sceneKit.navigationVolume(rt.state.activeSpaceId);
      const p = window.__IW.renderHost.camera.position;
      return {
        activeSpaceId: rt.state.activeSpaceId,
        spaceTitle: space.title,
        position: [p.x, p.y, p.z],
        bounds: volume.bounds,
        owner: rt.camera.owner
      };
    });
    const inside = handoff.bounds
      && handoff.position[0] > handoff.bounds.min[0] && handoff.position[0] < handoff.bounds.max[0]
      && handoff.position[2] > handoff.bounds.min[2] && handoff.position[2] < handoff.bounds.max[2];
    check('HANDOFF-VALID-POSE', 'Tras la cesión el visitante queda dentro de la sala activa, no dentro de un muro',
      inside && handoff.owner === 'EXPLORE',
      `${handoff.spaceTitle} · [${handoff.position.map((n) => n.toFixed(2)).join(', ')}] · ${handoff.owner}`);

    /* -- proximity ---------------------------------------------------------- */
    const proximity = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      await rt.traversePortal('portal.gallery-b-gallery-a', { source: 'QA' });
      // VISITED is deliberately sticky, so proximity has to be checked on a
      // hotspot this session has not already visited. Which works the guided
      // route touches is an authoring decision that changes; naming one here
      // made this check fail the moment the route was extended to reach it. So
      // it finds an unvisited one and walks to whatever that turns out to be.
      const candidate = rt.store.hotspotsOf('space.gallery-a')
        .find((h) => h.entityId && rt.state.hotspotState(h.id) !== 'VISITED');
      if (!candidate) return { skipped: 'every gallery-A hotspot already visited' };
      const anchor = rt.sceneKit.poseForAnchor(rt.store.require(candidate.entityId).anchorId);
      rt.explore.setPose({
        position: [anchor.position[0] + anchor.normal[0] * 1.1, 1.62, anchor.position[2] + anchor.normal[2] * 1.1],
        yaw: Math.atan2(-anchor.normal[0], -anchor.normal[2]),
        pitch: 0
      });
      for (let i = 0; i < 20; i += 1) { rt.step(1 / 12); }
      const nearId = rt.proximity.nearestHotspot?.id || null;
      const nearState = nearId ? rt.state.hotspotState(nearId) : null;

      rt.explore.setPose({ position: [-2.0, 1.62, -6.0], yaw: 0, pitch: 0 });
      for (let i = 0; i < 20; i += 1) { rt.step(1 / 12); }
      const awayId = rt.proximity.nearestHotspot?.id || null;
      const awayState = rt.state.hotspotState(candidate.id);
      return { candidate: candidate.id, nearId, nearState, awayId, awayState };
    });
    // Asserts the behaviour, not which work happens to be unvisited: standing in
    // front of one makes it NEAR, walking away makes it the nearest to nothing
    // and returns it to AVAILABLE.
    check('PROXIMITY-SPATIAL', 'La proximidad es espacial: acercarse y alejarse cambian el estado del hotspot',
      !proximity.skipped && proximity.nearId === proximity.candidate && proximity.nearState === 'NEAR' &&
      proximity.awayId === null && proximity.awayState === 'AVAILABLE',
      proximity.skipped || `${proximity.nearId}/${proximity.nearState} → ${proximity.awayId}/${proximity.awayState}`);

    /* -- media: real files, and a failure that does not break the world ------ */
    const media = await page.evaluate(async () => {
      const report = window.__IW.mediaLoader.report();
      // A deliberately missing file must degrade to the generated plate.
      const missing = await window.__IW.mediaLoader.load(
        { kind: 'IMAGE', src: './__does-not-exist__.jpg', rights: 'QA fixture' },
        { entityId: 'qa.missing' }
      );
      return { report, fallback: missing.fallback, kind: missing.kind };
    });
    check('MEDIA-LOADED', 'Las obras se cargan desde archivos propios declarados en el mundo',
      media.report.loaded >= 6 && media.report.failed === 0,
      `${media.report.loaded} archivos, ${media.report.failed} fallos, más lento ${media.report.slowestMs} ms`);
    check('MEDIA-FALLBACK', 'Un archivo que falla degrada a lámina generada, sin romper la sala',
      media.fallback === true && media.kind === 'GENERATED');
    evidence.performance.media = media.report;

    /* -- projection is a representation, not a fixture ----------------------- */
    // The whole risk of GRAFT 01 is building "the Cuaderno de luz effect"
    // instead of PROJECTION as an entity kind. This check refuses that: the
    // field's geometry has to come from entity.size, its light from
    // content.projection, and its image from content.media.src — so a second
    // projection authored with different data has to come out different.
    const projection = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const entity = rt.store.get('entity.video.cuaderno-de-luz');
      let field = null;
      rt.sceneKit.scene.traverse((object) => {
        if (object.name === 'projection' && !field) field = object.children[0];
      });
      const params = field?.geometry?.parameters ?? {};
      const src = field?.material?.map?.image?.currentSrc
        ?? field?.material?.map?.image?.src ?? '';

      const builders = await import('./scene-kits/museum/builders.js');
      const textures = await import('./scene-kits/museum/textures.js');
      const make = (size, cfg) => builders.buildProjection({
        size,
        texture: field?.material?.map ?? null,
        mask: textures.projectionMask({ aspect: size[0] / size[1], feather: cfg.feather }),
        floorMask: textures.projectionFloorMask({ aspect: size[0] / size[1], feather: cfg.feather }),
        intensity: cfg.intensity,
        spill: cfg.spill,
        reflection: cfg.reflection,
        keystone: cfg.keystone,
        tint: cfg.tint
      });
      const a = make([4.6, 2.6], { intensity: 0.86, spill: 0.62, reflection: 0.46, keystone: 0.038, feather: 0.1, tint: 0xc8bba6 });
      const b = make([7.2, 3.1], { intensity: 0.4, spill: 0.2, reflection: 0.9, keystone: 0.14, feather: 0.3, tint: 0x4466ff });

      const read = (group) => ({
        width: group.children[0].geometry.parameters.width,
        colour: group.children[0].material.color.getHexString(),
        // the keystone is baked into the vertices, so the widened top edge is
        // the only place it can be measured
        topWidth: +(group.children[0].geometry.attributes.position.getX(1) * 2).toFixed(4),
        reflects: Boolean(group.userData.reflection)
      });
      const read_a = read(a);
      const read_b = read(b);
      a.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      b.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });

      return {
        kind: entity?.kind,
        declaredSize: entity?.size,
        declaredSrc: entity?.content?.media?.src ?? '',
        builtWidth: params.width,
        builtHeight: params.height,
        mapSrc: src,
        // a projection has no object in front of the wall: no frame, no bezel,
        // nothing with thickness
        boxes: (() => {
          let n = 0;
          rt.sceneKit.scene.traverse((o) => {
            if (o.name === 'projection') o.traverse((c) => { if (c.geometry?.type === 'BoxGeometry') n += 1; });
          });
          return n;
        })(),
        variantA: read_a,
        variantB: read_b
      };
    });
    const fromData = projection.kind === 'PROJECTION'
      && projection.builtWidth === projection.declaredSize?.[0]
      && projection.builtHeight === projection.declaredSize?.[1]
      && projection.mapSrc.endsWith(projection.declaredSrc.replace(/^\.\.\//, ''));
    const configurable = projection.variantA.width !== projection.variantB.width
      && projection.variantA.colour !== projection.variantB.colour
      && projection.variantA.topWidth !== projection.variantB.topWidth;
    check('PROJECTION-FROM-DATA', 'La proyección toma tamaño, luz e imagen del mundo, no de una constante',
      fromData && configurable,
      `${projection.builtWidth}×${projection.builtHeight} m, media ${projection.mapSrc.split('/').pop()}, `
      + `variantes ${projection.variantA.width}/${projection.variantB.width} m y `
      + `${projection.variantA.colour}/${projection.variantB.colour}`);
    check('PROJECTION-NO-PANEL', 'La proyección no monta ningún objeto en el muro: sin marco, sin bisel, sin pantalla',
      projection.boxes === 0, `${projection.boxes} volúmenes en el grupo`);
    evidence.performance.projection = projection;

    /* -- tour contract: one order, and everything derives from it ------------ */
    // The Tour Control Pass exists because a second, hand-written sequence grew
    // beside the authoritative one and drifted for eleven checkpoints without a
    // single test noticing. These checks are the thing that would have noticed.
    const tour = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const mod = await import('./engine/experience/tour-manifest.js');
      const manifest = rt.tour;
      const validation = mod.validateTourManifest(manifest);

      // Automatic traversal: walk the route beat by beat and collect the
      // canonical step each beat belongs to, in order of first appearance.
      const d = rt.experience;
      const authored = d.reducedMotion;
      d.reducedMotion = true;
      rt.startRoute(rt.defaultRouteId);
      d.pause();
      const traversed = [];
      for (let i = 0; i <= d.steps.length + 2 && d.transport !== 'IDLE'; i += 1) {
        const current = d.currentTourStep;
        if (current && traversed[traversed.length - 1] !== current.order) traversed.push(current.order);
        await d._advanceAndSettle();
      }

      // Manual NEXT across the whole tour, then PREVIOUS all the way back.
      await rt.goToTourStep(manifest.steps[0].id);
      const forward = [d.currentTourStep.order];
      while (d.currentTourStep.nextId) { await d.nextTourStep(); forward.push(d.currentTourStep.order); }
      // Bounded on purpose. Backwards is reconstruction from beat 1 (see the
      // contract, §4), so a full N-step walk costs minutes under SwiftShader.
      // Three consecutive transitions prove PREVIOUS lands on the right canonical
      // step repeatedly; the exhaustive 07→01 walk is committed evidence in
      // qa/evidence-tour/tour-trace.json, and the link algebra is already covered
      // structurally by TOUR-NEXT-PREV-CONSISTENT and TOUR-ALL-REACHABLE.
      const backward = [d.currentTourStep.order];
      for (let i = 0; i < 3 && d.currentTourStep.previousId; i += 1) {
        await d.previousTourStep();
        backward.push(d.currentTourStep.order);
      }
      d.reducedMotion = authored;
      rt.exitRoute();
      // The tour ends in Galería B. Every check after this one was written
      // against Galería A being active, so the precondition is put back
      // explicitly rather than left to whatever the last beat happened to do.
      if (rt.state.activeSpaceId !== 'space.gallery-a') {
        await rt.traversePortal('portal.gallery-b-gallery-a', { source: 'QA' });
      }

      return {
        validation,
        expected: manifest.steps.map((step) => step.order),
        traversed,
        forward,
        backward,
        titles: manifest.steps.map((step) => step.title),
        beatCount: manifest.beats.length,
        restoredSpace: rt.state.activeSpaceId
      };
    });

    for (const result of tour.validation.checks) {
      check(result.id, TOUR_CLAIMS[result.id] || result.id, result.pass, result.detail);
    }
    const expectedSeq = tour.expected.join('→');
    check('TOUR-G-USES-CANONICAL-SEQUENCE',
      'El recorrido automático atraviesa exactamente la secuencia canónica',
      tour.traversed.join('→') === expectedSeq,
      `esperado ${expectedSeq} · observado ${tour.traversed.join('→')}`);
    check('TOUR-MANUAL-NEXT-USES-CANONICAL-SEQUENCE',
      'SIGUIENTE recorre la misma secuencia canónica, de principio a fin',
      tour.forward.join('→') === expectedSeq,
      `observado ${tour.forward.join('→')}`);
    const expectedBack = [...tour.expected].reverse().slice(0, tour.backward.length).join('→');
    check('TOUR-MANUAL-PREV-USES-CANONICAL-SEQUENCE',
      'ANTERIOR retrocede por la secuencia canónica, sin saltarse ninguna parada',
      tour.backward.join('→') === expectedBack,
      `esperado ${expectedBack} · observado ${tour.backward.join('→')}`);
    evidence.tour = tour;

    /* -- experience grammar: A/B/C/D per Stop, and who is in frame ----------- */
    // The grammar is a semantic contract, so it is checked as one: which figure is
    // staged at which beat, in which order, for the Stops that actually use the
    // Artwork grammar. Beat C was the one true gap; Projection D was impure.
    const grammar = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const d = rt.experience;
      const authored = d.reducedMotion;
      d.reducedMotion = true;
      rt.startRoute(rt.defaultRouteId);
      d.pause();

      const seen = [];
      for (let i = 0; i <= d.steps.length + 2 && d.transport !== 'IDLE'; i += 1) {
        const step = d.currentStep;
        if (step) {
          // Settle both figures so opacity reflects the beat rather than a fade.
          for (let f = 0; f < 900; f += 1) rt.sceneKit.update?.(1 / 60, f / 60);
          const shown = (fig) => Boolean(fig?.object?.visible && fig.current.opacity > 0.5);
          const subject = step.subjectRef
            ? rt.store.entities.find((e) => e.id === step.subjectRef)
            : null;
          seen.push({
            beatId: step.id,
            intent: step.shotIntent,
            kind: subject?.kind ?? null,
            tourStepId: d.currentTourStep?.id ?? null,
            tourOrder: d.currentTourStep?.order ?? 0,
            guide: shown(rt.sceneKit._guide),
            visitor: shown(rt.sceneKit._visitor)
          });
        }
        await d._advanceAndSettle();
      }
      d.reducedMotion = authored;
      rt.exitRoute();
      return seen;
    });

    // A Stop uses the Artwork grammar when it contains a CONTEMPLATION beat whose
    // human is the visitor figure. Bienvenida, the threshold Stop and Cierre do
    // not, and are not held to it.
    const byStop = new Map();
    for (const beat of grammar) {
      if (!beat.tourStepId) continue;
      if (!byStop.has(beat.tourStepId)) byStop.set(beat.tourStepId, []);
      byStop.get(beat.tourStepId).push(beat);
    }
    const stopKind = (beats) => beats.find((b) => b.kind)?.kind || null;
    const humanStops = [...byStop.entries()]
      .filter(([, beats]) => beats.some((b) => b.intent === 'CONTEMPLATION' && b.visitor));
    // A sculpture takes the same four slots in a different language, so it is held
    // to its own expectations rather than to the wall works'.
    const artworkStops = humanStops.filter(([, beats]) => stopKind(beats) === 'ARTWORK');
    const sculptureStops = humanStops.filter(([, beats]) => stopKind(beats) === 'SCULPTURE');

    const abcd = artworkStops.map(([stopId, beats]) => {
      const roles = beats.map((b) => ({
        LEAD: 'A', ENTRY: 'A', ACCOMPANIED: 'B', CONTEMPLATION: 'C', FOCUS: 'D',
        // Sculpture's D is a spatial-detail beat. Same grammar slot, other language.
        DETAIL: 'D'
      }[b.intent] || '·')).join('');
      return { stopId, roles, order: beats[0].tourOrder };
    });
    check('GRAMMAR-ARTWORK-ABCD',
      'Cada parada de obra convencional recorre A → B → C → D en ese orden',
      abcd.length >= 1 && abcd.every((s) => /A+BCD$/.test(s.roles)),
      abcd.map((s) => `${String(s.order).padStart(2, '0')}:${s.roles}`).join(' · '));

    const contemplation = grammar.filter((b) => b.intent === 'CONTEMPLATION' && b.visitor);
    check('GRAMMAR-C-VISITOR-NOT-GUIDE',
      'En la contemplación humana hay una figura visitante y la guía ya no media',
      contemplation.length === humanStops.length && contemplation.every((b) => b.visitor && !b.guide),
      contemplation.map((b) => `${b.beatId.split('.').pop()} visitante=${b.visitor} guía=${b.guide}`).join(' · '));

    const artworkD = artworkStops.map(([, beats]) => beats[beats.length - 1]);
    check('GRAMMAR-D-NO-VISITOR-FIGURE',
      'El POV puro de la obra no contiene la figura visitante',
      artworkD.length === artworkStops.length
        && artworkD.every((b) => b.intent === 'FOCUS' && !b.visitor),
      artworkD.map((b) => b.beatId.split('.').pop()).join(' · '));

    const sculptureAbcd = sculptureStops.map(([stopId, beats]) => ({
      stopId,
      roles: beats.map((b) => ({
        LEAD: 'A', ACCOMPANIED: 'B', CONTEMPLATION: 'C', DETAIL: 'D'
      }[b.intent] || '·')).join(''),
      lastIsDetail: beats[beats.length - 1].intent === 'DETAIL',
      lastHasNobody: !beats[beats.length - 1].visitor && !beats[beats.length - 1].guide
    }));
    check('GRAMMAR-SCULPTURE-ABCD',
      'La escultura recorre contexto → atención → escala → detalle espacial, y su detalle queda sin figuras',
      sculptureAbcd.length >= 1
        && sculptureAbcd.every((s) => /ABCD$/.test(s.roles) && s.lastIsDetail && s.lastHasNobody),
      sculptureAbcd.map((s) => `${s.stopId.split('.').pop()}:${s.roles}`).join(' · '));

    const projectionDwell = grammar.find((b) => b.beatId === 'step.10g-cuaderno-dwell');
    check('GRAMMAR-PROJECTION-D-NO-GUIDE',
      'En el dwell de la proyección no hay guía ni figura: sólo la obra',
      Boolean(projectionDwell) && !projectionDwell.guide && !projectionDwell.visitor,
      projectionDwell ? `guía=${projectionDwell.guide} visitante=${projectionDwell.visitor}` : 'beat ausente');
    evidence.grammar = grammar;

    /* -- experience grammar: Collection Browse and its return contract ------- */
    // The audit found this broken in a specific, invisible way: browsing from a
    // guided beat changed the wall label to the next work while the camera kept
    // showing the previous one. These checks assert the three things the product
    // contract actually promises.
    const browse = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const d = rt.experience;
      const authored = d.reducedMotion;
      d.reducedMotion = true;

      await rt.goToTourStep('step.02-paso-galeria-a');
      while (d.currentStep?.id !== 'step.04b-horizonte-cesion') await d._advanceAndSettle();
      const at = (label) => ({
        label,
        authority: rt.camera.owner,
        focused: rt.state.focusedEntityId,
        tourStepId: d.currentTourStep?.id ?? null,
        beatId: d.currentStep?.id ?? null,
        beatIndex: d.index,
        transport: d.transport,
        browsing: rt.isBrowsingCollection,
        pose: rt.camera.pose.position.map((n) => +n.toFixed(2))
      });

      const origin = at('origin');
      const visited = [];
      rt.focusNeighbour(1); await window.__IW.frames(3); visited.push(at('browse+1'));
      rt.focusNeighbour(1); await window.__IW.frames(3); visited.push(at('browse+2'));
      rt.focusNeighbour(-1); await window.__IW.frames(3); visited.push(at('browse-1'));
      rt.releaseFocus(); await window.__IW.frames(6);
      const restored = at('restored');

      d.reducedMotion = authored;
      rt.exitRoute();
      if (rt.state.activeSpaceId !== 'space.gallery-a') {
        await rt.traversePortal('portal.gallery-b-gallery-a', { source: 'QA' });
      }
      return { origin, visited, restored };
    });

    const movedCamera = browse.visited.every((v, i) =>
      v.browsing && v.authority === 'FOCUS'
      && v.focused !== browse.origin.focused
      && (i === 0 || v.focused !== browse.visited[i - 1].focused)
      && Math.hypot(v.pose[0] - browse.origin.pose[0], v.pose[2] - browse.origin.pose[2]) > 0.5);
    check('BROWSE-MOVES-THE-CAMERA',
      'Navegar la colección lleva la cámara a la obra que dice la cartela',
      movedCamera,
      browse.visited.map((v) => `${v.focused.split('.').pop()}@${v.pose.join(',')}`).join(' · '));

    const tourHeld = browse.visited.every((v) =>
      v.tourStepId === browse.origin.tourStepId
      && v.beatId === browse.origin.beatId
      && v.beatIndex === browse.origin.beatIndex);
    check('BROWSE-DOES-NOT-MOVE-THE-TOUR',
      'La obra visitada no reescribe en silencio la posición del recorrido',
      tourHeld,
      `parada ${browse.origin.tourStepId} · beat ${browse.origin.beatIndex} durante ${browse.visited.length} saltos`);

    const returned = browse.restored.beatId === browse.origin.beatId
      && browse.restored.beatIndex === browse.origin.beatIndex
      && browse.restored.tourStepId === browse.origin.tourStepId
      && browse.restored.authority === 'DIRECTED'
      && browse.restored.browsing === false
      && browse.restored.focused === null;
    check('BROWSE-RETURNS-TO-ORIGIN',
      'Salir de la colección devuelve exactamente a la parada y el beat de origen',
      returned,
      `${browse.restored.beatId} · ${browse.restored.authority} · pose ${browse.restored.pose.join(',')}`);
    evidence.browse = browse;

    /* -- warmup actually compiles ------------------------------------------- */
    const warm = await page.evaluate(() => window.__IW.runtime.sceneKit.renderStats());
    check('WARMUP-COMPILES', 'El warmup compila programas de verdad, no una escena vacía',
      warm.programs > 4, `${warm.programs} programas compilados`);

    /* -- premium detail: navigation, zoom, and escape ------------------------ */
    const detail = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      if (rt.state.focusedEntityId) rt.releaseFocus();
      await window.__IW.frames(3);

      const standing = JSON.parse(JSON.stringify(rt.camera.pose));
      rt.actions.dispatch({ type: 'FOCUS_ENTITY', target: 'entity.artwork.horizonte-interrumpido' }, { source: 'QA' });
      await window.__IW.frames(4);
      const first = rt.state.focusedEntityId;

      const stepped = rt.focusNeighbour(1);
      await window.__IW.frames(4);
      const second = rt.state.focusedEntityId;

      const before = JSON.parse(JSON.stringify(rt.camera.pose));
      rt.setDetailZoom(1);
      await window.__IW.frames(30);
      const zoomed = JSON.parse(JSON.stringify(rt.camera.pose));
      const distanceBefore = Math.hypot(before.position[0] - before.target[0], before.position[2] - before.target[2]);
      const distanceAfter = Math.hypot(zoomed.position[0] - zoomed.target[0], zoomed.position[2] - zoomed.target[2]);

      // Escape must work while the camera belongs to the focus controller,
      // which is exactly when movement input is disabled.
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
      await window.__IW.frames(6);

      return {
        first, stepped, second,
        distanceBefore, distanceAfter,
        releasedByEscape: rt.state.focusedEntityId === null,
        owner: rt.camera.owner,
        standing,
        returned: rt.camera.pose,
        violations: rt.camera.violations.length
      };
    });
    check('DETAIL-NAVIGATION', 'En detalle se pasa de una obra a la siguiente sin volver a la sala',
      Boolean(detail.stepped) && detail.second !== detail.first, `${detail.first} → ${detail.second}`);
    check('DETAIL-ZOOM', 'El zoom de inspección acerca realmente la cámara a la obra',
      detail.distanceAfter < detail.distanceBefore - 0.15,
      `${detail.distanceBefore.toFixed(2)} m → ${detail.distanceAfter.toFixed(2)} m`);
    check('ESCAPE-IN-FOCUS', 'Escape saca del detalle aunque el movimiento esté desactivado',
      detail.releasedByEscape && detail.owner === 'EXPLORE');
    check('DETAIL-RETURN', 'Tras recorrer varias obras el visitante vuelve donde estaba de pie',
      detail.standing.position.every((value, i) => near(value, detail.returned.position[i], 0.05)),
      JSON.stringify(detail.returned.position.map((v) => Number(v.toFixed(2)))));
    check('DETAIL-NO-VIOLATIONS', 'La navegación en detalle no rompe la autoridad de cámara',
      detail.violations === 0, `${detail.violations}`);

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
    // Free the desktop context first. Under software rendering, three live WebGL
    // contexts plus real image decoding push a cold boot past any sane timeout.
    await page.close();

    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(`${BASE}/index.html?reducedMotion=1&tier=LOW&state=museum:artwork-horizonte-focus`, { waitUntil: 'load' });
    await mobile.waitForFunction(() => window.__IW?.ready === true, { timeout: 90000 });
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

    // Everything mobile had to say is in `mobileReport`; the page itself is now
    // just a live WebGL context. Under software rendering each one costs real
    // memory and scheduler time, and leaving this one open while the second
    // world booted put three contexts in flight at once — which is what made
    // that boot exceed its 90 s budget and take the whole run down, on a page
    // that boots in about four seconds on its own. The runner already closes
    // the main page before opening mobile; this is the same rule applied once
    // more.
    await mobile.close();

    /* -- configurability: a second world on the same engine ------------------ */
    const secondWorld = await context.newPage();
    const secondErrors = [];
    secondWorld.on('pageerror', (error) => secondErrors.push(error.message));
    await secondWorld.goto(
      `${BASE}/index.html?reducedMotion=1&tier=HIGH&world=./worlds/institutional-demo.world.json`,
      { waitUntil: 'load' }
    );
    await secondWorld.waitForFunction(() => window.__IW?.ready === true, { timeout: 60000 });
    await secondWorld.evaluate(() => {
      document.querySelector('.iw-veil').hidden = true;
      window.__IW.runtime.explore.setPose({ position: [0, 1.62, 2.4], yaw: Math.PI, pitch: -0.03 });
    });
    await secondWorld.evaluate(() => window.__IW.frames(24));
    await secondWorld.screenshot({ path: path.join(EVIDENCE, 'second-world.png') });
    const second = await secondWorld.evaluate(() => ({
      title: window.__IW.runtime.store.title,
      institution: document.querySelector('.iw-topbar__mark b')?.textContent,
      valid: window.__IW.runtime.store.validation.ok,
      invariants: window.__IW.assertInvariants().ok,
      media: window.__IW.mediaLoader.report(),
      spaces: window.__IW.runtime.store.spaces.length
    }));
    await secondWorld.close();
    check('SECOND-WORLD', 'Un segundo mundo funciona sobre el mismo motor y el mismo Scene Kit',
      second.valid && second.invariants && secondErrors.length === 0,
      `${second.title} · ${second.spaces} salas · ${second.media.loaded} archivos`);
    check('WORLD-DRIVEN-IDENTITY', 'La interfaz toma la identidad del mundo, no de una constante',
      Boolean(second.institution) && !/Arenas/i.test(second.institution), second.institution);
    evidence.secondWorld = second;

    /* -- authoring ----------------------------------------------------------- */
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
