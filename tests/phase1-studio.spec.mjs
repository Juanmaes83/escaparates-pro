import { test, expect } from '@playwright/test';

const path = '/review/premium-storytelling-phase1-studio.html';

async function waitReady(page) {
  await page.waitForSelector('#previewLoading.hidden');
}

test('desktop editor scroll, preview scroll and transactional templates', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
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

  const initialScroll = await page.locator('#preview').evaluate(frame => ({
    page: frame.contentDocument.body.scrollHeight,
    viewport: frame.contentWindow.innerHeight
  }));
  expect(initialScroll.page).toBeGreaterThan(initialScroll.viewport);
  await page.locator('#preview').evaluate(frame => frame.contentWindow.scrollTo(0, 600));
  expect(await page.locator('#preview').evaluate(frame => frame.contentWindow.scrollY)).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Product Storytelling' }).click();
  await waitReady(page);
  expect(await page.locator('#preview').evaluate(frame => frame.contentDocument.querySelector('meta[name="ep-template-id"]')?.content)).toBe('product-storytelling-custom-pro');

  await page.getByRole('button', { name: 'Luxury Real Estate' }).click();
  await waitReady(page);
  expect(await page.locator('#preview').evaluate(frame => frame.contentDocument.querySelector('meta[name="ep-template-id"]')?.content)).toBe('luxury-real-estate-custom-pro');
  await expect(page.locator('#media')).toContainText('Propiedad 1');
  expect(await page.locator('#fields textarea').count()).toBeGreaterThan(0);

  const luxuryScroll = await page.locator('#preview').evaluate(frame => ({
    page: frame.contentDocument.body.scrollHeight,
    viewport: frame.contentWindow.innerHeight
  }));
  expect(luxuryScroll.page).toBeGreaterThan(luxuryScroll.viewport);

  await page.getByRole('button', { name: 'Tablet' }).click();
  await expect(page.locator('#viewportInfo')).toContainText('834 × 1112');
  expect(await page.locator('#frameShell').evaluate(el => el.style.width)).toBe('834px');

  await page.getByRole('button', { name: 'Móvil' }).click();
  await expect(page.locator('#viewportInfo')).toContainText('390 × 844');
  expect(await page.locator('#frameShell').evaluate(el => el.style.width)).toBe('390px');

  expect(errors).toEqual([]);
});

test('mobile uses separate edit and preview modes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mobile-mode')).toBeVisible();

  await page.getByRole('button', { name: 'Vista previa' }).click();
  await expect(page.locator('.app')).toHaveClass(/mobile-preview/);
  await expect(page.locator('#previewPanel')).toBeVisible();

  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.locator('.app')).toHaveClass(/mobile-edit/);
  await expect(page.locator('#editorPanel')).toBeVisible();

  expect(errors).toEqual([]);
});