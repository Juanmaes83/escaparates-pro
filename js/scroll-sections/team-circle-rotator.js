// Team Circle Rotator — adapted from the CodePen gist "Tailwind - Team
// Profiles rotation with Theme Toggle" (source read & understood: avatars
// placed evenly around a ring via a `rotate(...) translate(radius)
// rotate(-...)` transform driven by `--i`/`--total` custom properties; a
// hidden radio per avatar drives a CSS-only "select" state that scales the
// clicked avatar's photo and reveals its name/role as text curved along a
// circular SVG textPath at the center, plus a light/dark theme toggle
// switch). Rebuilt in plain CSS (dropping the source's Tailwind arbitrary-
// variant syntax) with a small JS "uncheck on second click" hack kept as-is
// since CSS radios can't be toggled off natively. Framed as an agency's
// "Nuestro Equipo" section — one member per photo slot, name/role pairs
// editable from the panel.
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Nuestro Equipo';
        var members = (opts.members && opts.members.length ? opts.members : [
            { title: 'Marta García', year: 'Directora Comercial' },
            { title: 'Javier Ruiz', year: 'Agente Senior' },
            { title: 'Lucía Fernández', year: 'Asesora Inmobiliaria' },
            { title: 'Daniel Ortega', year: 'Fotografía y Marketing' },
            { title: 'Sara Molina', year: 'Atención al Cliente' },
            { title: 'Carlos Vidal', year: 'Tasaciones' }
        ]).map(function(m) { return { name: m.title || '', role: m.year || '' }; });
        var total = members.length;
        var media = EP.ScrollSections.fillMedia(mediaList, total);

        var avatarsHTML = members.map(function(m, i) {
            var photo = media[i] ? media[i].url : ('https://i.pravatar.cc/300?img=' + (i * 7 + 3));
            return '' +
'<input type="radio" name="team-avatar" id="team-avatar-' + i + '" class="sr-only">\n' +
'<label for="team-avatar-' + i + '" class="tc-avatar" style="--i:' + (i + 1) + ';--total:' + total + '" data-name="' + m.name + '" data-role="' + m.role + '">\n' +
'  <img src="' + photo + '" alt="' + m.name + '">\n' +
'</label>';
        }).join('\n    ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Equipo</title>\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;}\n' +
'body{margin:0;min-height:100vh;display:grid;place-content:center;background:#e6f3fb;font-family:Arial,Helvetica,sans-serif;transition:background 0.5s;position:relative;overflow:hidden;}\n' +
'body.tc-dark{background:#0b1a24;}\n' +
'.tc-ring{--radius:min(38vw,14rem);position:relative;width:calc(var(--radius) * 2 + 6rem);height:calc(var(--radius) * 2 + 6rem);border-radius:50%;display:grid;place-content:center;}\n' +
'.tc-center{position:absolute;inset:0;margin:auto;width:9rem;height:9rem;background:#0284c7;border:1px solid rgba(255,255,255,0.4);border-radius:50%;display:grid;place-content:center;text-align:center;color:#e0f2fe;text-transform:uppercase;letter-spacing:0.05em;font-size:1rem;padding:1rem;transition:background 0.4s;}\n' +
'body.tc-dark .tc-center{background:#075985;}\n' +
'.tc-avatar{grid-area:1/1;width:5.5rem;height:5.5rem;border-radius:50%;position:relative;cursor:pointer;transform:rotate(calc((1turn * (var(--i) / var(--total))) - 0.15turn)) translate(var(--radius)) rotate(calc(-1 * ((1turn * (var(--i) / var(--total))) - 0.15turn)));transition:transform 0.6s cubic-bezier(0.34,1.2,0.4,1);}\n' +
'.tc-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;box-shadow:0 6px 20px rgba(0,0,0,0.25);transition:transform 0.6s ease;display:block;}\n' +
'input:checked + .tc-avatar img{transform:scale(1.12);box-shadow:0 10px 30px rgba(0,0,0,0.4);}\n' +
'.tc-caption{position:absolute;bottom:-2.5rem;left:50%;transform:translateX(-50%);text-align:center;opacity:0;transition:opacity 0.4s;pointer-events:none;width:16rem;}\n' +
'.tc-caption.show{opacity:1;}\n' +
'.tc-caption h3{margin:0;font-size:1rem;color:#0369a1;}\n' +
'body.tc-dark .tc-caption h3{color:#7dd3fc;}\n' +
'.tc-caption p{margin:0.15rem 0 0;font-size:0.75rem;color:#64748b;}\n' +
'.tc-toggle{position:fixed;top:1.5rem;left:1.5rem;width:3.4rem;height:1.8rem;border-radius:999px;background:#cbd5e1;border:none;cursor:pointer;position:relative;transition:background 0.3s;}\n' +
'.tc-toggle::after{content:"";position:absolute;top:0.15rem;left:0.15rem;width:1.5rem;height:1.5rem;border-radius:50%;background:#fff;transition:transform 0.3s;}\n' +
'body.tc-dark .tc-toggle{background:#334155;}\n' +
'body.tc-dark .tc-toggle::after{transform:translateX(1.6rem);}\n' +
'.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}\n' +
'@media (max-width:640px){.tc-ring{--radius:min(30vw,9rem);}.tc-avatar{width:3.6rem;height:3.6rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<button class="tc-toggle" id="tc-theme-toggle" aria-label="Cambiar modo claro/oscuro"></button>\n' +
'<div class="tc-ring">\n' +
'  <div class="tc-center">' + title + '</div>\n' +
'  ' + avatarsHTML + '\n' +
'  <div class="tc-caption" id="tc-caption"><h3 id="tc-caption-name"></h3><p id="tc-caption-role"></p></div>\n' +
'</div>\n' +
'<script>\n' +
'(function(){\n' +
'  document.querySelectorAll(\'input[name="team-avatar"]\').forEach(function(radio) {\n' +
'    radio.addEventListener("click", function(e) {\n' +
'      var wasChecked = radio.dataset.wasChecked === "1";\n' +
'      if (wasChecked) {\n' +
'        e.preventDefault();\n' +
'        setTimeout(function() { radio.checked = false; radio.dataset.wasChecked = "0"; updateCaption(null); }, 0);\n' +
'      } else {\n' +
'        document.querySelectorAll(\'input[name="team-avatar"]\').forEach(function(r) { r.dataset.wasChecked = "0"; });\n' +
'        setTimeout(function() { radio.dataset.wasChecked = "1"; }, 0);\n' +
'      }\n' +
'    });\n' +
'    radio.addEventListener("change", function() {\n' +
'      if (radio.checked) {\n' +
'        var label = document.querySelector(\'label[for="\' + radio.id + \'"]\');\n' +
'        updateCaption(label);\n' +
'      }\n' +
'    });\n' +
'  });\n' +
'  function updateCaption(label) {\n' +
'    var caption = document.getElementById("tc-caption");\n' +
'    if (!label) { caption.classList.remove("show"); return; }\n' +
'    document.getElementById("tc-caption-name").textContent = label.getAttribute("data-name");\n' +
'    document.getElementById("tc-caption-role").textContent = label.getAttribute("data-role");\n' +
'    caption.classList.add("show");\n' +
'  }\n' +
'  document.getElementById("tc-theme-toggle").addEventListener("click", function() {\n' +
'    document.body.classList.toggle("tc-dark");\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'team-circle-rotator',
        name: 'Equipo en Círculo',
        icon: '🧑‍🤝‍🧑',
        description: 'Fotos del equipo dispuestas en anillo; al hacer clic en una, se agranda y aparece su nombre y cargo — incluye selector de modo claro/oscuro; encaje directo para una sección "Nuestro Equipo / Agentes"',
        sourceUrl: 'https://gist.github.com/Juanmaes83/b94119ab1d489ee3616e521b95d1a29f',
        build: build
    });
})();
