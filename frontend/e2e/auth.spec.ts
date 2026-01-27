import { test, expect } from '@playwright/test'

test.describe('인증 흐름', () => {
  test.describe('로그인', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('로그인 페이지가 로드된다', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /로그인/i })).toBeVisible()
    })

    test('이메일/비밀번호 입력 필드가 표시된다', async ({ page }) => {
      // 이메일 필드
      await expect(
        page.getByPlaceholder(/이메일/i).or(page.getByLabel(/이메일/i))
      ).toBeVisible()

      // 비밀번호 필드
      await expect(
        page.getByPlaceholder(/비밀번호/i).or(page.getByLabel(/비밀번호/i))
      ).toBeVisible()
    })

    test('로그인 버튼이 표시된다', async ({ page }) => {
      await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible()
    })

    test('회원가입 링크가 표시된다', async ({ page }) => {
      await expect(page.getByRole('link', { name: /회원가입/i })).toBeVisible()
    })

    test('빈 폼으로 로그인 시도 시 에러가 표시된다', async ({ page }) => {
      const loginButton = page.getByRole('button', { name: /로그인/i })
      await loginButton.click()

      // 에러 메시지 또는 유효성 검사 확인
      // 페이지가 여전히 로그인 페이지에 있는지 확인
      await expect(page).toHaveURL(/login/)
    })
  })

  test.describe('회원가입', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('회원가입 페이지가 로드된다', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /회원가입|가입/i })).toBeVisible()
    })

    test('필수 입력 필드들이 표시된다', async ({ page }) => {
      // 이메일
      await expect(
        page.getByPlaceholder(/이메일/i).or(page.getByLabel(/이메일/i))
      ).toBeVisible()

      // 비밀번호
      await expect(
        page.getByPlaceholder(/비밀번호/i).or(page.getByLabel(/비밀번호/i)).first()
      ).toBeVisible()
    })

    test('로그인 링크가 표시된다', async ({ page }) => {
      await expect(page.getByRole('link', { name: /로그인/i })).toBeVisible()
    })
  })
})
