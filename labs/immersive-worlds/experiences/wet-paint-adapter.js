/**
 * Wet Paint — Museum-native integration (re-skin, not rebuild).
 *
 * The donor (`wet-paint-flow` @ 0b9ba9a, preserved under ./wet-paint-flow/) runs
 * intact as the technical brain. This module:
 *   1. drives the donor's REAL controls (no reconstruction) — same sliders,
 *      tabs, Growth, modes, logic;
 *   2. presents them re-skinned as Museum and in Spanish (wet-paint-museum-skin.js);
 *   3. binds 01 ORIGINAL → donor source, and the donor result → 02 WET PAINT plate;
 *   4. persists the personalization so authoring and the visitor see one truth.
 *
 * Habitación 3 philosophy: DONOR = specialized technology, MUSEUM = the visible
 * experience. The visitor never perceives the donor.
 */

import { THREE } from '../render/render-host.js';
import { createExperienceBridge, STATUS } from './experience-bridge.js';
import { StudioShell } from '../authoring/studio/studio-shell.js';
import { applyMuseumSkin } from './wet-paint-museum-skin.js';
import { WetPaintStore } from './wet-paint-store.js';

const EXPERIENCE_ID = 'wet-paint-flow';
const STANDALONE_URL = './experiences/wet-paint-flow/index.html';
const ORIGINAL_ENTITY_ID = 'entity.itinerant.original';
const PAINTERLY_ENTITY_ID = 'entity.itinerant.painterly';

// ── Donor mapping (generic contract → donor surfaces), zero donor edits ─────

const donorAdapter = {
    onLoad(iframe) { applyMuseumSkin(iframe); },

    isReady(iframe) {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        return Boolean(win?.__vangoghFlowState?.ready && doc?.getElementById('source-upload'));
    },

    setSource(iframe, file) {
        const doc = iframe.contentDocument;
        const input = doc?.getElementById('source-upload');
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

    async captureResult(iframe) {
        const canvas = iframe.contentDocument?.querySelector('#canvas-mount canvas');
        if (!canvas) return null;
        await new Promise((r) => (iframe.contentWindow || window).requestAnimationFrame(r));
        try { return canvas.toDataURL('image/png'); } catch { return null; }
    },

    // Read the donor's real control values (for persistence).
    getParams(iframe) {
        const doc = iframe.contentDocument;
        if (!doc) return null;
        const params = {};
        doc.querySelectorAll('input[data-param]').forEach((i) => { params[i.dataset.param] = i.value; });
        const q = doc.getElementById('quality-mode');
        if (q) params.quality = q.value;
        const vm = doc.querySelector('input[name="layer-mode"]:checked');
        if (vm) params.viewMode = vm.value;
        params.brushLayers = [...doc.querySelectorAll('input[data-brush-layer]')].map((c) => c.checked);
        return params;
    },

    // Drive the donor's real controls from a saved set (for restore).
    applyParams(iframe, params) {
        const doc = iframe.contentDocument;
        if (!doc || !params) return;
        const fire = (el, types) => types.forEach((t) => el.dispatchEvent(new Event(t, { bubbles: true })));
        Object.entries(params).forEach(([k, v]) => {
            if (['quality', 'viewMode', 'brushLayers'].includes(k)) return;
            const i = doc.querySelector(`input[data-param="${k}"]`);
            if (i) { i.value = v; fire(i, ['input', 'change']); }
        });
        if (params.quality) {
            const q = doc.getElementById('quality-mode');
            if (q) { q.value = params.quality; fire(q, ['change']); }
        }
        if (params.viewMode) {
            const r = doc.querySelector(`input[name="layer-mode"][value="${params.viewMode}"]`);
            if (r && !r.checked) { r.checked = true; fire(r, ['change']); }
        }
        if (Array.isArray(params.brushLayers)) {
            doc.querySelectorAll('input[data-brush-layer]').forEach((c, idx) => {
                const want = params.brushLayers[idx];
                if (typeof want === 'boolean' && c.checked !== want) { c.checked = want; fire(c, ['change']); }
            });
        }
    },

    // Reliable capture. The donor renders ONLY while something is dirty or growth
    // is active (see its animate loop); once growth completes it stops drawing, so
    // an external read of an un-preserved buffer comes back black. So: force a
    // fresh growth cycle (its own Reproducir button) and capture on the donor's
    // OWN rAF DURING active growth — every such frame is freshly painted. We keep
    // the latest frame as growth approaches 1, which is the (near-)complete image.
    refreshResult(iframe, timeoutMs = 10000) {
        return new Promise((resolve) => {
            const win = iframe.contentWindow;
            const doc = iframe.contentDocument;
            const canvas = doc?.querySelector('#canvas-mount canvas');
            if (!win || !canvas) { resolve(null); return; }
            doc.getElementById('replay-growth-button')?.click();
            const startedAt = performance.now();
            let best = null;
            let sawGrowth = false;
            const step = () => {
                const gp = Number(doc.documentElement.dataset.growthProgress || 0);
                // While growth is running the back buffer holds a freshly drawn
                // frame — grab it. Registered after the donor's own rAF, so its
                // draw for this frame has already happened.
                if (gp > 0.05 && gp <= 1) {
                    sawGrowth = true;
                    try { best = canvas.toDataURL('image/png'); } catch { /* transient */ }
                }
                if ((gp >= 1 && best && sawGrowth) || performance.now() - startedAt > timeoutMs) {
                    resolve(best);
                    return;
                }
                win.requestAnimationFrame(step);
            };
            win.requestAnimationFrame(step);
        });
    },
};

// ── Museum-room helpers ────────────────────────────────────────────────────

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
    return new Promise((resolve) => {
        if (!plate?.material || !dataUrl) { resolve(false); return; }
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
            resolve(true);
        };
        image.onerror = () => resolve(false);
        image.src = dataUrl;
    });
}

