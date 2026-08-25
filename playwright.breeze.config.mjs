import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    launchOptions: {
      args: [
        '--enable-unsafe-webgpu',
        '--use-angle=swiftshader',
        '--disable-gpu-sandbox',
        '--disable-dev-shm-usage'
      ]
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  reporter: [['line']]
});
