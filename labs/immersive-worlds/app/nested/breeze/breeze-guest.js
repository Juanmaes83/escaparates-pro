/**
 * The Breeze installation, running inside the Museum as an Option E1 guest.
 *
 * Everything that makes this Breeze comes from `vendor/breeze-core/`, built from
 * `Juanmaes83/breeze@0ab8234` with the physics, the cloth, the sculpture, the
 * wind field and the key light byte-identical to the donor:
 *
 *   REAL   WebGPU device and `WebGPURenderer` — a WebGL fallback is refused
 *   REAL   `VerletPhysics` — donor kernels, dispatched on the GPU
 *   REAL   `Statue` — the Venus de Milo GLB, and the OBJ its collider is built from
 *   REAL   `BVH` — donor traversal, compiled into the vertex kernel
 *   REAL   `ClothGeometry` — the 80×80 spring lattice, the fabric maps, the
 *          `MeshPhysicalNodeMaterial` with its sheen, and the TSL position node
 *          that reads every vertex straight out of the physics buffer
 *   REAL   wind — the donor's `triNoise3Dvec` field, its own expression
 *
 *   MUSEUM   the camera, the room, the lighting environment, the lifecycle, and
 *            when the cloth is launched
 *
 * There is no CPU animation anywhere. The visible fabric is positioned by
 * `material.positionNode`, which samples `smoothedPosition` per vertex on the
 * GPU — so if the compute pass stopped, the cloth would freeze rather than keep
 * moving. That property is what the pixel evidence tests.
 *
 * CAMERA
 *
 *   MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.
 *
 * No `OrbitControls`, no `autoRotate`, no pointer or key listeners, no way to
 * write a pose back. `setCameraPose` is the only thing that moves the camera and
 * the Director is the only thing that calls it.
 *
 * COORDINATES
 *
 * The guest does not have a coordinate space of its own. The Museum's Breeze
 * room is authored directly in the installation's coordinates — Venus at the
 * origin, the cloth entering from −X — so a pose the Director resolves is a pose
 * this scene can use unchanged. One space, one truth, no conversion to get
 * subtly wrong.
 */

/** The vendored core. Resolved relative to this file so no import map is needed. */
export const BREEZE_CORE_URL = new URL(
  '../../../vendor/breeze-core/breeze-core.js', import.meta.url
).href;

export const PHASE = '1B-1E';

/**
 * Product-facing wind, as the spec asks for: named strengths rather than a raw
 * coefficient. `BREEZE` is exactly the donor's cloth scene — multiplier 1.0
 * leaves its expression untouched — so the authored default is the look that was
 * approved, and the other levels scale that same force rather than substituting
 * a different one.
 */
export const WIND = Object.freeze({
  CALM: 0,
  BREEZE: 1,
  GUST: 1.8
});

export class BreezeGuest {
  constructor({
    coreUrl = BREEZE_CORE_URL,
    clothSegments = 80,
    pixelRatio,
    wind = 'BREEZE'
  } = {}) {
    this.coreUrl = coreUrl;
    this.clothSegments = clothSegments;
    this.pixelRatio = pixelRatio;
    this.windLevel = wind;

    this.core = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.physics = null;
    this.statue = null;
    this.cloth = null;
    this.clothGeometry = null;
    this.lights = null;
    this.canvas = null;
    this.uniforms = {};

    this._stepping = false;
    this._reading = false;
    this._suspended = false;
    this._elapsed = 0;
    this._sinceLaunch = 0;

    this.stats = {
      prepared: 0, activated: 0, suspended: 0, restored: 0, disposed: 0,
      frames: 0, steps: 0, poses: 0, launches: 0, vertexCount: 0, springCount: 0
    };
    this.backend = null;
    this.adapterInfo = null;
    this.lastError = null;
  }

