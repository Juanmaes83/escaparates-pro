import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

const API = 'https://escaparates-pro-api-phase2-staging-phase2-cloud.up.railway.app';
const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X0Y6WQAAAABJRU5ErkJggg==', 'base64');
const customTemplates = [
  ['real-estate-storytelling-custom-pro', 'Real Estate Storytelling'],
  ['product-storytelling-custom-pro', 'Product Storytelling'],
  ['luxury-real-estate-custom-pro', 'Luxury Real Estate'],
  ['luxury-beauty-product-pro', 'Luxury Beauty']
];

// A page error is attributed to the application and fails the test UNLESS its stack
// demonstrably originates from a Vercel-injected third-party script (the Live Toolbar
// feedback widget or Vercel Insights), which are added only to preview deployments and
// are not part of the shipped product. Attribution is by stack origin URL only, never by
// message text; an error with no provable third-party origin still fails the test.
const VERCEL_THIRDPARTY_ORIGIN = /(?:https?:\/\/(?:[a-z0-9-]+\.)*vercel\.live\/)|\/_next-live\/|\/_vercel\/(?:insights|speed-insights)\//i;

function classifyPageError(error) {
  const stack = (error && error.stack) || '';
  const originMatch = stack.match(/https?:\/\/[^\s)]+/);
  return {
    message: (error && error.message) || String(error),
    origin: originMatch ? originMatch[0] : '',
    isThirdParty: VERCEL_THIRDPARTY_ORIGIN.test(stack)
  };
}

async function registerQa(request, suffix) {
  const id = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  const email = `phase2-vercel-${id}-${suffix}@example.test`;
  const password = randomBytes(24).toString('base64url');
  let lastFailure = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await request.post(`${API}/v1/auth/register`, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      data: { email, password, name: `Phase 2 Vercel QA ${id}`, termsAccepted: true }
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }

    if (response.status() === 201) {
      return { email, token: body.session.refreshToken };
    }

    lastFailure = { status: response.status(), body, attempt };
    if (![500, 502, 503].includes(response.status()) || attempt === 5) {
      throw new Error(`QA registration failed: ${JSON.stringify(lastFailure)}`);
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1500));
  }

  throw new Error(`QA registration failed: ${JSON.stringify(lastFailure)}`);
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function seedBrowser(page, token) {
  await page.addInitScript(({ api, refreshToken }) => {
    localStorage.setItem('ep.apiBaseUrl', api);
    localStorage.setItem('ep.refreshToken', refreshToken);
  }, { api: API, refreshToken: token });
}

async function logoutQa(request, token) {
  if (!token) return;
  await request.post(`${API}/v1/auth/logout`, { headers: authHeaders(token), data: {} }).catch(() => {});
}

async function closeAuthPanel(page) {
  const panel = page.locator('#auth-panel');
  await panel.waitFor({ state: 'attached' });
  // The public catalog must be reachable without a session: the auth panel must
  // NOT auto-open on load, and when opened it must be dismissible accessibly.
  if (await panel.evaluate(element => element.classList.contains('open'))) {
    await page.keyboard.press('Escape');
  }
  await expect(panel).not.toHaveClass(/open/);
}

async function waitStudio(page) {
  await expect(page.locator('#previewLoading')).toBeHidden({ timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EP?.StudioR2Bridge));
  await expect(page.locator('#previewError')).toBeHidden();
}

async function currentProject(page, name) {
  return page.evaluate(async projectName => {
    const list = await window.EP.ProjectStoreLocal.list();
    return list.find(item => item.name === projectName) || null;
  }, name);
}

