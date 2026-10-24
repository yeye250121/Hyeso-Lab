import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// 관리자 콘솔(오너·관리자·파트너스) 모바일 E2E.
// 실행 중인 dev 서버(E2E_BASE_URL)와 실데이터를 쓰되, 쓰기(PATCH/POST/DELETE)는 전부 가로채 운영 DB 를 건드리지 않는다.
// 계정은 환경변수로 받는다: E2E_OWNER_ID/E2E_OWNER_PW, E2E_ADMIN_ID/E2E_ADMIN_PW, E2E_PARTNER_ID/E2E_PARTNER_PW

const ACCOUNTS = {
  owner: { id: process.env.E2E_OWNER_ID, pw: process.env.E2E_OWNER_PW, console: 'owner' },
  admin: { id: process.env.E2E_ADMIN_ID, pw: process.env.E2E_ADMIN_PW, console: 'admin' },
  partners: { id: process.env.E2E_PARTNER_ID, pw: process.env.E2E_PARTNER_PW, console: 'partners' },
} as const

async function login(context: BrowserContext, role: keyof typeof ACCOUNTS) {
  const acc = ACCOUNTS[role]
  test.skip(!acc.id || !acc.pw, `E2E_${role.toUpperCase()}_ID/PW 환경변수가 없어 건너뜀`)
  // dev 서버는 재컴파일 중 잠깐 404 를 줄 때가 있어 몇 번 더 시도한다
  let ok = false
  for (let i = 0; i < 4 && !ok; i++) {
    const res = await context.request.post('/api/admin/auth/login', { data: { loginId: acc.id, password: acc.pw } })
    ok = res.ok()
    if (!ok) await new Promise((r) => setTimeout(r, 1500))
  }
  expect(ok, `${role} 로그인`).toBeTruthy()
  return acc.console
}

// 쓰기 요청은 모두 가짜 성공으로 응답한다(운영 DB 보호). 실제로 어떤 요청이 나갔는지는 배열에 남긴다.
async function blockWrites(page: Page) {
  const writes: { method: string; url: string; body: unknown }[] = []
  await page.route('**/api/admin/**', async (route) => {
    const req = route.request()
    if (['PATCH', 'POST', 'PUT', 'DELETE'].includes(req.method()) && !req.url().includes('/auth/')) {
      writes.push({ method: req.method(), url: req.url(), body: req.postDataJSON?.() ?? null })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sentAt: new Date().toISOString(), success: true }) })
    }
    return route.continue()
  })
  return writes
}

// 화면이 가로로 넘치지 않는지(문서 폭 == 뷰포트 폭) 확인
async function expectNoHorizontalOverflow(page: Page) {
  const { sw, vw } = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, vw: window.innerWidth }))
  expect(sw, '가로 스크롤 없음').toBeLessThanOrEqual(vw)
}

const open = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  // 세션 확인 뒤 목록을 불러오므로 "불러오는 중" 이 사라질 때까지 기다린다
  await expect(page.locator('main')).not.toContainText('불러오는 중', { timeout: 15000 })
}

