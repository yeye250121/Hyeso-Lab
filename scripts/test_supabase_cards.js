const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase public environment variables are required.');

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
