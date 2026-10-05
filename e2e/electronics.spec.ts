import { expect, test, type Page } from '@playwright/test';

// 가전렌탈 탭 E2E. 시나리오 번호는 docs/electronics-toss-redesign-plan.md 6절과 같다.

test.describe('1. GNB 탭 · 카테고리 레일', () => {
  test('탭 클릭 이동이 되고, 목록의 카테고리 레일은 가로 스크롤된다', async ({ page }) => {
    await page.goto('/electronics');

    // 탭은 셋만 둔다(렌탈 홈·카테고리·정수기). 카테고리 나열은 목록의 레일이 담당한다
    const tabs = page.getByTestId('gnb-tabs');
    await expect(tabs).toBeVisible();

    await page.getByTestId('gnb-tab-water-purifier').click();
    await expect(page).toHaveURL(/\/electronics\/water-purifier$/);
    await expect(page.getByTestId('gnb-tab-water-purifier')).toHaveAttribute(
      'aria-current',
      'page'
    );

    // 모바일 폭에서 카테고리 레일은 화면보다 길어 가로 스크롤이 생겨야 한다
    const rail = page.getByTestId('subcategory-rail');
    const scrollable = await rail.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);
  });
});

test.describe('2. 상품 카드 → PDP', () => {
  test('카드를 누르면 해당 상품 상세로 간다', async ({ page }) => {
    await page.goto('/electronics/water-purifier');

    const card = page.getByTestId('product-card').first();
    const slug = await card.getAttribute('data-slug');
    expect(slug).toBeTruthy();

    await card.click();
    await expect(page).toHaveURL(new RegExp(`/electronics/water-purifier/${slug}$`));
    await expect(page.getByTestId('pdp-sticky-buy')).toBeVisible();
  });
});

test.describe('3. 스티키바 → 옵션 바텀시트', () => {
  test('신청하기를 누르면 시트가 열리고 딤을 누르면 닫힌다', async ({ page }) => {
    await page.goto('/electronics/water-purifier/kyowon-wells-wp610nwa');

    await expect(page.getByTestId('option-sheet')).toHaveCount(0);
    await page.getByTestId('pdp-sticky-buy').click();
    await expect(page.getByTestId('option-sheet')).toBeVisible();

    // 시트 안에서 조건을 바꾸면 가격이 갱신된다.
    // PlanSelector 는 데스크톱 컬럼(hidden)에도 렌더되므로 시트 내부로 스코프한다.
    const sheet = page.getByTestId('option-sheet');
    await sheet.getByTestId('plan-contract-60').click();
    await expect(sheet).toContainText('5년 약정');

    await page.getByTestId('option-sheet-dim').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('option-sheet')).toHaveCount(0);
  });
});

