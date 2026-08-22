/**
 * PainterlyEngine — Wet Paint Flow capability graft for Museum.
 *
 * Transforms a source image (from an ARTWORK entity's texture) into a painterly
 * reconstruction using:
 *   - Structure tensor direction field (eigenvalue decomposition)
 *   - 3-layer Poisson disk seeding (coarse / medium / fine)
 *   - RK2 streamline integration along the direction field
 *   - Bézier ribbon strokes via InstancedBufferGeometry
 *   - Oil paint bristle fragment shader
 *   - PBR impasto composite (GGX / Smith / Fresnel + clearcoat + canvas weave)
 *   - 5-second growth animation (progressive reveal)
 *
 * Donor: wet-paint-flow/main.js (0b9ba9a)
 * Capability extracted, not identity copied.
 *
 * Contract:
 *   - Museum owns the renderer. The engine borrows it for off-screen passes.
 *   - Museum owns the camera. The engine never touches it.
 *   - The engine writes to a RenderTarget whose .texture replaces the artwork plate's map.
 *   - The engine is a guest. It does not create scenes, cameras, or renderers.
 */

import * as THREE from '../vendor/three/three.module.min.js';

const PI = Math.PI;
const GROWTH_DURATION = 5.0;
const SEGMENTS = 12;

// ═══════════════════════════════════════════════════════════════════
//  SHADERS
// ═══════════════════════════════════════════════════════════════════

const strokeVertexShader = /* glsl */`
precision highp float;

attribute vec3 position;
attribute vec2 aP0;
attribute vec2 aP1;
attribute vec2 aP2;
attribute vec2 aP3;
attribute vec3 aColor;
attribute float aWidth;
attribute float aSeed;
attribute float aBirth;
attribute float aDuration;
attribute float aBrushLayer;

uniform float uGrowth;
uniform vec2 uResolution;

varying vec3 vColor;
varying float vT;
varying float vFreshness;
varying float vSeed;
varying float vBrushLayer;
varying float vWidthPx;

vec2 bezier(float t) {
    float s = 1.0 - t;
    return s*s*s*aP0 + 3.0*s*s*t*aP1 + 3.0*s*t*t*aP2 + t*t*t*aP3;
}

vec2 bezierTangent(float t) {
    float s = 1.0 - t;
    return 3.0*(s*s*(aP1-aP0) + 2.0*s*t*(aP2-aP1) + t*t*(aP3-aP2));
}

void main() {
    float t = position.x;
    float side = position.y;

    float elapsed = uGrowth - aBirth;
    float progress = clamp(elapsed / max(aDuration, 0.01), 0.0, 1.0);
    float alive = step(0.001, progress);
    float mask = step(t, progress);
    float tipFade = 1.0 - smoothstep(progress - 0.15, progress, t);

    float pressure = 0.44 + 0.56 * pow(sin(t * 3.14159), 0.42);
    float wobble = 1.0 + 0.08 * sin(aSeed * 17.3 + t * 12.0);
    float w = aWidth * pressure * wobble * tipFade * alive;

    vec2 pos = bezier(t);
    vec2 tang = bezierTangent(t);
    float tangLen = length(tang);
    vec2 norm = tangLen > 0.001 ? normalize(vec2(-tang.y, tang.x)) : vec2(0.0, 1.0);
    vec2 offset = norm * side * w * 0.5;
    vec2 screenPos = (pos + offset) / uResolution * 2.0 - 1.0;

    vColor = aColor;
    vT = t;
    vFreshness = 1.0 - smoothstep(0.0, 2.5, elapsed);
    vSeed = aSeed;
    vBrushLayer = aBrushLayer;
    vWidthPx = w;

    gl_Position = vec4(screenPos * mask, 0.0, 1.0);
}
`;

