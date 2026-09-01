import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: [
    'museum-breeze-interaction.spec.mjs',
    'museum-breeze-panel-toggle.spec.mjs'
  ],
  timeout: 240_000,
  workers: 1,
  outputDir: '../test-results',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tests/static-server.mjs 4173 .',
    cwd: '..',
    url: 'http://127.0.0.1:4173/labs/immersive-worlds/breeze-integration-studio.html',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
