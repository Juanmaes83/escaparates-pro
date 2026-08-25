import { THREE } from '../render/render-host.js';
import { MuseumSceneKit } from '../scene-kits/museum/museum-scene-kit.js';

/**
 * Authored projection hardening.
 *
 * A real user-supplied image/video must not compete with the synthetic projection
 * treatment (additive wash, halo, floor echo, caption layer). This module keeps
 * the original projection look as fallback, but when canonical media is marked
 * `authored: true` it presents that media cleanly and predictably.
 */

function projectionSurfaceFromRoot(root, entitySize = null) {
  if (!root) return null;
  let best = null;
  let bestScore = Infinity;
  const [ew, eh] = Array.isArray(entitySize) ? entitySize : [0, 0];

  root.traverse?.((node) => {
    if (!node?.isMesh || node.geometry?.type !== 'PlaneGeometry' || !node.material) return;
    // The floor echo is rotated into the floor; never choose it as the wall field.
    if (Math.abs(Number(node.rotation?.x || 0)) > 0.4) return;
    const p = node.geometry.parameters || {};
    const w = Number(p.width || 0);
    const h = Number(p.height || 0);
    if (!w || !h) return;
    const score = ew && eh ? Math.abs(w - ew) + Math.abs(h - eh) : -w * h;
    if (score < bestScore) {
      best = node;
      bestScore = score;
    }
  });
  return best;
}

export function findProjectionSurface(sceneKit, entityId) {
  const record = sceneKit?._entityIndex?.get(entityId);
  const root = record?.object;
  if (!root) throw new Error(`No existe la proyección renderizada: ${entityId}`);
  const surface = projectionSurfaceFromRoot(root, record?.size || null);
  if (!surface) throw new Error(`No se encontró la superficie principal de ${entityId}`);
  return surface;
}

export function cleanAuthoredProjection(root, entitySize = null) {
  const field = projectionSurfaceFromRoot(root, entitySize);
  if (!field) return null;

  // The authored media itself is the visual authority. Remove the mask/tint/
  // additive wash that made the fallback atmospheric but obscured real video.
  const material = field.material;
  material.alphaMap = null;
  material.color?.set?.(0xffffff);
  material.blending = THREE.NormalBlending;
  material.transparent = false;
  material.opacity = 1;
  material.depthWrite = false;
  material.toneMapped = false;
  material.needsUpdate = true;

  // Hide only the competing additive projection layers. Labels and normal
  // museum geometry remain untouched.
  root.traverse?.((node) => {
    if (!node?.isMesh || node === field || !node.material) return;
    if (node.material.blending === THREE.AdditiveBlending) node.visible = false;
  });

  // Keep the room aware that a projector exists, but reduce the synthetic cast
  // so it does not bleach the authored image/video.
  root.traverse?.((node) => {
    if (node?.isPointLight && Number(node.intensity || 0) > 0.7) node.intensity = 0.35;
  });

  return field;
}

const originalBuildEntity = MuseumSceneKit.prototype._buildEntity;
MuseumSceneKit.prototype._buildEntity = function authoredProjectionBuild(entity, context) {
  const built = originalBuildEntity.call(this, entity, context);
  if (built?.object && entity?.kind === 'PROJECTION' && entity.content?.media?.authored === true) {
    cleanAuthoredProjection(built.object, entity.size);
  }
  return built;
};

window.__MUSEUM_AUTHORED_PROJECTION = { findProjectionSurface, cleanAuthoredProjection };