test.describe('4. 옵션 선택 → 상담 신청(명세서) → 신청서', () => {
  test('상세에서 신청하면 신청서로 가고, 고른 상품을 확인하는 화면이 먼저 나온다', async ({ page }) => {
    await page.goto('/electronics/water-purifier/kyowon-wells-wp610nwa');
    await page.getByTestId('pdp-sticky-buy').click();
    const sheet = page.getByTestId('option-sheet');
    await sheet.getByTestId('plan-contract-60').click();
    await sheet.getByTestId('plan-apply').click();

    await expect(page).toHaveURL(/\/electronics\/application\?product=kyowon-wells-wp610nwa&plan=/);
    const bridge = page.getByTestId('apply-bridge');
    await expect(bridge).toContainText('이 상품으로 신청할게요');
    await expect(bridge).toContainText('미미 정수기');
    await bridge.getByRole('button', { name: '상세보기' }).click();
    await expect(bridge).toContainText('5년 약정');

    await page.getByTestId('apply-bridge-next').click();
    await expect(page.getByTestId('apply-bridge')).toHaveCount(0);
    await expect(page.getByText('원하는 상품을 선택해주세요')).toBeVisible();
  });

  test('간편 신청(/apply)은 상품 정보를 받아 명세서에 담아 제출한다', async ({ page }) => {
    // 운영 DB 에 테스트 신청서를 남기지 않도록 제출만 가로챈다
    let submitted: Record<string, unknown> | null = null;
    await page.route('**/api/leads', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'e2e-mock-id' }),
      });
    });

    await page.goto('/apply?product=kyowon-wells-wp610nwa&months=60');
    await expect(page.getByTestId('lead-service-electronics')).toHaveAttribute('aria-pressed', 'true');
    const selected = page.getByTestId('lead-product-selected');
    await expect(selected).toContainText('미미 정수기');
    await expect(selected).toContainText('5년 약정');
    await expect(page.getByPlaceholder(/계좌번호/)).toHaveCount(0);

    await page.getByTestId('lead-name').fill('E2E테스트');
    await page.getByTestId('lead-phone').fill('01012345678');
    await page.getByText('전체 동의').click();
    await page.getByTestId('lead-submit').click();

    await expect(page.getByRole('heading', { name: '전문가가 오늘 중 연락드려요' })).toBeVisible();
    await expect(page.getByTestId('lead-done-application')).toHaveAttribute(
      'href',
      '/electronics/application?lead=e2e-mock-id'
    );
    expect(submitted).not.toBeNull();
    expect(submitted!.service).toBe('electronics');
    expect(submitted!.phoneNumber).toBe('010-1234-5678');
    expect(submitted!.productSlug).toBe('kyowon-wells-wp610nwa');
    expect(submitted!.contractMonths).toBe(60);
  });

  test('서비스를 고르지 않으면 제출되지 않고, 카드를 고르면 상품 없이 제출된다', async ({ page }) => {
    let submitted: Record<string, unknown> | null = null;
    await page.route('**/api/leads', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'e2e-mock-id' }),
      });
    });

    await page.goto('/apply');
    await page.getByTestId('lead-phone').fill('01012345678');
    await page.getByText('전체 동의').click();
    await page.getByTestId('lead-submit').click();
    await expect(page.getByText('어떤 혜택을 알아볼지 골라주세요.')).toBeVisible();
    expect(submitted).toBeNull();

    await page.getByTestId('lead-service-card').click();
    await page.getByTestId('lead-submit').click();
    await expect(page.getByRole('heading', { name: '전문가가 오늘 중 연락드려요' })).toBeVisible();
    expect(submitted!.service).toBe('card');
    expect(submitted!.productSlug).toBeNull();
    // 카드는 셀프 가입 신청서가 없다
    await expect(page.getByTestId('lead-done-application')).toHaveCount(0);
  });

  test('셀프 가입 신청서(6단계)는 /electronics/application 에서 끝까지 제출된다', async ({ page }) => {
    // 주소 검색은 외부(다음 우편번호) 스크립트라 E2E 에서는 흉내낸다
    await mockDaumPostcode(page);

    let submitted: Record<string, unknown> | null = null;
    await page.route('**/api/electronics/applications', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'e2e-mock-id' }),
      });
    });

    await page.goto('/electronics/application?product=kyowon-wells-wp610nwa&months=60');
    await page.getByTestId('apply-bridge-next').click();
    await expect(page.getByText('미미 정수기').first()).toBeVisible();
    await page.getByRole('button', { name: '사용 중인 제품이 있어요' }).click();
    await page.getByPlaceholder(/사용 중인 브랜드/).fill('코웨이 정수기');
    await next(page);

    // 2단계: 가입자 정보
    await page.getByPlaceholder('가입자명').fill('E2E테스트');
    await page.getByPlaceholder('YYYY-MM-DD').fill('19900101');
    await page.getByRole('button', { name: '남성', exact: true }).click();
    // 성별을 고르면 연락처 칸으로 넘어간다
    await expect(page.getByPlaceholder('010-0000-0000').first()).toBeFocused();
    await page.getByPlaceholder('010-0000-0000').first().fill('01012345678');
    await page.getByPlaceholder('이메일을 입력하세요').fill('e2e@example.com');
    await next(page);

    // 3단계: 설치 주소 (다음 우편번호 목)
    await page.getByTestId('address-search').click();
    await expect(page.getByTestId('address-search')).toContainText('창원시');
    await expect(page.getByTestId('postcode-modal')).toHaveCount(0);
    await expect(page.getByPlaceholder(/동\/호수/)).toBeFocused();
    await page.getByPlaceholder(/동\/호수/).fill('101동 101호');
    await next(page);

    // 4단계: 사은품 수령
    await page.getByTestId('sheet-select-giftReceiver').click();
    await page.getByTestId('sheet-option-본인').click();
    // 수령자를 고르면 은행 시트가 바로 열리고, 은행을 고르면 계좌번호 칸으로 넘어간다
    await page.getByTestId('sheet-option-국민은행').click();
    await expect(page.getByPlaceholder(/계좌번호 입력/)).toBeFocused();
    await page.getByPlaceholder(/계좌번호 입력/).fill('12345678901');
    await next(page);

    // 5단계: 납부 — 사은품 계좌와 동일
    await page.getByRole('button', { name: '은행 자동이체' }).click();
    await page.getByText('사은품 받는 계좌와 동일해요').click();
    await next(page);

    // 6단계: 약관 전체 동의 후 제출
    await page.getByText('전체 동의').click();
    await page.getByRole('button', { name: '제출하기' }).click();

    await expect(page.getByText('신청이 접수되었어요')).toBeVisible();
    expect(submitted).not.toBeNull();
    expect(submitted!.productSlug).toBe('kyowon-wells-wp610nwa');
    expect(submitted!.contractMonths).toBe(60);
    expect(submitted!.applicantName).toBe('E2E테스트');
    expect(submitted!.rentalStatus).toBe('기존');
    expect(submitted!.existingRentalNote).toBe('코웨이 정수기');
  });
});

