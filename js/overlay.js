EP.Overlay = (function() {
    var enabled = false;
    var logoImg = null;
    var overlayDiv = null;

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

        var fields = ['overlay-headline', 'overlay-cta', 'overlay-color', 'overlay-fontsize', 'overlay-logo-pos'];
        fields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', refresh);
            if (el) el.addEventListener('change', refresh);
        });

        document.getElementById('logo-file-input').addEventListener('change', function(e) {
            if (!e.target.files.length) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                logoImg = new Image();
                logoImg.onload = function() {
                    document.getElementById('upload-logo-btn').textContent = 'Logo cargado';
                    refresh();
                };
                logoImg.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = '';
        });
    }

    function refresh() {
        if (!overlayDiv) return;
        if (!enabled) { overlayDiv.innerHTML = ''; return; }

        var headline = document.getElementById('overlay-headline').value;
        var cta = document.getElementById('overlay-cta').value;
        var color = document.getElementById('overlay-color').value;
        var fontSize = document.getElementById('overlay-fontsize').value;
        var logoPos = document.getElementById('overlay-logo-pos').value;

        var html = '';

        if (logoImg) {
            var posStyle = '';
            switch (logoPos) {
                case 'top-left': posStyle = 'top:16px;left:16px;'; break;
                case 'top-right': posStyle = 'top:16px;right:16px;'; break;
                case 'bottom-left': posStyle = 'bottom:16px;left:16px;'; break;
                case 'bottom-right': posStyle = 'bottom:16px;right:16px;'; break;
            }
            html += '<img src="' + logoImg.src + '" style="position:absolute;' + posStyle + 'max-width:120px;max-height:60px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));">';
        }

        if (headline) {
            html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-70%);text-align:center;width:80%;font-size:' + fontSize + 'px;font-weight:700;color:' + color + ';text-shadow:0 2px 12px rgba(0,0,0,0.7),0 0 40px rgba(0,0,0,0.4);font-family:Inter Tight,sans-serif;line-height:1.1;">' + escapeHTML(headline) + '</div>';
        }

        if (cta) {
            html += '<div style="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);text-align:center;"><div style="display:inline-block;padding:10px 28px;background:' + color + ';color:' + invertColor(color) + ';border-radius:8px;font-size:' + Math.max(14, fontSize * 0.5) + 'px;font-weight:600;font-family:Inter Tight,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.4);">' + escapeHTML(cta) + '</div></div>';
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
        var headline = document.getElementById('overlay-headline').value;
        var cta = document.getElementById('overlay-cta').value;
        var color = document.getElementById('overlay-color').value;
        var fontSize = parseInt(document.getElementById('overlay-fontsize').value);
        var logoPos = document.getElementById('overlay-logo-pos').value;
        var scale = w / 1920;

        ctx.save();

        if (logoImg) {
            var lw = Math.min(120 * scale * 2, logoImg.width);
            var lh = lw * (logoImg.height / logoImg.width);
            var lx = 16 * scale, ly = 16 * scale;
            if (logoPos === 'top-right') lx = w - lw - 16 * scale;
            if (logoPos === 'bottom-left') ly = h - lh - 16 * scale;
            if (logoPos === 'bottom-right') { lx = w - lw - 16 * scale; ly = h - lh - 16 * scale; }
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 8 * scale;
            ctx.drawImage(logoImg, lx, ly, lw, lh);
            ctx.shadowBlur = 0;
        }

        if (headline) {
            var fs = fontSize * scale * 1.5;
            ctx.font = '700 ' + fs + 'px "Inter Tight", sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 12 * scale;
            ctx.fillText(headline, w / 2, h * 0.38);
            ctx.shadowBlur = 0;
        }

        if (cta) {
            var cfs = Math.max(14, fontSize * 0.5) * scale * 1.5;
            ctx.font = '600 ' + cfs + 'px "Inter Tight", sans-serif';
            var tw = ctx.measureText(cta).width;
            var px = 28 * scale, py = 10 * scale;
            var bx = w / 2 - tw / 2 - px;
            var by = h * 0.85;
            ctx.fillStyle = color;
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 10 * scale;
            var rr = 8 * scale;
            ctx.beginPath();
            ctx.moveTo(bx + rr, by - py);
            ctx.lineTo(bx + tw + px * 2 - rr, by - py);
            ctx.quadraticCurveTo(bx + tw + px * 2, by - py, bx + tw + px * 2, by - py + rr);
            ctx.lineTo(bx + tw + px * 2, by + cfs + py - rr);
            ctx.quadraticCurveTo(bx + tw + px * 2, by + cfs + py, bx + tw + px * 2 - rr, by + cfs + py);
            ctx.lineTo(bx + rr, by + cfs + py);
            ctx.quadraticCurveTo(bx, by + cfs + py, bx, by + cfs + py - rr);
            ctx.lineTo(bx, by - py + rr);
            ctx.quadraticCurveTo(bx, by - py, bx + rr, by - py);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = invertColor(color);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(cta, w / 2, by);
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