const strokeFragmentShader = /* glsl */`
precision highp float;

varying vec3 vColor;
varying float vT;
varying float vFreshness;
varying float vSeed;
varying float vBrushLayer;
varying float vWidthPx;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
    float fiberPhase = vT * 40.0 + vSeed * 100.0;
    float splitFibers = 0.5 + 0.5 * sin(fiberPhase);
    float microFibers = 0.5 + 0.5 * sin(fiberPhase * 3.7 + 1.3);
    float bristle = mix(splitFibers, microFibers, 0.35);

    float pigmentBreak = hash(floor(vT * 60.0) + vSeed * 7.0);
    float edgePool = smoothstep(0.3, 0.0, abs(vT - 0.5) - 0.3);
    float cohesion = 0.7 + 0.3 * bristle;

    float alpha = cohesion * (0.92 + 0.08 * pigmentBreak) * (0.95 + 0.05 * edgePool);
    alpha *= smoothstep(0.0, 1.0, vWidthPx);

    float wetGleam = vFreshness * 0.18 * (0.5 + 0.5 * bristle);
    float satBoost = 1.0 + 0.12 * bristle;
    vec3 boosted = mix(vColor, vColor * satBoost, 0.5);
    vec3 color = boosted * (1.0 + wetGleam);

    gl_FragColor = vec4(color, alpha);
}
`;

const heightFragmentShader = /* glsl */`
precision highp float;

varying float vT;
varying float vFreshness;
varying float vSeed;
varying float vBrushLayer;
varying float vWidthPx;

void main() {
    float ridgePhase = vT * 35.0 + vSeed * 80.0;
    float ridgeWave = 0.5 + 0.5 * sin(ridgePhase);
    float microRidges = 0.5 + 0.5 * sin(ridgePhase * 4.1 + 2.7);
    float ridges = mix(ridgeWave, microRidges, 0.3);
    float centralLoad = 1.0 - 0.3 * abs(vT - 0.5) * 2.0;
    float wet = vFreshness * 0.15;
    float h = ridges * centralLoad * (0.6 + wet) * smoothstep(0.0, 2.0, vWidthPx);
    float layerScale = 1.0 - vBrushLayer * 0.2;
    gl_FragColor = vec4(h * layerScale, 0.0, 0.0, 1.0);
}
`;

const compositeVertexShader = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const compositeFragmentShader = /* glsl */`
precision highp float;

uniform sampler2D tBrush;
uniform sampler2D tHeight;
uniform float uImpastoStrength;
uniform float uWetness;
uniform vec2 uResolution;
uniform vec3 uLightDir;

varying vec2 vUv;

float sampleHeight(vec2 uv) {
    return texture2D(tHeight, uv).r;
}

vec3 heightNormal(vec2 uv) {
    vec2 texel = 1.0 / uResolution;
    float hL = sampleHeight(uv - vec2(texel.x, 0.0));
    float hR = sampleHeight(uv + vec2(texel.x, 0.0));
    float hD = sampleHeight(uv - vec2(0.0, texel.y));
    float hU = sampleHeight(uv + vec2(0.0, texel.y));
    return normalize(vec3(hL - hR, hD - hU, 2.0 / max(uImpastoStrength, 0.01)));
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (3.14159 * denom * denom);
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    float ggx1 = NdotV / (NdotV * (1.0 - k) + k);
    float ggx2 = NdotL / (NdotL * (1.0 - k) + k);
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    vec4 brushColor = texture2D(tBrush, vUv);
    float h = sampleHeight(vUv);

    vec3 N = heightNormal(vUv);
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L = normalize(uLightDir);
    vec3 H = normalize(V + L);

    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);

    float roughness = mix(0.44, 0.11, uWetness);
    vec3 F0 = vec3(0.04);

    float D = distributionGGX(N, H, roughness);
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);

    vec3 spec = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);
    vec3 diffuse = brushColor.rgb * (NdotL * 0.6 + 0.4);
    float clearcoat = pow(NdotH, 32.0) * 0.15 * (1.0 + uWetness);
    float grazeSheen = pow(1.0 - NdotV, 4.0) * 0.06;
    float ridgeCatch = pow(max(dot(N, H), 0.0), 8.0) * h * 0.3;

    float warpX = sin(vUv.x * uResolution.x * 0.5) * 0.5 + 0.5;
    float weftY = sin(vUv.y * uResolution.y * 0.5) * 0.5 + 0.5;
    float weave = mix(1.0, 0.97 + 0.03 * warpX * weftY, 1.0 - brushColor.a);
    float grain = 1.0 - 0.02 * (warpX + weftY) * (1.0 - min(h * 2.0, 1.0));

    vec3 lit = (diffuse + spec * uImpastoStrength + clearcoat + grazeSheen + ridgeCatch) * weave * grain;
    gl_FragColor = vec4(lit, max(brushColor.a, 0.05));
}
`;

