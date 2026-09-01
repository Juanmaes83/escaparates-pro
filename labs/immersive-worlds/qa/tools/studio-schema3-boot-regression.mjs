/**
 * Regression gate — Studio Schema 3 must survive save/reload without leaking
 * render implementation keys into the semantic World.
 *
 * Reproduces the real failure:
 *   persisted ConfigStore presentation.material -> reload -> authoredWorld -> INV-6
 *
 * Run from repo root:
 *   node labs/immersive-worlds/qa/tools/studio-schema3-boot-regression.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const PORT = Number(process.env.IW_SCHEMA3_BOOT_PORT || 4694);
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webm':'video/webm', '.glb':'model/gltf-binary' };

const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let file = path.resolve(REPO_ROOT, rel || 'index.html');
    if (!file.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'] });
const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
const persisted = {
  schemaVersion: 3,
  configId: 'qa_schema3_persisted',
  label: 'Schema 3 persisted presentation regression',
  institution: { name:'Fundación Arenas' },
  entities: {
    'entity.artwork.horizonte-interrumpido': {
      presentation: {
        frame:'oak-frame', mount:'paper', material:'oak', finish:'satin',
        glass:'museum-glass', passepartout:'warm-white', plinth:'none', mountingHeightCm:154
      }
    }
  }
};
await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
  key:'iw.museum.authoring.v1', value:persisted
});

const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'error' || /failed validation|INV-6/.test(text)) errors.push(text);
});

try {
  const url = `http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?authoring=1&portalVariant=D`;
  await page.goto(url, { waitUntil:'load', timeout:300000 });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout:300000 });

  const result = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('iw.museum.authoring.v1') || '{}');
    const entity = window.__IW?.runtime?.store?.get?.('entity.artwork.horizonte-interrumpido')
      || window.__IW?.runtime?.store?.entities?.find?.((e) => e.id === 'entity.artwork.horizonte-interrumpido');
    const forbidden = [];
    const keys = new Set(['mesh','geometry','material','materials','shader','texture','object3d','object3D','scene','renderer','threeObject','uniforms']);
    const scan = (value, path = 'entity', depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 8) return;
      for (const [key, child] of Object.entries(value)) {
        if (keys.has(key)) forbidden.push(`${path}.${key}`);
        scan(child, `${path}.${key}`, depth + 1);
      }
    };
    scan(entity);
    return {
      ready: window.__IW?.ready === true,
      savedMaterial: saved.entities?.['entity.artwork.horizonte-interrumpido']?.presentation?.material,
      runtimeForbidden: forbidden,
      runtimeMount: entity?.representation?.hints?.mount || null,
      runtimeTitle: entity?.content?.title || null
    };
  });

  const checks = [
    ['Museum boots after persisted Schema 3 config', result.ready],
    ['Studio persisted material is preserved', result.savedMaterial === 'oak'],
    ['No forbidden render key reaches runtime World', result.runtimeForbidden.length === 0],
    ['Supported mount intent reaches representation hints', result.runtimeMount === 'paper'],
    ['Canonical entity is present', Boolean(result.runtimeTitle)],
    ['No validation/page errors', errors.length === 0]
  ];
  for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (errors.length) console.error(errors.join('\n'));
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
