import { test, expect } from '@playwright/test';

async function waitReady(page) {
  await expect(page.locator('#previewLoading')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('#previewError')).toBeHidden();
  await expect.poll(
    () => page.locator('#preview').evaluate(frame => Boolean(frame.contentDocument?.querySelector('.rs-page'))),
    { timeout: 20000 }
  ).toBe(true);
  await expect.poll(
    () => page.locator('#preview').evaluate(frame => frame.contentDocument?.querySelector('.rs-page')?.dataset.state || ''),
    { timeout: 20000 }
  ).toMatch(/ready|skipped/);
}

async function preview(page, fn, arg) {
  return page.locator('#preview').evaluate((frame, payload) => {
    const run = new Function('win', 'doc', 'arg', `return (${payload.source})(win, doc, arg);`);
    return run(frame.contentWindow, frame.contentDocument, payload.arg);
  }, { source: fn.toString(), arg });
}

async function openGroupFor(page, key) {
  const field = page.locator(`[data-field-key="${key}"]`);
  if (await field.count()) return field;
  const group = page.locator('.group').filter({ has: page.locator(`[data-field-key="${key}"]`) });
  if (await group.count()) {
    const button = group.locator('button').first();
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  }
  return field;
}

async function expandEditorGroups(page) {
  const buttons = page.locator('.group > button');
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  }
}

