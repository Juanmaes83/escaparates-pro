/**
 * Museum / Institutional Scene Kit
 *
 * The first vertical (IW-DEC-005). This file is the *only* place in the module
 * where semantic records become geometry, and it implements the contract in
 * engine/scenekit/scene-kit.js without the engine knowing any of it.
 *
 * What this kit decides:  rooms, materials, lighting, how an ARTWORK looks,
 *                          what a Portal's DOOR hint becomes, how a focus is
 *                          framed against real geometry.
 * What it must never do:   own World State, invent Actions, write the camera,
 *                          decide route semantics.
 *
 * Swap this file for a Showroom kit and the same World data becomes a product
 * showroom. That is the entire thesis of the module, expressed as a boundary.
 */

import { THREE } from '../../render/render-host.js';
import { RoomEnvironment } from '../../vendor/three/addons/environments/RoomEnvironment.js';
import { SceneKit } from '../../engine/scenekit/scene-kit.js';
import { ENTITY_KIND, HOTSPOT_STATE, REPRESENTATION_HINT } from '../../engine/schema/types.js';
import { framePose, overviewPose, vec3 } from '../../engine/camera/framing.js';
import { profileFor } from './profiles.js';
import {
  artworkTexture, createGeneratedVideoTexture, floorTexture, labelTexture, plasterTexture,
  projectionMask, projectionFloorMask, projectionTextTexture
} from './textures.js';
import {
  WALL_THICKNESS, buildBarrierLine, buildBench, buildCornice, buildCove, buildFramedWork,
  buildLabel, buildPitchedRoof, buildPlinth, buildProjection, buildRoomShell,
  buildSkylightDaylight, buildThreshold, buildVessel, disposeObject
} from './builders.js';
import { GUIDE_DESIGNS, buildGuideFigure, buildVisitorFigure, guideMaterials } from './guide.js';

/**
 * Metres per second. An unhurried gallery pace — a guide walking a visitor to
 * the next work is not commuting. Authored step durations are matched to it.
 */
const GUIDE_WALK_SPEED = 1.05;

/** Plinth height used for sculpture staging and framing. One number, one meaning. */
const PLINTH_HEIGHT = 1.02;

/** A subject that stands on the floor rather than hanging on a wall. */
function isFloorAnchor(anchor) {
  return anchor.normal[1] > 0.5 || (anchor.normal[0] === 0 && anchor.normal[2] === 0);
}

export class MuseumSceneKit extends SceneKit {
  /**
   * @param {{
   *   renderHost:import('../../render/render-host.js').RenderHost,
   *   mediaLoader?:import('../../render/media-loader.js').MediaLoader
   * }} deps
   */
  constructor({ renderHost, mediaLoader = null }) {
    super('museum');
    this.renderHost = renderHost;
    this.mediaLoader = mediaLoader;
    /** @type {Map<string, string>} entityId -> media src currently held */
    this._mediaRefs = new Map();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0908);

    /** @type {Map<string, {group:THREE.Group, space:object, spots:THREE.SpotLight[], profile:object, entities:Map<string,THREE.Object3D>, hotspotMarks:Map<string,THREE.Mesh>, blockers:object[]}>} */
    this._spaces = new Map();
    /** @type {Map<string, {position:number[], normal:number[]}>} */
    this._anchorPoses = new Map();
    /** @type {Map<string, {size:number[], object:THREE.Object3D, anchorId:string}>} */
    this._entityIndex = new Map();
    /** @type {{update:(t:number)=>void, dispose:()=>void}[]} */
    this._animated = [];

    this._environment = null;
    this._focusedEntityId = null;

