import { test, expect } from '@playwright/test'

// 파트너 랜딩(/m/<코드>) E2E. 접수(POST /api/leads)는 가로채서 운영 DB·알림톡을 건드리지 않는다.
// 코드는 로그인한 계정의 세션에서 가져온다(E2E_OWNER_ID/PW).
test.describe('파트너 랜딩 (모바일)', () => {
  test('약속·폼·사은품 표가 보이고, 번호를 남기면 접수 완료가 뜬다', async ({ page, context }) => {
    const id = process.env.E2E_OWNER_ID, pw = process.env.E2E_OWNER_PW
    test.skip(!id || !pw, 'E2E_OWNER_ID/PW 없음')
    const login = await context.request.post('/api/admin/auth/login', { data: { loginId: id, password: pw } })
    expect(login.ok()).toBeTruthy()
    const session = await (await context.request.get('/api/admin/auth/session')).json()
    const code: string = session.admin.uniqueCode
    await context.clearCookies()

    const posted: unknown[] = []
    await page.route('**/api/leads', (route) => {
      posted.push(route.request().postDataJSON())
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-lead' }) })
    })

    await page.goto(`/m/${code}?preview=1`)
    await expect(page.getByTestId('landing-120')).toHaveText('120%')
    await expect(page.getByTestId('landing-why')).toContainText('광고 모델을')
    await expect(page.getByTestId('landing-gifts')).toBeVisible()
    // 지원금은 확인하기를 눌러야 보인다
    await expect(page.getByTestId('landing-gift-amount')).toHaveCount(0)
    await page.getByTestId('landing-gift-reveal').first().click()
    await expect(page.getByTestId('landing-gift-amount')).toHaveCount(1)
    await expect(page.getByTestId('landing-gift-amount').first()).toContainText('만원')
    const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: innerWidth }))
    expect(sw).toBeLessThanOrEqual(vw)

    // 하단 고정 CTA → 폼으로 (폼이 안 보일 때만 뜨므로 맨 위로 올린 뒤)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByTestId('landing-cta-sticky').click()
    await expect(page.getByTestId('landing-form')).toBeInViewport()

    // 빈 제출은 안내 문구
    await page.getByTestId('landing-submit').click()
    await expect(page.getByTestId('landing-error')).toContainText('찾는 혜택')

    await page.getByTestId('landing-service-internet').click()
    await page.getByTestId('landing-existing-existing').click()
    await page.getByTestId('landing-phone').fill('01012345678')
    await expect(page.getByTestId('landing-phone')).toHaveValue('010-1234-5678')
    await page.getByTestId('landing-agree-all').check({ force: true })
    await page.getByTestId('landing-submit').click()

    await expect(page.getByTestId('landing-done')).toBeVisible()
    await expect(page.getByTestId('landing-done-application')).toHaveAttribute('href', /internet\/application\?lead=e2e-lead/)
    expect(posted).toHaveLength(1)
    expect(posted[0]).toMatchObject({ service: 'internet', phoneNumber: '010-1234-5678', marketerCode: code, existingService: 'existing' })
  })

  test('없는 코드는 일반 상담 신청으로 보낸다', async ({ page }) => {
    await page.goto('/m/NOPE-0000?service=internet')
    await expect(page).toHaveURL(/\/apply\?service=internet/)
  })
})
