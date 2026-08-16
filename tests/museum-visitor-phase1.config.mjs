import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['museum-visitor-phase1.spec.mjs'],
  timeout: 90000,
  retries: 0,
  workers: 1,
  reporter: [['line'], ['json', { outputFile: 'museum-visitor-phase1-results.json' }]],
  outputDir: 'test-results/museum-visitor-phase1',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }
  },
  webServer: {
    command: 'node tests/static-server.mjs 4173 .',
    cwd: '..',
    url: 'http://127.0.0.1:4173/labs/immersive-worlds/index.html?authoring=1&portalVariant=D',
    reuseExistingServer: true,
    timeout: 30000
  }
});
