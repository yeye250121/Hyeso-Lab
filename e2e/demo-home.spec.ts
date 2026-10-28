import { test, expect } from '@playwright/test'

// 메인 홈 데모(/demo) 스모크. 실데이터가 채워지고, 가로로 넘치지 않고, 상호작용이 동작하는지만 본다.
test('데모 홈: 히어로·실데이터·지원금 확인·링크', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByTestId('demo-home')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('놓치고 있던')
  const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: innerWidth }))
  expect(sw).toBeLessThanOrEqual(vw)
  // 통신사 지원금 확인 → 금액 배지
  await page.getByText('어떤 혜택을 연구해 볼까요?').scrollIntoViewIfNeeded()
  const kt = page.getByRole('button', { name: /^KT 확인$/ })
  await kt.click()
  await expect(page.getByRole('button', { name: /^KT \d+만원$/ })).toBeVisible()
  await expect(page).toHaveURL(/\/demo$/) // 버튼이 링크 이동을 막는다
  // 상품 카드가 실데이터로 채워진다
  await expect(page.locator('a[href^="/electronics/"]').filter({ hasText: '월' }).first()).toBeVisible()
  // 주요 링크
  await expect(page.getByRole('link', { name: /연구 시작하기/ }).first()).toHaveAttribute('href', '/apply')
  await expect(page.getByRole('link', { name: /파트너 신청하기/ })).toHaveAttribute('href', '/partners/register')
})
