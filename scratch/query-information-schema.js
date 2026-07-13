import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying information_schema.columns...");
  try {
    const { data, error } = await supabase
      .from('columns')
      .select('*')
      .eq('table_name', 'clients');
    if (error) {
      console.log("❌ Error querying columns:", error.message);
    } else {
      console.log("✅ Columns found:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
