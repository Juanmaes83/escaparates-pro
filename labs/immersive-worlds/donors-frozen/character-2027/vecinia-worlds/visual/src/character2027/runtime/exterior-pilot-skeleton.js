const OWNER = 'SKELETON';

export const EXTERIOR_PILOT_REGISTRATION_ID = 'skeleton.exterior-character-pilot.v1';
export const EXTERIOR_PILOT_ROUTE = Object.freeze({
  id: 'route.exterior-pilot.core-to-new-lighthouse',
  label: 'Fisher promenade to new lighthouse',
  start: Object.freeze([-8, 9.8]),
  destination: Object.freeze([54.7, 25.7]),
  waypoints: Object.freeze([
    Object.freeze([-8, 9.8]),
    Object.freeze([-8, 7.8]),
    Object.freeze([4, 7.8]),
    Object.freeze([12.5, 8.1]),
    Object.freeze([14.2, 10.35]),
    Object.freeze([16.9, 10.65]),
    Object.freeze([23.5, 9.8]),
    Object.freeze([34, 9.5]),
    Object.freeze([43.5, 9.7]),
    Object.freeze([43.25, 12.75]),
    Object.freeze([44.2, 16.35]),
    Object.freeze([47.1, 20.55]),
    Object.freeze([51.15, 24.05]),
    Object.freeze([54.7, 25.7])
  ]),
  step: Object.freeze({
    id: 'breakwater-access-threshold',
    lower: Object.freeze([43.45, 11.8]),
    upper: Object.freeze([43.3, 12.55]),
    lowerTop: 0.16,
    upperTop: 0.34
  })
});

const walkables = [
  strip('walkable.pilot.promenade.01', [14, 10.4], [24, 10.8], 2.45, 0.16),
  strip('walkable.pilot.promenade.02', [24, 10.8], [34, 10.2], 2.45, 0.16),
  strip('walkable.pilot.promenade.03', [34, 10.2], [44, 10.6], 2.45, 0.16),
  strip('walkable.pilot.promenade.04', [44, 10.6], [53, 9.1], 2.45, 0.16),
  strip('walkable.pilot.breakwater-threshold', [43.45, 11.45], [43.3, 12.7], 1.34, 0.34),
  ramp('walkable.pilot.breakwater-access', [43.3, 12.7], [43, 14.1], 1.34, 0.34, 0.65),
  strip('walkable.pilot.breakwater.01', [43, 14.1], [45, 18], 1.34, 0.65),
  strip('walkable.pilot.breakwater.02', [45, 18], [48, 21.7], 1.34, 0.65),
  strip('walkable.pilot.breakwater.03', [48, 21.7], [52, 24.7], 1.34, 0.65),
  strip('walkable.pilot.breakwater.04', [52, 24.7], [57, 27.3], 1.34, 0.65),
  disc('walkable.pilot.lighthouse-apron', [57, 27.3], 1.15, 0.65)
];

const colliders = [
  aabb('collider.pilot.lighthouse-base', 56.18, 57.82, 26.48, 28.12, 0.65, 3.1),
  aabb('collider.pilot.prom-sign', 42.65, 43.35, 8.45, 9.15, 0.16, 2.0),
  aabb('collider.pilot.prom-bench.01', 23.75, 25.15, 10.72, 11.38, 0.16, 1.05),
  aabb('collider.pilot.prom-bench.02', 32.25, 33.65, 10.72, 11.38, 0.16, 1.05)
];

export function mountExteriorPilotSkeleton(collision) {
  if (!collision?.registerWorldSlice) throw new Error('Exterior pilot requires the canonical VECINIA Skeleton port');
  return collision.registerWorldSlice({
    registrationId: EXTERIOR_PILOT_REGISTRATION_ID,
    owner: OWNER,
    bounds: { x0: -26, x1: 60, z0: -35, z1: 30 },
    walkables,
    colliders
  });
}

function strip(proposalId, from, to, width, top) {
  return { proposalId, owner: OWNER, shape: 'ORIENTED_STRIP', from, to, width, top };
}

function ramp(proposalId, from, to, width, fromTop, toTop) {
  return { proposalId, owner: OWNER, shape: 'RAMP_STRIP', from, to, width, fromTop, toTop, top: Math.max(fromTop, toTop) };
}

function disc(proposalId, center, radius, top) {
  return { proposalId, owner: OWNER, shape: 'DISC', center, radius, top };
}

function aabb(proposalId, x0, x1, z0, z1, bottom, top) {
  return { proposalId, owner: OWNER, shape: 'AABB', x0, x1, z0, z1, bottom, top };
}
