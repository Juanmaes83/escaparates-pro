import { buildBarrierLine } from '../scene-kits/museum/builders.js';

const GALLERY_B = 'space.gallery-b';
const END_TRIM = 0.72;
const BLOCKER_PAD = 0.20;

function sameNumber(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.001;
}

function sameBlocker(a, b) {
  if (!a?.min || !a?.max || !b?.min || !b?.max) return false;
  return a.min.every((v, i) => sameNumber(v, b.min[i]))
    && a.max.every((v, i) => sameNumber(v, b.max[i]));
}

function trimmedLine(line) {
  const dx = line.to[0] - line.from[0];
  const dz = line.to[2] - line.from[2];
  const length = Math.hypot(dx, dz);
  if (length < 1.8) return null;
  const trim = Math.min(END_TRIM, Math.max(0.25, length * 0.18));
  const ux = dx / length;
  const uz = dz / length;
  const from = [line.from[0] + ux * trim, line.from[1], line.from[2] + uz * trim];
  const to = [line.to[0] - ux * trim, line.to[1], line.to[2] - uz * trim];

  let blocker;
  if (Math.abs(dx) >= Math.abs(dz)) {
    const z = (from[2] + to[2]) / 2;
    blocker = {
      min: [Math.min(from[0], to[0]) - BLOCKER_PAD, 0, z - BLOCKER_PAD],
      max: [Math.max(from[0], to[0]) + BLOCKER_PAD, 1.2, z + BLOCKER_PAD]
    };
  } else {
    const x = (from[0] + to[0]) / 2;
    blocker = {
      min: [x - BLOCKER_PAD, 0, Math.min(from[2], to[2]) - BLOCKER_PAD],
      max: [x + BLOCKER_PAD, 1.2, Math.max(from[2], to[2]) + BLOCKER_PAD]
    };
  }
  return { ...line, from, to, blocker, trim };
}

function disposeGeometryOnly(object) {
  object.traverse?.((node) => node.geometry?.dispose?.());
}

/**
 * Phase 4B human-gate circulation correction.
 *
 * Gallery B is physically smaller than Gallery A. Its procedural primary-wall
 * rope is valid museum furniture but the authored span plus Character radius
 * leaves too little circulation at the ends. Rebuild the same rope shorter and
 * replace the exact corresponding blocker, so visual geometry and collision
 * remain one fact instead of creating an invisible passage.
 */
export function applyGalleryBCharacterPassage(sceneKit, store) {
  const handle = sceneKit?._spaces?.get?.(GALLERY_B);
  if (!handle?.group || !handle?.profile || typeof sceneKit._barrierLinesFor !== 'function') {
    return { applied: false, reason: 'gallery-b-not-ready' };
  }

  const original = sceneKit._barrierLinesFor(handle.space, store, handle.profile);
  if (!original.length) return { applied: false, reason: 'no-gallery-b-barrier' };

  const replacements = original.map(trimmedLine).filter(Boolean);
  if (!replacements.length) return { applied: false, reason: 'barrier-too-short-to-trim' };

  for (const child of [...handle.group.children]) {
    if (child.name !== 'barrier') continue;
    handle.group.remove(child);
    disposeGeometryOnly(child);
  }

  let blockerReplacements = 0;
  for (const line of replacements) {
    handle.group.add(buildBarrierLine({
      from: line.from,
      to: line.to,
      material: handle.materials.post,
      ropeMaterial: handle.materials.rope
    }));

    const originalLine = original.find((candidate) => candidate.wall === line.wall && sameBlocker(candidate.blocker, candidate.blocker));
    const index = handle.blockers.findIndex((blocker) => original.some((candidate) => sameBlocker(blocker, candidate.blocker)));
    if (index >= 0) {
      handle.blockers[index] = line.blocker;
      blockerReplacements += 1;
    }
  }

  return {
    applied: true,
    room: GALLERY_B,
    lines: replacements.length,
    blockerReplacements,
    trimPerEnd: replacements.map((line) => line.trim),
    rule: 'visual rope and its canonical blocker shortened together'
  };
}
