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
  const { size, origin, openings = [], materials, capCeiling = true } = spec;
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'room-shell';

  // -- floor & ceiling --------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
  floor.position.set(ox, oy - 0.1, oz);
  floor.receiveShadow = true;
  group.add(floor);

  // A pitched roof supplies its own ceiling; a flat room needs a lid.
  if (capCeiling) {
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.ceiling);
    ceiling.position.set(ox, oy + h + 0.1, oz);
    ceiling.name = 'ceiling';
    group.add(ceiling);
  }

  // -- walls ------------------------------------------------------------------
  // Each wall sits *inside* its own room's footprint. Two adjacent rooms then
  // share a partition made of two leaves that meet at the boundary plane
  // without ever crossing it.
  //
  // Placing them outside the footprint instead — which is the intuitive
  // reading of "the wall is at the edge of the room" — makes each room's wall
  // stand inside its neighbour. In a two-room world both leaves are white and
  // nobody notices; the moment a dark room adjoins a light one, the dark room's
  // wall appears floating in the middle of the light one.
  const half = WALL_THICKNESS / 2 + 0.004;
  const walls = [
    { id: 'NORTH', length: w, centre: [ox, oy, oz - d / 2 + half], axis: 'x', rotation: 0 },
    { id: 'SOUTH', length: w, centre: [ox, oy, oz + d / 2 - half], axis: 'x', rotation: 0 },
    { id: 'WEST', length: d, centre: [ox - w / 2 + half, oy, oz], axis: 'z', rotation: Math.PI / 2 },
    { id: 'EAST', length: d, centre: [ox + w / 2 - half, oy, oz], axis: 'z', rotation: Math.PI / 2 }
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
 * A pitched roof with a run of skylight bays along the ridge.
 *
 * This is the single largest quality lever in a gallery. A flat lid reads as a
 * box; a pitched roof with daylight coming through it reads as a building, and
 * it is what every serious institutional gallery in the reference set has in
 * common. The glazing is built as alternating solid ribs and glass bays in the
 * upper half of each slope, which is how a real roof light is framed — and it
 * avoids CSG entirely.
 *
 * @param {{
 *   size:[number,number,number], origin:[number,number,number],
 *   rise?:number, bays?:number, materials:Object, profile:Object
 * }} spec
 */
export function buildPitchedRoof({ size, origin, rise = 1.9, bays = 4, materials, profile }) {
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'roof';

  const halfWidth = w / 2;
  const slopeLength = Math.hypot(halfWidth, rise);
  const angle = Math.atan2(rise, halfWidth);
  const thickness = 0.16;

  const glass = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.skylight?.color ?? 0xfffaf0)
      .multiplyScalar(profile.skylight?.intensity ?? 1)
  });

  // Where the glazing sits on the slope: a band near the ridge, never at the eave.
  const bandStart = 0.46;
  const bandEnd = 0.94;
  const margin = Math.min(1.2, d * 0.12);
  const runLength = d - margin * 2;
  const bayPitch = runLength / bays;
  const ribWidth = Math.min(0.42, bayPitch * 0.3);

  const place = (side, t0, t1, z0, z1, material, inset = 0) => {
    const mid = (t0 + t1) / 2;
    const eave = [side * halfWidth, h];
    const dirX = -side * halfWidth / slopeLength;
    const dirY = rise / slopeLength;
    const cx = eave[0] + dirX * slopeLength * mid;
    const cy = eave[1] + dirY * slopeLength * mid;

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLength * (t1 - t0), thickness, z1 - z0),
      material
    );
    mesh.position.set(ox + cx, oy + cy - inset, oz + (z0 + z1) / 2 - d / 2);
    mesh.rotation.z = -side * angle;
    mesh.receiveShadow = true;
    group.add(mesh);
  };

  for (const side of [-1, 1]) {
    // Lower slope: solid, full depth.
    place(side, 0, bandStart, 0, d, materials.roof);
    // End returns, so the glazing band does not run into the gable walls.
    place(side, bandStart, bandEnd, 0, margin, materials.roof);
    place(side, bandStart, bandEnd, d - margin, d, materials.roof);

    for (let i = 0; i < bays; i += 1) {
      const z0 = margin + i * bayPitch;
      const z1 = z0 + bayPitch;
      // Rib between bays.
      if (i > 0) place(side, bandStart, bandEnd, z0 - ribWidth / 2, z0 + ribWidth / 2, materials.roof);
      // The glazing itself, set slightly into the roof plane.
      place(side, bandStart + 0.015, bandEnd - 0.015, z0 + ribWidth / 2, z1 - ribWidth / 2, glass, 0.02);
    }
  }

  // Ridge beam: the line the two slopes meet on.
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, d), materials.roof);
  ridge.position.set(ox, oy + h + rise - 0.04, oz);
  group.add(ridge);

  // Gable ends, so the room is closed above the wall head.
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth, 0);
    shape.lineTo(halfWidth, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    // Double-sided: from inside the room you look at the back of this face.
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.gable);
    gable.position.set(ox, oy + h, oz + side * (d / 2));
    gable.rotation.y = side > 0 ? 0 : Math.PI;
    gable.receiveShadow = true;
    group.add(gable);
  }

  return group;
}

