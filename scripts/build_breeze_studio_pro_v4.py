from pathlib import Path
import re
import urllib.request

root = Path('breeze-source')
assets = root / 'src' / 'assets'
assets.mkdir(parents=True, exist_ok=True)

# Breeze Studio PRO V4
# Applied AFTER V3 and BEFORE Vite build.
# Banderolas and the source Breeze repository remain untouched.

# -----------------------------------------------------------------------------
# 1) Vendor a small, verified CC0 object starter library locally.
# -----------------------------------------------------------------------------
cc0_assets = {
    'khronos-corset.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Corset/glTF-Binary/Corset.glb',
    'khronos-boombox.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF-Binary/BoomBox.glb',
    'khronos-lantern.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb',
}
for filename, url in cc0_assets.items():
    dest = assets / filename
    if not dest.exists():
        urllib.request.urlretrieve(url, dest)

credits = root / 'CREDITS.md'
credits_text = credits.read_text(encoding='utf-8')
marker = '## Breeze Studio PRO V4 · CC0 object library'
if marker not in credits_text:
    credits_text += f'''\n\n{marker}\n\nThe following optional local templates are vendored from `KhronosGroup/glTF-Sample-Assets` and are CC0 1.0 Universal:\n\n- **Corset** — female fabric mannequin with corset/collar. © 2017 UX3D / Microsoft. CC0 1.0 Universal.\n- **BoomBox** — common product object. © 2017 Public / Microsoft. CC0 1.0 Universal.\n- **Lantern** — old wooden street light. © 2017 Microsoft; Draco conversion © 2018 Frank Galligan. CC0 1.0 Universal.\n\nSource: https://github.com/KhronosGroup/glTF-Sample-Assets\n'''
    credits.write_text(credits_text, encoding='utf-8')

# -----------------------------------------------------------------------------
# 2) Cloth media: process user media through CanvasTexture so LOOK controls are
#    cloth-only and work for both images and video under WebGPU.
# -----------------------------------------------------------------------------
p = root / 'src' / 'clothGeometry.js'
s = p.read_text(encoding='utf-8')

old_method = re.search(r"    async applyUserMediaFile\(file, transform = \{\}\) \{.*?\n    \}\n\n    restoreOriginalFabric", s, re.S)
if not old_method:
    raise SystemExit('V4: applyUserMediaFile method not found')
