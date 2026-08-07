from pathlib import Path
import gzip
import hashlib
import re

root = Path('.')
module = root / 'labs/website-modules-source/sketchbook-pro-v3'
archive = module / 'source.v3.html.gz'
target = module / 'index.html'
expected = '837fac4414bbd8b7eb2dbdac8514a5d40429e30e76647b942f7a477da8ed3ee6'

raw = gzip.decompress(archive.read_bytes())
digest = hashlib.sha256(raw).hexdigest()
if digest != expected:
    raise SystemExit(f'Sketchbook V3 SHA-256 mismatch: {digest}')
target.write_bytes(raw)

# Website Modules UI: generic standalone copy + curated standalone loader list.
ui_path = root / 'js/website-modules-ui.js'
ui = ui_path.read_text(encoding='utf-8')

old_copy = "            standalone.innerHTML = '<div style=\"padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03);line-height:1.5\"><strong>Editor completo dentro del preview.</strong><br><span style=\"opacity:.72\">Portadas, contraportadas, 6 paginas por libro, logo, fondo, textos, video y entregables se editan en el panel propio de la pieza.</span></div>';"
new_copy = "            var standaloneCopy = mod.standaloneEditorNote || 'Editor completo dentro del preview. La personalizacion y los entregables se gestionan desde el panel propio de la pieza.';\n            standalone.innerHTML = '<div style=\"padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03);line-height:1.5\"><strong>Editor standalone integrado.</strong><br><span style=\"opacity:.72\">' + standaloneCopy + '</span></div>';"
if old_copy not in ui:
    raise SystemExit('No se encontro el copy standalone esperado en website-modules-ui.js')
ui = ui.replace(old_copy, new_copy, 1)

old_note = "noteEl.innerHTML = 'Modulo standalone curado. <strong>Fuente:</strong> ' + mod.sourceFile + '. <br><strong>Personalizacion:</strong> ' + (mod.mediaMap || 'editor propio dentro del iframe.') + '<br>Los botones HTML, ZIP y Embed del Lab delegan al pipeline de la V2.2.';"
new_note = "noteEl.innerHTML = 'Modulo standalone curado. <strong>Fuente:</strong> ' + mod.sourceFile + '. <br><strong>Personalizacion:</strong> ' + (mod.mediaMap || 'editor propio dentro del iframe.') + '<br>Los botones HTML, ZIP y Embed del Lab delegan al pipeline propio de la pieza.';"
if old_note not in ui:
    raise SystemExit('No se encontro la nota standalone esperada en website-modules-ui.js')
ui = ui.replace(old_note, new_note, 1)

pattern = re.compile(r"    function loadStandaloneModules\(done\) \{.*?\n    \}\n\n    function initReady", re.S)
replacement = """    function loadStandaloneModules(done) {
        var modules = [
            { id: '3d-book-collection-showcase-pro', src: 'js/website-modules-3d-book-collection-showcase-pro.js' },
            { id: 'sketchbook-pro-v3', src: 'js/website-modules-sketchbook-pro-v3.js' }
        ];
        var index = 0;

        function next() {
            if (index >= modules.length) {
                done();
                return;
            }
            var item = modules[index++];
            if (EP.WebsiteModules && EP.WebsiteModules.get(item.id)) {
                next();
                return;
            }
            var script = document.createElement('script');
            script.src = item.src;
            script.async = false;
            script.onload = next;
            script.onerror = function() {
                if (EP.UI && EP.UI.toast) EP.UI.toast('No se pudo registrar ' + item.id);
                next();
            };
            document.head.appendChild(script);
        }

        next();
    }

    function initReady"""
ui, count = pattern.subn(replacement, ui, count=1)
if count != 1:
    raise SystemExit('No se pudo generalizar loadStandaloneModules')
ui_path.write_text(ui, encoding='utf-8')

# Main README.
readme_path = root / 'README.md'
readme = readme_path.read_text(encoding='utf-8')
if 'La version actual incluye 26 modulos premium.' not in readme:
    raise SystemExit('No se encontro el conteo actual de Website Modules Lab')
readme = readme.replace('La version actual incluye 26 modulos premium.', 'La version actual incluye 27 modulos premium.', 1)

catalog_anchor = '- 3D Book Collection Showcase PRO.\n\nCada modulo se renderiza'
if catalog_anchor not in readme:
    raise SystemExit('No se encontro el final del catalogo Website Modules')
readme = readme.replace(catalog_anchor, '- 3D Book Collection Showcase PRO.\n- Sketchbook PRO V3.\n\nCada modulo se renderiza', 1)

book_para = '**3D Book Collection Showcase PRO** vive en `labs/website-modules-source/3d-book-collection-showcase-pro/` y usa como fuente canonica el `index.html` V2.2 aprobado. El Website Modules Lab lo abre como editor standalone aislado, sin reimplementar su motor Three.js. Incluye tres libros interactivos, portadas y contraportadas con imagen/video, seis paginas editoriales independientes por libro, giro e inercia 3D, navegacion Portada -> interior -> Contraportada, branding y fondo multimedia, persistencia IndexedDB, HTML final cerrado, ZIP cliente, embed, preview, PNG, PNG sequence, MP4/WebM y grabacion de revision cliente.\n\n'
sketch_para = '**Sketchbook PRO V3** vive en `labs/website-modules-source/sketchbook-pro-v3/` y conserva como fuente canonica el HTML V3 aprobado. El Lab lo abre como editor standalone aislado, sin reimplementar su motor de paso de pagina. Incluye nueve spreads con imagen/video, drag y gesto de lanzamiento, curvatura fisica de la hoja, lupa arrastrable, parallax, branding, paleta, titulos y contacto editables, persistencia robusta de media y entregables HTML final, ZIP cliente, embed, preview, PNG, PNG sequence, WebM y grabacion de revision cliente.\n\n'
if book_para not in readme:
    raise SystemExit('No se encontro el parrafo de 3D Book para insertar Sketchbook')
readme = readme.replace(book_para, book_para + sketch_para, 1)

approved_anchor = '- **3D Book Collection Showcase PRO** en Website Modules Lab: modulo standalone Three.js ubicado en `labs/website-modules-source/3d-book-collection-showcase-pro/`, con tres libros, portadas/contraportadas imagen-video, seis paginas editables por libro, interaccion 3D completa y pipeline propio de entregables cerrados.\n'
approved_sketch = '- **Sketchbook PRO V3** en Website Modules Lab: modulo standalone editorial ubicado en `labs/website-modules-source/sketchbook-pro-v3/`, con nueve spreads imagen-video, paso de pagina curvo, lupa, parallax, branding y pipeline propio de entregables cerrados.\n'
if approved_anchor not in readme:
    raise SystemExit('No se encontro el bloque de piezas aprobadas')
readme = readme.replace(approved_anchor, approved_anchor + approved_sketch, 1)
readme_path.write_text(readme, encoding='utf-8')

print('Sketchbook V3 bytes:', len(raw))
print('Sketchbook V3 SHA-256 OK:', digest)
