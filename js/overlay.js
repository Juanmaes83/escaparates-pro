EP.Overlay = (function() {
    var enabled = false;
    var logoImg = null;
    var overlayDiv = null;

    var posMap = {
        'top-left':      'top:8%;left:5%;',
        'top-center':    'top:8%;left:50%;transform:translateX(-50%);',
        'top-right':     'top:8%;right:5%;',
        'middle-left':   'top:50%;left:5%;transform:translateY(-50%);',
        'center':        'top:45%;left:50%;transform:translate(-50%,-50%);',
        'middle-right':  'top:50%;right:5%;transform:translateY(-50%);',
        'bottom-left':   'bottom:10%;left:5%;',
        'bottom-center': 'bottom:10%;left:50%;transform:translateX(-50%);',
        'bottom-right':  'bottom:10%;right:5%;'
    };

    var alignMap = {
        'top-left': 'left', 'top-center': 'center', 'top-right': 'right',
        'middle-left': 'left', 'center': 'center', 'middle-right': 'right',
        'bottom-left': 'left', 'bottom-center': 'center', 'bottom-right': 'right'
    };

    function animStyle(anim, delay) {
        delay = delay || 0;
        if (anim === 'fade') return 'animation:ep-fade-in 0.8s ease ' + delay + 's both;';
        if (anim === 'slide-up') return 'animation:ep-slide-up 0.8s ease ' + delay + 's both;';
        if (anim === 'slide-down') return 'animation:ep-slide-down 0.8s ease ' + delay + 's both;';
        return '';
    }

    function posStyle(pos) {
        return posMap[pos] || posMap['center'];
    }

    function init() {
        overlayDiv = document.createElement('div');
        overlayDiv.id = 'branding-overlay';
        overlayDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;display:none;';
        document.getElementById('canvas-container').appendChild(overlayDiv);

        var checkbox = document.getElementById('overlay-enabled');
        checkbox.addEventListener('change', function() {
            enabled = this.checked;
            document.getElementById('overlay-controls').style.display = enabled ? 'block' : 'none';
            overlayDiv.style.display = enabled ? 'block' : 'none';
            refresh();
        });

        // Custom font upload
        var uploadFontBtn = document.getElementById('upload-font-btn');
        var fontFileInput = document.getElementById('font-file-input');
        if (uploadFontBtn && fontFileInput) {
            uploadFontBtn.addEventListener('click', function() { fontFileInput.click(); });
            fontFileInput.addEventListener('change', function() {
                var file = this.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(e) {
                    var fontName = 'EP_Custom_' + file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
                    var face = new FontFace(fontName, e.target.result);
                    face.load().then(function(loadedFace) {
                        document.fonts.add(loadedFace);
                        // Add to font dropdown
                        var fontSel = document.getElementById('overlay-font');
                        if (fontSel) {
                            // Remove previous custom option if any
                            var prev = fontSel.querySelector('option[data-custom]');
                            if (prev) fontSel.removeChild(prev);
                            var opt = document.createElement('option');
                            opt.value = fontName + ',sans-serif';
                            opt.textContent = '✓ ' + file.name.replace(/\.[^.]+$/, '') + ' (custom)';
                            opt.setAttribute('data-custom', '1');
                            opt.selected = true;
                            fontSel.appendChild(opt);
                        }
                        var label = document.getElementById('font-loaded-label');
                        if (label) label.textContent = '✓ ' + file.name;
                        var row = document.getElementById('custom-font-name');
                        if (row) row.style.display = 'flex';
                        refresh();
                    }).catch(function() {
                        alert('No se pudo cargar la fuente. Verifica que el archivo sea válido (.ttf, .woff, .woff2).');
                    });
                };
                reader.readAsArrayBuffer(file);
            });
        }

        // Text Layer Depth control
        var depthSel = document.getElementById('overlay-depth');
        var opacitySlider = document.getElementById('overlay-text-opacity');
        var opacityVal = document.getElementById('overlay-text-opacity-val');
        if (depthSel) {
            depthSel.addEventListener('change', function() { applyDepth(); });
        }
        if (opacitySlider) {
            opacitySlider.addEventListener('input', function() {
                if (opacityVal) opacityVal.textContent = opacitySlider.value + '%';
                applyDepth();
            });
        }
        function applyDepth() {
            if (!overlayDiv) return;
            var depth = depthSel ? depthSel.value : 'front';
            var opacity = opacitySlider ? opacitySlider.value / 100 : 1;
            if (depth === 'front') {
                overlayDiv.style.zIndex = '10';
                overlayDiv.style.opacity = opacity;
                overlayDiv.style.mixBlendMode = 'normal';
            } else if (depth === 'middle') {
                overlayDiv.style.zIndex = '5';
                overlayDiv.style.opacity = opacity * 0.85;
                overlayDiv.style.mixBlendMode = 'screen';
            } else if (depth === 'back') {
                overlayDiv.style.zIndex = '2';
                overlayDiv.style.opacity = opacity * 0.6;
                overlayDiv.style.mixBlendMode = 'multiply';
            }
        }

        var fields = [
            'overlay-headline', 'overlay-subtitle', 'overlay-cta',
            'overlay-color', 'overlay-subtitle-color', 'overlay-cta-color',
            'overlay-fontsize', 'overlay-subtitlesize',
            'overlay-logo-pos', 'overlay-logo-size',
            'overlay-font', 'overlay-anim'
        ];
        fields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function() {
                if (id === 'overlay-fontsize') {
                    var v = document.getElementById('overlay-fontsize-val');
                    if (v) v.textContent = el.value + 'px';
                }
                if (id === 'overlay-subtitlesize') {
                    var v = document.getElementById('overlay-subtitlesize-val');
                    if (v) v.textContent = el.value + 'px';
                }
                if (id === 'overlay-logo-size') {
                    var v = document.getElementById('overlay-logo-size-val');
                    if (v) v.textContent = el.value + 'px';
                }
                refresh();
            });
            el.addEventListener('change', refresh);
        });

        // Position grids
        document.querySelectorAll('.pos-grid').forEach(function(grid) {
            var targetId = grid.dataset.target;
            grid.querySelectorAll('.pgb').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    grid.querySelectorAll('.pgb').forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var hidden = document.getElementById(targetId);
                    if (hidden) hidden.value = btn.dataset.pos;
                    refresh();
                });
            });
        });

        document.getElementById('upload-logo-btn').addEventListener('click', function() {
            if (EP.PlanGate && !EP.PlanGate.can('upload-logo')) {
                EP.UI.toast(EP.PlanGate.reason('upload-logo'));
                return;
            }
            document.getElementById('logo-file-input').click();
        });

        document.getElementById('logo-file-input').addEventListener('change', function(e) {
            if (!e.target.files.length) return;
            var file = e.target.files[0];
            if (EP.PlanGate && !EP.PlanGate.can('upload-logo')) {
                EP.UI.toast(EP.PlanGate.reason('upload-logo'));
                e.target.value = '';
                return;
            }
            var reader = new FileReader();
            reader.onload = function(ev) {
                logoImg = new Image();
                logoImg.onload = function() {
                    if (EP.PlanGate) {
                        var verdict = EP.PlanGate.validateFile(file, { width: logoImg.naturalWidth || logoImg.width, height: logoImg.naturalHeight || logoImg.height }, 'logo');
                        if (!verdict.ok) {
                            logoImg = null;
                            EP.UI.toast(verdict.errors[0]);
                            return;
                        }
                    }
                    document.getElementById('upload-logo-btn').textContent = 'Logo cargado';
                    refresh();
                };
                logoImg.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });
    }

    function getVal(id, fallback) {
        var el = document.getElementById(id);
        return el ? el.value : (fallback !== undefined ? fallback : '');
    }

    function refresh() {
        if (!overlayDiv) return;
        if (!enabled) { overlayDiv.innerHTML = ''; return; }

        var headline   = getVal('overlay-headline');
        var subtitle   = getVal('overlay-subtitle');
        var cta        = getVal('overlay-cta');
        var headColor  = getVal('overlay-color', '#ffffff');
        var subColor   = getVal('overlay-subtitle-color', '#cccccc');
        var ctaColor   = getVal('overlay-cta-color', '#ffffff');
        var fontSize   = parseInt(getVal('overlay-fontsize', 28));
        var subSize    = parseInt(getVal('overlay-subtitlesize', 18));
        var logoPos    = getVal('overlay-logo-pos', 'bottom-right');
        var logoSize   = parseInt(getVal('overlay-logo-size', 120)) || 120;
        var fontFamily = getVal('overlay-font', "'Inter Tight',sans-serif");
        var anim       = getVal('overlay-anim', 'none');
        var headPos    = getVal('overlay-headline-pos', 'center');
        var subPos     = getVal('overlay-subtitle-pos', 'bottom-center');
        var ctaPos     = getVal('overlay-cta-pos', 'bottom-center');

        var html = '';

        if (logoImg) {
            var lps = '';
            switch (logoPos) {
                case 'top-left':    lps = 'top:16px;left:16px;'; break;
                case 'top-right':   lps = 'top:16px;right:16px;'; break;
                case 'bottom-left': lps = 'bottom:16px;left:16px;'; break;
                default:            lps = 'bottom:16px;right:16px;'; break;
            }
            var logoH = Math.round(logoSize * 0.5);
            html += '<img src="' + logoImg.src + '" style="position:absolute;' + lps + 'max-width:' + logoSize + 'px;max-height:' + logoH + 'px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));' + animStyle(anim, 0) + '">';
        }

        var shadow = 'text-shadow:0 2px 12px rgba(0,0,0,0.7),0 0 40px rgba(0,0,0,0.4);';
        var baseStyle = 'position:absolute;width:80%;font-family:' + fontFamily + ';' + shadow;

        if (headline) {
            var hAlign = alignMap[headPos] || 'center';
            html += '<div style="' + baseStyle + posStyle(headPos) + 'font-size:' + fontSize + 'px;font-weight:700;color:' + headColor + ';line-height:1.1;text-align:' + hAlign + ';' + animStyle(anim, 0) + '">' + escapeHTML(headline) + '</div>';
        }

        if (subtitle) {
            // Offset subtitle slightly if same position as headline to avoid overlap
            var sAlign = alignMap[subPos] || 'center';
            html += '<div style="' + baseStyle + posStyle(subPos) + 'font-size:' + subSize + 'px;font-weight:400;color:' + subColor + ';line-height:1.3;text-align:' + sAlign + ';' + animStyle(anim, 0.2) + '">' + escapeHTML(subtitle) + '</div>';
        }

        if (cta) {
            var cAlign = alignMap[ctaPos] || 'center';
            var ctaBg = ctaColor;
            var ctaText = invertColor(ctaColor);
            var ctaSize = Math.max(13, Math.round(fontSize * 0.5));
            var ctaWrap = cAlign === 'center' ? 'text-align:center;' : (cAlign === 'right' ? 'text-align:right;' : 'text-align:left;');
            html += '<div style="position:absolute;' + posStyle(ctaPos) + ctaWrap + animStyle(anim, 0.4) + '"><div style="display:inline-block;padding:9px 24px;background:' + ctaBg + ';color:' + ctaText + ';border-radius:8px;font-size:' + ctaSize + 'px;font-weight:600;font-family:' + fontFamily + ';box-shadow:0 4px 20px rgba(0,0,0,0.4);">' + escapeHTML(cta) + '</div></div>';
        }

        overlayDiv.innerHTML = html;
    }

    function escapeHTML(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s));
        return d.innerHTML;
    }

    function invertColor(hex) {
        hex = hex.replace('#', '');
        var r = parseInt(hex.substr(0, 2), 16);
        var g = parseInt(hex.substr(2, 2), 16);
        var b = parseInt(hex.substr(4, 2), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#111' : '#fff';
    }

    function drawOnCanvas(ctx, w, h) {
        if (!enabled) return;
        var headline  = getVal('overlay-headline');
        var subtitle  = getVal('overlay-subtitle');
        var cta       = getVal('overlay-cta');
        var headColor = getVal('overlay-color', '#ffffff');
        var subColor  = getVal('overlay-subtitle-color', '#cccccc');
        var ctaColor  = getVal('overlay-cta-color', '#ffffff');
        var fontSize  = parseInt(getVal('overlay-fontsize', 28));
        var subSize   = parseInt(getVal('overlay-subtitlesize', 18));
        var logoPos   = getVal('overlay-logo-pos', 'bottom-right');
        var headPos   = getVal('overlay-headline-pos', 'center');
        var subPos    = getVal('overlay-subtitle-pos', 'bottom-center');
        var ctaPos    = getVal('overlay-cta-pos', 'bottom-center');
        var scale = w / 1920;

        ctx.save();

        if (logoImg) {
            var logoSizeVal = parseInt(getVal('overlay-logo-size', 120)) || 120;
            var lw = Math.min(logoSizeVal * scale * 2, logoImg.width);
            var lh = lw * (logoImg.height / logoImg.width);
            var lx = 16 * scale, ly = 16 * scale;
            if (logoPos === 'top-right') lx = w - lw - 16 * scale;
            if (logoPos === 'bottom-left') ly = h - lh - 16 * scale;
            if (logoPos === 'bottom-right') { lx = w - lw - 16 * scale; ly = h - lh - 16 * scale; }
            ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8 * scale;
            ctx.drawImage(logoImg, lx, ly, lw, lh);
            ctx.shadowBlur = 0;
        }

        function resolveCanvasXY(pos) {
            var px = { x: w * 0.5, y: h * 0.45 };
            if (pos === 'top-left')      { px.x = w * 0.05; px.y = h * 0.10; }
            else if (pos === 'top-center')   { px.x = w * 0.5;  px.y = h * 0.10; }
            else if (pos === 'top-right')    { px.x = w * 0.95; px.y = h * 0.10; }
            else if (pos === 'middle-left')  { px.x = w * 0.05; px.y = h * 0.5;  }
            else if (pos === 'center')       { px.x = w * 0.5;  px.y = h * 0.45; }
            else if (pos === 'middle-right') { px.x = w * 0.95; px.y = h * 0.5;  }
            else if (pos === 'bottom-left')  { px.x = w * 0.05; px.y = h * 0.88; }
            else if (pos === 'bottom-center'){ px.x = w * 0.5;  px.y = h * 0.88; }
            else if (pos === 'bottom-right') { px.x = w * 0.95; px.y = h * 0.88; }
            var align = (pos.indexOf('left') !== -1) ? 'left' : (pos.indexOf('right') !== -1) ? 'right' : 'center';
            return { x: px.x, y: px.y, align: align };
        }

        ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12 * scale;

        if (headline) {
            var hp = resolveCanvasXY(headPos);
            var fs = fontSize * scale * 1.5;
            ctx.font = '700 ' + fs + 'px "Inter Tight", sans-serif';
            ctx.fillStyle = headColor;
            ctx.textAlign = hp.align;
            ctx.textBaseline = 'middle';
            ctx.fillText(headline, hp.x, hp.y);
        }

        if (subtitle) {
            var sp = resolveCanvasXY(subPos);
            var sf = subSize * scale * 1.5;
            ctx.font = '400 ' + sf + 'px "Inter Tight", sans-serif';
            ctx.fillStyle = subColor;
            ctx.textAlign = sp.align;
            ctx.textBaseline = 'middle';
            ctx.fillText(subtitle, sp.x, sp.y + sf * 1.4);
        }

        if (cta) {
            var cp = resolveCanvasXY(ctaPos);
            var cfs = Math.max(13, fontSize * 0.5) * scale * 1.5;
            ctx.font = '600 ' + cfs + 'px "Inter Tight", sans-serif';
            var tw = ctx.measureText(cta).width;
            var px = 28 * scale, py = 10 * scale;
            var align = cp.align;
            var bx = align === 'center' ? cp.x - tw / 2 - px : (align === 'right' ? cp.x - tw - px * 2 : cp.x);
            var by = cp.y - py;
            ctx.fillStyle = ctaColor;
            ctx.shadowBlur = 10 * scale;
            var rr = 8 * scale;
            ctx.beginPath();
            ctx.moveTo(bx + rr, by);
            ctx.lineTo(bx + tw + px * 2 - rr, by);
            ctx.quadraticCurveTo(bx + tw + px * 2, by, bx + tw + px * 2, by + rr);
            ctx.lineTo(bx + tw + px * 2, by + cfs + py * 2 - rr);
            ctx.quadraticCurveTo(bx + tw + px * 2, by + cfs + py * 2, bx + tw + px * 2 - rr, by + cfs + py * 2);
            ctx.lineTo(bx + rr, by + cfs + py * 2);
            ctx.quadraticCurveTo(bx, by + cfs + py * 2, bx, by + cfs + py * 2 - rr);
            ctx.lineTo(bx, by + rr);
            ctx.quadraticCurveTo(bx, by, bx + rr, by);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = invertColor(ctaColor);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(cta, bx + px + tw / 2, by + py);
        }

        ctx.restore();
    }

    function isEnabled() { return enabled; }
    function getLogoSrc() { return logoImg ? logoImg.src : null; }

    return {
        init: init,
        refresh: refresh,
        drawOnCanvas: drawOnCanvas,
        isEnabled: isEnabled,
        getLogoSrc: getLogoSrc
    };
})();
