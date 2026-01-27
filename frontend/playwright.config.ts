import { defineConfig, devices } from '@playwright/test'

/**
 * 메디플라톤 E2E 테스트 설정
 *
 * 실행 방법:
 * - 전체 테스트: npx playwright test
 * - UI 모드: npx playwright test --ui
 * - 특정 파일: npx playwright test tests/home.spec.ts
 * - 리포트 보기: npx playwright show-report
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './e2e',

  // 테스트 타임아웃 (30초)
  timeout: 30 * 1000,

  // 개별 expect 타임아웃
  expect: {
    timeout: 5000,
  },

  // 전체 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // 공통 설정
  use: {
    // 베이스 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 액션 타임아웃
    actionTimeout: 10000,

    // 트레이스 (실패 시에만)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시에만)
    screenshot: 'only-on-failure',

    // 비디오 (실패 시에만)
    video: 'on-first-retry',

    // 로케일
    locale: 'ko-KR',

    // 타임존
    timezoneId: 'Asia/Seoul',
  },

  // 브라우저별 설정
  projects: [
    // 데스크톱 Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 데스크톱 Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // 데스크톱 Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 모바일 Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // 모바일 Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 개발 서버 설정 (로컬에서 테스트 시)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
})
