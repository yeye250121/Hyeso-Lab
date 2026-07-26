const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase server environment variables are required.');

const supabase = createClient(supabaseUrl, supabaseKey);
const dataFilePath = path.join(__dirname, '../data/cards.json');

async function run() {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const cards = JSON.parse(fileContents);
    
    console.log(`Migrating ${cards.length} cards...`);
    
    const { data, error } = await supabase.from('cards').upsert(cards);
    
    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('Migration successful!');
    }
  } catch (err) {
    console.error('Failed to read cards.json:', err);
  }
}

run();
