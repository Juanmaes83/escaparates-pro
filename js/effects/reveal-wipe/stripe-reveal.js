(function() {
    var effect = new EP.EffectBase('stripe-reveal', {
        name: 'Stripe Reveal',
        category: 'reveal-wipe',
        icon: '▥',
        description: 'Imagen que se reensambla desde franjas'
    }, [
        { key: 'cardSize', type: 'range', min: 40, max: 80, default: 65, label: 'Card Size', unit: '%' },
        { key: 'stripes', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Stripes' },
        { key: 'easing', type: 'easing', options: ['overshoot', 'smooth', 'snappy', 'elastic'], default: 'overshoot', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeOutBack(t) {
        var s = 1.70158;
        return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var stripes = this.settings.stripes;
        var cardScale = this.settings.cardSize / 100 * 6;
        var stripeW = cardScale * 1.6 / stripes;

        for (var img = 0; img < count; img++) {
            var imgGroup = new THREE.Group();
            imgGroup.visible = false;
            imgGroup.userData = { imgIndex: img, total: count };

            for (var s = 0; s < stripes; s++) {
                var geo = new THREE.PlaneGeometry(stripeW, cardScale);
                var mat = EP.Media.createMaterial(mediaList[img]);
                mat.map = mat.map.clone();
                mat.map.repeat.set(1 / stripes, 1);
                mat.map.offset.set(s / stripes, 0);
                mat.map.needsUpdate = true;
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.x = (s - (stripes - 1) / 2) * stripeW;
                mesh.userData = { stripeIndex: s, baseX: mesh.position.x };
                imgGroup.add(mesh);
            }
            group.add(imgGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var perSlide = 1 / count;

        this.group.children.forEach(function(imgGroup) {
            var i = imgGroup.userData.imgIndex;
            var start = i * perSlide;
            var local = ((t - start) / perSlide + 1) % 1;
            imgGroup.visible = local < 0.95;

            imgGroup.children.forEach(function(stripe) {
                var s = stripe.userData.stripeIndex;
                var delay = s * 0.06;
                var lt = Math.max(0, Math.min(1, (local - delay) / 0.4));
                var e = easeOutBack(lt);
                var exitT = Math.max(0, (local - 0.7 - delay * 0.3) / 0.3);
                stripe.position.x = stripe.userData.baseX;
                stripe.position.y = (1 - e) * (s % 2 === 0 ? 10 : -10) + exitT * (s % 2 === 0 ? -10 : 10);
            });
        });
    };

    EP.Registry.register(effect);
})();
