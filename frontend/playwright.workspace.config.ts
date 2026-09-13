import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'emr-workspace.spec.ts',
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3117', locale: 'ko-KR', timezoneId: 'Asia/Seoul', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev -p 3117',
    url: 'http://localhost:3117/emr/waiting',
    env: { NEXT_DIST_DIR: '.next-e2e' },
    reuseExistingServer: false,
    stdout: 'pipe',
    timeout: 600000,
  },
})
