from pathlib import Path

root = Path('breeze-source')

# Breeze Studio PRO V3
# Built directly from the preserved Juanmaes83/breeze source.
# The original repository and Banderolas remain untouched.

# -----------------------------------------------------------------------------
# 1) Cloth: real image/video texture application with explicit staged/apply flow.
# -----------------------------------------------------------------------------
p = root / 'src/clothGeometry.js'
s = p.read_text(encoding='utf-8')
needle = "    async createMaterial() {\n"
addition = r'''    cleanupUserMedia() {
        if (this.userMediaVideo) {
            try { this.userMediaVideo.pause(); } catch (_) {}
            this.userMediaVideo.removeAttribute('src');
            try { this.userMediaVideo.load(); } catch (_) {}
            this.userMediaVideo = null;
        }
        if (this.userMediaUrl) {
            URL.revokeObjectURL(this.userMediaUrl);
            this.userMediaUrl = null;
        }
        if (this.userMediaTexture && this.userMediaTexture !== this.defaultMap) {
            try { this.userMediaTexture.dispose(); } catch (_) {}
        }
        this.userMediaTexture = null;
    }

    waitForVideoReady(video, timeoutMs = 12000) {
        if (video.readyState >= 2) return Promise.resolve();
        return new Promise((resolve, reject) => {
            let done = false;
            const finish = (ok, err) => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                video.removeEventListener('loadeddata', onReady);
                video.removeEventListener('canplay', onReady);
                video.removeEventListener('error', onError);
                ok ? resolve() : reject(err || new Error('Video failed to load'));
            };
            const onReady = () => finish(true);
            const onError = () => finish(false, video.error || new Error('Unsupported video'));
            const timer = setTimeout(() => finish(false, new Error('Video load timeout')), timeoutMs);
            video.addEventListener('loadeddata', onReady, { once: true });
            video.addEventListener('canplay', onReady, { once: true });
            video.addEventListener('error', onError, { once: true });
            video.load();
        });
    }

    applyUserMediaTransform(transform = {}) {
        this.userMediaTransform = {
            scale: Math.max(0.5, Math.min(2.5, Number(transform.scale ?? this.userMediaTransform?.scale ?? 1) || 1)),
            x: Math.max(-1, Math.min(1, Number(transform.x ?? this.userMediaTransform?.x ?? 0) || 0)),
            y: Math.max(-1, Math.min(1, Number(transform.y ?? this.userMediaTransform?.y ?? 0) || 0)),
        };
        const map = this.material?.map;
        if (!map || map === this.defaultMap) return;
        // Breeze cloth UVs span roughly 0..3. A 1/3 repeat maps one user asset
        // across the complete cloth instead of repeating it three times.
        const repeat = (1 / 3) / this.userMediaTransform.scale;
        map.wrapS = THREE.ClampToEdgeWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;
        map.repeat.set(repeat, repeat);
        map.offset.set(
            (1 - repeat * 3) * 0.5 + this.userMediaTransform.x * 0.25,
            (1 - repeat * 3) * 0.5 + this.userMediaTransform.y * 0.25
        );
        map.needsUpdate = true;
    }

    async applyUserMediaFile(file, transform = {}) {
        if (!file || !this.material) throw new Error('Cloth material is not ready');
        const isVideo = (file.type || '').startsWith('video/');
        const isImage = (file.type || '').startsWith('image/');
        if (!isVideo && !isImage) throw new Error('Use an image or video file');

        this.cleanupUserMedia();
        const url = URL.createObjectURL(file);
        this.userMediaUrl = url;
        let map;
        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('playsinline', '');
            await this.waitForVideoReady(video);
            this.userMediaVideo = video;
            map = new THREE.VideoTexture(video);
            map.generateMipmaps = false;
            // Same proven principle used by Banderolas: playback must never be
            // the condition that decides whether the asset was accepted.
            video.play().catch(() => {
                const retry = () => video.play().catch(() => {});
                window.addEventListener('pointerdown', retry, { once: true });
            });
        } else {
            map = await new THREE.TextureLoader().loadAsync(url);
        }
        map.colorSpace = THREE.SRGBColorSpace;
        map.flipY = true;
        this.userMediaTexture = map;
        this.material.map = map;
        this.material.needsUpdate = true;
        this.applyUserMediaTransform(transform);
        return { kind: isVideo ? 'video' : 'image', texture: map };
    }

    restoreOriginalFabric() {
        this.cleanupUserMedia();
        if (!this.material || !this.defaultMap) return;
        this.material.map = this.defaultMap;
        this.material.needsUpdate = true;
    }

'''
if 'async applyUserMediaFile(file' not in s:
    if needle not in s:
        raise SystemExit('cloth createMaterial insertion point not found')
    s = s.replace(needle, addition + needle, 1)

