/**
 * PainterlyAdapter — connects PainterlyEngine to the itinerant wet-paint lab.
 *
 * Architecture seam:
 *   MUSEUM AUTHORED MEDIA → source texture on ORIGINAL entity plate
 *   → readPixels into ImageData
 *   → PainterlyEngine.processImage()
 *   → engine.outputTexture replaces the PAINTERLY entity's plate map
 *   → engine.update() called each frame during growth
 *
 * Source-change seam:
 *   When the user uploads a new image to ORIGINAL (via Studio _takeFile),
 *   wet-paint-visible-media.js updates the 3D plate texture. This adapter
 *   detects the texture reference change each frame and re-processes.
 *
 * The adapter is installed once the Museum runtime and sceneKit are ready.
 * It does NOT modify Museum's renderer, scene kit, or camera authority.
 */

import * as THREE from '../vendor/three/three.module.min.js';
import { createWetPaintPipeline } from './wet-paint-pipeline.js';

const PAINTERLY_ENTITY_ID = 'entity.itinerant.painterly';
const ORIGINAL_ENTITY_ID = 'entity.itinerant.original';
const RENDER_WIDTH = 1024;
const RENDER_HEIGHT = 720;

let pipeline = null;
let animationActive = false;
let plateRef = null;
let originalPlateRef = null;
let lastOriginalMap = null;
let reprocessScheduled = false;
let sourceReady = false;

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
        if (area > bestArea) {
            best = node;
            bestArea = area;
        }
    });
    return best;
}

function readPlateImage(plate) {
    const texture = plate.material?.map;
    if (!texture || !texture.image) return null;
    const img = texture.image;
    if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement || img instanceof ImageBitmap) {
        return img;
    }
    return null;
}

function readOriginalSource(sceneKit) {
    const originalPlate = findArtworkPlate(sceneKit, ORIGINAL_ENTITY_ID);
    if (originalPlate) {
        return readPlateImage(originalPlate);
    }
    return null;
}

function saveRendererState(renderer) {
    const currentTarget = renderer.getRenderTarget();
    const vp = new THREE.Vector4();
    renderer.getViewport(vp);
    const sc = new THREE.Vector4();
    renderer.getScissor(sc);
    const scissorTest = renderer.getScissorTest();
    const clearColor = new THREE.Color();
    renderer.getClearColor(clearColor);
    const clearAlpha = renderer.getClearAlpha();
    return { currentTarget, vp, sc, scissorTest, clearColor, clearAlpha };
}

function restoreRendererState(renderer, state) {
    renderer.setRenderTarget(state.currentTarget);
    renderer.setViewport(state.vp);
    renderer.setScissor(state.sc);
    renderer.setScissorTest(state.scissorTest);
    renderer.setClearColor(state.clearColor, state.clearAlpha);
}

function processAndApply(image) {
    if (!pipeline || !plateRef) return 0;
    const renderer = window.__IW?.renderHost?.renderer;
    if (!renderer) return 0;

    const saved = saveRendererState(renderer);
    try {
        const strokeCount = pipeline.processImage(image);
        console.log(`[PainterlyAdapter] processed ${strokeCount} strokes`);

        plateRef.material.map = pipeline.getOutputTexture();
        plateRef.material.needsUpdate = true;
        animationActive = true;
        sourceReady = true;

        return strokeCount;
    } finally {
        restoreRendererState(renderer, saved);
    }
}

function doReprocess() {
    reprocessScheduled = false;
    const sceneKit = window.__IW?.runtime?.sceneKit;
    if (!sceneKit || !pipeline) return;

    const image = readOriginalSource(sceneKit);
    if (!image) {
        console.warn('[PainterlyAdapter] reprocess: source not readable yet — will retry on next change');
        return;
    }

    const strokeCount = processAndApply(image);
    console.log(`[PainterlyAdapter] reprocessed from new ORIGINAL source — ${strokeCount} strokes`);
}

export function installPainterly(runtime) {
    const sceneKit = runtime?.sceneKit;
    const renderer = window.__IW?.renderHost?.renderer;
    if (!sceneKit || !renderer) {
        console.error('[PainterlyAdapter] runtime.sceneKit or renderer not available');
        return null;
    }

    const painterlyPlate = findArtworkPlate(sceneKit, PAINTERLY_ENTITY_ID);
    if (!painterlyPlate) {
        console.warn('[PainterlyAdapter] painterly entity plate not found — deferring');
        return null;
    }

    plateRef = painterlyPlate;
    originalPlateRef = findArtworkPlate(sceneKit, ORIGINAL_ENTITY_ID);
    lastOriginalMap = originalPlateRef?.material?.map || null;

    if (pipeline) pipeline.dispose();
    pipeline = createWetPaintPipeline(renderer);

    const image = readOriginalSource(sceneKit);
    if (!image) {
        console.warn('[PainterlyAdapter] waiting for ORIGINAL source — will process when available');
        sourceReady = false;
        return { pipeline, strokeCount: 0, waiting: true };
    }

    const strokeCount = processAndApply(image);
    return { pipeline, strokeCount };
}

export function updatePainterly() {
    if (!pipeline) return;

    const outTex = pipeline.getOutputTexture();
    if (plateRef?.material && outTex && plateRef.material.map !== outTex) {
        plateRef.material.map = outTex;
        plateRef.material.needsUpdate = true;
    }

    if (originalPlateRef?.material?.map) {
        const currentMap = originalPlateRef.material.map;
        if (currentMap !== lastOriginalMap) {
            lastOriginalMap = currentMap;
            if (!reprocessScheduled) {
                reprocessScheduled = true;
                console.log('[PainterlyAdapter] ORIGINAL source changed — scheduling reprocess');
                setTimeout(doReprocess, 200);
            }
        }
    }

    if (!animationActive) return;

    const renderer = window.__IW?.renderHost?.renderer;
    if (!renderer) return;

    const saved = saveRendererState(renderer);
    try {
        // Feed the pipeline the shared monotonic clock (performance.now(), ms).
        // processImage anchored growthStartTimeline to this same clock, so the
        // pipeline computes growth elapsed itself — no second origin here.
        const stillGrowing = pipeline.update(performance.now());

        if (plateRef?.material) {
            plateRef.material.map = pipeline.getOutputTexture();
            plateRef.material.needsUpdate = true;
        }

        if (!stillGrowing && animationActive) {
            animationActive = false;
        }
    } finally {
        restoreRendererState(renderer, saved);
    }
}

export function reprocessSource(runtime) {
    const sceneKit = runtime?.sceneKit;
    if (!sceneKit || !pipeline) return false;

    const image = readOriginalSource(sceneKit);
    if (!image) {
        console.warn('[PainterlyAdapter] reprocessSource: no readable source');
        return false;
    }

    processAndApply(image);
    return true;
}

export function replayGrowth() {
    if (!pipeline) return;
    pipeline.replay();
    animationActive = true;
}

export function disposePainterly() {
    if (pipeline) {
        pipeline.dispose();
        pipeline = null;
    }
    animationActive = false;
    plateRef = null;
    originalPlateRef = null;
    lastOriginalMap = null;
    sourceReady = false;
}

window.__PAINTERLY_ADAPTER = {
    install: installPainterly,
    update: updatePainterly,
    replay: replayGrowth,
    dispose: disposePainterly,
    reprocess: reprocessSource,
    get sourceReady() { return sourceReady; },
    get pipeline() { return pipeline; }
};
