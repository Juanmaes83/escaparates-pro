import { createPropertyRoomSemanticAuthoring } from './PropertyRoomSemanticAuthoring.js';

function previewToolbarGutter() {
  return location.hostname.endsWith('.vercel.app') && window.innerWidth >= 1200 ? 310 : 14;
}

function installSemanticControls(api) {
  document.getElementById('s3b2b-semantic-controls')?.remove();

  // B2B replaces the old hard-coded target row visually. B2A locomotion/actions
  // remain untouched underneath.
  const oldTargets = document.querySelector('#s3b2a-free-controls [data-role="targets"]');
  if (oldTargets) oldTargets.hidden = true;

  const root = document.createElement('div');
  root.id = 's3b2b-semantic-controls';
  const right = previewToolbarGutter();
  root.dataset.previewToolbarGutter = String(right);
  root.style.cssText = `position:fixed;right:${right}px;bottom:14px;z-index:12001;width:min(410px,calc(100vw - ${right + 28}px));max-height:185px;overflow:auto;padding:10px 11px;background:rgba(20,22,18,.90);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(8px);color:#f4f0e8;font:600 11px/1.35 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.18)`;
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:7px">
      <strong>S3-B2B · SEMANTIC AUTHORING</strong>
      <span data-role="status" style="font-weight:500;opacity:.82">READY</span>
    </div>
    <div data-role="destinations" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px"></div>
    <div data-role="diag" style="font:500 10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;opacity:.8"></div>
  `;
  document.body.appendChild(root);

  const status = root.querySelector('[data-role="status"]');
  const destinations = root.querySelector('[data-role="destinations"]');
  const diag = root.querySelector('[data-role="diag"]');

  for (const entry of api.destinations) {
    const button = document.createElement('button');
    button.textContent = entry.label;
    button.title = `${entry.role} · ${entry.subjectRef}`;
    button.style.cssText = 'border:1px solid rgba(255,255,255,.22);background:#e9eadf;color:#1c2118;padding:7px 9px;font:700 10px system-ui;cursor:pointer';
    button.onclick = () => { void api.go(entry.id); };
    destinations.appendChild(button);
  }

  const audit = api.audit();
  diag.textContent = `canonical=${audit.canonicalIdentity.ok ? 'OK' : 'FAIL'} viewpoints=${audit.viewpoints.length} portalHints=${audit.portalHints.length} guideReview=${audit.orphanGuideAnchors.length} visitorReview=${audit.orphanVisitorAnchors.length}`;

  const timer = setInterval(() => { status.textContent = api.lastStatus; }, 120);
  return {
    dispose() {
      clearInterval(timer);
      root.remove();
      if (oldTargets) oldTargets.hidden = false;
    },
  };
}

export function installPropertyRoomSemanticAuthoring(runtime = window.__IW?.runtime, freeApi = window.__IW_CHARACTER_FREE) {
  if (!runtime?.store) throw new Error('S3-B2B requires canonical Property Room runtime/store');
  if (!freeApi?.ready) throw new Error('S3-B2B requires proven/free Character B2A foundation');
  if (window.__IW_CHARACTER_SEMANTICS?.ready) return window.__IW_CHARACTER_SEMANTICS;

  const semantic = createPropertyRoomSemanticAuthoring(runtime);
  let lastStatus = 'READY · CANONICAL SEMANTICS';
  const movementLog = [];

  async function go(id) {
    const resolved = semantic.resolve(id, freeApi.adapter.contract);
    if (!resolved.ok) {
      lastStatus = `UNRESOLVED · ${id}`;
      movementLog.push({ type: 'SEMANTIC_REJECT', id, reason: resolved.reason, attempts: resolved.attempts || [] });
      return false;
    }

    const entry = resolved.entry;
    lastStatus = `GO · ${entry.label}`;
    const ok = await freeApi.goToPoint(resolved.target.position, entry.label);
    if (!ok) {
      lastStatus = `BLOCKED · ${entry.label}`;
      movementLog.push({ type: 'SEMANTIC_BLOCKED', id, anchorId: resolved.anchorId });
      return false;
    }

    if (resolved.target.lookAt) {
      freeApi.adapter.character.turnTo(resolved.target.lookAt, {
        turnSpeed: 6,
        status: `Facing ${entry.label}`,
      });
      freeApi.adapter.character.lookAt(resolved.target.lookAt, {
        weight: 1,
        status: `LookAt ${entry.label}`,
      });
    }

    lastStatus = `ARRIVED · ${entry.label}`;
    movementLog.push({
      type: 'SEMANTIC_ARRIVAL',
      id,
      role: entry.role,
      subjectRef: entry.subjectRef,
      hotspotRef: entry.hotspotRef,
      anchorId: resolved.anchorId,
      attempts: resolved.attempts,
    });
    return true;
  }

  let controls = null;
  const api = {
    ready: true,
    phase: 'S3-B2B_SEMANTIC_AUTHORING',
    semantic,
    destinations: semantic.destinations,
    go,
    get lastStatus() { return lastStatus; },
    audit: () => semantic.audit(),
    report() {
      return {
        phase: 'S3-B2B_SEMANTIC_AUTHORING',
        ready: true,
        source: 'CANONICAL_WORLD_STORE_DERIVED_VIEW',
        lastStatus,
        destinations: semantic.destinations.map((entry) => ({
          id: entry.id,
          label: entry.label,
          role: entry.role,
          subjectRef: entry.subjectRef,
          hotspotRef: entry.hotspotRef,
          anchorCandidates: [...entry.anchorCandidates],
        })),
        audit: semantic.audit(),
        movementLog: [...movementLog],
        freeFoundation: freeApi.report(),
      };
    },
    dispose() {
      controls?.dispose();
      delete window.__IW_CHARACTER_SEMANTICS;
      delete document.documentElement.dataset.characterSemanticAuthoring;
    },
  };

  controls = installSemanticControls(api);
  window.__IW_CHARACTER_SEMANTICS = api;
  document.documentElement.dataset.characterSemanticAuthoring = 'ready';
  return api;
}
