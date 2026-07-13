import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test_${Date.now()}@elevate.in`;
  console.log(`Signing up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Member',
        role: 'member'
      }
    }
  });

  if (error) {
    console.error("Signup failed:", error.message);
  } else {
    console.log("Signup success:", data);
  }
}

run();
