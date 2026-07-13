import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying clients as anonymous...");
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error("Select error:", error);
    } else {
      console.log("Select success! Clients count:", data.length);
      if (data.length > 0) {
        console.log("First client:", data[0]);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
