(function() {
    var lab = document.documentElement.getAttribute('data-source-lab');
    var channel = 'escaparates-pro-source-lab';
    var current = {};

    function text(selector, value) {
        var node = document.querySelector(selector);
        if (node && value) node.textContent = value;
    }

    function setAccent(value) {
        if (value) document.documentElement.style.setProperty('--c-accent', value);
    }

    function assetUrls(payload) {
        return (payload.assets || []).map(function(asset) { return asset && asset.url; }).filter(Boolean);
    }

    function isVideoAsset(asset) {
        return !!(asset && asset.type && (asset.type === 'video' || asset.type.indexOf('video/') === 0));
    }

    async function fileFromAsset(asset) {
        if (!asset || !asset.url) return null;
        var response = await fetch(asset.url);
        var blob = await response.blob();
        if (isVideoAsset(asset)) {
            var video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.src = URL.createObjectURL(blob);
            await new Promise(function(resolve, reject) {
                video.onloadeddata = resolve;
                video.onerror = reject;
            });
            var canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            var frame = await new Promise(function(resolve) { canvas.toBlob(resolve, 'image/png'); });
            URL.revokeObjectURL(video.src);
            return new File([frame], 'video-frame.png', { type: 'image/png' });
        }
        return new File([blob], asset.name || 'escaparates-pro-source.png', { type: blob.type || 'image/png' });
    }

    async function loadIntoNativeUploader(asset) {
        var input = document.querySelector('input[type="file"]') ||
            ((window.__escaparatesSourceFileInputs || [])[0] || null);
        if (!input || !asset) return;
        try {
            var file = await fileFromAsset(asset);
            if (!file) return;
            var transfer = new DataTransfer();
            transfer.items.add(file);
            input.files = transfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (error) {
            window.parent.postMessage({ channel: channel, type: 'source-lab-status', lab: lab, status: 'native-upload-needed' }, '*');
        }
    }

    function applyAgency(payload) {
        var config = payload.config || {};
        var urls = assetUrls(payload);
        text('.topbar__brand', config.brand);
        text('.hero__title', config.headline);
        text('.hero__lede', config.subtitle);
        var cta = document.querySelector('.hero__cta');
        if (cta && config.cta) cta.textContent = config.cta;
        if (cta && config.url) cta.href = config.url;
        setAccent(config.accent);
        if (urls.length) {
            document.querySelectorAll('.mosaic img, #detail-related img').forEach(function(image, index) {
                image.src = urls[index % urls.length];
            });
        }
        var form = document.getElementById('contact-form');
        if (form && !form.dataset.escaparatesBound) {
            form.dataset.escaparatesBound = 'true';
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                var status = document.getElementById('form-status');
                if (status) status.textContent = 'Brief preparado. Configura tu destino comercial en Escaparates Pro.';
            }, true);
        }
    }

    function applyPayload(payload) {
        current = payload || {};
        if (lab === 'agency-studio-pro') {
            applyAgency(current);
            return;
        }
        if (lab === 'zoetrope-media-pro' && window.EPZoetropeMedia) {
            window.EPZoetropeMedia.apply(current);
            return;
        }
        var firstAsset = (current.assets || [])[0];
        if (firstAsset) loadIntoNativeUploader(firstAsset);
    }

    window.addEventListener('message', function(event) {
        var message = event.data || {};
        if (message.channel !== channel || message.type !== 'source-lab-config') return;
        applyPayload(message.payload);
    });

    setTimeout(function() {
        window.parent.postMessage({ channel: channel, type: 'source-lab-ready', lab: lab }, '*');
    }, 80);
})();
