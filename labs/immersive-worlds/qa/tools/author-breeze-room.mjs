#!/usr/bin/env node
/**
 * Author the Breeze room into the Museum world graph.
 *
 * The room stops being an isolated nested-runtime experiment here: a Space with
 * bounds, a doorway from Galería B, a work that can be named and focused, and a
 * chapter of Tour Stops appended to the existing guided route. After this the
 * installation is reachable the way any other room is — walk the route, and you
 * arrive.
 *
 * SPATIAL DESIGN, and why the coordinates look the way they do
 *
 * The installation has its own geometry and it is not negotiable: Venus stands
 * at the donor's origin, the cloth is released at x = −10 and is carried by the
 * wind toward +x, and the donor's own establishing camera sits at (−13, 2.5,
 * −11.5) looking at (0, 5.3, 0). Re-deriving those numbers would be inventing a
 * different artwork.
 *
 * So the Museum room is authored *around* them. `metadata.roomOrigin` is the
 * Museum-space position of the installation's origin — the point where Venus
 * stands — and the guest subtracts it from any pose the Director sends. One
 * documented translation, applied in one place, instead of two coordinate
 * systems that drift.
 *
 *   ENTRY              west end, arriving from Galería B
 *   CENTRAL SCULPTURE  Venus, at roomOrigin
 *   CLOTH FLOW         west → east, past the sculpture
 *   VIEWING POSITION   south-west, the donor's establishing angle
 *   GUIDE STAGING      beside the visitor on entry, aside for the hero moment
 *   EXIT / RETURN      back through the same doorway
 *
 * The route is extended, never rewritten: one chapter is appended, and no
 * existing step, chapter or portal is touched. Galería A, Galería B, Crossing B
 * and every approved stop stay exactly as they are.
 *
 * Idempotent — running it twice changes nothing.
 *
 *   node qa/tools/author-breeze-room.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const WORLD = path.join(MODULE_ROOT, 'worlds', 'museum-v1.world.json');

/** Museum-space position of the installation's origin (where Venus stands). */
const ROOM_ORIGIN = [60, 0, -10];
/** Installation-space → Museum-space. */
const M = (x, y, z) => [
  +(x + ROOM_ORIGIN[0]).toFixed(3),
  +(y + ROOM_ORIGIN[1]).toFixed(3),
  +(z + ROOM_ORIGIN[2]).toFixed(3)
];

const world = JSON.parse(await fs.readFile(WORLD, 'utf8'));
const upsert = (list, record) => {
  const i = list.findIndex((r) => r.id === record.id);
  if (i >= 0) list[i] = record; else list.push(record);
};
const push = (list, id) => { if (!list.includes(id)) list.push(id); };

/* ── The Space ───────────────────────────────────────────────────────── */
upsert(world.spaces, {
  id: 'space.breeze',
  title: 'Sala Breeze — Viento sobre mármol',
  type: 'GALLERY',
  // Large enough to contain the whole flight of the cloth, which travels far
  // past the sculpture before it is released again.
  bounds: { size: [46, 14, 34], origin: [42, 0, -27] },
  sceneProfile: 'dark-exhibition',
  lightingProfile: 'museum-low-light',
  ambience: 'ambience.dark-room',
  defaultSpawnAnchorId: 'anchor.breeze.arrive-from-gallery-b',
  entityRefs: ['entity.installation.viento-sobre-marmol'],
  anchorRefs: [
    'anchor.breeze.arrive-from-gallery-b',
    'anchor.breeze.door-gallery-b',
    'anchor.breeze.venus',
    'anchor.breeze.guide-entrada',
    'anchor.breeze.guide-venus',
    'anchor.breeze.guide-cierre',
    'anchor.breeze.visitor-hero'
  ],
  hotspotRefs: [],
  portalRefs: ['portal.breeze-gallery-b'],
  metadata: {
    // What tells the app this Space is presented by a nested runtime rather than
    // by the Museum's own renderer, and where that runtime's origin sits.
    nestedRuntime: 'room.breeze',
    roomOrigin: ROOM_ORIGIN
  }
});