  /**
   * Acquire the device.
   *
   * Separated from `activate` because the host stands the Museum down only once
   * this resolves, and device acquisition is the slow, failure-prone part. Doing
   * it after the handoff is how an activation shows a black frame.
   */
  async prepare({ canvas, config = {} } = {}) {
    this.canvas = canvas;
    if (!navigator.gpu) {
      throw new Error('BREEZE: este navegador no expone WebGPU (navigator.gpu ausente)');
    }

    this.core = await import(/* @vite-ignore */ this.coreUrl);
    const { THREE } = this.core;

    // No `forceWebGL`. A silent fallback would run the room without the compute
    // pipeline the room exists for, and would look almost right.
    this.renderer = new THREE.WebGPURenderer({ canvas, antialias: config.antialias !== false });
    this.renderer.setPixelRatio(this.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = config.exposure ?? 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    await this.renderer.init();

    this.backend = this.renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl';
    if (this.backend !== 'webgpu') {
      throw new Error('BREEZE: el renderer cayó a WebGL; el núcleo de cómputo no puede ejecutarse');
    }
    try {
      const info = this.renderer.backend?.adapter?.info;
      if (info) this.adapterInfo = { vendor: info.vendor, architecture: info.architecture };
    } catch { /* advisory */ }

    this.stats.prepared += 1;
    return true;
  }

  async activate({ config = {} } = {}) {
    const { THREE, TSL, VerletPhysics, Statue, ClothGeometry, Lights, triNoise3Dvec } = this.core;
    const { vec3, smoothstep, uniform } = TSL;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.background ?? 0x14120f);

    this.camera = new THREE.PerspectiveCamera(config.fov ?? 40, this._aspect(), 0.05, 400);

    // Image-based lighting from a neutral studio environment rather than the
    // donor's outdoor HDRI skybox. The spec's background contract is explicit
    // that the standalone screen background is not a Museum world background,
    // and lists "bounded installation background" as a representation — an
    // outdoor sky inside a gallery would be the demo showing through. The
    // donor's decoder also spins up a second WebGLRenderer per load and never
    // disposes it, which across repeated room entries is a leaked context each
    // time.
    // `RoomEnvironment` comes from the Breeze bundle, not from `vendor/three/`.
    // The first version of this built it from the Museum's WebGL Three 0.185 and
    // handed the result to this renderer's PMREM generator, which lost the
    // WebGPU device outright — "a valid external Instance reference no longer
    // exists" — with nothing thrown to catch and a blank canvas as the only
    // symptom. Two Three instances in one page is the design; one object
    // crossing between them is the bug.
    if (config.environment !== false) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this._envTarget = pmrem.fromScene(new this.core.RoomEnvironment(), 0.04);
      this.scene.environment = this._envTarget.texture;
      this.scene.environmentIntensity = config.environmentIntensity ?? 0.55;
      this._pmrem = pmrem;
    }

    // ── The sculpture. Donor class, donor GLB, donor collision OBJ. ──────────
    this.statue = new Statue();
    await this.statue.init();
    this.scene.add(this.statue.object);

    this.lights = new Lights();
    this.scene.add(this.lights.object);

    // ── The physics, with the donor's own wind, scaled by a named level. ────
    this.physics = new VerletPhysics(this.renderer);
    this.uniforms.wind = uniform(WIND[this.windLevel] ?? WIND.BREEZE);

    // The donor's cloth-scene force, unaltered except for the trailing factor
    // that turns it into an authored strength. At BREEZE the factor is 1 and the
    // expression is the donor's exactly; at CALM it is 0 and only gravity acts,
    // which is what makes "the wind is real" checkable rather than asserted.
    this.physics.addForce((position, time) => {
      const force = vec3(0).toVar();
      force.y.subAssign(0.000001);
      const noise = triNoise3Dvec(position.mul(0.01), 0.2, time).sub(vec3(0.0, 0.285, 0.285));
      const chaos = smoothstep(-0.5, 1, position.x).mul(0.0001).toVar();
      force.addAssign(noise.mul(vec3(0.00005, chaos, chaos)).mul(5).mul(this.uniforms.wind));
      return force;
    });

    // The collider is built from the sculpture's own geometry, not from a proxy
    // primitive. Replacing the visual without replacing this is called out in
    // the spec as a failure, so the two arrive together or not at all.
    this.physics.addCollider(this.statue.bvh);

    // ── The cloth. Donor lattice, donor fabric, donor material. ──────────────
    this.clothGeometry = new ClothGeometry(this.physics, this.clothSegments, this.clothSegments);
    this.cloth = this.clothGeometry.addInstance();
    await this.clothGeometry.bake();
    this.scene.add(this.clothGeometry.object);

    this._spawn = new THREE.Vector3(...(config.clothSpawn ?? [-10, 5.0, 0]));
    await this.physics.resetObject(this.cloth.id, this._spawn, new THREE.Quaternion());

    await this.physics.bake();

    // The donor's frame loop reads object positions off the GPU every fiftieth
    // frame, unawaited and uncaught, to decide when a cloth has flown past and
    // should be recycled. That map fails in this environment once rendering is
    // active — see qa/tools/breeze-readback-calibration.mjs — and an uncaught
    // rejection every fifty frames is noise the Museum would have to explain.
    // The call is neutralised on this instance only; the donor file is
    // untouched, and the recycle it fed is replaced below by a launch the room
    // controls, which the room wants anyway.
    this.physics.readPositions = async () => {};

    this.stats.vertexCount = this.physics.vertexCount;
    this.stats.springCount = this.physics.springCount;
    this.stats.launches = 1;
    this._sinceLaunch = 0;

    // Physics defaults: the donor's cloth scene overrides friction to 0.25.
    this.core.physicsConfig.friction = config.friction ?? 0.25;
    this.core.physicsConfig.stiffness = config.stiffness ?? 0.25;