async function createWebmFile(page) {
  const bytes = await page.evaluate(async () => {
    if (!window.MediaRecorder) throw new Error('MediaRecorder is unavailable');
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(20);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise(resolve => recorder.onstop = resolve);
    recorder.start(100);
    for (let frame = 0; frame < 20; frame += 1) {
      context.fillStyle = frame % 2 ? '#111111' : '#d3ad68';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = frame % 2 ? '#ffffff' : '#111111';
      context.font = '24px sans-serif';
      context.fillText('Escaparates Pro QA', 48, 96);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(chunks, { type: 'video/webm' });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  return Buffer.from(bytes);
}

async function setMediaFileAndWait(page, inputSelector, filePayload, cardIndex, expectedName) {
  const beforeUrl = page.url();
  const navigation = page.waitForURL(url => url.toString() !== beforeUrl, { waitUntil: 'domcontentloaded', timeout: 120000 }).then(() => 'navigation').catch(() => null);
  const cardReady = page.locator('#media .media-card').nth(cardIndex).filter({ hasText: expectedName }).waitFor({ timeout: 120000 }).then(() => 'card').catch(() => null);
  const persistedReady = expect.poll(
    () => page.evaluate(async ({ index, name }) => {
      const projectName = document.getElementById('projectName')?.value || '';
      const list = await window.EP.ProjectStoreLocal.list();
      const project = list.find(item => item?.name === projectName) || null;
      const media = project?.media?.[index] || null;
      return media && media.name === name && media.status === 'ready' && /^https:\/\/pub-[a-z0-9]+\.r2\.dev\//.test(media.url || '');
    }, { index: cardIndex, name: expectedName }),
    { timeout: 120000 }
  ).toBe(true).then(() => 'local-store').catch(() => null);
  await page.locator(inputSelector).setInputFiles(filePayload);
  await Promise.race([navigation, cardReady, persistedReady]);
  await waitStudio(page).catch(() => {});
  await expect.poll(
    () => page.locator('#media .media-card').nth(cardIndex).textContent(),
    { timeout: 60000 }
  ).toContain(expectedName);
}

async function deleteProject(request, token, projectId) {
  if (!projectId) return;
  await request.delete(`${API}/v1/projects/${projectId}`, { headers: authHeaders(token) });
}

async function deleteAsset(request, token, projectId, assetId) {
  if (!projectId || !assetId) return;
  await request.delete(`${API}/v1/projects/${projectId}/assets/${assetId}`, { headers: authHeaders(token) });
}

async function unpublish(request, token, projectId) {
  if (!projectId) return;
  await request.delete(`${API}/v1/projects/${projectId}/publish`, { headers: authHeaders(token) });
}

async function noHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 3);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 3);
}

test.describe('catálogo protegido', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Se valida una vez en Chromium');

  test('Source Faithful no tienen edición y Custom PRO sí', async ({ page }) => {
    await page.goto(`/?api=${encodeURIComponent(API)}`, { waitUntil: 'domcontentloaded' });
    await closeAuthPanel(page);

    await page.locator('#mode-btn-scroll-sections').click();
    const scrollCatalog = page.locator('#scroll-sections-catalog');
    await expect(scrollCatalog).toContainText('Real Estate Storytelling — Source Faithful PRO');
    await expect(scrollCatalog).toContainText('Product Storytelling — Source Faithful PRO');
    await expect(scrollCatalog).toContainText('Real Estate Storytelling — Custom PRO');
    await expect(scrollCatalog).toContainText('Product Storytelling — Custom PRO');

    for (const name of ['Real Estate Storytelling — Source Faithful PRO', 'Product Storytelling — Source Faithful PRO']) {
      const card = scrollCatalog.locator('.ss-template-card').filter({ hasText: name });
      await expect(card).toHaveCount(1);
      await expect(card.locator('.pc-studio-link')).toHaveCount(0);
    }
    for (const name of ['Real Estate Storytelling — Custom PRO', 'Product Storytelling — Custom PRO']) {
      const card = scrollCatalog.locator('.ss-template-card').filter({ hasText: name });
      await expect(card).toHaveCount(1);
      await expect(card.locator('.pc-studio-link')).toHaveCount(1);
    }

    await page.locator('#mode-btn-sector-blueprints').click();
    const blueprintCatalog = page.locator('#sector-blueprints-catalog');
    await expect(blueprintCatalog).toContainText('Luxury Real Estate');
    await expect(blueprintCatalog).toContainText('Luxury Beauty Product');
    const sourceCard = blueprintCatalog.locator('.ss-template-card').filter({ hasText: 'Luxury Real Estate — Source Faithful PRO' });
    await expect(sourceCard.locator('.pc-studio-link')).toHaveCount(0);
    for (const name of ['Luxury Real Estate — Custom Blueprint PRO', 'Luxury Beauty Product - Custom PRO']) {
      const customCard = blueprintCatalog.locator('.ss-template-card').filter({ hasText: name });
      await expect(customCard).toHaveCount(1);
      await expect(customCard.locator('.pc-studio-link')).toHaveCount(1);
    }

    const links = page.locator('.pc-studio-link');
    await expect(links).toHaveCount(customTemplates.length);
    const hrefs = await links.evaluateAll(items => items.map(item => new URL(item.href).searchParams.get('template')).sort());
    expect(hrefs).toEqual(customTemplates.map(([id]) => id).sort());
  });
});