const underpaintingVertexShader = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const underpaintingFragmentShader = /* glsl */`
precision highp float;
uniform sampler2D tSource;
uniform vec2 uTexel;
varying vec2 vUv;

void main() {
    vec3 col = texture2D(tSource, vUv).rgb * 0.36
             + texture2D(tSource, vUv + vec2(uTexel.x, 0.0)).rgb * 0.16
             + texture2D(tSource, vUv - vec2(uTexel.x, 0.0)).rgb * 0.16
             + texture2D(tSource, vUv + vec2(0.0, uTexel.y)).rgb * 0.16
             + texture2D(tSource, vUv - vec2(0.0, uTexel.y)).rgb * 0.16;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 muted = mix(col, vec3(lum), 0.30) * 0.58;
    gl_FragColor = vec4(muted, 1.0);
}
`;

// ═══════════════════════════════════════════════════════════════════
//  DIRECTION FIELD
// ═══════════════════════════════════════════════════════════════════

function buildDirectionField(imageData, w, h) {
    const gray = new Float32Array(w * h);
    const d = imageData.data;
    for (let i = 0; i < w * h; i++) {
        gray[i] = (d[i*4] * 0.299 + d[i*4+1] * 0.587 + d[i*4+2] * 0.114) / 255;
    }

    const gx = new Float32Array(w * h);
    const gy = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            gx[idx] = (gray[idx+1] - gray[idx-1]) * 0.5;
            gy[idx] = (gray[idx+w] - gray[idx-w]) * 0.5;
        }
    }

    const Jxx = new Float32Array(w * h);
    const Jxy = new Float32Array(w * h);
    const Jyy = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        Jxx[i] = gx[i] * gx[i];
        Jxy[i] = gx[i] * gy[i];
        Jyy[i] = gy[i] * gy[i];
    }

    const radius = 9;
    const boxBlur = (src, w, h, r) => {
        const dst = new Float32Array(w * h);
        const tmp = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
            let sum = 0, count = 0;
            for (let x = 0; x < Math.min(r + 1, w); x++) { sum += src[y*w+x]; count++; }
            for (let x = 0; x < w; x++) {
                tmp[y*w+x] = sum / count;
                const addX = x + r + 1;
                const remX = x - r;
                if (addX < w) { sum += src[y*w+addX]; count++; }
                if (remX >= 0) { sum -= src[y*w+remX]; count--; }
            }
        }
        for (let x = 0; x < w; x++) {
            let sum = 0, count = 0;
            for (let y = 0; y < Math.min(r + 1, h); y++) { sum += tmp[y*w+x]; count++; }
            for (let y = 0; y < h; y++) {
                dst[y*w+x] = sum / count;
                const addY = y + r + 1;
                const remY = y - r;
                if (addY < h) { sum += tmp[addY*w+x]; count++; }
                if (remY >= 0) { sum -= tmp[remY*w+x]; count--; }
            }
        }
        return dst;
    };

    const sJxx = boxBlur(Jxx, w, h, radius);
    const sJxy = boxBlur(Jxy, w, h, radius);
    const sJyy = boxBlur(Jyy, w, h, radius);

    const angles = new Float32Array(w * h);
    const aniso = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const a = sJxx[i], b = sJxy[i], c = sJyy[i];
        const trace = a + c;
        const det = a * c - b * b;
        const disc = Math.sqrt(Math.max(trace * trace * 0.25 - det, 0));
        const l1 = trace * 0.5 + disc;
        const l2 = trace * 0.5 - disc;
        aniso[i] = trace > 1e-8 ? (l1 - l2) / (l1 + l2) : 0;
        if (Math.abs(b) > 1e-8) {
            angles[i] = Math.atan2(l1 - a, b);
        } else {
            angles[i] = a >= c ? 0 : PI * 0.5;
        }
    }

    let sumSin = 0, sumCos = 0;
    for (let i = 0; i < w * h; i++) {
        if (aniso[i] > 0.3) {
            sumSin += Math.sin(2 * angles[i]) * aniso[i];
            sumCos += Math.cos(2 * angles[i]) * aniso[i];
        }
    }
    const dominantAngle = Math.atan2(sumSin, sumCos) * 0.5;

    return { angles, aniso, dominantAngle, w, h };
}

