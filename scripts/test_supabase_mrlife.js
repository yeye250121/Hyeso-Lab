const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase public environment variables are required.');
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('cards').select('*').ilike('name', '%Mr.Life%');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