old = "        this.material = material;\n\n    }\n}"
new = "        this.material = material;\n        this.defaultMap = colorMap;\n        this.userMediaTransform = { scale: 1, x: 0, y: 0 };\n\n    }\n}"
if 'this.defaultMap = colorMap;' not in s:
    if old not in s:
        raise SystemExit('cloth material tail not found')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# 2) Statue/object system: preserve Venus, support uploads and built-in templates.
#    Uploaded/built-in geometry becomes the collider too.
# -----------------------------------------------------------------------------
statue = r'''import * as THREE from "three/webgpu";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Venus from '../assets/venus_de_milo.glb';
import VenusSimple from '../assets/venus_simple2.obj';
import { BVH } from './bvh.js';

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

function firstMesh(root) {
    let mesh = null;
    root.traverse?.(o => { if (!mesh && o.isMesh) mesh = o; });
    return mesh;
}

function normalizeRoot(root, targetHeight = 6) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid model bounds');
    const scale = targetHeight / size.y;
    root.scale.multiplyScalar(scale);
    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    const center = box2.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box2.min.y;
    root.updateMatrixWorld(true);
}

function mergedWorldGeometry(root) {
    root.updateMatrixWorld(true);
    const geometries = [];
    root.traverse?.(o => {
        if (!o.isMesh || !o.geometry) return;
        const g = o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        if (!g.index) {
            const count = g.getAttribute('position')?.count || 0;
            g.setIndex(Array.from({ length: count }, (_, i) => i));
        }
        geometries.push(g);
    });
    if (!geometries.length) throw new Error('Model contains no mesh geometry');
    const merged = geometries.length === 1 ? geometries[0] : BufferGeometryUtils.mergeGeometries(geometries, false);
    if (!merged) throw new Error('Could not build collider geometry');
    return merged;
}

function templateRoot(kind) {
    const material = new THREE.MeshPhysicalMaterial({ color: 0xe8e4dc, roughness: 0.48, metalness: 0.03 });
    if (kind === 'torus-knot') {
        return new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.36, 160, 28), material);
    }
    if (kind === 'abstract-orbit') {
        const group = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.22, 24, 96), material);
        ring.rotation.x = Math.PI * 0.35;
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), material);
        orb.position.set(0.25, 0.3, 0.1);
        group.add(ring, orb);
        return group;
    }
    if (kind === 'museum-plinth') {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 2.2), material);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 2.6), material);
        cap.position.y = 1.95;
        group.add(base, cap);
        return group;
    }
    return null;
}

export class Statue {
    constructor(spec = null) {
        this.spec = spec;
    }

    async loadUploaded(spec) {
        const name = (spec?.name || '').toLowerCase();
        if (name.endsWith('.obj')) return await objLoader.loadAsync(spec.url);
        if (name.endsWith('.glb') || name.endsWith('.gltf')) {
            const gltf = await gltfLoader.loadAsync(spec.url);
            return gltf.scene;
        }
        throw new Error('Unsupported 3D file. Use GLB, GLTF or OBJ');
    }

    async init() {
        if (this.spec?.kind === 'upload') {
            const root = await this.loadUploaded(this.spec);
            normalizeRoot(root, 6);
            root.traverse?.(o => {
                if (!o.isMesh) return;
                o.castShadow = true;
                o.receiveShadow = true;
            });
            this.object = root;
            this.bvh = new BVH(mergedWorldGeometry(root));
            return;
        }

        if (this.spec?.kind === 'template') {
            const root = templateRoot(this.spec.id);
            if (!root) throw new Error('Unknown built-in 3D template');
            normalizeRoot(root, 6);
            root.traverse?.(o => {
                if (!o.isMesh) return;
                o.castShadow = true;
                o.receiveShadow = true;
            });
            this.object = root;
            this.bvh = new BVH(mergedWorldGeometry(root));
            return;
        }

        const objSimple = await objLoader.loadAsync(VenusSimple);
        const gltf = await gltfLoader.loadAsync(Venus);
        this.object = firstMesh(gltf.scene) || gltf.scene;
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.object.scale.set(0.25, 0.25, 0.25);
        this.object.rotation.set(0, Math.PI * -0.5, 0);

        const geometrySimple = objSimple.children[0].geometry;
        geometrySimple.scale(25, 25, 25);
        geometrySimple.rotateY(Math.PI * -0.5);
        this.bvh = new BVH(geometrySimple);
    }

    update(elapsed) {}
}
'''
(root / 'src/statue.js').write_text(statue, encoding='utf-8')

