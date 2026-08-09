/**
 * Museum Scene Kit — architectural builders
 *
 * Construction order follows the img2threejs pass sequence recorded as
 * IW-REF-008 (methodology only, no code taken):
 *
 *   BLOCKOUT → STRUCTURE → FORM → MATERIAL → LIGHTING → INTERACTION
 *
 * This file covers STRUCTURE and FORM: the shell of a room, its openings, its
 * skirting and cove, and the furniture a gallery actually contains.
 *
 * Walls are solid boxes rather than planes so that a doorway has a reveal — the
 * 25 cm of wall thickness you see when you pass through it. It is a small
 * decision that separates "a room" from "four quads facing inward", which is
 * precisely the Unslop failure mode of §24.
 */

import { THREE } from '../../render/render-host.js';

export const WALL_THICKNESS = 0.26;

/**
 * @param {{
 *   size:[number,number,number], origin:[number,number,number],
 *   openings?: {wall:'NORTH'|'SOUTH'|'EAST'|'WEST', offset:number, width:number, height:number}[],
 *   materials: {wall:THREE.Material, floor:THREE.Material, ceiling:THREE.Material, skirting:THREE.Material}
 * }} spec
 * @returns {THREE.Group}
 */
export function buildRoomShell(spec) {
  const { size, origin, openings = [], materials } = spec;
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'room-shell';

  // -- floor & ceiling --------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
  floor.position.set(ox, oy - 0.1, oz);
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.ceiling);
  ceiling.position.set(ox, oy + h + 0.1, oz);
  ceiling.name = 'ceiling';
  group.add(ceiling);

  // -- walls ------------------------------------------------------------------
  // Walls sit *outside* the room bounds. Two adjacent rooms therefore share a
  // 52 cm partition made of two touching leaves instead of two coincident
  // boxes — which is what a building does, and which is also the only way to
  // avoid z-fighting where a doorway lets you see both rooms at once.
  // The 4 mm gap keeps the two leaves' touching faces from becoming coplanar,
  // which would z-fight in exactly the doorway where both rooms are visible.
  const half = WALL_THICKNESS / 2 + 0.004;
  const walls = [
    { id: 'NORTH', length: w, centre: [ox, oy, oz - d / 2 - half], axis: 'x', rotation: 0 },
    { id: 'SOUTH', length: w, centre: [ox, oy, oz + d / 2 + half], axis: 'x', rotation: 0 },
    { id: 'WEST', length: d, centre: [ox - w / 2 - half, oy, oz], axis: 'z', rotation: Math.PI / 2 },
    { id: 'EAST', length: d, centre: [ox + w / 2 + half, oy, oz], axis: 'z', rotation: Math.PI / 2 }
  ];

  for (const wall of walls) {
    const wallOpenings = openings.filter((opening) => opening.wall === wall.id);
    for (const piece of wallSegments(wall.length, h, wallOpenings)) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(piece.width, piece.height, WALL_THICKNESS), materials.wall);
      const along = piece.offset;
      if (wall.axis === 'x') {
        mesh.position.set(wall.centre[0] + along, oy + piece.centreY, wall.centre[2]);
      } else {
        mesh.position.set(wall.centre[0], oy + piece.centreY, wall.centre[2] + along);
        mesh.rotation.y = wall.rotation;
      }
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Skirting: a 12 cm shadow line where wall meets floor. Rooms without it
    // read as untextured boxes no matter how good the materials are.
    for (const piece of wallSegments(wall.length, 0.12, wallOpenings.map((o) => ({ ...o, height: 0.12 })))) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(piece.width, 0.12, WALL_THICKNESS + 0.04), materials.skirting);
      if (wall.axis === 'x') {
        mesh.position.set(wall.centre[0] + piece.offset, oy + 0.06, wall.centre[2]);
      } else {
        mesh.position.set(wall.centre[0], oy + 0.06, wall.centre[2] + piece.offset);
        mesh.rotation.y = wall.rotation;
      }
      group.add(mesh);
    }
  }

  return group;
}

/**
 * Split a wall of the given length into the solid pieces left after its
 * openings are removed, plus the lintel above each opening.
 * @returns {{offset:number, width:number, height:number, centreY:number}[]}
 */
function wallSegments(length, height, openings) {
  const sorted = [...openings].sort((a, b) => a.offset - b.offset);
  const pieces = [];
  let cursor = -length / 2;

  for (const opening of sorted) {
    const left = opening.offset - opening.width / 2;
    const right = opening.offset + opening.width / 2;
    if (left > cursor) {
      const width = left - cursor;
      pieces.push({ offset: cursor + width / 2, width, height, centreY: height / 2 });
    }
    const lintel = height - opening.height;
    if (lintel > 0.01) {
      pieces.push({
        offset: opening.offset,
        width: opening.width,
        height: lintel,
        centreY: opening.height + lintel / 2
      });
    }
    cursor = Math.max(cursor, right);
  }

  if (cursor < length / 2) {
    const width = length / 2 - cursor;
    pieces.push({ offset: cursor + width / 2, width, height, centreY: height / 2 });
  }
  return pieces;
}

/**
 * A cove: a recessed emissive strip near the ceiling that washes the wall.
 * It is the room's only visible light source, which is what keeps the ceiling
 * from being a flat lid.
 */
