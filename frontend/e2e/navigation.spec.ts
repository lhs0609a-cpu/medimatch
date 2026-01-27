import { test, expect } from '@playwright/test'

test.describe('네비게이션', () => {
  test('주요 페이지들이 404 없이 로드된다', async ({ page }) => {
    const pages = [
      '/',
      '/simulate',
      '/buildings',
      '/partners',
      '/pricing',
      '/login',
      '/register',
      '/faq',
      '/contact',
      '/privacy',
      '/terms',
    ]

    for (const path of pages) {
      await page.goto(path)

      // 404 페이지가 아닌지 확인
      const is404 = await page.getByText(/404|찾을 수 없|not found/i).isVisible()
      expect(is404, `${path} should not be 404`).toBeFalsy()

      // 페이지가 정상 로드되었는지 확인
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('존재하지 않는 페이지는 404를 표시한다', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')

    // 404 페이지 또는 메시지가 표시되어야 함
    const has404Content = await page.getByText(/404|찾을 수 없|not found/i).isVisible()
    expect(has404Content).toBeTruthy()
  })

  test('뒤로가기/앞으로가기가 작동한다', async ({ page }) => {
    // 홈에서 시작
    await page.goto('/')

    // 시뮬레이션 페이지로 이동
    await page.goto('/simulate')
    await expect(page).toHaveURL(/simulate/)

    // 뒤로가기
    await page.goBack()
    await expect(page).toHaveURL('/')

    // 앞으로가기
    await page.goForward()
    await expect(page).toHaveURL(/simulate/)
  })

  test('외부 링크는 새 탭에서 열린다', async ({ page }) => {
    await page.goto('/')

    // target="_blank" 링크 찾기
    const externalLinks = page.locator('a[target="_blank"]')
    const count = await externalLinks.count()

    // 외부 링크가 있다면 rel="noopener" 속성이 있는지 확인 (보안)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const link = externalLinks.nth(i)
      const rel = await link.getAttribute('rel')
      expect(rel).toContain('noopener')
    }
  })
})

test.describe('접근성', () => {
  test('스킵 링크가 작동한다', async ({ page }) => {
    await page.goto('/')

    // Tab 키를 눌러 스킵 링크에 포커스
    await page.keyboard.press('Tab')

    // 스킵 링크가 보이거나 포커스 가능한지 확인
    const skipLink = page.locator('a[href="#main-content"]')
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeFocused()
    }
  })

  test('키보드로 네비게이션이 가능하다', async ({ page }) => {
    await page.goto('/')

    // Tab 키로 여러 요소를 순회
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // 포커스된 요소가 있는지 확인
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
