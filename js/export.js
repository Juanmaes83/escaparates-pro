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
        document.getElementById('exp-js').addEventListener('click', function() { showConfig('script'); });
        document.getElementById('exp-publish').addEventListener('click', function() { showConfig('publish'); });
        document.getElementById('exp-copy').addEventListener('click', function() { showConfig('copy'); });
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
                '<label>Resolucion final</label>' +
                '<select id="vid-res"><option value="preset" selected>Preset exacto actual</option><option value="preview">Tamano de preview</option></select>' +
                '<label>FPS</label>' +
                '<select id="vid-fps"><option value="15">15 FPS</option><option value="24">24 FPS</option><option value="30" selected>30 FPS</option><option value="60">60 FPS</option></select>' +
                '<label>Formato</label>' +
                '<select id="vid-fmt"><option value="webm">WebM</option><option value="mp4">MP4</option></select>' +
                '<div class="export-preflight" id="video-preflight"></div>' +
                '<button class="export-go" id="go-video">Exportar Video</button>' +
                '<div class="export-progress" id="prog-video"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>';

            area.appendChild(panel);
            document.getElementById('vid-dur').addEventListener('input', function() {
                document.getElementById('vid-dur-val').textContent = this.value + 's';
                updateVideoPreflight();
            });
            document.getElementById('vid-fmt').addEventListener('change', updateVideoPreflight);
            document.getElementById('vid-fps').addEventListener('change', updateVideoPreflight);
            document.getElementById('vid-res').addEventListener('change', updateVideoPreflight);
            document.getElementById('go-video').addEventListener('click', exportVideo);
            updateVideoPreflight();
        } else if (type === 'gif') {
            panel.innerHTML = '<label>Duracion <span class="val-hint" id="gif-dur-val">4s</span></label>' +
                '<input type="range" id="gif-dur" min="2" max="10" value="4" step="0.5">' +
                '<label>Calidad</label>' +
                '<select id="gif-qual"><option value="10">Alta</option><option value="20" selected>Media</option><option value="30">Baja</option></select>' +
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
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Genera un HTML autonomo con el efecto activo, la animacion y las imagenes embebidas. Sin controles de edicion.</p>' +
                buildStandaloneModeControls() +
                '<button class="export-go" id="go-widget">Generar Widget HTML</button>' +
                '<div class="export-progress" id="prog-widget"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>';
            area.appendChild(panel);
            document.getElementById('go-widget').addEventListener('click', exportWidget);
        } else if (type === 'script') {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Genera un archivo JS embebible. El script crea un iframe autonomo con el escaparate activo para pegarlo en webs de clientes.</p>' +
                buildStandaloneModeControls() +
                '<button class="export-go" id="go-script">Generar JS embebible</button>' +
                '<div class="export-progress" id="prog-script"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>';
            area.appendChild(panel);
            document.getElementById('go-script').addEventListener('click', exportScript);
        } else if (type === 'publish') {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Publica una URL local temporal con el viewer final cerrado. Sirve para revisar el resultado sin paneles antes de subirlo a hosting.</p>' +
                buildStandaloneModeControls() +
                '<button class="export-go" id="go-publish">Publicar resultado local</button>' +
                '<div class="export-progress" id="prog-publish"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>' +
                '<div id="publish-result" class="final-output-result"></div>';
            area.appendChild(panel);
            document.getElementById('go-publish').addEventListener('click', publishResult);
        } else if (type === 'copy') {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Genera un iframe final para copiar en una web. El embed contiene solo el resultado, nunca el editor.</p>' +
                buildStandaloneModeControls() +
                '<button class="export-go" id="go-copy">Generar embed final</button>' +
                '<div class="export-progress" id="prog-copy"><div class="bar"><div class="fill"></div></div><div class="status">Preparando...</div></div>' +
                '<textarea id="copy-embed-result" class="final-output-code" readonly placeholder="El embed final aparecera aqui..."></textarea>';
            area.appendChild(panel);
            document.getElementById('go-copy').addEventListener('click', copyEmbed);
        }
    }

    function buildStandaloneModeControls() {
        return '<label>Modo HTML final</label>' +
            '<select id="standalone-mode">' +
            '<option value="cdn" selected>Ligero - CDN versionado</option>' +
            '<option value="offline">Autocontenido - offline</option>' +
            '</select>' +
            '<label>Version CDN/tag</label>' +
            '<input type="text" id="cdn-version" value="local-preview" autocomplete="off">';
    }

    function getStandaloneMode() {
        var el = document.getElementById('standalone-mode');
        return el ? el.value : 'cdn';
    }

    function exportVideo() {
        var btn = document.getElementById('go-video');
        var prog = document.getElementById('prog-video');
        var preflight = buildExportPreflight('video');
        renderPreflight('video-preflight', preflight);
        if (!preflight.ok) {
            EP.UI.toast(preflight.errors[0] || 'Export bloqueado por preflight');
            return;
        }
        btn.disabled = true;
        prog.classList.add('active');

        var canvas = EP.Core.renderer.domElement;
        var duration = parseInt(document.getElementById('vid-dur').value) * 1000;
        var mimeType = preflight.mimeType;
        var ext = preflight.extension;
        var fps = preflight.fps;

        var exportCanvas = document.createElement('canvas');
        var videoSize = getVideoExportDimensions();
        exportCanvas.width = videoSize.width;
        exportCanvas.height = videoSize.height;
        var ectx = exportCanvas.getContext('2d');

        var stream = exportCanvas.captureStream(fps);
        var recorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: 5000000 });
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
            EP.UI.toast('Video exportado: ' + videoSize.width + 'x' + videoSize.height + ' @ ' + fps + ' FPS');
        };

        recorder.start();
        var startTime = performance.now();
        var fill = prog.querySelector('.fill');
        var status = prog.querySelector('.status');

        function captureFrame() {
            var elapsed = performance.now() - startTime;
            var pct = Math.min(100, (elapsed / duration) * 100);
            fill.style.width = pct + '%';
            status.textContent = 'Grabando... ' + (elapsed / 1000).toFixed(1) + 's / ' + (duration / 1000) + 's';

            renderStillIfRecordingDisabled();
            ectx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
            EP.Overlay.drawOnCanvas(ectx, exportCanvas.width, exportCanvas.height);

            if (elapsed < duration) {
                requestAnimationFrame(captureFrame);
            } else {
                recorder.stop();
                status.textContent = 'Procesando...';
            }
        }
        captureFrame();
    }

    // ── GIF Encoder (LZW + NeuQuant inline) ──

    function exportGIF() {
        var btn = document.getElementById('go-gif');
        var prog = document.getElementById('prog-gif');
        btn.disabled = true;
        prog.classList.add('active');
        var fill = prog.querySelector('.fill');
        var status = prog.querySelector('.status');
        status.textContent = 'Capturando frames...';
        fill.style.width = '0%';

        var canvas = EP.Core.renderer.domElement;
        var dur = parseFloat(document.getElementById('gif-dur').value);
        var size = parseInt(document.getElementById('gif-size').value);
        var sample = parseInt(document.getElementById('gif-qual').value);
        var fps = 12;
        var totalFrames = Math.round(dur * fps);
        var delay = Math.round(1000 / fps);
        var gifSize = getExportDimensions(size);
        var w = gifSize.width;
        var h = gifSize.height;

        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = w; tmpCanvas.height = h;
        var tmpCtx = tmpCanvas.getContext('2d');
        var frames = [];

        var effect = EP.UI.getCurrentEffect();
        var loopDur = EP.Timeline.loopDuration;

        for (var i = 0; i < totalFrames; i++) {
            var t = (i / totalFrames) * loopDur;
            if (effect) {
                var frame = resolveExportFrame(effect, t, 0, loopDur);
                effect.update(frame.time, frame.dt, frame.loopDuration || loopDur);
            }
            EP.Core.render();
            tmpCtx.drawImage(canvas, 0, 0, w, h);
            EP.Overlay.drawOnCanvas(tmpCtx, w, h);
            frames.push(tmpCtx.getImageData(0, 0, w, h));
            fill.style.width = ((i / totalFrames) * 50) + '%';
        }

        status.textContent = 'Codificando GIF...';

        setTimeout(function() {
            var bytes = encodeGIF(frames, w, h, delay, sample, function(pct) {
                fill.style.width = (50 + pct * 50) + '%';
            });

            var blob = new Blob([bytes], { type: 'image/gif' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'escaparate-pro.gif';
            a.click();
            URL.revokeObjectURL(url);

            btn.disabled = false;
            prog.classList.remove('active');
            EP.UI.toast('GIF exportado (' + totalFrames + ' frames, ' + (blob.size / 1024).toFixed(0) + ' KB)');

            EP.Timeline.play();
        }, 50);
    }

    function encodeGIF(frames, w, h, delay, sample, onProgress) {
        var buf = [];
        function writeByte(b) { buf.push(b & 0xFF); }
        function writeShort(s) { writeByte(s & 0xFF); writeByte((s >> 8) & 0xFF); }
        function writeStr(s) { for (var i = 0; i < s.length; i++) writeByte(s.charCodeAt(i)); }
        function writeBytes(a) { for (var i = 0; i < a.length; i++) buf.push(a[i] & 0xFF); }

        writeStr('GIF89a');
        writeShort(w);
        writeShort(h);
        writeByte(0x70);
        writeByte(0);
        writeByte(0);

        writeByte(0x21); writeByte(0xFF); writeByte(11);
        writeStr('NETSCAPE2.0');
        writeByte(3); writeByte(1); writeShort(0); writeByte(0);

        for (var f = 0; f < frames.length; f++) {
            var pixels = frames[f].data;
            var nq = new NeuQuant(pixels, pixels.length, sample);
            var palette = nq.process();
            var indexed = new Uint8Array(w * h);
            for (var i = 0; i < w * h; i++) {
                var off = i * 4;
                indexed[i] = nq.map(pixels[off], pixels[off + 1], pixels[off + 2]);
            }

            writeByte(0x21); writeByte(0xF9); writeByte(4);
            writeByte(0x00);
            writeShort(Math.round(delay / 10));
            writeByte(0); writeByte(0);

            writeByte(0x2C);
            writeShort(0); writeShort(0);
            writeShort(w); writeShort(h);
            writeByte(0x87);

            for (var p = 0; p < 256; p++) {
                if (p < palette.length / 3) {
                    writeByte(palette[p * 3]);
                    writeByte(palette[p * 3 + 1]);
                    writeByte(palette[p * 3 + 2]);
                } else {
                    writeByte(0); writeByte(0); writeByte(0);
                }
            }

            lzwEncode(indexed, 8, writeByte, writeBytes);

            if (onProgress) onProgress(f / frames.length);
        }

        writeByte(0x3B);
        return new Uint8Array(buf);
    }

    function lzwEncode(data, minCodeSize, writeByte, writeBytes) {
        var clearCode = 1 << minCodeSize;
        var eofCode = clearCode + 1;
        var codeSize = minCodeSize + 1;
        var nextCode = eofCode + 1;
        var table = {};
        var subBlock = [];
        var bits = 0, partial = 0;

        function emit(code) {
            partial |= (code << bits);
            bits += codeSize;
            while (bits >= 8) {
                subBlock.push(partial & 0xFF);
                partial >>= 8;
                bits -= 8;
                if (subBlock.length === 255) flushSubBlock();
            }
        }

        function flushSubBlock() {
            if (subBlock.length > 0) {
                writeByte(subBlock.length);
                writeBytes(subBlock);
                subBlock = [];
            }
        }

        function resetTable() {
            table = {};
            for (var i = 0; i < clearCode; i++) table[i] = i;
            nextCode = eofCode + 1;
            codeSize = minCodeSize + 1;
        }

        writeByte(minCodeSize);
        resetTable();
        emit(clearCode);

        var prev = data[0];
        for (var i = 1; i < data.length; i++) {
            var curr = data[i];
            var key = (prev << 12) | curr;
            if (table[key] !== undefined) {
                prev = table[key];
            } else {
                emit(prev);
                if (nextCode < 4096) {
                    table[key] = nextCode++;
                    if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
                } else {
                    emit(clearCode);
                    resetTable();
                }
                prev = curr;
            }
        }
        emit(prev);
        emit(eofCode);
        if (bits > 0) {
            subBlock.push(partial & 0xFF);
        }
        flushSubBlock();
        writeByte(0);
    }

    // ── NeuQuant Color Quantization ──

    function NeuQuant(pixels, len, samplefac) {
        var netsize = 256;
        var prime1 = 499, prime2 = 491, prime3 = 487, prime4 = 503;
        var maxnetpos = netsize - 1;
        var netbiasshift = 4;
        var ncycles = 100;
        var intbiasshift = 16;
        var intbias = (1 << intbiasshift);
        var gammashift = 10;
        var betashift = 10;
        var beta = (intbias >> betashift);
        var betagamma = (intbias << (gammashift - betashift));
        var initrad = (netsize >> 3) * (1 << 6);
        var radiusbiasshift = 6;
        var radiusbias = (1 << radiusbiasshift);
        var initradius = (initrad / radiusbias);
        var radiusdec = 30;
        var alphabiasshift = 10;
        var initalpha = (1 << alphabiasshift);
        var radbiasshift = 8;
        var radbias = (1 << radbiasshift);
        var alpharadbshift = (alphabiasshift + radbiasshift);
        var alpharadbias = (1 << alpharadbshift);

        var network, netindex, bias, freq, radpower;
        var thepicture = pixels, lengthcount = len, samplefactor = samplefac;

        function init() {
            network = []; netindex = new Int32Array(256);
            bias = new Int32Array(netsize); freq = new Int32Array(netsize);
            for (var i = 0; i < netsize; i++) {
                var v = (i << (netbiasshift + 8)) / netsize;
                network[i] = [v, v, v];
                freq[i] = intbias / netsize;
                bias[i] = 0;
            }
        }

        function unbiasnet() {
            for (var i = 0; i < netsize; i++) {
                network[i][0] >>= netbiasshift;
                network[i][1] >>= netbiasshift;
                network[i][2] >>= netbiasshift;
            }
        }

        function altersingle(alpha, i, b, g, r) {
            network[i][0] -= (alpha * (network[i][0] - b)) / initalpha;
            network[i][1] -= (alpha * (network[i][1] - g)) / initalpha;
            network[i][2] -= (alpha * (network[i][2] - r)) / initalpha;
        }

        function alterneigh(radius, i, b, g, r) {
            var lo = Math.max(i - radius, 0);
            var hi = Math.min(i + radius, netsize - 1);
            var j = i + 1, k = i - 1, m = 1;
            while (j <= hi || k >= lo) {
                var a = radpower[m++];
                if (j <= hi) {
                    network[j][0] -= (a * (network[j][0] - b)) / alpharadbias;
                    network[j][1] -= (a * (network[j][1] - g)) / alpharadbias;
                    network[j][2] -= (a * (network[j][2] - r)) / alpharadbias;
                    j++;
                }
                if (k >= lo) {
                    network[k][0] -= (a * (network[k][0] - b)) / alpharadbias;
                    network[k][1] -= (a * (network[k][1] - g)) / alpharadbias;
                    network[k][2] -= (a * (network[k][2] - r)) / alpharadbias;
                    k--;
                }
            }
        }

        function contest(b, g, r) {
            var bestd = ~(1 << 31), bestbiasd = bestd, bestpos = -1, bestbiaspos = bestpos;
            for (var i = 0; i < netsize; i++) {
                var n = network[i];
                var dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
                if (dist < bestd) { bestd = dist; bestpos = i; }
                var biasdist = dist - ((bias[i]) >> (intbiasshift - netbiasshift));
                if (biasdist < bestbiasd) { bestbiasd = biasdist; bestbiaspos = i; }
                var betafreq = (freq[i] >> betashift);
                freq[i] -= betafreq;
                bias[i] += (betafreq << gammashift);
            }
            freq[bestpos] += beta;
            bias[bestpos] -= betagamma;
            return bestbiaspos;
        }

        function learn() {
            var alphadec = 30 + ((samplefactor - 1) / 3);
            var samplepixels = lengthcount / (4 * samplefactor);
            var delta = Math.max(1, ~~(samplepixels / ncycles));
            var alpha = initalpha;
            var radius = initradius;
            var rad = radius >> radiusbiasshift;
            radpower = new Int32Array(rad);
            for (var i = 0; i < rad; i++) radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));

            var step;
            if (lengthcount < 4 * prime1) step = 4;
            else if (lengthcount % prime1 !== 0) step = 4 * prime1;
            else if (lengthcount % prime2 !== 0) step = 4 * prime2;
            else if (lengthcount % prime3 !== 0) step = 4 * prime3;
            else step = 4 * prime4;

            var pix = 0;
            for (var i = 0; i < samplepixels;) {
                var b = (thepicture[pix] & 0xFF) << netbiasshift;
                var g = (thepicture[pix + 1] & 0xFF) << netbiasshift;
                var r = (thepicture[pix + 2] & 0xFF) << netbiasshift;
                var j = contest(b, g, r);
                altersingle(alpha, j, b, g, r);
                if (rad !== 0) alterneigh(rad, j, b, g, r);
                pix += step;
                if (pix >= lengthcount) pix -= lengthcount;
                i++;
                if (delta === 0) delta = 1;
                if (i % delta === 0) {
                    alpha -= alpha / alphadec;
                    radius -= radius / radiusdec;
                    rad = radius >> radiusbiasshift;
                    if (rad <= 1) rad = 0;
                    radpower = new Int32Array(rad);
                    for (var k = 0; k < rad; k++) radpower[k] = alpha * (((rad * rad - k * k) * radbias) / (rad * rad));
                }
            }
        }

        function inxbuild() {
            var previouscol = 0, startpos = 0;
            for (var i = 0; i < netsize; i++) {
                var smallpos = i, smallval = network[i][1];
                for (var j = i + 1; j < netsize; j++) {
                    if (network[j][1] < smallval) { smallpos = j; smallval = network[j][1]; }
                }
                if (i !== smallpos) { var t = network[i]; network[i] = network[smallpos]; network[smallpos] = t; }
                if (smallval !== previouscol) {
                    netindex[previouscol] = (startpos + i) >> 1;
                    for (var j = previouscol + 1; j < smallval; j++) netindex[j] = i;
                    previouscol = smallval;
                    startpos = i;
                }
            }
            netindex[previouscol] = (startpos + maxnetpos) >> 1;
            for (var j = previouscol + 1; j < 256; j++) netindex[j] = maxnetpos;
        }

        this.process = function() {
            init(); learn(); unbiasnet(); inxbuild();
            var palette = [];
            for (var i = 0; i < netsize; i++) {
                palette.push(network[i][0]); palette.push(network[i][1]); palette.push(network[i][2]);
            }
            return palette;
        };

        this.map = function(r, g, b) {
            var bestd = 1000, best = -1;
            var i = netindex[g];
            var j = i - 1;
            while (i < netsize || j >= 0) {
                if (i < netsize) {
                    var n = network[i];
                    var dist = n[1] - g;
                    if (dist >= bestd) i = netsize;
                    else {
                        i++;
                        if (dist < 0) dist = -dist;
                        dist += Math.abs(n[0] - r);
                        if (dist < bestd) { dist += Math.abs(n[2] - b); if (dist < bestd) { bestd = dist; best = i - 1; } }
                    }
                }
                if (j >= 0) {
                    var n = network[j];
                    var dist = g - n[1];
                    if (dist >= bestd) j = -1;
                    else {
                        j--;
                        if (dist < 0) dist = -dist;
                        dist += Math.abs(n[0] - r);
                        if (dist < bestd) { dist += Math.abs(n[2] - b); if (dist < bestd) { bestd = dist; best = j + 1; } }
                    }
                }
            }
            return best;
        };
    }

    // ── Widget HTML Export ──

    function exportWidget() {
        exportStandalone('html');
    }

    function exportScript() {
        exportStandalone('script');
    }

    function updateVideoPreflight() {
        renderPreflight('video-preflight', buildExportPreflight('video'));
    }

    function buildExportPreflight(kind) {
        var effect = EP.UI.getCurrentEffect();
        var mediaList = EP.Media.getAll();
        var preset = getCurrentOutputPreset();
        var dims = kind === 'video' ? getVideoExportDimensions() : getPresetExportDimensions();
        var profile = EP.DeviceProfile ? EP.DeviceProfile.get() : { type: 'desktop', lowPower: false, webgl: true };
        var errors = [];
        var warnings = [];
        var format = kind === 'video' && document.getElementById('vid-fmt') ? document.getElementById('vid-fmt').value : 'html';
        var fps = kind === 'video' && document.getElementById('vid-fps') ? parseInt(document.getElementById('vid-fps').value, 10) : 30;
        var mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
        var extension = format === 'mp4' ? 'mp4' : 'webm';

        if (!effect) errors.push('Selecciona un efecto antes de exportar.');
        if (EP.PlanGate) {
            if (kind === 'publish' && !EP.PlanGate.can('publish')) errors.push(EP.PlanGate.reason('publish'));
            else if (!EP.PlanGate.can('export')) errors.push(EP.PlanGate.reason('export'));
        }
        if (!profile.webgl) errors.push('WebGL no esta disponible en este navegador.');
        if (effect && effect.capabilities && effect.capabilities.exportSafe === false) errors.push('Este efecto no esta marcado como export-safe.');
        if (effect && effect.capabilities && mediaList.length < (effect.capabilities.minMedia || 0)) {
            errors.push('Faltan medios: este efecto necesita al menos ' + effect.capabilities.minMedia + '.');
        }
        var hasMediaRecorder = typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function';
        if (!hasMediaRecorder && kind === 'video') errors.push('Este navegador no soporta MediaRecorder.');

        if (kind === 'video' && hasMediaRecorder) {
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                if (format === 'mp4') {
                    errors.push('MP4 no esta soportado por este navegador. Elige WebM; no se descargara un WebM con extension MP4.');
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    mimeType = 'video/webm;codecs=vp9';
                    extension = 'webm';
                    warnings.push('Usando WebM VP9 compatible.');
                } else if (MediaRecorder.isTypeSupported('video/webm')) {
                    mimeType = 'video/webm';
                    extension = 'webm';
                    warnings.push('Usando WebM basico compatible.');
                } else {
                    errors.push('No hay un formato de video compatible para MediaRecorder.');
                }
            }

            if (fps === 60 && (profile.type !== 'desktop' || profile.lowPower)) {
                fps = 30;
                warnings.push('60 FPS bajado a 30 FPS por perfil movil/baja potencia.');
            }

            var seconds = document.getElementById('vid-dur') ? parseInt(document.getElementById('vid-dur').value, 10) : 8;
            var rawMB = dims.width * dims.height * 4 * Math.max(1, fps) * Math.max(1, seconds) / (1024 * 1024);
            if (rawMB > 1800) warnings.push('Export pesado estimado: ' + Math.round(rawMB) + ' MB brutos de frames.');
            if (profile.type !== 'desktop' && dims.width * dims.height > 2073600) warnings.push('Export movil en alta resolucion: puede tardar o agotar memoria.');
        }

        return {
            ok: errors.length === 0,
            errors: errors,
            warnings: warnings,
            preset: preset,
            dimensions: dims,
            fps: fps,
            mimeType: mimeType,
            extension: extension,
            profile: profile
        };
    }

    function renderPreflight(id, result) {
        var el = document.getElementById(id);
        if (!el || !result) return;
        var rows = [];
        rows.push('Formato final: ' + result.dimensions.width + 'x' + result.dimensions.height);
        if (result.fps) rows.push('FPS: ' + result.fps);
        if (result.mimeType) rows.push('Codec: ' + result.mimeType);
        rows = rows.concat(result.warnings.map(function(w) { return 'Aviso: ' + w; }));
        rows = rows.concat(result.errors.map(function(e) { return 'Bloqueo: ' + e; }));
        el.className = 'export-preflight ' + (result.ok ? 'ok' : 'error');
        el.innerHTML = rows.map(function(row) { return '<div>' + escapeHTML(row) + '</div>'; }).join('');
    }

    function publishResult() {
        buildStandaloneForAction('publish');
    }

    function copyEmbed() {
        buildStandaloneForAction('copy');
    }

    function exportStandalone(kind) {
        var effect = EP.UI.getCurrentEffect();
        if (!effect) { EP.UI.toast('Selecciona un efecto primero'); return; }
        var preflight = buildExportPreflight(kind === 'script' ? 'script' : 'html');
        if (!preflight.ok) { EP.UI.toast(preflight.errors[0] || 'Export bloqueado por preflight'); return; }

        var prog = document.getElementById(kind === 'script' ? 'prog-script' : 'prog-widget');
        if (prog) {
            prog.classList.add('active');
            prog.querySelector('.status').textContent = kind === 'script' ? 'Preparando script real...' : 'Preparando widget real...';
        }

        var mediaList = EP.Media.getAll();
        var mediaItems = [];
        var pending = mediaList.length;

        if (pending === 0) {
            buildAndDownloadStandalone(effect, [], kind);
            return;
        }

        mediaList.forEach(function(m, i) {
            serializeMedia(m, function(item) {
                mediaItems[i] = item;
                pending--;
                if (prog) prog.querySelector('.status').textContent = 'Medios preparados: ' + (mediaList.length - pending) + '/' + mediaList.length;
                if (pending === 0) buildAndDownloadStandalone(effect, mediaItems.filter(Boolean), kind);
            });
        });
    }

    function buildStandaloneForAction(action) {
        var effect = EP.UI.getCurrentEffect();
        if (!effect) { EP.UI.toast('Selecciona un efecto primero'); return; }
        var preflight = buildExportPreflight(action === 'publish' ? 'publish' : 'copy');
        if (!preflight.ok) { EP.UI.toast(preflight.errors[0] || 'Salida bloqueada por preflight'); return; }

        var prog = document.getElementById(action === 'copy' ? 'prog-copy' : 'prog-publish');
        if (prog) {
            prog.classList.add('active');
            prog.querySelector('.fill').style.width = '0%';
            prog.querySelector('.status').textContent = 'Preparando viewer final...';
        }

        var mediaList = EP.Media.getAll();
        var mediaItems = [];
        var pending = mediaList.length;

        if (pending === 0) {
            finalizeStandaloneAction(effect, [], action);
            return;
        }

        mediaList.forEach(function(m, i) {
            serializeMedia(m, function(item) {
                mediaItems[i] = item;
                pending--;
                if (prog) {
                    prog.querySelector('.fill').style.width = (((mediaList.length - pending) / mediaList.length) * 80) + '%';
                    prog.querySelector('.status').textContent = 'Medios congelados: ' + (mediaList.length - pending) + '/' + mediaList.length;
                }
                if (pending === 0) finalizeStandaloneAction(effect, mediaItems.filter(Boolean), action);
            });
        });
    }

    function finalizeStandaloneAction(effect, mediaItems, action) {
        var prog = document.getElementById(action === 'copy' ? 'prog-copy' : 'prog-publish');
        buildStandaloneHTMLAsync(effect, mediaItems, getStandaloneMode(), function(html) {

            if (action === 'publish') {
                var blob = new Blob([html], { type: 'text/html' });
                var url = URL.createObjectURL(blob);
                var out = document.getElementById('publish-result');
                if (out) {
                    out.innerHTML = '<label>URL final local</label><input type="text" readonly value="' + escapeAttr(url) + '">' +
                        '<a class="export-link" href="' + escapeAttr(url) + '" target="_blank" rel="noopener">Abrir resultado publicado</a>';
                }
                EP.UI.toast('URL local final generada');
            } else if (action === 'copy') {
                var embed = buildIframeEmbed(html);
                var textarea = document.getElementById('copy-embed-result');
                if (textarea) {
                    textarea.value = embed;
                    textarea.focus();
                    textarea.select();
                }
                tryCopyText(embed);
                EP.UI.toast('Embed final generado');
            }

            if (prog) {
                prog.querySelector('.fill').style.width = '100%';
                prog.querySelector('.status').textContent = 'Resultado final listo';
                setTimeout(function() { prog.classList.remove('active'); }, 800);
            }
        });
    }

    function serializeMedia(media, done) {
        if (!media || !media.element) {
            done(null);
            return;
        }
        if (media.type === 'video') {
            if (media.url && media.url.indexOf('data:') === 0) {
                done({ type: 'video', src: media.url, name: media.name || 'video' });
                return;
            }
            fetch(media.url).then(function(response) {
                return response.blob();
            }).then(function(blob) {
                readBlobAsDataURL(blob, function(src) {
                    done({ type: 'video', src: src || media.url || '', name: media.name || 'video' });
                });
            }).catch(function() {
                done({ type: 'video', src: media.url || '', name: media.name || 'video' });
            });
            return;
        }

        var canvas = document.createElement('canvas');
        var img = media.element;
        var srcW = img.naturalWidth || img.videoWidth || img.width || 600;
        var srcH = img.naturalHeight || img.videoHeight || img.height || 600;
        var maxSide = 1200;
        var scale = Math.min(1, maxSide / Math.max(srcW, srcH));
        canvas.width = Math.max(1, Math.round(srcW * scale));
        canvas.height = Math.max(1, Math.round(srcH * scale));
        var ctx = canvas.getContext('2d');
        try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            done({ type: 'image', src: canvas.toDataURL('image/jpeg', 0.86), name: media.name || 'image' });
        } catch(e) {
            done({ type: 'image', src: media.url || img.src || '', name: media.name || 'image' });
        }
    }

    function readBlobAsDataURL(blob, done) {
        var reader = new FileReader();
        reader.onload = function(e) { done(e.target.result); };
        reader.onerror = function() { done(''); };
        reader.readAsDataURL(blob);
    }

    function buildAndDownloadStandalone(effect, mediaItems, kind) {
        buildStandaloneHTMLAsync(effect, mediaItems, getStandaloneMode(), function(html) {
            var content = html;
            var filename = 'escaparate-widget.html';
            var type = 'text/html';

            if (kind === 'script') {
                content = buildEmbeddableScript(html);
                filename = 'escaparate-widget.js';
                type = 'text/javascript';
            }

            var blob = new Blob([content], { type: type });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            var prog = document.getElementById(kind === 'script' ? 'prog-script' : 'prog-widget');
            if (prog) prog.classList.remove('active');
            EP.UI.toast(kind === 'script' ? 'Script JS descargado' : 'Widget HTML descargado');
            close();
        });
    }

    function buildStandaloneHTMLAsync(effect, mediaItems, mode, done) {
        var outputPreset = getCurrentOutputPreset();
        var settings = JSON.stringify(effect.settings);
        var bg = effect.settings.background || '#101014';
        var effectId = effect.id;
        var sourcePath = resolveEffectSourcePath(effect);
        var repoBase = getVersionedRepoBase();

        var overlayHTML = '';
        if (EP.Overlay.isEnabled()) {
            var hl = document.getElementById('overlay-headline').value;
            var cta = document.getElementById('overlay-cta').value;
            var color = document.getElementById('overlay-color').value;
            var fontSize = document.getElementById('overlay-fontsize').value;
            var logoPos = document.getElementById('overlay-logo-pos').value;
            var logoSrc = EP.Overlay.getLogoSrc();

            if (logoSrc) {
                var posMap = { 'top-left': 'top:16px;left:16px;', 'top-right': 'top:16px;right:16px;', 'bottom-left': 'bottom:16px;left:16px;', 'bottom-right': 'bottom:16px;right:16px;' };
                overlayHTML += '<img src="' + logoSrc + '" style="position:absolute;' + (posMap[logoPos] || '') + 'max-width:120px;max-height:60px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));">';
            }
            if (hl) overlayHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-70%);text-align:center;width:80%;font-size:' + fontSize + 'px;font-weight:700;color:' + color + ';text-shadow:0 2px 12px rgba(0,0,0,0.7);font-family:sans-serif;line-height:1.1;">' + escapeHTML(hl) + '</div>';
            if (cta) overlayHTML += '<div style="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);"><div style="display:inline-block;padding:10px 28px;background:' + color + ';color:#fff;border-radius:8px;font-size:' + Math.max(14, fontSize * 0.5) + 'px;font-weight:600;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.4);">' + escapeHTML(cta) + '</div></div>';
        }

        buildViewerScriptsHTML(sourcePath, mode, repoBase, function(scriptsHTML, scriptMode) {
            var metadata = {
                generatedAt: new Date().toISOString(),
                mode: scriptMode,
                effectId: effectId,
                effectName: effect.meta && effect.meta.name,
                sourcePath: sourcePath,
                outputPreset: outputPreset,
                versionBase: repoBase,
                settings: effect.settings
            };
            var mediaArrayJS = 'var MEDIA_ITEMS = ' + JSON.stringify(mediaItems) + ';\n';
            var html = '<!DOCTYPE html>\n<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Escaparate</title>\n' +
                (scriptMode === 'cdn' ? '<base href="' + repoBase + '">\n' : '') +
                '<meta name="escaparates-export" content="' + escapeAttr(JSON.stringify({ mode: scriptMode, effectId: effectId, generatedAt: metadata.generatedAt })) + '">\n' +
                '<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:' + bg + '}#canvas-container{position:absolute;top:0;left:0;width:100%;height:100%}#overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10}.export-error{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:#101014;font:14px system-ui,sans-serif;padding:24px;text-align:center}</style></head>\n' +
                '<body data-escaparates-viewer="final"><div id="canvas-container"></div><div id="overlay">' + overlayHTML + '</div>\n' +
                scriptsHTML +
                '<script>\n' +
                'var ESCAPARATES_EXPORT = ' + JSON.stringify(metadata) + ';\n' +
                mediaArrayJS +
                'var SETTINGS = ' + settings + ';\n' +
                'var EFFECT_ID = "' + effectId + '";\n' +
                'var LOOP_DURATION = ' + JSON.stringify(EP.Timeline.loopDuration || 8) + ';\n' +
                'var OUTPUT_PRESET = ' + JSON.stringify(outputPreset) + ';\n' +
                buildWidgetPlayerCode(!!sourcePath) +
                '<\/script></body></html>';
            done(html);
        });
    }

    function resolveEffectSourcePath(effect) {
        var source = effect.sourcePath || '';
        if (!source) {
            var scripts = Array.from(document.querySelectorAll('script[src]'));
            var match = scripts.find(function(script) {
                return script.getAttribute('src').indexOf('/' + effect.id + '.js') !== -1 ||
                    script.getAttribute('src').indexOf(effect.id + '.js') !== -1;
            });
            if (match) source = match.getAttribute('src');
        }
        var clean = source.match(/js\/effects\/.*?\.js(?:\?.*)?$/);
        return clean ? clean[0].replace(/\?.*$/, '') : source;
    }

    function getVersionedRepoBase() {
        var input = document.getElementById('cdn-version');
        var version = (input && input.value || window.EP_EXPORT_CDN_VERSION || '').trim();
        if (!version) {
            version = 'local-preview';
        }
        return 'https://cdn.jsdelivr.net/gh/Juanmaes83/escaparates-pro@' + encodeURIComponent(version) + '/';
    }

    function getViewerScriptSources(sourcePath) {
        var libs = [
            'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/VignetteShader.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
            'js/device-profile.js',
            'js/core.js',
            'js/easing.js',
            'js/render-pipeline.js',
            'js/timeline.js',
            'js/media-manager.js',
            'js/effects/base.js',
            'js/control-schema.js',
            'js/effects/registry.js'
        ];
        if (sourcePath) libs.push(sourcePath);
        return libs;
    }

    function buildViewerScriptsHTML(sourcePath, mode, repoBase, done) {
        var sources = getViewerScriptSources(sourcePath);
        if (mode !== 'offline') {
            done(sources.map(function(src) {
                var finalSrc = /^https?:\/\//.test(src) ? src : src;
                return '<script src="' + escapeAttr(finalSrc) + '" crossorigin="anonymous"><\/script>\n';
            }).join(''), 'cdn');
            return;
        }

        var pending = sources.length;
        var scripts = new Array(sources.length);
        sources.forEach(function(src, i) {
            fetch(src, { cache: 'force-cache' }).then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function(text) {
                scripts[i] = '<script data-inlined-from="' + escapeAttr(src) + '">\n' + text.replace(/<\/script/gi, '<\\/script') + '\n<\/script>\n';
                finish();
            }).catch(function(err) {
                scripts[i] = '<script>document.body.insertAdjacentHTML("beforeend","<div class=\\"export-error\\">No se pudo incrustar script offline: ' + escapeJS(src) + '<br>' + escapeJS(err.message || err) + '</div>");<\/script>\n';
                finish();
            });
        });

        function finish() {
            pending--;
            if (pending === 0) done(scripts.join(''), 'offline');
        }
    }

    function buildEmbeddableScript(html) {
        return [
            '(function(){',
            '  var script = document.currentScript;',
            '  var frame = document.createElement("iframe");',
            '  frame.title = "Escaparate Pro";',
            '  frame.loading = "lazy";',
            '  frame.style.width = "100%";',
            '  frame.style.aspectRatio = ' + JSON.stringify(getCurrentOutputPreset().embedRatio) + ';',
            '  frame.style.border = "0";',
            '  frame.style.display = "block";',
            '  frame.style.overflow = "hidden";',
            '  frame.allow = "autoplay; fullscreen";',
            '  frame.srcdoc = ' + JSON.stringify(html) + ';',
            '  if (script && script.parentNode) script.parentNode.insertBefore(frame, script);',
            '  else document.body.appendChild(frame);',
            '})();'
        ].join('\n');
    }

    function buildWidgetPlayerCode(hasEffectSource) {
        return [
            'function showError(message){',
            '  document.body.insertAdjacentHTML("beforeend", "<div class=\\"export-error\\">" + message + "</div>");',
            '}',
            'function loadMedia(item){',
            '  return new Promise(function(resolve){',
            '    if (!item || !item.src) { resolve(null); return; }',
            '    if (item.type === "video") {',
            '      var video = document.createElement("video");',
            '      video.src = item.src;',
            '      video.muted = true;',
            '      video.loop = true;',
            '      video.playsInline = true;',
            '      video.preload = "auto";',
            '      video.onloadeddata = function(){ video.play().catch(function(){}); resolve({ type: "video", element: video, url: item.src, name: item.name || "video" }); };',
            '      video.onerror = function(){ resolve(null); };',
            '      video.load();',
            '      return;',
            '    }',
            '    var img = new Image();',
            '    img.crossOrigin = "anonymous";',
            '    img.onload = function(){ resolve({ type: "image", element: img, url: item.src, name: item.name || "image" }); };',
            '    img.onerror = function(){ resolve(null); };',
            '    img.src = item.src;',
            '  });',
            '}',
            'if (!' + JSON.stringify(hasEffectSource) + ') showError("No se pudo resolver el archivo real del efecto para este export.");',
            'else Promise.all(MEDIA_ITEMS.map(loadMedia)).then(function(items){',
            '  var mediaList = items.filter(Boolean);',
            '  EP.Core.init();',
            '  if (OUTPUT_PRESET && OUTPUT_PRESET.ratio) EP.Core.setAspectRatio(OUTPUT_PRESET.ratio);',
            '  EP.Core.setBackground(SETTINGS.background || "' + (EP.Core.settings.backgroundColor || '#101014') + '");',
            '  var effect = EP.Registry.get(EFFECT_ID);',
            '  if (!effect) { showError("No se pudo cargar el efecto: " + EFFECT_ID); return; }',
            '  Object.keys(SETTINGS).forEach(function(key){ effect.setSetting(key, SETTINGS[key]); });',
            '  var group = effect.rebuild(mediaList);',
            '  EP.Core.setDisplayGroup(group);',
            '  var last = performance.now() / 1000;',
            '  function frame(nowMs){',
            '    var now = nowMs / 1000;',
            '    var dt = now - last;',
            '    last = now;',
            '    EP.RenderPipeline.renderFrame(effect, now, dt, LOOP_DURATION);',
            '    requestAnimationFrame(frame);',
            '  }',
            '  requestAnimationFrame(frame);',
            '});'
        ].join('\n');
    }

    function buildIframeEmbed(html) {
        return '<iframe title="Escaparate Pro" loading="lazy" style="width:100%;aspect-ratio:' + getCurrentOutputPreset().embedRatio.replace(/\s/g, '') + ';border:0;display:block;overflow:hidden;" allow="autoplay; fullscreen" srcdoc="' + escapeAttr(html) + '"></iframe>';
    }

    function getCurrentOutputPreset() {
        if (EP.OutputPresets && EP.OutputPresets.getCurrent) return EP.OutputPresets.getCurrent();
        return { id: 'web-hero-16-9', label: 'Hero 16:9', ratio: 16 / 9, embedRatio: '16 / 9', exportWidth: 1920, exportHeight: 1080, loop: false };
    }

    function getPresetExportDimensions() {
        var preset = getCurrentOutputPreset();
        return {
            width: Math.max(1, Math.round(preset.exportWidth || 1920)),
            height: Math.max(1, Math.round(preset.exportHeight || 1080))
        };
    }

    function getVideoExportDimensions() {
        var mode = document.getElementById('vid-res') ? document.getElementById('vid-res').value : 'preset';
        if (mode === 'preview' && EP.Core && EP.Core.renderer) {
            return {
                width: EP.Core.renderer.domElement.width,
                height: EP.Core.renderer.domElement.height
            };
        }
        return getPresetExportDimensions();
    }

    function getExportDimensions(shortSide) {
        var preset = getCurrentOutputPreset();
        if (!shortSide) return getPresetExportDimensions();
        var ratio = preset.ratio || 16 / 9;
        var width;
        var height;

        if (ratio >= 1) {
            height = shortSide;
            width = Math.round(shortSide * ratio);
        } else {
            width = shortSide;
            height = Math.round(shortSide / ratio);
        }

        return { width: width, height: height };
    }

    function renderStillIfRecordingDisabled() {
        var effect = EP.UI.getCurrentEffect();
        if (!effect || effect.settings.recordDefaultMotion !== 'off') return;
        var loopDuration = EP.Timeline.loopDuration || 8;
        EP.RenderPipeline.updateEffect(effect, loopDuration * 0.5, 0, loopDuration);
        EP.Core.render();
    }

    function resolveExportFrame(effect, time, dt, loopDuration) {
        if (effect.settings.recordDefaultMotion === 'off' || effect.settings.playbackMotion === 'off') {
            return { time: loopDuration * 0.5, dt: 0, loopDuration: loopDuration };
        }

        return EP.RenderPipeline.resolveFrame(effect, time, dt, loopDuration);
    }

    function tryCopyText(text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) return;
        navigator.clipboard.writeText(text).catch(function() {});
    }

    function escapeHTML(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s));
        return d.innerHTML;
    }

    function escapeAttr(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function escapeJS(s) {
        return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, ' ');
    }

    return {
        init: init,
        open: open,
        close: close
    };
})();