export function buildCove(size, origin, profile) {
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'cove';

  // The visible strip is dimmer than the light it stands for: a blown-out white
  // bar at the top of every room is a tell, not a lighting design.
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.cove.color).multiplyScalar(profile.cove.emissive ?? 0.5)
  });
  const inset = 0.5;
  const strips = [
    { size: [w - inset * 2, 0.04, 0.09], position: [ox, oy + h - 0.3, oz - d / 2 + inset] },
    { size: [w - inset * 2, 0.04, 0.09], position: [ox, oy + h - 0.3, oz + d / 2 - inset] },
    { size: [0.09, 0.04, d - inset * 2], position: [ox - w / 2 + inset, oy + h - 0.3, oz] },
    { size: [0.09, 0.04, d - inset * 2], position: [ox + w / 2 - inset, oy + h - 0.3, oz] }
  ];
  for (const strip of strips) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...strip.size), material);
    mesh.position.set(...strip.position);
    group.add(mesh);
  }
  return group;
}

/**
 * A framed work: stretcher depth, a frame, an optional mat, and the plate.
 * Depth matters — a painting hanging 4 cm off a wall casts a shadow line, and
 * that shadow is most of what makes it read as an object rather than a decal.
 */
export function buildFramedWork({ size, texture, framed = true, mat = 0, frameMaterial, matMaterial }) {
  const [w, h] = size;
  const group = new THREE.Group();
  group.name = 'framed-work';

  const depth = framed ? 0.055 : 0.032;
  const plateMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: framed ? 0.86 : 0.78,
    metalness: 0
  });

  // An unframed canvas is a solid body with the image on its *front* face; a
  // framed work sits inside its frame. Getting this wrong buries the painting
  // inside its own stretcher.
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(w - mat * 2, h - mat * 2), plateMaterial);
  plate.position.z = framed ? depth / 2 + 0.002 : depth + 0.0015;
  plate.receiveShadow = true;
  group.add(plate);

  if (mat > 0) {
    const matBoard = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth * 0.7), matMaterial);
    matBoard.position.z = depth * 0.35;
    matBoard.castShadow = true;
    matBoard.receiveShadow = true;
    group.add(matBoard);
  }

  if (framed) {
    const bar = 0.045;
    const parts = [
      { size: [w + bar * 2, bar, depth], position: [0, h / 2 + bar / 2, depth / 2] },
      { size: [w + bar * 2, bar, depth], position: [0, -h / 2 - bar / 2, depth / 2] },
      { size: [bar, h, depth], position: [-w / 2 - bar / 2, 0, depth / 2] },
      { size: [bar, h, depth], position: [w / 2 + bar / 2, 0, depth / 2] }
    ];
    for (const part of parts) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...part.size), frameMaterial);
      mesh.position.set(...part.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  } else {
    // Unframed canvas: the stretcher edge is visible and catches the spot.
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, depth),
      new THREE.MeshStandardMaterial({ color: 0xcabfa9, roughness: 0.9 })
    );
    body.position.z = depth / 2;
    body.castShadow = true;
    group.add(body);
  }

  return group;
}

/** Display plinth for three-dimensional work. */
export function buildPlinth({ size = [0.9, 1.05, 0.9], material }) {
  const [w, h, d] = size;
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // A recessed reveal at the base: plinths do not sit flush on a museum floor.
  const reveal = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.05, d - 0.06), material);
  reveal.position.y = 0.025;
  group.add(reveal);
  return group;
}

/**
 * A turned vessel. It is a specific object with a profile curve, chosen over a
 * primitive precisely because "meaningless cubes / generic glowing spheres" is
 * the first thing Constitution §24 rejects.
 */
export function buildVessel({ height = 0.86, material }) {
  const points = [];
  const profile = [
    [0.0, 0.0], [0.19, 0.0], [0.2, 0.03], [0.16, 0.07],
    [0.19, 0.16], [0.26, 0.34], [0.29, 0.52], [0.26, 0.7],
    [0.19, 0.83], [0.15, 0.92], [0.16, 0.97], [0.145, 1.0]
  ];
  for (const [radius, t] of profile) points.push(new THREE.Vector2(radius * height, t * height));

  // LatheGeometry already produces seam-aware normals; recomputing them here
  // would draw a visible line down the side of the pot.
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 72), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Wall label, mounted at the standard 8 cm to the right of a work. */
export function buildLabel({ texture, width = 0.22 }) {
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92, metalness: 0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.62), material);
  mesh.position.z = 0.004;
  return mesh;
}

/** Gallery bench — scale reference and an invitation to stop and look. */
export function buildBench({ length = 1.8, material }) {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.42), material);
  top.position.y = 0.44;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  for (const x of [-length / 2 + 0.18, length / 2 - 0.18]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.34), material);
    leg.position.set(x, 0.22, 0);
    leg.castShadow = true;
    group.add(leg);
  }
  return group;
}

/**
 * Threshold inlay: a change of floor material in a doorway. Small, but it is
 * how a real building tells you that you are crossing from one room to another
 * — a Portal's representation without a single glowing particle.
 */
export function buildThreshold({ width, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.02, WALL_THICKNESS + 0.1), material);
  mesh.position.y = 0.01;
  mesh.receiveShadow = true;
  return mesh;
}

/** Recursively release everything a Space owns. */
export function disposeObject(root) {
  const textures = new Set();
  root.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const material of materials) {
      for (const key of ['map', 'normalMap', 'roughnessMap', 'aoMap', 'emissiveMap']) {
        if (material[key]) textures.add(material[key]);
      }
      material.dispose();
    }
  });
  for (const texture of textures) texture.dispose();
  root.clear?.();
}
