const fs = require('fs');

const content = fs.readFileSync('.dev/cards-images-url.md', 'utf-8');
const lines = content.split('\n');

const cards = {};
let currentCard = null;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  if (trimmed.startsWith('https://')) {
    if (currentCard) {
      cards[currentCard].push(trimmed);
    }
  } else {
    let name = trimmed;
    let url = '';
    const httpIdx = trimmed.indexOf('https://');
    if (httpIdx !== -1) {
      name = trimmed.substring(0, httpIdx).trim();
      url = trimmed.substring(httpIdx).trim();
    }
    if (name.endsWith(':')) {
      name = name.slice(0, -1).trim();
    }
    currentCard = name;
    cards[name] = [];
    if (url) {
      cards[name].push(url);
    }
  }
}

let sql = '';
for (const [name, urls] of Object.entries(cards)) {
  if (urls.length === 0) continue;
  
  // Single quote escaping for SQL
  const safeName = name.replace(/'/g, "''");
  
  // JSON array for card_image_urls
  const urlsJson = JSON.stringify(urls);
  const safeUrlsJson = urlsJson.replace(/'/g, "''");
  
  // The first URL as card_image_url for fallback
  const firstUrl = urls[0].replace(/'/g, "''");

  sql += `UPDATE cards SET card_image_url = '${firstUrl}', card_image_urls = '${safeUrlsJson}'::jsonb WHERE name = '${safeName}';\n`;
}

fs.writeFileSync('.dev/update_images.sql', sql);
console.log('SQL generated at .dev/update_images.sql');
