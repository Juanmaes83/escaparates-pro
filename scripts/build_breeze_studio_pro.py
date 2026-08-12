from pathlib import Path

root = Path('breeze-source')

# Add media-on-cloth capability to the derivative only.
p = root / 'src/clothGeometry.js'
s = p.read_text(encoding='utf-8')
needle = "    async createMaterial() {\n"
addition = r'''    cleanupMedia() {
        if (this.mediaObjectUrl) {
            URL.revokeObjectURL(this.mediaObjectUrl);
            this.mediaObjectUrl = null;
        }
        if (this.mediaVideo) {
            try { this.mediaVideo.pause(); } catch (_) {}
            this.mediaVideo.removeAttribute('src');
            this.mediaVideo.load();
            this.mediaVideo = null;
        }
    }

    applyMediaTransform(scale = 1, x = 0, y = 0) {
        this.mediaScale = Math.max(0.5, Math.min(2.5, Number(scale) || 1));
        this.mediaX = Math.max(-1, Math.min(1, Number(x) || 0));
        this.mediaY = Math.max(-1, Math.min(1, Number(y) || 0));
        const map = this.material && this.material.map;
        if (!map || map === this.defaultMap) return;
        const repeat = (1 / 3) / this.mediaScale;
        map.wrapS = THREE.ClampToEdgeWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;
        map.repeat.set(repeat, repeat);
        map.offset.set((1 - repeat) * 0.5 + this.mediaX * 0.25, (1 - repeat) * 0.5 + this.mediaY * 0.25);
        map.needsUpdate = true;
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

    resetMedia() {
        this.cleanupMedia();
        if (!this.material || !this.defaultMap) return;
        this.material.map = this.defaultMap;
        this.material.needsUpdate = true;
    }

'''
if 'async setMediaFile(file' not in s:
    if needle not in s:
        raise SystemExit('clothGeometry insertion point not found')
    s = s.replace(needle, addition + needle, 1)
old = "        this.material = material;\n\n    }\n}"
new = "        this.material = material;\n        this.defaultMap = colorMap;\n        this.mediaScale = 1;\n        this.mediaX = 0;\n        this.mediaY = 0;\n\n    }\n}"
if 'this.defaultMap = colorMap;' not in s:
    if old not in s:
        raise SystemExit('clothGeometry material tail not found')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# Thin App API; original physics and scene logic remain in place.
p = root / 'src/app.js'
s = p.read_text(encoding='utf-8')
old = "        await clothGeometry.bake();\n        this.clothObject.add(clothGeometry.object);\n"
new = "        await clothGeometry.bake();\n        this.clothGeometry = clothGeometry;\n        this.clothObject.add(clothGeometry.object);\n        if (sceneName === \"cloth\" && this.mediaFile) {\n            await this.clothGeometry.setMediaFile(this.mediaFile, this.mediaTransform || {});\n        }\n"
if 'this.clothGeometry = clothGeometry;' not in s:
    if old not in s:
        raise SystemExit('app cloth geometry insertion point not found')
    s = s.replace(old, new, 1)
needle = "    resize(width, height) {\n"
addition = r'''    async setMediaFile(file) {
        this.mediaFile = file;
        this.mediaTransform = this.mediaTransform || { scale: 1, x: 0, y: 0 };
        if (this.sceneName !== "cloth" || !this.clothGeometry) {
            conf.sceneName = "cloth";
            await this.setupScene("cloth");
        }
        await this.clothGeometry.setMediaFile(file, this.mediaTransform);
    }

    setMediaTransform(transform = {}) {
        this.mediaTransform = {
            scale: transform.scale ?? this.mediaTransform?.scale ?? 1,
            x: transform.x ?? this.mediaTransform?.x ?? 0,
            y: transform.y ?? this.mediaTransform?.y ?? 0,
        };
        if (this.sceneName === "cloth" && this.clothGeometry) {
            this.clothGeometry.applyMediaTransform(this.mediaTransform.scale, this.mediaTransform.x, this.mediaTransform.y);
        }
    }

    resetMedia() {
        this.mediaFile = null;
        this.mediaTransform = { scale: 1, x: 0, y: 0 };
        if (this.clothGeometry) this.clothGeometry.resetMedia();
    }

'''
if 'async setMediaFile(file)' not in s:
    if needle not in s:
        raise SystemExit('app method insertion point not found')
    s = s.replace(needle, addition + needle, 1)
p.write_text(s, encoding='utf-8')

