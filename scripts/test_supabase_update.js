const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urxbdqmrsfzmztkacfiv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGJkcW1yc2Z6bXp0a2FjZml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA3MjYsImV4cCI6MjA5OTAwNjcyNn0.df_Uqx1mWx2DrId5mnm-5jLf6gzT531oV897F7NrkJo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const cardsData = JSON.parse(fs.readFileSync('./data/cards.json', 'utf8'));
  const card = cardsData.find(c => c.id === '신한카드-mr-life');
  console.log("Card has main_benefits?", !!card.main_benefits);
  const { error } = await supabase.from('cards').update({ main_benefits: card.main_benefits }).eq('id', card.id);
  console.log("Update error?", error);
}
test();