// ── Museum chrome (edit overlay header, launch button, toast) ──────────────

const BTN = 'padding:9px 15px;border-radius:999px;cursor:pointer;border:1px solid rgba(226,219,205,.3);'
    + "background:transparent;color:#ece7dd;font:500 12px/1 'Helvetica Neue',Inter,system-ui,sans-serif;letter-spacing:.05em;";
const BTN_ACCENT = 'padding:9px 15px;border-radius:999px;cursor:pointer;border:1px solid #bfa06a;'
    + "background:rgba(191,160,106,.16);color:#ece7dd;font:600 12px/1 'Helvetica Neue',Inter,system-ui,sans-serif;letter-spacing:.05em;";

function toast(message, kind = 'ok') {
    let el = document.getElementById('wp-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'wp-toast';
        Object.assign(el.style, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: '80', padding: '11px 18px', borderRadius: '10px',
            background: '#1a1917', color: '#ece7dd', border: '1px solid rgba(226,219,205,.3)',
            font: "500 13px/1.2 'Helvetica Neue', Inter, system-ui, sans-serif",
            boxShadow: '0 8px 30px rgba(0,0,0,.5)', opacity: '0', transition: 'opacity .2s',
        });
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.borderColor = kind === 'ok' ? 'rgba(143,191,149,.55)' : 'rgba(224,138,128,.55)';
    el.style.opacity = '1';
    clearTimeout(el.__t);
    el.__t = setTimeout(() => { el.style.opacity = '0'; }, 2600);
}

const SCENE_BASE = './experiences/wet-paint-flow/scenes/full/';

let bridge = null;
let sceneKitRef = null;
let libraryHooked = false;

function paintaryPlate() { return findArtworkPlate(sceneKitRef, PAINTERLY_ENTITY_ID); }
function originalPlate() { return findArtworkPlate(sceneKitRef, ORIGINAL_ENTITY_ID); }

function setPlateFromUrl(plate, url) {
    return new Promise((resolve) => {
        if (!plate?.material || !url) { resolve(false); return; }
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
        image.src = url;
    });
}

