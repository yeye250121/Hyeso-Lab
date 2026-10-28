import { test, expect } from '@playwright/test'

// 메인(/) 스모크: 실데이터·섹션·CTA 목적지·카드 링크 없음·팝업 없음·빠른 스크롤 후 투명 요소 없음.
test('메인: 구성 요건', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('놓치고 있던 혜택')
  expect(await page.getByRole('heading', { level: 1 }).count()).toBe(1)
  // CTA 목적지와 문구
  await expect(page.getByTestId('hero-cta')).toHaveAttribute('href', '/apply')
  // 카드 링크·경쟁사 이름 없음
  expect(await page.locator('main a[href^="/card"]').count()).toBe(0)
  expect(await page.locator('footer a[href^="/card"]').count()).toBe(0)
  expect(await page.locator('body').innerText()).not.toMatch(/아정당/)
  // 실데이터: 최대 지원금·상품 수
  await expect(page.getByText(/최대 \d+만원/).first()).toBeVisible()
  await expect(page.getByText(/\d{3}종 비교/).first()).toBeVisible()
  // FAQ JSON-LD
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2)
  // 가로 넘침 없음
  const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: innerWidth }))
  expect(sw).toBeLessThanOrEqual(vw)
  // 빠른 스크롤 뒤 투명한 채 남는 요소 없음
  await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
  await page.waitForTimeout(1200)
  const ghosts = await page.evaluate(() => Array.from(document.querySelectorAll('main *')).filter((el) => { const r = el.getBoundingClientRect(); return r.height > 20 && r.top < innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.95 }).length)
  expect(ghosts).toBe(0)
  // 모바일 하단 CTA 바가 보인다(히어로를 지난 뒤)
  await expect(page.getByTestId('mobile-cta')).toBeVisible()
})
