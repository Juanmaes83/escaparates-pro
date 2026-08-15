/**
 * PHASE 1A — the real Breeze compute core, running as an E1 guest.
 *
 * The Option E1 spike proved the host contract with a WebGL test double, and
 * said so in as many words: substituting a double for the ARCHITECTURE is
 * legitimate, substituting one for the CAPABILITY would be faking the result.
 * This file is the beginning of not faking it. Every kernel that runs here comes
 * from `vendor/breeze-core/`, built from `Juanmaes83/breeze@0ab8234`, with the
 * physics file byte-identical to the donor's.
 *
 *   No fake cloth. No prerecorded substitution. No test double presented as Breeze.
 *
 * WHAT IS REAL HERE, AND WHAT IS STILL A PLACEHOLDER
 *
 * Being precise about this is the point of phasing, so it is stated in the code
 * rather than only in a report:
 *
 *   REAL   WebGPU device and `WebGPURenderer` — no WebGL fallback is accepted
 *   REAL   `VerletPhysics` — the donor's file, unmodified, its kernels compiled
 *          and dispatched on the GPU
 *   REAL   `StructuredArray` — the donor's GPU struct layout
 *   REAL   `BVH` — the donor's collider traversal, compiled into the vertex kernel
 *   REAL   gravity, exactly the donor's term (`force.y -= 0.000001`)
 *
 *   PLACEHOLDER  the collider geometry is a sphere, not Venus            → 1B
 *   PLACEHOLDER  the cloth is a plain pinned grid built through the physics
 *                API, not `clothGeometry.js`, and it is drawn as instanced
 *                markers rather than a lit, textured fabric              → 1C
 *   ABSENT       wind — the donor's noise term is not added              → 1D
 *   ABSENT       Venus BVH integration and its authored placement        → 1E
 *
 * A placeholder here is a placeholder of *content*, never of capability. The
 * simulation that moves those markers is Breeze's, on the GPU, and the readback
 * in `sampleVertices()` is what proves it rather than asserting it.
 *
 * CAMERA
 *
 *   MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.
 *
 * There are no controls in this file, no `OrbitControls`, no `autoRotate`, no
 * pointer or key listeners, and no path by which a pose could be written back to
 * the Museum. `setCameraPose` is the only way the camera moves, and the Director
 * is the only thing that calls it.
 */

/** The vendored core. Resolved relative to this file so no import map is needed. */
export const BREEZE_CORE_URL = new URL(
  '../../../vendor/breeze-core/breeze-core.js', import.meta.url
).href;

/** Reported by `report()` so a harness can assert on the phase, not infer it. */
export const PHASE = '1A';

export class BreezeGuest {
  /**
   * @param {object} [options]
   * @param {string} [options.coreUrl]      override for tests
   * @param {number} [options.clothSize]    grid resolution per side
   * @param {number} [options.pixelRatio]
   */
  constructor({ coreUrl = BREEZE_CORE_URL, clothSize = 24, pixelRatio } = {}) {
    this.coreUrl = coreUrl;
    this.clothSize = clothSize;
    this.pixelRatio = pixelRatio;

    this.core = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.physics = null;
    this.bvh = null;
    this.markers = null;
    this.canvas = null;

    this._stepping = false;
    this._reading = false;
    this._suspended = false;
    this._elapsed = 0;

    this.stats = {
      prepared: 0, activated: 0, suspended: 0, restored: 0, disposed: 0,
      frames: 0, steps: 0, poses: 0, vertexCount: 0, springCount: 0
    };
    this.backend = null;
    this.adapterInfo = null;
    this.lastError = null;
  }

