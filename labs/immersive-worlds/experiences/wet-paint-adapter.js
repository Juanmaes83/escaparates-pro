/**
 * Wet Paint adapter — the thin, donor-specific mapping for the Experience Bridge,
 * plus the Museum-room wiring that connects it to the itinerant lab.
 *
 * The donor (`wet-paint-flow` @ 0b9ba9a, preserved under
 * ./wet-paint-flow/) already exposes everything the host needs, so it is hosted
 * intact — ZERO donor edits:
 *
 *   input   : <input id="source-upload" type="file">   (drive it, same-origin)
 *   status  : window.__vangoghFlowState { ready, sourceMode, strokes, sourceSize }
 *             document.documentElement.dataset.growthProgress (0→1)
 *             window.__vangoghFlowErrors []
 *   result  : the WebGL canvas at #canvas-mount (one still after RESULT_READY)
 *
 * The adapter maps the generic bridge contract onto exactly those surfaces.
 */

import { THREE } from '../render/render-host.js';
import { createExperienceBridge, STATUS } from './experience-bridge.js';
import { StudioShell } from '../authoring/studio/studio-shell.js';

const EXPERIENCE_ID = 'wet-paint-flow';
const STANDALONE_URL = './experiences/wet-paint-flow/index.html';
const ORIGINAL_ENTITY_ID = 'entity.itinerant.original';
const PAINTERLY_ENTITY_ID = 'entity.itinerant.painterly';

// ── Donor mapping (generic contract → donor surfaces) ──────────────────────

const donorAdapter = {
    isReady(iframe) {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        return Boolean(win?.__vangoghFlowState?.ready && doc?.getElementById('source-upload'));
    },

    setSource(iframe, file) {
        const doc = iframe.contentDocument;
        const input = doc?.getElementById('source-upload');
        if (!input) throw new Error('wet-paint standalone: #source-upload not found');
        // Baselines used by readStatus to detect the fresh growth cycle for THIS source.
        iframe.__wpErrBaseline = (iframe.contentWindow.__vangoghFlowErrors || []).length;
        iframe.__wpSawRestart = false;
        // Drive the donor's own upload control (same-origin), exactly like Rope
        // Gallery delegates to a standalone's internal controls.
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    },

    readStatus(iframe, sinceTs) {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        const state = win?.__vangoghFlowState;
        const errs = win?.__vangoghFlowErrors || [];
        if ((iframe.__wpErrBaseline ?? 0) < errs.length) {
            return { status: STATUS.ERROR, error: errs[errs.length - 1] };
        }
        if (!state?.ready) return { status: STATUS.BOOTING };

        const progress = Number(doc?.documentElement?.dataset?.growthProgress || 0);
        const strokes = state.strokes || 0;
        // A brand-new source restarts growth from 0; observing progress < 1 once
        // proves we are in the NEW cycle and not reading a stale, already-complete
        // progress value from the previous source.
        if (progress < 1) iframe.__wpSawRestart = true;

        const elapsed = performance.now() - (sinceTs || 0);
        const settled = iframe.__wpSawRestart || elapsed > 1500;
        if (state.sourceMode === 'image' && strokes > 0 && progress >= 1 && settled) {
            return { status: STATUS.RESULT_READY, strokes, sourceSize: state.sourceSize, progress };
        }
        return { status: STATUS.PROCESSING, strokes, progress };
    },

    async captureResult(iframe) {
        const doc = iframe.contentDocument;
        const canvas = doc?.querySelector('#canvas-mount canvas');
        if (!canvas) return null;
        // Single explicit frame capture, timed inside a render tick — the same
        // toBlob/toDataURL-on-canvas the donor's own "Export PNG" proves works.
        await new Promise((r) => (iframe.contentWindow || window).requestAnimationFrame(r));
        try {
            return canvas.toDataURL('image/png');
        } catch {
            return null;
        }
    },

    replay(iframe) {
        iframe.contentDocument?.getElementById('replay-growth-button')?.click();
    },
};

// ── Museum-room wiring ─────────────────────────────────────────────────────

