const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 카드를 저장할 파일 경로
const OUTPUT_PATH = path.join(__dirname, '../data/cards.json');

(async () => {
  console.log('카드고릴라 스크래핑을 시작합니다...');
  
  // 브라우저 실행 (headless: false 로 하면 진행 상황을 눈으로 볼 수 있습니다)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allCards = [];
  let isSearching = true;

  // API 응답 가로채기
  page.on('response', async response => {
    const url = response.url();
    if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
      // 카드 목록 API
      if (url.includes('/v1/cards/search') || url.includes('/v1/search/card')) {
        try {
          const body = await response.json();
          const items = body.data || body || [];
          for (let item of items) {
            allCards.push({
              id: item.id, // 예: 3
              name: item.name, // 예: 신한카드 Lady
              company: item.corp_name || '카드사',
              card_image_url: item.image_url || '',
              // 이 리스트에서는 상세 혜택이 없으므로 임시 저장
            });
          }
        } catch (e) {}
      }
    }
  });

  // 검색 페이지 이동 (최대 1557개 카드 목록 조회)
  await page.goto('https://www.card-gorilla.com/search/all?keyword=', { waitUntil: 'networkidle' });
  
  // 더보기 버튼을 클릭하거나 스크롤을 내려서 1557개를 다 불러오는 로직이 필요합니다.
  // 이 예제에서는 시연을 위해 검색된 목록까지만 가져옵니다. 
  // 실제로는 버튼을 계속 누르는 로직이 추가되어야 합니다.
  let hasMore = true;
  while(hasMore) {
    try {
      // '더보기' 버튼이 있다면 클릭
      const moreBtn = await page.$('.more-btn'); // 실제 CSS 셀렉터로 변경 필요
      if (moreBtn) {
        await moreBtn.click();
        await page.waitForTimeout(1000);
      } else {
        hasMore = false;
      }
    } catch (e) {
      hasMore = false;
    }
  }

  console.log(`총 ${allCards.length}개의 카드 기본 정보를 수집했습니다. 상세 정보를 수집합니다...`);

  const finalCardsData = [];

  // 각 카드 상세페이지로 이동하여 혜택 추출
  for (let card of allCards) {
    console.log(`[${card.name}] 상세 정보 스크래핑 중...`);
    try {
      await page.goto(`https://www.card-gorilla.com/card/detail/${card.id}`, { waitUntil: 'networkidle' });
      
      // 연회비, 전월실적, 혜택 추출 로직
      // 실제 카드고릴라 상세페이지 DOM에 맞게 작성해야 합니다.
      const benefits = await page.$$eval('.accordion-item', items => {
        return items.map(item => ({
          title: item.querySelector('.title')?.innerText.trim() || '',
          description: item.querySelector('.desc')?.innerText.trim() || ''
        }));
      });

      finalCardsData.push({
        id: card.id,
        name: card.name,
        company: card.company,
        card_image_url: card.card_image_url,
        benefits: benefits,
      });

      // 서버 무리 가지 않게 딜레이
      await page.waitForTimeout(500);
    } catch (e) {
      console.error(`[${card.name}] 스크래핑 실패:`, e.message);
    }
  }

  // 파일 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalCardsData, null, 2), 'utf-8');
  console.log('스크래핑 완료! data/cards.json에 저장되었습니다.');

  await browser.close();
})();