test.describe('contrato Studio en navegador', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Se valida una vez en Chromium');

  test('rutas, local mode, duplicado, unknown template, nested paths y media slots', async ({ page }) => {
    await page.goto(`/studio.html?template=product-storytelling-custom-pro&api=${encodeURIComponent(API)}`, { waitUntil: 'domcontentloaded' });
    await waitStudio(page);

    await expect(page.locator('.tab.active')).toHaveAttribute('data-template-id', 'product-storytelling-custom-pro');
    await expect(page.locator('#cloudSave')).toBeDisabled();
    await expect(page.locator('#versionsBtn')).toBeDisabled();
    await expect(page.locator('#phase2Status')).toContainText(/Modo local|Sesion no iniciada|sesion no iniciada/i);

    await expect(page.locator('#media-0')).toHaveAttribute('accept', /video/);
    await expect(page.locator('#media-1')).toHaveAttribute('accept', /image/);

    const ctaLabel = page.locator('[data-field-key="ctaLabel"] input');
    await expect(ctaLabel).toHaveAttribute('type', 'text');
    await expect(ctaLabel).toHaveValue('Descubrir producto');
    const ctaUrl = page.locator('[data-field-key="ctaUrl"] input');
    await expect(ctaUrl).toHaveAttribute('type', 'url');
    await expect(ctaUrl).toHaveValue('#producto');

    await page.getByRole('button', { name: /CONTROLES AVANZADOS/ }).click();
    const repeater = page.locator('[data-field-key="highlights"] .repeater-row');
    await expect(repeater).toHaveCount(2);
    await page.locator('[data-field-key="highlights"]').getByRole('button', { name: 'Añadir' }).click();
    await expect(repeater).toHaveCount(3);
    await repeater.nth(2).locator('input').first().fill('Garantía extendida');
    await repeater.nth(2).getByRole('button', { name: '↑' }).click();
    await expect(repeater.nth(1).locator('input').first()).toHaveValue('Garantía extendida');
    await repeater.nth(1).getByRole('button', { name: 'Eliminar' }).click();
    await expect(repeater).toHaveCount(2);

    const typography = page.locator('[data-field-key="headlineTypography"]');
    await typography.locator('input[type="text"]').fill('Manrope');
    await typography.locator('select').selectOption('700');
    await typography.locator('input[type="number"]').fill('88');
    await expect(typography.locator('input[type="text"]')).toHaveValue('Manrope');

    const responsive = page.locator('[data-field-key="responsiveCopy"]');
    await responsive.locator('label').filter({ hasText: 'mobile' }).locator('input').fill('Compacto');
    await expect(responsive.locator('label').filter({ hasText: 'mobile' }).locator('input')).toHaveValue('Compacto');

    const motion = page.locator('[data-field-key="motionProfile"]');
    await motion.locator('input[type="range"]').fill('80');
    await motion.locator('input[type="checkbox"]').check();
    await expect(motion.locator('input[type="checkbox"]')).toBeChecked();

    const contract = await page.evaluate(async () => {
      const registry = window.EP.StudioTemplateRegistry;
      const base = registry.normalizeProject({
        id: 'qa-original',
        projectId: 'qa-original',
        cloudId: 'cloud-original',
        revision: 9,
        published: { url: 'https://example.test/published' },
        templateId: 'product-storytelling-custom-pro',
        name: 'QA Original',
        config: { brand: 'QA Brand', motion: { intensity: 2 } },
        media: [{ type: 'video', url: 'https://example.test/video.webm' }]
      });
      const copy = window.EP.ProjectStoreLocal.fork(base, 'QA Copy');
      const unknown = registry.normalizeProject({
        templateId: 'future-template-custom-pro',
        templateVersion: '99',
        schemaVersion: 1,
        config: { future: { untouched: true } },
        media: [{ url: 'a' }, { url: 'b' }, { url: 'c' }, { url: 'd' }]
      });
      const nested = {};
      registry.setPath(nested, 'theme.colors.primary', '#123456');
      registry.setPath(nested, 'responsive.mobile.alignment', 'center');
      registry.setPath(nested, 'motion.intensity', 7);
      return {
        forkIdsDiffer: copy.id !== base.id && copy.projectId !== base.projectId,
        forkCloudCleared: !copy.cloudId && !copy.revision && !copy.published,
        originalUnchanged: base.cloudId === 'cloud-original' && base.id === 'qa-original',
        unknownReadOnly: unknown.readOnly === true && unknown.templateId === 'future-template-custom-pro',
        unknownPreserved: unknown.config.future.untouched === true && unknown.media.length === 4,
        nestedValues: [
          registry.getPath(nested, 'theme.colors.primary'),
          registry.getPath(nested, 'responsive.mobile.alignment'),
          registry.getPath(nested, 'motion.intensity')
        ],
        noLiteralNestedKey: !Object.prototype.hasOwnProperty.call(nested, 'theme.colors.primary')
      };
    });

    expect(contract).toEqual({
      forkIdsDiffer: true,
      forkCloudCleared: true,
      originalUnchanged: true,
      unknownReadOnly: true,
      unknownPreserved: true,
      nestedValues: ['#123456', 'center', 7],
      noLiteralNestedKey: true
    });

    await page.locator('.tab[data-template-id="real-estate-storytelling-custom-pro"]').click();
    await expect(page.locator('.tab.active')).toHaveAttribute('data-template-id', 'real-estate-storytelling-custom-pro');
    await expect(page.locator('#projectName')).toHaveValue(/Real Estate Storytelling/);
    await page.locator('.tab[data-template-id="product-storytelling-custom-pro"]').click();
    await expect(page.locator('.tab.active')).toHaveAttribute('data-template-id', 'product-storytelling-custom-pro');
    await expect(page.locator('#projectName')).toHaveValue(/Product Storytelling/);
  });
});