// A Van Gogh work chosen from the collection: the donor loads it as its source;
// Museum mirrors the source onto 01 and the Wet Paint result onto 02, so the
// gallery reads 01 = obra elegida, 02 = Wet Paint(obra) — one truth.
async function syncFromLibrary(sceneId) {
    const iframe = bridge.element;
    const doc = iframe.contentDocument;
    toast('Cargando obra de la colección…', 'ok');
    const start = performance.now();
    while (performance.now() - start < 12000) {
        if (doc?.documentElement?.dataset?.activeSceneId === sceneId) break;
        await new Promise((r) => setTimeout(r, 150));
    }
    const dataUrl = await donorAdapter.refreshResult(iframe);
    await setPlateFromUrl(originalPlate(), `${SCENE_BASE}${sceneId}.webp`);
    if (dataUrl) await applyResultToPlate(paintaryPlate(), dataUrl);
    WetPaintStore.save(PAINTERLY_ENTITY_ID, {
        params: donorAdapter.getParams(iframe), resultDataUrl: dataUrl, sourceName: sceneId,
    });
    toast('Obra de la colección aplicada · 01 y 02 actualizados', 'ok');
    console.log(`[WetPaint] colección → ${sceneId} aplicada a 01 y 02`);
}

function hookLibrary(iframe) {
    if (libraryHooked) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    // Delegated: survives the donor re-rendering the collection grid.
    doc.addEventListener('click', (event) => {
        const card = event.target?.closest?.('.scene-card[data-scene-id]');
        if (!card) return;
        const sceneId = card.getAttribute('data-scene-id');
        if (sceneId) syncFromLibrary(sceneId);
    }, true);
    libraryHooked = true;
}

async function saveAndApply() {
    const iframe = bridge.element;
    toast('Aplicando personalización…', 'ok');
    const dataUrl = await donorAdapter.refreshResult(iframe);
    const applied = await applyResultToPlate(paintaryPlate(), dataUrl);
    if (!applied) { toast('No se pudo aplicar el resultado', 'bad'); return; }
    const params = donorAdapter.getParams(iframe);
    WetPaintStore.save(PAINTERLY_ENTITY_ID, { params, resultDataUrl: dataUrl });
    toast('Personalización aplicada a la obra 02', 'ok');
}

function buildEditChrome() {
    const container = bridge.container;
    // Re-purpose the bridge's default close button into our header; hide the raw one.
    const rawClose = container.querySelector('#experience-close');
    if (rawClose) rawClose.style.display = 'none';

    if (container.querySelector('#wp-edit-header')) return;
    const header = document.createElement('div');
    header.id = 'wp-edit-header';
    Object.assign(header.style, {
        position: 'absolute', top: '0', left: '0', right: '0', height: '56px', zIndex: '2',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: '#100f0e', borderBottom: '1px solid rgba(226,219,205,.14)',
        color: '#ece7dd', font: "600 14px/1 'Helvetica Neue', Inter, system-ui, sans-serif",
    });
    const title = document.createElement('div');
    title.innerHTML = '<span style="letter-spacing:.04em">Editar obra · 02 — Wet Paint</span>'
        + '<span style="display:block;font-weight:400;font-size:11px;color:#9a9389;margin-top:3px">Personaliza el efecto y aplícalo a la sala</span>';
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Guardar y aplicar';
    saveBtn.style.cssText = BTN_ACCENT;
    saveBtn.addEventListener('click', () => saveAndApply());
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = 'Volver a la sala';
    backBtn.style.cssText = BTN;
    backBtn.addEventListener('click', () => bridge.close());
    actions.append(saveBtn, backBtn);
    header.append(title, actions);
    container.appendChild(header);
    // Push the donor iframe below the header.
    bridge.element.style.marginTop = '56px';
    bridge.element.style.height = 'calc(100% - 56px)';
}

function addLaunchButton() {
    if (document.getElementById('wp-personalize')) return;
    const btn = document.createElement('button');
    btn.id = 'wp-personalize';
    btn.type = 'button';
    btn.textContent = 'Personalizar 02 · Wet Paint';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '16px', right: '16px', zIndex: '55',
    });
    btn.style.cssText += BTN_ACCENT + 'position:fixed;bottom:16px;right:16px;z-index:55;';
    btn.addEventListener('click', async () => {
        await bridge.waitReady();
        applyMuseumSkin(bridge.element);
        buildEditChrome();
        bridge.open();
    });
    document.body.appendChild(btn);
}

