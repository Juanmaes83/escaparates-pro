EP.Media = (function() {
    var slots = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    var slotsContainer;
    var fileInput;
    var activeSlotIndex = -1;
    var onChangeCallback = null;
    var defaultImages = [
        'https://images.unsplash.com/photo-1638959882708-9503b1cd595f?w=600&q=80',
        'https://images.unsplash.com/photo-1644469709847-454ef12d5144?w=600&q=80',
        'https://images.unsplash.com/photo-1731848356615-90cba9fdc862?w=600&q=80',
        'https://images.unsplash.com/photo-1688388040015-c3985c83a12d?w=600&q=80',
        'https://images.unsplash.com/photo-1726591383648-5b5cbe1da1a2?w=600&q=80',
        'https://images.unsplash.com/photo-1651745314014-a9432659af40?w=600&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80'
    ];

    function init() {
        slotsContainer = document.getElementById('media-slots');
        fileInput = document.getElementById('slot-file-input');
        renderSlots();
        fileInput.addEventListener('change', handleFileSelect);
        loadDefaults();
    }

    function loadDefaults() {
        defaultImages.forEach(function(url, i) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                slots[i] = { type: 'image', element: img, url: url, name: 'Unsplash ' + (i + 1) };
                renderSlots();
                if (onChangeCallback) onChangeCallback(getAll());
            };
            img.onerror = function() {
                var canvas = document.createElement('canvas');
                canvas.width = 280; canvas.height = 280;
                var ctx = canvas.getContext('2d');
                var hue = (i * 60) % 360;
                ctx.fillStyle = 'hsl(' + hue + ',60%,50%)';
                ctx.fillRect(0, 0, 280, 280);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), 140, 140);
                slots[i] = { type: 'image', element: canvas, url: '', name: 'Fallback ' + (i + 1) };
                renderSlots();
                if (onChangeCallback) onChangeCallback(getAll());
            };
            img.src = url;
        });
    }

    function renderSlots() {
        if (!slotsContainer) return;
        slotsContainer.innerHTML = '';
        for (var i = 0; i < 15; i++) {
            var div = document.createElement('div');
            div.className = 'media-slot' + (slots[i] ? ' filled' : '');
            div.dataset.index = i;
            if (slots[i]) {
                if (slots[i].type === 'video') {
                    var vid = document.createElement('video');
                    vid.src = slots[i].url;
                    vid.muted = true; vid.loop = true; vid.playsInline = true;
                    vid.play().catch(function() {});
                    div.appendChild(vid);
                } else {
                    var img = document.createElement('img');
                    img.src = slots[i].element.src || slots[i].url;
                    img.alt = slots[i].name;
                    div.appendChild(img);
                }
                var removeBtn = document.createElement('button');
                removeBtn.className = 'slot-remove';
                removeBtn.textContent = '✕';
                removeBtn.dataset.index = i;
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    removeSlot(parseInt(this.dataset.index));
                });
                div.appendChild(removeBtn);
            } else {
                var label = document.createElement('div');
                label.className = 'slot-label';
                label.textContent = 'Slot ' + (i + 1) + '\nClick o arrastra';
                div.appendChild(label);
            }
            div.addEventListener('click', function() {
                activeSlotIndex = parseInt(this.dataset.index);
                fileInput.click();
            });
            div.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent)'; });
            div.addEventListener('dragleave', function() { this.style.borderColor = ''; });
            div.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = '';
                var idx = parseInt(this.dataset.index);
                if (e.dataTransfer.files.length > 0) {
                    loadFileToSlot(e.dataTransfer.files[0], idx);
                }
            });
            slotsContainer.appendChild(div);
        }
    }

    function handleFileSelect(e) {
        var files = Array.from(e.target.files);
        files.forEach(function(file, fi) {
            var targetIdx = activeSlotIndex + fi;
            if (targetIdx >= 15) return;
            loadFileToSlot(file, targetIdx);
        });
        fileInput.value = '';
    }

    function loadFileToSlot(file, idx) {
        if (file.type.startsWith('video/')) {
            var url = URL.createObjectURL(file);
            var video = document.createElement('video');
            video.src = url; video.loop = true; video.muted = true;
            video.playsInline = true; video.preload = 'auto';
            video.addEventListener('loadeddata', function() {
                slots[idx] = { type: 'video', element: video, url: url, name: file.name };
                renderSlots();
                if (onChangeCallback) onChangeCallback(getAll());
                EP.UI.toast('Video cargado en slot ' + (idx + 1));
            });
            video.play().catch(function() {});
        } else {
            var reader = new FileReader();
            reader.onload = function(ev) {
                var img = new Image();
                img.onload = function() {
                    slots[idx] = { type: 'image', element: img, url: ev.target.result, name: file.name };
                    renderSlots();
                    if (onChangeCallback) onChangeCallback(getAll());
                    EP.UI.toast('Imagen cargada en slot ' + (idx + 1));
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function removeSlot(idx) {
        if (slots[idx] && slots[idx].type === 'video') {
            URL.revokeObjectURL(slots[idx].url);
        }
        slots[idx] = null;
        renderSlots();
        if (onChangeCallback) onChangeCallback(getAll());
    }

    function getAll() {
        return slots.filter(function(s) { return s !== null; });
    }

    function onChange(fn) {
        onChangeCallback = fn;
    }

    function createTexture(mediaObj, options) {
        options = options || {};
        if (!mediaObj || !mediaObj.element) return null;
        var tex = mediaObj.type === 'video' ? new THREE.VideoTexture(mediaObj.element) : new THREE.Texture(mediaObj.element);
        tex.minFilter = options.minFilter || THREE.LinearFilter;
        tex.magFilter = options.magFilter || THREE.LinearFilter;
        if (options.wrapS) tex.wrapS = options.wrapS;
        if (options.wrapT) tex.wrapT = options.wrapT;
        if (options.repeat) tex.repeat.set(options.repeat.x || options.repeat[0] || 1, options.repeat.y || options.repeat[1] || 1);
        if (tex.isVideoTexture) tex.generateMipmaps = false;
        tex.needsUpdate = true;
        return tex;
    }

    function updateTexture(tex) {
        if (tex && tex.isVideoTexture) tex.needsUpdate = true;
    }

    function updateMaterial(material) {
        if (!material) return;
        if (Array.isArray(material)) {
            material.forEach(updateMaterial);
            return;
        }
        updateTexture(material.map);
        if (material.uniforms) {
            Object.keys(material.uniforms).forEach(function(key) {
                var value = material.uniforms[key] && material.uniforms[key].value;
                if (value && value.isTexture) updateTexture(value);
            });
        }
    }

    function createMaterial(mediaObj, options) {
        options = options || {};
        var tex = createTexture(mediaObj, options);
        return new THREE.MeshBasicMaterial({
            map: tex,
            side: options.side || THREE.DoubleSide,
            transparent: options.transparent !== false,
            opacity: options.opacity === undefined ? 0.92 : options.opacity
        });
    }

    return {
        init: init,
        getAll: getAll,
        onChange: onChange,
        createTexture: createTexture,
        updateTexture: updateTexture,
        updateMaterial: updateMaterial,
        createMaterial: createMaterial,
        get slots() { return slots; }
    };
})();
