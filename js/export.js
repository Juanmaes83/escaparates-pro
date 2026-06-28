EP.Export = (function() {
    var modal, closeBtn;

    function init() {
        modal = document.getElementById('export-modal');
        closeBtn = document.getElementById('close-export');
        document.getElementById('btn-export').addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', function(e) { if (e.target === modal) close(); });

        document.getElementById('exp-video').addEventListener('click', function() { showConfig('video'); });
        document.getElementById('exp-gif').addEventListener('click', function() { showConfig('gif'); });
        document.getElementById('exp-widget').addEventListener('click', function() { showConfig('widget'); });
    }

    function open() { modal.classList.add('open'); }
    function close() { modal.classList.remove('open'); }

    function showConfig(type) {
        var area = document.getElementById('export-config-area');
        area.innerHTML = '';
        var panel = document.createElement('div');
        panel.className = 'config-panel open';

        if (type === 'video') {
            panel.innerHTML = '<label>Duracion <span class="val-hint" id="vid-dur-val">8s</span></label>' +
                '<input type="range" id="vid-dur" min="3" max="30" value="8" step="1">' +
                '<label>Resolucion</label>' +
                '<select id="vid-res"><option value="480">480p</option><option value="720" selected>720p</option><option value="1080">1080p</option></select>' +
                '<label>Formato</label>' +
                '<select id="vid-fmt"><option value="webm">WebM</option><option value="mp4">MP4</option></select>' +
                '<button class="export-go" id="go-video">Exportar Video</button>' +
                '<div class="export-progress" id="prog-video"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>';

            area.appendChild(panel);
            document.getElementById('vid-dur').addEventListener('input', function() {
                document.getElementById('vid-dur-val').textContent = this.value + 's';
            });
            document.getElementById('go-video').addEventListener('click', exportVideo);
        } else if (type === 'gif') {
            panel.innerHTML = '<label>Duracion <span class="val-hint" id="gif-dur-val">4s</span></label>' +
                '<input type="range" id="gif-dur" min="2" max="10" value="4" step="0.5">' +
                '<label>Calidad</label>' +
                '<select id="gif-qual"><option value="high">Alta</option><option value="medium" selected>Media</option><option value="low">Baja</option></select>' +
                '<label>Tamano</label>' +
                '<select id="gif-size"><option value="240">240px</option><option value="360" selected>360px</option><option value="480">480px</option></select>' +
                '<button class="export-go" id="go-gif">Exportar GIF</button>' +
                '<div class="export-progress" id="prog-gif"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>';

            area.appendChild(panel);
            document.getElementById('gif-dur').addEventListener('input', function() {
                document.getElementById('gif-dur-val').textContent = this.value + 's';
            });
            document.getElementById('go-gif').addEventListener('click', exportGIF);
        } else if (type === 'widget') {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Genera un HTML limpio con solo el player — sin controles de edicion. Listo para incrustar en cualquier web.</p>' +
                '<button class="export-go" id="go-widget">Generar Widget HTML</button>';
            area.appendChild(panel);
            document.getElementById('go-widget').addEventListener('click', exportWidget);
        }
    }

    function exportVideo() {
        var btn = document.getElementById('go-video');
        var prog = document.getElementById('prog-video');
        btn.disabled = true;
        prog.classList.add('active');

        var canvas = EP.Core.renderer.domElement;
        var duration = parseInt(document.getElementById('vid-dur').value) * 1000;
        var mimeType = document.getElementById('vid-fmt').value === 'mp4' ? 'video/mp4' : 'video/webm';
        var ext = document.getElementById('vid-fmt').value === 'mp4' ? 'mp4' : 'webm';

        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

        var stream = canvas.captureStream(30);
        var recorder = new MediaRecorder(stream, { mimeType: mimeType });
        var chunks = [];

        recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = function() {
            var blob = new Blob(chunks, { type: mimeType });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'escaparate-pro.' + ext;
            a.click();
            URL.revokeObjectURL(url);
            btn.disabled = false;
            prog.classList.remove('active');
            EP.UI.toast('Video exportado correctamente');
        };

        recorder.start();
        var startTime = performance.now();
        var fill = prog.querySelector('.fill');
        var status = prog.querySelector('.status');

        function checkProgress() {
            var elapsed = performance.now() - startTime;
            var pct = Math.min(100, (elapsed / duration) * 100);
            fill.style.width = pct + '%';
            status.textContent = 'Grabando... ' + (elapsed / 1000).toFixed(1) + 's / ' + (duration / 1000) + 's';
            if (elapsed < duration) {
                requestAnimationFrame(checkProgress);
            } else {
                recorder.stop();
                status.textContent = 'Procesando...';
            }
        }
        checkProgress();
    }

    function exportGIF() {
        var btn = document.getElementById('go-gif');
        btn.disabled = true;
        EP.UI.toast('Capturando frames para GIF...');

        var canvas = EP.Core.renderer.domElement;
        var dur = parseFloat(document.getElementById('gif-dur').value);
        var size = parseInt(document.getElementById('gif-size').value);
        var fps = 12;
        var totalFrames = Math.round(dur * fps);
        var frames = [];
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = size;
        tmpCanvas.height = Math.round(size * canvas.height / canvas.width);
        var tmpCtx = tmpCanvas.getContext('2d');

        for (var i = 0; i < totalFrames; i++) {
            tmpCtx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
            frames.push(tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height));
        }

        EP.UI.toast('GIF de ' + totalFrames + ' frames generado (encoder placeholder)');
        btn.disabled = false;
    }

    function exportWidget() {
        var effect = EP.UI.getCurrentEffect();
        if (!effect) { EP.UI.toast('Selecciona un efecto primero'); return; }

        var html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Escaparate Pro Widget</title>\n<style>\n* { margin: 0; padding: 0; box-sizing: border-box; }\nhtml, body { width: 100%; height: 100%; overflow: hidden; background: ' + (effect.settings.background || '#101014') + '; }\ncanvas { display: block; width: 100%; height: 100%; }\n</style>\n</head>\n<body>\n<div id="canvas-container" style="width:100%;height:100%;"></div>\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js" crossorigin="anonymous"><\/script>\n<script>\n// Widget player - ' + effect.meta.name + '\n// Generated by Escaparates Pro\nconsole.log("Escaparate Pro Widget: ' + effect.meta.name + '");\n<\/script>\n</body>\n</html>';

        var blob = new Blob([html], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'escaparate-widget.html';
        a.click();
        URL.revokeObjectURL(url);
        EP.UI.toast('Widget HTML descargado');
        close();
    }

    return {
        init: init,
        open: open,
        close: close
    };
})();