  /**
   * Acquire the device. Deliberately separated from `activate`: the host pauses
   * the Museum only after `prepare` resolves, and device acquisition is the slow,
   * failure-prone part. Doing it after the handoff is how an activation shows a
   * black frame for a second and a half.
   */
  async prepare({ canvas, config = {} } = {}) {
    this.canvas = canvas;

    if (!navigator.gpu) {
      throw new Error('BREEZE: este navegador no expone WebGPU (navigator.gpu ausente)');
    }

    this.core = await import(/* @vite-ignore */ this.coreUrl);
    const { THREE } = this.core;

    // No `forceWebGL`. A silent WebGL fallback would run the room without the
    // compute pipeline the whole room is for, and would look almost right —
    // which is the worst kind of wrong to ship.
    this.renderer = new THREE.WebGPURenderer({ canvas, antialias: config.antialias !== false });
    this.renderer.setPixelRatio(this.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    await this.renderer.init();

    this.backend = this.renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl';
    if (this.backend !== 'webgpu') {
      throw new Error('BREEZE: el renderer cayó a WebGL; el núcleo de cómputo no puede ejecutarse');
    }
    try {
      const info = this.renderer.backend?.adapter?.info;
      if (info) this.adapterInfo = { vendor: info.vendor, architecture: info.architecture };
    } catch { /* adapter info is advisory */ }

    this.stats.prepared += 1;
    return true;
  }

  /**
   * Build the scene and bake the physics.
   *
   * `bake()` compiles every kernel and dispatches `resetVertices` once to force
   * compilation, so by the time this resolves the GPU pipeline exists. That is
   * the expensive moment, and it is intentionally on this side of the first
   * frame rather than inside the frame loop.
   */
  async activate({ config = {} } = {}) {
    const { THREE, TSL, VerletPhysics, BVH } = this.core;
    const { instanceIndex, positionLocal, vec3 } = TSL;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.background ?? 0x0c0b0a);

    this.camera = new THREE.PerspectiveCamera(40, this._aspect(), 0.01, 200);

    // PLACEHOLDER GEOMETRY (1B replaces it with Venus). The BVH built from it is
    // the donor's, and its traversal is compiled into the real vertex kernel.
    const colliderGeometry = new THREE.IcosahedronGeometry(0.6, 4);
    colliderGeometry.deleteAttribute('uv');
    this.bvh = new BVH(colliderGeometry);
    this.collider = new THREE.Mesh(
      colliderGeometry,
      new THREE.MeshBasicNodeMaterial({ color: 0x2b2724 })
    );
    this.scene.add(this.collider);

    this.physics = new VerletPhysics(this.renderer);

    // The donor's gravity term, and only that. The wind that makes Breeze look
    // like Breeze is a noise field added to this same force, and it arrives in
    // 1D; adding an approximation of it now would be inventing Breeze rather
    // than porting it.
    this.physics.addForce((position, time) => {
      const force = vec3(0).toVar();
      force.y.subAssign(0.000001);
      return force;
    });
    this.physics.addCollider(this.bvh);

    this._buildClothGrid(config);

    await this.physics.bake();
    this.stats.vertexCount = this.physics.vertexCount;
    this.stats.springCount = this.physics.springCount;

    // Instanced markers, one per simulated vertex, positioned straight from the
    // physics buffer on the GPU. Nothing reads positions back to place them, so
    // what is on screen is the simulation and not a CPU copy of it.
    const marker = new THREE.BoxGeometry(0.012, 0.012, 0.012);
    const material = new THREE.MeshBasicNodeMaterial({ color: 0xd8d2c6 });
    material.positionNode = positionLocal.add(
      this.physics.vertexBuffer.element(instanceIndex).get('smoothedPosition')
    );
    this.markers = new THREE.InstancedMesh(marker, material, this.physics.vertexCount);
    this.markers.frustumCulled = false;
    this.scene.add(this.markers);

    this.resize();
    this.stats.activated += 1;
    return true;
  }

