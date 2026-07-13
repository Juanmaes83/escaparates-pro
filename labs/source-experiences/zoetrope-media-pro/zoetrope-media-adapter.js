(function() {
    var requestToken = 0;
    var status = document.createElement('div');
    status.id = 'zoetrope-media-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Secuencia fuente: 12 frames';
    document.body.appendChild(status);

    var style = document.createElement('style');
    style.textContent = ':root{--frame-count:12;--effective-frame-width:calc((var(--zoetrope-radius) * 2 * 3.14159 / var(--frame-count)) * (1 - var(--gap-ratio)))}.zoetrope-frame{background-repeat:no-repeat;background-position:center!important;background-size:cover!important}.zoetrope-drum-inner{filter:drop-shadow(0 24px 38px rgba(0,0,0,.34))}#zoetrope-media-status{position:fixed;top:18px;left:18px;z-index:1100;padding:10px 13px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(17,13,10,.52);backdrop-filter:blur(12px);color:#fff;font:700 12px/1.1 system-ui,sans-serif;letter-spacing:.04em}.zoetrope-frame::after{content:"";position:absolute;inset:0;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 0 26px rgba(0,0,0,.22)}@media(max-width:720px){#zoetrope-media-status{top:10px;left:10px;font-size:10px}.resources-layer{display:none}}';
    document.head.appendChild(style);

    function videoAsset(asset) {
        return asset && asset.type && (asset.type === 'video' || asset.type.indexOf('video/') === 0);
    }

    function waitFor(video, event) {
        return new Promise(function(resolve, reject) {
            var timer = setTimeout(function() { reject(new Error('Video timeout')); }, 8000);
            video.addEventListener(event, function done() { clearTimeout(timer); resolve(); }, { once: true });
            video.addEventListener('error', function fail() { clearTimeout(timer); reject(new Error('Video error')); }, { once: true });
        });
    }

    async function framesFromVideo(asset, count) {
        var response = await fetch(asset.url);
        var blob = await response.blob();
        var video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = URL.createObjectURL(blob);
        await waitFor(video, 'loadedmetadata');
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 960;
        canvas.height = video.videoHeight || 540;
        var context = canvas.getContext('2d');
        var output = [];
        for (var index = 0; index < count; index++) {
            video.currentTime = (video.duration || 0) * (index / count);
            await waitFor(video, 'seeked');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            output.push(canvas.toDataURL('image/jpeg', .86));
        }
        URL.revokeObjectURL(video.src);
        return output;
    }

    function imageFrames(assets, count) {
        return Array.from({ length: count }, function(_, index) {
            return assets[index % assets.length].url;
        });
    }

    function buildDrum(frames) {
        var strip = document.querySelector('.zoetrope-strip');
        var slits = document.querySelector('.zoetrope-slits');
        if (!strip || !slits || !frames.length) return;
        var count = frames.length;
        document.documentElement.style.setProperty('--frame-count', count);
        strip.innerHTML = frames.map(function(url, index) {
            var angle = 360 - ((index + 1) * 360 / count);
            return '<div class="zoetrope-frame" style="--ry:' + angle + 'deg;background-image:url(&quot;' + String(url).replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '&quot;)"></div>';
        }).join('');
        slits.innerHTML = frames.map(function(_, index) {
            var angle = 360 - ((index + 1) * 360 / count);
            return '<div class="zoetrope-slit" style="--ry:' + angle + 'deg"></div>';
        }).join('');
    }

    async function apply(payload) {
        var token = ++requestToken;
        var config = payload.config || {};
        var count = Math.max(6, Math.min(24, Number(config.frameCount) || 12));
        var duration = Math.max(200, Math.min(2000, Number(config.spinDuration) || 600));
        var radius = Math.max(28, Math.min(54, Number(config.radius) || 50));
        document.documentElement.style.setProperty('--spin-duration', duration + 'ms');
        document.documentElement.style.setProperty('--zoetrope-radius', radius + 'vmin');
        document.querySelector('.zoetrope-drums').style.animationDirection = config.direction === 'reverse' ? 'reverse' : 'normal';
        var assets = (payload.assets || []).filter(function(asset) { return asset && asset.url; });
        if (!assets.length) {
            status.textContent = 'Secuencia demo: anade assets para personalizar';
            return;
        }
        try {
            status.textContent = 'Preparando secuencia propia...';
            var firstVideo = assets.filter(videoAsset)[0];
            var frames = firstVideo ? await framesFromVideo(firstVideo, count) : imageFrames(assets, count);
            if (token !== requestToken) return;
            buildDrum(frames);
            status.textContent = count + ' frames propios - ' + (firstVideo ? 'video convertido localmente' : assets.length + ' assets distribuidos');
        } catch (error) {
            if (token !== requestToken) return;
            buildDrum(imageFrames(assets, count));
            status.textContent = count + ' frames de assets · video no disponible';
        }
    }

    window.EPZoetropeMedia = { apply: apply };
})();
