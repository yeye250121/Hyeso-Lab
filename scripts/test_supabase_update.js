const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase server environment variables are required.');
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const cardsData = JSON.parse(fs.readFileSync('./data/cards.json', 'utf8'));
  const card = cardsData.find(c => c.id === '신한카드-mr-life');
  console.log("Card has main_benefits?", !!card.main_benefits);
  const { error } = await supabase.from('cards').update({ main_benefits: card.main_benefits }).eq('id', card.id);
  console.log("Update error?", error);
}
test();
