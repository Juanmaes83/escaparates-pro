import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['fashion-commerce-browser.spec.mjs'],
  timeout: 90000,
  retries: 1,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'fashion-commerce-results.json' }]
  ],
  outputDir: 'test-results/fashion-commerce',
  use: {
    baseURL: 'http://127.0.0.1:4176',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tests/static-server.mjs 4176 .',
    cwd: '..',
    url: 'http://127.0.0.1:4176/studio.html?template=fashion-commerce-pro',
    reuseExistingServer: true,
    timeout: 30000
  }
});
