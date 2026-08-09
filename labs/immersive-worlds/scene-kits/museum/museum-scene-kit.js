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
  artworkTexture, createGeneratedVideoTexture, floorTexture, labelTexture, plasterTexture
} from './textures.js';
import {
  WALL_THICKNESS, buildBarrierLine, buildBench, buildCornice, buildCove, buildFramedWork,
  buildLabel, buildPitchedRoof, buildPlinth, buildRoomShell, buildSkylightDaylight,
  buildThreshold, buildVessel, disposeObject
} from './builders.js';

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
    this.scene.environmentIntensity = profile.envIntensity;
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

    const lines = [];
    for (const [wall, positions] of byWall) {
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
        opacity: 0.14
      });
      const mark = new THREE.Mesh(new THREE.RingGeometry(0.31, 0.335, 48), material);
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
    if (!record || !anchor) {
      return { position: [0, 1.6, 3], target: [0, 1.6, 0], subjectSize: [1, 1, 1] };
    }
    const [w, h] = record.size;
    const detail = viewport.intent === 'DETAIL';
    const isFloorStanding = anchor.normal[1] > 0.5 || (anchor.normal[0] === 0 && anchor.normal[2] === 0);

    if (isFloorStanding) {
      // Sculpture: approach from the visitor's side of the room, at eye height.
      const pose = framePose(
        { position: [anchor.position[0], anchor.position[1] + 1.02 + h / 2, anchor.position[2]], normal: [0, 0, 1] },
        { width: Math.max(w, 0.8) * (detail ? 0.55 : 1), height: h * (detail ? 0.6 : 1.35) },
        viewport,
        { fill: detail ? 0.8 : 0.6, min: 1.1, max: 7 }
      );
      return { ...pose, subjectSize: record.size };
    }

    const pose = framePose(
      { position: anchor.position, normal: anchor.normal },
      { width: w * (detail ? 0.45 : 1), height: h * (detail ? 0.45 : 1) },
      viewport,
      { fill: detail ? 0.82 : 0.68, min: 0.75, max: 9 }
    );
    return { ...offsetForInset(pose, anchor.normal, viewport), subjectSize: record.size };
  }

  framingForSpace(spaceId, viewport) {
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
    return { ...pose, subjectSize: space.bounds.size };
  }

  /* == presentation state =================================================== */

  setHotspotState(hotspotId, state) {
    for (const handle of this._spaces.values()) {
      const mark = handle.hotspotMarks.get(hotspotId);
      if (!mark) continue;
      const near = state === HOTSPOT_STATE.NEAR || state === HOTSPOT_STATE.ACTIVE;
      mark.material.opacity = near ? 0.5 : state === HOTSPOT_STATE.VISITED ? 0.08 : 0.14;
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

  applyQuality(policy) {
    for (const handle of this._spaces.values()) {
      for (const spot of handle.spots) {
        spot.castShadow = policy.shadows && spot.castShadow;
      }
    }
  }

  update(dt, elapsed) {
    for (const item of this._animated) item.update(elapsed);
    void dt;
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
  const inset = viewport.insetRight || 0;
  if (inset <= 0.01) return pose;

  const distance = Math.hypot(
    pose.position[0] - pose.target[0],
    pose.position[1] - pose.target[1],
    pose.position[2] - pose.target[2]
  );
  const halfWidth = Math.tan(((viewport.vfov || 50) * Math.PI) / 360) * (viewport.aspect || 1.6) * distance;
  const shift = halfWidth * inset;
  // Lateral direction on the horizontal plane, relative to the wall normal.
  const lateral = [normal[2], 0, -normal[0]];

  return {
    ...pose,
    position: [pose.position[0] + lateral[0] * shift, pose.position[1], pose.position[2] + lateral[2] * shift],
    target: [pose.target[0] + lateral[0] * shift, pose.target[1], pose.target[2] + lateral[2] * shift]
  };
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

function clampAxis(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function boxAround([x, z], width, depth) {
  return {
    min: [x - width / 2, 0, z - depth / 2],
    max: [x + width / 2, 3, z + depth / 2]
  };
}
