/**
 * Immersive Worlds — Render Host
 *
 * Owns the renderer and the camera object. Nothing else may create either.
 */

import * as THREE from '../vendor/three/three.module.min.js';

export class RenderHost {
  constructor({ canvas, quality }) {
    this.canvas = canvas;
    this.quality = quality;

    // Studio preview rebuilds re-enter boot() on the same canvas. The old input
    // system and host must be released before a new WebGLRenderer is created or
    // repeated Apply operations accumulate DOM listeners and GPU resources.
    if (typeof window !== 'undefined') {
      try { window.__IW?.input?.dispose?.(); } catch { /* previous input already gone */ }
      const previous = window.__IW_ACTIVE_RENDER_HOST;
      if (previous && previous !== this) {
        try { previous.dispose(); } catch { /* previous host already gone */ }
      }
      window.__IW_ACTIVE_RENDER_HOST = this;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.antialias,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.info.autoReset = false;

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 220);
    this._target = new THREE.Vector3();

    this.pixelRatio = 1;
    this.width = 1;
    this.height = 1;
    this._disposed = false;
    this.resize();
  }

  viewport() {
    return { aspect: this.camera.aspect, vfov: this.camera.fov };
  }

  resize() {
    if (this._disposed) return false;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width || this.canvas.clientWidth || 1), 1);
    const height = Math.max(Math.floor(rect.height || this.canvas.clientHeight || 1), 1);
    const ratio = Math.min(window.devicePixelRatio || 1, this.quality.dprCap);

    if (width === this.width && height === this.height && ratio === this.pixelRatio) return false;

    this.width = width;
    this.height = height;
    this.pixelRatio = ratio;

    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = this.camera.aspect < 1 ? 66 : this.camera.aspect < 1.4 ? 58 : 52;
    this.camera.updateProjectionMatrix();
    return true;
  }

  applyPose(pose) {
    if (this._disposed) return;
    this.camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    this._target.set(pose.target[0], pose.target[1], pose.target[2]);
    this.camera.lookAt(this._target);
    const base = this.camera.aspect < 1 ? 66 : this.camera.aspect < 1.4 ? 58 : 52;
    const wanted = pose.fov ? (pose.fov + base) / 2 : base;
    if (Math.abs(this.camera.fov - wanted) > 0.05) {
      this.camera.fov = wanted;
      this.camera.updateProjectionMatrix();
    }
  }

  applyQuality(policy) {
    if (this._disposed) return;
    this.quality = policy;
    this.renderer.shadowMap.enabled = policy.shadows;
    this.pixelRatio = -1;
    this.resize();
  }

  async warm(scene) {
    if (this._disposed) return;
    if (typeof this.renderer.compileAsync === 'function') {
      await this.renderer.compileAsync(scene, this.camera);
    } else {
      this.renderer.compile(scene, this.camera);
    }
  }

  render(scene) {
    if (this._disposed) return;
    this.renderer.info.reset();
    this.renderer.render(scene, this.camera);
  }

  stats() {
    if (this._disposed) return { disposed: true };
    const info = this.renderer.info;
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      programs: info.programs?.length ?? 0,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      pixelRatio: this.pixelRatio,
      width: this.width,
      height: this.height
    };
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    try { this.renderer.renderLists?.dispose?.(); } catch { /* optional */ }
    try { this.renderer.dispose(); } catch { /* already disposed */ }
    if (typeof window !== 'undefined' && window.__IW_ACTIVE_RENDER_HOST === this) {
      window.__IW_ACTIVE_RENDER_HOST = null;
    }
  }
}

export { THREE };
