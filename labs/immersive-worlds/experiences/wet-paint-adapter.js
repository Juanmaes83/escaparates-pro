/**
 * Wet Paint — engine adapter (no UI).
 *
 * The donor (`wet-paint-flow` @ 0b9ba9a, preserved under ./wet-paint-flow/) runs
 * intact as a HIDDEN technical engine inside an off-screen iframe. This module
 * exposes a small engine API (window.__WET_PAINT_ENGINE) that drives the donor's
 * REAL controls and returns results. It renders NO user interface: all Museum UI
 * lives natively in the Studio editor (authoring/studio/wet-paint-studio-controls.js).
 *
 * Habitación 3 philosophy: DONOR = technology (no GUI shown), MUSEUM = experience.
 * The visitor/author never sees the donor.
 */

import { THREE } from '../render/render-host.js';
import { createExperienceBridge, STATUS } from './experience-bridge.js';
import { StudioShell } from '../authoring/studio/studio-shell.js';
import { SCENE_TITLES_ES } from './wet-paint-museum-skin.js';
import { WetPaintStore } from './wet-paint-store.js';

const EXPERIENCE_ID = 'wet-paint-flow';
const STANDALONE_URL = './experiences/wet-paint-flow/index.html';
const SCENE_BASE = './experiences/wet-paint-flow/scenes/full/';
const SCENE_THUMB = './experiences/wet-paint-flow/scenes/thumb/';
const ORIGINAL_ENTITY_ID = 'entity.itinerant.original';
const PAINTERLY_ENTITY_ID = 'entity.itinerant.painterly';

// Collection order (matches the donor manifest); Spanish titles from the skin map.
const SCENE_ORDER = [
    'sunflowers', 'roses', 'auvers-church', 'vineyards-auvers', 'olive-trees-blue-sky',
    'cypresses', 'wheat-field-cypresses', 'olive-trees-yellow-sky', 'seascape-saintes-maries',
    'yellow-house', 'starry-night',
];

// ── Donor mapping (drive the donor's real controls; zero donor edits) ───────

const donor = {
    isReady(iframe) {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        return Boolean(win?.__vangoghFlowState?.ready && doc?.getElementById('source-upload'));
    },

    setSource(iframe, file) {
        const input = iframe.contentDocument?.getElementById('source-upload');
        if (!input) throw new Error('wet-paint: #source-upload not found');
        iframe.__wpErrBaseline = (iframe.contentWindow.__vangoghFlowErrors || []).length;
        iframe.__wpSawRestart = false;
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
        if ((iframe.__wpErrBaseline ?? 0) < errs.length) return { status: STATUS.ERROR, error: errs[errs.length - 1] };
        if (!state?.ready) return { status: STATUS.BOOTING };
        const progress = Number(doc?.documentElement?.dataset?.growthProgress || 0);
        const strokes = state.strokes || 0;
        if (progress < 1) iframe.__wpSawRestart = true;
        const settled = iframe.__wpSawRestart || (performance.now() - (sinceTs || 0)) > 1500;
        if (state.sourceMode === 'image' && strokes > 0 && progress >= 1 && settled) {
            return { status: STATUS.RESULT_READY, strokes, progress };
        }
        return { status: STATUS.PROCESSING, strokes, progress };
    },

    // Capture on the donor's own rAF DURING active growth (its buffer is only
    // fresh while it is drawing; it stops once growth completes).
    refreshResult(iframe, timeoutMs = 10000) {
        return new Promise((resolve) => {
            const win = iframe.contentWindow;
            const doc = iframe.contentDocument;
            const canvas = doc?.querySelector('#canvas-mount canvas');
            if (!win || !canvas) { resolve(null); return; }
            // Brightness probe: a freshly drawn painted frame is bright; the donor's
            // early-growth/cleared buffer is near-black navy. Keep the brightest
            // painted frame so 02 never lands on a dark mid-growth capture.
            const scratch = doc.createElement('canvas'); scratch.width = 16; scratch.height = 12;
            const sctx = scratch.getContext('2d', { willReadFrequently: true });
            const brightness = () => {
                try {
                    sctx.drawImage(canvas, 0, 0, 16, 12);
                    const d = sctx.getImageData(0, 0, 16, 12).data;
                    let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
                    return s / (16 * 12);
                } catch { return 0; }
            };
            doc.getElementById('replay-growth-button')?.click();
            const startedAt = performance.now();
            let best = null; let bestScore = -1; let sawGrowth = false;
            const step = () => {
                const gp = Number(doc.documentElement.dataset.growthProgress || 0);
                if (gp > 0.05 && gp <= 1) {
                    sawGrowth = true;
                    const b = brightness();
                    // Prefer later, brighter (more painted) frames; ignore near-black.
                    const score = b * (0.5 + gp);
                    if (b > 90 && score >= bestScore) { try { best = canvas.toDataURL('image/png'); bestScore = score; } catch { /* transient */ } }
                }
                if ((gp >= 1 && best && sawGrowth) || performance.now() - startedAt > timeoutMs) {
                    if (!best) { try { best = canvas.toDataURL('image/png'); } catch { /* noop */ } }
                    resolve(best);
                    return;
                }
                win.requestAnimationFrame(step);
            };
            win.requestAnimationFrame(step);
        });
    },

    getParams(iframe) {
        const doc = iframe.contentDocument;
        if (!doc) return null;
        const params = {};
        doc.querySelectorAll('input[data-param]').forEach((i) => { params[i.dataset.param] = i.value; });
        const q = doc.getElementById('quality-mode'); if (q) params.quality = q.value;
        const vm = doc.querySelector('input[name="layer-mode"]:checked'); if (vm) params.viewMode = vm.value;
        params.brushLayers = [...doc.querySelectorAll('input[data-brush-layer]')].map((c) => c.checked);
        return params;
    },

    setParam(iframe, name, value) {
        const doc = iframe.contentDocument;
        const el = doc?.querySelector(`input[data-param="${name}"]`);
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    },

    setQuality(iframe, value) {
        const q = iframe.contentDocument?.getElementById('quality-mode');
        if (q) { q.value = value; q.dispatchEvent(new Event('change', { bubbles: true })); }
    },

    setViewMode(iframe, value) {
        const r = iframe.contentDocument?.querySelector(`input[name="layer-mode"][value="${value}"]`);
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    },

    setBrushLayer(iframe, idx, on) {
        const c = iframe.contentDocument?.querySelectorAll('input[data-brush-layer]')[idx];
        if (c && c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); }
    },

    setTimeline(iframe, seconds) {
        const t = iframe.contentDocument?.getElementById('growth-timeline');
        if (t) { t.value = String(seconds); t.dispatchEvent(new Event('input', { bubbles: true })); }
    },

    replay(iframe) { iframe.contentDocument?.getElementById('replay-growth-button')?.click(); },
    pause(iframe) { iframe.contentDocument?.getElementById('pause-button')?.click(); },
    exportPng(iframe) { iframe.contentDocument?.getElementById('export-button')?.click(); },
    exportVideo(iframe) { iframe.contentDocument?.getElementById('video-export-button')?.click(); },

    applyParams(iframe, params) {
        if (!params) return;
        if (params.brushLayers && Array.isArray(params.brushLayers)) {
            params.brushLayers.forEach((on, i) => { if (typeof on === 'boolean') donor.setBrushLayer(iframe, i, on); });
        }
        Object.entries(params).forEach(([k, v]) => {
            if (['quality', 'viewMode', 'brushLayers'].includes(k)) return;
            donor.setParam(iframe, k, v);
        });
        if (params.quality) donor.setQuality(iframe, params.quality);
        if (params.viewMode) donor.setViewMode(iframe, params.viewMode);
    },
};

