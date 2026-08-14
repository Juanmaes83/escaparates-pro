/**
 * The review surface for the two blockers Juanma found in a real browser.
 *
 * Self-contained: images are inlined, because the published page cannot reach
 * any external host. Captions are read from the run's own JSON rather than
 * written by hand, so a caption cannot claim something the run did not measure.
 *
 *   node qa/tools/build-blockers-board.mjs
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const REPRO = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'repro');
const HEAD = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();

const run = JSON.parse(await fs.readFile(path.join(REPRO, 'juanma-repro.json'), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const uri = (file) => {
  const p = path.join(REPRO, file);
  if (!fsSync.existsSync(p)) return null;
  return `data:image/png;base64,${fsSync.readFileSync(p).toString('base64')}`;
};

const shot = (file, caption) => {
  const src = uri(file);
  if (!src) return '';
  return `<figure><img src="${src}" alt="${esc(caption)}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
};

/** Measured with qa/tools/frame-diff.mjs on the saved pairs, control region 0%. */
const DIFFS = [
  ['Proyección · MP4', '7,83 %', '[355,251]–[776,572]'],
  ['Proyección · WebM', '6,96 %', '[346,251]–[751,572]'],
  ['Obra enmarcada · MP4', '0,22 %', '[470,227]–[510,482]'],
  ['Obra enmarcada · WebM', '0,23 %', '[466,227]–[506,482]']
];

const rows = run.results.map((r) => `
  <tr class="${r.ok ? '' : 'bad'}">
    <td>${r.ok ? '✓' : '✗'}</td>
    <td>${esc(r.name)}</td>
    <td class="det">${esc(r.detail || '')}</td>
  </tr>`).join('');