/* ── Anchors ─────────────────────────────────────────────────────────── */
const anchors = [
  {
    id: 'anchor.breeze.arrive-from-gallery-b', kind: 'SPAWN',
    position: M(-16, 0, -12), normal: [1, 0, 0],
    label: 'Llegada a la sala Breeze'
  },
  {
    id: 'anchor.breeze.door-gallery-b', kind: 'WALL',
    position: M(-18, 0, -12), normal: [1, 0, 0],
    label: 'Paso a la Galería B'
  },
  {
    // The normal is the axis the room is meant to be seen along: the donor's own
    // establishing camera sits at (−13, 2.5, −11.5) in installation space, and
    // Museum framing composes a subject from its anchor's normal. Pointing this
    // anywhere else frames the sculpture from a side the artwork was never
    // designed to be read from — the first run of this room framed Venus from
    // behind and to the right, with the cloth entirely out of shot.
    id: 'anchor.breeze.venus', kind: 'PLINTH',
    position: M(0, 0, 0), normal: [0, 1, 0],
    label: 'Posición de la escultura'
  },
  {
    id: 'anchor.breeze.guide-entrada', kind: 'FLOOR',
    position: M(-12, 0, -10), normal: [1, 0, 0],
    label: 'La guía, al entrar'
  },
  {
    id: 'anchor.breeze.guide-venus', kind: 'FLOOR',
    position: M(-5.5, 0, -5.5), normal: [1, 0, 0],
    label: 'La guía, junto a la escultura'
  },
  {
    id: 'anchor.breeze.guide-cierre', kind: 'FLOOR',
    position: M(-10, 0, -9), normal: [1, 0, 0],
    label: 'La guía, al cerrar'
  },
  {
    // The donor's establishing position, in Museum coordinates. Measured, not
    // guessed: Venus stands ~7 m tall and the cloth is an 8 m sheet released
    // 10 m upwind, so a viewing position closer than this crops both.
    id: 'anchor.breeze.visitor-hero', kind: 'VIEWPOINT',
    position: M(-13, 0, -11.5), normal: [0.75, 0, 0.66],
    label: 'Posición del visitante en el momento central'
  },
  // The doorway on the Galería B side. Placed on that room's east wall so the
  // crossing reads as continuing away from the museum's older rooms.
  {
    id: 'anchor.gallery-b.door-breeze', spaceId: 'space.gallery-b', kind: 'WALL',
    position: [20, 0, -12], normal: [-1, 0, 0],
    label: 'Paso a la sala Breeze'
  }
].map((a) => ({ spaceId: a.spaceId || 'space.breeze', ...a }));
for (const a of anchors) upsert(world.anchors, a);

/* ── The work ────────────────────────────────────────────────────────── */
upsert(world.entities, {
  id: 'entity.installation.viento-sobre-marmol',
  kind: 'OBJECT_3D',
  subtype: 'installation',
  spaceId: 'space.breeze',
  anchorId: 'anchor.breeze.venus',
  // The whole installation, not just the marble: 8 m of cloth crossing a 7 m
  // sculpture. Framing derives from this, so a size that described only the
  // statue pulled the camera in until the cloth was off screen.
  size: [8, 7, 4],
  content: {
    title: 'Viento sobre mármol',
    creator: 'Niklas Niehus',
    year: '2025',
    medium: 'Simulación física en tiempo real · WebGPU',
    description: 'Una tela atraviesa la sala empujada por un campo de viento y encuentra la escultura a su paso. Nada de lo que ocurre está grabado: la caída, el pliegue y el roce se calculan mientras usted mira, y no se repiten igual dos veces.'
  },
  representation: { profile: 'nested-runtime', hints: { runtimeId: 'room.breeze' } },
  interaction: { focusable: true, focusDistance: 17 },
  accessibility: {
    label: 'Viento sobre mármol, Niklas Niehus, 2025',
    description: 'Instalación digital: una réplica de la Venus de Milo, de unos siete metros, y una tela de ocho metros que el viento arrastra hasta rozarla y la deforma al pasar.'
  }
});

/* ── The doorway, both ways ──────────────────────────────────────────── */
upsert(world.portals, {
  id: 'portal.gallery-b-breeze',
  fromSpaceId: 'space.gallery-b',
  toSpaceId: 'space.breeze',
  sourceAnchorId: 'anchor.gallery-b.door-breeze',
  destinationSpawnId: 'anchor.breeze.arrive-from-gallery-b',
  transitionBehaviour: 'CONTINUOUS',
  representationHint: 'OPENING',
  prefetchPolicy: 'ON_APPROACH',
  returnPolicy: 'RETURN_TO_SOURCE',
  accessibilityLabel: 'Paso abierto de la Galería B a la sala Breeze'
});
upsert(world.portals, {
  id: 'portal.breeze-gallery-b',
  fromSpaceId: 'space.breeze',
  toSpaceId: 'space.gallery-b',
  sourceAnchorId: 'anchor.breeze.door-gallery-b',
  destinationSpawnId: 'anchor.gallery-b.arrive-from-gallery-a',
  transitionBehaviour: 'CONTINUOUS',
  representationHint: 'OPENING',
  prefetchPolicy: 'ON_APPROACH',
  returnPolicy: 'RETURN_TO_SOURCE',
  // The counterpart every CONTINUOUS connection needs: without it a cross-room
  // Back out of this room would have no doorway to travel through.
  accessibilityLabel: 'Paso abierto de la sala Breeze a la Galería B'
});

const galleryB = world.spaces.find((s) => s.id === 'space.gallery-b');
push(galleryB.anchorRefs, 'anchor.gallery-b.door-breeze');
push(galleryB.portalRefs, 'portal.gallery-b-breeze');

