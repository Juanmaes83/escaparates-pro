import { PHASE3_APPROVED_AVATAR } from './museum-character-phase3.js';

// Phase 6 final roadmap seam: Museum -> proven VECINIA exterior/full-world receiver.
// This is a CONTEXT handoff, not an in-scene graft. Navigating away tears down the
// Museum page before the exterior receiver creates its own renderer/CameraAuthority.
// Therefore there is never a second live renderer, WorldStore, CameraAuthority,
// navigation authority or Character root in the same runtime.

export const FULL_WORLD_RECEIVER = Object.freeze({
  project: 'Juanmaes83/VECINIA-WORLDS',
  branch: 'chatgpt/character-2027-full-world-receiver-v1',
  sourceCheckpoint: 'feat/sculpture-navigation-character-v1',
  url: 'https://vecinia-worlds-git-chatgpt-cha-1cc823-juanma-espinosas-projects.vercel.app/',
  capabilities: Object.freeze([
    'ExteriorCharacterPilot',
    'exterior-pilot-skeleton',
    'full-world-c2-skeleton'
  ])
});

const FULL_WORLD_FLAGS = Object.freeze({
  worldSlicePlanV1: '1',
  worldSliceKimiAxisV1: '1',
  coastalEnvironmentV1: '1',
  houseSkinPropagationV1: '1',
  threeHouseQualityProofV1: '1',
  glslVisualDepthV1: '1',
  worldAliveV1: '1',
  coastalLeisureExpansionV1: '1',
  exteriorCharacterPilotV1: '1',
  fullWorldSkeletonC2V1: '1',
  districtNavigationS5V1: '1'
});

export function installMuseumCharacterFullWorldHandoff(runtime = window.__IW?.runtime) {
  if (!runtime?.camera || !runtime?.store) throw new Error('Full World handoff requires the canonical Museum runtime');
  if (window.__IW_CHARACTER_FULL_WORLD?.ready) return window.__IW_CHARACTER_FULL_WORLD;

  const character = window.__IW_CHARACTER_PHASE4B?.phase4a || window.__IW_CHARACTER_PHASE4A;
  if (!character?.ready || !character?.root) throw new Error('Full World handoff requires the validated live Character foundation');

  const identity = Object.freeze({
    assetId: PHASE3_APPROVED_AVATAR.assetId,
    expectedByteLength: PHASE3_APPROVED_AVATAR.expectedByteLength,
    expectedSha256: PHASE3_APPROVED_AVATAR.expectedSha256,
    sourceCommit: PHASE3_APPROVED_AVATAR.sourceCommit
  });

  function buildReceiverUrl({ returnTo = location.href, receiver = FULL_WORLD_RECEIVER.url } = {}) {
    const url = new URL(receiver);
    for (const [key, value] of Object.entries(FULL_WORLD_FLAGS)) url.searchParams.set(key, value);
    url.searchParams.set('characterIdentity', identity.assetId);
    url.searchParams.set('characterSha256', identity.expectedSha256);
    url.searchParams.set('characterBytes', String(identity.expectedByteLength));
    url.searchParams.set('handoffFrom', 'MUSEUM_CHARACTER_2027');
    url.searchParams.set('returnTo', returnTo);
    return url.href;
  }

  function report() {
    const gate = window.__IW_CHARACTER_GATE_A?.report?.() || null;
    const cinematic = window.__IW_CHARACTER_CINEMATIC_CAMERA?.report?.() || null;
    return {
      phase: 'PHASE6_EXTERIOR_PILOT_FULL_WORLD_C2_HANDOFF',
      ready: true,
      identity,
      receiver: FULL_WORLD_RECEIVER,
      receiverUrl: buildReceiverUrl(),
      museum: {
        activeSpaceId: runtime.state?.activeSpaceId || null,
        characterRoot: character.root.uuid,
        semanticTarget: gate?.selectedDestinationId || null,
        cinematicReady: Boolean(cinematic?.ready)
      },
      authorityContract: {
        handoffType: 'PAGE_CONTEXT_REPLACEMENT',
        simultaneousRenderers: 1,
        simultaneousWorldStores: 1,
        simultaneousCameraAuthorities: 1,
        simultaneousCharacterRoots: 1,
        museumDisposedByNavigationBeforeExteriorBoot: true
      }
    };
  }

  const api = {
    ready: true,
    identity,
    receiver: FULL_WORLD_RECEIVER,
    buildReceiverUrl,
    enter(options = {}) {
      // Deliberately use same-tab navigation: the Museum document is destroyed
      // before VECINIA boots, enforcing one live world authority at a time.
      location.assign(buildReceiverUrl(options));
    },
    report,
    dispose() {
      delete window.__IW_CHARACTER_FULL_WORLD;
      delete document.documentElement.dataset.characterFullWorld;
    }
  };

  window.__IW_CHARACTER_FULL_WORLD = api;
  document.documentElement.dataset.characterFullWorld = 'ready';
  console.info('[Character 2027] Full World handoff READY', report());
  return api;
}