function findArtworkPlate(sceneKit, entityId) {
    const record = sceneKit?._entityIndex?.get(entityId);
    const root = record?.object;
    if (!root) return null;
    let best = null;
    let bestArea = 0;
    root.traverse?.((node) => {
        if (!node?.isMesh || node.geometry?.type !== 'PlaneGeometry' || !node.material) return;
        const p = node.geometry.parameters || {};
        const area = Number(p.width || 0) * Number(p.height || 0);
        if (area > bestArea) { best = node; bestArea = area; }
    });
    return best;
}

function applyResultToPlate(plate, dataUrl) {
    if (!plate?.material || !dataUrl) return;
    const image = new Image();
    image.onload = () => {
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.needsUpdate = true;
        const previous = plate.material.map;
        plate.material.map = texture;
        plate.material.needsUpdate = true;
        if (previous && previous !== texture) { try { previous.dispose?.(); } catch { /* noop */ } }
    };
    image.src = dataUrl;
}

function addExperienceButton(bridge) {
    if (document.getElementById('wp-open-experience')) return;
    const btn = document.createElement('button');
    btn.id = 'wp-open-experience';
    btn.type = 'button';
    btn.textContent = 'Ver Wet Paint · experiencia real';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '16px', right: '16px', zIndex: '55',
        padding: '10px 16px', borderRadius: '999px', cursor: 'pointer',
        border: '1px solid rgba(236,231,221,.4)', background: 'rgba(16,15,14,.92)',
        color: '#ece7dd', font: '500 12px/1 system-ui, sans-serif', letterSpacing: '.06em',
    });
    btn.addEventListener('click', () => bridge.open());
    document.body.appendChild(btn);
}

let bridge = null;

export function installWetPaint(runtime) {
    const sceneKit = runtime?.sceneKit;
    if (!sceneKit) {
        console.error('[WetPaintBridge] runtime.sceneKit not available');
        return null;
    }

    bridge = createExperienceBridge({
        id: EXPERIENCE_ID,
        url: STANDALONE_URL,
        adapter: donorAdapter,
        onStatus: (status, extra) => {
            console.log(`[WetPaintBridge] ${status}${extra?.strokes ? ` · ${extra.strokes} strokes` : ''}`);
        },
    });
    addExperienceButton(bridge);

    // Input seam: when an image is uploaded to 01 ORIGINAL, hand that exact file
    // to the donor and, when it finishes, place the captured result on 02.
    // 01 ORIGINAL's own raw-image plate is handled by wet-paint-visible-media.js;
    // this bridge only drives the donor and the 02 plate.
    const originalTakeFile = StudioShell.prototype._takeFile;
    StudioShell.prototype._takeFile = async function wetPaintBridgeTakeFile(slot, file) {
        await originalTakeFile.call(this, slot, file);
        if (!file || this.selectedId !== ORIGINAL_ENTITY_ID) return;
        const entity = (this.world.entities || []).find((item) => item.id === this.selectedId);
        if (entity?.kind !== 'ARTWORK') return;
        if (!String(file.type || '').startsWith('image/')) return;

        try {
            const result = await bridge.process(file);
            if (result.status === STATUS.RESULT_READY && result.resultDataUrl) {
                const plate = findArtworkPlate(sceneKit, PAINTERLY_ENTITY_ID);
                applyResultToPlate(plate, result.resultDataUrl);
                console.log('[WetPaintBridge] 02 WET PAINT updated from real donor result');
            } else {
                console.warn('[WetPaintBridge] donor did not produce a result:', result.status);
            }
        } catch (error) {
            console.error('[WetPaintBridge] processing failed:', error);
        }
    };

    window.__WET_PAINT_BRIDGE = {
        bridge,
        process: (file) => bridge.process(file),
        applyResultToPlate: (dataUrl) => applyResultToPlate(findArtworkPlate(sceneKit, PAINTERLY_ENTITY_ID), dataUrl),
        open: () => bridge.open(),
        close: () => bridge.close(),
    };

    return { bridge };
}