    this.resize();
    this.stats.activated += 1;
    return true;
  }

  /**
   * Relaunch the cloth on a clock the room owns.
   *
   * The spec asks explicitly whether the physics should stay fully continuous,
   * be seeded, or use a controlled launch, and answers that museum dramaturgy
   * has to be reliable: a visitor arriving at a Tour Stop must actually see the
   * approach, the contact and the release, not whatever phase the simulation
   * happened to be in. So the launch is deterministic and the flight is not —
   * the cloth is released at a known moment and the wind does what it does.
   *
   * This also replaces the donor's recycle, which depended on reading object
   * positions back off the GPU every fiftieth frame.
   */
  async relaunch() {
    if (!this.physics?.isBaked || !this.cloth) return false;
    const { THREE } = this.core;
    await this.physics.resetObject(this.cloth.id, this._spawn, new THREE.Quaternion());
    this._sinceLaunch = 0;
    this.stats.launches += 1;
    return true;
  }

  /** Named wind, applied live. The room authors it; there is no GUI. */
  setWind(level) {
    if (!(level in WIND)) return false;
    this.windLevel = level;
    if (this.uniforms.wind) this.uniforms.wind.value = WIND[level];
    return true;
  }

  setCameraPose(pose) {
    if (!this.camera || !pose) return false;
    const [px, py, pz] = pose.position;
    const [tx, ty, tz] = pose.target;
    this.camera.position.set(px, py, pz);
    this.camera.lookAt(tx, ty, tz);
    if (typeof pose.fov === 'number' && pose.fov !== this.camera.fov) this.camera.fov = pose.fov;
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
   * The host's loop is synchronous and the physics is not, so a step already in
   * flight is skipped rather than queued. Awaiting inside `requestAnimationFrame`
   * would let compute dispatches pile up behind a slow frame until the tab
   * stalls, and the visible symptom would be the room freezing — which reads as
   * a Museum bug rather than as backpressure.
   */
  update(dt) {
    if (!this.renderer || this._suspended || this._stepping || this._reading) return false;
    this._stepping = true;
    this._elapsed += dt;
    this._sinceLaunch += dt;
    this.stats.frames += 1;
    this._step(dt).catch((e) => { this.lastError = String(e?.message || e); })
      .finally(() => { this._stepping = false; });
    return true;
  }

  get isStepping() { return this._stepping; }

  /** Simulated seconds since the cloth was last released. */
  get sinceLaunch() { return this._sinceLaunch; }

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
   * Only usable in a window where nothing is being drawn: mapping the vertex
   * buffer while the render pass is reading it fails on this backend, and no
   * amount of gating the frame loop from JavaScript fixes a conflict that is on
   * the GPU. `qa/tools/breeze-readback-calibration.mjs` establishes that, and
   * calibrates this path against three known answers before any evidence relies
   * on it. Motion with the renderer running is proved from pixels instead,
   * which is the stronger claim anyway — it shows the simulation drives what the
   * visitor sees.
   */
  async sampleVertices(limit = 400) {
    if (!this.physics?.isBaked) return null;
    this._reading = true;
    try {
      while (this._stepping) await new Promise((r) => setTimeout(r, 4));
      const ab = await this.renderer.getArrayBufferAsync(this.physics.vertexBuffer.buffer.value);
      const f32 = new Float32Array(ab);
      const i32 = new Int32Array(ab);
      const stride = this.physics.vertexBuffer.structSize;
      const off = this.physics.vertexBuffer.layout.position.offset;
      const fixedOff = this.physics.vertexBuffer.layout.isFixed.offset;
      const step = Math.max(1, Math.floor(this.physics.vertexCount / limit));
      const sample = []; const fixed = [];
      for (let i = 0; i < this.physics.vertexCount; i += step) {
        sample.push([f32[i * stride + off], f32[i * stride + off + 1], f32[i * stride + off + 2]]);
        fixed.push(i32[i * stride + fixedOff]);
      }
      return { stride, offset: off, vertexCount: this.physics.vertexCount, step, sample, fixed };
    } finally {
      this._reading = false;
    }
  }

  /** Advance the simulation without drawing. Used by evidence, not by the room. */
  async stepCompute(frames, dt = 1 / 60) {
    for (let i = 0; i < frames; i += 1) {
      this._elapsed += dt;
      this._sinceLaunch += dt;
      // eslint-disable-next-line no-await-in-loop
      await this.physics.update(dt, this._elapsed);
      this.stats.steps += 1;
    }
    return this.stats.steps;
  }

  /**
   * Release the device and everything hanging off it.
   *
   * Order matters: the scene's own geometries and materials first, then the
   * environment target and the PMREM generator, then the renderer, which is what
   * actually drops the GPU device. A repeated enter/exit that leaked here would
   * accumulate devices until the browser refused another, and the failure would
   * land several rooms later, far from its cause.
   */
  async dispose() {
    this._suspended = true;
    try {
      this.scene?.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose?.();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x?.dispose?.());
        else m?.dispose?.();
      });
      this._envTarget?.dispose?.();
      this._pmrem?.dispose?.();
      this.scene?.clear?.();
      await this.renderer?.dispose?.();
    } catch (e) {
      this.lastError = String(e?.message || e);
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.physics = null;
    this.statue = null;
    this.cloth = null;
    this.clothGeometry = null;
    this.lights = null;
    this._envTarget = null;
    this._pmrem = null;
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
      wind: this.windLevel,
      windValue: this.uniforms.wind?.value ?? null,
      suspended: this._suspended,
      sinceLaunch: +this._sinceLaunch.toFixed(2),
      lastError: this.lastError,
      ...this.stats
    };
  }
}
