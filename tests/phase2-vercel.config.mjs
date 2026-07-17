import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.VERCEL_BASE_URL;
if (!baseURL) throw new Error('VERCEL_BASE_URL must be resolved by tools/phase2/resolve-vercel-preview.mjs');

export default defineConfig({
  testDir: '.',
  testMatch: 'phase2-vercel.spec.mjs',
  timeout: 120000,
  expect: { timeout: 20000 },
  retries: 1,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'phase2-vercel-results.json' }],
    ['html', { outputFolder: 'phase2-vercel-report', open: 'never' }]
  ],
  outputDir: 'phase2-vercel-test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60000,
    actionTimeout: 30000
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'android-phone-chromium',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'android-tablet-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        screen: { width: 1280, height: 800 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1.5,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36'
      }
    },
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 14 Pro'] }
    },
    {
      name: 'ipad-webkit',
      use: { ...devices['iPad Pro 11'] }
    }
  ]
});
