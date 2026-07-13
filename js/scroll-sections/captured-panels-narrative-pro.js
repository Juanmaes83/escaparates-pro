// Captured Panels Narrative PRO
// An independent, responsive interpretation of the "Conjurer la peur" idea:
// scroll catches one editorial panel at a time inside a fixed composition.
// It deliberately uses no external libraries and has a sequential mobile fallback.
(function() {
    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, function(ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch];
        });
    }

    function mediaHTML(item, index) {
        if (!item) return '<div class="cpn-placeholder cpn-placeholder-' + index + '"><span>Escena ' + (index + 1) + '</span></div>';
        if (item.type === 'video') {
            return '<video src="' + item.url + '" autoplay muted loop playsinline preload="metadata"></video>';
        }
        return '<img src="' + item.url + '" alt="Escena ' + (index + 1) + '">';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = escapeHTML(opts.title || 'Escaparate');
        var eyebrow = escapeHTML(opts.eyebrow || 'Narrativa capturada');
        var headline = escapeHTML(opts.headline || 'Lo que te atrapa, permanece.');
        var closing = escapeHTML(opts.closing || 'Tu historia ya tiene forma.');
        var cta = escapeHTML(opts.cta || 'Empezar una conversación');
        var media = EP.ScrollSections.fillMedia(mediaList, 5);
        var labels = ['Origen', 'Tensión', 'Materia', 'Instante', 'Memoria'];
        var panels = labels.map(function(label, index) {
            return '<article class="cpn-panel" data-panel="' + index + '">' +
                '<div class="cpn-art">' + mediaHTML(media[index], index) + '</div>' +
                '<div class="cpn-panel-meta"><span>0' + (index + 1) + '</span><strong>' + label + '</strong></div>' +
                '</article>';
        }).join('');

        return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
            '<title>' + title + ' - Captured Panels Narrative PRO</title>\n<style>\n' +
            ':root{--ink:#101018;--paper:#f4f0e8;--acid:#d9ff58;--line:rgba(244,240,232,.34)}\n' +
            '*{box-sizing:border-box}html{background:var(--ink);scroll-behavior:smooth}body{margin:0;background:var(--ink);color:var(--paper);font-family:Arial,Helvetica,sans-serif;overflow-x:hidden}.cpn-intro,.cpn-outro{min-height:74vh;display:grid;place-items:center;padding:8vw 7vw}.cpn-intro__inside{max-width:1050px;width:100%;display:grid;gap:1.2rem}.cpn-kicker{font:700 .72rem/1 Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--acid)}.cpn-intro h1{margin:0;max-width:900px;font-size:clamp(3.2rem,10vw,9.4rem);line-height:.86;letter-spacing:-.075em;text-wrap:balance}.cpn-intro p{margin:0;max-width:430px;color:rgba(244,240,232,.68);font-size:1rem;line-height:1.5}.cpn-journey{height:500vh;position:relative}.cpn-pin{height:100vh;position:sticky;top:0;overflow:hidden;display:grid;place-items:center;padding:3.5rem}.cpn-stage{width:min(74vw,1040px);height:min(70vh,710px);position:relative}.cpn-panel{position:absolute;inset:0;margin:auto;width:min(50vw,610px);height:min(64vh,600px);overflow:hidden;border:1px solid var(--line);background:#24242f;box-shadow:0 26px 70px rgba(0,0,0,.43);transform-origin:50% 90%;will-change:transform,opacity,filter;border-radius:2px}.cpn-art,.cpn-art img,.cpn-art video,.cpn-placeholder{width:100%;height:100%;display:block}.cpn-art img,.cpn-art video{object-fit:cover}.cpn-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,12,.08),rgba(8,8,12,.54));pointer-events:none}.cpn-art{position:relative}.cpn-placeholder{display:grid;place-items:center;background:linear-gradient(135deg,#38384a,#161620 48%,#778d68);font-size:clamp(1.4rem,3vw,2.5rem);font-weight:700}.cpn-placeholder-1{background:linear-gradient(130deg,#1b1e2f,#bb6a58)}.cpn-placeholder-2{background:linear-gradient(130deg,#26372f,#d6d1bc)}.cpn-placeholder-3{background:linear-gradient(130deg,#33243e,#d28061)}.cpn-placeholder-4{background:linear-gradient(130deg,#5b5c52,#14141b)}.cpn-panel-meta{position:absolute;z-index:2;left:1.1rem;right:1.1rem;bottom:1rem;display:flex;justify-content:space-between;align-items:end;gap:1rem;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem}.cpn-panel-meta span{color:var(--acid);font-weight:700}.cpn-panel-meta strong{font-size:1rem;letter-spacing:.02em}.cpn-index{position:absolute;left:clamp(1.2rem,5vw,5rem);top:50%;z-index:4;transform:translateY(-50%);display:grid;gap:.58rem}.cpn-index button{width:2.15rem;height:2.15rem;border:1px solid var(--line);border-radius:50%;color:var(--paper);background:rgba(16,16,24,.5);font:700 .66rem Arial;cursor:pointer;transition:background .25s,color .25s}.cpn-index button.is-current{background:var(--acid);color:var(--ink);border-color:var(--acid)}.cpn-copy{position:absolute;right:clamp(1.2rem,5vw,5rem);bottom:clamp(1.4rem,5vw,4rem);z-index:4;text-align:right;max-width:220px;color:rgba(244,240,232,.68);font-size:.78rem;line-height:1.45}.cpn-progress{position:absolute;top:0;left:0;width:100%;height:3px;background:rgba(244,240,232,.14);z-index:6}.cpn-progress i{display:block;width:0;height:100%;background:var(--acid);transition:width .08s linear}.cpn-outro{min-height:92vh;text-align:center}.cpn-outro__inside{max-width:800px}.cpn-outro h2{margin:0;font-size:clamp(3.2rem,9vw,8rem);line-height:.87;letter-spacing:-.07em}.cpn-outro p{margin:1.8rem auto;color:rgba(244,240,232,.7);max-width:32rem;line-height:1.5}.cpn-outro a{display:inline-flex;padding:1rem 1.25rem;color:var(--ink);background:var(--acid);text-decoration:none;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;border-radius:999px}@media (max-width:700px){.cpn-intro{min-height:68vh;padding:5rem 1.5rem}.cpn-intro h1{font-size:clamp(3.25rem,16vw,5.4rem)}.cpn-journey{height:auto;padding:1rem 1rem 4rem}.cpn-pin{position:relative;height:auto;padding:0;display:block}.cpn-stage{width:100%;height:auto;display:grid;gap:1.1rem}.cpn-panel{position:relative;inset:auto;width:100%;height:72vh;min-height:360px;opacity:1!important;transform:none!important;filter:none!important}.cpn-index,.cpn-copy,.cpn-progress{display:none}.cpn-outro{padding:6rem 1.5rem;min-height:70vh}.cpn-outro h2{font-size:clamp(3.2rem,16vw,5.5rem)}}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.cpn-journey{height:auto}.cpn-pin{position:relative;height:auto}.cpn-stage{height:auto;display:grid;gap:1.25rem}.cpn-panel{position:relative;inset:auto;width:100%;height:70vh;opacity:1!important;transform:none!important;filter:none!important}.cpn-index,.cpn-copy,.cpn-progress{display:none}}\n' +
            '</style>\n</head>\n<body>\n' +
            '<section class="cpn-intro"><div class="cpn-intro__inside"><span class="cpn-kicker">' + eyebrow + ' / ' + title + '</span><h1>' + headline + '</h1><p>Desplaza para capturar cada escena. Cinco piezas, una secuencia y un cierre que conserva lo importante.</p></div></section>\n' +
            '<main class="cpn-journey" id="journey"><div class="cpn-progress"><i></i></div><div class="cpn-pin"><div class="cpn-stage">' + panels + '</div><nav class="cpn-index" aria-label="Escenas">' + labels.map(function(_, i) { return '<button type="button" data-jump="' + i + '" aria-label="Ir a escena ' + (i + 1) + '">0' + (i + 1) + '</button>'; }).join('') + '</nav><p class="cpn-copy">El scroll no pasa de largo: cada imagen queda atrapada un instante antes de dejar paso a la siguiente.</p></div></main>\n' +
            '<section class="cpn-outro"><div class="cpn-outro__inside"><span class="cpn-kicker">Final / ' + title + '</span><h2>' + closing + '</h2><p>Convierte una colección de imágenes o vídeos en una narrativa web que el visitante recuerda.</p><a href="#journey">' + cta + '</a></div></section>\n' +
            '<script>(function(){var journey=document.getElementById("journey"), panels=[].slice.call(document.querySelectorAll(".cpn-panel")), dots=[].slice.call(document.querySelectorAll("[data-jump]")), bar=document.querySelector(".cpn-progress i"), desktop=window.matchMedia("(min-width:701px) and (prefers-reduced-motion:no-preference)");function clamp(v){return Math.max(0,Math.min(1,v))}function draw(){if(!desktop.matches)return;var rect=journey.getBoundingClientRect(),span=journey.offsetHeight-window.innerHeight,p=clamp(-rect.top/span),active=Math.min(panels.length-1,Math.floor(p*panels.length));panels.forEach(function(panel,i){var local=clamp((p-(i/panels.length))*panels.length),enter=clamp(local/.22),leave=clamp((local-.78)/.22),x=(1-enter)*((i%2?1:-1)*95),y=(1-enter)*42-leave*38,scale=.84+enter*.16-leave*.11,rotate=(1-enter)*(i%2?7:-7)+leave*(i%2?-4:4);panel.style.transform="translate3d("+x+"%,"+y+"%,0) rotate("+rotate+"deg) scale("+scale+")";panel.style.opacity=String(.2+enter*.8-leave*.38);panel.style.filter="brightness("+(.66+enter*.34-leave*.18)+")";panel.style.zIndex=String(10+i)});dots.forEach(function(dot,i){dot.classList.toggle("is-current",i===active)});bar.style.width=(p*100)+"%"}function jump(i){var top=journey.offsetTop+(journey.offsetHeight-window.innerHeight)*((i+.04)/panels.length);window.scrollTo({top:top,behavior:"smooth"})}dots.forEach(function(dot){dot.addEventListener("click",function(){jump(+dot.dataset.jump)})});window.addEventListener("scroll",draw,{passive:true});window.addEventListener("resize",draw);draw()})()</script>\n' +
            '</body>\n</html>';
    }

    EP.ScrollSections.register({
        id: 'captured-panels-narrative-pro',
        name: 'Captured Panels Narrative PRO',
        icon: 'CP',
        description: 'Narrativa de paneles que quedan atrapados por el scroll: cinco imágenes o vídeos construyen una secuencia editorial táctil. Incluye versión móvil secuencial y reduced motion.',
        build: build
    });
})();