new_method = r'''    redrawUserMedia() {
        const source = this.userMediaSource;
        const canvas = this.userMediaCanvas;
        const ctx = this.userMediaCtx;
        if (!source || !canvas || !ctx) return;
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const look = this.userMediaLook || { brightness: 1, contrast: 1, saturation: 1, opacity: 1 };
            ctx.filter = `brightness(${look.brightness}) contrast(${look.contrast}) saturate(${look.saturation})`;
            ctx.globalAlpha = 1;
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';
            if (this.userMediaTexture) this.userMediaTexture.needsUpdate = true;
        } catch (_) {}
    }

    updateUserMediaFrame() {
        if (this.userMediaVideo && this.userMediaVideo.readyState >= 2 && !this.userMediaVideo.paused) {
            this.redrawUserMedia();
        }
    }

    applyUserLook(look = {}) {
        this.userMediaLook = {
            opacity: Math.max(0.05, Math.min(1, Number(look.opacity ?? this.userMediaLook?.opacity ?? 1) || 1)),
            brightness: Math.max(0.25, Math.min(2, Number(look.brightness ?? this.userMediaLook?.brightness ?? 1) || 1)),
            contrast: Math.max(0.25, Math.min(2, Number(look.contrast ?? this.userMediaLook?.contrast ?? 1) || 1)),
            saturation: Math.max(0, Math.min(2, Number(look.saturation ?? this.userMediaLook?.saturation ?? 1) || 1)),
        };
        if (this.material) {
            this.material.transparent = true;
            this.material.opacity = this.userMediaLook.opacity;
            this.material.depthWrite = this.userMediaLook.opacity > 0.98;
            this.material.needsUpdate = true;
        }
        this.redrawUserMedia();
    }

    async applyUserMediaFile(file, transform = {}) {
        if (!file || !this.material) throw new Error('Cloth material is not ready');
        const isVideo = (file.type || '').startsWith('video/');
        const isImage = (file.type || '').startsWith('image/');
        if (!isVideo && !isImage) throw new Error('Use an image or video file');

        this.cleanupUserMedia();
        const url = URL.createObjectURL(file);
        this.userMediaUrl = url;
        let source;
        let width = 1280;
        let height = 720;

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
            source = video;
            width = video.videoWidth || width;
            height = video.videoHeight || height;
            video.play().catch(() => {
                const retry = () => video.play().catch(() => {});
                window.addEventListener('pointerdown', retry, { once: true });
            });
        } else {
            const image = new Image();
            image.src = url;
            if (image.decode) await image.decode();
            else await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
            source = image;
            width = image.naturalWidth || width;
            height = image.naturalHeight || height;
        }

        const maxSide = 2048;
        const factor = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(2, Math.round(width * factor));
        canvas.height = Math.max(2, Math.round(height * factor));
        const ctx = canvas.getContext('2d', { alpha: true });
        this.userMediaSource = source;
        this.userMediaCanvas = canvas;
        this.userMediaCtx = ctx;
        this.userMediaLook = this.userMediaLook || { opacity: 1, brightness: 1, contrast: 1, saturation: 1 };

        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.generateMipmaps = false;
        map.flipY = true;
        this.userMediaTexture = map;
        this.material.map = map;
        this.material.needsUpdate = true;
        this.redrawUserMedia();
        this.applyUserMediaTransform(transform);
        this.applyUserLook(this.userMediaLook);
        return { kind: isVideo ? 'video' : 'image', texture: map };
    }

    restoreOriginalFabric'''
s = s[:old_method.start()] + new_method + s[old_method.end():]

# Extend cleanup and defaults.
s = s.replace(
    '        this.userMediaTexture = null;\n    }',
    '        this.userMediaTexture = null;\n        this.userMediaSource = null;\n        this.userMediaCanvas = null;\n        this.userMediaCtx = null;\n    }',
    1
)
s = s.replace(
    '        this.userMediaTransform = { scale: 1, x: 0, y: 0 };',
    '        this.userMediaTransform = { scale: 1, x: 0, y: 0 };\n        this.userMediaLook = { opacity: 1, brightness: 1, contrast: 1, saturation: 1 };',
    1
)
s = s.replace(
    '        this.material.map = this.defaultMap;\n        this.material.needsUpdate = true;',
    '        this.material.map = this.defaultMap;\n        this.material.opacity = 1;\n        this.material.depthWrite = true;\n        this.material.needsUpdate = true;',
    1
)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# 3) Real CC0 library models as local Vite assets + real collider geometry.
# -----------------------------------------------------------------------------
p = root / 'src' / 'statue.js'
s = p.read_text(encoding='utf-8')
s = s.replace(
    "import VenusSimple from '../assets/venus_simple2.obj';",
    "import VenusSimple from '../assets/venus_simple2.obj';\nimport CorsetCC0 from '../assets/khronos-corset.glb';\nimport BoomBoxCC0 from '../assets/khronos-boombox.glb';\nimport LanternCC0 from '../assets/khronos-lantern.glb';",
    1
)
insert_after = "const objLoader = new OBJLoader();\n"
lib_code = """
const libraryAssets = {
    'cc0-corset': CorsetCC0,
    'cc0-boombox': BoomBoxCC0,
    'cc0-lantern': LanternCC0,
};
"""
if 'const libraryAssets' not in s:
    s = s.replace(insert_after, insert_after + lib_code, 1)