# -----------------------------------------------------------------------------
# 3) App API: one authoritative asset state + safe apply/rebuild operations.
# -----------------------------------------------------------------------------
p = root / 'src/app.js'
s = p.read_text(encoding='utf-8')

s = s.replace(
    '        const skybox = new GroundedSkybox( hdriTexture, sceneConfig.skyboxHeight, 100, 96 );',
    '        const skybox = new GroundedSkybox( hdriTexture, sceneConfig.skyboxHeight, 100, 96 );\n        this.skybox = skybox;',
    1
)
s = s.replace('        this.statue = new Statue();', '        this.statue = new Statue(this.objectSpec || null);', 1)
s = s.replace(
    '        await clothGeometry.bake();\n        this.clothObject.add(clothGeometry.object);',
    '        await clothGeometry.bake();\n        this.clothGeometry = clothGeometry;\n        this.clothObject.add(clothGeometry.object);',
    1
)

old_end = '''        this.sceneConfig = sceneConfig;
        this.sceneName = sceneName;
        this.sceneInitialized = true;
    }

    resize(width, height) {
'''
new_end = '''        this.sceneConfig = sceneConfig;
        this.sceneName = sceneName;
        this.sceneInitialized = true;

        // Rehydrate only assets that were explicitly APPLIED by the user.
        if (sceneName === 'cloth' && this.appliedClothFile && this.clothGeometry) {
            await this.clothGeometry.applyUserMediaFile(this.appliedClothFile, this.clothMediaTransform || {});
        }
        if (this.appliedBackgroundFile) {
            await this.applyBackgroundFile(this.appliedBackgroundFile, this.backgroundTransform || {});
        }
    }

    async selectScene(name) {
        if (!sceneConfigs[name]) throw new Error('Unknown Breeze scene');
        if (this.sceneName === name && this.sceneInitialized) {
            conf.sceneName = name;
            return;
        }
        if (this.sceneTransition) await this.sceneTransition;
        const task = (async () => {
            this.sceneInitialized = false;
            conf.sceneName = name;
            await this.setupScene(name);
        })();
        this.sceneTransition = task;
        try { await task; } finally { if (this.sceneTransition === task) this.sceneTransition = null; }
    }

    async rebuildScene() {
        if (this.sceneTransition) await this.sceneTransition;
        const name = this.sceneName || conf.sceneName || 'cloth';
        const task = this.setupScene(name);
        this.sceneTransition = task;
        try { await task; } finally { if (this.sceneTransition === task) this.sceneTransition = null; }
    }

    async applyClothFile(file) {
        if (!file) throw new Error('No cloth asset selected');
        await this.selectScene('cloth');
        if (!this.clothGeometry) throw new Error('Cloth renderer is not ready');
        await this.clothGeometry.applyUserMediaFile(file, this.clothMediaTransform || {});
        this.appliedClothFile = file;
        return true;
    }

    setClothMediaTransform(transform = {}) {
        this.clothMediaTransform = {
            scale: transform.scale ?? this.clothMediaTransform?.scale ?? 1,
            x: transform.x ?? this.clothMediaTransform?.x ?? 0,
            y: transform.y ?? this.clothMediaTransform?.y ?? 0,
        };
        if (this.sceneName === 'cloth' && this.clothGeometry) {
            this.clothGeometry.applyUserMediaTransform(this.clothMediaTransform);
        }
    }

    restoreOriginalFabric() {
        this.appliedClothFile = null;
        this.clothMediaTransform = { scale: 1, x: 0, y: 0 };
        this.clothGeometry?.restoreOriginalFabric();
    }

    cleanupBackground() {
        if (this.backgroundVideo) {
            try { this.backgroundVideo.pause(); } catch (_) {}
            this.backgroundVideo.removeAttribute('src');
            try { this.backgroundVideo.load(); } catch (_) {}
            this.backgroundVideo = null;
        }
        if (this.backgroundUrl) {
            URL.revokeObjectURL(this.backgroundUrl);
            this.backgroundUrl = null;
        }
        if (this.backgroundTexture) {
            try { this.backgroundTexture.dispose(); } catch (_) {}
            this.backgroundTexture = null;
        }
    }

    waitForBackgroundVideo(video, timeoutMs = 12000) {
        if (video.readyState >= 2) return Promise.resolve();
        return new Promise((resolve, reject) => {
            let done = false;
            const finish = (ok, err) => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                video.removeEventListener('loadeddata', ready);
                video.removeEventListener('canplay', ready);
                video.removeEventListener('error', fail);
                ok ? resolve() : reject(err || new Error('Background video failed to load'));
            };
            const ready = () => finish(true);
            const fail = () => finish(false, video.error || new Error('Unsupported background video'));
            const timer = setTimeout(() => finish(false, new Error('Background video load timeout')), timeoutMs);
            video.addEventListener('loadeddata', ready, { once: true });
            video.addEventListener('canplay', ready, { once: true });
            video.addEventListener('error', fail, { once: true });
            video.load();
        });
    }

    applyBackgroundTransform(transform = {}) {
        this.backgroundTransform = {
            scale: Math.max(1, Math.min(2.5, Number(transform.scale ?? this.backgroundTransform?.scale ?? 1) || 1)),
            x: Math.max(-1, Math.min(1, Number(transform.x ?? this.backgroundTransform?.x ?? 0) || 0)),
            y: Math.max(-1, Math.min(1, Number(transform.y ?? this.backgroundTransform?.y ?? 0) || 0)),
        };
        const texture = this.backgroundTexture;
        if (!texture) return;
        const repeat = 1 / this.backgroundTransform.scale;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(repeat, repeat);
        texture.offset.set(
            (1 - repeat) * 0.5 + this.backgroundTransform.x * 0.2,
            (1 - repeat) * 0.5 + this.backgroundTransform.y * 0.2
        );
        texture.needsUpdate = true;
    }

    async applyBackgroundFile(file, transform = {}) {
        if (!file || !this.scene) throw new Error('Scene is not ready');
        const isVideo = (file.type || '').startsWith('video/');
        const isImage = (file.type || '').startsWith('image/');
        if (!isVideo && !isImage) throw new Error('Use an image or video background');
        this.cleanupBackground();
        const url = URL.createObjectURL(file);
        this.backgroundUrl = url;
        let texture;
        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('playsinline', '');
            await this.waitForBackgroundVideo(video);
            this.backgroundVideo = video;
            texture = new THREE.VideoTexture(video);
            texture.generateMipmaps = false;
            video.play().catch(() => {
                const retry = () => video.play().catch(() => {});
                window.addEventListener('pointerdown', retry, { once: true });
            });
        } else {
            texture = await new THREE.TextureLoader().loadAsync(url);
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        this.backgroundTexture = texture;
        this.scene.background = texture;
        if (this.skybox) this.skybox.visible = false;
        this.applyBackgroundTransform(transform);
        return true;
    }

    async setAppliedBackgroundFile(file) {
        await this.applyBackgroundFile(file, this.backgroundTransform || {});
        this.appliedBackgroundFile = file;
    }

    restoreOriginalBackground() {
        this.appliedBackgroundFile = null;
        this.cleanupBackground();
        if (this.scene) this.scene.background = null;
        if (this.skybox) this.skybox.visible = true;
    }

    async applyUploadedObject(file) {
        if (!file) throw new Error('No 3D object selected');
        const name = (file.name || '').toLowerCase();
        if (!name.endsWith('.glb') && !name.endsWith('.gltf') && !name.endsWith('.obj')) {
            throw new Error('Use GLB, GLTF or OBJ');
        }
        if (this.objectSpec?.url) URL.revokeObjectURL(this.objectSpec.url);
        this.objectSpec = { kind: 'upload', url: URL.createObjectURL(file), name: file.name };
        await this.rebuildScene();
        return true;
    }

    async applyObjectTemplate(id) {
        if (this.objectSpec?.url) URL.revokeObjectURL(this.objectSpec.url);
        this.objectSpec = id === 'venus' ? null : { kind: 'template', id };
        await this.rebuildScene();
        return true;
    }

    async restoreVenus() {
        return this.applyObjectTemplate('venus');
    }

    resize(width, height) {
'''
if old_end not in s:
    raise SystemExit('app end insertion point not found')
