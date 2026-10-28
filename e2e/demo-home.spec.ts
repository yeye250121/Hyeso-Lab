import { test, expect } from '@playwright/test'

// 메인 홈 데모(/demo) 스모크. 실데이터가 채워지고, 가로로 넘치지 않고, 상호작용이 동작하는지만 본다.
test('데모 홈: 히어로·실데이터·지원금 확인·링크', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByTestId('demo-home')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('놓치고 있던')
  const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: innerWidth }))
  expect(sw).toBeLessThanOrEqual(vw)
  // 보고서 프레임: 통신사 6곳의 지원금이 실데이터로 채워진다
  await page.getByText('통신사만 고르면', { exact: false }).first().scrollIntoViewIfNeeded()
  const rows = page.getByTestId('demo-report').locator('li')
  await expect(rows).toHaveCount(6)
  await rows.first().scrollIntoViewIfNeeded() // 카운트업은 행이 화면에 들어와야 시작된다
  await expect(rows.first()).toBeVisible()
  // 카운트업이 끝나면 만원 단위 숫자가 보인다
  await expect.poll(async () => (await rows.first().innerText()).replace(/[\s,]/g, ''), { timeout: 8000 }).toMatch(/[1-9]\d{5}/)
  // 상품 카드가 실데이터로 채워진다
  await expect(page.locator('a[href^="/electronics/"]').filter({ hasText: '월' }).first()).toBeVisible()
  // 주요 링크
  await expect(page.getByRole('link', { name: /연구 시작하기/ }).first()).toHaveAttribute('href', '/apply')
  await expect(page.getByRole('link', { name: /파트너 신청하기/ })).toHaveAttribute('href', '/partners/register')
})
