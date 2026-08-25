// S3-B2 — Character 2027 as the physical representation of the EXISTING
// Museum/Property Room guide tour.
//
// Authority discipline:
// - ExperienceDirector remains the tour/narrative/camera authority.
// - World route.chapterRefs -> chapter.stepRefs remains the only stop order.
// - Runtime.stageGuide remains the semantic staging seam.
// - The legacy guide is staged internally so donor timing/framing semantics stay
//   compatible, but its visual body is suppressed before every rendered frame.
// - Character 2027 mirrors the exact authored staging through CharacterActionAPI.
// - No new route, no new camera model, no new hotspots and no new WorldState.

import * as THREE from 'three185';
import { HumanSpatialContract, MUSEUM_HUMAN_PROFILE } from '../spatial/HumanSpatialContract.js';
import { validateTourManifest } from '../../../../property-room-v1/engine/experience/tour-manifest.js';
import { createMuseumCharacterRuntimeAdapter } from './MuseumCharacterRuntimeAdapter.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(test, timeoutMs = 12000, stepMs = 25) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const value = test();
    if (value) return value;
    await wait(stepMs);
  }
  return null;
}

function headingError(root, lookAt) {
  if (!lookAt) return 0;
  const desired = new THREE.Vector3(lookAt[0] - root.position.x, 0, lookAt[2] - root.position.z);
  if (desired.lengthSq() < 1e-8) return 0;
  desired.normalize();
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion).setY(0).normalize();
  return Math.acos(THREE.MathUtils.clamp(forward.dot(desired), -1, 1));
}

function installTourControls(api) {
  document.getElementById('s3b2-tour-controls')?.remove();
  const box = document.createElement('div');
  box.id = 's3b2-tour-controls';
  box.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:10050;display:flex;gap:7px;align-items:center;padding:8px 9px;background:rgba(25,20,15,.78);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);font:600 10px/1.2 system-ui,sans-serif;color:#f4ede1';

  const start = document.createElement('button');
  start.textContent = 'Tour completo · Character 2027';
  start.style.cssText = 'border:1px solid rgba(255,255,255,.25);background:#eee4d4;color:#211a14;padding:9px 11px;font-weight:700;cursor:pointer';
  const exit = document.createElement('button');
  exit.textContent = 'Salir del tour';
  exit.style.cssText = 'border:1px solid rgba(255,255,255,.2);background:#332a23;color:#f4ede1;padding:9px 10px;cursor:pointer';
  const status = document.createElement('span');
  status.style.cssText = 'min-width:210px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  status.textContent = 'READY · tour canónico';

  start.onclick = () => {
    if (!api.preflight.pass) return;
    if (api.runtime.experience.transport !== 'IDLE') api.runtime.exitRoute();
    api.clearRunEvidence();
    api.runtime.startRoute(api.runtime.defaultRouteId);
  };
  exit.onclick = () => api.runtime.exitRoute();

  box.append(start, exit, status);
  document.body.appendChild(box);

  const timer = setInterval(() => {
    const e = api.runtime.experience.report();
    const error = api.lastError ? ' · ERROR' : '';
    status.textContent = `${api.runtime.state.activeSpaceId} · ${e.tourOrder || 0}/${e.tourTotal || api.manifest.steps.length} · ${e.stepId || 'esperando'} · ${api.characterSettled ? 'settled' : 'moving'}${error}`;
  }, 160);

  return { status, dispose() { clearInterval(timer); box.remove(); } };
}