  /**
   * A pinned grid, built through the physics API rather than through
   * `clothGeometry.js`. That file carries the donor's fabric textures, its
   * normal map and its material, all of which are room content and belong to 1C.
   * The springs here are the same springs the same solver will integrate.
   */
  _buildClothGrid(config) {
    const { THREE } = this.core;
    const n = Math.max(4, config.clothSize ?? this.clothSize);
    const span = config.clothSpan ?? 1.4;
    const step = span / (n - 1);
    const object = this.physics.addObject();
    const grid = [];

    // Rows run bottom-up so vertex 0 is a free vertex. `readPositions()` samples
    // each object's *first* vertex, and an object whose first vertex is pinned
    // would report a position that never changes — a still reading from a
    // running simulation.
    for (let y = 0; y < n; y++) {
      const row = [];
      for (let x = 0; x < n; x++) {
        const pinned = y === n - 1 && (x === 0 || x === n - 1);
        // The top row hangs at `clothHeight` and the grid extends `span` below
        // it, so `clothHeight` must exceed `span`: the donor's vertex kernel has
        // a hard floor at y = 0 and shoves anything below it back up. A cloth
        // authored straddling that plane launches upward on the first step, and
        // the symptom reads as broken physics rather than as bad placement.
        row.push(this.physics.addVertex(object.id, new THREE.Vector3(
          -span / 2 + x * step,
          (config.clothHeight ?? 1.9) - (n - 1 - y) * step,
          config.clothZ ?? 0.9
        ), pinned));
      }
      grid.push(row);
    }

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (x + 1 < n) this.physics.addSpring(object.id, grid[y][x], grid[y][x + 1]);
        if (y + 1 < n) this.physics.addSpring(object.id, grid[y][x], grid[y + 1][x]);
        // Shear springs: without them a square grid folds flat along a diagonal
        // and reads as a net rather than as fabric.
        if (x + 1 < n && y + 1 < n) {
          this.physics.addSpring(object.id, grid[y][x], grid[y + 1][x + 1]);
          this.physics.addSpring(object.id, grid[y + 1][x], grid[y][x + 1]);
        }
      }
    }
    this._clothObjectId = object.id;
  }

  /** The Museum's pose. The guest has no other way to move the camera. */
  setCameraPose(pose) {
    if (!this.camera || !pose) return false;
    const [px, py, pz] = pose.position;
    const [tx, ty, tz] = pose.target;
    this.camera.position.set(px, py, pz);
    this.camera.lookAt(tx, ty, tz);
    if (typeof pose.fov === 'number' && pose.fov !== this.camera.fov) {
      this.camera.fov = pose.fov;
    }
    this.camera.updateProjectionMatrix();
    this.stats.poses += 1;
    return true;
  }

  _aspect() {
    const w = this.canvas?.clientWidth || this.canvas?.width || 1;
    const h = this.canvas?.clientHeight || this.canvas?.height || 1;
    return w / Math.max(1, h);
  }

  resize(width, height) {
    if (!this.renderer) return false;
    const w = width || this.canvas?.clientWidth || this.canvas?.width || 1;
    const h = height || this.canvas?.clientHeight || this.canvas?.height || 1;
    // `false` keeps the renderer from writing inline style on the canvas: the
    // host owns that element's layout, and a guest that restyled it could push
    // itself over the HUD.
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / Math.max(1, h);
      this.camera.updateProjectionMatrix();
    }
    return true;
  }

  /**
   * One frame.
   *
   * The host's loop is synchronous and the physics is not, so a step in flight
   * is skipped rather than queued. Awaiting inside `requestAnimationFrame` would
   * let compute dispatches pile up behind a slow frame until the tab stalls —
   * and the visible symptom would be the room "freezing", which reads as a
   * Museum bug rather than as backpressure.
   */
  update(dt) {
    if (!this.renderer || this._suspended || this._stepping || this._reading) return false;
    this._stepping = true;
    this._elapsed += dt;
    this.stats.frames += 1;
    this._step(dt).catch((e) => { this.lastError = String(e?.message || e); })
      .finally(() => { this._stepping = false; });
    return true;
  }

  /**
   * True while a compute step is in flight. A conformance harness needs this to
   * scrub the simulation deterministically: the frame rate under a software
   * adapter is a few frames a second, so "wait some milliseconds and hope"
   * measures the environment rather than the physics.
   */
  get isStepping() {
    return this._stepping;
  }

  async _step(dt) {
    await this.physics.update(dt, this._elapsed);
    this.stats.steps += 1;
    await this.renderer.renderAsync(this.scene, this.camera);
  }

  suspend() {
    this._suspended = true;
    this.stats.suspended += 1;
    return true;
  }

  restore() {
    this._suspended = false;
    this.stats.restored += 1;
    return true;
  }

  /**
   * Read the simulated positions off the GPU.
   *
   * This is the evidence, not a debugging convenience. "The physics ran" is only
   * checkable if the numbers the GPU produced come back and can be compared
   * against the initial state; a canvas that looks plausible proves nothing about
   * whether a compute pass ever dispatched.
   */
  async sampleVertices(limit = 8) {
    if (!this.physics?.isBaked) return null;
    // Mapping a storage buffer while the frame loop is dispatching against it
    // fails on the WebGPU backend with "a valid external Instance reference no
    // longer exists" — a readback and a simulation step cannot share the buffer.
    // So the loop is gated, any step in flight is allowed to finish, and only
    // then does the map happen.
    this._reading = true;
    try {
      while (this._stepping) await new Promise((r) => setTimeout(r, 4));
      const buffer = new Float32Array(
        await this.renderer.getArrayBufferAsync(this.physics.vertexBuffer.buffer.value)
      );
      const stride = this.physics.vertexBuffer.structSize;
      const offset = this.physics.vertexBuffer.layout.position.offset;
      const fixedOffset = this.physics.vertexBuffer.layout.isFixed.offset;
      const ints = new Int32Array(buffer.buffer);
      const out = [];
      const fixed = [];
      const count = Math.min(limit, this.physics.vertexCount);
      for (let i = 0; i < count; i++) {
        const base = i * stride;
        out.push([buffer[base + offset], buffer[base + offset + 1], buffer[base + offset + 2]]);
        fixed.push(ints[base + fixedOffset]);
      }
      return { stride, offset, vertexCount: this.physics.vertexCount, sample: out, fixed };
    } finally {
      this._reading = false;
    }
  }

  /**
   * Release the device and everything hanging off it.
   *
   * Order matters: geometries and materials first, then the renderer, which is
   * what actually drops the GPU device. A repeated enter/exit that leaked here
   * would accumulate devices until the browser refused to hand out another, and
   * the failure would land several rooms later, far from its cause.
   */
  async dispose() {
    this._suspended = true;
    try {
      this.markers?.geometry?.dispose();
      this.markers?.material?.dispose();
      this.collider?.geometry?.dispose();
      this.collider?.material?.dispose();
      this.scene?.clear();
      await this.renderer?.dispose?.();
    } catch (e) {
      this.lastError = String(e?.message || e);
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.physics = null;
    this.bvh = null;
    this.markers = null;
    this.collider = null;
    this.core = null;
    this.canvas = null;
    this.stats.disposed += 1;
    return true;
  }

  report() {
    return {
      phase: PHASE,
      backend: this.backend,
      adapter: this.adapterInfo,
      suspended: this._suspended,
      lastError: this.lastError,
      ...this.stats
    };
  }
}
