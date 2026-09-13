import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('medi_token', 'test-workspace-token'))
})

test('login failures keep the user on the login page', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.request().url().endsWith('/auth/login') ? route.fulfill({ status: 401, json: { detail: '로그인 정보를 확인해주세요.' } }) : route.fulfill({ json: {} }))
  await page.goto('/emr/login')
  await page.getByLabel('이메일', { exact: true }).fill('doctor@example.com')
  await page.getByLabel('비밀번호', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: '로그인 정보를 확인해주세요.' })).toBeVisible()
  await expect(page).toHaveURL(/\/emr\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull()
})

test('waiting room saves transitions and preserves state after reload', async ({ page }) => {
  let status = 'CONFIRMED'
  const appointment = () => ({ id: 'a1', patient_id: 'p1', patient_name: '테스트환자', start_time: '2026-09-13T09:30:00', end_time: '2026-09-13T09:45:00', duration_min: 15, appointment_type: 'INITIAL', status, chief_complaint: '정기 방문', created_at: '2026-09-13T00:00:00' })
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/check-in')) { status = 'ARRIVED'; return route.fulfill({ json: appointment() }) }
    if (url.pathname.endsWith('/appointments/a1') && route.request().method() === 'PATCH') { status = route.request().postDataJSON().status; return route.fulfill({ json: appointment() }) }
    if (url.pathname.endsWith('/appointments')) return route.fulfill({ json: [appointment()] })
    if (url.pathname.endsWith('/patients/p1')) return route.fulfill({ json: { id: 'p1', name: '테스트환자', chart_no: 'C001' } })
    return route.fulfill({ json: {} })
  })
  await page.goto('/emr/waiting')
  await page.getByRole('button', { name: '도착 확인' }).click()
  await expect(page.getByRole('button', { name: '진료 시작', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: '진료 시작', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/emr-workspace-desktop.png', fullPage: true })
  await page.getByRole('button', { name: '진료 시작', exact: true }).click()
  await expect(page).toHaveURL(/\/emr\/chart\/new\?cc=.*patient_id=p1/, { timeout: 60000 })
  expect(status).toBe('IN_PROGRESS')
})

test('waiting-room display masks patient names', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.fulfill({ json: route.request().url().includes('/emr/appointments?') ? [{ id: 'a1', patient_name: '김테스트', status: 'ARRIVED', start_time: '2026-09-13T09:00:00', appointment_type: 'INITIAL' }] : {} }))
  await page.goto('/emr/waiting')
  await expect(page.getByRole('heading', { name: '김테스트' })).toBeVisible()
  await page.getByRole('button', { name: '대기실 화면', exact: true }).click()
  await expect(page.getByRole('heading', { name: '김***', exact: true })).toBeVisible()
  await expect(page.getByText('김테스트', { exact: true })).toHaveCount(0)
})

test('connection errors are not shown as an empty schedule', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.request().url().includes('/emr/appointments') ? route.fulfill({ status: 503, json: { detail: 'Unavailable' } }) : route.fulfill({ json: {} }))
  await page.goto('/emr/waiting')
  await expect(page.getByRole('alert').filter({ hasText: '데이터를 불러오지 못했습니다' })).toBeVisible()
  await expect(page.getByText('해당 환자가 없습니다.')).toHaveCount(0)
})

test('clinic settings save to the API and survive reload', async ({ page }) => {
  let clinic = { clinic_name: '테스트의원', hours_open: '09:00', hours_close: '18:00' }
  await page.route('**/api/v1/**', async route => {
    if (route.request().url().endsWith('/clinic-setup')) {
      if (route.request().method() === 'PUT') clinic = { ...clinic, ...route.request().postDataJSON() }
      return route.fulfill({ json: clinic })
    }
    return route.fulfill({ json: {} })
  })
  await page.goto('/emr/settings')
  await page.getByLabel('의원 이름').fill('새로운의원')
  await page.getByRole('button', { name: '변경사항 저장' }).click()
  await expect(page.getByText('서버에 저장된 설정입니다.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('의원 이름')).toHaveValue('새로운의원')
})

test('command palette searches patient data on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ json: path.includes('/emr/patients') ? { items: [{ id: 'p1', name: '검색환자', chart_no: 'C001' }] } : path.endsWith('/appointments') ? [] : {} })
  })
  await page.goto('/emr/waiting')
  await page.getByRole('button', { name: '메뉴 및 환자 검색' }).click()
  await page.getByRole('textbox', { name: '메뉴 또는 환자 검색' }).fill('검색환자')
  await expect(page.getByRole('button', { name: /검색환자 · C001/ })).toBeVisible()
  await page.screenshot({ path: 'test-results/emr-workspace-mobile.png', fullPage: true })
  await page.getByRole('textbox', { name: '메뉴 또는 환자 검색' }).press('Enter')
  await expect(page).toHaveURL(/\/emr\/patients\/p1/)
})
