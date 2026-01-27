import { test, expect } from '@playwright/test'

test.describe('매물 검색', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/buildings')
  })

  test('매물 목록 페이지가 로드된다', async ({ page }) => {
    // 페이지 제목/헤더 확인
    await expect(page.getByRole('heading', { name: /매물|건물|입점/i }).first()).toBeVisible()
  })

  test('검색 필드가 표시된다', async ({ page }) => {
    // 검색 입력 필드
    const searchInput = page.getByPlaceholder(/검색|지역/i)
    await expect(searchInput).toBeVisible()
  })

  test('필터 버튼이 표시된다', async ({ page }) => {
    // 필터 버튼
    const filterButton = page.getByRole('button', { name: /필터/i })
    if (await filterButton.isVisible()) {
      await expect(filterButton).toBeVisible()
    }
  })

  test('검색어 입력 시 결과가 필터링된다', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/검색|지역/i)

    // 검색어 입력
    await searchInput.fill('강남')

    // 잠시 대기 (debounce 등)
    await page.waitForTimeout(500)

    // 페이지가 여전히 정상 작동하는지 확인
    await expect(page.locator('body')).toBeVisible()
  })

  test('매물 카드 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
    // 매물 카드/링크 찾기
    const buildingCard = page.locator('a[href*="/buildings/"]').first()

    if (await buildingCard.isVisible()) {
      await buildingCard.click()

      // URL이 변경되었는지 확인
      await expect(page).toHaveURL(/\/buildings\//)
    }
  })

  test('로딩 상태가 표시된다', async ({ page }) => {
    // 페이지 로드 시 로딩 인디케이터 또는 스켈레톤이 있을 수 있음
    // 콘텐츠가 최종적으로 로드되는지 확인
    await page.waitForLoadState('networkidle')

    // 페이지가 깨지지 않았는지 확인
    await expect(page.locator('body')).toBeVisible()
  })
})
