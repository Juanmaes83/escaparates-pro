// Event Ticket (Boarding-Pass Style) — adapted from the CodePen gist
// "[Tailwind] E-Ticket" (source read & understood: a boarding-pass-style
// card split into a main stub and a perforated ticket stub, the perforation
// drawn with radial-gradient "bite" masks on facing corners plus a dashed
// divider line, a staggered fade/slide-in for each field, a small plane
// icon that flies in across the header, and an SVG barcode). Rebuilt in
// plain CSS (the source leans on Tailwind's JIT arbitrary-variant syntax,
// which needs the Tailwind CDN at runtime — dropped for zero external
// framework dependency).
//
// Generalized beyond real estate per explicit direction: this is a generic
// ticket usable for travel (plane/car/train), concerts, events, or a
// property viewing — the transport icon, right-hand label and the 4 field
// slots are all configurable. Added on top of the source: a real tear-off
// interaction — clicking the scissors button physically separates the stub
// from the main body (translate + rotate + drop shadow), rather than just
// showing a static dashed line.
(function() {
    var ICONS = {
        avion: '&#9992;',
        coche: '&#128663;',
        tren: '&#128646;',
        personas: '&#128694;',
        musica: '&#127925;',
        evento: '&#127903;'
    };

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Concierto de Rock';
        var subtitle = opts.subtitle || 'Recinto Municipal, Madrid';
        var codeFrom = (opts.codeFrom || title.slice(0, 3)).toUpperCase();
        var codeTo = (opts.codeTo || 'EVT').toUpperCase();
        var rightLabel = opts.rightLabel || 'ACCESO';
        var iconType = (opts.iconType || 'evento').toLowerCase().trim();
        var icon = ICONS[iconType] || ICONS.evento;
        var fields = (opts.fields && opts.fields.length ? opts.fields : [
            { title: 'Fecha', year: '18 Jul' },
            { title: 'Hora', year: '20:30' },
            { title: 'Puerta', year: 'B3' },
            { title: 'Referencia', year: 'REF-2043' }
        ]).slice(0, 4).map(function(f) { return { label: f.title || '', value: f.year || '' }; });
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var bgUrl = media[0] ? media[0].url : '';

        var fieldsMainHTML = fields.map(function(f, i) {
            return '<div><h3>' + f.label + '</h3><time>' + f.value + '</time></div>';
        }).join('\n      ');
        var fieldsStubHTML = fields.slice(0, 3).map(function(f) {
            return '<div>' + f.label + '<time>' + f.value + '</time></div>';
        }).join('');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Ticket</title>\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;}\n' +
'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#fff;font-family:Arial,Helvetica,sans-serif;position:relative;overflow:hidden;}\n' +
(bgUrl ? 'body::before{content:"";position:fixed;inset:-10%;background:url(\'' + bgUrl + '\') center/cover;opacity:0.28;z-index:-1;animation:vt-pan 120s linear infinite;}\n' : '') +
'@keyframes vt-pan{0%,100%{transform:scale(1.15) translate(0,0);}50%{transform:scale(1.15) translate(-2%,2%);}}\n' +
'.vt-wrap{position:relative;width:100%;max-width:56rem;}\n' +
'main{--r:10px;--bg:#ECFEFF;color:#94a3b8;font-weight:300;width:100%;display:grid;grid-template-columns:4fr 1fr;background:var(--bg);border-radius:14px;overflow:visible;box-shadow:0 30px 80px rgba(0,0,0,0.35);}\n' +
'@media (max-width:640px){main{grid-template-columns:1fr;max-width:24rem;margin:0 auto;}}\n' +
'.vt-main{padding:1.75rem 2rem;position:relative;border-radius:14px 0 0 14px;background:radial-gradient(circle var(--r) at top right,#0000 98%,var(--bg)) top right,radial-gradient(circle var(--r) at bottom right,#0000 98%,var(--bg)) bottom right;background-size:100% 51%;background-repeat:no-repeat;}\n' +
'@media (max-width:640px){.vt-main{border-radius:14px 14px 0 0;background:radial-gradient(circle var(--r) at bottom left,#0000 98%,var(--bg)) bottom left,radial-gradient(circle var(--r) at bottom right,#0000 98%,var(--bg)) bottom right;background-size:51% 100%;background-repeat:no-repeat;}}\n' +
'.vt-main::before{content:"";position:absolute;border:2px dashed #ddd;top:calc(var(--r) * 3);right:-1px;bottom:auto;left:auto;height:calc(100% - var(--r) * 6);width:0;transition:opacity .3s;}\n' +
'@media (max-width:640px){.vt-main::before{bottom:-1px;left:calc(var(--r) * 3);width:calc(100% - var(--r) * 6);height:0;top:auto;right:auto;}}\n' +
'.vt-route{display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:center;margin-bottom:1.5rem;}\n' +
'.vt-route h2{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;color:#22d3ee;text-transform:uppercase;margin:0;opacity:0;animation:vt-in 0.5s forwards;}\n' +
'.vt-route h2:first-child{animation-delay:0.3s;}\n' +
'.vt-route h2:last-child{animation-delay:0.7s;}\n' +
'.vt-route .vt-plane{display:flex;align-items:center;position:relative;}\n' +
'.vt-route .vt-plane::before{content:"";position:absolute;inset-inline:0;top:50%;height:1px;background:#ccc;z-index:-1;}\n' +
'.vt-route .vt-plane span{font-size:1.8rem;background:var(--bg);padding:0 0.6rem;opacity:0;transform:translateX(-140px);animation:vt-fly 1s ease-out 1.1s forwards;}\n' +
'.vt-labels{display:flex;justify-content:space-between;font-size:0.85rem;color:#94a3b8;margin-top:-0.75rem;margin-bottom:1.5rem;}\n' +
'.vt-labels span{opacity:0;animation:vt-in 0.5s forwards;}\n' +
'.vt-labels span:first-child{animation-delay:0.3s;}\n' +
'.vt-labels span:last-child{animation-delay:0.7s;}\n' +
'.vt-fields{display:grid;grid-template-columns:repeat(4,auto);gap:1rem;background:#cffafe;border-radius:8px;padding:0.9rem 1.2rem;font-size:0.85rem;margin-bottom:1.25rem;}\n' +
'@media (max-width:640px){.vt-fields{grid-template-columns:repeat(2,1fr);}}\n' +
'.vt-fields div{opacity:0;animation:vt-in 0.5s forwards;}\n' +
'.vt-fields div:nth-child(1){animation-delay:0.9s;}\n' +
'.vt-fields div:nth-child(2){animation-delay:1.1s;}\n' +
'.vt-fields div:nth-child(3){animation-delay:1.3s;}\n' +
'.vt-fields div:nth-child(4){animation-delay:1.5s;}\n' +
'.vt-fields h3{margin:0 0 0.15rem;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;font-weight:400;}\n' +
'.vt-fields time{font-weight:700;color:#22d3ee;}\n' +
'.vt-note{font-size:0.75rem;color:#94a3b8;}\n' +
'@keyframes vt-in{from{opacity:0;}to{opacity:1;}}\n' +
'@keyframes vt-fly{from{opacity:1;transform:translateX(-140px);}to{opacity:1;transform:translateX(0);}}\n' +
'.vt-stub{display:grid;place-content:center;padding:1.25rem;background:var(--bg);border-radius:0 14px 14px 0;transition:transform .6s cubic-bezier(.34,1.5,.4,1), box-shadow .6s ease;position:relative;z-index:2;}\n' +
'@media (max-width:640px){.vt-stub{border-radius:0 0 14px 14px;}}\n' +
'.vt-stub-inner{display:grid;place-content:center;gap:1rem;}\n' +
'@media (min-width:641px){.vt-stub-inner{transform:rotate(-90deg);}}\n' +
'.vt-stub-route{display:grid;grid-template-columns:auto auto auto;gap:0.5rem;align-items:center;font-size:0.85rem;color:#94a3b8;}\n' +
'.vt-stub-route h2{margin:0;font-size:1.3rem;font-weight:700;color:#22d3ee;text-transform:uppercase;}\n' +
'.vt-stub-route span{font-size:1.2rem;}\n' +
'.vt-stub-fields{display:flex;gap:1rem;font-size:0.72rem;color:#94a3b8;white-space:nowrap;}\n' +
'.vt-stub-fields time{font-weight:700;color:#22d3ee;display:block;}\n' +
'.vt-barcode{max-width:14rem;width:100%;}\n' +
'.vt-tear-btn{position:absolute;top:calc(var(--r) * 3 - 1.1rem);right:calc(20% - 1.1rem);z-index:5;width:2.2rem;height:2.2rem;border-radius:50%;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.15);transition:transform .2s;}\n' +
'.vt-tear-btn:hover{transform:scale(1.08);}\n' +
'@media (max-width:640px){.vt-tear-btn{top:auto;bottom:calc(20% - 1.1rem);right:calc(50% - 1.1rem);}}\n' +
'.vt-wrap.torn .vt-tear-btn{opacity:0;pointer-events:none;}\n' +
'.vt-wrap.torn .vt-stub{transform:translate(2.5rem, 3rem) rotate(7deg);box-shadow:-14px 16px 30px rgba(0,0,0,0.3);}\n' +
'.vt-wrap.torn .vt-main::before{opacity:0;}\n' +
'@media (max-width:640px){.vt-wrap.torn .vt-stub{transform:translate(1.5rem, 2.5rem) rotate(-4deg);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="vt-wrap" id="vt-wrap">\n' +
'<main>\n' +
'  <div class="vt-main">\n' +
'    <div class="vt-route">\n' +
'      <h2>' + codeFrom + '</h2>\n' +
'      <div class="vt-plane"><span>' + icon + '</span></div>\n' +
'      <h2>' + codeTo + '</h2>\n' +
'    </div>\n' +
'    <div class="vt-labels"><span>' + title + '</span><span>' + subtitle + '</span></div>\n' +
'    <div class="vt-fields">\n' +
'      ' + fieldsMainHTML + '\n' +
'    </div>\n' +
'    <p class="vt-note">Presenta este ticket (impreso o en tu móvil). Cualquier cambio, contacta con la organización.</p>\n' +
'  </div>\n' +
'  <div class="vt-stub">\n' +
'    <div class="vt-stub-inner">\n' +
'      <div class="vt-stub-route"><h2>' + codeFrom + '</h2><span>' + icon + '</span><h2>' + rightLabel + '</h2></div>\n' +
'      <div class="vt-stub-fields">' + fieldsStubHTML + '</div>\n' +
'      <svg class="vt-barcode" viewBox="0 0 92 25" xmlns="http://www.w3.org/2000/svg" stroke="#164E63"><line style="stroke-width:1" x1="0.5" y1="0" x2="0.5" y2="30"/><line style="stroke-width:2" x1="3" y1="0" x2="3" y2="30"/><line style="stroke-width:1" x1="6.5" y1="0" x2="6.5" y2="30"/><line style="stroke-width:1" x1="9.5" y1="0" x2="9.5" y2="30"/><line style="stroke-width:1" x1="11.5" y1="0" x2="11.5" y2="30"/><line style="stroke-width:2" x1="14" y1="0" x2="14" y2="30"/><line style="stroke-width:1" x1="16.5" y1="0" x2="16.5" y2="30"/><line style="stroke-width:1" x1="19.5" y1="0" x2="19.5" y2="30"/><line style="stroke-width:1" x1="21.5" y1="0" x2="21.5" y2="30"/><line style="stroke-width:1" x1="23.5" y1="0" x2="23.5" y2="30"/><line style="stroke-width:1" x1="26.5" y1="0" x2="26.5" y2="30"/><line style="stroke-width:2" x1="29" y1="0" x2="29" y2="30"/><line style="stroke-width:1" x1="31.5" y1="0" x2="31.5" y2="30"/><line style="stroke-width:2" x1="35" y1="0" x2="35" y2="30"/><line style="stroke-width:1" x1="37.5" y1="0" x2="37.5" y2="30"/><line style="stroke-width:1" x1="39.5" y1="0" x2="39.5" y2="30"/><line style="stroke-width:2" x1="42" y1="0" x2="42" y2="30"/><line style="stroke-width:1" x1="44.5" y1="0" x2="44.5" y2="30"/><line style="stroke-width:1" x1="47.5" y1="0" x2="47.5" y2="30"/><line style="stroke-width:1" x1="49.5" y1="0" x2="49.5" y2="30"/><line style="stroke-width:1" x1="51.5" y1="0" x2="51.5" y2="30"/><line style="stroke-width:1" x1="54.5" y1="0" x2="54.5" y2="30"/><line style="stroke-width:2" x1="57" y1="0" x2="57" y2="30"/><line style="stroke-width:1" x1="59.5" y1="0" x2="59.5" y2="30"/><line style="stroke-width:1" x1="61.5" y1="0" x2="61.5" y2="30"/><line style="stroke-width:1" x1="64.5" y1="0" x2="64.5" y2="30"/><line style="stroke-width:2" x1="67" y1="0" x2="67" y2="30"/><line style="stroke-width:1" x1="69.5" y1="0" x2="69.5" y2="30"/><line style="stroke-width:1" x1="71.5" y1="0" x2="71.5" y2="30"/><line style="stroke-width:2" x1="75" y1="0" x2="75" y2="30"/><line style="stroke-width:1" x1="77.5" y1="0" x2="77.5" y2="30"/><line style="stroke-width:1" x1="79.5" y1="0" x2="79.5" y2="30"/><line style="stroke-width:1" x1="81.5" y1="0" x2="81.5" y2="30"/><line style="stroke-width:1" x1="83.5" y1="0" x2="83.5" y2="30"/><line style="stroke-width:2" x1="87" y1="0" x2="87" y2="30"/><line style="stroke-width:1" x1="90.5" y1="0" x2="90.5" y2="30"/></svg>\n' +
'    </div>\n' +
'  </div>\n' +
'</main>\n' +
'<button class="vt-tear-btn" id="vt-tear-btn" title="Separar resguardo" aria-label="Separar resguardo">&#9986;</button>\n' +
'</div>\n' +
'<script>\n' +
'(function(){\n' +
'  var btn = document.getElementById("vt-tear-btn");\n' +
'  var wrap = document.getElementById("vt-wrap");\n' +
'  btn.addEventListener("click", function() { wrap.classList.add("torn"); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'viewing-appointment-ticket',
        name: 'Ticket de Evento',
        icon: '🎫',
        description: 'Tarjeta estilo tarjeta de embarque, genérica para viajes, conciertos, eventos o visitas — icono de transporte configurable (avión/coche/tren/personas), 4 campos personalizables, y un botón de tijeras que separa físicamente el resguardo troquelado del cuerpo del ticket',
        sourceUrl: 'https://gist.github.com/Juanmaes83/407ac08fe8213121c4984a89860bbba8',
        build: build
    });
})();
