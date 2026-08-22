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
import { PainterlyEngine } from './painterly-engine.js';

const PAINTERLY_ENTITY_ID = 'entity.itinerant.painterly';
const ORIGINAL_ENTITY_ID = 'entity.itinerant.original';
const RENDER_WIDTH = 1024;
const RENDER_HEIGHT = 720;

let engine = null;
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

function readPlatePixels(plate, width, height) {
    const texture = plate.material?.map;
    if (!texture) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (texture.image instanceof HTMLImageElement || texture.image instanceof HTMLCanvasElement) {
        ctx.drawImage(texture.image, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height);
    }

    if (texture.image instanceof ImageBitmap) {
        ctx.drawImage(texture.image, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height);
    }

    return null;
}

function readOriginalSource(sceneKit) {
    const originalPlate = findArtworkPlate(sceneKit, ORIGINAL_ENTITY_ID);
    if (originalPlate) {
        const imageData = readPlatePixels(originalPlate, RENDER_WIDTH, RENDER_HEIGHT);
        if (imageData) return imageData;
    }
    return null;
}

function processAndApply(imageData) {
    if (!engine || !plateRef) return 0;

    const strokeCount = engine.processImage(imageData);
    console.log(`[PainterlyAdapter] processed ${strokeCount} strokes`);

    plateRef.material.map = engine.outputTexture;
    plateRef.material.needsUpdate = true;
    animationActive = true;
    sourceReady = true;

    return strokeCount;
}

function doReprocess() {
    reprocessScheduled = false;
    const sceneKit = window.__IW?.runtime?.sceneKit;
    if (!sceneKit || !engine) return;

    const imageData = readOriginalSource(sceneKit);
    if (!imageData) {
        console.warn('[PainterlyAdapter] reprocess: source not readable yet — will retry on next change');
        return;
    }

    const strokeCount = processAndApply(imageData);
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

    if (engine) engine.dispose();
    engine = new PainterlyEngine(renderer, RENDER_WIDTH, RENDER_HEIGHT);

    const imageData = readOriginalSource(sceneKit);
    if (!imageData) {
        console.warn('[PainterlyAdapter] waiting for ORIGINAL source — will process when available');
        sourceReady = false;
        return { engine, strokeCount: 0, waiting: true };
    }

    const strokeCount = processAndApply(imageData);
    return { engine, strokeCount };
}

export function updatePainterly() {
    if (!engine) return;

    if (plateRef?.material && plateRef.material.map !== engine.outputTexture) {
        plateRef.material.map = engine.outputTexture;
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

    const now = performance.now() / 1000;
    const stillGrowing = engine.update(now);

    if (plateRef?.material) {
        plateRef.material.needsUpdate = true;
    }

    if (!stillGrowing && animationActive) {
        engine.update(now);
        animationActive = false;
    }
}

export function reprocessSource(runtime) {
    const sceneKit = runtime?.sceneKit;
    if (!sceneKit || !engine) return false;

    const imageData = readOriginalSource(sceneKit);
    if (!imageData) {
        console.warn('[PainterlyAdapter] reprocessSource: no readable source');
        return false;
    }

    processAndApply(imageData);
    return true;
}

export function replayGrowth() {
    if (!engine) return;
    engine.replay();
    animationActive = true;
}

export function disposePainterly() {
    if (engine) {
        engine.dispose();
        engine = null;
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
    get engine() { return engine; }
};
