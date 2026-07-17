import { test, expect } from '@playwright/test';

async function waitReady(page) {
  await expect(page.locator('#previewLoading')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('#previewError')).toBeHidden();
  await expect.poll(
    () => page.locator('#preview').evaluate(frame => frame.contentDocument?.querySelector('meta[name="ep-template-id"]')?.content || ''),
    { timeout: 15000 }
  ).toBe('luxury-beauty-product-pro');
}

test('ELORIA Signature star product travels as one continuous node', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/studio.html?template=luxury-beauty-product-pro&preset=eloria-signature', { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const samples = [];
  const percentages = [0, 15, 30, 45, 60, 75, 90, 100];

  for (const percentage of percentages) {
    const sample = await page.locator('#preview').evaluate(async (frame, pct) => {
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      const max = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
      win.scrollTo(0, max * pct / 100);
      await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
      const nodes = doc.querySelectorAll('#eloriaStarProduct');
      const box = nodes[0].getBoundingClientRect();
      const anchors = Array.from(doc.querySelectorAll('[data-product-anchor]')).map(anchor => anchor.dataset.scene);
      return {
        pct,
        count: nodes.length,
        anchors,
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        transform: win.getComputedStyle(nodes[0]).transform
      };
    }, percentage);
    samples.push(sample);
  }

  for (const sample of samples) {
    expect(sample.count).toBe(1);
    expect(sample.width).toBeGreaterThan(80);
    expect(sample.height).toBeGreaterThan(180);
    expect(sample.anchors).toEqual(['hero', 'ingredients', 'collection', 'ritual', 'story', 'final']);
    expect(sample.transform).not.toBe('none');
  }

  const uniquePositions = new Set(samples.map(sample => `${sample.x},${sample.y}`));
  expect(uniquePositions.size).toBeGreaterThanOrEqual(5);
  expect(Math.max(...samples.map(sample => sample.x)) - Math.min(...samples.map(sample => sample.x))).toBeGreaterThan(120);
  expect(Math.max(...samples.map(sample => sample.y)) - Math.min(...samples.map(sample => sample.y))).toBeGreaterThan(20);
});
