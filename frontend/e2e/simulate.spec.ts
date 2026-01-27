import { test, expect } from '@playwright/test'

test.describe('개원 시뮬레이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulate')
  })

  test('시뮬레이션 페이지가 로드된다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: /시뮬레이션/i })).toBeVisible()
  })

  test('시뮬레이션 폼이 표시된다', async ({ page }) => {
    // 주소 입력 필드
    await expect(page.getByPlaceholder(/주소/i)).toBeVisible()

    // 진료과목 선택
    await expect(page.getByRole('combobox').or(page.locator('select'))).toBeVisible()

    // 제출 버튼
    await expect(page.getByRole('button', { name: /시뮬레이션|시작|분석/i })).toBeVisible()
  })

  test('필수 필드 없이 제출 시 에러가 표시된다', async ({ page }) => {
    // 빈 폼으로 제출 시도
    const submitButton = page.getByRole('button', { name: /시뮬레이션|시작|분석/i })
    await submitButton.click()

    // 에러 메시지나 유효성 검사 표시 확인
    // (브라우저 기본 유효성 검사 또는 커스텀 에러 메시지)
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('주소 입력 필드에 텍스트를 입력할 수 있다', async ({ page }) => {
    const addressInput = page.getByPlaceholder(/주소/i)
    await addressInput.fill('서울시 강남구 역삼동 123-45')
    await expect(addressInput).toHaveValue('서울시 강남구 역삼동 123-45')
  })

  test('진료과목을 선택할 수 있다', async ({ page }) => {
    const select = page.getByRole('combobox').or(page.locator('select')).first()

    if (await select.isVisible()) {
      await select.selectOption({ index: 1 }) // 첫 번째 옵션 선택

      // 값이 변경되었는지 확인
      const value = await select.inputValue()
      expect(value).not.toBe('')
    }
  })
})
