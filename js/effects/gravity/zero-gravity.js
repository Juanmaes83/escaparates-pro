(function() {
    var effect = new EP.EffectBase('zero-gravity', {
        name: 'Zero Gravity',
        category: 'gravity',
        icon: '🚀',
        description: 'Objetos flotando en gravedad cero — clusters de imágenes/poliedros en física spring suave'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 4, max: 20, default: 10, step: 1, label: 'Objetos' },
        { key: 'objectSize', type: 'range', min: 10, max: 80, default: 35, step: 5, label: 'Tamaño objeto', unit: '%' },
        { key: 'floatAmplitude', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Amplitud flotación' },
        { key: 'floatSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad flotación' },
        { key: 'rotateSpeed', type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Velocidad rotación' },
        { key: 'objectType', type: 'select', options: [
            { v: 'photo', l: 'Fotos (si hay media)' },
            { v: 'icosa', l: 'Icosaedros' },
            { v: 'box', l: 'Cubos' },
            { v: 'mix', l: 'Mezcla' }
        ], default: 'mix', label: 'Tipo objeto' },
        { key: 'bgColor', type: 'color', default: '#020408', label: 'Color fondo' }
    ]);

    var COLORS = [0x4488ff, 0xff4488, 0x44ffcc, 0xffcc44, 0xcc44ff, 0x44ff88, 0xff8844];
    function sr(s) { var r=(Math.sin(s+1)*43758.5453)%1; return r<0?r+1:r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var ml = mediaList || [];
        var n = Math.round(this.settings.count);
        var sz = this.settings.objectSize / 100 * 0.7;
        var bgC = parseInt((this.settings.bgColor || '#020408').replace('#',''), 16);
        var type = this.settings.objectType;

        // Background
        var bgGeo = new THREE.PlaneGeometry(8, 4.5);
        group.add(new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: bgC })));

        // Star field
        var sGeo = new THREE.BufferGeometry();
        var sPos = new Float32Array(200*3);
        for (var s=0;s<200;s++){sPos[s*3]=(sr(s*3)-0.5)*9;sPos[s*3+1]=(sr(s*3+1)-0.5)*5;sPos[s*3+2]=(sr(s*3+2)-0.5)*2-1;}
        sGeo.setAttribute('position', new THREE.BufferAttribute(sPos,3));
        group.add(new THREE.Points(sGeo, new THREE.PointsMaterial({color:0xffffff,size:0.02,transparent:true,opacity:0.5,depthWrite:false})));

        // Ambient + fill light
        group.add(new THREE.AmbientLight(0x223344, 0.6));
        var pt = new THREE.PointLight(0x4488ff, 1.5, 15);
        pt.position.set(3, 2, 3); group.add(pt);
        this._pt = pt;

        this._objects = [];
        for (var i=0; i<n; i++) {
            var color = COLORS[i % COLORS.length];
            var geo, mat;
            var usePhoto = (type==='photo' || type==='mix') && ml.length>0;
            var useMix = type==='mix' && i%2===0;

            if (usePhoto && !useMix) {
                geo = new THREE.PlaneGeometry(sz, sz*0.7);
                mat = EP.Media.createMaterial(ml[i%ml.length]);
                mat.transparent = true; mat.opacity = 0.95; mat.needsUpdate = true;
            } else {
                var geoType = (type==='box'||useMix) ? 'box' : 'icosa';
                if (geoType==='box') {
                    geo = new THREE.BoxGeometry(sz*0.7,sz*0.5,sz*0.3);
                } else {
                    geo = new THREE.IcosahedronGeometry(sz*0.4, 0);
                }
                mat = new THREE.MeshPhongMaterial({
                    color: color, emissive: color, emissiveIntensity: 0.2,
                    shininess: 100, transparent: true, opacity: 0.9
                });
            }

            var mesh = new THREE.Mesh(geo, mat);
            var angle = (i/n)*Math.PI*2;
            var r = 0.5 + sr(i*7)*2.5;
            mesh.position.set(
                Math.cos(angle)*r*1.5,
                Math.sin(angle)*r*0.8,
                (sr(i*11)-0.5)*1.5
            );
            mesh.rotation.set(sr(i*3)*Math.PI*2, sr(i*5)*Math.PI*2, sr(i*7)*Math.PI*2);
            group.add(mesh);
            this._objects.push({
                mesh: mesh,
                ox: mesh.position.x, oy: mesh.position.y, oz: mesh.position.z,
                phase: sr(i*13)*Math.PI*2,
                floatFreq: 0.3+sr(i*17)*0.7,
                rotX: (sr(i*19)-0.5)*2, rotY: (sr(i*23)-0.5)*3, rotZ: (sr(i*29)-0.5)*1.5
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._objects) return;
        var amp = this.settings.floatAmplitude * 0.04;
        var fspd = this.settings.floatSpeed * 0.15;
        var rspd = this.settings.rotateSpeed * 0.03;

        for (var i=0; i<this._objects.length; i++) {
            var o = this._objects[i];
            o.mesh.position.x = o.ox + Math.sin(time*fspd*o.floatFreq + o.phase)*amp;
            o.mesh.position.y = o.oy + Math.cos(time*fspd*o.floatFreq*0.7 + o.phase+1)*amp*0.7;
            o.mesh.position.z = o.oz + Math.sin(time*fspd*0.4 + o.phase*2)*amp*0.3;
            o.mesh.rotation.x += o.rotX*rspd*(dt||0.016);
            o.mesh.rotation.y += o.rotY*rspd*(dt||0.016);
            o.mesh.rotation.z += o.rotZ*rspd*0.5*(dt||0.016);
        }
        if (this._pt) {
            this._pt.position.x = Math.cos(time*0.4)*4;
            this._pt.position.y = Math.sin(time*0.3)*3;
        }
    };

    effect.dispose = function() { this._objects=null; this._pt=null; };

    EP.Registry.register(effect);
})();
