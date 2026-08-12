from pathlib import Path

root = Path('breeze-source')

# -----------------------------------------------------------------------------
# V2: robust video media, custom background media, replaceable 3D collider/model
# Applied AFTER build_breeze_studio_pro.py and BEFORE vite build.
# Original Juanmaes83/breeze repository remains untouched.
# -----------------------------------------------------------------------------

# 1) Robust cloth image/video media handling.
p = root / 'src/clothGeometry.js'
s = p.read_text(encoding='utf-8')
old = '''    async setMediaFile(file, transform = {}) {
        if (!file || !this.material) return;
        this.cleanupMedia();
        this.mediaObjectUrl = URL.createObjectURL(file);
        let map;
        if (file.type && file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = this.mediaObjectUrl;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            await video.play();
            this.mediaVideo = video;
            map = new THREE.VideoTexture(video);
        } else {
            map = await new THREE.TextureLoader().loadAsync(this.mediaObjectUrl);
        }
        map.colorSpace = THREE.SRGBColorSpace;
        this.material.map = map;
        this.material.needsUpdate = true;
        this.applyMediaTransform(transform.scale, transform.x, transform.y);
    }
'''
new = '''    async waitForVideoReady(video, timeoutMs = 8000) {
        if (video.readyState >= 2) return;
        await new Promise((resolve, reject) => {
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

    async setMediaFile(file, transform = {}) {
        if (!file || !this.material) return;
        this.cleanupMedia();
        this.mediaObjectUrl = URL.createObjectURL(file);
        let map;
        if (file.type && file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = this.mediaObjectUrl;
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('playsinline', '');
            await this.waitForVideoReady(video);
            this.mediaVideo = video;
            map = new THREE.VideoTexture(video);
            map.generateMipmaps = false;
            video.play().catch(() => {
                const retry = () => { video.play().catch(() => {}); window.removeEventListener('pointerdown', retry); };
                window.addEventListener('pointerdown', retry, { once: true });
            });
        } else {
            map = await new THREE.TextureLoader().loadAsync(this.mediaObjectUrl);
        }
        map.colorSpace = THREE.SRGBColorSpace;
        this.material.map = map;
        this.material.needsUpdate = true;
        this.applyMediaTransform(transform.scale, transform.x, transform.y);
    }
'''
if old not in s:
    raise SystemExit('V2 cloth media patch target not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# 2) Replace Statue with a loader that can use the original Venus OR an uploaded
# GLB/GLTF/OBJ, auto-normalizing it and creating the BVH from the same geometry.
statue = r'''import * as THREE from "three/webgpu";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Venus from '../assets/venus_de_milo.glb';
import VenusSimple from '../assets/venus_simple2.obj';
import {BVH} from "./bvh.js";

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

function firstMesh(root) {
    let mesh = null;
    root.traverse?.(o => { if (!mesh && o.isMesh) mesh = o; });
    return mesh;
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
            g.setIndex(Array.from({length: count}, (_, i) => i));
        }
        geometries.push(g);
    });
    if (!geometries.length) throw new Error('Uploaded model contains no mesh geometry');
    const merged = geometries.length === 1 ? geometries[0] : BufferGeometryUtils.mergeGeometries(geometries, false);
    if (!merged) throw new Error('Could not merge uploaded model geometry');
    return merged;
}

function normalizeModel(root, targetHeight = 6.0) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid model bounds');
    const scale = targetHeight / size.y;
    root.scale.multiplyScalar(scale);
    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    const center2 = box2.getCenter(new THREE.Vector3());
    root.position.x -= center2.x;
    root.position.z -= center2.z;
    root.position.y -= box2.min.y;
    root.updateMatrixWorld(true);
}

export class Statue {
    constructor(customModel = null) {
        this.customModel = customModel;
    }

    async loadCustomModel(model) {
        const name = (model?.name || '').toLowerCase();
        if (name.endsWith('.obj')) return await objLoader.loadAsync(model.url);
        if (name.endsWith('.glb') || name.endsWith('.gltf')) {
            const gltf = await gltfLoader.loadAsync(model.url);
            return gltf.scene;
        }
        throw new Error('Unsupported 3D model. Use .glb, .gltf or .obj');
    }

    async init() {
        if (this.customModel) {
            const root = await this.loadCustomModel(this.customModel);
            normalizeModel(root, 6.0);
            root.traverse?.(o => {
                if (!o.isMesh) return;
                o.castShadow = true;
                o.receiveShadow = true;
            });
            this.object = root;
            const colliderGeometry = mergedWorldGeometry(root);
            this.bvh = new BVH(colliderGeometry);
            return;
        }

        const objSimple = await objLoader.loadAsync(VenusSimple);
        const gltf = await gltfLoader.loadAsync(Venus);
        this.object = firstMesh(gltf.scene) || gltf.scene;
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.object.scale.set(0.25,0.25,0.25);
        this.object.rotation.set(0, Math.PI * -0.5, 0);

        const geometrySimple = objSimple.children[0].geometry;
        geometrySimple.scale(25,25,25);
        geometrySimple.rotateY(Math.PI * -0.5);
        this.bvh = new BVH(geometrySimple);
    }

    update(elapsed) {}
}
'''
(root / 'src/statue.js').write_text(statue, encoding='utf-8')

# 3) App background API + custom model scene rebuild.
p = root / 'src/app.js'
s = p.read_text(encoding='utf-8')
s = s.replace('        const skybox = new GroundedSkybox( hdriTexture, sceneConfig.skyboxHeight, 100, 96 );',
              '        const skybox = new GroundedSkybox( hdriTexture, sceneConfig.skyboxHeight, 100, 96 );\n        this.skybox = skybox;', 1)
s = s.replace('        this.statue = new Statue();', '        this.statue = new Statue(this.customModel || null);', 1)

# Re-apply persistent background after each scene rebuild.
needle = '        this.sceneInitialized = true;\n'
replace = '''        this.sceneInitialized = true;
        if (this.backgroundFile) {
            await this.applyBackgroundFile(this.backgroundFile);
        }
'''
if needle not in s:
    raise SystemExit('sceneInitialized target not found')
s = s.replace(needle, replace, 1)

# Insert APIs before resize().
needle = '    resize(width, height) {\n'
addition = r'''    cleanupBackgroundMedia() {
        if (this.backgroundObjectUrl) {
            URL.revokeObjectURL(this.backgroundObjectUrl);
            this.backgroundObjectUrl = null;
        }
        if (this.backgroundVideo) {
            try { this.backgroundVideo.pause(); } catch (_) {}
            this.backgroundVideo.removeAttribute('src');
            this.backgroundVideo.load();
            this.backgroundVideo = null;
        }
        if (this.backgroundTexture && this.backgroundTexture.dispose) {
            try { this.backgroundTexture.dispose(); } catch (_) {}
        }
        this.backgroundTexture = null;
    }

    async waitForVideoReady(video, timeoutMs = 8000) {
        if (video.readyState >= 2) return;
        await new Promise((resolve, reject) => {
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

    async applyBackgroundFile(file) {
        if (!file || !this.scene) return;
        this.cleanupBackgroundMedia();
        this.backgroundObjectUrl = URL.createObjectURL(file);
        let texture;
        if (file.type && file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = this.backgroundObjectUrl;
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('playsinline', '');
            await this.waitForVideoReady(video);
            this.backgroundVideo = video;
            texture = new THREE.VideoTexture(video);
            texture.generateMipmaps = false;
            video.play().catch(() => {
                const retry = () => { video.play().catch(() => {}); window.removeEventListener('pointerdown', retry); };
                window.addEventListener('pointerdown', retry, { once: true });
            });
        } else {
            texture = await new THREE.TextureLoader().loadAsync(this.backgroundObjectUrl);
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        this.backgroundTexture = texture;
        this.scene.background = texture;
        if (this.skybox) this.skybox.visible = false;
    }

    async setBackgroundFile(file) {
        this.backgroundFile = file;
        await this.applyBackgroundFile(file);
    }

    resetBackground() {
        this.backgroundFile = null;
        this.cleanupBackgroundMedia();
        if (this.scene) this.scene.background = null;
        if (this.skybox) this.skybox.visible = true;
    }

    async setModelFile(file) {
        if (!file) return;
        const name = (file.name || '').toLowerCase();
        if (!name.endsWith('.glb') && !name.endsWith('.gltf') && !name.endsWith('.obj')) {
            throw new Error('Use a .glb, .gltf or .obj model');
        }
        if (this.customModel?.url) URL.revokeObjectURL(this.customModel.url);
        this.customModel = { url: URL.createObjectURL(file), name: file.name, type: file.type || '' };
        await this.setupScene(this.sceneName || conf.sceneName || 'cloth');
    }

    async resetModel() {
        if (this.customModel?.url) URL.revokeObjectURL(this.customModel.url);
        this.customModel = null;
        await this.setupScene(this.sceneName || conf.sceneName || 'cloth');
    }

'''
if needle not in s:
    raise SystemExit('App API insertion point not found')
s = s.replace(needle, addition + needle, 1)
p.write_text(s, encoding='utf-8')

# 4) Extend studio panel with Background + 3D Object and status/error feedback.
p = root / 'src/studioPanel.js'
s = p.read_text(encoding='utf-8')

# Add status CSS.
s = s.replace("      #breezeStudioPanel .hint{opacity:.5;font-size:10px;margin-top:6px}\n",
              "      #breezeStudioPanel .hint{opacity:.5;font-size:10px;margin-top:6px}\n      #breezeStudioPanel .status{margin-top:7px;padding:7px 8px;border-radius:8px;background:#171b21;color:#aab3c2;font-size:10px;min-height:14px}\n      #breezeStudioPanel .status.ok{color:#9fd3aa} #breezeStudioPanel .status.err{color:#ff9d9d}\n", 1)

anchor = '''      <div class="section"><div class="sectionTitle">Media on cloth</div>
'''
insert = '''      <div class="section"><div class="sectionTitle">Background</div>
        <label class="upload">Upload background image / video<input id="bsBackground" type="file" accept="image/*,video/*"></label>
        <button id="bsResetBackground" type="button">Restore original environment</button>
        <div class="hint">Custom media replaces only the visible background. The original HDRI remains as scene lighting.</div>
      </div>
      <div class="section"><div class="sectionTitle">3D Object</div>
        <label class="upload">Replace sculpture / object<input id="bsModel" type="file" accept=".glb,.gltf,.obj,model/gltf-binary,model/gltf+json"></label>
        <button id="bsResetModel" type="button">Restore Venus de Milo</button>
        <div class="hint">GLB / GLTF / OBJ. The model is auto-scaled and its geometry becomes the real cloth collider.</div>
      </div>
''' + anchor
if anchor not in s:
    raise SystemExit('Panel media anchor not found')
s = s.replace(anchor, insert, 1)

# Add status line before output section.
anchor = '''      <div class="section"><div class="sectionTitle">Output</div><div class="grid">'''
replace = '''      <div class="status" id="bsStatus">Ready</div>
      <div class="section"><div class="sectionTitle">Output</div><div class="grid">'''
if anchor not in s:
    raise SystemExit('Panel output anchor not found')
s = s.replace(anchor, replace, 1)

# Replace upload handler with robust error feedback and add bg/model handlers.
old = '''    $('bsMedia').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        $('bsScene').value = 'cloth'; conf.sceneName = 'cloth';
        await app.setMediaFile(file); syncMedia();
    });
    $('bsResetMedia').addEventListener('click', () => app.resetMedia());
'''
new = '''    const setStatus = (text, kind = '') => { const el=$('bsStatus'); el.textContent=text; el.className='status'+(kind?' '+kind:''); };

    $('bsMedia').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            setStatus('Loading cloth media…');
            $('bsScene').value = 'cloth'; conf.sceneName = 'cloth';
            await app.setMediaFile(file); syncMedia();
            setStatus('Cloth media ready', 'ok');
        } catch (err) {
            console.error(err); setStatus('Cloth media error: ' + (err?.message || err), 'err');
        }
    });
    $('bsResetMedia').addEventListener('click', () => { app.resetMedia(); setStatus('Original fabric restored', 'ok'); });

    $('bsBackground').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try { setStatus('Loading background…'); await app.setBackgroundFile(file); setStatus('Background ready', 'ok'); }
        catch (err) { console.error(err); setStatus('Background error: ' + (err?.message || err), 'err'); }
    });
    $('bsResetBackground').addEventListener('click', () => { app.resetBackground(); setStatus('Original environment restored', 'ok'); });

    $('bsModel').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try { setStatus('Rebuilding scene with new 3D object…'); await app.setModelFile(file); setStatus('3D object + collider ready', 'ok'); }
        catch (err) { console.error(err); setStatus('3D model error: ' + (err?.message || err), 'err'); }
    });
    $('bsResetModel').addEventListener('click', async () => {
        try { setStatus('Restoring Venus…'); await app.resetModel(); setStatus('Venus restored', 'ok'); }
        catch (err) { console.error(err); setStatus('Restore error: ' + (err?.message || err), 'err'); }
    });
'''
if old not in s:
    raise SystemExit('Panel media handler target not found')
s = s.replace(old, new, 1)

# Reset now restores derivative media/background/model too.
old = '''        app.resetMedia();
    });
'''
new = '''        app.resetMedia();
        app.resetBackground();
        app.resetModel().catch(err => console.error(err));
        setStatus('Reset complete', 'ok');
    });
'''
# replace last occurrence only
idx = s.rfind(old)
if idx == -1:
    raise SystemExit('Panel reset target not found')
s = s[:idx] + s[idx:].replace(old, new, 1)
p.write_text(s, encoding='utf-8')

print('Breeze Studio PRO V2 patches applied')
