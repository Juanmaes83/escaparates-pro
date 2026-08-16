/**
 * The launch configuration that can actually present WebGPU in this container.
 *
 * WHY THIS FILE EXISTS
 *
 * Every Breeze harness was launching Chromium with `--use-gl=swiftshader
 * --enable-unsafe-swiftshader --enable-unsafe-webgpu`. Under that configuration
 * WebGPU looks entirely healthy — `navigator.gpu` answers, an adapter is
 * returned (google/swiftshader), a device is created, compute passes dispatch
 * and return correct values — and then the first `renderAsync` to a canvas
 * silently loses the device with
 *
 *     A valid external Instance reference no longer exists.
 *
 * Nothing throws. `renderAsync` resolves. The canvas simply stays blank, and
 * every later GPU call fails with the same message — which is why the Phase 1A
 * readback appeared to be the problem. It was not: the readback was being asked
 * of a device that had already died at the first render.
 *
 * Isolating it phase by phase put the death on `render de escena vacía` — an
 * empty scene, no Venus, no cloth, no physics, no shadows. So it was never the
 * installation's weight or the donor's code.
 *
 * Sweeping launch configurations found one that presents and keeps the device:
 * WebGPU on SwiftShader's **Vulkan** path rather than the GL one.
 *
 *   --enable-features=Vulkan --use-vulkan=swiftshader --use-angle=swiftshader
 *
 * Under it: adapter google/swiftshader, backend webgpu, canvas render ok, device
 * alive, offscreen render target ok.
 *
 * THE GENERALIZABLE PART
 *
 * "WebGPU is available" is three separate questions — is there an adapter, can
 * it compute, and can it *present* — and this environment answers yes, yes, no
 * to the previous configuration. A capability probe that stops at the adapter,
 * or even at a compute pass, will report a capability the product cannot use.
 * Probe the operation the product actually performs.
 */

/** Chromium args that present WebGPU correctly in this container. */
export const WEBGPU_ARGS = Object.freeze([
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-vulkan=swiftshader',
  '--use-angle=swiftshader',
  '--disable-gpu-sandbox'
]);

/**
 * Verify presentation rather than availability, in the page under test.
 * Returns `{ adapter, backend, render, device, ok }`; `ok` is true only when a
 * canvas render completed AND the device is still alive afterwards.
 */
export const PRESENTATION_PROBE = `async (coreUrl) => {
  const { THREE } = await import(coreUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 100;
  canvas.style.cssText = 'position:absolute;left:-9999px';
  document.body.appendChild(canvas);
  const out = { adapter: null, backend: null, render: null, device: null, ok: false };
  try {
    const a = await navigator.gpu?.requestAdapter();
    out.adapter = a ? ((a.info?.vendor || '?') + '/' + (a.info?.architecture || '?')) : null;
    const r = new THREE.WebGPURenderer({ canvas, antialias: false });
    r.setPixelRatio(1); r.setSize(160, 100, false);
    await r.init();
    out.backend = r.backend?.isWebGPUBackend ? 'webgpu' : 'webgl';
    const dev = r.backend?.device;
    const s = new THREE.Scene(); s.background = new THREE.Color(0x223344);
    const c = new THREE.PerspectiveCamera(50, 1.6, 0.1, 10); c.position.z = 3;
    await r.renderAsync(s, c);
    out.render = 'ok';
    out.device = await Promise.race([
      dev.lost.then((i) => 'lost: ' + i.message),
      new Promise((res) => setTimeout(() => res('alive'), 400))
    ]);
    out.ok = out.backend === 'webgpu' && out.render === 'ok' && out.device === 'alive';
    await r.dispose();
    canvas.remove();
  } catch (e) { out.render = 'error: ' + (e?.message || e); }
  return out;
}`;