test('Fashion Commerce Studio controls render real preview behavior and diagnostics', async ({ page }, testInfo) => {
  const consoleErrors = [];
  const networkErrors = [];
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) consoleErrors.push(`${message.type()}: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    networkErrors.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/studio.html?template=fashion-commerce-pro', { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await expandEditorGroups(page);

  const featureMatrix = {};
  const ctaLabel = await openGroupFor(page, 'heroCtaLabel');
  const ctaUrl = await openGroupFor(page, 'heroCtaUrl');
  await expect(ctaLabel.locator('input')).toHaveAttribute('type', 'text');
  await expect(ctaUrl.locator('input')).toHaveAttribute('type', 'url');
  await ctaLabel.scrollIntoViewIfNeeded();
  await ctaLabel.locator('input').fill('Solicitar visita');
  await ctaLabel.locator('input').dispatchEvent('input');
  await ctaUrl.locator('input').fill('#section2');
  await ctaUrl.locator('input').dispatchEvent('input');
  await waitReady(page);
  await expect(page.frameLocator('#preview').getByRole('link', { name: 'Solicitar visita' })).toHaveAttribute('href', /#section2$/);
  featureMatrix.cta = 'label text control and URL control verified separately';

  const season = await openGroupFor(page, 'season');
  await season.locator('input').fill('OTOÑO QA');
  await season.locator('input').dispatchEvent('input');
  await waitReady(page);
  await expect(page.frameLocator('#preview').locator('.rs-hero-copy p')).toContainText('OTOÑO QA');
  featureMatrix.season = 'visible in hero subtitle';

  const language = await openGroupFor(page, 'language');
  await language.locator('select').selectOption('en');
  await waitReady(page);
  await expect.poll(() => preview(page, (win, doc) => doc.documentElement.lang)).toBe('en');
  await expect(page.frameLocator('#preview').locator('#rsLanguage')).toHaveText('EN');
  await expect(page.frameLocator('#preview').locator('[data-i18n="galleryTitle"]')).toContainText('The street does not wait.');
  await page.frameLocator('#preview').locator('#rsLanguage').click();
  await expect.poll(() => preview(page, (win, doc) => doc.documentElement.lang)).toBe('es');
  const dictionaryCoverage = await preview(page, (win, doc) => {
    const data = JSON.parse(doc.querySelector('#rsData').textContent);
    return {
      es: Object.keys(data.i18n.es).length,
      en: Object.keys(data.i18n.en).length,
      stored: win.localStorage.getItem('ep:fashion-commerce:language'),
      userSet: win.localStorage.getItem('ep:fashion-commerce:language:user')
    };
  });
  expect(dictionaryCoverage.es).toBeGreaterThanOrEqual(20);
  expect(dictionaryCoverage.en).toBeGreaterThanOrEqual(20);
  expect(dictionaryCoverage.stored).toBe('es');
  expect(dictionaryCoverage.userSet).toBe('1');
  featureMatrix.language = dictionaryCoverage;

  const effects = await preview(page, (win, doc) => ({
    grain: Boolean(doc.querySelector('.rs-grain')),
    scanner: Boolean(doc.querySelector('.rs-scanner')),
    filmBurn: Boolean(doc.querySelector('.rs-film-burn')),
    cursor: Boolean(doc.querySelector('#rsCursor')),
    reducedMotionClass: doc.body.classList.contains('motion-reduced')
  }));
  expect(effects).toEqual({ grain: true, scanner: true, filmBurn: true, cursor: true, reducedMotionClass: false });
  await page.frameLocator('#preview').locator('#rsAudio').click();
  await expect(page.frameLocator('#preview').locator('#rsAudio')).toHaveAttribute('aria-pressed', 'true');
  featureMatrix.effects = 'grain, scanner, film burn, custom cursor and audio toggle verified';

  const galleryBefore = await preview(page, (win, doc) => doc.querySelector('#rsTrackShell')?.scrollLeft || 0);
  await page.frameLocator('#preview').locator('#rsTrackNext').click();
  await expect.poll(() => preview(page, (win, doc) => doc.querySelector('#rsTrackShell')?.scrollLeft || 0)).toBeGreaterThan(galleryBefore);
  await page.frameLocator('#preview').locator('#rsTrackShell').press('ArrowLeft');
  await page.frameLocator('#preview').locator('#rsRunway').click();
  await expect(page.frameLocator('#preview').locator('.rs-page')).toHaveClass(/runway-on/);
  await expect.poll(() => preview(page, (win, doc) => doc.querySelector('.runway-active')?.dataset.productIndex || '')).not.toBe('');
  await page.frameLocator('#preview').locator('#rsRunway').click();
  await expect(page.frameLocator('#preview').locator('.rs-page')).not.toHaveClass(/runway-on/);
  featureMatrix.galleryRunway = 'next, keyboard, runway start/stop and active card verified';

  const products = await openGroupFor(page, 'products');
  const before = await products.locator('.repeater-row').count();
  await products.locator('.repeater-row').last().getByRole('button', { name: 'Eliminar' }).click();
  await expect(products.locator('.repeater-row')).toHaveCount(before - 1);
  await products.getByRole('button', { name: 'Añadir' }).click();
  await expect(products.locator('.repeater-row')).toHaveCount(before);
  await products.locator('.repeater-row').last().locator('input').nth(1).fill('PIEZA QA BROWSER');
  await products.locator('.repeater-row').last().locator('input').nth(1).dispatchEvent('input');
  await products.locator('.repeater-row').last().getByRole('button', { name: '↑' }).click();
  await waitReady(page);
  await expect(page.frameLocator('#preview').getByText('PIEZA QA BROWSER')).toBeVisible();
  await products.locator('.repeater-row').nth(before - 2).getByRole('button', { name: 'Eliminar' }).click();
  await expect(products.locator('.repeater-row')).toHaveCount(before - 1);
  featureMatrix.repeater = 'add, edit, reorder and delete controls used';

  const typography = await openGroupFor(page, 'headlineTypography');
  await typography.locator('.typography-control input[type="text"]').fill('Inter');
  await typography.locator('.typography-control input[type="text"]').dispatchEvent('input');
  await typography.locator('.typography-control select').selectOption('900');
  await typography.locator('.typography-control input[type="number"]').fill('88');
  await typography.locator('.typography-control input[type="number"]').dispatchEvent('input');
  await waitReady(page);
  const headlineStyle = await preview(page, (win, doc) => {
    const style = win.getComputedStyle(doc.querySelector('.rs-glitch'));
    return { family: style.fontFamily, weight: style.fontWeight, size: parseFloat(style.fontSize) };
  });
  expect(headlineStyle.family).toContain('Inter');
  expect(Number(headlineStyle.weight)).toBeGreaterThanOrEqual(800);
  expect(headlineStyle.size).toBeLessThanOrEqual(90);
  featureMatrix.typography = headlineStyle;

  const responsive = await openGroupFor(page, 'responsiveHero');
  await responsive.locator('label', { hasText: 'mobile minHeight' }).locator('input').fill('84');
  await responsive.locator('label', { hasText: 'mobile minHeight' }).locator('input').dispatchEvent('input');
  await responsive.locator('label', { hasText: 'mobile navigationMode' }).locator('input').fill('overlay');
  await responsive.locator('label', { hasText: 'mobile navigationMode' }).locator('input').dispatchEvent('input');
  await waitReady(page);
  await expect.poll(() => preview(page, (win, doc) => doc.querySelector('.rs-page')?.dataset.heroMobileMin || '')).toBe('84');
  await expect.poll(() => preview(page, (win, doc) => doc.querySelector('.rs-page')?.dataset.mobileNavigation || '')).toBe('overlay');
  featureMatrix.responsive = 'mobile minHeight and navigation mode controls exported to preview';

  const motion = await openGroupFor(page, 'motionProfile');
  await motion.locator('.motion-control input[type="range"]').fill('25');
  await motion.locator('.motion-control input[type="range"]').dispatchEvent('input');
  await motion.locator('.motion-control input[type="number"]').fill('1200');
  await motion.locator('.motion-control input[type="number"]').dispatchEvent('input');
  await waitReady(page);
  await expect.poll(() => preview(page, (win, doc) => win.getComputedStyle(doc.querySelector('.rs-card-img')).transitionDuration)).toContain('1.2s');
  await motion.locator('.motion-control input[type="checkbox"]').check();
  await waitReady(page);
  await expect(page.frameLocator('#preview').locator('body')).toHaveClass(/motion-reduced/);
  featureMatrix.motion = 'duration, intensity and reduced motion controls used';

  await expect.poll(() => preview(page, (win, doc) => doc.querySelector('.rs-page')?.dataset.state || '')).toMatch(/ready|skipped/);
  await preview(page, (win, doc) => doc.querySelector('[data-product-index="0"]')?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' }));
  await preview(page, (win, doc) => doc.querySelector('[data-product-index="0"] [data-open-product="0"]')?.click());
  await expect(page.frameLocator('#preview').locator('#rsModal')).toHaveClass(/open/);
  await page.frameLocator('#preview').locator('#rsWishlist').click();
  await expect(page.frameLocator('#preview').locator('#rsCommercePanel')).toHaveClass(/open/);
  await expect(page.frameLocator('#preview').locator('#rsWishlistCount')).toHaveText('1');
  await page.frameLocator('#preview').locator('#rsCart').click();
  await expect(page.frameLocator('#preview').locator('#rsCartCount')).toHaveText('1');
  await expect(page.frameLocator('#preview').locator('#rsCommerceTitle')).toContainText(/Carrito|cart/i);
  await page.frameLocator('#preview').locator('[data-cart-inc]').first().click();
  await expect(page.frameLocator('#preview').locator('#rsCartCount')).toHaveText('2');
  await page.frameLocator('#preview').locator('[data-remove-cart]').first().click();
  await expect(page.frameLocator('#preview').locator('#rsCartCount')).toHaveText('0');
  await page.frameLocator('#preview').locator('#rsWishlistOpen').click();
  await page.frameLocator('#preview').locator('[data-remove-wishlist]').first().click();
  await expect(page.frameLocator('#preview').locator('#rsWishlistCount')).toHaveText('0');
  await page.frameLocator('#preview').locator('#rsCommerceClose').click();
  await page.frameLocator('#preview').locator('#rsCart').click();
  const storageState = await preview(page, (win) => ({
    keys: Object.keys(win.localStorage).filter(key => key.startsWith('ep:fashion-commerce:')).sort(),
    wishlist: JSON.parse(win.localStorage.getItem('ep:fashion-commerce:rubik-sota-disruption:wishlist') || '[]'),
    cart: JSON.parse(win.localStorage.getItem('ep:fashion-commerce:rubik-sota-disruption:cart') || '[]'),
    legacyWishlist: win.localStorage.getItem('rsWishlist'),
    legacyCart: win.localStorage.getItem('rsCart')
  }));
  expect(storageState.wishlist).toEqual([]);
  expect(storageState.cart).toEqual([{ id: 'jacket-industrial', qty: 1 }]);
  expect(storageState.legacyWishlist).toBeNull();
  expect(storageState.legacyCart).toBeNull();
  featureMatrix.commerce = 'modal, isolated wishlist/cart storage, counts, quantity and removal verified';

  const screenshotPath = testInfo.outputPath('fashion-commerce-studio.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach('fashion-commerce-studio-screenshot', { path: screenshotPath, contentType: 'image/png' });
  await testInfo.attach('fashion-commerce-feature-matrix', { body: JSON.stringify(featureMatrix, null, 2), contentType: 'application/json' });
  await testInfo.attach('fashion-commerce-localStorage', { body: JSON.stringify(storageState, null, 2), contentType: 'application/json' });
  await testInfo.attach('fashion-commerce-console', { body: JSON.stringify(consoleErrors, null, 2), contentType: 'application/json' });
  await testInfo.attach('fashion-commerce-network', { body: JSON.stringify(networkErrors, null, 2), contentType: 'application/json' });

  expect(consoleErrors).toEqual([]);
  expect(networkErrors.filter(item => item.url.startsWith('http://127.0.0.1'))).toEqual([]);
});
