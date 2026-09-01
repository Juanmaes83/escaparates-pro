# Museum Avatar lifecycle recovery — 2026-09-01

Branch: `codex/museum-avatar-recovery-v1`

Base: canonical protected branch `claude/museum-itinerant-living-art-graft-v1` at merge commit `b1efb37aa05035dd3870ae298fae60cb71ce5922` (PR #82).

## Reproduced failure

Avatar Studio was present on initial boot. After `Avatar → Vista previa`, `StudioShell._apply()` rebuilt Museum through a nested `boot()`. Product installers lived only in the outer `boot().then(...)`, so the replacement Studio/runtime never received Avatar Studio, Character, Gate A or Wet Paint bindings. The Avatar area disappeared and an active Character session could remain attached to the disposed runtime.

## Historical contract recovered

- Museum supports first-person POV and third-person Character exploration.
- Avatar Studio owns the existing approved/custom avatar profile, rig, scale, grounding and motion controls.
- `Vista previa` must restore the active Avatar domain and cached preview on the replacement Museum Scene.
- Character mode keeps one renderer, one WorldStore, one Character root per active runtime and one CameraAuthority.

The candidate, pre-consolidation backup and canonical branches contain the Character/Avatar engines and their URL gates. They do not contain a visitor-facing POV/Avatar selector that can be transplanted. This recovery therefore exposes those existing gates at the entry veil; it does not create another Character implementation.

## Recovery

1. `experience-app.js` owns a registered boot-installer lifecycle. Initial boot and every Studio preview boot execute the same product composition.
2. Before rebinding, the previous installer cleanup disposes Character capability layers and the prior Wet Paint bridge.
3. Avatar Studio/visibility/motion installers mount against the replacement `StudioShell`; the cached avatar binary is parsed and attached to the replacement Museum Scene.
4. Wet Paint bridge disposal and idempotent upload interception prevent iframe and handler multiplication.
5. The visitor entry veil exposes `POV · primera persona` and `Con mi avatar`. Avatar selection activates the already-existing `character=1`, `mobility=1`, `continuity=1` and `gatea=1` path.

## Automated gate

`node labs/immersive-worlds/qa/tools/avatar-studio-rebuild-regression.mjs`

Required results:

- POV/Avatar choice visible and Character choice reaches `THIRD_PERSON_EXPLORE`;
- Avatar area, profile, rig, preview and active domain survive `Vista previa`;
- preview belongs to the replacement Museum Scene;
- Character is recreated for the replacement runtime with zero camera violations;
- Gate A remains ready;
- one Wet Paint bridge;
- zero page errors.

Compatibility gates also remain green:

- `studio-schema3-boot-regression.mjs` — 9/9 PASS;
- `museum-special-rooms-studio-recovery.mjs` — 5/5 PASS.

## Merge gate

Do not merge this branch until the Vercel preview is READY and the human reviewer returns `KEEP` or an exact `ADJUST` step.
