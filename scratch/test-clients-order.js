import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying clients with order by created_at...");
  try {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("❌ Select with order error:", error);
    } else {
      console.log("✅ Select with order success! Clients count:", data.length);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
