import { test as base, expect } from '@playwright/test'

// ============================================================
// 테스트 유틸리티 및 픽스처
// ============================================================

// 확장된 테스트 픽스처
export const test = base.extend({
  // 자동으로 콘솔 에러를 체크하는 픽스처
  page: async ({ page }, use) => {
    const errors: string[] = []

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await use(page)

    // 테스트 후 콘솔 에러가 있으면 경고 (실패하지는 않음)
    if (errors.length > 0) {
      console.warn('Console errors during test:', errors)
    }
  },
})

export { expect }

// ============================================================
// 테스트 헬퍼 함수
// ============================================================

/**
 * 로그인 상태를 시뮬레이션
 */
export async function mockLogin(page: import('@playwright/test').Page, role = 'doctor') {
  // localStorage에 mock 토큰 설정
  await page.evaluate((userRole) => {
    localStorage.setItem('token', 'mock-jwt-token')
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'test@example.com',
      name: '테스트 사용자',
      role: userRole,
    }))
  }, role)
}

/**
 * 로그아웃 상태로 설정
 */
export async function mockLogout(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  })
}

/**
 * 네트워크 요청 모킹
 */
export async function mockApiResponse(
  page: import('@playwright/test').Page,
  urlPattern: string | RegExp,
  response: unknown,
  status = 200
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * 로딩 완료 대기
 */
export async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * 스크린샷 찍기 (디버깅용)
 */
export async function takeDebugScreenshot(
  page: import('@playwright/test').Page,
  name: string
) {
  await page.screenshot({
    path: `playwright-report/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  })
}

// ============================================================
// 테스트 데이터
// ============================================================

export const testData = {
  users: {
    doctor: {
      email: 'doctor@test.com',
      password: 'Test1234!',
      name: '김의사',
      role: 'doctor',
    },
    pharmacist: {
      email: 'pharmacist@test.com',
      password: 'Test1234!',
      name: '이약사',
      role: 'pharmacist',
    },
    salesRep: {
      email: 'sales@test.com',
      password: 'Test1234!',
      name: '박영업',
      role: 'sales_rep',
    },
  },

  simulation: {
    address: '서울시 강남구 역삼동 123-45',
    clinicType: '내과',
    sizePyeong: 30,
    budgetMillion: 500,
  },

  building: {
    searchQuery: '강남',
    maxRent: 300,
  },
}