// ── Museum plate helpers ────────────────────────────────────────────────────

function findArtworkPlate(sceneKit, entityId) {
    const root = sceneKit?._entityIndex?.get(entityId)?.object;
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

function applyImageToPlate(plate, src) {
    return new Promise((resolve) => {
        if (!plate?.material || !src) { resolve(false); return; }
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const texture = new THREE.Texture(image);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 8;
            texture.needsUpdate = true;
            const previous = plate.material.map;
            plate.material.map = texture;
            plate.material.needsUpdate = true;
            if (previous && previous !== texture) { try { previous.dispose?.(); } catch { /* noop */ } }
            resolve(true);
        };
        image.onerror = () => resolve(false);
        image.src = src;
    });
}

// ── Engine (state + orchestration) ──────────────────────────────────────────

let bridge = null;
let sceneKitRef = null;
let refreshTimer = 0;

const paintPlate = () => findArtworkPlate(sceneKitRef, PAINTERLY_ENTITY_ID);
const origPlate = () => findArtworkPlate(sceneKitRef, ORIGINAL_ENTITY_ID);

function notify(kind, detail) {
    try { window.dispatchEvent(new CustomEvent('wetpaint:status', { detail: { kind, ...detail } })); } catch { /* noop */ }
}

async function ensureReady() { return bridge.waitReady(); }

// Capture the current donor result and put it on 02; optionally persist.
async function refreshTo02({ persist = false, sourceName } = {}) {
    const dataUrl = await donor.refreshResult(bridge.element);
    if (!dataUrl) { notify('error', { message: 'sin resultado' }); return false; }
    await applyImageToPlate(paintPlate(), dataUrl);
    if (persist) {
        const rec = { params: donor.getParams(bridge.element), resultDataUrl: dataUrl };
        const prev = WetPaintStore.get(PAINTERLY_ENTITY_ID) || {};
        if (sourceName) rec.sourceName = sourceName; else if (prev.sourceName) rec.sourceName = prev.sourceName;
        WetPaintStore.save(PAINTERLY_ENTITY_ID, rec);
    }
    notify('result', {});
    return true;
}

// Debounced live reflection into 02 so the author validates in the central room.
function scheduleLiveRefresh() {
    clearTimeout(refreshTimer);
    notify('processing', {});
    refreshTimer = setTimeout(() => { refreshTo02({ persist: true }); }, 700);
}