test.describe('오너 콘솔 (모바일)', () => {
  test('모든 메뉴 페이지가 가로로 넘치지 않는다', async ({ page, context }) => {
    test.setTimeout(180_000) // dev 서버 첫 컴파일까지 포함해 12개 페이지를 돈다
    const c = await login(context, 'owner')
    for (const p of ['dashboard', 'leads', 'applications', 'applications?service=internet', 'library', 'images', 'link', 'rental-products', 'cards', 'chat', 'members', 'profile']) {
      await open(page, `/${c}/${p}`)
      await expect(page.locator('main')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })

  test('햄버거 메뉴로 이동할 수 있다', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await open(page, `/${c}/dashboard`)
    await page.getByTestId('mobile-menu-open').click()
    const menu = page.getByTestId('mobile-menu')
    await expect(menu.getByTestId('nav-members')).toBeVisible()
    await menu.getByTestId('nav-leads').click()
    await expect(page).toHaveURL(new RegExp(`/${c}/leads`))
    await expect(page.getByRole('heading', { name: '상담 신청' })).toBeVisible()
  })

  test('상담 신청: 카드 → 상세 시트 → 상태 변경·메모 저장(쓰기 가로챔)', async ({ page, context }) => {
    const c = await login(context, 'owner')
    const writes = await blockWrites(page)
    await open(page, `/${c}/leads`)
    const cards = page.getByTestId('lead-card')
    test.skip((await cards.count()) === 0, '상담 신청 데이터가 없음')
    await expect(page.locator('table')).toBeHidden()
    await cards.first().click()
    const sheet = page.getByTestId('lead-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('statement-panel')).toBeVisible()
    await expect(sheet.getByTestId('lead-detail')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    // 메모 저장
    await sheet.locator('textarea').fill('모바일 E2E 메모')
    await sheet.getByRole('button', { name: '메모 저장' }).click()
    await expect.poll(() => writes.filter((w) => w.method === 'PATCH' && /\/leads\//.test(w.url)).length).toBeGreaterThan(0)
    expect(writes.find((w) => w.method === 'PATCH')?.body).toMatchObject({ memo: '모바일 E2E 메모' })
    await sheet.getByTestId('sheet-close').click()
    await expect(sheet).toBeHidden()
    // 카드의 상태 셀렉트
    const status = page.getByTestId('lead-status').first()
    await status.selectOption('contacted')
    await expect.poll(() => writes.some((w) => w.method === 'PATCH' && (w.body as { status?: string })?.status === 'contacted')).toBeTruthy()
  })

  test('상담 신청: 필터와 검색이 동작한다', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await open(page, `/${c}/leads`)
    const before = await page.getByTestId('lead-card').count()
    await page.getByTestId('lead-filter-service').selectOption('electronics')
    await page.waitForLoadState('networkidle')
    const cards = page.getByTestId('lead-card')
    for (let i = 0; i < (await cards.count()); i++) await expect(cards.nth(i)).toContainText('가전렌탈')
    expect(await cards.count()).toBeLessThanOrEqual(before)
  })

  test('신청서: 카드 → 상세 시트(민감정보 가림) → 인터넷 탭', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await blockWrites(page)
    await open(page, `/${c}/applications`)
    const cards = page.getByTestId('app-card')
    test.skip((await cards.count()) === 0, '신청서 데이터가 없음')
    await cards.first().click()
    const sheet = page.getByTestId('app-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('reveal-sensitive')).toContainText('민감정보 보기')
    await expect(sheet.getByText('가입자')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await sheet.getByTestId('sheet-close').click()
    await page.getByRole('link', { name: '인터넷' }).click()
    await expect(page).toHaveURL(/service=internet/)
    await expect(page.getByTestId('app-cards')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('렌탈 상품: 카드 목록과 필터', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await blockWrites(page)
    await open(page, `/${c}/rental-products`)
    await expect(page.getByTestId('product-card').first()).toBeVisible()
    await expect(page.locator('table')).toBeHidden()
    await page.getByTestId('product-filter-state').selectOption('inactive')
    const cards = page.getByTestId('product-card')
    if (await cards.count()) await expect(cards.first()).toContainText('중지')
    await expectNoHorizontalOverflow(page)
  })

  test('구성원 관리: 카드를 펼쳐 역할·전화·알림을 바꿀 수 있다(쓰기 가로챔)', async ({ page, context }) => {
    const c = await login(context, 'owner')
    const writes = await blockWrites(page)
    await open(page, `/${c}/members`)
    const cards = page.getByTestId('member-card')
    await expect(cards.first()).toBeVisible()
    // 본인이 아닌 구성원을 펼친다
    const other = cards.filter({ hasNot: page.getByText('(나)') }).first()
    await other.click()
    const detail = page.getByTestId('member-detail')
    await expect(detail).toBeVisible()
    await expect(detail.getByTestId('member-role')).toBeEnabled()
    await detail.getByTestId('member-role').selectOption('admin')
    await expect.poll(() => writes.some((w) => (w.body as { role?: string })?.role === 'admin')).toBeTruthy()
    await expectNoHorizontalOverflow(page)
  })

  test('카드 상품·이미지 센터·프로필', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await open(page, `/${c}/cards`)
    await expect(page.getByTestId('card-card').first()).toBeVisible()
    await open(page, `/${c}/images`)
    await expect(page.getByTestId('image-download').first()).toBeVisible()
    await open(page, `/${c}/profile`)
    await expect(page.getByTestId('profile-nickname')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('라이브러리: 모바일은 목록이 먼저, 문서를 열면 본문', async ({ page, context }) => {
    const c = await login(context, 'owner')
    await open(page, `/${c}/library`)
    await expect(page.getByTestId('library-tree-mobile')).toBeVisible()
    const first = page.locator('[data-testid="library-tree"] a').first()
    test.skip((await first.count()) === 0, '문서가 없음')
    await first.click()
    await expect(page).toHaveURL(/\/library\/.+/)
    await expect(page.getByTestId('library-tree-toggle')).toBeVisible()
    await expect(page.locator('.library-doc, article').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe('관리자 콘솔 (모바일)', () => {
  test('관리자는 구성원 메뉴가 없고 주요 페이지가 열린다', async ({ page, context }) => {
    const c = await login(context, 'admin')
    await open(page, `/${c}/dashboard`)
    await expect(page.locator('main')).toBeVisible()
    await page.getByTestId('mobile-menu-open').click()
    const menu = page.getByTestId('mobile-menu')
    await expect(menu.getByTestId('nav-leads')).toBeVisible()
    await expect(menu.getByTestId('nav-members')).toHaveCount(0)
    await page.locator('.bg-overlay').click({ position: { x: 10, y: 300 } })
    await expect(menu).toBeHidden()
    for (const p of ['leads', 'applications', 'rental-products', 'library']) {
      await open(page, `/${c}/${p}`)
      await expectNoHorizontalOverflow(page)
    }
    // 오너 전용 주소는 막힌다
    await page.goto(`/${c}/members`)
    await expect(page).not.toHaveURL(/\/members$/)
  })
})

test.describe('파트너스 콘솔 (모바일)', () => {
  test('홈 요약이 채워지고 내 상담은 카드로 보인다', async ({ page, context }) => {
    const c = await login(context, 'partners')
    await open(page, `/${c}/home`)
    await expect(page.getByText('내 상담 현황')).toBeVisible()
    await expect.poll(async () => (await page.locator('main').innerText()).includes('–건')).toBeFalsy()
    await expectNoHorizontalOverflow(page)
    await open(page, `/${c}/leads`)
    await expect(page.getByTestId('marketer-lead-cards')).toBeVisible()
    await expect(page.locator('table')).toBeHidden()
    await expectNoHorizontalOverflow(page)
  })

  test('상담 링크·라이브러리 갤러리·이미지 센터', async ({ page, context }) => {
    const c = await login(context, 'partners')
    await open(page, `/${c}/link`)
    await expect(page.getByTestId('my-link')).toContainText('/m/')
    await expectNoHorizontalOverflow(page)
    await open(page, `/${c}/library`)
    await expect(page.getByTestId('library-tabs')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await open(page, `/${c}/images`)
    await expect(page.getByTestId('image-download').first()).toBeVisible()
    // 운영 페이지는 파트너스 콘솔로 되돌려진다
    await page.goto(`/owner/leads`)
    await expect(page).toHaveURL(new RegExp(`/${c}/`))
  })
})