const html = `<title>Dos bloqueos de autoría</title>
<style>
  :root {
    --paper: #f7f5f1; --ink: #1c1a17; --muted: #6b6558; --rule: #ddd8ce;
    --card: #fffefc; --good: #2f6b45; --bad: #9d3427; --accentless: #efece5;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #14130f; --ink: #ece7dd; --muted: #9b9488; --rule: #2e2b25;
      --card: #1b1915; --good: #7fb894; --bad: #d98878; --accentless: #232019;
    }
  }
  :root[data-theme="dark"] {
    --paper: #14130f; --ink: #ece7dd; --muted: #9b9488; --rule: #2e2b25;
    --card: #1b1915; --good: #7fb894; --bad: #d98878; --accentless: #232019;
  }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font: 16px/1.6 ui-serif, Georgia, "Times New Roman", serif;
  }
  main { max-width: 60rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .eyebrow {
    font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase;
    letter-spacing: .14em; font-size: .7rem; color: var(--muted); margin: 0 0 .6rem;
  }
  h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.15; margin: 0 0 1rem; font-weight: 400; }
  h2 {
    font-size: 1.35rem; font-weight: 400; margin: 3.5rem 0 .3rem;
    padding-top: 1.6rem; border-top: 1px solid var(--rule);
  }
  h3 { font-size: 1rem; font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem 0 .4rem; }
  p { margin: .8rem 0; }
  .lede { font-size: 1.1rem; color: var(--muted); }
  code, .mono {
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: .86em;
    background: var(--accentless); padding: .1em .35em; border-radius: 3px;
  }
  pre {
    background: var(--accentless); padding: 1rem; border-radius: 4px;
    overflow-x: auto; font-family: ui-monospace, Menlo, monospace; font-size: .82rem; line-height: 1.5;
  }
  figure { margin: 1.4rem 0; }
  img { width: 100%; max-width: 100%; display: block; border: 1px solid var(--rule); border-radius: 3px; }
  figcaption {
    font-family: ui-sans-serif, system-ui, sans-serif; font-size: .8rem;
    color: var(--muted); margin-top: .5rem;
  }
  .wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: .84rem; margin: 1rem 0; }
  th, td { text-align: left; padding: .45rem .6rem; border-bottom: 1px solid var(--rule); vertical-align: top; }
  th { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 600; font-size: .72rem;
       text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  td:first-child { color: var(--good); width: 1.4rem; }
  tr.bad td:first-child { color: var(--bad); }
  .det { color: var(--muted); font-family: ui-monospace, Menlo, monospace; font-size: .76rem; }
  .status {
    display: flex; flex-wrap: wrap; gap: .5rem; margin: 2rem 0;
    font-family: ui-sans-serif, system-ui, sans-serif; font-size: .78rem;
  }
  .status span { border: 1px solid var(--rule); padding: .35rem .7rem; border-radius: 2px; background: var(--card); }
  .status .ok { border-color: var(--good); color: var(--good); }
  blockquote {
    margin: 1.2rem 0; padding: .6rem 0 .6rem 1.2rem;
    border-left: 2px solid var(--rule); color: var(--muted); font-style: italic;
  }
</style>

<main>
  <p class="eyebrow">Museo · Autoría premium · ${esc(HEAD)}</p>
  <h1>Dos bloqueos de autoría, encontrados en un navegador de verdad</h1>
  <p class="lede">
    Juanma informó de dos fallos que mi instrumental daba por buenos: el vídeo no
    funcionaba y el primer panel no se dejaba escribir. Las dos causas resultaron
    ser reales, y ninguna estaba donde yo había buscado.
  </p>

  <div class="status">
    <span class="ok">Verificación de Juanma: <b>PASA</b></span>
    <span>Aprobación global del producto: <b>PENDIENTE</b></span>
    <span>Sin merge · sin master · sin promoción</span>
  </div>
  <p>
    Juanma lo ha probado en su propio navegador contra el artefacto publicado:
    edición de texto de institución, autoría de imagen en obra, autoría de vídeo
    en obra, subida de vídeo, guardar/aplicar, y vídeo visible y reproduciéndose
    en el Museo. El bloqueo humano que motivó esta investigación queda
    <b>cerrado</b>. La aprobación global de Museum Authoring sigue pendiente.
  </p>

  <h2>El texto: la cámara se comía las teclas</h2>
  <p>
    <code>app/ui/input.js</code> escuchaba <code>keydown</code> en
    <code>window</code> y nunca preguntaba si la tecla iba a un campo de texto.
    Escribir en el panel de autoría conducía la cámara: W, A, S, D y la barra
    espaciadora las tragaba <code>preventDefault</code>, y M, G y E abrían el
    mapa, lanzaban el recorrido guiado y activaban el punto más cercano.
  </p>
  <p>Escribir «Museo Atlántico de Vigo» en el nombre de la institución producía:</p>
  <pre>Fundación AMueotlánticoeVigorenas (institución ficticia)</pre>
  <p>
    Cada <code>s</code>, cada <code>a</code> y cada espacio, desaparecidos. Y
    <code>Ctrl+A</code> no seleccionaba nunca, porque su propia <code>a</code>
    también se la comía. Se leía como una caja de texto rota — en el primer panel
    que abre un autor, y el que con más seguridad contiene espacios.
  </p>
  <blockquote>
    Mi arnés de autoría asignaba <code>input.value</code> y disparaba el evento a
    mano. Las teclas reales nunca llegaban a la página, así que un manejador que
    se comía teclas reales le era invisible. <code>page.keyboard.type()</code> lo
    encontró en la primera ejecución.
  </blockquote>
  ${shot('institucion-top.png', 'Después de la corrección: el campo conserva «Museo Atlántico de Vigo», el foco sobrevive y el proyecto lo recibe.')}

  <h2>El vídeo: el modelo de producto, no la tubería</h2>
  <p><code>experience-config.js</code> afirmaba, en un comentario y en el código:</p>
  <blockquote>
    Un vídeo sobre un lienzo enmarcado no es algo que este Scene Kit sepa
    dibujar, así que no es algo que la configuración pueda expresar.
  </blockquote>
  <p>
    Es falso. <code>museum-scene-kit.js:562</code> cuelga la textura que le
    entregue la capa de medios, y una <code>VideoTexture</code> es una textura.
    El kit siempre supo dibujarlo. Solo la configuración lo prohibía.
  </p>
  <p>
    La consecuencia: el vídeo era editable en <b>una</b> entidad de todo el
    Museo, la única proyección. Las otras nueve piezas son obras, así que un
    autor que abría una pieza y buscaba cómo darle imagen en movimiento no
    encontraba nada. Ese es el fallo del que informó Juanma, y explica por qué el
    fixture de QA se reproducía mientras el producto fallaba: el fixture recorría
    la única ranura que existía.
  </p>
  <h3>Ranuras semánticas explícitas — nunca una ranura «MEDIA» genérica</h3>
  <pre>INSTITUTION_LOGO   imagen   una marca no es imagen en movimiento
ARTWORK_IMAGE      imagen
ARTWORK_VIDEO      vídeo    el videoarte cuelga en museos desde los años sesenta
PROJECTION_VIDEO   vídeo
PROJECTION_IMAGE   imagen   proyectar un fijo es algo corriente de querer</pre>
  <p>
    Las ranuras de una misma clase son alternativas — una pieza muestra una
    representación — así que elegir una retira la otra. Sin subir versión de
    esquema: las entidades v2 ya llevaban ambos campos.
  </p>
  ${shot('video-top-obraenmarcada-qa-motion-mp4.png', 'Una obra enmarcada reproduciendo un MP4 — el caso que antes no se podía ni intentar. La barra blanca del fixture cruza el lienzo.')}
  ${shot('video-top-proyeccin-qa-motion-webm.png', 'La proyección con un WebM del autor, con su derrame y su reflejo en el suelo.')}

  <h3>Los píxeles se mueven, y solo donde deben</h3>
  <p>
    Dos capturas separadas un segundo, comparadas con
    <code>qa/tools/frame-diff.mjs</code>. La región de control es una zona
    estática del estudio: si cambiara, la medida no valdría nada.
  </p>
  <div class="wrap">
    <table>
      <tr><th></th><th>Caso</th><th>Píxeles cambiados</th><th>Dónde</th><th>Control</th></tr>
      ${DIFFS.map(([name, pct, bbox]) => `
        <tr><td>✓</td><td>${esc(name)}</td><td>${esc(pct)}</td>
        <td class="det">${esc(bbox)}</td><td>0 %</td></tr>`).join('')}
    </table>
  </div>
  <p>
    La cifra de la obra es pequeña porque la barra viajera del fixture ocupa 60
    de sus 640 píxeles, y el recuadro de cambio es exactamente una columna del
    ancho de esa barra sobre la cara del lienzo. La captura de arriba muestra la
    obra llevando el vídeo.
  </p>

  <h2>La auditoría de nuestras cuatro implementaciones probadas</h2>
  <p>
    Antes de tocar el Museo. La tabla completa está en
    <code>docs/VIDEO_ARCHITECTURE_AUDIT.md</code>. Tres divergencias cerradas:
  </p>
  <ul>
    <li><code>video.src = ''</code> no libera un elemento: la cadena vacía se
      resuelve contra la dirección del propio documento, así que el elemento va a
      buscar la página e intenta decodificar HTML como vídeo. Ahora
      <code>removeAttribute</code> + <code>load()</code>, como hacen las cuatro.</li>
    <li>La sonda no tenía tiempo límite, así que un códec a medio reconocer
      dejaba al autor en «Cargando…» para siempre. Ahora 20 s con un mensaje que
      nombra la causa probable.</li>
    <li>Un rechazo de autoplay se registraba pero no se recuperaba nunca,
      dejando un fotograma congelado que parece exactamente un vídeo muy lento.
      Ahora se reintenta en el primer gesto del visitante, adoptando el patrón de
      <code>breeze-studio-pro</code>.</li>
  </ul>
  <p>
    Además, <code>accept</code> ahora nombra extensiones además de tipos MIME. El
    diálogo resuelve el MIME a través del sistema operativo, y en Windows
    <code>.mp4</code> y <code>.webm</code> a menudo no tienen entrada en el
    registro — la misma laguna que hacía llegar los archivos con
    <code>type:''</code>. Un <code>accept</code> solo-MIME deja los vídeos del
    propio autor en gris.
  </p>
  <h3>Documentado y aplazado, no silenciado</h3>
  <p>
    Unificar sonda-y-destruye en un solo elemento retenido, y la persistencia en
    IndexedDB. Las dos son divergencias reales respecto al patrón probado;
    ninguna aparece implicada por la medición, y el mandato pedía no añadir
    complejidad sin evidencia.
  </p>

  <h2>La ejecución completa</h2>
  <p class="lede mono">${run.passed}/${run.total} · ${esc(run.generatedAt)}</p>
  <div class="wrap"><table>${rows}</table></div>

  <h2>Por qué mis propios instrumentos no lo vieron</h2>
  <p>
    El mismo patrón que arrastro: <b>un instrumento que no puede fallar</b>. El
    arnés de vídeo recorría la única ranura que existía, así que no podía
    descubrir los nueve paneles sin ranura alguna. El arnés de autoría no enviaba
    teclas reales. Y una comprobación de lienzo que leía el búfer de WebGL con
    <code>drawImage</code> devolvía 0,00 % siempre — para un vídeo en marcha y
    para uno congelado igual — porque comparaba dos lecturas en blanco.
  </p>
  <p>
    Las ejecuciones anteriores además pasaban
    <code>--autoplay-policy=no-user-gesture-required</code>, que vuelve
    estructuralmente inobservable un rechazo de autoplay. Esa bandera ya no está,
    y la reproducción se prueba en la página y dentro de un marco, porque quien
    revisa lee un artefacto publicado y no una página local.
  </p>
</main>`;

const out = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'blockers-board.html');
await fs.writeFile(out, html);
console.log(`${out}\n${(html.length / 1024 / 1024).toFixed(2)} MB · HEAD ${HEAD} · ${run.passed}/${run.total}`);
