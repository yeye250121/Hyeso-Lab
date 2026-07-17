const axios = require('axios');

(async () => {
  const urls = [
    'https://api.card-gorilla.com:8080/v1/cards/search?keyword=',
    'https://api.card-gorilla.com:8080/v1/search/card?keyword=',
    'https://api.card-gorilla.com:8080/v1/cards?limit=10'
  ];
  
  for (let url of urls) {
    try {
      console.log(`Trying ${url}...`);
      const res = await axios.get(url, {
        headers: {
          'Origin': 'https://www.card-gorilla.com',
          'Referer': 'https://www.card-gorilla.com/'
        }
      });
      console.log(`Success! Data keys:`, Object.keys(res.data));
      if (res.data.length || res.data.data) {
        console.log('Preview:', JSON.stringify(res.data).slice(0, 300));
        break; // Found one that works
      }
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
})();