    /**
     * The guide. One figure for the whole building, moved between stagings,
     * because a museum has a guide accompanying you rather than an identical
     * attendant standing in every room.
     * @type {{object:THREE.Object3D, target:{position:number[], yaw:number, opacity:number}, current:{position:number[], yaw:number, opacity:number}, staging:object|null}|null}
     */
    this._guide = null;
    this._visitor = null;
    /** Which guide design language is built. Review-time choice, not product state. */
    this._guideDesign = 'B';
  }

  /* == environment ========================================================== */

  _ensureEnvironment(quality) {
    if (this._environment || !quality.environmentIBL) return;
    const pmrem = new THREE.PMREMGenerator(this.renderHost.renderer);
    this._environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this._environment;
    pmrem.dispose();
  }

  /* == lifecycle ============================================================ */

  /** @param {import('../../engine/schema/types.js').Space} space */
  async buildSpace(space, ctx) {
    this._ensureEnvironment(ctx.quality);

    const profile = profileFor(space.sceneProfile);
    const rng = ctx.rng.fork(space.id);
    const [w, h, d] = space.bounds.size;
    const origin = space.bounds.origin;

    // Anchors are authored in world coordinates for this kit; resolving them here
    // keeps the engine free of any assumption about how a kit lays out its rooms.
    //
    // A WALL anchor is authored against the *room*, at the plane its bounds
    // describe. The built wall has thickness and stands inside that plane, so
    // the kit projects the anchor onto the surface a visitor can actually see.
    // Authors keep writing clean room coordinates; the kit reconciles them with
    // the building it made.
    for (const anchor of ctx.store.anchorsOf(space.id)) {
      const normal = anchor.normal ? vec3.normalize(anchor.normal) : [0, 0, 1];
      this._anchorPoses.set(anchor.id, {
        position: anchor.kind === 'WALL'
          ? projectOntoWallSurface(anchor.position, normal, space.bounds)
          : [...anchor.position],
        normal
      });
    }

    const textureScale = ctx.quality.textureScale;
    const plaster = plasterTexture(rng, { size: Math.round(256 * textureScale) || 128, contrast: 9 });
    plaster.repeat.set(w / 2.2, h / 2.2);
    const ground = floorTexture(rng, {
      size: Math.round(512 * textureScale) || 256,
      planks: space.sceneProfile === 'heritage' ? 9 : 0
    });
    ground.repeat.set(w / 3, d / 3);

    const materials = {
      wall: new THREE.MeshStandardMaterial({
        color: profile.wall.color, roughness: profile.wall.roughness, metalness: 0,
        roughnessMap: plaster, bumpMap: plaster, bumpScale: 0.012
      }),
      floor: new THREE.MeshStandardMaterial({
        color: profile.floor.color, roughness: profile.floor.roughness,
        metalness: profile.floor.metalness, roughnessMap: ground, bumpMap: ground, bumpScale: 0.008
      }),
      ceiling: new THREE.MeshStandardMaterial({ color: profile.ceiling.color, roughness: profile.ceiling.roughness }),
      skirting: new THREE.MeshStandardMaterial({ color: profile.skirting.color, roughness: profile.skirting.roughness }),
      frame: new THREE.MeshStandardMaterial({ color: space.sceneProfile === 'dark-exhibition' ? 0x2c2823 : 0x6a5942, roughness: 0.55, metalness: 0.12 }),
      mat: new THREE.MeshStandardMaterial({ color: 0xeee8dc, roughness: 0.95 }),
      plinth: new THREE.MeshStandardMaterial({ color: space.sceneProfile === 'dark-exhibition' ? 0x1d1b18 : 0xe2ddd3, roughness: 0.85 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x726657, roughness: 0.78, metalness: 0 }),
      timber: new THREE.MeshStandardMaterial({
        color: space.sceneProfile === 'dark-exhibition' ? 0x3a3128 : 0x8a7355,
        roughness: 0.68
      }),
      metal: new THREE.MeshStandardMaterial({ color: 0x4b463f, roughness: 0.45, metalness: 0.7 }),
      cornice: new THREE.MeshStandardMaterial({ color: profile.ceiling.color, roughness: 0.85 }),
      // The underside of a roof is lit almost entirely by bounce. Without a
      // little self-illumination it renders as a black lid over a bright room,
      // which is the opposite of what a top-lit gallery looks like.
      roof: new THREE.MeshStandardMaterial({
        color: profile.ceiling.color, roughness: 0.94, side: THREE.DoubleSide,
        emissive: new THREE.Color(profile.ceiling.color).multiplyScalar(0.12)
      }),
      gable: new THREE.MeshStandardMaterial({
        color: profile.wall.color, roughness: 0.95, side: THREE.DoubleSide,
        emissive: new THREE.Color(profile.wall.color).multiplyScalar(0.06)
      }),
      post: new THREE.MeshStandardMaterial({ color: profile.barrier?.post ?? 0x2b2823, roughness: 0.38, metalness: 0.55 }),
      rope: new THREE.MeshStandardMaterial({ color: profile.barrier?.rope ?? 0x8d8477, roughness: 0.92 }),
      threshold: new THREE.MeshStandardMaterial({ color: 0x8d8375, roughness: 0.4, metalness: 0.15 })
    };

    const group = new THREE.Group();
    group.name = `space:${space.id}`;
    group.visible = false;

    const openings = this._openingsFor(space, ctx.store);
    const roof = { ...(profile.roof || { profile: 'flat' }) };
    if (space.metadata?.roof) roof.profile = space.metadata.roof;
    const pitched = roof.profile === 'pitched-skylight';

    group.add(buildRoomShell({
      size: space.bounds.size, origin, openings, materials, capCeiling: !pitched
    }));

    if (pitched) {
      const rise = roof.rise ?? 1.9;
      group.add(buildPitchedRoof({
        size: space.bounds.size, origin, rise, bays: roof.bays ?? 4, materials, profile
      }));
      group.add(buildSkylightDaylight({ size: space.bounds.size, origin, rise, profile }));
      group.add(buildCornice({ size: space.bounds.size, origin, material: materials.cornice }));
    } else {
      group.add(buildCove(space.bounds.size, origin, profile));
    }

    // Ambient fill. Two soft sources, not a uniform wash — Constitution §24
    // rejects "identical lighting everywhere".
    const hemisphere = new THREE.HemisphereLight(
      profile.ambient.sky, profile.ambient.ground, profile.ambient.intensity
    );
    hemisphere.position.set(origin[0], origin[1] + h, origin[2]);
    group.add(hemisphere);

    // Bounce: a floor this bright throws light back up. Without it the roof
    // structure above the wall head goes dead.
    const bounce = new THREE.HemisphereLight(
      profile.floor.color, profile.ceiling.color, profile.ambient.intensity * 0.5
    );
    bounce.position.set(origin[0], origin[1], origin[2]);
    group.add(bounce);

    // Two cove washes rather than one central lamp: a single point source in
    // the middle of a ceiling produces exactly the uniform, directionless light
    // that makes a room read as a box.
    for (const offset of [-d * 0.26, d * 0.26]) {
      const coveWash = new THREE.PointLight(
        profile.cove.color, profile.cove.intensity, Math.max(w, d) * 1.3, 2
      );
      coveWash.position.set(origin[0], origin[1] + h - 0.5, origin[2] + offset);
      group.add(coveWash);
    }

    // A low wash across the circulation floor. In a dark room this is what tells
    // a visitor that there is a floor, where it goes, and where the room ends —
    // information that raising exposure would destroy along with the darkness.
    if (profile.floorWash) {
      const wash = new THREE.SpotLight(
        profile.floorWash.color, profile.floorWash.intensity,
        Math.max(w, d) * 1.4, profile.floorWash.angle ?? 0.9, 1, 1.1
      );
      // Off-centre and off-axis: a symmetric pool in the middle of a room reads
      // as a stage light, which is the opposite of ambient orientation.
      wash.position.set(origin[0] + w * 0.12, origin[1] + h - 0.35, origin[2] - d * 0.1);
      wash.target.position.set(origin[0] - w * 0.05, origin[1], origin[2] + d * 0.12);
      group.add(wash);
      group.add(wash.target);
    }

    // A grazing light along one wall gives the room an edge, so its far corner
    // separates from its far wall instead of both dissolving into the same black.
    if (profile.graze) {
      const graze = new THREE.SpotLight(
        profile.graze.color, profile.graze.intensity, d * 1.2, 0.5, 0.9, 1.6
      );
      graze.position.set(origin[0] - w / 2 + 0.35, origin[1] + h - 0.3, origin[2] + d / 2 - 0.5);
      graze.target.position.set(origin[0] - w / 2 + 0.25, origin[1] + 1.4, origin[2] - d / 2 + 0.5);
      group.add(graze);
      group.add(graze.target);
    }

    // Doorway reveals get their own soft light so a portal reads as a way through.
    for (const opening of openings) {
      const threshold = buildThreshold({ width: opening.width, material: materials.threshold });
      threshold.position.set(opening.worldPosition[0], origin[1], opening.worldPosition[2]);
      if (opening.wall === 'EAST' || opening.wall === 'WEST') threshold.rotation.y = Math.PI / 2;
      group.add(threshold);
    }

    const spots = [];
    const entities = new Map();
    const blockers = [];
    let shadowBudget = ctx.quality.maxShadowCasters;

    // Resolve every declared image and video before a single wall is hung, so
    // an entity is built once with its real content rather than built with a
    // placeholder and patched afterwards.
    const media = await this._preloadMedia(space, ctx);

    for (const entity of ctx.store.entitiesOf(space.id)) {
      const built = this._buildEntity(entity, { space, profile, materials, rng, ctx, media });
      if (!built) continue;
      group.add(built.object);
      entities.set(entity.id, built.object);
      this._entityIndex.set(entity.id, { size: entity.size, object: built.object, anchorId: entity.anchorId });
      if (built.blocker) blockers.push(built.blocker);

      if (built.lit) {
        const spot = this._buildSpot(entity, profile, space, shadowBudget > 0);
        if (spot) {
          if (shadowBudget > 0 && ctx.quality.shadows) shadowBudget -= 1;
          group.add(spot);
          group.add(spot.target);
          spots.push(spot);
        }
      }
    }

    // Lighting track: the spots need a visible origin, or they read as magic.
    // Only where a gallery actually hangs work — a rail across a small archive
    // is set dressing, and set dressing without a reason is slop.
    if (spots.length >= 3) {
      const track = new THREE.Mesh(
        new THREE.BoxGeometry(w - 1.6, 0.035, 0.035),
        materials.metal
      );
      track.position.set(origin[0], origin[1] + h - 0.18, origin[2] - d / 2 + 1.5);
      group.add(track);
      const track2 = track.clone();
      track2.position.z = origin[2] + d / 2 - 1.5;
      group.add(track2);
    }

    // Furniture: scale reference. A gallery with no bench has no human measure.
    if (space.metadata?.bench) {
      const bench = buildBench({ length: 1.9, material: materials.timber });
      bench.position.set(origin[0] + (space.metadata.bench[0] || 0), origin[1], origin[2] + (space.metadata.bench[1] || 0));
      // A bench faces the work it invites you to sit with. Its seat already runs
      // along X, so facing a north or south wall needs no rotation; facing a
      // side wall does.
      if (space.metadata.benchFacing === 'EAST' || space.metadata.benchFacing === 'WEST') bench.rotation.y = Math.PI / 2;
      group.add(bench);
      blockers.push(boxAround([bench.position.x, bench.position.z], 1.0, 0.35));
    }

    // Barrier lines are derived from where the work actually hangs, not authored
    // by hand: move a painting and the rope follows it.
    if (profile.barrier?.enabled !== false) {
      for (const line of this._barrierLinesFor(space, ctx.store, profile)) {
        group.add(buildBarrierLine({
          from: line.from, to: line.to, material: materials.post, ropeMaterial: materials.rope
        }));
        blockers.push(line.blocker);
      }
    }

    const hotspotMarks = this._buildHotspotMarks(space, ctx.store, profile, group);

    // A room carries its own response to the environment, on its own materials.
    //
    // Leaving this to `scene.environmentIntensity` — one global value taken from
    // whichever room the visitor is standing in — means a dark chamber seen
    // through a doorway from a white cube is lit as if it were the white cube.
    // That is not a subtle tint: environment *specular* is not scaled by albedo,
    // so at the grazing angles you get looking down a floor, Fresnel approaches
    // one and the darkest floor in the building turns into a mirror of a bright
    // studio. The dark room read as a pale grey box, and no amount of roughness
    // or exposure fixed it, because neither was the cause.
    applyEnvironmentResponse(group, profile.envIntensity, this._environment);

    this.scene.add(group);
    return {
      spaceId: space.id, group, space, profile, spots, entities, hotspotMarks, blockers,
      materials, mediaSrcs: [...this._mediaRefs.entries()].filter(([id]) => entities.has(id)).map(([, src]) => src)
    };
  }

  async warmSpace(handle, ctx) {
    this._spaces.set(handle.spaceId, handle);

    // Three.js compiles only what `traverseVisible` reaches. A Space built
    // hidden therefore compiles *nothing*, and the shader cost lands on the
    // first frame the visitor sees — which is exactly the stutter warmup exists
    // to remove. So the group is made visible for the compile and hidden again
    // immediately; it is never rendered in that window.
    //
    // Mechanism adapted from portfolio-itom-and-advanced-WebGL (MIT,
    // © Tomasz Szmajda) — see vendor/REUSE_REGISTER.md.
    if (ctx?.quality?.warmupSpaces === false) return;

    const wasVisible = handle.group.visible;
    handle.group.visible = true;
    try {
      await this.renderHost.warm(this.scene);
    } finally {
      handle.group.visible = wasVisible;
    }
  }

  activateSpace(handle) {
    handle.group.visible = true;
    const profile = handle.profile;
    this.scene.fog = profile.fog
      ? new THREE.Fog(profile.fog.color, profile.fog.near, profile.fog.far)
      : null;
    this.scene.background = new THREE.Color(profile.background);
    // Neutral at scene level: every room already carries its own environment
    // response per material, so that a neighbour seen through a doorway keeps
    // the light it was designed with.
    this.scene.environmentIntensity = 1;
    this.renderHost.renderer.toneMappingExposure = profile.exposure;
  }

  deactivateSpace(handle) {
    handle.group.visible = false;
  }

  /**
   * How present a Space is right now. The lifecycle decides this from the World
   * Graph — a Space one CONTINUOUS portal away is *perceptible*, because you
   * can see through the doorway into it. Without this, every opening in the
   * building is a grey rectangle.
   *
   * @param {'ACTIVE'|'ADJACENT'|'HIDDEN'} presence
   */
  setSpacePresence(handle, presence) {
    if (presence === 'HIDDEN') {
      handle.group.visible = false;
      return;
    }
    handle.group.visible = true;
    // An adjacent room is lit, but its spots do not need to cast shadows the
    // visitor cannot see the source of.
    const adjacent = presence === 'ADJACENT';
    for (const spot of handle.spots) {
      if (adjacent && spot.castShadow) {
        spot.userData.shadowWasOn = true;
        spot.castShadow = false;
      } else if (!adjacent && spot.userData.shadowWasOn) {
        spot.castShadow = true;
      }
    }
  }

  disposeSpace(handle) {
    this.scene.remove(handle.group);
    disposeObject(handle.group);
    // Media is reference-counted: a file hanging in two Spaces survives the
    // disposal of one of them.
    for (const entityId of handle.entities.keys()) {
      const src = this._mediaRefs.get(entityId);
      if (src) {
        this.mediaLoader?.release(src);
        this._mediaRefs.delete(entityId);
      }
      this._entityIndex.delete(entityId);
    }
    this._spaces.delete(handle.spaceId);
    this._animated = this._animated.filter((item) => {
      if (item.spaceId !== handle.spaceId) return true;
      item.dispose();
      return false;
    });
  }

  /* == media ================================================================ */

  /**
   * Resolve every image and video the Space declares.
   *
   * Loads run in parallel and none of them can fail the build: `MediaLoader`
   * already turns an error into a GENERATED fallback, so the worst case is a
   * wall of placeholder plates and a set of `asset:error` events — never a
   * half-built room.
   *
   * @returns {Promise<Map<string, {texture:any, aspect:number|null, kind:string, fallback:boolean}>>}
   */
  async _preloadMedia(space, ctx) {
    const resolved = new Map();
    if (!this.mediaLoader) return resolved;

    const jobs = ctx.store.entitiesOf(space.id)
      .filter((entity) => {
        const media = entity.content?.media;
        return media && media.kind !== 'GENERATED' && media.src;
      })
      .map(async (entity) => {
        const result = await this.mediaLoader.load(entity.content.media, { entityId: entity.id });
        resolved.set(entity.id, result);
        if (!result.fallback && entity.content.media.src) {
          this._mediaRefs.set(entity.id, entity.content.media.src);
        }
      });

    await Promise.all(jobs);
    return resolved;
  }

  /* == barriers ============================================================= */

  /**
   * Where the stanchion lines run, derived from where work actually hangs.
   *
   * Grouping the wall anchors by the wall they sit closest to means an author
   * never places a rope: they place a painting, and the room protects it.
   */
  _barrierLinesFor(space, store, profile) {
    const [w, , d] = space.bounds.size;
    const [ox, oy, oz] = space.bounds.origin;
    const standoff = profile.barrier?.standoff ?? 1.15;
    /** @type {Map<string, number[]>} wall -> positions along that wall */
    const byWall = new Map();

    for (const entity of store.entitiesOf(space.id)) {
      const anchor = store.get(entity.anchorId);
      if (!anchor || anchor.kind !== 'WALL') continue;
      const [ax, , az] = anchor.position;
      const distances = {
        NORTH: Math.abs(az - (oz - d / 2)),
        SOUTH: Math.abs(az - (oz + d / 2)),
        WEST: Math.abs(ax - (ox - w / 2)),
        EAST: Math.abs(ax - (ox + w / 2))
      };
      const wall = Object.entries(distances).sort((a, b) => a[1] - b[1])[0][0];
      // Only guard a wall the anchor is genuinely on.
      if (distances[wall] > 0.6) continue;

      const along = wall === 'NORTH' || wall === 'SOUTH' ? ax : az;
      const half = (entity.size?.[0] ?? 1) / 2;
      const list = byWall.get(wall) || [];
      list.push(along - half, along + half);
      byWall.set(wall, list);
    }

    // 'primary-wall' guards only the wall carrying the most work. A rope in front
    // of every wall stops reading as a museum convention and starts reading as a
    // procedural decoration applied everywhere.
    let walls = [...byWall.entries()];
    if ((profile.barrier?.mode ?? 'primary-wall') === 'primary-wall' && walls.length > 1) {
      walls = [walls.sort((a, b) => span(b[1]) - span(a[1]))[0]];
    }

    const lines = [];
    for (const [wall, positions] of walls) {
      const min = Math.min(...positions) - 0.75;
      const max = Math.max(...positions) + 0.75;
      if (max - min < 1.2) continue;

      const inset = WALL_THICKNESS / 2 + 0.12;
      let from;
      let to;
      let blocker;
      if (wall === 'NORTH' || wall === 'SOUTH') {
        const zLine = wall === 'NORTH' ? oz - d / 2 + standoff : oz + d / 2 - standoff;
        from = [clampAxis(min, ox - w / 2 + inset, ox + w / 2 - inset), oy, zLine];
        to = [clampAxis(max, ox - w / 2 + inset, ox + w / 2 - inset), oy, zLine];
        blocker = { min: [from[0] - 0.2, 0, zLine - 0.2], max: [to[0] + 0.2, 1.2, zLine + 0.2] };
      } else {
        const xLine = wall === 'WEST' ? ox - w / 2 + standoff : ox + w / 2 - standoff;
        from = [xLine, oy, clampAxis(min, oz - d / 2 + inset, oz + d / 2 - inset)];
        to = [xLine, oy, clampAxis(max, oz - d / 2 + inset, oz + d / 2 - inset)];
        blocker = { min: [xLine - 0.2, 0, from[2] - 0.2], max: [xLine + 0.2, 1.2, to[2] + 0.2] };
      }
      lines.push({ from, to, blocker, wall });
    }
    return lines;
  }

  /* == entities ============================================================= */

  _buildEntity(entity, { space, profile, materials, rng, ctx, media }) {
    const anchor = this._anchorPoses.get(entity.anchorId);
    if (!anchor) return null;
    const hints = entity.representation?.hints || {};
    const dark = space.sceneProfile === 'dark-exhibition';

    switch (entity.kind) {
      case ENTITY_KIND.ARTWORK: {
        const [w, h] = entity.size;
        // A loaded file wins; a generated plate is what a wall gets when the
        // institution has not supplied one yet, or when the one it supplied
        // failed to load.
        const loaded = media?.get(entity.id);
        const texture = loaded?.texture || artworkTexture(rng.fork(entity.id), {
          composition: hints.composition || 'field',
          palette: hints.palette || 'umber',
          aspect: w / h,
          resolution: Math.max(Math.round(896 * ctx.quality.textureScale), 320)
        });
        const work = buildFramedWork({
          size: [w, h],
          texture,
          framed: hints.mount !== 'unframed',
          mat: hints.mount === 'paper' ? 0.09 : 0,
          frameMaterial: materials.frame,
          matMaterial: materials.mat
        });
        const group = new THREE.Group();
        group.add(work);

        const label = buildLabel({ texture: labelTexture(entity.content, { dark, width: Math.round(512 * ctx.quality.textureScale) || 256 }) });
        label.position.set(w / 2 + 0.2, -0.06, 0.004);
        group.add(label);

        this._orient(group, anchor);
        return { object: group, lit: true };
      }

      case ENTITY_KIND.SCULPTURE:
      case ENTITY_KIND.OBJECT_3D: {
        const group = new THREE.Group();
        const plinthHeight = hints.plinthHeight ?? 1.02;
        group.add(buildPlinth({ size: [entity.size[0] + 0.35, plinthHeight, entity.size[2] + 0.35], material: materials.plinth }));
        const vessel = buildVessel({ height: entity.size[1], material: materials.stone });
        vessel.position.y = plinthHeight;
        group.add(vessel);

        const label = buildLabel({ texture: labelTexture(entity.content, { dark, width: 384 }), width: 0.2 });
        label.position.set(0, plinthHeight - 0.12, (entity.size[2] + 0.35) / 2 + 0.002);
        group.add(label);

        this._orient(group, anchor, { flat: true });
        return {
          object: group,
          lit: true,
          blocker: boxAround([anchor.position[0], anchor.position[2]], entity.size[0] + 0.5, entity.size[2] + 0.5)
        };
      }

      case ENTITY_KIND.VIDEO: {
        const [w, h] = entity.size;
        const loadedVideo = media?.get(entity.id);
        // A real video file plays through a VideoTexture; without one, the
        // screen still runs — a dead screen in a gallery is worse than a
        // synthetic one.
        const generated = loadedVideo?.texture
          ? { texture: loadedVideo.texture, update: () => {}, dispose: () => {} }
          : createGeneratedVideoTexture(rng.fork(entity.id), { size: 320 });
        this._animated.push({ ...generated, spaceId: space.id, update: generated.update, dispose: generated.dispose });

        const group = new THREE.Group();
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.07), materials.metal);
        bezel.position.z = 0.035;
        bezel.castShadow = true;
        group.add(bezel);
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ map: generated.texture, toneMapped: true })
        );
        panel.position.z = 0.072;
        group.add(panel);

        // A screen is a light source in a dark room: it spills onto the wall
        // around it and onto the floor in front of it.
        const spill = new THREE.PointLight(0xbfae92, 3.4, 5.5, 2);
        spill.position.set(0, 0, 0.7);
        group.add(spill);

        const label = buildLabel({ texture: labelTexture(entity.content, { dark, width: 384 }) });
        label.position.set(w / 2 + 0.2, -0.06, 0.004);
        group.add(label);

        this._orient(group, anchor);
        return { object: group, lit: false };
      }

      case ENTITY_KIND.PROJECTION: {
        const [w, h] = entity.size;
        const p = entity.content.projection || {};
        // Authored as "#rrggbb" in the world file; a projector's lamp colour is
        // something an author picks by eye, not a decimal they compute.
        const tint = p.tint ? new THREE.Color(p.tint).getHex() : 0xb9c6d8;
        const loaded = media?.get(entity.id);
        const source = loaded?.texture
          ? { texture: loaded.texture, update: () => {}, dispose: () => {} }
          : createGeneratedVideoTexture(rng.fork(entity.id), { size: 320 });
        this._animated.push({ ...source, spaceId: space.id, update: source.update, dispose: source.dispose });

        const projection = buildProjection({
          size: [w, h],
          texture: source.texture,
          mask: projectionMask({ aspect: w / h, feather: p.feather ?? 0.16, vignette: p.vignette ?? 0.42 }),
          floorMask: projectionFloorMask({
            aspect: (w * 1.08) / (h * 1.15),
            feather: p.feather ?? 0.16,
            reach: p.reflectionReach ?? 0.72
          }),
          textTexture: p.text ? projectionTextTexture(p.text, { aspect: w / h, scale: p.textScale ?? 0.1 }) : null,
          intensity: p.intensity ?? 1,
          spill: p.spill ?? 1,
          reflection: p.reflection ?? 0.5,
          keystone: p.keystone ?? 0.035,
          tint
        });

        const group = new THREE.Group();
        group.add(projection);

        // The reflection lies on the floor, so it belongs at floor level. Its
        // reach into the room is the builder's business; only the drop from the
        // anchor down to the boards is ours.
        const floorEcho = projection.userData.reflection;
        if (floorEcho) floorEcho.position.y = -anchor.position[1] + 0.014;

        // One real light, so the room is genuinely affected rather than just
        // painted on. Weak and wide: the wall does the work, this only makes
        // the floor and the return walls acknowledge it.
        const cast = new THREE.PointLight(tint, (p.spill ?? 1) * 1.6, 7.5, 2);
        cast.position.set(0, 0, 1.1);
        group.add(cast);

        const label = buildLabel({ texture: labelTexture(entity.content, { dark, width: 384 }) });
        label.position.set(w / 2 + 0.32, -h * 0.34, 0.004);
        group.add(label);

        this._orient(group, anchor);
        return { object: group, lit: false };
      }

      case ENTITY_KIND.AUDIO: {
        // A listening point is a place, not an object. It is marked in the floor
        // and nowhere else — an audio entity that spawned a floating speaker icon
        // would be exactly the slop we are refusing.
        const group = new THREE.Group();
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.44, 0.52, 48),
          new THREE.MeshStandardMaterial({ color: profile.skirting.color, roughness: 0.6, metalness: 0.2 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(anchor.position[0], anchor.position[1] + 0.012, anchor.position[2]);
        group.add(ring);
        return { object: group, lit: false };
      }

      case ENTITY_KIND.TEXT: {
        const [w, h] = entity.size;
        const group = new THREE.Group();
        // A mounted panel, not a floating card: 12 mm of board standing off the
        // wall, so it casts the shadow line that tells you it is an object.
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, 0.012),
          new THREE.MeshStandardMaterial({
            map: labelTexture(
              { title: entity.content.title, creator: entity.content.creator, year: entity.content.year, medium: entity.content.medium },
              { dark, width: 768 }
            ),
            roughness: 0.94
          })
        );
        board.position.z = 0.012;
        board.castShadow = true;
        board.receiveShadow = true;
        group.add(board);
        this._orient(group, anchor);
        return { object: group, lit: true };
      }

      default:
        return null;
    }
  }

  /** Place and rotate a representation so it sits on its anchor, facing out. */
  _orient(object, anchor, { flat = false } = {}) {
    object.position.set(anchor.position[0], anchor.position[1], anchor.position[2]);
    if (flat) return;
    const yaw = Math.atan2(anchor.normal[0], anchor.normal[2]);
    object.rotation.y = yaw;
    // Stand the work off the wall so its shadow line reads.
    object.position.x += anchor.normal[0] * 0.015;
    object.position.z += anchor.normal[2] * 0.015;
  }

  _buildSpot(entity, profile, space, allowShadow) {
    const anchor = this._anchorPoses.get(entity.anchorId);
    if (!anchor) return null;
    const [, roomHeight] = space.bounds.size;
    const spot = new THREE.SpotLight(
      profile.spot.color,
      profile.spot.intensity,
      profile.spot.distance,
      profile.spot.angle,
      profile.spot.penumbra,
      profile.spot.decay
    );
    // On the track, pulled back from the wall so the beam grazes the work.
    spot.position.set(
      anchor.position[0] + anchor.normal[0] * 1.5,
      space.bounds.origin[1] + roomHeight - 0.3,
      anchor.position[2] + anchor.normal[2] * 1.5
    );
    spot.target.position.set(anchor.position[0], anchor.position[1], anchor.position[2]);
    spot.castShadow = allowShadow;
    if (allowShadow) {
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0012;
      spot.shadow.normalBias = 0.02;
      spot.shadow.camera.near = 0.4;
      spot.shadow.camera.far = 12;
    }
    return spot;
  }

  /**
   * Hotspot representation. `visualPolicy` decides whether anything is drawn at
   * all — the semantic state exists either way. Where we do draw, it is a floor
   * inlay at the viewing position, which is a real museum convention, rather
   * than a floating icon.
   */
  /**
   * Floor marks for hotspots, according to the policy the world declares.
   *
   * `visualPolicy` was already authored as NEAR on every hotspot in the museum
   * and the kit only ever tested it against NEVER, so sixteen rings stood
   * permanently on the floors of a building whose data said to show them on
   * approach. That is where the room got its videogame grammar: a grid of
   * waiting circles in front of every work, none of which meant anything until
   * you were standing on one. The policy is now honoured, so the floor is empty
   * until the visitor is somewhere a mark can tell them something.
   *
   * The mark is not the capability. Proximity still raises the HUD prompt and
   * every work is still reachable from the text outline, so nothing that made a
   * hotspot discoverable has been removed along with the ring.
   */
  _buildHotspotMarks(space, store, profile, group) {
    const marks = new Map();
    for (const hotspot of store.hotspotsOf(space.id)) {
      if (hotspot.visualPolicy === 'NEVER') continue;
      const anchorId = hotspot.anchorId || store.require(hotspot.entityId).anchorId;
      const anchor = this._anchorPoses.get(anchorId);
      if (!anchor) continue;

      const material = new THREE.MeshStandardMaterial({
        color: profile.skirting.color,
        roughness: 0.5,
        metalness: 0.3,
        transparent: true,
        opacity: hotspot.visualPolicy === 'ALWAYS' ? 0.14 : 0
      });
      const mark = new THREE.Mesh(new THREE.RingGeometry(0.31, 0.335, 48), material);
      mark.userData.restingOpacity = material.opacity;
      mark.rotation.x = -Math.PI / 2;
      const offset = hotspot.entityId ? 1.15 : 0;
      mark.position.set(
        anchor.position[0] + anchor.normal[0] * offset,
        space.bounds.origin[1] + 0.011,
        anchor.position[2] + anchor.normal[2] * offset
      );
      group.add(mark);
      marks.set(hotspot.id, mark);
    }
    return marks;
  }

  /* == measurement ========================================================== */

  poseForAnchor(anchorId) {
    return this._anchorPoses.get(anchorId) || null;
  }

  navigationVolume(spaceId) {
    const handle = this._spaces.get(spaceId);
    const space = handle?.space;
    if (!space) return { bounds: null, blockers: [] };
    const [w, h, d] = space.bounds.size;
    const [ox, oy, oz] = space.bounds.origin;
    // Walls now stand inside the footprint, so the walkable volume clears the
    // full wall thickness, not half of it.
    const inset = WALL_THICKNESS + 0.12;
    return {
      bounds: {
        min: [ox - w / 2 + inset, oy, oz - d / 2 + inset],
        max: [ox + w / 2 - inset, oy + h, oz + d / 2 - inset]
      },
      blockers: handle.blockers
    };
  }

  framingForEntity(entityId, viewport) {
    const record = this._entityIndex.get(entityId);
    const anchor = record ? this._anchorPoses.get(record.anchorId) : null;
    if (viewport.intent === 'LEAD') {
      // The subject is resolved *before* the lead is framed. It used not to be,
      // and that was the whole defect: the arrival shot was composed on the guide
      // alone and the work it was arriving at never entered the composition.
      const lead = this._leadFraming(viewport, record, anchor);
      if (lead) return lead;
    }
    if (!record || !anchor) {
      return { position: [0, 1.6, 3], target: [0, 1.6, 0], subjectSize: [1, 1, 1] };
    }
    if (viewport.intent === 'ACCOMPANIED') {
      const accompanied = this._accompaniedFraming(record, anchor, viewport);
      if (accompanied) return accompanied;
    }
    if (viewport.intent === 'CONTEMPLATION') {
      const contemplation = this._contemplationFraming(record, anchor, viewport);
      if (contemplation) return contemplation;
    }
    const [w, h] = record.size;
    const detail = viewport.intent === 'DETAIL';

    if (isFloorAnchor(anchor)) {
      // Sculpture.
      //
      // A vessel photographed dead-on is a silhouette: the eye gets an outline
      // and no volume, which is a painting's language applied to an object that
      // is not flat. Swinging the camera off the approach axis turns the form,
      // and lifting it slightly puts the shoulder and the rim into the frame.
      // That is the whole difference between "a picture of a pot" and "a thing
      // standing in a room".
      const approach = this._facingFor(anchor, this._anchorPoses.get(viewport.guideAnchorId)?.position);
      const swing = detail ? 0.62 : 0.26;
      const facing = [
        approach[0] * Math.cos(swing) + approach[2] * Math.sin(swing),
        0,
        -approach[0] * Math.sin(swing) + approach[2] * Math.cos(swing)
      ];
      const centre = this._subjectCentre(anchor, record);
      // The detail beat inspects the *whole* volume from an angle — it is not a
      // macro crop. Framing a fraction of the subject, as a wall work's detail
      // does, put the camera so close that an 88 cm vessel filled the frame and
      // lost its rim, which destroys the very scale the previous beat just
      // established.
      const pose = framePose(
        { position: centre, normal: facing },
        { width: Math.max(w, 0.8) * (detail ? 1.15 : 1), height: h * (detail ? 1.3 : 1.35) },
        viewport,
        { fill: detail ? 0.52 : 0.6, min: 1.4, max: 7 }
      );
      // A little above the rim: a vessel read from dead-on eye level hides its
      // own opening, and the opening is half of what a vessel is.
      if (detail) pose.position[1] += h * 0.22;
      return { ...pose, subjectSize: record.size };
    }

    const pose = framePose(
      { position: anchor.position, normal: anchor.normal },
      { width: w * (detail ? 0.45 : 1), height: h * (detail ? 0.45 : 1) },
      viewport,
      // Deliberately loose: a work that fills the frame edge to edge leaves the
      // wall label nowhere to sit and nothing to breathe against. A gallery hangs
      // work with margin; so does this.
      { fill: detail ? 0.72 : 0.58, min: 0.75, max: 9 }
    );
    return { ...offsetForInset(pose, anchor.normal, viewport), subjectSize: record.size };
  }

  framingForSpace(spaceId, viewport) {
    if (viewport.intent === 'LEAD') {
      const lead = this._leadFraming(viewport);
      if (lead) return lead;
    }
    const handle = this._spaces.get(spaceId);
    const space = handle?.space;
    if (!space) return { position: [0, 1.6, 6], target: [0, 1.6, 0], subjectSize: [1, 1, 1] };
    const spawn = this._anchorPoses.get(space.defaultSpawnAnchorId) || { position: space.bounds.origin, normal: [0, 0, 1] };

    // ENTRY and PORTAL both mean "stand where a visitor arrives and look in".
    if (viewport.intent === 'ENTRY' || viewport.intent === 'PORTAL') {
      return {
        position: [spawn.position[0], space.bounds.origin[1] + 1.62, spawn.position[2]],
        target: [
          spawn.position[0] + spawn.normal[0] * 4,
          space.bounds.origin[1] + 1.5,
          spawn.position[2] + spawn.normal[2] * 4
        ],
        subjectSize: space.bounds.size
      };
    }
    const pose = overviewPose(space.bounds, spawn, viewport, { eyeHeight: 1.68, fill: 0.9 });
    // Keep the observer inside the building.
    //
    // The overview retreats far enough to fit the room's width in frame, which for
    // a twelve-metre gallery is eight metres back from its centre — two metres
    // past the wall. The closing address had been rendering the *outside* of
    // Galería B's east wall: a black frame with a caption over it, and nothing in
    // the state told anyone, because the shot was aimed perfectly at a room it was
    // standing outside of.
    const [bw, bh, bd] = space.bounds.size;
    const [ox, oy, oz] = space.bounds.origin;
    const inset = 0.8;
    pose.position[0] = Math.min(Math.max(pose.position[0], ox - bw / 2 + inset), ox + bw / 2 - inset);
    pose.position[2] = Math.min(Math.max(pose.position[2], oz - bd / 2 + inset), oz + bd / 2 - inset);
    pose.position[1] = Math.min(pose.position[1], oy + bh - 0.4);
    return { ...pose, subjectSize: space.bounds.size };
  }

  /* == presentation state =================================================== */

  setHotspotState(hotspotId, state) {
    for (const handle of this._spaces.values()) {
      const mark = handle.hotspotMarks.get(hotspotId);
      if (!mark) continue;
      const near = state === HOTSPOT_STATE.NEAR || state === HOTSPOT_STATE.ACTIVE;
      // A NEAR-policy mark exists only while the visitor is near it. Its resting
      // opacity is the one it was built with, which for that policy is nothing.
      const resting = mark.userData.restingOpacity ?? 0.14;
      mark.material.opacity = near ? 0.5 : state === HOTSPOT_STATE.VISITED ? resting * 0.6 : resting;
      mark.scale.setScalar(near ? 1.04 : 1);
    }
  }

  /**
   * Authoring cutaway: drop the ceiling and its cove so the author camera can
   * orbit into the room from above. The visitor never sees this state.
   */
  setCutaway(handle, enabled) {
    if (!handle) return;
    handle.group.traverse((node) => {
      const isLid = node.name === 'ceiling' || node.name === 'roof' ||
        node.parent?.name === 'cove' || node.parent?.name === 'roof' ||
        node.parent?.name === 'cornice';
      if (isLid) node.visible = !enabled;
    });
  }

  setEntityFocused(entityId, focused) {
    this._focusedEntityId = focused ? entityId : null;
  }

  /* == guide ================================================================ */

  /**
   * Stage the guide, or dismiss it.
   *
   * `aside` is the whole point of the beat: the guide moves out of the line
   * between the visitor and the work, and turns to face it alongside them. That
   * displacement is what motivates the camera change that follows — the view
   * opens because the person in it moved, not because a transition fired.
   */
  setGuideStaging(staging) {
    if (!staging) {
      if (this._guide) this._guide.target.opacity = 0;
      return;
    }
    const anchor = this._anchorPoses.get(staging.anchorId);
    if (!anchor) return;

    const subject = this._subjectPose(staging.subjectRef);
    const facing = subject
      ? vec3.normalize([subject[0] - anchor.position[0], 0, subject[2] - anchor.position[2]])
      : anchor.normal;

    // Stepping aside is lateral, across the visitor's sightline — never
    // backwards into the wall the work is hanging on.
    const lateral = [-facing[2], 0, facing[0]];
    const shift = staging.aside ? 0.92 : 0;
    const position = [
      anchor.position[0] + lateral[0] * shift,
      anchor.position[1],
      anchor.position[2] + lateral[2] * shift
    ];

    this._ensureGuide();
    this._guide.staging = staging;
    this._guide.target = {
      position,
      // Once aside, the guide turns towards the work rather than continuing to
      // present it. The visitor is the one looking now.
      yaw: Math.atan2(facing[0], facing[2]) + (staging.aside ? 0.22 : 0),
      opacity: 1
    };
    // A guide that walks in from nowhere is a spawn. The first staging places
    // it; only later stagings are travelled to.
    if (this._guide.current.opacity === 0) {
      this._guide.current = { ...this._guide.target, opacity: 0 };
    }
  }

  /**
   * Stage the visitor figure, or dismiss it.
   *
   * Deliberately a near-copy of `setGuideStaging` rather than a shared abstraction:
   * the two figures mean different things and will diverge (the guide walks between
   * stops; the visitor only ever stands and looks). Collapsing them now would be
   * the wrong kind of tidiness.
   */
  setVisitorStaging(staging) {
    if (!staging) {
      if (this._visitor) this._visitor.target.opacity = 0;
      return;
    }
    const anchor = this._anchorPoses.get(staging.anchorId);
    if (!anchor) return;

    const subject = this._subjectPose(staging.subjectRef);
    const facing = subject
      ? vec3.normalize([subject[0] - anchor.position[0], 0, subject[2] - anchor.position[2]])
      : anchor.normal;

    this._ensureVisitor();
    this._visitor.staging = staging;
    this._visitor.target = {
      position: [anchor.position[0], anchor.position[1], anchor.position[2]],
      yaw: Math.atan2(facing[0], facing[2]),
      opacity: 1
    };
    // A visitor does not walk in from the previous stop: they are simply there,
    // already looking. Placing rather than travelling avoids a figure sliding
    // across the room between two unrelated beats.
    this._visitor.current = { ...this._visitor.target, opacity: this._visitor.current.opacity };
  }

  _ensureVisitor() {
    if (this._visitor) return;
    const object = buildVisitorFigure({ design: this._guideDesign });
    object.visible = false;
    object.traverse((node) => {
      if (!node.material) return;
      node.material = node.material.clone();
      node.material.transparent = true;
      node.material.opacity = 0;
    });
    this.scene.add(object);
    this._visitor = {
      object,
      current: { position: [0, 0, 0], yaw: 0, opacity: 0 },
      target: { position: [0, 0, 0], yaw: 0, opacity: 0 },
      staging: null
    };
  }

  _ensureGuide() {
    if (this._guide) return;
    const object = this._buildGuideObject(this._guideDesign);
    this.scene.add(object);
    this._guide = {
      object,
      current: { position: [0, 0, 0], yaw: 0, opacity: 0 },
      target: { position: [0, 0, 0], yaw: 0, opacity: 0 },
      staging: null
    };
  }

  _buildGuideObject(design) {
    const object = buildGuideFigure({ design, materials: guideMaterials(design) });
    object.visible = false;
    // Every material is cloned per figure, so fading one candidate cannot fade
    // another, and so a design swap disposes cleanly.
    object.traverse((node) => {
      if (!node.material) return;
      node.material = node.material.clone();
      node.material.transparent = true;
      node.material.opacity = 0;
    });
    return object;
  }

  /**
   * Swap the guide's design language. Review scaffolding only — the visitor
   * never sees this, and the semantic layer has no idea it exists.
   */
  setGuideDesign(design) {
    if (!GUIDE_DESIGNS[design] || design === this._guideDesign) return this._guideDesign;
    this._guideDesign = design;
    if (this._guide) {
      const previous = this._guide.object;
      const next = this._buildGuideObject(design);
      next.position.copy(previous.position);
      next.rotation.y = previous.rotation.y;
      this.scene.add(next);
      this.scene.remove(previous);
      disposeObject(previous);
      this._guide.object = next;
    }
    return this._guideDesign;
  }

  guideDesigns() {
    return Object.values(GUIDE_DESIGNS).map(({ id, label, height, heads }) => ({ id, label, height, heads }));
  }

  /**
   * Has the guide finished travelling to her staging?
   *
   * A presentation question with a presentation answer — no new state, just a
   * reading of where she is against where she was sent. The Director uses it to
   * avoid starting a composition that assumes she has arrived while she is
   * still crossing the room.
   */
  /**
   * The visitor figure only fades. It never walks: it is already standing where
   * the beat wants it, because a visitor who slides into position across the
   * gallery is a puppet, not a person who was already looking.
   */
  _updateVisitor(dt) {
    const visitor = this._visitor;
    if (!visitor) return;
    const step = dt || 0.016;
    const current = visitor.current;
    const target = visitor.target;
    current.position[0] = target.position[0];
    current.position[1] = target.position[1];
    current.position[2] = target.position[2];
    current.yaw = target.yaw;
    current.opacity += (target.opacity - current.opacity) * (1 - Math.exp(-step * 3.4));

    visitor.object.position.set(current.position[0], current.position[1], current.position[2]);
    visitor.object.rotation.y = current.yaw;
    visitor.object.visible = current.opacity > 0.01;
    visitor.object.traverse((node) => {
      if (node.material) node.material.opacity = current.opacity;
    });
  }

  /** True once the visitor figure has faded in (or is dismissed). */
  visitorSettled() {
    const visitor = this._visitor;
    if (!visitor) return true;
    return visitor.target.opacity === 0 ? visitor.current.opacity < 0.05 : visitor.current.opacity > 0.9;
  }

  guideSettled() {
    const guide = this._guide;
    if (!guide || guide.target.opacity === 0) return true;
    const dx = guide.target.position[0] - guide.current.position[0];
    const dz = guide.target.position[2] - guide.current.position[2];
    return Math.hypot(dx, dz) < 0.12 && guide.current.opacity > 0.9;
  }

  /** What a staging is attending to: an entity's anchor, or a room's centre. */
  _subjectPose(subjectRef) {
    if (!subjectRef) return null;
    const entity = this._entityIndex.get(subjectRef);
    if (entity) return this._anchorPoses.get(entity.anchorId)?.position || null;
    const handle = this._spaces.get(subjectRef);
    return handle ? handle.space.bounds.origin : null;
  }

  /**
   * Over the guide's shoulder at the work.
   *
   * The camera stands behind and to one side of the guide, at standing eye
   * height, looking at what they are looking at. The lateral offset is what
   * makes it read as accompanied rather than as a camera that happens to have a
   * person in it: dead behind is a following shot, slightly off-axis is two
   * people in front of a painting. The guide takes one side of the frame and
   * the work keeps the open side.
   */
  /**
   * Following someone across a room.
   *
   * The camera does not chase the guide per frame — that would be a second
   * camera model and it would fight the authority contract. Instead the shot
   * travels to a pose standing behind where she is *going*, over the same
   * duration her walk takes, so the two arrive together. From inside it reads as
   * having followed her; from outside it is one authored move.
   *
   * The camera aims past her rather than at her back, so the destination and the
   * room ahead stay visible while she walks into them.
   */
  /**
   * Which way a subject faces, for the purpose of composing a shot.
   *
   * A wall work faces along its anchor normal. A free-standing piece has no such
   * normal — its anchor points at the ceiling — so it faces whoever is looking at
   * it. Deriving that from the staged figure is what lets sculpture reuse the
   * artwork framings instead of needing a second set of them, and it is why
   * `lateral` below never degenerates for a plinth.
   */
  _facingFor(anchor, fromPosition = null) {
    if (!isFloorAnchor(anchor)) return anchor.normal;
    if (fromPosition) {
      const away = [fromPosition[0] - anchor.position[0], 0, fromPosition[2] - anchor.position[2]];
      if (Math.hypot(away[0], away[2]) > 0.3) return vec3.normalize(away);
    }
    // Nobody staged: face the side of the room visitors arrive from.
    return [0, 0, 1];
  }

  /**
   * The optical centre of a subject. A hung work is centred on its anchor; a
   * piece on a plinth is centred a plinth's height above the floor.
   */
  _subjectCentre(anchor, record) {
    if (!isFloorAnchor(anchor)) return anchor.position;
    return [anchor.position[0], anchor.position[1] + PLINTH_HEIGHT + record.size[1] / 2, anchor.position[2]];
  }

  /**
   * Beat A — arrival at a work.
   *
   * This used to frame the guide and nothing else: the camera sat 2.9 m behind
   * where she would stop, aimed 1.2 m past her along her heading, and declared a
   * subject size of `[0.6, 1.7, 0.4]` — a human bounding box. Whether the work she
   * was walking towards appeared in the frame was pure luck, and it ran out: the
   * arrival at *Horizonte interrumpido* settled on a lit, empty wall, 3.63 m from
   * where the painting hangs.
   *
   * The arrival now holds both the work and the guide. Her walk is untouched —
   * this changes where the camera stands, not where she goes.
   */
  _leadFraming(viewport, record = null, anchor = null) {
    const destination = this._anchorPoses.get(viewport.guideAnchorId);
    if (!destination) return null;

    // A lead toward a Space — the first arrival, the walk to a threshold — has no
    // work to hold in frame, so it keeps the guide-only shot it always had.
    if (!record || !anchor) {
      const from = this._guide && this._guide.current.opacity > 0.05
        ? this._guide.current.position
        : null;
      const travelled = from
        ? [destination.position[0] - from[0], 0, destination.position[2] - from[2]]
        : null;
      const heading = travelled && Math.hypot(travelled[0], travelled[2]) > 0.4
        ? vec3.normalize(travelled)
        : destination.normal;
      const behind = 2.9;
      return {
        position: [
          destination.position[0] - heading[0] * behind,
          destination.position[1] + 1.62,
          destination.position[2] - heading[2] * behind
        ],
        target: [
          destination.position[0] + heading[0] * 1.2,
          destination.position[1] + 1.26,
          destination.position[2] + heading[2] * 1.2
        ],
        subjectSize: [0.6, 1.7, 0.4]
      };
    }

    const [w, h] = record.size;
    const out = this._facingFor(anchor, destination.position);
    const centre = this._subjectCentre(anchor, record);
    const lateral = [-out[2], 0, out[0]];
    const guideSide = (destination.position[0] - centre[0]) * lateral[0]
      + (destination.position[2] - centre[2]) * lateral[2];
    const guideOut = (destination.position[0] - centre[0]) * out[0]
      + (destination.position[2] - centre[2]) * out[2];

    // Wide enough for the work, the guide beside it, and room around both — this
    // is the context beat, so it breathes more than the contemplation beat does.
    const freeStanding = isFloorAnchor(anchor);
    const span = Math.max(w, Math.abs(guideSide) + w / 2 + 1.7);
    const narrow = (viewport.aspect || 1.6) < 1;
    const vfov = ((viewport.vfov || 55) * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (viewport.aspect || 1.6));
    const need = span / (2 * Math.tan(hfov / 2) * (narrow ? 0.5 : 0.6));
    // Always further out than the guide: the camera watches the arrival, and
    // standing closer than she does would make her a foreground obstruction.
    //
    // A free-standing piece needs its own numbers. Standing off a plinth by the
    // distance a 2.6 m canvas wants sent the camera clean through the south wall
    // of the gallery — the work is small, it sits in the middle of the room, and
    // there is no six metres of floor behind it to retreat into.
    const back = freeStanding
      ? Math.min(Math.max(need, guideOut + 1.6), 6)
      : Math.min(Math.max(need, guideOut + 2.9, 5), 12);

    // Between the work and the guide, biased to the work, so the two separate in
    // frame instead of stacking along the sightline.
    //
    // A free-standing piece needs that separation supplied rather than measured.
    // Its facing is *defined* as the direction towards whoever is looking at it,
    // which makes the figure's lateral offset identically zero — she is always on
    // the axis by construction, and the camera behind her always sees her in front
    // of the work. A wall gives that offset for free; a plinth does not, so the
    // camera steps off the axis itself.
    const camSide = freeStanding ? 1.6 : guideSide * 0.42;
    const aimSide = freeStanding ? 0.35 : guideSide * 0.24;
    return {
      position: [
        centre[0] + out[0] * back + lateral[0] * camSide,
        1.72,
        centre[2] + out[2] * back + lateral[2] * camSide
      ],
      target: [
        centre[0] + lateral[0] * aimSide,
        centre[1] * 0.86 + 0.26,
        centre[2] + lateral[2] * aimSide
      ],
      subjectSize: [span, h, 0.1]
    };
  }


  _accompaniedFraming(record, anchor, viewport) {
    const guideAnchor = this._anchorPoses.get(viewport.guideAnchorId);
    if (!guideAnchor) return null;

    // The optical centre, not the anchor: a plinth anchor is on the floor, and
    // aiming at it framed the vessel from below with its rim out of shot.
    const subject = this._subjectCentre(anchor, record);
    const toSubject = vec3.normalize([
      subject[0] - guideAnchor.position[0], 0, subject[2] - guideAnchor.position[2]
    ]);
    const lateral = [-toSubject[2], 0, toSubject[0]];

    // A narrow screen cannot hold a figure and a work side by side. The camera
    // stands further back and closer to the guide's own line, so the meaning
    // survives the crop even though the composition does not.
    const narrow = (viewport.aspect || 1.6) < 1;
    // Close enough that the guide is in the near field and clearly *in front of*
    // the visitor rather than beside them. At two metres back this composition
    // read as a person standing in a gallery; at just over one it reads as
    // standing behind someone. That distance is the whole difference between
    // observing a figure and being accompanied by one.
    // A free-standing piece is approached, not faced: the guide stands beside it
    // rather than in front of a wall, so the camera needs more room behind her or
    // she fills the frame and crops the work.
    const freeStanding = isFloorAnchor(anchor);
    const behind = (narrow ? 1.5 : 1.12) + (freeStanding ? 1.35 : 0);
    const offset = (narrow ? 0.34 : 0.62) + (freeStanding ? 0.35 : 0);
    // Slightly above the guide's own eyeline, so the look passes over the
    // shoulder instead of through the back of the head.
    const eye = 1.73;

    const position = [
      guideAnchor.position[0] - toSubject[0] * behind + lateral[0] * offset,
      guideAnchor.position[1] + eye,
      guideAnchor.position[2] - toSubject[2] * behind + lateral[2] * offset
    ];
    // Aim between the guide's shoulder and the work, so neither sits dead centre.
    const target = [
      subject[0] - lateral[0] * offset * 0.5,
      subject[1] * 0.72 + eye * 0.28,
      subject[2] - lateral[2] * offset * 0.5
    ];
    return { position, target, subjectSize: record.size };
  }

  /**
   * Beat C — human contemplation.
   *
   * The one composition this grammar genuinely did not have. A and B are the
   * guide's shots: she leads, then she presents over your shoulder. D is empty of
   * people. Between them the encounter needs a view of *a person with the work* —
   * the moment the visitor stops being escorted and starts looking.
   *
   * It is deliberately not another over-the-shoulder. The camera stands off to
   * the side, roughly square to the wall rather than to the figure, far enough
   * back to hold both and low enough to read as standing height. The figure sits
   * to one side of the frame and never crosses the work: a human giving the work
   * its scale, not a human in front of it.
   */
  _contemplationFraming(record, anchor, viewport) {
    const figure = this._anchorPoses.get(viewport.visitorAnchorId || viewport.guideAnchorId);
    if (!figure) return null;

    const [w, h] = record.size;
    const centre = this._subjectCentre(anchor, record);
    // A hung work is seen from in front of its wall. A free-standing piece has no
    // front, and standing where the visitor stands puts them between the camera
    // and the object — which is why a constant sideways nudge only shoved the
    // whole composition into a corner. The camera instead stands *across* the
    // line between person and object, so both are broadside at the same depth.
    // That side-by-side reading is what human scale means for a sculpture.
    const toFigure = vec3.normalize([
      figure.position[0] - centre[0], 0, figure.position[2] - centre[2]
    ]);
    const out = isFloorAnchor(anchor)
      ? [-toFigure[2], 0, toFigure[0]]
      : this._facingFor(anchor, figure.position);
    const lateral = [-out[2], 0, out[0]];

    // Frame the pair, not the wall.
    //
    // A first attempt placed the camera by hand — so far out along the normal,
    // so far to the side — and the figure fell outside the frame while the state
    // said it was staged. Deriving the distance from what actually has to fit
    // cannot make that mistake: the span is measured, the field of view is asked
    // for the distance that covers it, and both are in shot by construction.
    const sideways = (figure.position[0] - centre[0]) * lateral[0]
      + (figure.position[2] - centre[2]) * lateral[2];
    const outward = (figure.position[0] - centre[0]) * out[0]
      + (figure.position[2] - centre[2]) * out[2];

    // From the far edge of the work to the far side of the figure, plus a
    // shoulder's worth of air so nobody is cropped at the frame edge.
    const span = Math.max(w, Math.abs(sideways) + w / 2 + 1.3);
    const narrow = (viewport.aspect || 1.6) < 1;
    const vfov = ((viewport.vfov || 55) * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (viewport.aspect || 1.6));
    // 0.74 leaves the composition breathing rather than edge to edge.
    const need = span / (2 * Math.tan(hfov / 2) * (narrow ? 0.62 : 0.74));
    // Well behind the figure, not just past it. At a stride's clearance the
    // visitor filled half the frame and read as a giant beside the work; the
    // point of the beat is that a person gives the painting its scale, which
    // only happens when both are seen at comparable depth.
    //
    // Except at a plinth, where the same clamp put the camera outside the room.
    const back = isFloorAnchor(anchor)
      ? Math.min(Math.max(need, outward + 1.4), 5.5)
      : Math.min(Math.max(need, outward + 4.2, 4.8), 11);

    // Centred between the work and the figure, so neither is dead centre and the
    // gap between them — which is what "a person looking at this" actually looks
    // like — is the middle of the frame.
    const midSideways = sideways * 0.42;
    const position = [
      centre[0] + out[0] * back + lateral[0] * midSideways,
      1.58,
      centre[2] + out[2] * back + lateral[2] * midSideways
    ];
    const target = [
      centre[0] + lateral[0] * midSideways,
      centre[1] * 0.82 + 0.24,
      centre[2] + lateral[2] * midSideways
    ];
    return { position, target, subjectSize: [span, h, 0.1] };
  }

  /* == transitions: WHERE ==================================================== */

  /**
   * The optical centre of a subject, in world space. Spatial fact, no opinion
   * about what any move between two of them means.
   */
  subjectPoint(subjectRef) {
    const record = this._entityIndex.get(subjectRef);
    const anchor = record ? this._anchorPoses.get(record.anchorId) : null;
    if (!record || !anchor) return null;
    return this._subjectCentre(anchor, record);
  }

  /**
   * A point to bend a camera path through, or null when the straight line is fine.
   *
   * The Scene Kit knows where the walls and the plinths are; it is asked only
   * whether a segment is passable and, if not, where to go instead. It is never
   * asked what kind of transition this is — that is the Director's to know.
   *
   * Deliberately not a pathfinder. Two failure modes actually occur in this room:
   * a straight line between perpendicular walls clips the corner, and a line to or
   * from the plinth passes through the vessel. One control point pulled toward open
   * floor fixes both, and a general solver would be a much larger answer to a much
   * smaller question.
   */
  pathWaypoint(from, to, context = {}) {
    const spaceId = this._spaceContaining(from) || this._spaceContaining(to);
    const handle = spaceId ? this._spaces.get(spaceId) : null;
    if (!handle) return null;
    const bounds = handle.space.bounds;
    const [bw, , bd] = bounds.size;
    const [ox, , oz] = bounds.origin;

    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
    const clearance = this._clearanceAt(mid, bounds, context.subjectRef);
    // An orbit always bends: its whole point is that the camera travels around the
    // piece rather than across it.
    const orbiting = context.family === 'T4_OBJECT_ORBIT';
    if (!orbiting && clearance.ok) return null;

    // Pull the midpoint toward open floor: the room's centre for a corner, and
    // away from the obstacle when there is one.
    const toCentre = [ox - mid[0], 0, oz - mid[2]];
    const len = Math.hypot(toCentre[0], toCentre[2]) || 1;
    const pullBy = orbiting ? Math.max(clearance.push, 1.1) : clearance.push;
    const via = [
      mid[0] + (toCentre[0] / len) * pullBy,
      mid[1],
      mid[2] + (toCentre[2] / len) * pullBy
    ];
    // Never bend the path outside the room it is crossing.
    const inset = 0.8;
    via[0] = Math.min(Math.max(via[0], ox - bw / 2 + inset), ox + bw / 2 - inset);
    via[2] = Math.min(Math.max(via[2], oz - bd / 2 + inset), oz + bd / 2 - inset);
    return via;
  }

  /** Which built space contains a point, if any. */
  _spaceContaining(point) {
    for (const [id, handle] of this._spaces) {
      const { size, origin } = handle.space.bounds;
      if (Math.abs(point[0] - origin[0]) <= size[0] / 2 + 1
        && Math.abs(point[2] - origin[2]) <= size[2] / 2 + 1) return id;
    }
    return null;
  }

  /**
   * How much room a point has: distance to the nearest wall, and to any
   * floor-standing piece that is not the subject of the move.
   */
  _clearanceAt(point, bounds, subjectRef) {
    const [bw, , bd] = bounds.size;
    const [ox, , oz] = bounds.origin;
    const toWall = Math.min(
      bw / 2 - Math.abs(point[0] - ox),
      bd / 2 - Math.abs(point[2] - oz)
    );
    let push = 0;
    // A corner is where both walls are close at once; 1.2 m is roughly a body plus
    // the stanchion line that runs in front of the works.
    if (toWall < 1.2) push = 1.2 - toWall;

    for (const [id, record] of this._entityIndex) {
      if (id === subjectRef) continue;
      const anchor = this._anchorPoses.get(record.anchorId);
      if (!anchor || !isFloorAnchor(anchor)) continue;
      const radius = Math.max(record.size[0], record.size[2]) / 2 + 0.9;
      const d = Math.hypot(point[0] - anchor.position[0], point[2] - anchor.position[2]);
      if (d < radius) push = Math.max(push, radius - d);
    }
    return { ok: push <= 0, push };
  }

  applyQuality(policy) {
    for (const handle of this._spaces.values()) {
      for (const spot of handle.spots) {
        spot.castShadow = policy.shadows && spot.castShadow;
      }
    }
  }

  update(dt, elapsed) {
    for (const item of this._animated) item.update(elapsed);
    this._updateGuide(dt);
    this._updateVisitor(dt);
  }

  /**
   * Move the guide toward its staging.
   *
   * An exponential approach rather than a keyframed walk: it settles without
   * ever snapping, needs no clock of its own, and cannot drift out of step with
   * a shot that the visitor skipped. A step aside is under a metre, which at
   * this rate reads as a person shifting their weight and moving over — which
   * is all it is.
   *
   * There is no idle animation. A figure that sways on a loop is a videogame
   * telling you it is alive; a person watching someone look at a painting
   * stands still.
   */
  _updateGuide(dt) {
    const guide = this._guide;
    if (!guide) return;
    const step = dt || 0.016;
    const current = guide.current;
    const target = guide.target;

    // Walk, don't glide.
    //
    // An exponential approach settles a step-aside beautifully and is hopeless
    // over a room: it covers most of six metres in the first second and then
    // creeps, which reads as a shove followed by a drift. A person crossing a
    // gallery walks at a roughly constant pace, so travel is speed-limited and
    // only the last stride eases out. That pace is also what lets a shot and a
    // walk be authored to the same duration and arrive together.
    const dx = target.position[0] - current.position[0];
    const dz = target.position[2] - current.position[2];
    const remaining = Math.hypot(dx, dz);
    const walking = remaining > 0.05;
    if (remaining > 1e-4) {
      // Ease the final half-metre so she stops rather than halting.
      const pace = GUIDE_WALK_SPEED * Math.min(1, 0.28 + remaining / 0.5);
      const travel = Math.min(remaining, pace * step);
      current.position[0] += (dx / remaining) * travel;
      current.position[2] += (dz / remaining) * travel;
    }
    current.position[1] += (target.position[1] - current.position[1]) * (1 - Math.exp(-step * 4));

    // Face the way you are going while going, and the subject once arrived.
    // A figure that slides sideways while facing a painting is the single most
    // obvious tell that nobody is really walking.
    const heading = walking ? Math.atan2(dx, dz) : target.yaw;
    let delta = (heading - current.yaw) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    current.yaw += delta * (1 - Math.exp(-step * 4.6));
    current.opacity += (target.opacity - current.opacity) * (1 - Math.exp(-step * 2.6));
    guide.walking = walking;

    guide.object.position.set(current.position[0], current.position[1], current.position[2]);
    guide.object.rotation.y = current.yaw;
    guide.object.visible = current.opacity > 0.01;
    guide.object.traverse((node) => {
      if (node.material) node.material.opacity = current.opacity;
    });
  }

  renderStats() {
    return this.renderHost.stats();
  }

  /* == internals ============================================================ */

  /**
   * Turn the Portals that touch a Space into wall openings. The Portal record
   * says *where the connection is* and *what it might look like*; this method
   * is where the DOOR / OPENING hint becomes an actual hole in a wall.
   */
  _openingsFor(space, store) {
    const openings = [];
    const [w, h, d] = space.bounds.size;
    const [ox, oy, oz] = space.bounds.origin;

    for (const portal of store.portalsOf(space.id)) {
      if (portal.representationHint === REPRESENTATION_HINT.NONE) continue;
      const anchor = store.require(portal.sourceAnchorId);
      const [ax, , az] = anchor.position;

      const distances = {
        NORTH: Math.abs(az - (oz - d / 2)),
        SOUTH: Math.abs(az - (oz + d / 2)),
        WEST: Math.abs(ax - (ox - w / 2)),
        EAST: Math.abs(ax - (ox + w / 2))
      };
      const wall = Object.entries(distances).sort((a, b) => a[1] - b[1])[0][0];
      const offset = wall === 'NORTH' || wall === 'SOUTH' ? ax - ox : az - oz;
      const width = portal.representationHint === REPRESENTATION_HINT.OPENING ? 2.6 : 1.5;
      const height = Math.min(portal.representationHint === REPRESENTATION_HINT.OPENING ? 3.0 : 2.35, h - 0.4);

      openings.push({
        wall,
        offset,
        width,
        height,
        portalId: portal.id,
        worldPosition: [ax, oy, az]
      });
    }
    return openings;
  }
}

