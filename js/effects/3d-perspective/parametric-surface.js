(function() {
    var effect = new EP.EffectBase('parametric-surface', {
        name: 'Parametric Surface',
        category: '3d-perspective',
        icon: '🔮',
        description: 'Superficies 3D paramétricas animadas — Klein, toro, caracola y más en wireframe o sólido'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'surface', type: 'select', options: [
            { v: 'torus', l: 'Toro' },
            { v: 'sphere', l: 'Esfera' },
            { v: 'shell', l: 'Caracola' },
            { v: 'klein', l: 'Botella de Klein' },
            { v: 'saddle', l: 'Silla de montar' }
        ], default: 'torus', label: 'Superficie' },
        { key: 'wireframe', type: 'select', options: [{ v: 'off', l: 'Sólido' }, { v: 'on', l: 'Wireframe' }], default: 'off', label: 'Modo' },
        { key: 'color1', type: 'color', default: '#0088ff', label: 'Color primario' },
        { key: 'color2', type: 'color', default: '#ff0088', label: 'Color secundario' },
        { key: 'rotateSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad rotación' },
        { key: 'segments', type: 'range', min: 8, max: 64, default: 32, step: 4, label: 'Segmentos' },
        { key: 'scale', type: 'range', min: 50, max: 200, default: 100, step: 10, label: 'Escala', unit: '%' }
    ]);

    function buildGeometry(type, segs) {
        var geo;
        switch(type) {
            case 'torus':
                geo = new THREE.TorusGeometry(1.2, 0.45, segs, segs * 2); break;
            case 'sphere':
                geo = new THREE.SphereGeometry(1.5, segs, segs); break;
            case 'shell':
                geo = new THREE.SphereGeometry(1.2, segs, segs / 2, 0, Math.PI * 2, 0, Math.PI * 0.7); break;
            case 'klein':
                geo = new THREE.TorusKnotGeometry(1.0, 0.35, segs * 3, segs); break;
            case 'saddle':
                geo = new THREE.TorusGeometry(1.0, 0.6, segs / 2, segs, Math.PI); break;
            default:
                geo = new THREE.TorusGeometry(1.2, 0.45, segs, segs * 2);
        }
        return geo;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var segs = Math.round(this.settings.segments);
        var sc = this.settings.scale / 100;
        var wf = this.settings.wireframe === 'on';
        var c1 = parseInt((this.settings.color1 || '#0088ff').replace('#',''), 16);
        var c2 = parseInt((this.settings.color2 || '#ff0088').replace('#',''), 16);

        var geo = buildGeometry(this.settings.surface, segs);
        var mat = new THREE.MeshPhongMaterial({
            color: c1,
            emissive: c2,
            emissiveIntensity: 0.25,
            shininess: 80,
            wireframe: wf,
            transparent: wf,
            opacity: wf ? 0.85 : 1,
            side: THREE.DoubleSide
        });
        this._mesh = new THREE.Mesh(geo, mat);
        this._mesh.scale.set(sc, sc, sc);
        group.add(this._mesh);

        // Lights
        var amb = new THREE.AmbientLight(0x334455, 0.8);
        group.add(amb);
        var pt1 = new THREE.PointLight(c1, 1.5, 12);
        pt1.position.set(3, 2, 3); group.add(pt1);
        var pt2 = new THREE.PointLight(c2, 1.0, 10);
        pt2.position.set(-3, -1, 2); group.add(pt2);
        this._pt1 = pt1; this._pt2 = pt2;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._mesh) return;
        var spd = this.settings.rotateSpeed * 0.05;
        this._mesh.rotation.x = time * spd * 0.7;
        this._mesh.rotation.y = time * spd;
        this._mesh.rotation.z = Math.sin(time * spd * 0.3) * 0.4;
        if (this._pt1) {
            this._pt1.position.x = Math.cos(time * 0.8) * 3;
            this._pt1.position.y = Math.sin(time * 0.6) * 2;
        }
        if (this._pt2) {
            this._pt2.position.x = -Math.cos(time * 0.5) * 3;
            this._pt2.position.y = Math.sin(time * 0.7) * 2;
        }
    };

    effect.dispose = function() { this._mesh = null; this._pt1 = null; this._pt2 = null; };

    EP.Registry.register(effect);
})();
