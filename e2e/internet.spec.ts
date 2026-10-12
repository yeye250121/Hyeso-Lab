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
