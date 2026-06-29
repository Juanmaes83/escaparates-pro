(function() {
    var effect = new EP.EffectBase('holographic-card', {
        name: 'Holographic Card',
        category: 'glassmorphism',
        icon: '🌟',
        description: 'Carta holografica tipo Pokemon con reflejo arcoiris iridiscente'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 42, label: 'Card Size', unit: '%' },
        { key: 'holoIntensity', type: 'range', min: 10, max: 100, default: 70, label: 'Holo Force', unit: '%' },
        { key: 'specular', type: 'range', min: 0, max: 100, default: 50, label: 'Specular', unit: '%' },
        { key: 'rotAmplitude', type: 'range', min: 5, max: 40, default: 18, label: 'Rotation', unit: '°' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#08080e', label: 'Background' }
    ]);

    function createHoloTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');

        for (var y = 0; y < 256; y++) {
            for (var x = 0; x < 256; x++) {
                var nx = x / 256, ny = y / 256;
                var v = Math.sin(nx * 20 + ny * 10) * 0.5 + 0.5;
                var v2 = Math.sin(nx * 15 - ny * 25 + 3) * 0.5 + 0.5;
                var v3 = Math.sin((nx + ny) * 30) * 0.5 + 0.5;
                var r = Math.floor((v * 0.5 + v2 * 0.3 + v3 * 0.2) * 255);
                var g = Math.floor((v2 * 0.5 + v3 * 0.3 + v * 0.2) * 255);
                var b = Math.floor((v3 * 0.5 + v * 0.3 + v2 * 0.2) * 255);
                ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.fillRect(x, y, 1, 1);
            }
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 4;
        var h = cardScale * 1.4;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var holoTex = createHoloTexture();

        var cardGroup = new THREE.Group();

        var shadowGeo = new THREE.PlaneGeometry(cardScale * 1.3, h * 0.3);
        var shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.3, side: THREE.DoubleSide
        });
        var shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -h / 2 - 0.3;
        cardGroup.add(shadow);

        var backGeo = EP.RoundedPlaneGeometry(cardScale + 0.06, h + 0.06, cr + 0.03);
        var backMat = new THREE.MeshBasicMaterial({
            color: 0x222233, side: THREE.DoubleSide
        });
        var back = new THREE.Mesh(backGeo, backMat);
        back.position.z = -0.02;
        cardGroup.add(back);

        var borderGeo = EP.RoundedPlaneGeometry(cardScale + 0.12, h + 0.12, cr + 0.06);
        var borderMat = new THREE.MeshBasicMaterial({
            color: 0xccaa44, transparent: true, opacity: 0.6, side: THREE.DoubleSide
        });
        var border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.03;
        border.userData = { isBorder: true };
        cardGroup.add(border);

        var media = mediaList[0];
        var artGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
        var artMat = EP.Media.createMaterial(media);
        artMat.transparent = true;
        var art = new THREE.Mesh(artGeo, artMat);
        cardGroup.add(art);

        var holoGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
        var holoMat = new THREE.MeshBasicMaterial({
            map: holoTex,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        var holo = new THREE.Mesh(holoGeo, holoMat);
        holo.position.z = 0.005;
        holo.userData = { isHolo: true };
        cardGroup.add(holo);

        var specGeo = EP.RoundedPlaneGeometry(cardScale * 0.7, h * 0.5, cr * 0.5);
        var specMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.06,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide
        });
        var spec = new THREE.Mesh(specGeo, specMat);
        spec.position.z = 0.01;
        spec.userData = { isSpec: true };
        cardGroup.add(spec);

        cardGroup.userData = { isCard: true, currentImg: 0 };
        group.add(cardGroup);

        this._holoTex = holoTex;
        this._mediaList = mediaList;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var amp = THREE.MathUtils.degToRad(this.settings.rotAmplitude);
        var holoInt = this.settings.holoIntensity / 100;
        var specInt = this.settings.specular / 100;

        var card = this.group.children[0];
        if (!card) return;

        var imgIdx = Math.floor(t * this._mediaList.length) % this._mediaList.length;
        if (imgIdx !== card.userData.currentImg) {
            card.userData.currentImg = imgIdx;
            var artMesh = card.children[3];
            if (artMesh && artMesh.material) {
                var newMat = EP.Media.createMaterial(this._mediaList[imgIdx]);
                newMat.transparent = true;
                artMesh.material.dispose();
                artMesh.material = newMat;
            }
        }

        var rotY = Math.sin(t * Math.PI * 2) * amp;
        var rotX = Math.sin(t * Math.PI * 4) * amp * 0.4;
        card.rotation.y = rotY;
        card.rotation.x = rotX;

        var tiltFactor = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

        card.children.forEach(function(child) {
            if (child.userData.isHolo) {
                child.material.opacity = (0.08 + tiltFactor * 0.2) * holoInt;
                if (child.material.map) {
                    child.material.map.offset.x = Math.sin(t * Math.PI * 2) * 0.3;
                    child.material.map.offset.y = Math.cos(t * Math.PI * 3) * 0.3;
                }
            } else if (child.userData.isSpec) {
                child.material.opacity = tiltFactor * 0.12 * specInt;
                child.position.x = Math.sin(t * Math.PI * 2) * 0.3;
                child.position.y = Math.cos(t * Math.PI * 3) * 0.4;
            } else if (child.userData.isBorder) {
                var hue = (t * 0.5) % 1;
                child.material.color.setHSL(hue, 0.6, 0.55 + tiltFactor * 0.15);
                child.material.opacity = 0.4 + tiltFactor * 0.4;
            }
        });

        var shadow = card.children[0];
        if (shadow) {
            shadow.scale.x = 1 + Math.abs(Math.sin(rotY)) * 0.3;
            shadow.material.opacity = 0.15 + (1 - Math.abs(Math.sin(rotY))) * 0.15;
        }
    };

    EP.Registry.register(effect);
})();