/**
 * Slide the camera sideways so the subject sits in the middle of the *visible*
 * area rather than the middle of the canvas. `insetRight` is the fraction of the
 * viewport hidden behind the detail panel.
 */
function offsetForInset(pose, normal, viewport) {
  const right = viewport.insetRight || 0;
  const bottom = viewport.insetBottom || 0;
  if (right <= 0.01 && bottom <= 0.01) return pose;

  const distance = Math.hypot(
    pose.position[0] - pose.target[0],
    pose.position[1] - pose.target[1],
    pose.position[2] - pose.target[2]
  );
  const halfHeight = Math.tan(((viewport.vfov || 50) * Math.PI) / 360) * distance;
  const halfWidth = halfHeight * (viewport.aspect || 1.6);

  // Lateral direction on the horizontal plane, relative to the wall normal.
  const lateral = [normal[2], 0, -normal[0]];
  const dx = halfWidth * right;
  // Raising the camera pushes the subject up the frame, clearing the label.
  const dy = halfHeight * bottom;

  return {
    ...pose,
    position: [
      pose.position[0] + lateral[0] * dx,
      pose.position[1] + dy,
      pose.position[2] + lateral[2] * dx
    ],
    target: [
      pose.target[0] + lateral[0] * dx,
      pose.target[1] + dy,
      pose.target[2] + lateral[2] * dx
    ]
  };
}