const engine = {
    get ready() { return bridge && donor.isReady(bridge.element); },
    scenes: () => SCENE_ORDER.map((id) => ({ id, title: SCENE_TITLES_ES[id] || id, thumb: `${SCENE_THUMB}${id}.webp` })),
    getParams: () => donor.getParams(bridge.element),

    setParam(name, value) { donor.setParam(bridge.element, name, value); scheduleLiveRefresh(); },
    setQuality(v) { donor.setQuality(bridge.element, v); scheduleLiveRefresh(); },
    setViewMode(v) { donor.setViewMode(bridge.element, v); scheduleLiveRefresh(); },
    setBrushLayer(i, on) { donor.setBrushLayer(bridge.element, i, on); scheduleLiveRefresh(); },
    setTimeline(v) { donor.setTimeline(bridge.element, v); },
    replay() { donor.replay(bridge.element); scheduleLiveRefresh(); },
    pause() { donor.pause(bridge.element); },
    exportPng() { donor.exportPng(bridge.element); },
    exportVideo() { donor.exportVideo(bridge.element); },

    async syncFromLibrary(sceneId) {
        await ensureReady();
        notify('processing', {});
        const doc = bridge.element.contentDocument;
        doc.querySelector(`.scene-card[data-scene-id="${sceneId}"]`)?.click();
        const start = performance.now();
        while (performance.now() - start < 12000) {
            if (doc.documentElement.dataset.activeSceneId === sceneId) break;
            await new Promise((r) => setTimeout(r, 150));
        }
        await applyImageToPlate(origPlate(), `${SCENE_BASE}${sceneId}.webp`);
        await refreshTo02({ persist: true, sourceName: sceneId });
        notify('result', { source: sceneId });
    },

    async processFromEditor(file) {
        await ensureReady();
        notify('processing', {});
        const url = URL.createObjectURL(file);
        await applyImageToPlate(origPlate(), url);
        const result = await bridge.process(file);
        let dataUrl = result.status === STATUS.RESULT_READY ? result.resultDataUrl : null;
        const saved = WetPaintStore.get(PAINTERLY_ENTITY_ID);
        if (dataUrl && saved?.params) { donor.applyParams(bridge.element, saved.params); dataUrl = (await donor.refreshResult(bridge.element)) || dataUrl; }
        if (dataUrl) {
            await applyImageToPlate(paintPlate(), dataUrl);
            WetPaintStore.save(PAINTERLY_ENTITY_ID, { params: donor.getParams(bridge.element), resultDataUrl: dataUrl });
            notify('result', {});
        } else { notify('error', { message: 'sin resultado' }); }
    },

    async saveAndApply() {
        notify('processing', {});
        const ok = await refreshTo02({ persist: true });
        notify(ok ? 'saved' : 'error', {});
        return ok;
    },
};

// ── Install ──────────────────────────────────────────────────────────────

export function installWetPaint(runtime) {
    const sceneKit = runtime?.sceneKit;
    if (!sceneKit) { console.error('[WetPaint] runtime.sceneKit not available'); return null; }
    sceneKitRef = sceneKit;

    bridge = createExperienceBridge({
        id: EXPERIENCE_ID,
        url: STANDALONE_URL,
        adapter: donor,
        onStatus: () => {},
    });
    // The donor is a hidden engine — never presented. Keep the iframe off-screen.

    // Restore saved personalization so authoring and the visitor show one truth.
    bridge.waitReady().then(async () => {
        const saved = WetPaintStore.get(PAINTERLY_ENTITY_ID);
        if (saved?.resultDataUrl) {
            await applyImageToPlate(paintPlate(), saved.resultDataUrl);
            if (saved.sourceName) await applyImageToPlate(origPlate(), `${SCENE_BASE}${saved.sourceName}.webp`);
        }
        notify('ready', {});
    });

    // Upload to 01 via the Studio media slot → donor → 02.
    const originalTakeFile = StudioShell.prototype._takeFile;
    StudioShell.prototype._takeFile = async function wetPaintTakeFile(slot, file) {
        await originalTakeFile.call(this, slot, file);
        if (!file || this.selectedId !== ORIGINAL_ENTITY_ID) return;
        const entity = (this.world.entities || []).find((item) => item.id === this.selectedId);
        if (entity?.kind !== 'ARTWORK' || !String(file.type || '').startsWith('image/')) return;
        try {
            const saved = WetPaintStore.get(PAINTERLY_ENTITY_ID);
            const result = await bridge.process(file);
            if (result.status === STATUS.RESULT_READY && result.resultDataUrl) {
                let dataUrl = result.resultDataUrl;
                if (saved?.params) { donor.applyParams(bridge.element, saved.params); dataUrl = (await donor.refreshResult(bridge.element)) || dataUrl; }
                await applyImageToPlate(paintPlate(), dataUrl);
                WetPaintStore.save(PAINTERLY_ENTITY_ID, { params: donor.getParams(bridge.element), resultDataUrl: dataUrl });
                notify('result', {});
            }
        } catch (error) { console.error('[WetPaint] upload processing failed:', error); notify('error', { message: String(error) }); }
    };

    window.__WET_PAINT_ENGINE = engine;
    return { engine, bridge };
}
