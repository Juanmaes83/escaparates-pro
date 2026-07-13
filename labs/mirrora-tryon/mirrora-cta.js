/* ================================================================
   MIRRORA CTA — widget "Pruébatelo en tu móvil" (Fase 2, lado emisor)
   Bloque flotante con QR de handoff hacia la PWA MIRRORA Style Studio.

   Contrato: el QR transporta SOLO identidad de campaña/marca/look
   (schema mirrora-handoff/v0.1). Nunca datos personales ni faciales.

   Requiere qrcode.js (qrcode-generator, MIT) cargado antes.

   Uso 1 — auto-mount por atributos:
     <script src="qrcode.js"></script>
     <script src="mirrora-cta.js"
        data-base-url="https://mirrora.example.com/"
        data-brand="maison-demo" data-campaign="ss26-bolsos"
        data-look="" data-source="escaparate"
        data-label="Pruébatelo en tu móvil"
        data-position="bottom-right" data-accent="#b08d4f"></script>

   Uso 2 — manual:
     MirroraCTA.mount({ baseUrl, brand, campaign, look, source, label,
                        position, accent, container })
   ================================================================ */
(function () {
  "use strict";

  function handoffURL(o) {
    var u = new URL(o.baseUrl);
    u.searchParams.set("schema", "mirrora-handoff/v0.1");
    u.searchParams.set("brand", o.brand);
    u.searchParams.set("campaign", o.campaign);
    if (o.look) u.searchParams.set("look", o.look);
    u.searchParams.set("source", o.source || "escaparate");
    return u.toString();
  }

  function qrSvg(text, cellSize) {
    var qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: cellSize || 4, margin: 4, scalable: true });
  }

  var POS = {
    "bottom-right": "right:24px;bottom:24px;",
    "bottom-left": "left:24px;bottom:24px;",
    "top-right": "right:24px;top:24px;",
    "top-left": "left:24px;top:24px;"
  };

  function mount(o) {
    if (!window.qrcode) {
      console.warn("[mirrora-cta] falta qrcode.js");
      return null;
    }
    o = o || {};
    o.baseUrl = o.baseUrl || "https://mirrora.example.com/";
    o.brand = o.brand || "maison-demo";
    o.campaign = o.campaign || "campaign";
    o.label = o.label || "Pruébatelo en tu móvil";
    o.accent = o.accent || "#b08d4f";
    o.position = POS[o.position] ? o.position : "bottom-right";

    var el = document.createElement("aside");
    el.setAttribute("aria-label", o.label);
    el.style.cssText =
      "position:fixed;" + POS[o.position] + "z-index:9990;" +
      "display:flex;flex-direction:column;align-items:center;gap:10px;" +
      "padding:18px 20px 14px;border-radius:16px;" +
      "background:rgba(12,12,14,.88);backdrop-filter:blur(10px);" +
      "border:1px solid " + o.accent + "55;" +
      "box-shadow:0 18px 50px rgba(0,0,0,.45);" +
      "font-family:Georgia,'Times New Roman',serif;color:#f4efe7;" +
      "max-width:200px;text-align:center;";

    var qrWrap = document.createElement("div");
    qrWrap.style.cssText = "background:#fff;border-radius:10px;padding:6px;line-height:0;width:140px;";
    qrWrap.innerHTML = qrSvg(handoffURL(o));
    var svg = qrWrap.querySelector("svg");
    if (svg) { svg.style.width = "100%"; svg.style.height = "auto"; }

    var label = document.createElement("p");
    label.textContent = o.label;
    label.style.cssText = "margin:0;font-size:15px;font-style:italic;letter-spacing:.03em;";

    var brandLine = document.createElement("p");
    brandLine.textContent = "MIRRORA Style Studio";
    brandLine.style.cssText =
      "margin:0;font-family:system-ui,sans-serif;font-size:9px;" +
      "letter-spacing:.34em;text-transform:uppercase;color:" + o.accent + ";";

    el.appendChild(label);
    el.appendChild(qrWrap);
    el.appendChild(brandLine);
    (o.container || document.body).appendChild(el);
    return el;
  }

  window.MirroraCTA = { mount: mount, handoffURL: handoffURL, qrSvg: qrSvg };

  // Auto-mount si el script trae data-attributes
  var s = document.currentScript;
  if (s && s.dataset && s.dataset.brand) {
    var boot = function () {
      mount({
        baseUrl: s.dataset.baseUrl,
        brand: s.dataset.brand,
        campaign: s.dataset.campaign,
        look: s.dataset.look,
        source: s.dataset.source,
        label: s.dataset.label,
        position: s.dataset.position,
        accent: s.dataset.accent
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})();