test.describe('responsive Studio', () => {
  for (const [templateId, label] of customTemplates) {
    test(`${label}: carga, preview y layout sin desbordamiento`, async ({ page }, testInfo) => {
      const appErrors = [];
      const externalErrors = [];
      page.on('pageerror', error => {
        const info = classifyPageError(error);
        (info.isThirdParty ? externalErrors : appErrors).push(info);
      });

      await page.goto(`/studio.html?template=${encodeURIComponent(templateId)}&api=${encodeURIComponent(API)}`, { waitUntil: 'domcontentloaded' });
      await waitStudio(page);
      await expect(page.locator('.tab.active')).toContainText(label);
      await noHorizontalOverflow(page);

      // Classify by the real rendered viewport, not by the Playwright project name:
      // the Studio switches to the single-panel Editar/Vista previa layout at <=900px
      // (see review/phase1-studio-v2.css). iPad Pro 11 portrait (834px) is intentionally
      // in that mobile layout, so it is validated with the toggle, not dual panels.
      const viewportWidth = page.viewportSize()?.width ?? 0;
      const usesMobileLayout = viewportWidth <= 900;

      if (usesMobileLayout) {
        await expect(page.locator('.mobile-mode')).toBeVisible();
        await page.getByRole('button', { name: 'Vista previa' }).click();
        await expect(page.locator('.app')).toHaveClass(/mobile-preview/);
        await page.getByRole('button', { name: 'Editar' }).click();
        await expect(page.locator('.app')).toHaveClass(/mobile-edit/);
      } else {
        await expect(page.locator('#editorPanel')).toBeVisible();
        await expect(page.locator('#previewPanel')).toBeVisible();
      }

      // Poll the marker: the preview iframe is rebuilt when the URL template is
      // selected, so a single read can land mid-srcdoc-swap (contentDocument null →
      // ''). The product renders the marker reliably; wait for it instead of racing.
      await expect
        .poll(
          () => page.locator('#preview').evaluate(frame => frame.contentDocument?.querySelector('meta[name="ep-template-id"]')?.content || ''),
          { timeout: 15000 }
        )
        .toBe(templateId);

      // Third-party Vercel preview errors are reported but do not fail the product QA.
      if (externalErrors.length) {
        console.warn(`[phase2-vercel] ${testInfo.project.name} — excluded ${externalErrors.length} third-party page error(s) injected by the Vercel preview (not shipped with the product):`);
        for (const e of externalErrors) console.warn(`  · ${e.message} @ ${e.origin || 'unknown-origin'}`);
      }
      // Any error not provably from a Vercel third-party script fails the test.
      expect(appErrors.map(e => (e.origin ? `${e.message} @ ${e.origin}` : e.message))).toEqual([]);
    });
  }
});

