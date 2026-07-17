const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://urxbdqmrsfzmztkacfiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGJkcW1yc2Z6bXp0a2FjZml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA3MjYsImV4cCI6MjA5OTAwNjcyNn0.df_Uqx1mWx2DrId5mnm-5jLf6gzT531oV897F7NrkJo';

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
