// Logo Wheel PRO keeps the original Gist's polar layout, GSAP ticker,
// focus/hover pause and responsive recalculation inside Website Modules.
(function() {
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    function esc(value) {
        return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }
    function url(value) {
        var safe = String(value || '#').trim();
        return /^(https?:|mailto:|tel:|#)/i.test(safe) ? safe : '#';
    }
    function media(items) {
        var fallback = [
            'https://assets.codepen.io/191814/icon-google.png',
            'https://assets.codepen.io/191814/logo-one.png',
            'https://assets.codepen.io/191814/logo-two.png',
            'https://assets.codepen.io/191814/logo-three.png',
            'https://assets.codepen.io/191814/logo-nine.png',
            'https://assets.codepen.io/191814/logo-five.png',
            'https://assets.codepen.io/191814/logo-six.png',
            'https://assets.codepen.io/191814/logo-seven.png',
            'https://assets.codepen.io/191814/logo-eight.png'
        ];
        var normalized = (items || []).map(function(item) {
            var source = item && (item.url || (item.element && (item.element.currentSrc || item.element.src)));
            return source ? { url: source, type: item.type || 'image', name: item.name || 'Brand' } : null;
        }).filter(Boolean);
        return normalized.length ? normalized : fallback.map(function(source, index) { return { url: source, type: 'image', name: 'Partner ' + (index + 1) }; });
    }
    function wheelMedia(item, index) {
        if (item.type === 'video' || /^video\//.test(item.type || '')) {
            return '<video src="' + esc(item.url) + '" autoplay muted loop playsinline aria-label="Logo animado ' + (index + 1) + '"></video>';
        }
        return '<img src="' + esc(item.url) + '" alt="' + esc(item.name || ('Logo ' + (index + 1))) + '">';
    }
    function build(mediaList, raw) {
        var opts = Object.assign({
            headline: 'Our Partners', subtitle: 'Una orbita viva para partners, marcas y colecciones.', cta: 'Conectar', url: '#',
            primaryColor: '#d7a86e', secondaryColor: '#f5efe6', backgroundColor: '#07080b', fontFamily: 'Outfit', logoText: 'Escaparates Pro', speed: 1, intensity: 1,
            wheelDirection: 'right', wheelRadius: 70
        }, raw || {});
        var items = media(mediaList);
        var sourceItems = items.map(function(item, index) {
            var title = (item.name || opts.logoText) + ' ' + String(index + 1).padStart(2, '0');
            return '<div class="wheel-item" data-tooltip="' + esc(title) + '"><div class="upright"><a href="' + esc(url(opts.url)) + '" aria-label="Abrir ' + esc(title) + '">' + wheelMedia(item, index) + '</a></div></div>';
        }).join('');
        var speed = Math.max(0, Math.min(2, Number(opts.speed) || 1)) * .25;
        var radius = Math.max(35, Math.min(90, Number(opts.wheelRadius) || 70));
        var size = Math.max(.45, Math.min(2, Number(opts.intensity) || 1));
        var font = opts.fontFamily === 'Georgia' ? 'Georgia,serif' : opts.fontFamily === 'Arial' ? 'Arial,sans-serif' : "'Outfit',sans-serif";
        var css = ':root{--accent:' + esc(opts.primaryColor) + ';--text:' + esc(opts.secondaryColor) + ';--bg:' + esc(opts.backgroundColor) + ';--font:' + font + ';--wheel-max:980px;--wheel-width:min(88vw,var(--wheel-max));--item-size-min:' + (48 * size).toFixed(0) + 'px;--item-size-vw:' + (9 * size).toFixed(1) + 'vw;--item-size-max:' + (98 * size).toFixed(0) + 'px}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:var(--font)}body{overflow-x:hidden}.wheel-page{min-height:100dvh;position:relative;display:grid;grid-template-rows:auto 1fr auto;isolation:isolate;overflow:hidden;background:radial-gradient(circle at 50% 48%,color-mix(in srgb,var(--accent),transparent 77%),transparent 34%),radial-gradient(circle at 14% 16%,rgba(255,255,255,.1),transparent 18%),linear-gradient(135deg,var(--bg),#111520 56%,#050507)}.wheel-page:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.36;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 50% 50%,#000,transparent 76%)}.wheel-brand{padding:22px 30px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.wheel-brand:before{content:"";width:28px;height:28px;border-radius:9px;display:inline-block;background:linear-gradient(135deg,var(--accent),#fff2d8);box-shadow:0 0 42px color-mix(in srgb,var(--accent),transparent 58%)}.wheel-brand span{margin-right:auto}.wheel-kicker{font-size:11px;letter-spacing:.16em;font-weight:900;color:var(--accent);text-transform:uppercase}.wheel-hero{display:grid;place-items:center;padding:20px 24px 42px}.logo-wheel{position:relative;margin:0 auto;width:var(--wheel-width);aspect-ratio:1/1;overflow:visible;touch-action:manipulation}.logo-wheel .wheel{position:absolute;inset:0;display:grid;place-items:center;transform-origin:50% 50%;will-change:transform;user-select:none}.logo-wheel .wheel-item{position:absolute;left:50%;top:50%;width:clamp(var(--item-size-min),var(--item-size-vw),var(--item-size-max));aspect-ratio:1/1;transform-origin:0 0;display:grid;place-items:center;pointer-events:auto}.logo-wheel .upright,.logo-wheel a{display:grid;place-items:center;width:100%;height:100%}.logo-wheel img,.logo-wheel video{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 18px rgba(0,0,0,.35));transition:transform .25s ease,filter .25s ease}.logo-wheel .wheel-item:hover img,.logo-wheel .wheel-item:hover video,.logo-wheel .wheel-item:focus-within img,.logo-wheel .wheel-item:focus-within video{transform:scale(1.13);filter:drop-shadow(0 16px 32px color-mix(in srgb,var(--accent),transparent 55%))}.logo-wheel .wheel-item:focus-within .upright{outline:2px solid rgba(255,255,255,.7);outline-offset:5px;border-radius:10px}.logo-wheel .wheel-item:after{content:attr(data-tooltip);position:absolute;bottom:116%;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(5,6,9,.86);border:1px solid rgba(255,255,255,.18);color:#fff;font:700 11px/1 var(--font);letter-spacing:.08em;padding:8px 10px;border-radius:999px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:5}.logo-wheel .wheel-item:hover:after,.logo-wheel .wheel-item:focus-within:after{opacity:1;transform:translateX(-50%) translateY(0)}.wheel-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(46%,380px);aspect-ratio:1;display:grid;place-items:center;align-content:center;text-align:center;z-index:2;border:1px dashed rgba(255,255,255,.25);border-radius:50%;background:rgba(8,10,14,.46);backdrop-filter:blur(12px);box-shadow:inset 0 0 80px rgba(0,0,0,.25),0 28px 80px rgba(0,0,0,.28)}.wheel-center h1{font-size:clamp(20px,3.4vw,48px);line-height:.95;letter-spacing:0;margin:0 18px}.wheel-center p{font-size:clamp(11px,1.2vw,15px);line-height:1.45;color:rgba(255,255,255,.7);max-width:28ch;margin:13px auto 16px}.wheel-cta{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border-radius:999px;background:var(--accent);color:#08090c;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.wheel-foot{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;padding:22px 24px 26px;color:rgba(255,255,255,.56);font-size:11px;letter-spacing:.1em;text-transform:uppercase}.wheel-foot b{color:var(--accent)}@media(max-width:720px){.wheel-brand{padding:14px 16px;font-size:10px}.wheel-hero{padding:22px 12px 28px}.logo-wheel{width:min(96vw,620px)}.wheel-center{width:48%}.wheel-center h1{font-size:clamp(19px,6vw,34px)}.wheel-center p{display:none}.wheel-cta{min-height:44px;padding:0 13px;font-size:10px}.wheel-foot{padding:14px;font-size:9px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}';
        var body = '<main class="wheel-page"><header class="wheel-brand"><i></i><span>' + esc(opts.logoText) + '</span><div class="wheel-kicker">Logo Wheel PRO</div></header><section class="wheel-hero"><div class="logo-wheel" data-speed="' + speed.toFixed(2) + '" data-direction="' + (opts.wheelDirection === 'left' ? 'left' : 'right') + '" data-radius="' + radius + '" aria-label="Carrusel circular de logos"><div class="wheel">' + sourceItems + '</div><div class="wheel-center"><h1>' + esc(opts.headline) + '</h1><p>' + esc(opts.subtitle) + '</p><a class="wheel-cta" href="' + esc(url(opts.url)) + '">' + esc(opts.cta) + '</a></div></div></section><footer class="wheel-foot"><span><b>' + items.length + '</b> logos adaptativos</span><span>Hover pausa la orbita</span><span>Touch y reduced motion incluidos</span></footer></main>';
        var script = '<script src="https://unpkg.com/gsap@3/dist/gsap.min.js"><\\/script><script>(function(){var active=[];function ready(scope){var imgs=[].slice.call(scope.querySelectorAll("img")).filter(function(img){return !img.complete});return imgs.length?Promise.all(imgs.map(function(img){return new Promise(function(done){img.addEventListener("load",done,{once:true});img.addEventListener("error",done,{once:true})})})):Promise.resolve()}function radius(section,items){var rect=section.getBoundingClientRect(),half=Math.min(rect.width,rect.height)/2,raw=String(section.dataset.radius||"38").trim().toLowerCase();if(raw==="auto"){var avg=items.reduce(function(total,item){return total+(item.getBoundingClientRect().width||100)},0)/Math.max(1,items.length);return Math.min((items.length*(avg+avg*.15))/(2*Math.PI),half*.92)}return (Number(raw)||38)/100*half}function make(section){var wheel=section.querySelector(".wheel"),items=[].slice.call(wheel.querySelectorAll(".wheel-item")),uprights=items.map(function(item){return item.querySelector(".upright")}),speed=Number(section.dataset.speed)||.25,direction=String(section.dataset.direction||"right").toLowerCase()==="left"?-1:1,angles=[],reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,paused=false;function layout(init){var rect=section.getBoundingClientRect(),r=radius(section,items),cx=rect.width/2,cy=rect.height/2;if(init||angles.length!==items.length)angles=items.map(function(_,i){return 360/items.length*i});items.forEach(function(item,i){var rad=angles[i]*Math.PI/180;gsap.set(item,{position:"absolute",left:0,top:0,x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad),xPercent:-50,yPercent:-50});gsap.set(uprights[i],{rotation:0})})}function tick(){if(reduced||paused)return;var step=direction*speed*gsap.ticker.deltaRatio(60);angles=angles.map(function(angle){return (angle+step)%360});layout(false)}ready(section).then(function(){layout(true);gsap.ticker.add(tick)});section.addEventListener("mouseenter",function(){paused=true});section.addEventListener("mouseleave",function(){paused=false});section.addEventListener("focusin",function(){paused=true});section.addEventListener("focusout",function(){paused=false});active.push({layout:layout})}document.querySelectorAll(".logo-wheel").forEach(make);addEventListener("resize",function(){active.forEach(function(instance){instance.layout(false)})})})();<\\/script>';
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Logo Wheel PRO</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><meta name="escaparates-module-source" content="GSAP Animated Logo Wheel source Gist b5844014563d5d79e5c445bf4a571246"><style>' + css + '</style></head><body>' + body + script + '</body></html>';
    }

    EP.WebsiteModules.register({
        id: 'logo-wheel-pro',
        name: 'Logo Wheel PRO',
        icon: 'LW',
        family: 'Brand / Partners',
        description: 'Orbita GSAP de logos o clips con tooltips, pausa accesible, direccion y radio configurables.',
        sourceFile: 'GSAP Animated Logo Wheel source Gist b5844014563d5d79e5c445bf4a571246',
        mediaMap: 'Slots 1-15 logos o clips de marca. Con menos assets mantiene una orbita equilibrada.',
        fields: [
            { key: 'wheelDirection', type: 'select', label: 'Direccion de orbita', default: 'right', options: ['right', 'left'] },
            { key: 'wheelRadius', type: 'range', label: 'Radio de orbita', min: 35, max: 90, step: 1, default: 70 }
        ],
        build: build
    });
})();
