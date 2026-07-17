const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('./data/cards.json', 'utf8'));

let sql = '';
for (const card of cards) {
  if (card.main_benefits) {
    const jsonStr = JSON.stringify(card.main_benefits).replace(/'/g, "''");
    sql += `UPDATE cards SET main_benefits = '${jsonStr}'::jsonb WHERE id = '${card.id}';\n`;
  }
}
fs.writeFileSync('./update_main_benefits.sql', sql, 'utf8');
console.log('SQL generated. Lines:', sql.split('\n').length - 1);