/**
 * Give every material in a room the environment response its profile asks for.
 *
 * Applied once, after the room is fully built, so materials created deep inside
 * an entity builder are covered too — an artwork that ignored its room's light
 * would be exactly the inconsistency this exists to prevent.
 *
 * The `envMap` assignment is not decoration. While a material's `envMap` is
 * null and the scene has an `environment`, three.js overwrites the material's
 * `envMapIntensity` with the scene-wide `environmentIntensity` every frame, so
 * a per-room value set on the material alone is silently discarded. Handing the
 * room's materials the map explicitly is what makes the room's own value the
 * one that survives.
 */
function applyEnvironmentResponse(group, intensity, envMap) {
  if (typeof intensity !== 'number' || !envMap) return;
  const seen = new Set();
  group.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || seen.has(material) || !('envMapIntensity' in material)) continue;
      seen.add(material);
      // No `needsUpdate` here: these materials are new and have never been
      // compiled, so the first compile already sees the map. Bumping the
      // version instead invalidates programs that a warmup's `compileAsync` is
      // still waiting on, and that warmup then reads a program that no longer
      // exists.
      material.envMap = envMap;
      material.envMapIntensity = intensity;
    }
  });
}

/**
 * Move a wall anchor onto the inner face of the wall it belongs to.
 *
 * `normal` points into the room, so the surface lies one wall thickness in from
 * the bounds plane on that axis. Anything that is not a wall plane (a free
 * anchor that happens to be marked WALL) is left where the author put it.
 */
function projectOntoWallSurface(position, normal, bounds) {
  const [w, , d] = bounds.size;
  const [ox, , oz] = bounds.origin;
  const out = [...position];

  if (Math.abs(normal[0]) > 0.5) {
    const face = normal[0] > 0 ? ox - w / 2 : ox + w / 2;
    if (Math.abs(position[0] - face) < 1) out[0] = face + normal[0] * WALL_THICKNESS;
  } else if (Math.abs(normal[2]) > 0.5) {
    const face = normal[2] > 0 ? oz - d / 2 : oz + d / 2;
    if (Math.abs(position[2] - face) < 1) out[2] = face + normal[2] * WALL_THICKNESS;
  }
  return out;
}

/** Total wall length occupied by the work hung on it. */
function span(positions) {
  return Math.max(...positions) - Math.min(...positions);
}

function clampAxis(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function boxAround([x, z], width, depth) {
  return {
    min: [x - width / 2, 0, z - depth / 2],
    max: [x + width / 2, 3, z + depth / 2]
  };
}
