const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urxbdqmrsfzmztkacfiv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGJkcW1yc2Z6bXp0a2FjZml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA3MjYsImV4cCI6MjA5OTAwNjcyNn0.df_Uqx1mWx2DrId5mnm-5jLf6gzT531oV897F7NrkJo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('cards').select('*').ilike('name', '%Mr.Life%');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