// ═══════════════════════════════════════════════════════════════════
//  POISSON DISK SEEDING
// ═══════════════════════════════════════════════════════════════════

function poissonLayer(w, h, minDist, maxSeeds) {
    const cellSize = minDist / Math.SQRT2;
    const gridW = Math.ceil(w / cellSize);
    const gridH = Math.ceil(h / cellSize);
    const grid = new Int32Array(gridW * gridH).fill(-1);
    const points = [];
    const active = [];

    const gridIdx = (x, y) => Math.floor(y / cellSize) * gridW + Math.floor(x / cellSize);

    const canPlace = (x, y) => {
        const gx = Math.floor(x / cellSize);
        const gy = Math.floor(y / cellSize);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = gx + dx, ny = gy + dy;
                if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
                const idx = grid[ny * gridW + nx];
                if (idx < 0) continue;
                const ddx = points[idx].x - x, ddy = points[idx].y - y;
                if (ddx * ddx + ddy * ddy < minDist * minDist) return false;
            }
        }
        return true;
    };

    const sx = Math.random() * w, sy = Math.random() * h;
    points.push({ x: sx, y: sy });
    grid[gridIdx(sx, sy)] = 0;
    active.push(0);

    while (active.length > 0 && points.length < maxSeeds) {
        const aidx = Math.floor(Math.random() * active.length);
        const pt = points[active[aidx]];
        let found = false;
        for (let attempt = 0; attempt < 30; attempt++) {
            const angle = Math.random() * 2 * PI;
            const dist = minDist + Math.random() * minDist;
            const nx = pt.x + Math.cos(angle) * dist;
            const ny = pt.y + Math.sin(angle) * dist;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (!canPlace(nx, ny)) continue;
            points.push({ x: nx, y: ny });
            grid[gridIdx(nx, ny)] = points.length - 1;
            active.push(points.length - 1);
            found = true;
            break;
        }
        if (!found) active.splice(aidx, 1);
    }

    return points;
}

function generateSeeds(w, h) {
    const area = w * h;
    const baseCount = Math.round(area / 150);
    return {
        coarse: poissonLayer(w, h, Math.max(w, h) * 0.032, Math.round(baseCount * 0.06)),
        medium: poissonLayer(w, h, Math.max(w, h) * 0.013, Math.round(baseCount * 0.24)),
        fine: poissonLayer(w, h, Math.max(w, h) * 0.005, Math.round(baseCount * 0.70))
    };
}

// ═══════════════════════════════════════════════════════════════════
//  STREAMLINE INTEGRATION
// ═══════════════════════════════════════════════════════════════════