// ── Install ────────────────────────────────────────────────────────────────

export function installWetPaint(runtime) {
    const sceneKit = runtime?.sceneKit;
    if (!sceneKit) { console.error('[WetPaint] runtime.sceneKit not available'); return null; }
    sceneKitRef = sceneKit;

    bridge = createExperienceBridge({
        id: EXPERIENCE_ID,
        url: STANDALONE_URL,
        adapter: donorAdapter,
        onStatus: (status, extra) => console.log(`[WetPaint] ${status}${extra?.strokes ? ` · ${extra.strokes} trazos` : ''}`),
    });

    addLaunchButton();

    // Dress the donor document as soon as it loads (no chrome flash) and restore
    // any saved personalization onto 02 so authoring and visitor show one truth.
    bridge.waitReady().then(async () => {
        applyMuseumSkin(bridge.element);
        hookLibrary(bridge.element);
        const saved = WetPaintStore.get(PAINTERLY_ENTITY_ID);
        if (saved?.resultDataUrl) {
            await applyResultToPlate(paintaryPlate(), saved.resultDataUrl);
            // Restore 01 too when the saved source was a collection work (uploads
            // are restored by Museum's own media config).
            if (saved.sourceName) await setPlateFromUrl(originalPlate(), `${SCENE_BASE}${saved.sourceName}.webp`);
            console.log('[WetPaint] 02 restaurado desde personalización guardada');
        }
    });

    // 01 ORIGINAL upload → donor source → 02 result. 01's own raw plate is
    // handled by wet-paint-visible-media.js; here we only feed the donor and 02.
    const originalTakeFile = StudioShell.prototype._takeFile;
    StudioShell.prototype._takeFile = async function wetPaintTakeFile(slot, file) {
        await originalTakeFile.call(this, slot, file);
        if (!file || this.selectedId !== ORIGINAL_ENTITY_ID) return;
        const entity = (this.world.entities || []).find((item) => item.id === this.selectedId);
        if (entity?.kind !== 'ARTWORK' || !String(file.type || '').startsWith('image/')) return;

        try {
            toast('Wet Paint está procesando la imagen…', 'ok');
            const saved = WetPaintStore.get(PAINTERLY_ENTITY_ID);
            const result = await bridge.process(file);
            if (result.status === STATUS.RESULT_READY && result.resultDataUrl) {
                // Re-apply saved params (if any) on top of the fresh source, then recapture.
                let dataUrl = result.resultDataUrl;
                if (saved?.params) {
                    donorAdapter.applyParams(bridge.element, saved.params);
                    dataUrl = (await donorAdapter.refreshResult(bridge.element)) || dataUrl;
                }
                await applyResultToPlate(paintaryPlate(), dataUrl);
                WetPaintStore.save(PAINTERLY_ENTITY_ID, { params: donorAdapter.getParams(bridge.element), resultDataUrl: dataUrl });
                toast('02 Wet Paint actualizado', 'ok');
                console.log('[WetPaint] 02 actualizado desde el donor real');
            } else {
                toast('El donor no produjo resultado', 'bad');
            }
        } catch (error) {
            console.error('[WetPaint] processing failed:', error);
            toast('Error al procesar', 'bad');
        }
    };

    window.__WET_PAINT_BRIDGE = {
        bridge,
        process: (file) => bridge.process(file),
        saveAndApply,
        syncFromLibrary,
        open: async () => { await bridge.waitReady(); applyMuseumSkin(bridge.element); hookLibrary(bridge.element); buildEditChrome(); bridge.open(); },
        close: () => bridge.close(),
        getParams: () => donorAdapter.getParams(bridge.element),
        applyParams: (p) => donorAdapter.applyParams(bridge.element, p),
    };

    return { bridge };
}
