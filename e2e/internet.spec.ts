import { expect, test } from '@playwright/test';

// 인터넷 탭 E2E. 메인(통신사 선택·맞춤 추천) → 통신사 설정기 → 신청 버튼 활성까지.
// 신청서 제출은 다루지 않는다(DB 에 쓰지 않는다).

test.describe('인터넷 메인 · 맞춤 추천', () => {
  test('통신사 카드(사업자 제외)가 있고, 추천 카드 → 질문 3개 → 결과가 요금순으로 뜬다', async ({ page }) => {
    await page.goto('/internet');
    await expect(page.getByTestId('carrier-card-kt')).toBeVisible();
    await expect(page.getByTestId('carrier-card-lg-soho')).toHaveCount(0);

    await page.getByTestId('recommend-entry').click();
    await expect(page).toHaveURL(/\/internet\/recommend$/);

    // 선택지를 누르면 바로 다음 질문
    await page.getByTestId('rec-household-3-4').click();
    await page.getByTestId('rec-tv-yes').click();
    await page.getByTestId('rec-pref-any').click();

    await expect(page.getByTestId('rec-result-screen')).toBeVisible();
    const top = page.getByTestId('rec-top');
    await expect(top).toContainText('월');
    const topFee = Number(((await top.textContent())?.match(/월 ([\d,]+)원/) ?? [])[1]?.replace(/,/g, ''));
    const fees = await page.getByTestId('rec-result').evaluateAll((els) =>
      els.map((el) => Number((el.textContent?.match(/월 ([\d,]+)원/) ?? [])[1]?.replace(/,/g, '')))
    );
    expect(fees.length).toBeGreaterThan(0);
    expect([topFee, ...fees]).toEqual([topFee, ...fees].slice().sort((a, b) => a - b));
    await expect(page.getByTestId('rec-apply')).toHaveAttribute('href', /\/internet\/application\?product=/);
    // 사은품은 1순위 카드와 나머지 목록 모두에 보인다
    await expect(page.getByTestId('rec-top-gift')).toContainText('만원');
    await expect(page.getByTestId('rec-gift').first()).toContainText('사은품');

    // 결과를 누르면 조건이 미리 선택된 설정기로 간다
    await top.click();
    await expect(page).toHaveURL(/\/internet\/[a-z-]+\?addon=tv&speed=500M/);
    await expect(page.getByTestId('cfg-summary-inline')).toContainText('월');
  });
});

test.describe('통신사 설정기', () => {
  test('기본 선택값 없이 시작하고, TV 여부 → 속도 → TV 상품을 고르면 신청 버튼이 켜진다', async ({ page }) => {
    await page.goto('/internet/kt');

    // 아무것도 미리 선택되어 있지 않다
    await expect(page.getByTestId('cfg-speed')).toHaveCount(0);
    await expect(page.getByTestId('cfg-apply')).toHaveAttribute('aria-disabled', 'true');

    await page.getByTestId('cfg-addon-tv').click();
    await expect(page.getByTestId('cfg-speed')).toBeVisible();
    await page.getByTestId('cfg-speed-500M').click();
    await expect(page.getByTestId('cfg-name')).toBeVisible();
    await page.getByTestId('cfg-name-option').first().click();

    await expect(page.getByTestId('cfg-apply')).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByTestId('cfg-bar')).toContainText('월 42,900원');
    await expect(page.getByTestId('cfg-apply')).toHaveAttribute('href', /\/internet\/application\?product=/);

    // 인터넷 단독으로 바꾸면 TV 상품 단계가 사라지고 요금이 바뀐다
    await page.getByTestId('cfg-addon-none').click();
    await expect(page.getByTestId('cfg-name')).toHaveCount(0);
    await expect(page.getByTestId('cfg-bar')).toContainText('월 33,000원');
  });

  test('통신사를 바꾸면 고른 조건을 가져간다', async ({ page }) => {
    await page.goto('/internet/kt');
    await page.getByTestId('cfg-addon-none').click();
    await page.getByTestId('cfg-speed-500M').click();
    await page.getByTestId('cfg-carrier-lgu').click();
    await expect(page).toHaveURL(/\/internet\/lgu\?addon=none&speed=500M/);
    await expect(page.getByTestId('cfg-bar')).toContainText('월 33,000원');
  });
});