function traceStreamline(seed, field, pixels, length, step) {
    const { angles, aniso, dominantAngle, w, h } = field;
    const points = [];
    const margin = 30;
    const anisoThreshold = 0.18;
    const seedNoise = (Math.sin(seed.x * 12.9898 + seed.y * 78.233) * 43758.5453) % 1;
    const fallbackAngle = dominantAngle + seedNoise * 0.3 - 0.15;

    const getDirection = (px, py) => {
        const ix = Math.max(0, Math.min(w - 1, Math.floor(px)));
        const iy = Math.max(0, Math.min(h - 1, Math.floor(py)));
        const idx = iy * w + ix;
        const a = angles[idx] + PI * 0.5;
        const c = aniso[idx];
        if (c >= anisoThreshold) return a;
        const fa = fallbackAngle + PI * 0.5;
        const t = c / anisoThreshold;
        const dx = Math.cos(a) * t + Math.cos(fa) * (1 - t);
        const dy = Math.sin(a) * t + Math.sin(fa) * (1 - t);
        return Math.atan2(dy, dx);
    };

    const sampleColor = (px, py) => {
        const ix = Math.max(0, Math.min(w - 1, Math.floor(px)));
        const iy = Math.max(0, Math.min(h - 1, Math.floor(py)));
        const idx = (iy * w + ix) * 4;
        return [pixels[idx] / 255, pixels[idx+1] / 255, pixels[idx+2] / 255];
    };

    for (let dir = -1; dir <= 1; dir += 2) {
        let cx = seed.x, cy = seed.y;
        const half = Math.floor(length / 2);
        for (let i = 0; i < half; i++) {
            const a1 = getDirection(cx, cy);
            const mx = cx + Math.cos(a1) * step * 0.5 * dir;
            const my = cy + Math.sin(a1) * step * 0.5 * dir;
            const a2 = getDirection(mx, my);
            cx += Math.cos(a2) * step * dir;
            cy += Math.sin(a2) * step * dir;
            if (cx < -margin || cx >= w + margin || cy < -margin || cy >= h + margin) break;
            if (dir === -1) points.unshift({ x: cx, y: cy });
            else points.push({ x: cx, y: cy });
        }
    }
    points.splice(Math.floor(points.length / 2), 0, { x: seed.x, y: seed.y });

    const colorSamples = [sampleColor(seed.x, seed.y)];
    const sampleInterval = Math.max(1, Math.floor(points.length / 5));
    for (let i = 0; i < points.length; i += sampleInterval) {
        colorSamples.push(sampleColor(points[i].x, points[i].y));
    }
    const avgColor = [0, 0, 0];
    for (const c of colorSamples) {
        avgColor[0] += c[0]; avgColor[1] += c[1]; avgColor[2] += c[2];
    }
    avgColor[0] /= colorSamples.length;
    avgColor[1] /= colorSamples.length;
    avgColor[2] /= colorSamples.length;

    return { points, color: avgColor };
}

function fitBezier(pts) {
    if (pts.length < 2) return null;
    const n = pts.length - 1;
    const p0 = pts[0];
    const p3 = pts[n];

    const dx = p3.x - p0.x;
    const dy = p3.y - p0.y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    if (chord < 5) return null;

    const t0i = Math.min(Math.max(1, Math.round(n * 0.15)), n);
    const t3i = Math.max(0, Math.min(n - 1, Math.round(n * 0.85)));

    const t0x = pts[t0i].x - p0.x, t0y = pts[t0i].y - p0.y;
    const t0l = Math.sqrt(t0x * t0x + t0y * t0y) || 1;
    const t3x = p3.x - pts[t3i].x, t3y = p3.y - pts[t3i].y;
    const t3l = Math.sqrt(t3x * t3x + t3y * t3y) || 1;

    const armLen = chord * 0.35;

    return {
        p0,
        p1: { x: p0.x + t0x / t0l * armLen, y: p0.y + t0y / t0l * armLen },
        p2: { x: p3.x - t3x / t3l * armLen, y: p3.y - t3y / t3l * armLen },
        p3
    };
}

// ═══════════════════════════════════════════════════════════════════
//  STROKE GEOMETRY
// ═══════════════════════════════════════════════════════════════════

function createStrokeGeometry(allStrokes) {
    const positions = [];
    for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        positions.push(t, -1, 0, t, 1, 0);
    }
    const indices = [];
    for (let i = 0; i < SEGMENTS; i++) {
        const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        indices.push(a, b, c, b, d, c);
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);

    const count = allStrokes.length;
    const aP0 = new Float32Array(count * 2);
    const aP1 = new Float32Array(count * 2);
    const aP2 = new Float32Array(count * 2);
    const aP3 = new Float32Array(count * 2);
    const aColor = new Float32Array(count * 3);
    const aWidth = new Float32Array(count);
    const aSeed = new Float32Array(count);
    const aBirth = new Float32Array(count);
    const aDuration = new Float32Array(count);
    const aBrushLayer = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const s = allStrokes[i];
        aP0[i*2] = s.p0.x; aP0[i*2+1] = s.p0.y;
        aP1[i*2] = s.p1.x; aP1[i*2+1] = s.p1.y;
        aP2[i*2] = s.p2.x; aP2[i*2+1] = s.p2.y;
        aP3[i*2] = s.p3.x; aP3[i*2+1] = s.p3.y;
        aColor[i*3] = s.color[0]; aColor[i*3+1] = s.color[1]; aColor[i*3+2] = s.color[2];
        aWidth[i] = s.width;
        aSeed[i] = s.seed;
        aBirth[i] = s.birth;
        aDuration[i] = s.duration;
        aBrushLayer[i] = s.layer;
    }

    geo.setAttribute('aP0', new THREE.InstancedBufferAttribute(aP0, 2));
    geo.setAttribute('aP1', new THREE.InstancedBufferAttribute(aP1, 2));
    geo.setAttribute('aP2', new THREE.InstancedBufferAttribute(aP2, 2));
    geo.setAttribute('aP3', new THREE.InstancedBufferAttribute(aP3, 2));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
    geo.setAttribute('aWidth', new THREE.InstancedBufferAttribute(aWidth, 1));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.setAttribute('aBirth', new THREE.InstancedBufferAttribute(aBirth, 1));
    geo.setAttribute('aDuration', new THREE.InstancedBufferAttribute(aDuration, 1));
    geo.setAttribute('aBrushLayer', new THREE.InstancedBufferAttribute(aBrushLayer, 1));

    return geo;
}