export async function installPropertyRoomCharacterTourBridge(runtime = window.__IW?.runtime) {
  if (!runtime || !window.__IW?.ready) throw new Error('S3-B2 tour bridge requires READY Property Room runtime');
  if (!runtime.sceneKit?.scene) throw new Error('S3-B2 requires authoritative runtime.sceneKit.scene');
  if (!window.__IW?.renderHost) throw new Error('S3-B2 requires the existing RenderHost');
  if (!runtime.defaultRouteId || !runtime.tour) throw new Error('S3-B2 requires the canonical authored route/tour');
  if (window.__IW_CHARACTER_TOUR?.ready) return window.__IW_CHARACTER_TOUR;

  const manifest = runtime.tour;
  const manifestValidation = validateTourManifest(manifest);
  if (!manifestValidation.ok) {
    throw new Error(`Canonical tour manifest invalid: ${JSON.stringify(manifestValidation.checks.filter((x) => !x.pass))}`);
  }

  const adapter = await createMuseumCharacterRuntimeAdapter({
    runtime,
    renderHost: window.__IW.renderHost,
    spaceId: runtime.state.activeSpaceId,
    rootName: 'S3B2_TOUR_CHARACTER_2027_ROOT',
  });
  adapter.root.visible = false;

  const originalStageGuide = runtime.stageGuide.bind(runtime);
  const originalGuideSettled = runtime.experience.ports.guideSettled;
  const renderChainBeforeBridge = runtime.onFrame;
  let characterSettled = true;
  let characterMoveToken = 0;
  let lastSpaceId = null;
  let disposed = false;
  let legacyGuideWasVisible = null;
  let lastTarget = null;
  let lastError = null;
  const movementLog = [];

  function suppressLegacyGuideVisual() {
    const object = runtime.sceneKit?._guide?.object;
    if (!object) return;
    if (legacyGuideWasVisible === null) legacyGuideWasVisible = object.visible;
    object.visible = false;
  }

  function restoreLegacyGuideVisual() {
    const object = runtime.sceneKit?._guide?.object;
    if (object && legacyGuideWasVisible !== null) object.visible = legacyGuideWasVisible;
    legacyGuideWasVisible = null;
  }

  runtime.onFrame = (pose, dt) => {
    suppressLegacyGuideVisual();
    renderChainBeforeBridge?.(pose, dt);
  };

  function contractFor(spaceId) {
    return new HumanSpatialContract({ sceneKit: runtime.sceneKit, store: runtime.store, spaceId, characterRadius: 0.34 });
  }

  function resolveStaging(staging) {
    if (!staging?.anchorId) return null;
    const anchorRecord = runtime.store.get(staging.anchorId);
    if (!anchorRecord) throw new Error(`Tour staging anchor missing from WorldStore: ${staging.anchorId}`);
    const spaceId = anchorRecord.spaceId || runtime.state.activeSpaceId;
    const contract = contractFor(spaceId);
    const target = contract.resolve({
      anchorId: staging.anchorId,
      subjectRef: staging.subjectRef || null,
      aside: Boolean(staging.aside),
    });
    return { contract, target, spaceId };
  }

  async function moveCharacterToStaging(staging, token) {
    try {
      const resolved = resolveStaging(staging);
      if (!resolved) {
        characterSettled = true;
        adapter.root.visible = false;
        return;
      }
      const { contract, target, spaceId } = resolved;
      lastTarget = target;
      const firstAppearance = !adapter.root.visible || lastSpaceId !== spaceId;
      adapter.root.visible = true;

      if (firstAppearance) {
        adapter.placeAt(target);
        adapter.controller.transitionTo('IDLE_V2', 0);
        adapter.character.lookAt(target.lookAt, { weight: 1, status: 'Tour target-aware lookAt' });
        lastSpaceId = spaceId;
        characterSettled = true;
        movementLog.push({ anchorId: target.anchorId, spaceId, mode: 'SPAWN', distance: 0, targetDistance: 0, pass: true });
        return;
      }

      const startPosition = adapter.root.position.clone();
      const targetPosition = new THREE.Vector3(...target.position);
      const currentDistance = startPosition.distanceTo(targetPosition);
      if (currentDistance <= MUSEUM_HUMAN_PROFILE.settleTolerance) {
        adapter.character.turnTo(target.lookAt, { turnSpeed: 6, status: `Facing ${target.subjectRef || target.anchorId}` });
        adapter.character.lookAt(target.lookAt, { weight: 1, status: 'Tour target-aware lookAt' });
        characterSettled = true;
        movementLog.push({ anchorId: target.anchorId, spaceId, mode: 'ALREADY_SETTLED', distance: 0, targetDistance: Number(currentDistance.toFixed(3)), pass: true });
        return;
      }

      const plan = contract.routePlan(startPosition.toArray(), target, { subjectRef: target.subjectRef });
      if (!plan.points.length) throw new Error(`No safe Character route to tour staging ${target.anchorId}: ${plan.source}`);

      characterSettled = false;
      for (const point of plan.points) {
        if (token !== characterMoveToken || disposed) return;
        adapter.character.moveTo(point, {
          label: `tour:${target.anchorId}`,
          walkSpeed: MUSEUM_HUMAN_PROFILE.guideWalkSpeed,
          stopDistance: 0.08,
        });
        const stopped = await waitUntil(
          () => token !== characterMoveToken || disposed || adapter.updateError || adapter.controller.navigation.mode === 'IDLE',
          12000,
        );
        if (!stopped || adapter.updateError) throw new Error(adapter.updateError || `Character did not settle at ${target.anchorId}`);
        if (token !== characterMoveToken || disposed) return;
      }

      adapter.character.turnTo(target.lookAt, { turnSpeed: 6, status: `Facing ${target.subjectRef || target.anchorId}` });
      adapter.character.lookAt(target.lookAt, { weight: 1, status: 'Tour target-aware lookAt' });
      await waitUntil(() => headingError(adapter.root, target.lookAt) < 0.12 || token !== characterMoveToken || disposed, 1500, 25);
      if (token !== characterMoveToken || disposed) return;

      const targetDistance = adapter.root.position.distanceTo(targetPosition);
      const pass = targetDistance <= MUSEUM_HUMAN_PROFILE.settleTolerance;
      movementLog.push({
        anchorId: target.anchorId,
        spaceId,
        mode: plan.source,
        distance: Number(startPosition.distanceTo(adapter.root.position).toFixed(3)),
        targetDistance: Number(targetDistance.toFixed(3)),
        pass,
      });
      if (!pass) throw new Error(`Character tour settle miss ${target.anchorId}: ${targetDistance.toFixed(3)}m`);
      lastSpaceId = spaceId;
      characterSettled = true;
    } catch (error) {
      lastError = String(error?.stack || error);
      characterSettled = true;
      console.error('[S3-B2 Character Tour]', error);
    }
  }

  runtime.stageGuide = (staging) => {
    const result = originalStageGuide(staging);
    suppressLegacyGuideVisual();
    characterMoveToken += 1;
    const token = characterMoveToken;
    lastError = null;
    if (!staging) {
      characterSettled = true;
      adapter.character.stop();
      adapter.root.visible = false;
      lastTarget = null;
      return result;
    }
    characterSettled = false;
    void moveCharacterToStaging(staging, token);
    return result;
  };

  runtime.experience.ports.guideSettled = () => {
    suppressLegacyGuideVisual();
    const donorSettled = originalGuideSettled ? originalGuideSettled() : true;
    return donorSettled && characterSettled;
  };

  // Boot-time audit reads canonical World records for the whole route. Geometry
  // for future rooms is intentionally deferred until the donor lifecycle builds
  // those rooms; asking SceneKit for those anchors now would be a false failure.
  const stagingAudit = [];
  for (const beat of manifest.beats) {
    if (!beat.guide?.anchorId) continue;
    const staging = { ...beat.guide, subjectRef: beat.guide.subjectRef || beat.subjectRef };
    const anchorRecord = runtime.store.get(staging.anchorId);
    const subjectRecord = staging.subjectRef ? runtime.store.get(staging.subjectRef) : null;
    const spaceId = anchorRecord?.spaceId || subjectRecord?.spaceId || (runtime.store.kindOf(staging.subjectRef) === 'SPACE' ? staging.subjectRef : null);
    const activeGeometryReady = Boolean(runtime.sceneKit.poseForAnchor(staging.anchorId));
    let clearanceSafe = null;
    let overlaps = null;
    let geometryError = null;
    if (anchorRecord && activeGeometryReady && spaceId) {
      try {
        const resolved = resolveStaging(staging);
        const clearance = resolved.contract.validatePoint(resolved.target.position);
        clearanceSafe = Boolean(clearance?.safe);
        overlaps = clearance?.overlaps?.length || 0;
      } catch (error) {
        geometryError = String(error?.message || error);
      }
    }
    stagingAudit.push({
      beatId: beat.id,
      anchorId: staging.anchorId,
      subjectRef: staging.subjectRef || null,
      spaceId,
      canonicalAnchorExists: Boolean(anchorRecord),
      canonicalSubjectExists: !staging.subjectRef || Boolean(subjectRecord),
      geometryReadyAtBoot: activeGeometryReady,
      clearanceSafe,
      overlaps,
      geometryError,
    });
  }

  const adapterAudit = adapter.audit();
  const hotspots = runtime.store.hotspots;
  const preflightFailures = [];
  if (!adapterAudit.matrixAuthority?.pass) preflightFailures.push('Three r185 matrix authority failed');
  if (!adapterAudit.provenance?.exactApprovedAssetMatch) preflightFailures.push('Approved Character provenance failed');
  if (Math.abs(adapter.canonicalHeight - 1.66) > 0.001) preflightFailures.push(`Canonical Character height changed: ${adapter.canonicalHeight}`);
  if (!manifestValidation.ok) preflightFailures.push('Tour manifest invalid');
  const missing = stagingAudit.filter((item) => !item.canonicalAnchorExists || !item.canonicalSubjectExists);
  if (missing.length) preflightFailures.push(`Broken canonical tour stagings: ${missing.map((x) => x.beatId).join(', ')}`);

  const preflight = {
    pass: preflightFailures.length === 0,
    failures: preflightFailures,
    routeId: runtime.defaultRouteId,
    tourSteps: manifest.steps.length,
    beats: manifest.beats.length,
    guideStagings: stagingAudit.length,
    spaces: [...new Set(stagingAudit.map((x) => x.spaceId).filter(Boolean))],
    hotspots: hotspots.length,
    clearanceWarnings: stagingAudit.filter((item) => item.geometryReadyAtBoot && item.clearanceSafe === false).map((item) => item.beatId),
    deferredGeometryChecks: stagingAudit.filter((item) => !item.geometryReadyAtBoot).map((item) => item.beatId),
    stagingAudit,
    manifestChecks: manifestValidation.checks,
    adapter: adapterAudit,
  };
  if (!preflight.pass) {
    runtime.onFrame = renderChainBeforeBridge;
    adapter.dispose();
    runtime.stageGuide = originalStageGuide;
    runtime.experience.ports.guideSettled = originalGuideSettled;
    throw new Error(`S3-B2 tour preflight failed: ${JSON.stringify(preflight.failures)}`);
  }

  let controls = null;
  const api = {
    ready: true,
    runtime,
    adapter,
    manifest,
    preflight,
    movementLog,
    get characterSettled() { return characterSettled; },
    get lastTarget() { return lastTarget; },
    get lastError() { return lastError; },
    clearRunEvidence() { movementLog.length = 0; lastError = null; },
    report() {
      return {
        phase: 'S3-B2_FULL_ROOM_CANONICAL_TOUR_CHARACTER_2027',
        authoritativeTourSource: 'route.chapterRefs->chapter.stepRefs->storySteps',
        environment: 'ACTUAL_PROPERTY_ROOM_VISITOR_RUNTIME',
        preflight,
        runtime: runtime.experience.report(),
        activeSpaceId: runtime.state.activeSpaceId,
        characterSettled,
        lastTarget,
        lastError,
        movementLog: [...movementLog],
        cameraAuthority: runtime.camera.report(),
        hotspots: { count: hotspots.length, ids: hotspots.map((x) => x.id) },
      };
    },
    dispose() {
      disposed = true;
      characterMoveToken += 1;
      controls?.dispose();
      runtime.stageGuide = originalStageGuide;
      runtime.experience.ports.guideSettled = originalGuideSettled;
      runtime.onFrame = renderChainBeforeBridge;
      restoreLegacyGuideVisual();
      adapter.dispose();
      delete window.__IW_CHARACTER_TOUR;
    },
  };

  controls = installTourControls(api);
  window.__IW_CHARACTER_TOUR = api;
  document.documentElement.dataset.characterTour = 'ready';
  return api;
}
