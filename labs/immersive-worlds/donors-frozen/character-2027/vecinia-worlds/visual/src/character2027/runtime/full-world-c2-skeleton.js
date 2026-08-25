const OWNER = 'SKELETON';

export const FULL_WORLD_C2_REGISTRATION_ID = 'skeleton.full-world-rollout.c2.v1';

const CIVIC_STAIR_COUNT = 26;
const civicStair = Array.from({ length: CIVIC_STAIR_COUNT }, (_, index) => {
  const t = (index + 1) / CIVIC_STAIR_COUNT;
  return {
    center: [-10 + 9.5 * t, -5 - t],
    top: 4.5 * t
  };
});

export const FULL_WORLD_C2_SECTORS = Object.freeze([
  sector('urban-core', 'CONNECTED_EXISTING', 'Legacy streets and old-town platforms'),
  sector('fisher-square', 'CONNECTED_EXISTING', 'Kimi square and visible cobble approach'),
  sector('promenade', 'CONNECTED_EXISTING', 'B+C promenade spine'),
  sector('coastal-road', 'CONNECTED_C2', 'Visible eastbound public road'),
  sector('coastal-park', 'CONNECTED_C2', 'Visible park ground and paved access'),
  sector('beach-boardwalk', 'CONNECTED_C2', 'Visible timber beach access only'),
  sector('marina-port-water', 'INTENTIONALLY_INACCESSIBLE', 'Open water, boats and isolated service pier'),
  sector('breakwater-lighthouse', 'CONNECTED_EXISTING', 'B+C threshold, ramp and public breakwater'),
  sector('old-town-climb', 'CONNECTED_EXISTING', 'Visible platforms, steps and mirador steps'),
  sector('sierra-residential', 'CONNECTED_EXISTING', 'Visible hillside ramp, road and villa drives'),
  sector('casa-a-approach', 'CONNECTED_C2', 'Promenade to exterior threshold; no Crossing'),
  sector('tabarca', 'INTENTIONALLY_INACCESSIBLE', 'Decorative offshore destination'),
  sector('open-sea', 'INTENTIONALLY_INACCESSIBLE', 'SEA is not walkable')
]);

export const FULL_WORLD_C2_ROUTES = deepFreeze({
  wave1Coast: route('route.c2.wave1.coast-city-lighthouse', 'Wave 1 coast and city', Math.PI / 2, [
    [-10, 5.6], [-7.5, 6.8], [-4.5, 8.8], [-2, 9.8],
    [4, 7.8], [12.1, 8.1], [14.2, 10.35], [16.9, 10.65], [23.5, 9.8],
    [34, 9.5], [43.5, 9.7], [43.25, 12.75], [44.2, 16.35], [47.1, 20.55],
    [51.15, 24.05], [54.7, 25.7]
  ], ['fisher-square', 'urban-core', 'promenade', 'breakwater-lighthouse']),
  wave1Park: route('route.c2.wave1.road-park', 'Wave 1 coastal road and park', Math.PI / 2, [
    [14.2, 10.35], [18, 10.35], [18, 6.05], [19, 7.1], [21, 7.2], [23, 6.8],
    [23, 5.7], [31, 4.7], [31, 2.55], [31, 0.4]
  ], ['promenade', 'coastal-road', 'coastal-park']),
  wave1Boardwalk: route('route.c2.wave1.beach-boardwalk', 'Wave 1 beach boardwalk', 0, [
    [31, 10.3], [31, 11.55], [31, 14.2], [31, 17.6]
  ], ['promenade', 'beach-boardwalk']),
  wave2Sierra: route('route.c2.wave2.oldtown-sierra', 'Wave 2 old town to Sierra villa approach', -0.9, [
    [-10, 5.5], [-11.5, 5.5], [-11.5, 1.75], [-11.5, -5], [-10, -5],
    ...civicStair.map((step) => step.center), [-0.5, -6], [0, -10],
    [-2, -13.25], [-4, -16.5], [-6, -19.75], [-8, -23],
    [-15.8, -23.2], [-15.8, -25.7]
  ], ['fisher-square', 'old-town-climb', 'sierra-residential']),
  wave3CasaA: route('route.c2.wave3.casa-a-approach', 'Wave 3 Casa A exterior approach', Math.PI / 2, [
    [-8, 9.8], [-8, 7.8], [0, 7.8], [4, 7.8], [4.9, 9.8]
  ], ['promenade', 'casa-a-approach'])
});