/**
 * Daylight arriving through the roof lights. One soft directional source plus a
 * faint bounce, aimed to rake across the room rather than fall straight down —
 * flat overhead light is what makes a render look like a render.
 */
export function buildSkylightDaylight({ size, origin, rise, profile }) {
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'daylight';

  const key = new THREE.DirectionalLight(
    profile.skylight?.color ?? 0xfff6e6,
    profile.skylight?.daylight ?? 0.55
  );
  key.position.set(ox + w * 0.22, oy + h + rise + 4, oz - d * 0.18);
  key.target.position.set(ox - w * 0.1, oy + 1.2, oz + d * 0.1);
  group.add(key);
  group.add(key.target);

  const fill = new THREE.DirectionalLight(
    profile.skylight?.color ?? 0xfff6e6,
    (profile.skylight?.daylight ?? 0.55) * 0.4
  );
  fill.position.set(ox - w * 0.3, oy + h + rise + 3, oz + d * 0.3);
  fill.target.position.set(ox, oy + 1, oz);
  group.add(fill);
  group.add(fill.target);

  return group;
}

/**
 * Cornice: the shadow line where wall meets roof. Two millimetres of geometry
 * that stop the junction from looking like two planes intersecting.
 */
export function buildCornice({ size, origin, material }) {
  const [w, h, d] = size;
  const [ox, oy, oz] = origin;
  const group = new THREE.Group();
  group.name = 'cornice';
  const depth = 0.1;
  const height = 0.14;

  const pieces = [
    { size: [w + depth * 2, height, depth], position: [ox, oy + h - height / 2, oz - d / 2 - depth / 2] },
    { size: [w + depth * 2, height, depth], position: [ox, oy + h - height / 2, oz + d / 2 + depth / 2] },
    { size: [depth, height, d], position: [ox - w / 2 - depth / 2, oy + h - height / 2, oz] },
    { size: [depth, height, d], position: [ox + w / 2 + depth / 2, oy + h - height / 2, oz] }
  ];
  for (const piece of pieces) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...piece.size), material);
    mesh.position.set(...piece.position);
    group.add(mesh);
  }
  return group;
}

/**
 * A stanchion-and-rope barrier line: posts with a sagging rope between them,
 * standing off the hung wall.
 *
 * It is museum furniture, and it does three things at once — it sets the
 * viewing distance, it gives the floor a rhythm, and it tells the visitor
 * without any UI that the works are not to be touched. The rope sags on a
 * quadratic curve because a straight rope reads as a fence.
 *
 * @param {{from:[number,number,number], to:[number,number,number], material:Object, ropeMaterial:Object, pitch?:number}} spec
 */
