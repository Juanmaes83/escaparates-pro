/**
 * PainterlyAdapter — connects PainterlyEngine to the itinerant wet-paint lab.
 *
 * Architecture seam:
 *   MUSEUM AUTHORED MEDIA → source texture on entity plate
 *   → readPixels into ImageData
 *   → PainterlyEngine.processImage()
 *   → engine.outputTexture replaces the PAINTERLY entity's plate map
 *   → engine.update() called each frame during growth
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

function readPlatePixels(renderer, plate, width, height) {
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

function readOriginalSource(sceneKit, renderer) {
    const originalPlate = findArtworkPlate(sceneKit, ORIGINAL_ENTITY_ID);
    if (originalPlate) {
        const imageData = readPlatePixels(renderer, originalPlate, RENDER_WIDTH, RENDER_HEIGHT);
        if (imageData) return imageData;
    }

    const painterlyPlate = findArtworkPlate(sceneKit, PAINTERLY_ENTITY_ID);
    if (painterlyPlate) {
        return readPlatePixels(renderer, painterlyPlate, RENDER_WIDTH, RENDER_HEIGHT);
    }

    return null;
}

function generateFallbackImageData() {
    const canvas = document.createElement('canvas');
    canvas.width = RENDER_WIDTH;
    canvas.height = RENDER_HEIGHT;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
    grad.addColorStop(0, '#1a237e');
    grad.addColorStop(0.3, '#4a148c');
    grad.addColorStop(0.5, '#b71c1c');
    grad.addColorStop(0.7, '#e65100');
    grad.addColorStop(1, '#f9a825');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    for (let i = 0; i < 6; i++) {
        const cx = Math.random() * RENDER_WIDTH;
        const cy = Math.random() * RENDER_HEIGHT;
        const r = 40 + Math.random() * 100;
        const rGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const hue = Math.random() * 360;
        rGrad.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.6)`);
        rGrad.addColorStop(1, `hsla(${hue}, 60%, 30%, 0)`);
        ctx.fillStyle = rGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    return ctx.getImageData(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
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

    if (engine) engine.dispose();
    engine = new PainterlyEngine(renderer, RENDER_WIDTH, RENDER_HEIGHT);

    let imageData = readOriginalSource(sceneKit, renderer);
    if (!imageData) {
        console.warn('[PainterlyAdapter] no source image readable — using fallback gradient');
        imageData = generateFallbackImageData();
    }

    const strokeCount = engine.processImage(imageData);
    console.log(`[PainterlyAdapter] processed ${strokeCount} strokes`);

    painterlyPlate.material.map = engine.outputTexture;
    painterlyPlate.material.needsUpdate = true;

    animationActive = true;

    return { engine, strokeCount };
}

export function updatePainterly() {
    if (!engine) return;

    if (plateRef?.material && plateRef.material.map !== engine.outputTexture) {
        plateRef.material.map = engine.outputTexture;
        plateRef.material.needsUpdate = true;
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
}

window.__PAINTERLY_ADAPTER = {
    install: installPainterly,
    update: updatePainterly,
    replay: replayGrowth,
    dispose: disposePainterly
};