const walkables = [
  strip('walkable.c2.coastal-road.01', [14, 6.3], [23, 5.7], 3.3, 0.12),
  strip('walkable.c2.coastal-road.02', [23, 5.7], [33, 4.5], 3.3, 0.12),
  strip('walkable.c2.coastal-road.03', [33, 4.5], [43, 4], 3.3, 0.12),
  strip('walkable.c2.coastal-road.04', [43, 4], [55, 1.8], 3.3, 0.12),
  ramp('walkable.c2.prom-road-link', [18, 10.4], [18, 6.05], 1.45, 0.16, 0.12),
  ramp('walkable.c2.park-access', [31, 4.7], [31, 2.55], 1.45, 0.12, 0.18),
  strip('walkable.c2.park-central', [26.2, 0.4], [35.8, 0.4], 2.2, 0.18),
  strip('walkable.c2.park-cross', [31, -1.9], [31, 2.7], 1.4, 0.18),
  strip('walkable.c2.beach-boardwalk', [31, 11.55], [31, 18.2], 1.6, 0.2),
  ...civicStair.map((step, index) => ({
    proposalId: `walkable.c2.oldtown-civic-stair.${String(index + 1).padStart(2, '0')}`,
    owner: OWNER,
    shape: 'AABB',
    x0: step.center[0] - 0.32,
    x1: step.center[0] + 0.32,
    z0: step.center[1] - 0.7,
    z1: step.center[1] + 0.7,
    top: step.top
  }))
];

const colliders = [
  aabb('collider.c2.park-bench.west', 27.95, 28.65, -0.4, 1.2, 0.18, 1.05),
  aabb('collider.c2.park-bench.east', 33.35, 34.05, -0.4, 1.2, 0.18, 1.05),
  ...[[28.9, -0.75], [28.9, 1.55], [33.1, -0.75], [33.1, 1.55]].map(([x, z], index) =>
    aabb(`collider.c2.park-pergola-post.0${index + 1}`, x - 0.12, x + 0.12, z - 0.12, z + 0.12, 0.18, 2.65)),
  aabb('collider.c2.road-car.01', 20.1, 21.9, 5.4, 6.6, 0.12, 1.25),
  aabb('collider.c2.road-car.02', 33.1, 34.9, 3.8, 5, 0.12, 1.25),
  aabb('collider.c2.road-car.03', 45.1, 46.9, 2.9, 4.1, 0.12, 1.25),
  aabb('collider.c2.road-car.04', 50.1, 51.9, 1.9, 3.1, 0.12, 1.25)
];

export function mountFullWorldC2Skeleton(collision) {
  if (!collision?.registerWorldSlice) throw new Error('C2 requires the canonical VECINIA Skeleton port');
  return collision.registerWorldSlice({
    registrationId: FULL_WORLD_C2_REGISTRATION_ID,
    owner: OWNER,
    walkables,
    colliders
  });
}

function route(id, label, yaw, waypoints, sectors) {
  return { id, label, yaw, start: waypoints[0], destination: waypoints.at(-1), waypoints, sectors };
}

function sector(id, status, evidence) { return Object.freeze({ id, status, evidence }); }
function strip(proposalId, from, to, width, top) { return { proposalId, owner: OWNER, shape: 'ORIENTED_STRIP', from, to, width, top }; }
function ramp(proposalId, from, to, width, fromTop, toTop) { return { proposalId, owner: OWNER, shape: 'RAMP_STRIP', from, to, width, fromTop, toTop, top: Math.max(fromTop, toTop) }; }
function aabb(proposalId, x0, x1, z0, z1, bottom, top) { return { proposalId, owner: OWNER, shape: 'AABB', x0, x1, z0, z1, bottom, top }; }

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
