const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const res = await axios.get('https://www.card-gorilla.com/search/all?keyword=');
    const html = res.data;
    const $ = cheerio.load(html);
    
    // Output all script src
    $('script').each((i, el) => {
      if ($(el).attr('src')) {
        console.log('Script:', $(el).attr('src'));
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
