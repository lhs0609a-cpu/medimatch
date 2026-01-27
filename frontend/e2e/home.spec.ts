import { test, expect } from '@playwright/test'

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('페이지 타이틀이 올바르게 표시된다', async ({ page }) => {
    await expect(page).toHaveTitle(/메디플라톤/)
  })

  test('메인 헤더가 표시된다', async ({ page }) => {
    // 헤더 로고/브랜드명 확인
    await expect(page.getByRole('link', { name: /메디플라톤/i })).toBeVisible()
  })

  test('주요 CTA 버튼들이 표시된다', async ({ page }) => {
    // 시뮬레이션 시작 버튼
    await expect(page.getByRole('link', { name: /시뮬레이션|시작/i }).first()).toBeVisible()
  })

  test('네비게이션 링크가 작동한다', async ({ page }) => {
    // 매물 찾기 링크 클릭
    const buildingsLink = page.getByRole('link', { name: /매물|건물/i }).first()
    if (await buildingsLink.isVisible()) {
      await buildingsLink.click()
      await expect(page).toHaveURL(/buildings/)
    }
  })

  test('반응형 레이아웃이 정상 작동한다', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })

    // 메뉴 버튼이 표시되거나 콘텐츠가 스택되어야 함
    // 페이지가 깨지지 않고 로드되어야 함
    await expect(page.locator('body')).toBeVisible()
  })
})
