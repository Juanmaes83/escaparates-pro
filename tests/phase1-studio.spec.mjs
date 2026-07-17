import { test, expect } from '@playwright/test';

const reviewPath = '/review/premium-storytelling-phase1-studio.html';
const studioPath = '/studio.html';

async function waitReady(page) {
  await expect(page.locator('#previewLoading')).toBeHidden({ timeout: 30000 });
}

test('desktop editor scroll, preview scroll and transactional templates', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(reviewPath, { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const panel = await page.locator('#editorScroll').evaluate(el => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    overflowY: getComputedStyle(el).overflowY
  }));
  expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  expect(['auto', 'scroll']).toContain(panel.overflowY);
  await page.locator('#editorScroll').evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect(await page.locator('#editorScroll').evaluate(el => el.scrollTop)).toBeGreaterThan(0);

  await expect(page.locator('#viewportInfo')).toContainText('1440 × 900');
  expect(await page.locator('#frameShell').evaluate(el => el.style.width)).toBe('1440px');
  expect(await page.locator('#frameShell').evaluate(el => el.style.height)).toBe('900px');
  expect(await page.locator('#frameShell').evaluate(el => el.style.transform)).toContain('scale(');

  const initialScroll = await page.locator('#preview').evaluate(frame => {
    const document = frame.contentDocument;
    const scroller = document.scrollingElement || document.documentElement;
    return { page: scroller.scrollHeight, viewport: scroller.clientHeight };
  });
  expect(initialScroll.page).toBeGreaterThan(initialScroll.viewport);

  await page.getByRole('button', { name: 'Product Storytelling' }).click();
  await waitReady(page);
  expect(await page.locator('#preview').evaluate(frame => frame.contentDocument.querySelector('meta[name="ep-template-id"]')?.content)).toBe('product-storytelling-custom-pro');

  await page.getByRole('button', { name: 'Luxury Real Estate' }).click();
  await waitReady(page);
  expect(await page.locator('#preview').evaluate(frame => frame.contentDocument.querySelector('meta[name="ep-template-id"]')?.content)).toBe('luxury-real-estate-custom-pro');
  await expect(page.locator('#media')).toContainText('Propiedad 1');

  await page.getByRole('button', { name: 'Tablet' }).click();
  await expect(page.locator('#viewportInfo')).toContainText('834 × 1112');
  await page.getByRole('button', { name: 'Móvil' }).click();
  await expect(page.locator('#viewportInfo')).toContainText('390 × 844');
  expect(errors).toEqual([]);
});

test('mobile uses separate edit and preview modes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(reviewPath, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mobile-mode')).toBeVisible();
  await page.getByRole('button', { name: 'Vista previa' }).click();
  await expect(page.locator('.app')).toHaveClass(/mobile-preview/);
  await expect(page.locator('#previewPanel')).toBeVisible();
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.locator('.app')).toHaveClass(/mobile-edit/);
  await expect(page.locator('#editorPanel')).toBeVisible();
  expect(errors).toEqual([]);
});