// ═══════════════════════════════════════════════════════════════════
//  ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class PainterlyEngine {
    constructor(renderer, width, height) {
        this._renderer = renderer;
        this._w = width;
        this._h = height;
        this._growthStart = -1;
        this._strokes = [];
        this._disposed = false;

        this._orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this._orthoCamera.position.z = 1;
        this._strokeScene = new THREE.Scene();
        this._compositeScene = new THREE.Scene();

        this._brushTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType
        });
        this._heightTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType
        });
        this._outputTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType
        });

        this._strokeMaterial = new THREE.RawShaderMaterial({
            vertexShader: strokeVertexShader,
            fragmentShader: strokeFragmentShader,
            uniforms: {
                uGrowth: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) }
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending,
            glslVersion: THREE.GLSL1
        });

        this._heightMaterial = new THREE.RawShaderMaterial({
            vertexShader: strokeVertexShader,
            fragmentShader: heightFragmentShader,
            uniforms: {
                uGrowth: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) }
            },
            transparent: false,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            glslVersion: THREE.GLSL1
        });

        this._compositeMaterial = new THREE.ShaderMaterial({
            vertexShader: compositeVertexShader,
            fragmentShader: compositeFragmentShader,
            uniforms: {
                tBrush: { value: this._brushTarget.texture },
                tHeight: { value: this._heightTarget.texture },
                uImpastoStrength: { value: 1.2 },
                uWetness: { value: 0.3 },
                uResolution: { value: new THREE.Vector2(width, height) },
                uLightDir: { value: new THREE.Vector3(0.3, 0.5, 1.0).normalize() }
            },
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const quadGeo = new THREE.PlaneGeometry(2, 2);
        this._compositeQuad = new THREE.Mesh(quadGeo, this._compositeMaterial);
        this._compositeScene.add(this._compositeQuad);

        this._underpaintingMaterial = new THREE.ShaderMaterial({
            vertexShader: underpaintingVertexShader,
            fragmentShader: underpaintingFragmentShader,
            uniforms: {
                tSource: { value: null },
                uTexel: { value: new THREE.Vector2(2.0 / width, 2.0 / height) }
            },
            transparent: false,
            depthTest: false,
            depthWrite: false
        });
        this._underpaintingScene = new THREE.Scene();
        this._underpaintingQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this._underpaintingMaterial
        );
        this._underpaintingScene.add(this._underpaintingQuad);
        this._sourceTexture = null;

        this._strokeMesh = null;
    }

    get outputTexture() {
        return this._outputTarget.texture;
    }

    get isGrowing() {
        return this._growthStart >= 0;
    }

    processImage(imageData) {
        const { data } = imageData;
        const w = imageData.width;
        const h = imageData.height;

        if (this._sourceTexture) this._sourceTexture.dispose();
        this._sourceTexture = new THREE.DataTexture(
            new Uint8Array(data), w, h, THREE.RGBAFormat
        );
        this._sourceTexture.needsUpdate = true;
        this._underpaintingMaterial.uniforms.tSource.value = this._sourceTexture;

        const field = buildDirectionField(imageData, w, h);
        const seeds = generateSeeds(w, h);
        const allStrokes = [];

        const processLayer = (layerSeeds, layer, widthBase, lengthBase) => {
            for (const seed of layerSeeds) {
                const streamline = traceStreamline(seed, field, data, lengthBase, 2.0);
                if (streamline.points.length < 3) continue;
                const bezier = fitBezier(streamline.points);
                if (!bezier) continue;

                let birth, duration;
                if (layer === 0) {
                    birth = Math.random() * 0.7;
                    duration = 1.2 * (0.82 + Math.random() * 0.36);
                } else if (layer === 1) {
                    birth = 0.72 + Math.random() * 1.2;
                    duration = 0.9 * (0.82 + Math.random() * 0.36);
                } else {
                    birth = 0.72 + Math.random() * 1.85;
                    duration = 0.22 + Math.random() * 0.18;
                }

                allStrokes.push({
                    p0: bezier.p0, p1: bezier.p1, p2: bezier.p2, p3: bezier.p3,
                    color: streamline.color,
                    width: widthBase * (0.7 + Math.random() * 0.6),
                    seed: Math.random(),
                    birth, duration, layer
                });
            }
        };

        processLayer(seeds.coarse, 0, w * 0.055, 90);
        processLayer(seeds.medium, 1, w * 0.028, 55);
        processLayer(seeds.fine, 2, w * 0.014, 30);

        if (this._strokeMesh) {
            this._strokeScene.remove(this._strokeMesh);
            this._strokeMesh.geometry.dispose();
        }

        const geo = createStrokeGeometry(allStrokes);
        this._strokeMesh = new THREE.Mesh(geo, this._strokeMaterial);
        this._strokeMesh.frustumCulled = false;
        this._strokeScene.add(this._strokeMesh);

        this._strokes = allStrokes;
        this._growthStart = performance.now() / 1000;
        return allStrokes.length;
    }

    update(nowSeconds) {
        if (this._disposed || !this._strokeMesh) return false;

        const elapsed = this._growthStart >= 0
            ? nowSeconds - this._growthStart
            : GROWTH_DURATION + 1;

        if (this._growthStart >= 0 && elapsed > GROWTH_DURATION + 0.5) {
            this._growthStart = -1;
        }

        const growthValue = this._growthStart >= 0 ? elapsed : GROWTH_DURATION + 1;

        this._strokeMaterial.uniforms.uGrowth.value = growthValue;
        this._heightMaterial.uniforms.uGrowth.value = growthValue;

        const wetness = this._growthStart >= 0
            ? Math.max(0, 0.8 - elapsed * 0.15)
            : 0.05;
        this._compositeMaterial.uniforms.uWetness.value = wetness;

        const renderer = this._renderer;
        const prevTarget = renderer.getRenderTarget();
        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        // Brush pass — underpainting base + strokes on top
        renderer.setRenderTarget(this._brushTarget);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        if (this._sourceTexture) {
            renderer.render(this._underpaintingScene, this._orthoCamera);
        }
        this._strokeMesh.material = this._strokeMaterial;
        renderer.render(this._strokeScene, this._orthoCamera);

        // Height pass
        renderer.setRenderTarget(this._heightTarget);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        this._strokeMesh.material = this._heightMaterial;
        renderer.render(this._strokeScene, this._orthoCamera);

        // Composite pass
        renderer.setRenderTarget(this._outputTarget);
        renderer.setClearColor(0x0a0a12, 1);
        renderer.clear();
        renderer.render(this._compositeScene, this._orthoCamera);

        // Restore
        renderer.setRenderTarget(prevTarget);
        renderer.autoClear = prevAutoClear;

        return this._growthStart >= 0;
    }

    replay() {
        this._growthStart = performance.now() / 1000;
    }

    dispose() {
        this._disposed = true;
        this._brushTarget.dispose();
        this._heightTarget.dispose();
        this._outputTarget.dispose();
        this._strokeMaterial.dispose();
        this._heightMaterial.dispose();
        this._compositeMaterial.dispose();
        this._underpaintingMaterial.dispose();
        if (this._sourceTexture) this._sourceTexture.dispose();
        if (this._strokeMesh) {
            this._strokeMesh.geometry.dispose();
        }
        this._compositeQuad.geometry.dispose();
        this._underpaintingQuad.geometry.dispose();
    }
}