needle = "    async init() {\n"
lib_init = r'''    async loadLibraryModel(id) {
        const url = libraryAssets[id];
        if (!url) throw new Error('Unknown CC0 library object');
        const gltf = await gltfLoader.loadAsync(url);
        return gltf.scene;
    }

'''
if 'async loadLibraryModel' not in s:
    s = s.replace(needle, lib_init + needle, 1)

library_branch = r'''        if (this.spec?.kind === 'library') {
            const root = await this.loadLibraryModel(this.spec.id);
            normalizeRoot(root, this.spec.id === 'cc0-corset' ? 6.2 : 5.2);
            root.traverse?.(o => {
                if (!o.isMesh) return;
                o.castShadow = true;
                o.receiveShadow = true;
            });
            this.object = root;
            this.bvh = new BVH(mergedWorldGeometry(root));
            return;
        }

'''
anchor = "        if (this.spec?.kind === 'template') {\n"
if "this.spec?.kind === 'library'" not in s:
    s = s.replace(anchor, library_branch + anchor, 1)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# 4) App: look state persists through scene rebuild; library ids are explicit.
# -----------------------------------------------------------------------------
p = root / 'src' / 'app.js'
s = p.read_text(encoding='utf-8')
s = s.replace(
    "            await this.clothGeometry.applyUserMediaFile(this.appliedClothFile, this.clothMediaTransform || {});",
    "            await this.clothGeometry.applyUserMediaFile(this.appliedClothFile, this.clothMediaTransform || {});\n            this.clothGeometry.applyUserLook(this.clothLook || {});",
    1
)

needle = "    restoreOriginalFabric() {\n"
look_method = r'''    setClothLook(look = {}) {
        this.clothLook = {
            opacity: look.opacity ?? this.clothLook?.opacity ?? 1,
            brightness: look.brightness ?? this.clothLook?.brightness ?? 1,
            contrast: look.contrast ?? this.clothLook?.contrast ?? 1,
            saturation: look.saturation ?? this.clothLook?.saturation ?? 1,
        };
        this.clothGeometry?.applyUserLook(this.clothLook);
    }

'''
if 'setClothLook(look' not in s:
    s = s.replace(needle, look_method + needle, 1)
s = s.replace(
    "        this.clothMediaTransform = { scale: 1, x: 0, y: 0 };\n        this.clothGeometry?.restoreOriginalFabric();",
    "        this.clothMediaTransform = { scale: 1, x: 0, y: 0 };\n        this.clothLook = { opacity: 1, brightness: 1, contrast: 1, saturation: 1 };\n        this.clothGeometry?.restoreOriginalFabric();",
    1
)
s = s.replace(
    "        this.objectSpec = id === 'venus' ? null : { kind: 'template', id };",
    "        this.objectSpec = id === 'venus' ? null : { kind: id.startsWith('cc0-') ? 'library' : 'template', id };",
    1
)
s = s.replace(
    "        await this.renderer.renderAsync(this.scene, this.camera);",
    "        this.clothGeometry?.updateUserMediaFrame?.();\n        await this.renderer.renderAsync(this.scene, this.camera);",
    1
)
p.write_text(s, encoding='utf-8')

# -----------------------------------------------------------------------------
# 5) Panel UX: LOADED -> START -> APPLIED, visual LOOK controls, real CC0
#    objects, and additive Experience presets built on the original three.
# -----------------------------------------------------------------------------
p = root / 'src' / 'studioPanel.js'
s = p.read_text(encoding='utf-8')