test.describe('인터넷 신청서', () => {
  test('설정기 → 신청서: 브릿지 → 약관 시트 → 연락처 → 가입정보 → 사은품(나중에) → 납부 → 제출', async ({ page }) => {
    await page.route('**/mapjsapi/bundle/postcode/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `window.daum = window.daum || {};
window.daum.Postcode = function (options) {
  var pick = function () { options.oncomplete({ zonecode: '51234', roadAddress: '경상남도 창원시 테스트로 1', jibunAddress: '경상남도 창원시 테스트동 1' }); };
  this.open = pick; this.embed = function () { setTimeout(pick, 50); };
};`,
      })
    );
    let submitted: Record<string, unknown> | null = null;
    await page.route('**/api/internet/applications', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-mock-id' }) });
    });

    // 설정기에서 KT 500M + TV 베이직을 고르고 신청하기
    await page.goto('/internet/kt');
    await page.getByTestId('cfg-addon-tv').click();
    await page.getByTestId('cfg-speed-500M').click();
    await page.getByTestId('cfg-name-option').first().click();
    await page.getByTestId('cfg-apply').click();
    await expect(page).toHaveURL(/\/internet\/application\?product=/);

    // 브릿지 → 약관 바텀시트 → 동의
    await expect(page.getByTestId('iapply-bridge')).toContainText('KT');
    await page.getByTestId('iapply-bridge-next').click();
    await expect(page.getByTestId('agreement-sheet')).toBeVisible();
    await expect(page.getByTestId('agree-confirm')).toBeDisabled();
    await page.getByTestId('agree-all').check();
    await page.getByTestId('agree-confirm').click();

    // 연락처: 이름 → 통신사 고르면 번호 칸으로 넘어간다
    await page.getByPlaceholder('이름').fill('E2E테스트');
    await page.getByRole('button', { name: 'KT', exact: true }).click();
    await expect(page.getByPlaceholder('010-0000-0000')).toBeFocused();
    await page.getByPlaceholder('010-0000-0000').fill('01012345678');
    await page.getByTestId('iapply-next').click();

    // 가입 정보: 빠진 칸이 있으면 못 넘어간다
    await page.getByTestId('iapply-next').click();
    await expect(page.locator('[data-field-error]').first()).toBeVisible();
    await page.getByRole('button', { name: '쓰고 있어요', exact: true }).click();
    await page.getByRole('button', { name: 'LG U+' }).click();
    await page.getByRole('button', { name: '네', exact: true }).click();
    await page.getByTestId('address-search').click();
    await expect(page.getByText('우편번호 51234')).toBeVisible();
    await page.getByTestId('iapply-next').click();

    // 사은품: 나중에
    await expect(page.getByText('이 조건의 현금 사은품')).toBeVisible();
    await page.getByTestId('iapply-gift-later').click();

    // 납부: 사은품을 건너뛰었으니 계좌를 직접 입력
    await page.getByTestId('sheet-select-paymentBank').click();
    await page.getByTestId('sheet-option-국민은행').click();
    await expect(page.getByPlaceholder('계좌번호 입력')).toBeFocused();
    await page.getByPlaceholder('계좌번호 입력').fill('123456789012');
    await page.getByTestId('iapply-submit').click();

    await expect(page.getByTestId('iapply-done')).toBeVisible();
    expect(submitted).toMatchObject({
      applicantName: 'E2E테스트',
      phoneCarrier: 'KT',
      phoneNumber: '010-1234-5678',
      currentInternet: 'using',
      currentCarrier: 'LG U+',
      hasMobileBundle: true,
      giftSkipped: true,
      paymentSkipped: false,
      paymentBank: '국민은행',
    });
    expect((submitted as Record<string, unknown> | null)?.productId).toBeTruthy();
  });
});
