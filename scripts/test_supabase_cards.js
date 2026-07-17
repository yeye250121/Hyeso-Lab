const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urxbdqmrsfzmztkacfiv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGJkcW1yc2Z6bXp0a2FjZml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA3MjYsImV4cCI6MjA5OTAwNjcyNn0.df_Uqx1mWx2DrId5mnm-5jLf6gzT531oV897F7NrkJo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching from 'cards' table...");
  const { data, error } = await supabase.from('cards').select('*').limit(5);
  if (error) {
    console.error("Error fetching 'cards':", error);
  } else {
    console.log(`Success! Fetched ${data.length} records from 'cards'`);
    if (data.length > 0) {
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}
test();