test('advanced Product Storytelling controls change the rendered preview', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${studioPath}?template=product-storytelling-custom-pro`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const advanced = page.getByRole('button', { name: /CONTROLES AVANZADOS/ });
  if ((await advanced.getAttribute('aria-expanded')) !== 'true') await advanced.click();

  const repeater = page.locator('[data-field-key="highlights"] .repeater-control');
  const before = await repeater.locator('.repeater-row').count();
  await repeater.getByRole('button', { name: 'Añadir' }).click();
  await expect(repeater.locator('.repeater-row')).toHaveCount(before + 1);
  await repeater.locator('.repeater-row').last().locator('input').fill('Autonomía 48h');
  await waitReady(page);
  await expect(page.frameLocator('#preview').locator('.highlight', { hasText: 'Autonomía 48h' })).toBeVisible();

  const typography = page.locator('[data-field-key="headlineTypography"] .typography-control');
  await typography.locator('input[type="number"]').fill('96');
  await typography.locator('input[type="number"]').dispatchEvent('input');
  await waitReady(page);
  const headlineSize = await page.locator('#preview').evaluate(frame => parseFloat(frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector('.hero h1')).fontSize));
  expect(headlineSize).toBeGreaterThanOrEqual(95);

  const responsive = page.locator('[data-field-key="responsiveCopy"] .responsive-control');
  await responsive.locator('label', { hasText: 'mobile' }).locator('input').fill('Mensaje móvil verificado');
  await waitReady(page);
  await page.getByRole('button', { name: 'Móvil' }).click();
  const mobileCopy = page.frameLocator('#preview').locator('.responsive-copy .mobile');
  await expect(mobileCopy).toHaveText('Mensaje móvil verificado');
  await expect(mobileCopy).toBeVisible();

  const motion = page.locator('[data-field-key="motionProfile"] .motion-control');
  await motion.locator('input[type="number"]').fill('1200');
  await motion.locator('input[type="number"]').dispatchEvent('input');
  await waitReady(page);
  const transition = await page.locator('#preview').evaluate(frame => frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector('.feature')).transitionDuration);
  expect(transition).toContain('1.2s');
  await motion.locator('input[type="checkbox"]').check();
  await waitReady(page);
  await expect(page.frameLocator('#preview').locator('body')).toHaveClass(/motion-reduced/);
  expect(errors).toEqual([]);
});

test('unsupported projects remain byte-for-byte protected in IndexedDB', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(studioPath, { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const seeded = await page.evaluate(async () => {
    const project = await window.EP.ProjectStoreLocal.save({
      id: 'qa-unsupported-project',
      projectId: 'qa-unsupported-project',
      name: 'QA Unsupported',
      projectName: 'QA Unsupported',
      templateId: 'future-template-custom-pro',
      templateVersion: 99,
      schemaVersion: 99,
      config: { future: { untouched: true }, headline: 'Original' },
      media: [{ slot: 'future-a', url: 'https://example.test/a.jpg', name: 'a.jpg' }, { slot: 'future-b', url: 'https://example.test/b.mp4', name: 'b.mp4' }],
      source: 'qa',
      persistenceMode: 'local',
      createdAt: '2026-07-17T00:00:00.000Z',
      updatedAt: '2026-07-17T00:00:00.000Z'
    });
    return { id: project.id, before: JSON.stringify(await window.EP.ProjectStoreLocal.get(project.id)) };
  });

  await page.goto(`${studioPath}?project=${encodeURIComponent(seeded.id)}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/studio-read-only/);
  await expect(page.locator('#status')).toContainText('solo lectura');
  await expect(page.locator('#projectName')).toHaveAttribute('readonly', '');
  await expect(page.locator('#save')).toBeDisabled();
  await expect(page.locator('#reset')).toBeDisabled();
  await expect(page.locator('#openFull')).toBeDisabled();
  await expect(page.locator('#cloudSave')).toBeDisabled();
  await expect(page.locator('#versionsBtn')).toBeDisabled();
  await expect(page.locator('#exportProject')).toBeDisabled();
  await expect(page.locator('#tabs .tab:disabled')).toHaveCount(3);
  await expect(page.locator('#media input[type="file"]')).toHaveCount(0);
  await expect(page.frameLocator('#preview').getByText('Proyecto no compatible con este Studio')).toBeVisible();

  await page.locator('#save').evaluate(button => button.click());
  await page.locator('#reset').evaluate(button => button.click());
  await page.locator('#cloudSave').evaluate(button => button.click());
  await page.locator('#exportProject').evaluate(button => button.click());
  const download = page.waitForEvent('download');
  await page.locator('#downloadJson').click();
  const downloaded = await download;
  expect(downloaded.suggestedFilename()).toBe('escaparates-project-original.json');

  const after = await page.evaluate(async id => JSON.stringify(await window.EP.ProjectStoreLocal.get(id)), seeded.id);
  expect(after).toBe(seeded.before);
  expect(errors).toEqual([]);
});