test.describe('flujo cloud real Vercel + Railway + R2', () => {
  test('sube WebM y PNG, exporta HTML/ZIP, publica, valida embed y elimina assets', async ({ page, request, browser, browserName }, testInfo) => {
    test.setTimeout(300000);
    test.skip(browserName !== 'chromium' || testInfo.project.name !== 'desktop-chromium', 'Flujo destructivo único');
    const qa = await registerQa(request, 'desktop');
    await seedBrowser(page, qa.token);
    const name = `QA Vercel R2 ${Date.now()}`;
    let projectId = null;
    let assetIds = [];

    try {
      await page.goto(`/studio.html?template=real-estate-storytelling-custom-pro&api=${encodeURIComponent(API)}`, { waitUntil: 'domcontentloaded' });
      await waitStudio(page);
      await expect.poll(() => page.evaluate(() => Boolean(window.EP?.ProjectClient?.hasSession?.())), { timeout: 30000 }).toBe(true);
      await expect(page.locator('#cloudSave')).toBeEnabled({ timeout: 30000 });
      await page.locator('#projectName').fill(name);
      await page.locator('#projectName').dispatchEvent('input');
      await page.locator('#save').click();
      await page.waitForTimeout(1200);

      const videoBuffer = await createWebmFile(page);
      expect(videoBuffer.length).toBeGreaterThan(500);
      await setMediaFileAndWait(page, '#media-0', { name: 'qa-video.webm', mimeType: 'video/webm', buffer: videoBuffer }, 0, 'qa-video.webm');

      await setMediaFileAndWait(page, '#media-1', { name: 'qa-image.png', mimeType: 'image/png', buffer: imageBuffer }, 1, 'qa-image.png');

      const project = await currentProject(page, name);
      expect(project).toBeTruthy();
      projectId = project.cloudId;
      expect(projectId).toMatch(/[0-9a-f-]{36}/i);
      expect(project.media[0].url).toMatch(/^https:\/\/pub-[a-z0-9]+\.r2\.dev\//);
      expect(project.media[1].url).toMatch(/^https:\/\/pub-[a-z0-9]+\.r2\.dev\//);
      expect(project.media[0].status).toBe('ready');
      expect(project.media[1].status).toBe('ready');
      assetIds = project.media.map(item => item?.assetId).filter(Boolean);

      expect((await request.get(project.media[0].url)).status()).toBe(200);
      expect((await request.get(project.media[1].url)).status()).toBe(200);

      await page.locator('#exportProject').click();
      await expect(page.locator('#phase2Modal')).toHaveClass(/open/);
      await expect(page.locator('.phase2-check.bad')).toHaveCount(0);
      const htmlDownloadPromise = page.waitForEvent('download');
      await page.locator('#doHtml').click();
      const htmlDownload = await htmlDownloadPromise;
      expect(htmlDownload.suggestedFilename()).toMatch(/\.html$/);
      await page.locator('#phase2Close').click();

      await page.locator('#exportProject').click();
      const zipDownloadPromise = page.waitForEvent('download', { timeout: 90000 });
      await page.locator('#doZip').click();
      const zipDownload = await zipDownloadPromise;
      expect(zipDownload.suggestedFilename()).toMatch(/\.zip$/);
      await page.locator('#phase2Close').click();

      await page.locator('#exportProject').click();
      await page.locator('#doPublish').click();
      await expect(page.locator('#phase2Title')).toHaveText('Proyecto publicado', { timeout: 60000 });
      const publicationUrl = (await page.locator('#phase2Body textarea').inputValue()).trim();
      expect(publicationUrl).toMatch(/^https:\/\//);
      expect(new URL(publicationUrl).origin).toBe(new URL(page.url()).origin);

      const cleanContext = await browser.newContext();
      const publicPage = await cleanContext.newPage();
      await publicPage.goto(publicationUrl, { waitUntil: 'domcontentloaded' });
      await expect(publicPage.locator('body')).not.toContainText('No se pudo abrir la publicación');
      await expect(publicPage.locator('body')).toContainText(/.+/);
      await cleanContext.close();

      await page.locator('#phase2Close').click();
      await page.locator('#exportProject').click();
      await page.locator('#doEmbed').click();
      await expect(page.locator('#phase2Title')).toHaveText('Código embed');
      const embed = await page.locator('#phase2Body textarea').inputValue();
      expect(embed).toContain(publicationUrl);
      expect(embed).toContain('<iframe');
      await page.locator('#phase2Close').click();

      let navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('#media .media-card').nth(0).getByRole('button', { name: 'Eliminar' }).click();
      await navigation;
      await waitStudio(page);
      navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('#media .media-card').nth(1).getByRole('button', { name: 'Eliminar' }).click();
      await navigation;
      await waitStudio(page);

      const afterDelete = await currentProject(page, name);
      expect(afterDelete.media[0]).toBeNull();
      expect(afterDelete.media[1]).toBeNull();
    } finally {
      if (projectId) {
        await unpublish(request, qa.token, projectId).catch(() => {});
        for (const assetId of assetIds) await deleteAsset(request, qa.token, projectId, assetId).catch(() => {});
        await deleteProject(request, qa.token, projectId).catch(() => {});
      }
      await logoutQa(request, qa.token);
    }
  });
});