panel = r'''import { conf } from "./conf.js";

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v)));

export function mountStudioPanel({ app, renderer }) {
    const css = document.createElement('style');
    css.textContent = `
      .tp-dfwv{display:none!important}
      #breezeStudioPanel{position:fixed;top:18px;right:18px;width:286px;max-height:calc(100vh - 36px);overflow:auto;z-index:50;background:rgba(12,14,18,.88);backdrop-filter:blur(18px);color:#f4f4f2;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;font:12px/1.35 Inter,system-ui,sans-serif;box-shadow:0 18px 60px rgba(0,0,0,.35)}
      #breezeStudioPanel.clean{display:none}
      #breezeStudioPanel h1{font-size:14px;margin:0 0 3px;font-weight:700;letter-spacing:.02em}
      #breezeStudioPanel .sub{opacity:.58;font-size:10px;margin-bottom:12px}
      #breezeStudioPanel .section{border-top:1px solid rgba(255,255,255,.08);padding-top:10px;margin-top:10px}
      #breezeStudioPanel .sectionTitle{font-size:10px;text-transform:uppercase;letter-spacing:.12em;opacity:.6;margin-bottom:8px}
      #breezeStudioPanel label{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin:7px 0}
      #breezeStudioPanel input[type=range]{width:138px}
      #breezeStudioPanel select,#breezeStudioPanel button,#breezeStudioPanel .upload{background:#20242b;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:7px 9px;font:inherit}
      #breezeStudioPanel button,#breezeStudioPanel .upload{cursor:pointer}
      #breezeStudioPanel button:hover,#breezeStudioPanel .upload:hover{background:#292e37}
      #breezeStudioPanel .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      #breezeStudioPanel .upload{display:block;text-align:center;margin-bottom:7px}
      #breezeStudioPanel .upload input{display:none}
      #breezeStudioPanel .value{font-variant-numeric:tabular-nums;opacity:.72;min-width:38px;text-align:right}
      #breezeStudioPanel .hint{opacity:.5;font-size:10px;margin-top:6px}
    `;
    document.head.appendChild(css);

    const panel = document.createElement('aside');
    panel.id = 'breezeStudioPanel';
    panel.innerHTML = `
      <h1>Breeze Studio PRO</h1><div class="sub">Dynamic Fabric · additive authoring layer</div>
      <div class="section"><div class="sectionTitle">Scene</div>
        <label>Experience<select id="bsScene"><option value="cloth">Prairie Cloth</option><option value="autumn">Autumn Leaves</option><option value="sakura">Sakura Petals</option></select></label>
        <label>Auto rotate<input id="bsRotate" type="checkbox"></label>
        <label>Run simulation<input id="bsRun" type="checkbox" checked></label>
        <label>Wireframe<input id="bsWire" type="checkbox"></label>
      </div>
      <div class="section"><div class="sectionTitle">Media on cloth</div>
        <label class="upload">Upload image / video<input id="bsMedia" type="file" accept="image/*,video/*"></label>
        <label>Scale <span><input id="bsScale" type="range" min="0.5" max="2.5" value="1" step="0.01"><span class="value" id="bsScaleV">1.00</span></span></label>
        <label>Position X <span><input id="bsX" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsXV">0.00</span></span></label>
        <label>Position Y <span><input id="bsY" type="range" min="-1" max="1" value="0" step="0.01"><span class="value" id="bsYV">0.00</span></span></label>
        <button id="bsResetMedia" type="button">Restore original fabric</button>
        <div class="hint">Image/video is mapped onto the simulated fabric. Physics, collision and WebGPU rendering remain intact.</div>
      </div>
      <div class="section"><div class="sectionTitle">Physics</div>
        <label>Stiffness <span><input id="bsStiff" type="range" min="0.1" max="0.5" value="0.25" step="0.01"><span class="value" id="bsStiffV">0.25</span></span></label>
        <label>Friction <span><input id="bsFriction" type="range" min="0" max="1" value="0.5" step="0.01"><span class="value" id="bsFrictionV">0.50</span></span></label>
      </div>
      <div class="section"><div class="sectionTitle">Output</div><div class="grid">
        <button id="bsPng" type="button">PNG</button><button id="bsRecord" type="button">Record WebM</button>
        <button id="bsClean" type="button">Preview Clean</button><button id="bsReset" type="button">Reset</button>
      </div><div class="hint">Press P to show/hide the panel.</div></div>`;
    document.body.appendChild(panel);

    const $ = id => panel.querySelector('#' + id);
    const mediaState = { scale: 1, x: 0, y: 0 };
    const syncMedia = () => app.setMediaTransform(mediaState);
    const setMediaRange = (id, out, key, min, max) => {
        $(id).addEventListener('input', e => {
            mediaState[key] = clamp(e.target.value, min, max);
            $(out).textContent = mediaState[key].toFixed(2);
            syncMedia();
        });
    };
    setMediaRange('bsScale','bsScaleV','scale',0.5,2.5);
    setMediaRange('bsX','bsXV','x',-1,1);
    setMediaRange('bsY','bsYV','y',-1,1);

    $('bsScene').value = conf.sceneName;
    $('bsScene').addEventListener('change', e => conf.sceneName = e.target.value);
    $('bsRotate').checked = conf.rotateCamera;
    $('bsRotate').addEventListener('change', e => conf.rotateCamera = e.target.checked);
    $('bsRun').checked = conf.runSimulation;
    $('bsRun').addEventListener('change', e => conf.runSimulation = e.target.checked);
    $('bsWire').checked = conf.wireframe;
    $('bsWire').addEventListener('change', e => conf.wireframe = e.target.checked);

    const physicsRange = (id, out, key, min, max) => {
        $(id).value = conf[key]; $(out).textContent = Number(conf[key]).toFixed(2);
        $(id).addEventListener('input', e => { conf[key] = clamp(e.target.value,min,max); $(out).textContent = conf[key].toFixed(2); });
    };
    physicsRange('bsStiff','bsStiffV','stiffness',0.1,0.5);
    physicsRange('bsFriction','bsFrictionV','friction',0,1);

    $('bsMedia').addEventListener('change', async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        $('bsScene').value = 'cloth'; conf.sceneName = 'cloth';
        await app.setMediaFile(file); syncMedia();
    });
    $('bsResetMedia').addEventListener('click', () => app.resetMedia());

    const download = (href, name) => { const a=document.createElement('a'); a.href=href; a.download=name; a.click(); };
    $('bsPng').addEventListener('click', () => download(renderer.domElement.toDataURL('image/png'), 'breeze-studio-pro.png'));

    let recorder = null, chunks = [];
    $('bsRecord').addEventListener('click', () => {
        if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
        const stream = renderer.domElement.captureStream(60); chunks = [];
        recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
        recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = () => { download(URL.createObjectURL(new Blob(chunks,{type:'video/webm'})), 'breeze-studio-pro.webm'); $('bsRecord').textContent='Record WebM'; };
        recorder.start(); $('bsRecord').textContent='Stop & Download';
    });

    const togglePanel = () => panel.classList.toggle('clean');
    $('bsClean').addEventListener('click', togglePanel);
    window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'p') togglePanel(); });
    $('bsReset').addEventListener('click', () => {
        conf.sceneName='cloth'; conf.rotateCamera=false; conf.runSimulation=true; conf.wireframe=false; conf.stiffness=.25; conf.friction=.25;
        mediaState.scale=1; mediaState.x=0; mediaState.y=0;
        [['bsScale',1],['bsX',0],['bsY',0]].forEach(([id,v])=>$(id).value=v);
        [['bsScaleV',1],['bsXV',0],['bsYV',0]].forEach(([id,v])=>$(id).textContent=Number(v).toFixed(2));
        app.resetMedia();
    });
}
'''
(root / 'src/studioPanel.js').write_text(panel, encoding='utf-8')

p = root / 'index.js'
s = p.read_text(encoding='utf-8')
if 'mountStudioPanel' not in s:
    s = s.replace('import App from "./src/app";', 'import App from "./src/app";\nimport { mountStudioPanel } from "./src/studioPanel.js";', 1)
    s = s.replace('    await app.init(updateLoadingProgressBar);', '    await app.init(updateLoadingProgressBar);\n    window.__BREEZE_STUDIO_APP__ = app;\n    mountStudioPanel({ app, renderer });', 1)
p.write_text(s, encoding='utf-8')

p = root / 'index.html'
s = p.read_text(encoding='utf-8')
s = s.replace('<title>Breeze - ThreeJS WebGPU Experiment - holtsetio.com</title>', '<title>Breeze Studio PRO — Escaparates Pro</title>')
s = s.replace('  <script defer src="https://s.holtsetio.com/script.js" data-website-id="cb36fa92-2381-4031-8f81-f430a473156d"></script>\n', '')
p.write_text(s, encoding='utf-8')