test.describe('5. 검색', () => {
  test('검색 결과가 나오고, 없는 상품은 안내 문구가 뜬다', async ({ page }) => {
    await page.goto('/electronics/search?q=' + encodeURIComponent('정수기'));
    expect(await page.getByTestId('product-card').count()).toBeGreaterThan(0);

    await page.goto('/electronics/search?q=' + encodeURIComponent('존재하지않는상품xyz'));
    await expect(page.getByText('상품을 찾을 수 없습니다')).toBeVisible();
  });
});

test.describe('6. 찜', () => {
  test('하트 → 뱃지/목록 반영, 새로고침에도 유지된다', async ({ page }) => {
    await page.goto('/electronics/water-purifier');

    await expect(page.getByTestId('gnb-wish-badge')).toHaveCount(0);
    await page.getByTestId('wish-toggle').first().click();
    await expect(page.getByTestId('gnb-wish-badge')).toHaveText('1');
    await expect(page.getByTestId('toast')).toContainText('찜 목록에 담았어요');

    await page.goto('/electronics/wishlist');
    await expect(page.getByTestId('wishlist-items').locator('li')).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId('wishlist-items').locator('li')).toHaveCount(1);
  });
});

test.describe('7. 카테고리 서랍', () => {
  test('사이드바 스크롤 스파이와 원형 카테고리 이동이 동작한다', async ({ page }) => {
    await page.goto('/electronics/category');

    await page.getByTestId('category-side-living').click();
    await expect(page.getByTestId('category-side-living')).toHaveAttribute('aria-current', 'true');

    await page.getByTestId('category-circle-popular-water-purifier').click();
    await expect(page).toHaveURL(/\/electronics\/water-purifier$/);
  });
});

test.describe('8. 마이페이지 서랍', () => {
  test('햄버거 → 우측 서랍, 찜 개수 반영, 딤 클릭으로 닫힌다', async ({ page }) => {
    await page.goto('/electronics/water-purifier/kyowon-wells-wp610nwa');
    await page.getByTestId('wish-toggle').first().click();

    // 상세는 모바일에서 앱형 헤더라 서랍은 목록 화면의 GNB 가 아닌 사이트 Navbar 에 있다
    await page.goto('/');
    await expect(page.getByTestId('mypage-drawer')).toHaveCount(0);
    await page.getByTestId('open-drawer').click();

    const drawer = page.getByTestId('mypage-drawer');
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(drawer.getByRole('dialog')).toBeVisible();
    await expect(drawer.getByTestId('mypage-wish-count')).toHaveText('1');
    // 상세를 봤으니 최근 본 상품에도 남는다
    await expect(drawer.getByText('미미 정수기').first()).toBeVisible();

    await drawer.getByTestId('mypage-dim').click({ position: { x: 10, y: 400 } });
    await expect(page.getByTestId('mypage-drawer')).toHaveCount(0);
  });
});

/* ── 헬퍼 ── */

async function next(page: Page) {
  await page.getByRole('button', { name: '다음' }).click();
}

// 다음 우편번호 위젯을 흉내낸다. 폼이 스크립트를 lazyOnload 로 직접 불러와
// window.daum 을 덮어쓰기 때문에, 전역을 미리 심는 방식은 소용이 없다.
// 스크립트 요청 자체를 가로채 목 구현으로 응답한다 — onLoad 도 정상 발화해
// "주소 찾기" 버튼 활성화 흐름까지 실제와 같아진다.
async function mockDaumPostcode(page: Page) {
  await page.route('**/mapjsapi/bundle/postcode/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `window.daum = window.daum || {};
window.daum.Postcode = function (options) {
  var pick = function () {
    options.oncomplete({
      zonecode: '51234',
      roadAddress: '경상남도 창원시 테스트로 1',
      jibunAddress: '경상남도 창원시 테스트동 1',
    });
  };
  this.open = pick;
  // 폼은 팝업 대신 모달 안에 끼워 넣는다(embed). 목에서는 곧바로 주소를 고른 것으로 친다.
  this.embed = function () { setTimeout(pick, 50); };
};`,
    })
  );
}
