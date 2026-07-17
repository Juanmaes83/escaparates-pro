import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['phase1-studio.spec.mjs', 'luxury-beauty-journey.spec.mjs'],
  timeout: 60000,
  retries: 1,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'phase1-results.json' }]
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tests/static-server.mjs 4173 .',
    cwd: '..',
    url: 'http://127.0.0.1:4173/review/premium-storytelling-phase1-studio.html',
    reuseExistingServer: true,
    timeout: 30000
  }
});
