/**
 * Verify the reviewer-local launch procedure before it is handed to a human.
 *
 * The Human QA Navigable Runtime Protocol requires that the launch path given to
 * Juanma be verified "as far as the environment allows", and that Claude state
 * what was actually checked. It also forbids handing over a container localhost
 * as if it were his machine.
 *
 * So this does not test the bespoke QA server used elsewhere in this folder. It
 * starts the *same plain static server* the instructions tell Juanma to run,
 * against the same document root, and then walks the real product path:
 *
 *   load → enter → canvas painting → open Visitor → close → start the guided
 *   route from its own button → the crossing actually flies → Gallery A
 *
 * Every step is the visitor's, not a runtime internal: the Enter control, the
 * "Visita" button and the "Recorrido comentado" button. A launch procedure that
 * only works when driven through `window.__IW` is not a navigable runtime.
 *
 *   node qa/tools/human-qa-access-check.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'human-qa-access');
const PORT = Number(process.env.IW_HQA_PORT || 8080);

await fs.mkdir(OUT, { recursive: true });

const checks = [];
const say = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FALLO'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/* The literal command handed to the reviewer, run here against the same root. */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', MODULE_ROOT], {
  stdio: ['ignore', 'ignore', 'pipe']
});
const serverErrors = [];
server.stderr.on('data', (b) => serverErrors.push(String(b)));
await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

const URL_ROOT = `http://127.0.0.1:${PORT}/`;
try {
  const response = await page.goto(URL_ROOT, { waitUntil: 'load' });
  say('la URL responde', Boolean(response) && response.status() === 200, `HTTP ${response?.status()}`);

  // ES modules over a plain static server: the one thing that silently breaks
  // when a server sends the wrong content type for .js.
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  say('el runtime arranca (window.__IW.ready)', true, 'módulos ES servidos correctamente');

  const boot = await page.evaluate(() => ({
    error: document.documentElement.dataset.iwError || null,
    tier: window.__IW?.tier || null,
    version: window.__IW?.version || null
  }));
  say('sin error de arranque', !boot.error, boot.error || `versión ${boot.version}, tier ${boot.tier}`);

  await page.screenshot({ path: path.join(OUT, '01-loading.png') });

  /* A — entrar */
  await page.locator('[data-el="enter"]').click({ timeout: 120000 });
  await page.waitForFunction(() => {
    const veil = window.__IW?.hud?.el?.veil;
    return veil && (veil.hidden || veil.classList.contains('is-gone'));
  }, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const painting = await page.evaluate(() => {
    const c = document.getElementById('iw-canvas');
    return { w: c?.width || 0, h: c?.height || 0 };
  });
  say('se puede entrar y el lienzo pinta', painting.w > 100, `${painting.w}×${painting.h}`);
  await page.screenshot({ path: path.join(OUT, '02-entered.png') });

  /* B — Visitor, por su propio botón */
  const visitBtn = page.locator('[data-el="visitBtn"]');
  const visitVisible = await visitBtn.isVisible().catch(() => false);
  say('el botón «Visita» está presente', visitVisible);
  if (visitVisible) {
    await visitBtn.click();
    await page.waitForTimeout(600);
    const open = await page.evaluate(() => {
      const v = document.querySelector('.iw-visit');
      const body = document.querySelector('[data-el="visitBody"]');
      return { shown: v && !v.hidden, text: (body?.textContent || '').trim().length };
    });
    say('Visitor abre con contenido real', open.shown && open.text > 100, `${open.text} caracteres`);
    await page.screenshot({ path: path.join(OUT, '03-visitor.png') });
    await page.locator('[data-el="visitClose"]').click();
    await page.waitForTimeout(400);
  }

  /* C — la transición, provocada como la provoca un visitante */
  const routeBtn = page.locator('[data-el="routeBtn"]');
  const routeLabel = (await routeBtn.textContent().catch(() => '')) || '';
  say('el botón del recorrido está presente', await routeBtn.isVisible().catch(() => false), routeLabel.trim());
  await routeBtn.click();

  await page.waitForFunction(
    () => window.__IW.runtime.experience.currentStep?.id === 'step.02-paso-galeria-a',
    null, { timeout: 120000 }
  );
  say('el recorrido alcanza el beat del portal', true, 'step.02-paso-galeria-a');

  const flew = await page.waitForFunction(
    () => window.__IW.runtime.crossing.isCrossing === true, null, { timeout: 30000 }
  ).then(() => true).catch(() => false);
  say('la travesía cinemática se ejecuta de verdad', flew, flew ? 'TRANSITION posee la cámara' : 'no se planificó travesía');
  await page.screenshot({ path: path.join(OUT, '04-crossing.png') });

  await page.waitForFunction(() => window.__IW.runtime.crossing.isCrossing === false, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const landed = await page.evaluate(() => window.__IW.runtime.state.activeSpaceId);
  say('se llega a la sala de destino', landed === 'space.gallery-a', landed);
  await page.screenshot({ path: path.join(OUT, '05-gallery-a.png') });

  say('sin errores de consola bloqueantes', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' · ') || 'ninguno');
} finally {
  await browser.close();
  server.kill();
}

const passed = checks.filter((c) => c.ok).length;
console.log(`\n${passed}/${checks.length} comprobaciones superadas`);
await fs.writeFile(path.join(OUT, 'human-qa-access-check.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  documentRoot: path.relative(REPO_ROOT, MODULE_ROOT),
  command: `python3 -m http.server ${PORT} --directory <repo>/${path.relative(REPO_ROOT, MODULE_ROOT)}`,
  url: URL_ROOT,
  checks, consoleErrors, serverErrors
}, null, 1));
process.exit(passed === checks.length ? 0 : 1);
