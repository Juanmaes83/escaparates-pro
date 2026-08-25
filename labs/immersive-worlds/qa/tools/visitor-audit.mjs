/**
 * Photograph the Visitor surface as it stands today, before touching it.
 *
 * Juanma's verdict on this layer is precise: the FUNCTION is kept, the VISUAL
 * DESIGN is rejected. Presentation, composition and responsive behaviour are the
 * defect; the data model is not. So the first job is not to redesign anything —
 * it is to look, at the four widths a real visitor arrives at, with the real
 * Museum's own words in it rather than placeholder text.
 *
 * It also measures the things a screenshot argues about: how many stacked
 * sections there are, whether the essential three (hours, location, primary
 * action) are reachable without scrolling, and how much of the panel is
 * above the fold. Those numbers are what turn "it looks like a database dump"
 * from an opinion into a finding.
 *
 *   node qa/tools/visitor-audit.mjs
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
const LABEL = process.env.IW_LABEL || 'current';
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'visitor-design', LABEL);
const PORT = Number(process.env.IW_VA_PORT || 5160);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

/** The widths the mandate names, plus what each one is meant to prove. */
const VIEWPORTS = [
  { id: 'desktop', label: 'Escritorio 1440×900', width: 1440, height: 900 },
  { id: 'laptop', label: 'Portátil 1280×800', width: 1280, height: 800 },
  { id: 'mobile', label: 'Móvil 390×844', width: 390, height: 844 },
  { id: 'small', label: 'Móvil pequeño 360×800', width: 360, height: 800 }
];

await fs.mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });

/**
 * What the panel is actually made of, measured rather than described.
 *
 * `overflow` is the honest version of "does it fit": the panel scrolls, so a
 * section can exist and still be invisible to someone who never scrolls. The
 * three `reachable` flags ask specifically about the things the mandate forbids
 * hiding — opening hours, where the place is, and the primary call to action.
 */
const MEASURE = () => {
  const panel = document.querySelector('.iw-visit__panel');
  if (!panel) return { present: false };
  const body = document.querySelector('[data-el="visitBody"]');
  // Whichever element actually scrolls. The redesign moves scrolling off the
  // panel and onto an inner column, and an audit that keeps measuring the panel
  // would report zero overflow for a layout that still overflows — flattering
  // the thing it is meant to check.
  const scroller = [panel, body, ...body.querySelectorAll('*')]
    .find((el) => el.scrollHeight - el.clientHeight > 2) || panel;
  const sections = [...body.querySelectorAll('.iw-visit__fact, :scope > section')];
  const panelBox = panel.getBoundingClientRect();
  const visibleBottom = panelBox.top + panel.clientHeight;
  const reach = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), visible: r.top >= panelBox.top - 1 && r.bottom <= visibleBottom + 1 };
  };
  const headings = sections.map((s) => s.querySelector('h3')?.textContent?.trim() || '');
  const byHeading = (needle) => sections.find((s) => (s.querySelector('h3')?.textContent || '').toLowerCase().includes(needle)) || null;
  // The action bar left the body in the redesign. Looking in both places is what
  // stops the audit reporting "no CTA" for a CTA that is pinned on screen.
  const foot = document.querySelector('[data-el="visitFoot"]');
  const cta = foot?.querySelector('a') || body.querySelector('.iw-visit__cta a');
  return {
    present: true,
    panel: { width: Math.round(panelBox.width), height: Math.round(panelBox.height) },
    scroller: { tag: scroller.className || scroller.tagName, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight },
    overflowPx: Math.max(0, scroller.scrollHeight - scroller.clientHeight),
    sections: sections.length,
    headings,
    programmeItems: body.querySelectorAll('.iw-visit__prog li').length,
    ctaCount: (foot?.querySelectorAll('a').length || 0) + body.querySelectorAll('.iw-visit__cta a').length,
    reachable: {
      hours: reach(byHeading('horario')),
      address: reach(byHeading('direcci')),
      primaryCta: reach(cta)
    },
    // The visitor's own words, so the board cannot be built on lorem ipsum
    // without that being obvious in the evidence itself.
    firstWords: (body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  };
};

const report = { generatedAt: new Date().toISOString(), label: LABEL, viewports: [] };

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(300000);
  await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.locator('[data-el="enter"]').click({ timeout: 120000 });
  await page.waitForFunction(() => {
    const veil = window.__IW?.hud?.el?.veil;
    return veil && (veil.hidden || veil.classList.contains('is-gone'));
  }, { timeout: 60000 });
  await page.waitForTimeout(1500);

  // The room itself, so the board shows what the panel is laid over.
  await page.screenshot({ path: path.join(OUT, `${vp.id}-00-room.png`) });

  // Open it the way a visitor does — the button, not the method.
  const btn = page.locator('[data-el="visitBtn"]');
  const hasButton = await btn.isVisible().catch(() => false);
  if (!hasButton) {
    report.viewports.push({ ...vp, error: 'el botón Visita no está visible' });
    console.log(`${vp.label}: FALLO — el botón Visita no está visible`);
    await page.close();
    continue;
  }
  await btn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(OUT, `${vp.id}-01-overview.png`) });
  const top = await page.evaluate(MEASURE);

  // Scrolled to the programme, because a section nobody scrolls to is still part
  // of the design and has to be looked at.
  const scrolled = await page.evaluate(() => {
    const panel = document.querySelector('.iw-visit__panel');
    const body = document.querySelector('[data-el="visitBody"]');
    const prog = document.querySelector('.iw-visit__prog');
    if (!panel || !prog) return false;
    const scroller = [panel, body, ...body.querySelectorAll('*')]
      .find((el) => el.scrollHeight - el.clientHeight > 2) || panel;
    scroller.scrollTop += prog.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24;
    return true;
  });
  await page.waitForTimeout(300);
  if (scrolled) await page.screenshot({ path: path.join(OUT, `${vp.id}-02-programme.png`) });

  // The bottom, where the CTA and the long-tail fields ended up.
  await page.evaluate(() => {
    const panel = document.querySelector('.iw-visit__panel');
    const body = document.querySelector('[data-el="visitBody"]');
    const scroller = [panel, body, ...body.querySelectorAll('*')]
      .find((el) => el.scrollHeight - el.clientHeight > 2) || panel;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${vp.id}-03-end.png`) });

  report.viewports.push({ ...vp, ...top });
  const r = top.reachable || {};
  console.log(`${vp.label}: ${top.sections} secciones · panel ${top.panel?.width}×${top.panel?.height} · desbordamiento ${top.overflowPx}px`);
  console.log(`   sin desplazar → horarios ${r.hours?.visible ? 'sí' : 'NO'} · dirección ${r.address?.visible ? 'sí' : 'NO'} · CTA ${r.primaryCta?.visible ? 'sí' : 'NO'}`);
  await page.close();
}

await fs.writeFile(path.join(OUT, 'visitor-audit.json'), JSON.stringify(report, null, 1));
console.log(`\n${path.relative(REPO_ROOT, OUT)}`);
await browser.close();
server.close();