/* ── The Tour Stops ──────────────────────────────────────────────────── */
/*
 * Guide V1, as authorized: the guide comes in with the visitor, orients them,
 * shares the sculpture — and then steps out of the hero moment entirely. The
 * absence is the design, not a gap: solving guide-versus-cloth depth across two
 * renderers is explicitly out of scope for V1, and a figure standing in front of
 * the collision would ruin the one thing the room exists to show.
 *
 * The stop settles on the collision beat, because `canonicalSettle` takes the
 * LAST CONTEMPLATION beat — so a Back into this room returns the visitor to the
 * hero composition rather than to the doorway.
 */
const steps = [
  {
    id: 'step.12-lleva-breeze',
    chapterId: 'chapter.breeze',
    tourStep: { title: 'Viento sobre mármol' },
    subjectRef: 'space.gallery-b',
    shotIntent: 'LEAD',
    duration: 7,
    guide: { anchorId: 'anchor.gallery-b.guide-cuaderno', aside: true },
    caption: 'Queda una sala más. En ella no hay nada colgado de la pared.'
  },
  {
    id: 'step.13-paso-breeze',
    chapterId: 'chapter.breeze',
    subjectRef: 'space.breeze',
    shotIntent: 'PORTAL',
    duration: 3,
    action: { type: 'ACTIVATE_PORTAL', target: 'portal.gallery-b-breeze' },
    audioCue: 'ambience.dark-room',
    caption: 'Pasamos a la sala del viento.'
  },
  {
    id: 'step.14-venus-llegada',
    chapterId: 'chapter.breeze',
    subjectRef: 'entity.installation.viento-sobre-marmol',
    shotIntent: 'LEAD',
    duration: 8,
    guide: { anchorId: 'anchor.breeze.guide-entrada' },
    caption: 'La escultura es una copia digital de la Venus de Milo, a cinco metros.'
  },
  {
    id: 'step.15-venus-acompanada',
    chapterId: 'chapter.breeze',
    subjectRef: 'entity.installation.viento-sobre-marmol',
    shotIntent: 'ACCOMPANIED',
    duration: 9,
    guide: { anchorId: 'anchor.breeze.guide-venus' },
    caption: 'Mármol quieto. Lo que se mueve llega desde la izquierda.'
  },
  {
    id: 'step.16-tela-aproxima',
    chapterId: 'chapter.breeze',
    subjectRef: 'entity.installation.viento-sobre-marmol',
    shotIntent: 'CONTEMPLATION',
    duration: 10,
    visitor: { anchorId: 'anchor.breeze.visitor-hero' },
    caption: 'El viento no está dibujado: es una fuerza, y la tela la obedece.'
  },
  {
    id: 'step.17-colision',
    chapterId: 'chapter.breeze',
    subjectRef: 'entity.installation.viento-sobre-marmol',
    shotIntent: 'CONTEMPLATION',
    duration: 14,
    visitor: { anchorId: 'anchor.breeze.visitor-hero' },
    caption: 'Al alcanzarla, la tela se pliega sobre el hombro y sigue. No hay dos pasos iguales.'
  },
  {
    id: 'step.18-cierre-breeze',
    chapterId: 'chapter.breeze',
    tourStep: { title: 'Cierre' },
    subjectRef: 'space.breeze',
    shotIntent: 'EXIT',
    duration: 7,
    guide: { anchorId: 'anchor.breeze.guide-cierre' },
    caption: 'Aquí termina el recorrido comentado. Puede quedarse mirando el tiempo que quiera.'
  }
];
for (const s of steps) upsert(world.storySteps, s);

upsert(world.chapters, {
  id: 'chapter.breeze',
  title: 'Viento sobre mármol',
  spaceId: 'space.breeze',
  stepRefs: steps.map((s) => s.id)
});

const route = world.routes.find((r) => r.id === 'route.comentado');
push(route.chapterRefs, 'chapter.breeze');

/*
 * The old closing beat said the tour ended in Galería B. It now ends one room
 * later, so its caption would be telling the visitor something untrue while they
 * are still being led onward. Only the caption changes; the beat, its intent,
 * its duration and its position are untouched.
 */
const oldClose = world.storySteps.find((s) => s.id === 'step.11-cierre');
if (oldClose && /Aquí termina el recorrido/.test(oldClose.caption)) {
  oldClose.caption = 'Queda una sala. Está al fondo, a la derecha.';
  if (oldClose.tourStep) oldClose.tourStep.title = 'Hacia el viento';
}

await fs.writeFile(WORLD, `${JSON.stringify(world, null, 1)}\n`);
console.log('sala Breeze escrita en worlds/museum-v1.world.json');
console.log(`  espacio      space.breeze · roomOrigin ${JSON.stringify(ROOM_ORIGIN)}`);
console.log(`  anclas       ${anchors.length}`);
console.log(`  portales     portal.gallery-b-breeze · portal.breeze-gallery-b`);
console.log(`  paradas      ${steps.length} beats en chapter.breeze`);
console.log(`  ruta         ${route.chapterRefs.join(' → ')}`);
