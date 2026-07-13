import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Attempting sign up with coach@elevate.in...");
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'coach@elevate.in',
      password: 'elevate',
      options: {
        data: {
          full_name: 'Coach Swati',
        }
      }
    });
    if (error) {
      console.log("Sign up failed:", error.message);
    } else {
      console.log("Sign up success!", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