export function buildBarrierLine({ from, to, material, ropeMaterial, pitch = 2.3 }) {
  const group = new THREE.Group();
  group.name = 'barrier';

  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const length = start.distanceTo(end);
  if (length < 0.6) return group;

  const count = Math.max(2, Math.round(length / pitch) + 1);
  const postHeight = 0.92;
  const points = [];

  for (let i = 0; i < count; i += 1) {
    const point = start.clone().lerp(end, i / (count - 1));
    points.push(point);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, postHeight, 10), material);
    post.position.set(point.x, point.y + postHeight / 2, point.z);
    post.castShadow = true;
    group.add(post);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.035, 16), material);
    base.position.set(point.x, point.y + 0.018, point.z);
    base.castShadow = true;
    group.add(base);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), material);
    finial.position.set(point.x, point.y + postHeight + 0.02, point.z);
    group.add(finial);
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i].clone().setY(points[i].y + postHeight - 0.06);
    const b = points[i + 1].clone().setY(points[i + 1].y + postHeight - 0.06);
    const sag = a.clone().lerp(b, 0.5);
    sag.y -= a.distanceTo(b) * 0.055;
    const curve = new THREE.QuadraticBezierCurve3(a, sag, b);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.014, 6, false), ropeMaterial);
    rope.castShadow = true;
    group.add(rope);
  }

  return group;
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
  //
  // A work on paper sits deeper still: it is held *behind* the window mount, so
  // its sheet drops back and the board stands in front of it.
  const plateZ = framed ? (mat > 0 ? depth * 0.42 : depth / 2 + 0.002) : depth + 0.0015;
  // With a mount, the sheet runs under the board on every side — a print whose
  // edge stops exactly at the aperture would be a decal, not a sheet of paper.
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(mat > 0 ? w - mat * 0.8 : w, mat > 0 ? h - mat * 0.8 : h),
    plateMaterial
  );
  plate.position.z = plateZ;
  plate.receiveShadow = true;
  group.add(plate);

  if (mat > 0) {
    // A window mount is an aperture, not a lid. Four bars of board leave the
    // image visible and standing 3 mm proud of it, which is where the shadow
    // line along the top of the aperture comes from.
    const board = 0.006;
    const z = plateZ + board / 2 + 0.003;
    const inner = h - mat * 2;
    const bars = [
      { size: [w, mat, board], position: [0, h / 2 - mat / 2, z] },
      { size: [w, mat, board], position: [0, -h / 2 + mat / 2, z] },
      { size: [mat, inner, board], position: [-w / 2 + mat / 2, 0, z] },
      { size: [mat, inner, board], position: [w / 2 - mat / 2, 0, z] }
    ];
    for (const part of bars) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...part.size), matMaterial);
      mesh.position.set(...part.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
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

/**
 * A guide: a standing human presence, deliberately not a character.
 *
 * Three things had to be true at once. It must give real scale, so the height
 * and the proportions are a person's and not an approximation. It must read as
 * *someone* from across a gallery, so it is a solid body with a lathe-turned
 * silhouette rather than a flat cutout or a box assembly. And it must not
 * become the protagonist, so it has no face, no hands, no colour of its own and
 * no animation — everything a videogame would spend to make you look at it is
 * the thing this must not have.
 *
 * A gallery attendant in dark clothing is the reference, not an avatar. What
 * carries the presence is the silhouette and the fact that it is facing the
 * same thing you are.
 *
 * @param {{height?:number, material:THREE.Material, headMaterial:THREE.Material}} spec
 */
export function buildGuideFigure({ height = 1.71, material, headMaterial }) {
  const group = new THREE.Group();
  group.name = 'guide';

  // Profile of a standing figure in a long coat, in units of body height, swept
  // around the vertical axis.
  //
  // The proportions are the whole job. A smooth taper from a wide hem to a
  // narrow head is a chess pawn, which is what this was on the first attempt —
  // it gave scale and no personhood at all. What makes a silhouette read as a
  // person is the waist being clearly narrower than the shoulders, the
  // shoulders being the widest point and ending in a hard horizontal, and the
  // legs being narrow. Real shoulder breadth is about 0.45 m, and at 1.71 m
  // that is what the 0.134 radius here is.
  //
  // Read bottom to top: ankles, calf, the step out where a long coat begins,
  // hip, waist, ribs, chest, shoulder, and the trapezius falling to the neck.
  const profile = [
    [0.000, 0.000], [0.050, 0.002], [0.054, 0.020], [0.062, 0.105],
    [0.058, 0.240], [0.096, 0.252], [0.103, 0.330], [0.100, 0.440],
    [0.087, 0.522], [0.103, 0.602], [0.121, 0.680], [0.133, 0.742],
    [0.132, 0.776], [0.098, 0.802], [0.057, 0.828], [0.045, 0.846],
    [0.000, 0.850]
  ];
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(Math.max(r * height, 0.001), y * height)),
      // Enough segments that the silhouette is smooth in profile; a person seen
      // at gallery distance is read entirely by their outline.
      36
    ),
    material
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // A figure this simple is read almost entirely front-to-back, and a body of
  // revolution is circular in plan. Flattening it slightly gives the silhouette
  // a front and a back, which is most of what makes it face something.
  body.scale.z = 0.74;

  // An egg, not a ball: a sphere on a neck is a mannequin, and the head is the
  // one place a figure this abstract can tip into uncanny. There is no face —
  // the head is the same value as hair all the way round, which is what you see
  // of someone facing away from you anyway, and it keeps the guide from ever
  // looking back at the visitor.
  const head = new THREE.Mesh(new THREE.SphereGeometry(height * 0.066, 22, 16), headMaterial);
  head.position.y = height * 0.928;
  head.scale.set(0.88, 1.2, 0.98);
  head.castShadow = true;
  group.add(head);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.028, height * 0.038, height * 0.05, 14),
    headMaterial
  );
  neck.position.y = height * 0.872;
  group.add(neck);

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
