import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Attempting anonymous sign in...");
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.log("❌ Anonymous sign in failed:", error.message);
    } else {
      console.log("✅ Anonymous sign in success! Session:", data.session);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