# Wording / visual hierarchy.
s = s.replace('Dynamic Fabric · staged asset authoring', 'Dynamic Fabric · LOAD → START → CREATE')
s = s.replace('1. Upload image / video', 'SUBIR imagen / vídeo')
s = s.replace('2. Apply background', 'START')
s = s.replace('2. Apply to cloth', 'START')
s = s.replace('1. Upload GLB / GLTF / OBJ', 'SUBIR GLB / GLTF / OBJ')
s = s.replace('2. Apply uploaded object', 'START')
s = s.replace('>Apply</button>', '>START</button>')
s = s.replace('Saved ✓', 'CARGADO ✓')
s = s.replace('Ready · upload an asset, then Apply.', 'LISTO · SUBE → comprueba CARGADO ✓ → pulsa START.')
s = s.replace('Press Apply background.', 'Pulsa START para usarlo.')
s = s.replace('Press Apply to cloth.', 'Pulsa START para usarlo.')
s = s.replace('Press Apply uploaded object.', 'Pulsa START para usarlo.')
s = s.replace('Background saved.', 'Fondo CARGADO ✓.')
s = s.replace('Cloth media saved.', 'Media de tela CARGADA ✓.')
s = s.replace('3D object saved.', 'Objeto 3D CARGADO ✓.')

# Expand Experiences without deleting original Breeze modes.
s = s.replace(
    '<option value="sakura">Sakura Petals</option>',
    '<option value="sakura">Sakura Petals</option><option value="museum-cloth">Museum Cloth</option><option value="gallery-wind">Gallery Wind</option><option value="fashion-drapery">Fashion Drapery</option><option value="product-reveal">Product Reveal</option>',
    1
)

# Real local CC0 templates alongside existing generated templates.
s = s.replace(
    '<option value="museum-plinth">Museum Plinth</option>',
    '<option value="museum-plinth">Museum Plinth</option><option value="cc0-corset">CC0 · Fashion Mannequin / Corset</option><option value="cc0-lantern">CC0 · Museum Lantern</option><option value="cc0-boombox">CC0 · BoomBox / Product</option>',
    1
)
s = s.replace(
    '<div class="hint">The applied object is also used to rebuild the cloth collider. GLB is the safest portable format.</div>',
    '<div class="hint">Templates CC0 are stored locally. The selected object also rebuilds the real cloth collider. GLB is the safest portable custom format.</div>',
    1
)

# Add cloth LOOK sliders after Position Y.
look_html = '''        <div class="sectionTitle" style="margin-top:10px">Look / grading</div>
        <label class="row">Opacity <span><input id="bsOpacity" type="range" min="0.05" max="1" value="1" step="0.01"><span class="value" id="bsOpacityV">1.00</span></span></label>
        <label class="row">Brightness <span><input id="bsBrightness" type="range" min="0.25" max="2" value="1" step="0.01"><span class="value" id="bsBrightnessV">1.00</span></span></label>
        <label class="row">Contrast <span><input id="bsContrast" type="range" min="0.25" max="2" value="1" step="0.01"><span class="value" id="bsContrastV">1.00</span></span></label>
        <label class="row">Saturation <span><input id="bsSaturation" type="range" min="0" max="2" value="1" step="0.01"><span class="value" id="bsSaturationV">1.00</span></span></label>
'''
anchor = '        <button id="bsResetMedia" type="button">Restore original fabric</button>'
if 'id="bsOpacity"' not in s:
    s = s.replace(anchor, look_html + anchor, 1)

# Add look state and wiring.
s = s.replace(
    '    const clothTransform = { scale: 1, x: 0, y: 0 };',
    '    const clothTransform = { scale: 1, x: 0, y: 0 };\n    const clothLook = { opacity: 1, brightness: 1, contrast: 1, saturation: 1 };',
    1
)
range_anchor = "    range('bsY','bsYV',clothTransform,'y',-1,1,t => app.setClothMediaTransform(t));\n"
look_wiring = """    range('bsOpacity','bsOpacityV',clothLook,'opacity',0.05,1,t => app.setClothLook(t));
    range('bsBrightness','bsBrightnessV',clothLook,'brightness',0.25,2,t => app.setClothLook(t));
    range('bsContrast','bsContrastV',clothLook,'contrast',0.25,2,t => app.setClothLook(t));
    range('bsSaturation','bsSaturationV',clothLook,'saturation',0,2,t => app.setClothLook(t));
"""
if "range('bsOpacity'" not in s:
    s = s.replace(range_anchor, range_anchor + look_wiring, 1)