s = s.replace(old_end, new_end, 1)

old_update = '''        if (conf.sceneName !== this.sceneName) {
            this.sceneName = conf.sceneName;
            this.sceneInitialized = false;
            await this.setupScene(this.sceneName);
        }
        if (!this.sceneInitialized) { return; }
'''
new_update = '''        if (this.sceneTransition) { return; }
        if (conf.sceneName !== this.sceneName) {
            await this.selectScene(conf.sceneName);
        }
        if (!this.sceneInitialized) { return; }
'''
if old_update not in s:
    raise SystemExit('app update scene transition target not found')
s = s.replace(old_update, new_update, 1)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# 4) Authoring panel: STAGE -> SAVED -> APPLY -> APPLIED confirmation.
# -----------------------------------------------------------------------------
panel = r'''import { conf } from './conf.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v)));
const humanBytes = n => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
const kindOf = file => (file?.type || '').startsWith('video/') ? 'VIDEO' : (file?.type || '').startsWith('image/') ? 'IMAGE' : 'FILE';

export function mountStudioPanel({ app, renderer }) {
    const css = document.createElement('style');
    css.textContent = `
      .tp-dfwv{display:none!important}
      #breezeStudioPanel{position:fixed;top:18px;right:18px;width:326px;max-height:calc(100vh - 36px);overflow:auto;z-index:50;background:rgba(12,14,18,.92);backdrop-filter:blur(18px);color:#f4f4f2;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;font:12px/1.35 Inter,system-ui,sans-serif;box-shadow:0 18px 60px rgba(0,0,0,.35)}
      #breezeStudioPanel.clean{display:none}
      #breezeStudioPanel h1{font-size:14px;margin:0 0 3px;font-weight:700;letter-spacing:.02em}
      #breezeStudioPanel .sub{opacity:.58;font-size:10px;margin-bottom:12px}
      #breezeStudioPanel .section{border-top:1px solid rgba(255,255,255,.08);padding-top:10px;margin-top:10px}
      #breezeStudioPanel .sectionTitle{font-size:10px;text-transform:uppercase;letter-spacing:.12em;opacity:.62;margin-bottom:8px}
      #breezeStudioPanel label.row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin:7px 0}
      #breezeStudioPanel input[type=range]{width:145px}
      #breezeStudioPanel select,#breezeStudioPanel button,#breezeStudioPanel .upload{background:#20242b;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:7px 9px;font:inherit}
      #breezeStudioPanel button,#breezeStudioPanel .upload{cursor:pointer}
      #breezeStudioPanel button:hover:not(:disabled),#breezeStudioPanel .upload:hover{background:#292e37}
      #breezeStudioPanel button:disabled{opacity:.34;cursor:not-allowed}
      #breezeStudioPanel .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      #breezeStudioPanel .upload{display:block;text-align:center;margin-bottom:7px}
      #breezeStudioPanel .upload input{display:none}
      #breezeStudioPanel .value{font-variant-numeric:tabular-nums;opacity:.72;min-width:38px;text-align:right}
      #breezeStudioPanel .hint{opacity:.5;font-size:10px;margin-top:6px;line-height:1.45}
      #breezeStudioPanel .asset{display:none;margin:7px 0;padding:9px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#15191f}
      #breezeStudioPanel .asset.on{display:block}.assetName{font-size:11px;font-weight:650;word-break:break-word}.assetMeta{margin-top:3px;font-size:9px;color:#9fd3aa;letter-spacing:.06em;text-transform:uppercase}
      #breezeStudioPanel .applied{margin-top:6px;color:#9fd3aa;font-size:10px}.status{margin-top:10px;padding:8px 9px;border-radius:9px;background:#171b21;color:#aab3c2;font-size:10px;min-height:14px}.status.ok{color:#9fd3aa}.status.err{color:#ff9d9d}.status.busy{color:#e6c86a}
      #breezeStudioPanel .library{display:grid;grid-template-columns:1fr auto;gap:7px;margin-bottom:7px}.library select{width:100%}
    `;
    document.head.appendChild(css);

    const panel = document.createElement('aside');
    panel.id = 'breezeStudioPanel';
    panel.innerHTML = `
      <h1>Breeze Studio PRO</h1><div class="sub">Dynamic Fabric · staged asset authoring</div>

      <div class="section"><div class="sectionTitle">01 · Scene</div>
        <label class="row">Experience<select id="bsScene"><option value="cloth">Prairie Cloth</option><option value="autumn">Autumn Leaves</option><option value="sakura">Sakura Petals</option></select></label>
        <label class="row">Auto rotate<input id="bsRotate" type="checkbox"></label>
        <label class="row">Run simulation<input id="bsRun" type="checkbox" checked></label>
        <label class="row">Wireframe<input id="bsWire" type="checkbox"></label>
      </div>

      <div class="section"><div class="sectionTitle">02 · Background</div>
        <label class="upload">1. Upload image / video<input id="bsBackground" type="file" accept="image/*,video/*"></label>
        <div class="asset" id="bsBackgroundAsset"><div class="assetName" id="bsBackgroundName"></div><div class="assetMeta" id="bsBackgroundMeta"></div></div>
        <button id="bsApplyBackground" type="button" disabled>2. Apply background</button>
        <div class="applied" id="bsBackgroundApplied"></div>
        <label class="row">Scale <span><input id="bsBgScale" type="range" min="1" max="2.5" value="1" step="0.01"><span class="value" id="bsBgScaleV">1.00</span></span></label>
        <label class="row">Position X <span><input id="bsBgX" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsBgXV">0.00</span></span></label>
        <label class="row">Position Y <span><input id="bsBgY" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsBgYV">0.00</span></span></label>
        <button id="bsResetBackground" type="button">Restore original environment</button>
        <div class="hint">The uploaded image/video changes the visible background. Breeze HDRI remains available for lighting.</div>
      </div>

      <div class="section"><div class="sectionTitle">03 · Media on cloth</div>
        <label class="upload">1. Upload image / video<input id="bsMedia" type="file" accept="image/*,video/*"></label>
        <div class="asset" id="bsMediaAsset"><div class="assetName" id="bsMediaName"></div><div class="assetMeta" id="bsMediaMeta"></div></div>
        <button id="bsApplyMedia" type="button" disabled>2. Apply to cloth</button>
        <div class="applied" id="bsMediaApplied"></div>
        <label class="row">Scale <span><input id="bsScale" type="range" min="0.5" max="2.5" value="1" step="0.01"><span class="value" id="bsScaleV">1.00</span></span></label>
        <label class="row">Position X <span><input id="bsX" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsXV">0.00</span></span></label>
        <label class="row">Position Y <span><input id="bsY" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsYV">0.00</span></span></label>
        <button id="bsResetMedia" type="button">Restore original fabric</button>
      </div>

      <div class="section"><div class="sectionTitle">04 · 3D Object</div>
        <div class="library"><select id="bsTemplate"><option value="venus">Venus de Milo · Original</option><option value="torus-knot">Abstract Torus Knot</option><option value="abstract-orbit">Abstract Orbit</option><option value="museum-plinth">Museum Plinth</option></select><button id="bsApplyTemplate" type="button">Apply</button></div>
        <label class="upload">1. Upload GLB / GLTF / OBJ<input id="bsModel" type="file" accept=".glb,.gltf,.obj,model/gltf-binary,model/gltf+json"></label>
        <div class="asset" id="bsModelAsset"><div class="assetName" id="bsModelName"></div><div class="assetMeta" id="bsModelMeta"></div></div>
        <button id="bsApplyModel" type="button" disabled>2. Apply uploaded object</button>
        <div class="applied" id="bsModelApplied">Applied: Venus de Milo ✓</div>
        <button id="bsResetModel" type="button">Restore Venus de Milo</button>
        <div class="hint">The applied object is also used to rebuild the cloth collider. GLB is the safest portable format.</div>
      </div>

      <div class="section"><div class="sectionTitle">05 · Physics</div>
        <label class="row">Stiffness <span><input id="bsStiff" type="range" min="0.1" max="0.5" value="0.25" step="0.01"><span class="value" id="bsStiffV">0.25</span></span></label>
        <label class="row">Friction <span><input id="bsFriction" type="range" min="0" max="1" value="0.25" step="0.01"><span class="value" id="bsFrictionV">0.25</span></span></label>
      </div>

      <div class="section"><div class="sectionTitle">06 · Output</div><div class="grid">
        <button id="bsPng" type="button">PNG</button><button id="bsRecord" type="button">Record WebM</button>
        <button id="bsClean" type="button">Preview Clean</button><button id="bsReset" type="button">Reset</button>
      </div></div>
      <div class="status" id="bsStatus">Ready · upload an asset, then Apply.</div>`;
    document.body.appendChild(panel);

    const $ = id => panel.querySelector('#' + id);
    const staged = { background: null, cloth: null, model: null };
    const clothTransform = { scale: 1, x: 0, y: 0 };
    const bgTransform = { scale: 1, x: 0, y: 0 };

    const status = (text, kind = '') => { $('bsStatus').textContent = text; $('bsStatus').className = 'status' + (kind ? ' ' + kind : ''); };
    const stage = (slot, file, prefix) => {
        staged[slot] = file;
        $(prefix + 'Asset').classList.add('on');
        $(prefix + 'Name').textContent = file.name;
        $(prefix + 'Meta').textContent = `${kindOf(file)} · ${humanBytes(file.size)} · Saved ✓`;
    };

    $('bsScene').value = conf.sceneName;
    $('bsScene').addEventListener('change', async e => {
        status('Switching scene…', 'busy');
        try { await app.selectScene(e.target.value); status('Scene applied ✓', 'ok'); }
        catch (err) { status('Scene error: ' + err.message, 'err'); }
    });
    $('bsRotate').checked = conf.rotateCamera;
    $('bsRotate').addEventListener('change', e => conf.rotateCamera = e.target.checked);
    $('bsRun').checked = conf.runSimulation;
    $('bsRun').addEventListener('change', e => conf.runSimulation = e.target.checked);
    $('bsWire').checked = conf.wireframe;
    $('bsWire').addEventListener('change', e => conf.wireframe = e.target.checked);

    const range = (id, out, state, key, min, max, apply) => {
        $(id).addEventListener('input', e => {
            state[key] = clamp(e.target.value, min, max);
            $(out).textContent = state[key].toFixed(2);
            apply(state);
        });
    };
    range('bsScale','bsScaleV',clothTransform,'scale',0.5,2.5,t => app.setClothMediaTransform(t));
    range('bsX','bsXV',clothTransform,'x',-1,1,t => app.setClothMediaTransform(t));
    range('bsY','bsYV',clothTransform,'y',-1,1,t => app.setClothMediaTransform(t));
    range('bsBgScale','bsBgScaleV',bgTransform,'scale',1,2.5,t => app.applyBackgroundTransform(t));
    range('bsBgX','bsBgXV',bgTransform,'x',-1,1,t => app.applyBackgroundTransform(t));
    range('bsBgY','bsBgYV',bgTransform,'y',-1,1,t => app.applyBackgroundTransform(t));

    const physicsRange = (id, out, key, min, max) => {
        $(id).value = conf[key]; $(out).textContent = Number(conf[key]).toFixed(2);
        $(id).addEventListener('input', e => { conf[key] = clamp(e.target.value, min, max); $(out).textContent = conf[key].toFixed(2); });
    };
    physicsRange('bsStiff','bsStiffV','stiffness',0.1,0.5);
    physicsRange('bsFriction','bsFrictionV','friction',0,1);

    $('bsBackground').addEventListener('change', e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (!(file.type || '').match(/^(image|video)\//)) return status('Background must be an image or video.', 'err');
        stage('background', file, 'bsBackground');
        $('bsApplyBackground').disabled = false;
        $('bsBackgroundApplied').textContent = '';
        status('Background saved. Press Apply background.', 'ok');
    });
    $('bsApplyBackground').addEventListener('click', async () => {
        if (!staged.background) return;
        status('Applying background…', 'busy'); $('bsApplyBackground').disabled = true;
        try {
            app.backgroundTransform = { ...bgTransform };
            await app.setAppliedBackgroundFile(staged.background);
            $('bsBackgroundApplied').textContent = `Applied: ${staged.background.name} ✓`;
            status('Background applied to renderer ✓', 'ok');
        } catch (err) { status('Background error: ' + err.message, 'err'); }
        finally { $('bsApplyBackground').disabled = false; }
    });
    $('bsResetBackground').addEventListener('click', () => {
        app.restoreOriginalBackground(); $('bsBackgroundApplied').textContent = 'Applied: original Breeze environment ✓'; status('Original background restored ✓', 'ok');
    });

    $('bsMedia').addEventListener('change', e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (!(file.type || '').match(/^(image|video)\//)) return status('Cloth media must be an image or video.', 'err');
        stage('cloth', file, 'bsMedia');
        $('bsApplyMedia').disabled = false;
        $('bsMediaApplied').textContent = '';
        status('Cloth media saved. Press Apply to cloth.', 'ok');
    });
    $('bsApplyMedia').addEventListener('click', async () => {
        if (!staged.cloth) return;
        status('Applying media to cloth…', 'busy'); $('bsApplyMedia').disabled = true;
        try {
            app.setClothMediaTransform(clothTransform);
            await app.applyClothFile(staged.cloth);
            $('bsScene').value = 'cloth';
            $('bsMediaApplied').textContent = `Applied: ${staged.cloth.name} ✓`;
            status('Media applied to cloth renderer ✓', 'ok');
        } catch (err) { status('Cloth media error: ' + err.message, 'err'); }
        finally { $('bsApplyMedia').disabled = false; }
    });
    $('bsResetMedia').addEventListener('click', () => {
        app.restoreOriginalFabric(); $('bsMediaApplied').textContent = 'Applied: original Breeze fabric ✓'; status('Original fabric restored ✓', 'ok');
    });

    $('bsModel').addEventListener('change', e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (!/\.(glb|gltf|obj)$/i.test(file.name || '')) return status('3D object must be GLB, GLTF or OBJ.', 'err');
        staged.model = file;
        $('bsModelAsset').classList.add('on'); $('bsModelName').textContent = file.name; $('bsModelMeta').textContent = `3D · ${humanBytes(file.size)} · Saved ✓`;
        $('bsApplyModel').disabled = false; status('3D object saved. Press Apply uploaded object.', 'ok');
    });
    $('bsApplyModel').addEventListener('click', async () => {
        if (!staged.model) return;
        status('Applying 3D object + rebuilding collider…', 'busy'); $('bsApplyModel').disabled = true;
        try { await app.applyUploadedObject(staged.model); $('bsModelApplied').textContent = `Applied: ${staged.model.name} + collider ✓`; status('3D object applied and collider rebuilt ✓', 'ok'); }
        catch (err) { status('3D object error: ' + err.message, 'err'); }
        finally { $('bsApplyModel').disabled = false; }
    });
    $('bsApplyTemplate').addEventListener('click', async () => {
        const id = $('bsTemplate').value; const label = $('bsTemplate').selectedOptions[0].textContent;
        status('Applying 3D template + rebuilding collider…', 'busy');
        try { await app.applyObjectTemplate(id); $('bsModelApplied').textContent = `Applied: ${label} ✓`; status('3D template applied ✓', 'ok'); }
        catch (err) { status('3D template error: ' + err.message, 'err'); }
    });
    $('bsResetModel').addEventListener('click', async () => {
        status('Restoring Venus de Milo…', 'busy');
        try { await app.restoreVenus(); $('bsTemplate').value='venus'; $('bsModelApplied').textContent='Applied: Venus de Milo ✓'; status('Venus de Milo restored ✓', 'ok'); }
        catch (err) { status('Restore error: ' + err.message, 'err'); }
    });

    const download = (href, name) => { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    $('bsPng').addEventListener('click', () => { try { download(renderer.domElement.toDataURL('image/png'), 'breeze-studio-pro.png'); status('PNG downloaded ✓','ok'); } catch (err) { status('PNG error: ' + err.message,'err'); } });

    let recorder = null, chunks = [];
    $('bsRecord').addEventListener('click', () => {
        try {
            if (recorder?.state === 'recording') { recorder.stop(); return; }
            const stream = renderer.domElement.captureStream(60); chunks = [];
            const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
            recorder = new MediaRecorder(stream, { mimeType: mime });
            recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
            recorder.onstop = () => { const url = URL.createObjectURL(new Blob(chunks,{type:mime})); download(url,'breeze-studio-pro.webm'); setTimeout(()=>URL.revokeObjectURL(url),2500); $('bsRecord').textContent='Record WebM'; status('WebM downloaded ✓','ok'); };
            recorder.start(250); $('bsRecord').textContent='Stop & Download'; status('Recording…','busy');
        } catch (err) { status('Recording error: ' + err.message,'err'); }
    });

    const togglePanel = () => panel.classList.toggle('clean');
    $('bsClean').addEventListener('click', togglePanel);
    window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'p') togglePanel(); });
    $('bsReset').addEventListener('click', async () => {
        status('Resetting Breeze Studio PRO…','busy');
        try {
            conf.rotateCamera=false; conf.runSimulation=true; conf.wireframe=false; conf.stiffness=.25; conf.friction=.25;
            app.restoreOriginalBackground(); app.restoreOriginalFabric(); await app.restoreVenus(); await app.selectScene('cloth');
            $('bsScene').value='cloth'; $('bsTemplate').value='venus'; $('bsBackgroundApplied').textContent=''; $('bsMediaApplied').textContent=''; $('bsModelApplied').textContent='Applied: Venus de Milo ✓';
            status('Reset complete ✓','ok');
        } catch (err) { status('Reset error: ' + err.message,'err'); }
    });
}
'''
(root / 'src/studioPanel.js').write_text(panel, encoding='utf-8')

# -----------------------------------------------------------------------------
# 5) Mount panel after Breeze initialization.
# -----------------------------------------------------------------------------
p = root / 'index.js'
s = p.read_text(encoding='utf-8')
if 'mountStudioPanel' not in s:
    s = s.replace('import App from "./src/app";', 'import App from "./src/app";\nimport { mountStudioPanel } from "./src/studioPanel.js";', 1)
    s = s.replace('    await app.init(updateLoadingProgressBar);', '    await app.init(updateLoadingProgressBar);\n    window.__BREEZE_STUDIO_PRO__ = { app, renderer };\n    mountStudioPanel({ app, renderer });', 1)
p.write_text(s, encoding='utf-8')

print('Breeze Studio PRO V3 authoring layer applied')
