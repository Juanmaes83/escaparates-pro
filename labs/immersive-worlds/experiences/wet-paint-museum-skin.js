/**
 * Museum re-skin for the Wet Paint donor.
 *
 * The donor keeps ALL of its real controls, events, sliders, tabs, Growth, modes
 * and logic. This layer only changes what the visitor perceives: it injects a
 * Museum-palette stylesheet into the donor document, relabels every visible
 * string into Spanish, and hides the donor's shell (branding, credits, export,
 * source/library chrome, technical read-outs). No donor file is edited; this is
 * runtime skinning of the live document, same discipline as the Habitación 3
 * guest neutralising a call on its own instance.
 *
 *   TECHNOLOGY + CONTROLS stay the donor's.  SKIN + LANGUAGE become Museum's.
 */

// data-i18n key → Spanish. Only the controls the experience keeps are listed;
// everything not kept is hidden by CSS below.
export const SPANISH_I18N = Object.freeze({
    growthControl: 'Crecimiento',
    restartGrowth: 'Reproducir crecimiento',
    growthTimeline: 'Línea de tiempo',
    pause: 'Pausa',
    display: 'Visualización',
    brushOnly: 'Solo pinceladas',
    beigeCanvas: 'Lienzo',
    original: 'Original',
    noStrokes: 'Sin pinceladas',
    brushAndOriginal: 'Mezcla',
    blendedView: 'Pinceladas + original',
    flowSketch: 'Boceto de flujo',
    pencilFlow: 'Líneas de dirección',
    brushLayers: 'Capas de pincel',
    coarse: 'Gruesa',
    structure: 'Estructura',
    medium: 'Media',
    shaping: 'Forma',
    fine: 'Fina',
    texture: 'Textura',
    strokeEffects: 'Efecto de pincelada',
    previewQuality: 'Calidad',
    qualityBalanced: 'Fluida',
    qualityHigh: 'Alta',
    qualityUltra: 'Máxima',
    strokeSize: 'Tamaño de trazo',
    strokeLength: 'Longitud de trazo',
    strokeCount: 'Número de trazos',
    paintThickness: 'Empaste',
    paintDryness: 'Sequedad',
    paintViscosity: 'Viscosidad',
});

// Museum tokens (from authoring/studio.css): ground #100f0e, raise #1a1917,
// ink #ece7dd, dim #9a9389, accent #bfa06a, line rgba(226,219,205,.14).
const MUSEUM_SKIN_CSS = `
:root {
  --wp-ground:#100f0e; --wp-raise:#1a1917; --wp-ink:#ece7dd; --wp-dim:#9a9389;
  --wp-faint:#6f6960; --wp-accent:#bfa06a; --wp-accent-soft:rgba(191,160,106,.13);
  --wp-line:rgba(226,219,205,.14); --wp-line-strong:rgba(226,219,205,.30);
  --wp-sans:'Helvetica Neue', Inter, system-ui, Arial, sans-serif;
}
html, body, #app, .stage, #canvas-mount {
  background:var(--wp-ground) !important;
  color:var(--wp-ink) !important;
  font-family:var(--wp-sans) !important;
}
/* Stable Museum layout: canvas fills, a fixed control column on the right. The
   donor's resizer/grid can collapse the panel inside a nested frame — pin it. */
#app {
  grid-template-columns: minmax(0, 1fr) 0px 420px !important;
  --panel-width: 420px !important;
}
#control-panel, .panel {
  width:420px !important; min-width:420px !important; max-width:420px !important;
  overflow-y:auto !important; overflow-x:hidden !important;
}
/* Panel → Museum surface */
#control-panel, .panel {
  background:var(--wp-ground) !important;
  color:var(--wp-ink) !important;
  border-left:1px solid var(--wp-line) !important;
  font-family:var(--wp-sans) !important;
}
.panel-section {
  background:var(--wp-raise) !important;
  border:1px solid var(--wp-line) !important;
  border-radius:10px !important;
  margin:10px !important;
  color:var(--wp-ink) !important;
}
.panel-section strong, .panel-section b, .panel-section span, .panel-section small,
.panel-section legend, .panel-section label, .panel-section output, .panel-section select {
  color:var(--wp-ink) !important;
  font-family:var(--wp-sans) !important;
}
.panel-section small, .section-heading small { color:var(--wp-dim) !important; }
/* Buttons → Museum */
#control-panel button, .panel button {
  background:transparent !important;
  color:var(--wp-ink) !important;
  border:1px solid var(--wp-line-strong) !important;
  border-radius:999px !important;
  font-family:var(--wp-sans) !important;
  letter-spacing:.04em;
}
#control-panel button:hover, .panel button:hover { background:rgba(236,231,221,.08) !important; }
#control-panel button.accent, #control-panel [aria-pressed="true"], .panel [aria-pressed="true"] {
  background:var(--wp-accent-soft) !important;
  border-color:var(--wp-accent) !important;
  color:var(--wp-ink) !important;
}
/* Selected radio/tab choices → Museum accent */
.layer-tabs input:checked + .layer-choice,
.brush-layer-switch-grid input:checked + .brush-layer-toggle {
  background:var(--wp-accent-soft) !important;
  border-color:var(--wp-accent) !important;
}
.layer-choice, .brush-layer-toggle {
  background:var(--wp-ground) !important;
  border:1px solid var(--wp-line) !important;
  color:var(--wp-ink) !important;
}
/* Sliders → Museum accent */
#control-panel input[type="range"], .panel input[type="range"] { accent-color:var(--wp-accent) !important; }
#control-panel select, .panel select {
  background:var(--wp-ground) !important; color:var(--wp-ink) !important;
  border:1px solid var(--wp-line-strong) !important; border-radius:8px !important;
}
/* HIDE the donor shell entirely (branding, language, source/library, export, credits, probes) */
.panel-head, #language-toggle, #source-controls, #output-controls,
.signature-credit, .runtime-probes, #growth-progress, #panel-resizer,
#model-light-control, #stroke-count, #source-mode, #source-meta,
.visually-hidden { display:none !important; }
`;

function relabel(doc) {
    // Text nodes carrying a data-i18n key → Spanish. Only keys we kept; unknown
    // keys are left (their sections are hidden anyway).
    doc.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (SPANISH_I18N[key] != null) el.textContent = SPANISH_I18N[key];
    });
    // <option> labels carry data-i18n too; textContent already handled above.
    // Panel section headings that use data-i18n are covered; nothing else visible
    // remains once the shell sections are hidden.
}

/**
 * Apply the Museum skin to a donor iframe. Idempotent; also re-applies on the
 * donor's own dynamic re-renders (it rewrites some labels on updates) via a
 * lightweight observer so no Chinese/English can reappear.
 */
export function applyMuseumSkin(iframe) {
    const doc = iframe.contentDocument;
    if (!doc || !doc.head) return false;

    if (!doc.getElementById('wp-museum-skin')) {
        const style = doc.createElement('style');
        style.id = 'wp-museum-skin';
        style.textContent = MUSEUM_SKIN_CSS;
        doc.head.appendChild(style);
    }
    relabel(doc);

    if (!iframe.__wpSkinObserver) {
        const obs = new MutationObserver(() => {
            // Keep Spanish labels if the donor re-renders a control's text.
            relabel(doc);
        });
        try {
            obs.observe(doc.body, { childList: true, subtree: true, characterData: true });
            iframe.__wpSkinObserver = obs;
        } catch { /* noop */ }
    }
    return true;
}
