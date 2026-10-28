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
  // 보장 섹션(모바일): 내부 스크롤러가 한 칸(=한 화면) 내려가면 02 단계로 바뀐다
  await page.evaluate(() => window.scrollTo(0, 400))
  const steps = page.getByTestId('promises-steps')
  await expect(steps).toBeVisible()
  await steps.evaluate((el) => { el.scrollTop = el.clientHeight })
  await expect(steps.getByText('02', { exact: true })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  // 가로 넘침 없음
  const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: innerWidth }))
  expect(sw).toBeLessThanOrEqual(vw)
  // 빠른 스크롤 뒤 투명한 채 남는 요소 없음
  await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
  await page.waitForTimeout(1200)
  const ghosts = await page.evaluate(() => Array.from(document.querySelectorAll('main *')).filter((el) => { const r = el.getBoundingClientRect(); return r.height > 20 && r.top < innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.95 }).map((el) => `${el.tagName}.${el.className.toString().slice(0, 80)} opacity=${getComputedStyle(el).opacity}`))
  expect(ghosts, ghosts.join('\n')).toEqual([])
  // 모바일 하단 CTA 바가 보이고, 맨 아래에서는 마지막 CTA 슬롯에 도킹해 버튼 하나로 합쳐진다
  await expect(page.getByTestId('mobile-cta')).toBeVisible()
  await expect(page.getByTestId('mobile-cta')).toHaveAttribute('data-docked', 'true')
  const slotBox = (await page.getByTestId('final-cta-slot').boundingBox())!
  const barBtnBox = (await page.locator('[data-testid="mobile-cta"] a').boundingBox())!
  expect(Math.abs(slotBox.y - barBtnBox.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(slotBox.x - barBtnBox.x)).toBeLessThanOrEqual(1)
  // 다시 올라가면 고정 바로 돌아온다
  await page.evaluate(() => window.scrollTo(0, 1200))
  await expect(page.getByTestId('mobile-cta')).toHaveAttribute('data-docked', 'false')
})