# Ensure look is applied when START is pressed.
s = s.replace(
    '            app.setClothMediaTransform(clothTransform);\n            await app.applyClothFile(staged.cloth);',
    '            app.setClothMediaTransform(clothTransform);\n            app.setClothLook(clothLook);\n            await app.applyClothFile(staged.cloth);\n            app.setClothLook(clothLook);',
    1
)

# Experience presets: original three remain 1:1. New presets are additive.
old_scene_handler = re.search(r"    \$\('bsScene'\)\.value = conf\.sceneName;\n    \$\('bsScene'\)\.addEventListener\('change', async e => \{.*?\n    \}\);", s, re.S)
if not old_scene_handler:
    raise SystemExit('V4: Experience handler not found')
new_scene_handler = r'''    const experiencePresets = {
        'museum-cloth': { scene: 'cloth', rotate: false, stiffness: 0.30, friction: 0.30, object: 'venus', label: 'Museum Cloth' },
        'gallery-wind': { scene: 'cloth', rotate: true, stiffness: 0.18, friction: 0.18, object: 'torus-knot', label: 'Gallery Wind' },
        'fashion-drapery': { scene: 'cloth', rotate: true, stiffness: 0.16, friction: 0.14, object: 'cc0-corset', label: 'Fashion Drapery' },
        'product-reveal': { scene: 'cloth', rotate: true, stiffness: 0.27, friction: 0.32, object: 'cc0-boombox', label: 'Product Reveal' },
    };

    $('bsScene').value = conf.sceneName;
    $('bsScene').addEventListener('change', async e => {
        status('Starting Experience…', 'busy');
        try {
            const preset = experiencePresets[e.target.value];
            if (!preset) {
                await app.selectScene(e.target.value);
                status('Experience STARTED ✓', 'ok');
                return;
            }
            conf.rotateCamera = preset.rotate;
            conf.stiffness = preset.stiffness;
            conf.friction = preset.friction;
            $('bsRotate').checked = preset.rotate;
            $('bsStiff').value = preset.stiffness; $('bsStiffV').textContent = preset.stiffness.toFixed(2);
            $('bsFriction').value = preset.friction; $('bsFrictionV').textContent = preset.friction.toFixed(2);
            await app.selectScene(preset.scene);
            await app.applyObjectTemplate(preset.object);
            $('bsTemplate').value = preset.object;
            $('bsModelApplied').textContent = `Applied: ${$('bsTemplate').selectedOptions[0]?.textContent || preset.object} ✓`;
            status(`${preset.label} STARTED ✓`, 'ok');
        } catch (err) { status('Experience error: ' + err.message, 'err'); }
    });'''
s = s[:old_scene_handler.start()] + new_scene_handler + s[old_scene_handler.end():]

# Reset LOOK UI too.
s = s.replace(
    "            app.restoreOriginalBackground(); app.restoreOriginalFabric(); await app.restoreVenus(); await app.selectScene('cloth');",
    "            app.restoreOriginalBackground(); app.restoreOriginalFabric(); app.setClothLook({opacity:1,brightness:1,contrast:1,saturation:1}); await app.restoreVenus(); await app.selectScene('cloth');",
    1
)
s = s.replace(
    "            $('bsScene').value='cloth'; $('bsTemplate').value='venus';",
    "            $('bsScene').value='cloth'; $('bsTemplate').value='venus'; ['bsOpacity','bsBrightness','bsContrast','bsSaturation'].forEach(id=>$(id).value=1); ['bsOpacityV','bsBrightnessV','bsContrastV','bsSaturationV'].forEach(id=>$(id).textContent='1.00');",
    1
)
p.write_text(s, encoding='utf-8')

print('Breeze Studio PRO V4 applied: UX + cloth LOOK + CC0 object library + Experience presets')
