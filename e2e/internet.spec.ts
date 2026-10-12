import { expect, test } from '@playwright/test';

// 인터넷 탭 E2E. 메인(통신사 선택·맞춤 추천) → 통신사 설정기 → 신청 버튼 활성까지.
// 신청서 제출은 다루지 않는다(DB 에 쓰지 않는다).

test.describe('인터넷 메인', () => {
  test('통신사 카드가 있고, 추천 질문 2개에 답하면 통신사별 결과가 요금순으로 뜬다', async ({ page }) => {
    await page.goto('/internet');
    await expect(page.getByTestId('carrier-card-kt')).toBeVisible();

    // 답하기 전엔 결과 없음
    await expect(page.getByTestId('rec-results')).toHaveCount(0);
    await page.getByTestId('rec-household-3-4').click();
    await page.getByTestId('rec-tv-yes').click();

    const results = page.getByTestId('rec-result');
    await expect(results.first()).toBeVisible();
    const fees = await results.evaluateAll((els) =>
      els.map((el) => Number((el.textContent?.match(/월 ([\d,]+)원/) ?? [])[1]?.replace(/,/g, '')))
    );
    expect(fees.length).toBeGreaterThan(1);
    expect([...fees].sort((a, b) => a - b)).toEqual(fees);

    // 결과를 누르면 조건이 미리 선택된 설정기로 간다
    await results.first().click();
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
