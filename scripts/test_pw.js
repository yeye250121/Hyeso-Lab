const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api.card-gorilla.com') || url.includes('search')) {
      if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
        try {
          const body = await response.json();
          console.log(`--- API CALL TO ${url} ---`);
          console.log('Keys:', Object.keys(body));
          if (Array.isArray(body)) console.log(`Length: ${body.length}`);
          if (body.data) console.log(`Data Length: ${body.data.length}`);
          // console.log('Preview:', JSON.stringify(body).slice(0, 300));
        } catch(e) {}
      }
    }
  });

  console.log('Navigating to search page...');
  await page.goto('https://www.card-gorilla.com/search/all?keyword=', { waitUntil: 'networkidle' });
  console.log('Done waiting.');
  
  await browser.close();
})();
